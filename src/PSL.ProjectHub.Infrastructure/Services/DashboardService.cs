using Microsoft.EntityFrameworkCore;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Application.Interfaces;
using PSL.ProjectHub.Domain.Enums;
using PSL.ProjectHub.Infrastructure.Data;

namespace PSL.ProjectHub.Infrastructure.Services;

public class DashboardService : IDashboardService
{
    private readonly AppDbContext _context;
    private readonly IProjectService _projectService;

    public DashboardService(AppDbContext context, IProjectService projectService)
    {
        _context = context;
        _projectService = projectService;
    }

    public async Task<DashboardMetricsDto> GetDashboardMetricsAsync(CancellationToken cancellationToken = default)
    {
        var total = await _context.Projects.CountAsync(cancellationToken);
        var live = await _context.Projects.CountAsync(p => p.Status == ProjectStatus.Live, cancellationToken);
        var pilot = await _context.Projects.CountAsync(p => p.Status == ProjectStatus.Pilot, cancellationToken);
        var dev = await _context.Projects.CountAsync(p => p.Status == ProjectStatus.Development, cancellationToken);
        var maintenance = await _context.Projects.CountAsync(p => p.Status == ProjectStatus.Maintenance, cancellationToken);
        var pending = await _context.Projects.CountAsync(p => !p.IsVerified, cancellationToken);

        // All summaries to filter quick access and recently updated
        var allProjects = await _projectService.GetAllProjectsAsync(cancellationToken: cancellationToken);

        var quickAccess = allProjects
            .Where(p => p.PrimaryLink != null && p.PrimaryLink.IsActive && !string.IsNullOrWhiteSpace(p.PrimaryLink.Url))
            .OrderBy(p => p.Name)
            .ToList();

        var recentUpdates = allProjects
            .OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
            .Take(5)
            .ToList();

        var recentReleases = await _context.ProjectReleases
            .Include(r => r.Project)
            .OrderByDescending(r => r.ReleaseDate)
            .Take(5)
            .Select(r => new ProjectReleaseDto
            {
                Id = r.Id,
                ProjectId = r.ProjectId,
                Version = r.Version,
                Title = r.Title,
                Description = r.Description,
                ReleaseDate = r.ReleaseDate,
                Environment = r.Environment
            })
            .ToListAsync(cancellationToken);

        var criticalIntegrations = await _context.ProjectIntegrations
            .Include(i => i.Project)
            .Where(i => i.IsCritical)
            .Take(8)
            .Select(i => new ProjectIntegrationDto
            {
                Id = i.Id,
                ProjectId = i.ProjectId,
                Name = i.Name,
                IntegrationType = i.IntegrationType,
                Description = i.Description,
                IsCritical = i.IsCritical
            })
            .ToListAsync(cancellationToken);

        return new DashboardMetricsDto
        {
            TotalProjects = total,
            LiveProjects = live,
            PilotProjects = pilot,
            DevelopmentProjects = dev,
            MaintenanceProjects = maintenance,
            PendingVerificationProjects = pending,
            QuickAccessProjects = quickAccess,
            RecentlyUpdatedProjects = recentUpdates,
            RecentReleases = recentReleases,
            CriticalIntegrations = criticalIntegrations
        };
    }
}
