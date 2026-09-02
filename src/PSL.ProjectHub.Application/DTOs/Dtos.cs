using System.ComponentModel.DataAnnotations;
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
    [Required(ErrorMessage = "Proje adı zorunludur.")]
    [MaxLength(200, ErrorMessage = "Proje adı en fazla 200 karakter olabilir.")]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200, ErrorMessage = "Proje anahtarı (slug) en fazla 200 karakter olabilir.")]
    public string? Slug { get; set; }

    [Required(ErrorMessage = "Kısa açıklama zorunludur.")]
    [MaxLength(500, ErrorMessage = "Kısa açıklama en fazla 500 karakter olabilir.")]
    public string ShortDescription { get; set; } = string.Empty;

    [MaxLength(2000, ErrorMessage = "İş problemi açıklaması en fazla 2000 karakter olabilir.")]
    public string? BusinessProblem { get; set; }

    [MaxLength(2000, ErrorMessage = "Çözüm açıklaması en fazla 2000 karakter olabilir.")]
    public string? BusinessSolution { get; set; }

    [MaxLength(2000, ErrorMessage = "Şirket değeri açıklaması en fazla 2000 karakter olabilir.")]
    public string? BusinessValue { get; set; }

    [Required(ErrorMessage = "Kategori alanı zorunludur.")]
    [MaxLength(100, ErrorMessage = "Kategori en fazla 100 karakter olabilir.")]
    public string Category { get; set; } = "Genel";

    [Required(ErrorMessage = "Proje durumu zorunludur.")]
    public ProjectStatus Status { get; set; } = ProjectStatus.Development;

    public bool IsVerified { get; set; } = false;

    [MaxLength(150, ErrorMessage = "Sorumlu kişi/ekip adı en fazla 150 karakter olabilir.")]
    public string? OwnerName { get; set; }

    [MaxLength(150, ErrorMessage = "Departman adı en fazla 150 karakter olabilir.")]
    public string? Department { get; set; }

    [MaxLength(250, ErrorMessage = "Hedef kullanıcılar en fazla 250 karakter olabilir.")]
    public string? TargetUsers { get; set; }

    public DateTime? StartDate { get; set; }
    public DateTime? LiveDate { get; set; }

    [MaxLength(50, ErrorMessage = "Sürüm bilgisi en fazla 50 karakter olabilir.")]
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

    [Required(ErrorMessage = "Bağlantı başlığı/etiketi zorunludur.")]
    [MaxLength(150, ErrorMessage = "Bağlantı etiketi en fazla 150 karakter olabilir.")]
    public string Label { get; set; } = string.Empty;

    [Required(ErrorMessage = "URL adresi zorunludur.")]
    [MaxLength(1000, ErrorMessage = "URL adresi en fazla 1000 karakter olabilir.")]
    public string Url { get; set; } = string.Empty;

    [Required(ErrorMessage = "Bağlantı türü zorunludur.")]
    public LinkType LinkType { get; set; } = LinkType.Production;

    [Required(ErrorMessage = "Ortam türü zorunludur.")]
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

    [Required(ErrorMessage = "Bileşen adı zorunludur.")]
    [MaxLength(150, ErrorMessage = "Bileşen adı en fazla 150 karakter olabilir.")]
    public string Name { get; set; } = string.Empty;

    public ComponentType ComponentType { get; set; }
    public string ComponentTypeText => ComponentType.ToString();

    [MaxLength(500, ErrorMessage = "Bileşen açıklaması en fazla 500 karakter olabilir.")]
    public string? Description { get; set; }

    [MaxLength(50, ErrorMessage = "Ortam adı en fazla 50 karakter olabilir.")]
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
    public bool IsCover { get; set; } = false;
    public int DisplayOrder { get; set; }
}

public class UpdateScreenshotRequest
{
    [MaxLength(300, ErrorMessage = "Açıklama en fazla 300 karakter olabilir.")]
    public string? Caption { get; set; }
    public bool IsCover { get; set; } = false;
    public int DisplayOrder { get; set; } = 0;
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
    [Required(ErrorMessage = "Kullanıcı adı veya e-posta alanı zorunludur.")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Şifre alanı zorunludur.")]
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
