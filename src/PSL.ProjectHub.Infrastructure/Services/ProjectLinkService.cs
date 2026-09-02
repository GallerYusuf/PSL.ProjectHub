using Microsoft.EntityFrameworkCore;
using PSL.ProjectHub.Application.Common;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Application.Interfaces;
using PSL.ProjectHub.Domain.Entities;
using PSL.ProjectHub.Infrastructure.Data;

namespace PSL.ProjectHub.Infrastructure.Services;

public class ProjectLinkService : IProjectLinkService
{
    private readonly AppDbContext _context;

    public ProjectLinkService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ProjectLinkDto>> GetLinksByProjectIdAsync(Guid projectId, bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var query = _context.ProjectLinks
            .Include(l => l.ProjectComponent)
            .Where(l => l.ProjectId == projectId);

        if (!includeInactive)
        {
            query = query.Where(l => l.IsActive);
        }

        var links = await query.OrderBy(l => l.DisplayOrder).ToListAsync(cancellationToken);
        return links.Select(ProjectService.MapToLinkDto).ToList();
    }

    public async Task<ProjectLinkDto> CreateLinkAsync(Guid projectId, CreateLinkRequest request, CancellationToken cancellationToken = default)
    {
        var (isValid, errorMessage) = UrlValidator.ValidateUrl(request.Url);
        if (!isValid)
        {
            throw new ArgumentException(errorMessage);
        }

        var normalizedUrl = request.Url.Trim();

        // Check for duplicate URL within the same project
        var isDuplicate = await _context.ProjectLinks
            .AnyAsync(l => l.ProjectId == projectId && l.Url.ToLower() == normalizedUrl.ToLower(), cancellationToken);

        if (isDuplicate)
        {
            throw new InvalidOperationException($"Bu URL adresi ('{normalizedUrl}') bu projede zaten kayıtlıdır.");
        }

        var project = await _context.Projects.FindAsync([projectId], cancellationToken);
        if (project == null)
        {
            throw new KeyNotFoundException("Proje bulunamadı.");
        }

        // If this is marked as primary, reset other primary links for this project
        if (request.IsPrimary)
        {
            var existingPrimaries = await _context.ProjectLinks
                .Where(l => l.ProjectId == projectId && l.IsPrimary)
                .ToListAsync(cancellationToken);

            foreach (var p in existingPrimaries)
            {
                p.IsPrimary = false;
            }
        }

        var link = new ProjectLink
        {
            ProjectId = projectId,
            ProjectComponentId = request.ProjectComponentId,
            Label = request.Label.Trim(),
            Url = normalizedUrl,
            LinkType = request.LinkType,
            Environment = request.Environment,
            IsPrimary = request.IsPrimary,
            IsActive = true,
            RequiresVpn = request.RequiresVpn,
            RequiresAuthentication = request.RequiresAuthentication,
            OpenInNewTab = request.OpenInNewTab,
            DisplayOrder = request.DisplayOrder,
            CreatedAt = DateTime.UtcNow
        };

        _context.ProjectLinks.Add(link);
        project.UpdatedAt = DateTime.UtcNow;
        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            throw new InvalidOperationException($"Bu URL adresi ('{normalizedUrl}') bu projede zaten kayıtlıdır.");
        }

        return ProjectService.MapToLinkDto(link);
    }

    public async Task<ProjectLinkDto?> UpdateLinkAsync(Guid linkId, UpdateLinkRequest request, CancellationToken cancellationToken = default)
    {
        var link = await _context.ProjectLinks
            .Include(l => l.ProjectComponent)
            .FirstOrDefaultAsync(l => l.Id == linkId, cancellationToken);

        if (link == null) return null;

        var (isValid, errorMessage) = UrlValidator.ValidateUrl(request.Url);
        if (!isValid)
        {
            throw new ArgumentException(errorMessage);
        }

        var normalizedUrl = request.Url.Trim();

        // Check for duplicate URL in same project under another link id
        var isDuplicate = await _context.ProjectLinks
            .AnyAsync(l => l.ProjectId == link.ProjectId && l.Id != linkId && l.Url.ToLower() == normalizedUrl.ToLower(), cancellationToken);

        if (isDuplicate)
        {
            throw new InvalidOperationException($"Bu URL adresi ('{normalizedUrl}') bu projede zaten başka bir bağlantıda kayıtlıdır.");
        }

        if (request.IsPrimary && !link.IsPrimary)
        {
            var existingPrimaries = await _context.ProjectLinks
                .Where(l => l.ProjectId == link.ProjectId && l.IsPrimary && l.Id != linkId)
                .ToListAsync(cancellationToken);

            foreach (var p in existingPrimaries)
            {
                p.IsPrimary = false;
            }
        }

        link.Label = request.Label.Trim();
        link.Url = normalizedUrl;
        link.LinkType = request.LinkType;
        link.Environment = request.Environment;
        link.IsPrimary = request.IsPrimary;
        link.IsActive = request.IsActive;
        link.RequiresVpn = request.RequiresVpn;
        link.RequiresAuthentication = request.RequiresAuthentication;
        link.OpenInNewTab = request.OpenInNewTab;
        link.DisplayOrder = request.DisplayOrder;
        link.ProjectComponentId = request.ProjectComponentId;
        link.UpdatedAt = DateTime.UtcNow;

        var project = await _context.Projects.FindAsync([link.ProjectId], cancellationToken);
        if (project != null)
        {
            project.UpdatedAt = DateTime.UtcNow;
        }

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            throw new InvalidOperationException($"Bu URL adresi ('{normalizedUrl}') bu projede zaten başka bir bağlantıda kayıtlıdır.");
        }

        return ProjectService.MapToLinkDto(link);
    }

    public async Task<bool> DeleteOrDeactivateLinkAsync(Guid linkId, bool hardDelete = false, CancellationToken cancellationToken = default)
    {
        var link = await _context.ProjectLinks.FindAsync([linkId], cancellationToken);
        if (link == null) return false;

        if (hardDelete)
        {
            _context.ProjectLinks.Remove(link);
        }
        else
        {
            link.IsActive = false;
            link.UpdatedAt = DateTime.UtcNow;
        }

        var project = await _context.Projects.FindAsync([link.ProjectId], cancellationToken);
        if (project != null)
        {
            project.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> SetPrimaryLinkAsync(Guid linkId, CancellationToken cancellationToken = default)
    {
        var link = await _context.ProjectLinks.FindAsync([linkId], cancellationToken);
        if (link == null) return false;

        var allLinks = await _context.ProjectLinks
            .Where(l => l.ProjectId == link.ProjectId)
            .ToListAsync(cancellationToken);

        foreach (var l in allLinks)
        {
            l.IsPrimary = (l.Id == linkId);
        }

        var project = await _context.Projects.FindAsync([link.ProjectId], cancellationToken);
        if (project != null)
        {
            project.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<bool> ReorderLinksAsync(Guid projectId, List<Guid> orderedLinkIds, CancellationToken cancellationToken = default)
    {
        var links = await _context.ProjectLinks
            .Where(l => l.ProjectId == projectId)
            .ToListAsync(cancellationToken);

        for (int i = 0; i < orderedLinkIds.Count; i++)
        {
            var link = links.FirstOrDefault(l => l.Id == orderedLinkIds[i]);
            if (link != null)
            {
                link.DisplayOrder = i + 1;
                link.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
        return true;
    }
}
