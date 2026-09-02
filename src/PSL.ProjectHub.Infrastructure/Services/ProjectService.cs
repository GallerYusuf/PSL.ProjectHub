using Microsoft.EntityFrameworkCore;
using PSL.ProjectHub.Application.Common;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Application.Interfaces;
using PSL.ProjectHub.Domain.Entities;
using PSL.ProjectHub.Domain.Enums;
using PSL.ProjectHub.Infrastructure.Data;

namespace PSL.ProjectHub.Infrastructure.Services;

public class ProjectService : IProjectService
{
    private readonly AppDbContext _context;

    public ProjectService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProjectSummaryDto>> GetAllProjectsAsync(
        string? search = null,
        ProjectStatus? status = null,
        string? category = null,
        string? technology = null,
        string? integration = null,
        string? owner = null,
        bool? onlyWithLiveUrl = null,
        string? sortBy = null,
        bool includeArchived = false,
        CancellationToken cancellationToken = default)
    {
        var query = includeArchived
            ? _context.Projects.IgnoreQueryFilters().AsQueryable()
            : _context.Projects.AsQueryable();

        if (!includeArchived)
        {
            query = query.Where(p => !p.IsArchived);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(s) ||
                                     p.ShortDescription.ToLower().Contains(s) ||
                                     (p.OwnerName != null && p.OwnerName.ToLower().Contains(s)));
        }

