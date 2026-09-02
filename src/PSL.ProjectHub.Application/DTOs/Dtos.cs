using PSL.ProjectHub.Domain.Enums;

namespace PSL.ProjectHub.Application.DTOs;

public class ProjectSummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public ProjectStatus Status { get; set; }
    public string StatusText => Status switch
    {
        ProjectStatus.Development => "Geliştiriliyor",
        ProjectStatus.Pilot => "Pilot",
        ProjectStatus.Live => "Canlı",
        ProjectStatus.Maintenance => "Bakımda",
        ProjectStatus.Archived => "Arşivlendi",
        _ => Status.ToString()
    };
    public bool IsVerified { get; set; }
    public string? OwnerName { get; set; }
    public string? Department { get; set; }
    public DateTime? LiveDate { get; set; }
    public string? CurrentVersion { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsArchived { get; set; }
    public List<string> Technologies { get; set; } = new();
    public ProjectLinkDto? PrimaryLink { get; set; }
    public bool HasVpnLink { get; set; }
    public int ActiveLinksCount { get; set; }
}

public class ProjectDetailDto : ProjectSummaryDto
{
    public string? BusinessProblem { get; set; }
    public string? BusinessSolution { get; set; }
    public string? BusinessValue { get; set; }
    public string? TargetUsers { get; set; }
    public DateTime? StartDate { get; set; }
    public List<ProjectComponentDto> Components { get; set; } = new();
    public List<ProjectLinkDto> Links { get; set; } = new();
    public List<ProjectScreenshotDto> Screenshots { get; set; } = new();
    public List<ProjectIntegrationDto> Integrations { get; set; } = new();
    public List<ProjectReleaseDto> Releases { get; set; } = new();
    public List<ProjectNoteDto> Notes { get; set; } = new();
}

public class CreateProjectRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Slug { get; set; }
    public string ShortDescription { get; set; } = string.Empty;
    public string? BusinessProblem { get; set; }
    public string? BusinessSolution { get; set; }
    public string? BusinessValue { get; set; }
    public string Category { get; set; } = "Genel";
    public ProjectStatus Status { get; set; } = ProjectStatus.Development;
    public bool IsVerified { get; set; } = false;
    public string? OwnerName { get; set; }
    public string? Department { get; set; }
    public string? TargetUsers { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? LiveDate { get; set; }
    public string? CurrentVersion { get; set; }
    public List<string> Technologies { get; set; } = new();
}

public class UpdateProjectRequest : CreateProjectRequest
{
    public bool IsArchived { get; set; }
}

public class ProjectLinkDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public Guid? ProjectComponentId { get; set; }
    public string? ProjectComponentName { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public LinkType LinkType { get; set; }
    public string LinkTypeText => LinkType.ToString();
    public EnvironmentType Environment { get; set; }
    public string EnvironmentText => Environment.ToString();
    public bool IsPrimary { get; set; }
    public bool IsActive { get; set; }
    public bool RequiresVpn { get; set; }
    public bool RequiresAuthentication { get; set; }
    public bool OpenInNewTab { get; set; }
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateLinkRequest
{
    public Guid? ProjectComponentId { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public LinkType LinkType { get; set; } = LinkType.Production;
    public EnvironmentType Environment { get; set; } = EnvironmentType.Production;
    public bool IsPrimary { get; set; } = false;
    public bool RequiresVpn { get; set; } = false;
    public bool RequiresAuthentication { get; set; } = false;
    public bool OpenInNewTab { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;
}

public class UpdateLinkRequest : CreateLinkRequest
{
    public bool IsActive { get; set; } = true;
}

public class ProjectComponentDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public ComponentType ComponentType { get; set; }
    public string ComponentTypeText => ComponentType.ToString();
    public string? Description { get; set; }
    public string? Environment { get; set; }
    public int DisplayOrder { get; set; }
}

public class ProjectScreenshotDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string? Caption { get; set; }
    public int DisplayOrder { get; set; }
}

public class ProjectIntegrationDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string IntegrationType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsCritical { get; set; }
}

public class ProjectReleaseDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Version { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime ReleaseDate { get; set; }
    public string? Environment { get; set; }
}

public class ProjectNoteDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public NoteType NoteType { get; set; }
    public string NoteTypeText => NoteType switch
    {
        NoteType.KnownIssue => "Bilinen Sorun",
        NoteType.DevelopmentNote => "Geliştirme Notu",
        NoteType.Decision => "Teknik Karar",
        NoteType.FuturePlan => "Gelecek Planı",
        _ => NoteType.ToString()
    };
    public DateTime CreatedAt { get; set; }
}

public class DashboardMetricsDto
{
    public int TotalProjects { get; set; }
    public int LiveProjects { get; set; }
    public int PilotProjects { get; set; }
    public int DevelopmentProjects { get; set; }
    public int MaintenanceProjects { get; set; }
    public int PendingVerificationProjects { get; set; }
    public List<ProjectSummaryDto> QuickAccessProjects { get; set; } = new();
    public List<ProjectSummaryDto> RecentlyUpdatedProjects { get; set; } = new();
    public List<ProjectReleaseDto> RecentReleases { get; set; } = new();
    public List<ProjectIntegrationDto> CriticalIntegrations { get; set; } = new();
}

public class UrlImportLinkDto
{
    public string Label { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public string LinkType { get; set; } = "Production";
    public string Environment { get; set; } = "Production";
    public bool IsPrimary { get; set; } = false;
    public bool RequiresVpn { get; set; } = false;
    public bool RequiresAuthentication { get; set; } = false;
    public bool OpenInNewTab { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;
}

public class UrlImportItemDto
{
    public string ProjectKey { get; set; } = string.Empty;
    public List<UrlImportLinkDto> Links { get; set; } = new();
}

public class UrlImportResultDto
{
    public int TotalProjectsProcessed { get; set; }
    public int TotalLinksAdded { get; set; }
    public int TotalLinksUpdated { get; set; }
    public int TotalLinksSkipped { get; set; }
    public List<string> Messages { get; set; } = new();
}

public class LoginRequest
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public List<string> Roles { get; set; } = new();
    public DateTime ExpiresAt { get; set; }
}
