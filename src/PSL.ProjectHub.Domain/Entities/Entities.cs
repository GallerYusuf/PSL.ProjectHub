using PSL.ProjectHub.Domain.Enums;

namespace PSL.ProjectHub.Domain.Entities;

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
