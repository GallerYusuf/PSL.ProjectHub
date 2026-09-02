using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Domain.Enums;

namespace PSL.ProjectHub.Application.Interfaces;

public interface IProjectService
{
    Task<List<ProjectSummaryDto>> GetAllProjectsAsync(string? search = null, ProjectStatus? status = null, string? category = null, string? technology = null, string? integration = null, string? owner = null, bool? onlyWithLiveUrl = null, string? sortBy = null, bool includeArchived = false, CancellationToken cancellationToken = default);
    Task<ProjectDetailDto?> GetProjectBySlugAsync(string slug, CancellationToken cancellationToken = default);
    Task<ProjectDetailDto?> GetProjectByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<ProjectDetailDto> CreateProjectAsync(CreateProjectRequest request, CancellationToken cancellationToken = default);
    Task<ProjectDetailDto?> UpdateProjectAsync(Guid id, UpdateProjectRequest request, CancellationToken cancellationToken = default);
    Task<bool> ArchiveProjectAsync(Guid id, CancellationToken cancellationToken = default);
    Task<bool> SetVerifiedStatusAsync(Guid id, bool isVerified, CancellationToken cancellationToken = default);
    Task<bool> AddComponentAsync(Guid projectId, ProjectComponentDto component, CancellationToken cancellationToken = default);
    Task<bool> AddIntegrationAsync(Guid projectId, ProjectIntegrationDto integration, CancellationToken cancellationToken = default);
    Task<bool> AddReleaseAsync(Guid projectId, ProjectReleaseDto release, CancellationToken cancellationToken = default);
    Task<bool> AddNoteAsync(Guid projectId, ProjectNoteDto note, CancellationToken cancellationToken = default);
}

public interface IProjectLinkService
{
    Task<List<ProjectLinkDto>> GetLinksByProjectIdAsync(Guid projectId, bool includeInactive = false, CancellationToken cancellationToken = default);
    Task<ProjectLinkDto> CreateLinkAsync(Guid projectId, CreateLinkRequest request, CancellationToken cancellationToken = default);
    Task<ProjectLinkDto?> UpdateLinkAsync(Guid linkId, UpdateLinkRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteOrDeactivateLinkAsync(Guid linkId, bool hardDelete = false, CancellationToken cancellationToken = default);
    Task<bool> SetPrimaryLinkAsync(Guid linkId, CancellationToken cancellationToken = default);
    Task<bool> ReorderLinksAsync(Guid projectId, List<Guid> orderedLinkIds, CancellationToken cancellationToken = default);
}

public interface IDashboardService
{
    Task<DashboardMetricsDto> GetDashboardMetricsAsync(CancellationToken cancellationToken = default);
}

public interface IUrlImportService
{
    Task<UrlImportResultDto> ImportUrlsAsync(List<UrlImportItemDto> items, CancellationToken cancellationToken = default);
    Task<UrlImportResultDto> ImportFromJsonFileAsync(string filePath, CancellationToken cancellationToken = default);
}

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task SeedDefaultUsersAndRolesAsync();
}

// Extensibility Providers (Geleceğe yönelik genişletilebilir altyapı)
public record RepositoryMetadata(string DefaultBranch, string LastCommitSha, string LastCommitMessage, DateTime? LastCommitDate, int OpenIssuesCount, string? LatestReleaseTag);
public record ApplicationHealth(string Status, int? ResponseTimeMs, DateTime CheckedAt, string? Details);
public record DeploymentInfo(string Environment, string? Version, DateTime? LastDeployedAt, string? ServerName, string? AppPoolStatus);

public interface IRepositoryMetadataProvider
{
    Task<RepositoryMetadata?> GetMetadataAsync(string repositoryUrl, CancellationToken cancellationToken = default);
}

public interface IApplicationHealthProvider
{
    Task<ApplicationHealth> CheckHealthAsync(string applicationUrl, CancellationToken cancellationToken = default);
}

public interface IDeploymentInfoProvider
{
    Task<DeploymentInfo?> GetDeploymentInfoAsync(string projectName, string environment, CancellationToken cancellationToken = default);
}
