using System.ComponentModel.DataAnnotations;
using PSL.ProjectHub.Domain.Enums;

namespace PSL.ProjectHub.Application.DTOs;

public class ProjectMetricDto
{
    public Guid Id { get; set; }
    public Guid ProjectId { get; set; }
    public ImpactKind Kind { get; set; }
    public string Label { get; set; } = string.Empty;
    public decimal Value { get; set; }
    /// <summary>Gösterilecek birim (sabit birimli türlerde türün birimi).</summary>
    public string Unit { get; set; } = string.Empty;
    public string? Note { get; set; }
    public int DisplayOrder { get; set; }
}

public class UpsertProjectMetricRequest
{
    public ImpactKind Kind { get; set; } = ImpactKind.TimeSaved;

    [Required(ErrorMessage = "Metrik açıklaması zorunludur.")]
    [MaxLength(150, ErrorMessage = "Metrik açıklaması en fazla 150 karakter olabilir.")]
    public string Label { get; set; } = string.Empty;

    [Range(0, 999_999_999_999, ErrorMessage = "Değer 0 veya daha büyük olmalıdır.")]
    public decimal Value { get; set; }

    [MaxLength(50, ErrorMessage = "Birim en fazla 50 karakter olabilir.")]
    public string? Unit { get; set; }

    [MaxLength(500, ErrorMessage = "Not en fazla 500 karakter olabilir.")]
    public string? Note { get; set; }

    public int DisplayOrder { get; set; }
}

public class ImpactHighlightDto
{
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string ProjectSlug { get; set; } = string.Empty;
    public ImpactKind Kind { get; set; }
    public string Label { get; set; } = string.Empty;
    public decimal Value { get; set; }
    public string Unit { get; set; } = string.Empty;
}

/// <summary>Portföyün toplam iş etkisi (ana sayfa ve sunum kapağı için).</summary>
public class ImpactSummaryDto
{
    public decimal HoursSavedPerMonth { get; set; }
    public decimal UsersReached { get; set; }
    public decimal CostSavingPerYear { get; set; }
    public int ProjectsWithMetrics { get; set; }
    public List<ImpactHighlightDto> Highlights { get; set; } = new();
}

public class TeamMemberProjectDto
{
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string ProjectSlug { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsLead { get; set; }
}

public class TeamMemberDto
{
    public Guid Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Email { get; set; }
    public bool IsActive { get; set; }
    public List<TeamMemberProjectDto> Projects { get; set; } = new();
}

public class UpsertTeamMemberRequest
{
    [Required(ErrorMessage = "Ad soyad zorunludur.")]
    [MaxLength(150, ErrorMessage = "Ad soyad en fazla 150 karakter olabilir.")]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(150, ErrorMessage = "Unvan en fazla 150 karakter olabilir.")]
    public string? Title { get; set; }

    [MaxLength(200, ErrorMessage = "E-posta en fazla 200 karakter olabilir.")]
    [EmailAddress(ErrorMessage = "E-posta adresi geçersiz.")]
    public string? Email { get; set; }

    public bool IsActive { get; set; } = true;
}

public class ProjectMemberDto
{
    public Guid TeamMemberId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string Role { get; set; } = string.Empty;
    public bool IsLead { get; set; }
}

/// <summary>
/// Projeye ekip üyesi atar. TeamMemberId boşsa NewMemberName ile yeni üye o anda oluşturulur
/// (veri girişini tek adımda bitirmek için).
/// </summary>
public class AssignProjectMemberRequest
{
    public Guid? TeamMemberId { get; set; }

    [MaxLength(150, ErrorMessage = "Ad soyad en fazla 150 karakter olabilir.")]
    public string? NewMemberName { get; set; }

    [MaxLength(150, ErrorMessage = "Unvan en fazla 150 karakter olabilir.")]
    public string? NewMemberTitle { get; set; }

    [Required(ErrorMessage = "Rol zorunludur.")]
    [MaxLength(100, ErrorMessage = "Rol en fazla 100 karakter olabilir.")]
    public string Role { get; set; } = "Geliştirici";

    public bool IsLead { get; set; }
}
