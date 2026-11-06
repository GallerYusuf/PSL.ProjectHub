using PSL.ProjectHub.Domain.Enums;

namespace PSL.ProjectHub.Domain.Entities;

/// <summary>
/// Kurulumu yapan firmanın kimlik ve marka bilgileri. Tabloda her zaman tek satır (Id = 1) bulunur.
/// Uygulamadaki tüm firma adı, ekip adı, logo ve vurgu rengi buradan beslenir.
/// </summary>
public class OrganizationSettings
{
    public const int SingletonId = 1;

    public int Id { get; set; } = SingletonId;
    public string OrganizationName { get; set; } = string.Empty;
    public string TeamName { get; set; } = "Yazılım Ekibi";
    public string? DirectorName { get; set; }
    public string? DirectorTitle { get; set; }
    public string? Tagline { get; set; }
    public string AccentColor { get; set; } = "#0f4c81";
    public string? LogoFileName { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Projenin iş etkisini ölçen elle girilmiş rakam (ör. "Ayda 120 saat manuel iş kaldırıldı").
/// </summary>
public class ProjectMetric
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public ImpactKind Kind { get; set; } = ImpactKind.TimeSaved;
    public string Label { get; set; } = string.Empty;
    public decimal Value { get; set; }
    /// <summary>Serbest birimli türler (Volume, Other) için birim; sabit birimli türlerde boş kalır.</summary>
    public string? Unit { get; set; }
    public string? Note { get; set; }
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Yazılım ekibinin bir üyesi. Projelere ProjectMember üzerinden rolüyle atanır.
/// </summary>
public class TeamMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string FullName { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Email { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ProjectMember> Projects { get; set; } = new List<ProjectMember>();
}

public class ProjectMember
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public Guid TeamMemberId { get; set; }
    public TeamMember TeamMember { get; set; } = null!;
    /// <summary>Projedeki rolü (ör. Geliştirici, Analist). Serbest metin.</summary>
    public string Role { get; set; } = "Geliştirici";
    /// <summary>Proje sorumlusu mu? Projede en fazla bir lider olur.</summary>
    public bool IsLead { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}

public class Project
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
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
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public bool IsArchived { get; set; } = false;

    // Navigation properties
    public ICollection<ProjectComponent> Components { get; set; } = new List<ProjectComponent>();
    public ICollection<ProjectLink> Links { get; set; } = new List<ProjectLink>();
    public ICollection<ProjectScreenshot> Screenshots { get; set; } = new List<ProjectScreenshot>();
    public ICollection<ProjectIntegration> Integrations { get; set; } = new List<ProjectIntegration>();
    public ICollection<ProjectRelease> Releases { get; set; } = new List<ProjectRelease>();
    public ICollection<ProjectNote> Notes { get; set; } = new List<ProjectNote>();
    public ICollection<ProjectTechnology> ProjectTechnologies { get; set; } = new List<ProjectTechnology>();
}

public class ProjectComponent
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public ComponentType ComponentType { get; set; } = ComponentType.API;
    public string? Description { get; set; }
    public string? Environment { get; set; }
    public int DisplayOrder { get; set; } = 0;

    public ICollection<ProjectLink> Links { get; set; } = new List<ProjectLink>();
}

public class ProjectLink
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public Guid? ProjectComponentId { get; set; }
    public ProjectComponent? ProjectComponent { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public LinkType LinkType { get; set; } = LinkType.Other;
    public EnvironmentType Environment { get; set; } = EnvironmentType.Production;
    public bool IsPrimary { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public bool RequiresVpn { get; set; } = false;
    public bool RequiresAuthentication { get; set; } = false;
    public bool OpenInNewTab { get; set; } = true;
    public int DisplayOrder { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class ProjectScreenshot
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public string FileName { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;
    public string? Caption { get; set; }
    /// <summary>
    /// Projenin birincil/kapak ekran görüntüsü olup olmadığını belirtir.
    /// </summary>
    public bool IsCover { get; set; } = false;
    public int DisplayOrder { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Technology
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public TechnologyCategory Category { get; set; } = TechnologyCategory.Backend;

    public ICollection<ProjectTechnology> ProjectTechnologies { get; set; } = new List<ProjectTechnology>();
}

public class ProjectTechnology
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public Guid TechnologyId { get; set; }
    public Technology Technology { get; set; } = null!;
}

public class ProjectIntegration
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string IntegrationType { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsCritical { get; set; } = false;
}

public class ProjectRelease
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public string Version { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime ReleaseDate { get; set; } = DateTime.UtcNow;
    public string? Environment { get; set; } = "Production";
}

public class ProjectNote
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public NoteType NoteType { get; set; } = NoteType.DevelopmentNote;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Proje ve sistem üzerinde yapılan tüm kritik değişikliklerin (oluşturma, güncelleme,
/// arşivleme, geri yükleme, doğrulama) denetim kaydını tutan varlık.
/// </summary>
public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    // Değişikliğin yapıldığı varlık türü (Örn: Project, ProjectLink, Component)
    public string EntityName { get; set; } = string.Empty;
    
    // İlgili varlığın birincil anahtarı (Id)
    public string EntityId { get; set; } = string.Empty;
    
    // Gerçekleştirilen işlem türü (Create, Update, Archive, Restore, Verify)
    public string Action { get; set; } = string.Empty;
    
    // İşlemi yapan kullanıcının kimlik bilgileri
    public string? UserId { get; set; }
    public string? Username { get; set; }
    
    // Değişikliğe ait özet veya yapılandırılmış JSON detayları
    public string? Details { get; set; }
    
    // İşlemin gerçekleştiği UTC zaman damgası
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