        if (status.HasValue)
        {
            query = query.Where(p => p.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(category))
        {
            query = query.Where(p => p.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(owner))
        {
            query = query.Where(p => p.OwnerName != null && p.OwnerName.ToLower().Contains(owner.Trim().ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(technology))
        {
            query = query.Where(p => p.ProjectTechnologies.Any(pt => pt.Technology.Name == technology));
        }

        if (!string.IsNullOrWhiteSpace(integration))
        {
            query = query.Where(p => p.Integrations.Any(i => i.Name == integration || i.IntegrationType == integration));
        }

        if (onlyWithLiveUrl == true)
        {
            query = query.Where(p => p.Links.Any(l => l.IsActive && l.LinkType == LinkType.Production));
        }

        // Sorting
        query = sortBy?.ToLower() switch
        {
            "name" => query.OrderBy(p => p.Name),
            "name_desc" => query.OrderByDescending(p => p.Name),
            "created" => query.OrderBy(p => p.CreatedAt),
            "created_desc" => query.OrderByDescending(p => p.CreatedAt),
            "status" => query.OrderBy(p => p.Status),
            _ => query.OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
        };

        var projects = await query
            .Include(p => p.Links.Where(l => l.IsActive))
            .Include(p => p.ProjectTechnologies)
                .ThenInclude(pt => pt.Technology)
            .ToListAsync(cancellationToken);

        return projects.Select(MapToSummaryDto).ToList();
    }

    public async Task<ProjectDetailDto?> GetProjectBySlugAsync(string slug, CancellationToken cancellationToken = default)
    {
        var project = await _context.Projects
            .Include(p => p.Components)
            .Include(p => p.Links)
            .Include(p => p.Screenshots)
            .Include(p => p.Integrations)
            .Include(p => p.Releases)
            .Include(p => p.Notes)
            .Include(p => p.ProjectTechnologies)
                .ThenInclude(pt => pt.Technology)
            .FirstOrDefaultAsync(p => p.Slug == slug, cancellationToken);

        return project == null ? null : MapToDetailDto(project);
    }

    public async Task<ProjectDetailDto?> GetProjectByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var project = await _context.Projects
            .Include(p => p.Components)
            .Include(p => p.Links)
            .Include(p => p.Screenshots)
            .Include(p => p.Integrations)
            .Include(p => p.Releases)
            .Include(p => p.Notes)
            .Include(p => p.ProjectTechnologies)
                .ThenInclude(pt => pt.Technology)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        return project == null ? null : MapToDetailDto(project);
    }

    public async Task<ProjectDetailDto> CreateProjectAsync(CreateProjectRequest request, CancellationToken cancellationToken = default)
    {
        var slug = string.IsNullOrWhiteSpace(request.Slug)
            ? UrlValidator.NormalizeSlug(request.Name)
            : UrlValidator.NormalizeSlug(request.Slug);

        // Ensure unique slug
        var originalSlug = slug;
        var counter = 1;
        while (await _context.Projects.IgnoreQueryFilters().AnyAsync(p => p.Slug == slug, cancellationToken))
        {
            slug = $"{originalSlug}-{counter++}";
        }

        var project = new Project
        {
            Name = request.Name.Trim(),
            Slug = slug,
            ShortDescription = request.ShortDescription.Trim(),
            BusinessProblem = request.BusinessProblem?.Trim(),
            BusinessSolution = request.BusinessSolution?.Trim(),
            BusinessValue = request.BusinessValue?.Trim(),
            Category = string.IsNullOrWhiteSpace(request.Category) ? "Genel" : request.Category.Trim(),
            Status = request.Status,
            IsVerified = request.IsVerified,
            OwnerName = request.OwnerName?.Trim(),
            Department = request.Department?.Trim(),
            TargetUsers = request.TargetUsers?.Trim(),
            StartDate = request.StartDate,
            LiveDate = request.LiveDate,
            CurrentVersion = request.CurrentVersion?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        if (request.Technologies != null && request.Technologies.Any())
        {
            foreach (var techName in request.Technologies)
            {
                var tech = await _context.Technologies.FirstOrDefaultAsync(t => t.Name == techName, cancellationToken);
                if (tech == null)
                {
                    tech = new Technology { Name = techName, Category = TechnologyCategory.Backend };
                    _context.Technologies.Add(tech);
                    await _context.SaveChangesAsync(cancellationToken);
                }
                project.ProjectTechnologies.Add(new ProjectTechnology { ProjectId = project.Id, TechnologyId = tech.Id });
            }
        }

        _context.Projects.Add(project);
        await _context.SaveChangesAsync(cancellationToken);

        return MapToDetailDto(project);
    }

    public async Task<ProjectDetailDto?> UpdateProjectAsync(Guid id, UpdateProjectRequest request, CancellationToken cancellationToken = default)
    {
        var project = await _context.Projects
            .Include(p => p.ProjectTechnologies)
            .Include(p => p.Components)
            .Include(p => p.Links)
            .Include(p => p.Screenshots)
            .Include(p => p.Integrations)
            .Include(p => p.Releases)
            .Include(p => p.Notes)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (project == null) return null;

        project.Name = request.Name.Trim();
        project.ShortDescription = request.ShortDescription.Trim();
        project.BusinessProblem = request.BusinessProblem?.Trim();
        project.BusinessSolution = request.BusinessSolution?.Trim();
        project.BusinessValue = request.BusinessValue?.Trim();
        project.Category = string.IsNullOrWhiteSpace(request.Category) ? "Genel" : request.Category.Trim();
        project.Status = request.Status;
        project.IsVerified = request.IsVerified;
        project.OwnerName = request.OwnerName?.Trim();
        project.Department = request.Department?.Trim();
        project.TargetUsers = request.TargetUsers?.Trim();
        project.StartDate = request.StartDate;
        project.LiveDate = request.LiveDate;
        project.CurrentVersion = request.CurrentVersion?.Trim();
        project.IsArchived = request.IsArchived;
        project.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(request.Slug))
        {
            var cleanSlug = UrlValidator.NormalizeSlug(request.Slug);
            var exists = await _context.Projects.IgnoreQueryFilters()
                .AnyAsync(p => p.Slug == cleanSlug && p.Id != id, cancellationToken);
            if (!exists)
            {
                project.Slug = cleanSlug;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return MapToDetailDto(project);
    }

    public async Task<bool> ArchiveProjectAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var project = await _context.Projects.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (project == null) return false;

        project.IsArchived = true;
        project.Status = ProjectStatus.Archived;
        project.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> SetVerifiedStatusAsync(Guid id, bool isVerified, CancellationToken cancellationToken = default)
    {
        var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (project == null) return false;

        project.IsVerified = isVerified;
        project.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> AddComponentAsync(Guid projectId, ProjectComponentDto component, CancellationToken cancellationToken = default)
    {
        var project = await _context.Projects.FindAsync([projectId], cancellationToken);
        if (project == null) return false;

        _context.ProjectComponents.Add(new ProjectComponent
        {
            ProjectId = projectId,
            Name = component.Name,
            ComponentType = component.ComponentType,
            Description = component.Description,
            Environment = component.Environment,
            DisplayOrder = component.DisplayOrder
        });

        project.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> AddIntegrationAsync(Guid projectId, ProjectIntegrationDto integration, CancellationToken cancellationToken = default)
    {
        var project = await _context.Projects.FindAsync([projectId], cancellationToken);
        if (project == null) return false;

        _context.ProjectIntegrations.Add(new ProjectIntegration
        {
            ProjectId = projectId,
            Name = integration.Name,
            IntegrationType = integration.IntegrationType,
            Description = integration.Description,
            IsCritical = integration.IsCritical
        });

        project.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> AddReleaseAsync(Guid projectId, ProjectReleaseDto release, CancellationToken cancellationToken = default)
    {
        var project = await _context.Projects.FindAsync([projectId], cancellationToken);
        if (project == null) return false;

        _context.ProjectReleases.Add(new ProjectRelease
        {
            ProjectId = projectId,
            Version = release.Version,
            Title = release.Title,
            Description = release.Description,
            ReleaseDate = release.ReleaseDate,
            Environment = release.Environment
        });

        project.CurrentVersion = release.Version;
        project.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> AddNoteAsync(Guid projectId, ProjectNoteDto note, CancellationToken cancellationToken = default)
    {
        var project = await _context.Projects.FindAsync([projectId], cancellationToken);
        if (project == null) return false;

        _context.ProjectNotes.Add(new ProjectNote
        {
            ProjectId = projectId,
            Title = note.Title,
            Content = note.Content,
            NoteType = note.NoteType,
            CreatedAt = DateTime.UtcNow
        });

        project.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    private static ProjectSummaryDto MapToSummaryDto(Project p)
    {
        var activeLinks = p.Links.Where(l => l.IsActive).OrderBy(l => l.DisplayOrder).ToList();
        var primary = activeLinks.FirstOrDefault(l => l.IsPrimary) ??
                      activeLinks.FirstOrDefault(l => l.LinkType == LinkType.Production) ??
                      activeLinks.FirstOrDefault();

        return new ProjectSummaryDto
        {
            Id = p.Id,
            Name = p.Name,
            Slug = p.Slug,
            ShortDescription = p.ShortDescription,
            Category = p.Category,
            Status = p.Status,
            IsVerified = p.IsVerified,
            OwnerName = p.OwnerName,
            Department = p.Department,
            LiveDate = p.LiveDate,
            CurrentVersion = p.CurrentVersion,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
            IsArchived = p.IsArchived,
            Technologies = p.ProjectTechnologies.Select(pt => pt.Technology.Name).ToList(),
            PrimaryLink = primary == null ? null : MapToLinkDto(primary),
            HasVpnLink = activeLinks.Any(l => l.RequiresVpn),
            ActiveLinksCount = activeLinks.Count
        };
    }

    private static ProjectDetailDto MapToDetailDto(Project p)
    {
        var summary = MapToSummaryDto(p);
        return new ProjectDetailDto
        {
            Id = p.Id,
            Name = p.Name,
            Slug = p.Slug,
            ShortDescription = p.ShortDescription,
            BusinessProblem = p.BusinessProblem,
            BusinessSolution = p.BusinessSolution,
            BusinessValue = p.BusinessValue,
            Category = p.Category,
            Status = p.Status,
            IsVerified = p.IsVerified,
            OwnerName = p.OwnerName,
            Department = p.Department,
            TargetUsers = p.TargetUsers,
            StartDate = p.StartDate,
            LiveDate = p.LiveDate,
            CurrentVersion = p.CurrentVersion,
            CreatedAt = p.CreatedAt,
            UpdatedAt = p.UpdatedAt,
            IsArchived = p.IsArchived,
            Technologies = p.ProjectTechnologies.Select(pt => pt.Technology.Name).ToList(),
            PrimaryLink = summary.PrimaryLink,
            HasVpnLink = summary.HasVpnLink,
            ActiveLinksCount = summary.ActiveLinksCount,
            Components = p.Components.OrderBy(c => c.DisplayOrder).Select(c => new ProjectComponentDto
            {
                Id = c.Id,
                ProjectId = c.ProjectId,
                Name = c.Name,
                ComponentType = c.ComponentType,
                Description = c.Description,
                Environment = c.Environment,
                DisplayOrder = c.DisplayOrder
            }).ToList(),
            Links = p.Links.OrderBy(l => l.DisplayOrder).Select(MapToLinkDto).ToList(),
            Screenshots = p.Screenshots.OrderBy(s => s.DisplayOrder).Select(s => new ProjectScreenshotDto
            {
                Id = s.Id,
                ProjectId = s.ProjectId,
                FileName = s.FileName,
                FilePath = s.FilePath,
                Caption = s.Caption,
                DisplayOrder = s.DisplayOrder
            }).ToList(),
            Integrations = p.Integrations.Select(i => new ProjectIntegrationDto
            {
                Id = i.Id,
                ProjectId = i.ProjectId,
                Name = i.Name,
                IntegrationType = i.IntegrationType,
                Description = i.Description,
                IsCritical = i.IsCritical
            }).ToList(),
            Releases = p.Releases.OrderByDescending(r => r.ReleaseDate).Select(r => new ProjectReleaseDto
            {
                Id = r.Id,
                ProjectId = r.ProjectId,
                Version = r.Version,
                Title = r.Title,
                Description = r.Description,
                ReleaseDate = r.ReleaseDate,
                Environment = r.Environment
            }).ToList(),
            Notes = p.Notes.OrderByDescending(n => n.CreatedAt).Select(n => new ProjectNoteDto
            {
                Id = n.Id,
                ProjectId = n.ProjectId,
                Title = n.Title,
                Content = n.Content,
                NoteType = n.NoteType,
                CreatedAt = n.CreatedAt
            }).ToList()
        };
    }

    public static ProjectLinkDto MapToLinkDto(ProjectLink l) => new()
    {
        Id = l.Id,
        ProjectId = l.ProjectId,
        ProjectComponentId = l.ProjectComponentId,
        ProjectComponentName = l.ProjectComponent?.Name,
        Label = l.Label,
        Url = l.Url,
        LinkType = l.LinkType,
        Environment = l.Environment,
        IsPrimary = l.IsPrimary,
        IsActive = l.IsActive,
        RequiresVpn = l.RequiresVpn,
        RequiresAuthentication = l.RequiresAuthentication,
        OpenInNewTab = l.OpenInNewTab,
        DisplayOrder = l.DisplayOrder,
        CreatedAt = l.CreatedAt,
        UpdatedAt = l.UpdatedAt
    };
}
