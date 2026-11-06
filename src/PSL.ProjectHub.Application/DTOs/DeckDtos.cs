using System.ComponentModel.DataAnnotations;
using PSL.ProjectHub.Domain.Enums;

namespace PSL.ProjectHub.Application.DTOs;

/// <summary>Sunumda gösterilen tek bir proje: iş hikâyesi, etki, ekip ve görseller.</summary>
public class DeckProjectDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string ShortDescription { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public ProjectStatus Status { get; set; }
    public string? BusinessProblem { get; set; }
    public string? BusinessSolution { get; set; }
    public string? BusinessValue { get; set; }
    public string? TargetUsers { get; set; }
    public string? OwnerName { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? LiveDate { get; set; }
    public List<string> Technologies { get; set; } = new();
    public List<ProjectMetricDto> Metrics { get; set; } = new();
    public List<ProjectMemberDto> Team { get; set; } = new();
    /// <summary>Görsel adresleri (kapak önce). Paylaşım linkinde anahtar içeren herkese açık adreslerdir.</summary>
    public List<string> ImageUrls { get; set; } = new();
    /// <summary>Canlı uygulama adresi. Paylaşım linkinde yalnızca VPN gerektirmeyen canlı adres verilir.</summary>
    public string? LiveUrl { get; set; }
}

public class DeckStatusCountsDto
{
    public int Live { get; set; }
    public int Pilot { get; set; }
    public int Development { get; set; }
    public int Maintenance { get; set; }
}

public class DeckTimelineSummaryDto
{
    public int Year { get; set; }
    public int ProjectsStarted { get; set; }
    public int ProjectsWentLive { get; set; }
    public int Releases { get; set; }
}

/// <summary>Sunum ve paylaşım linkinin tamamı: kapak, etki, portföy, projeler, yıl özeti.</summary>
public class DeckDto
{
    public string? Title { get; set; }
    public OrganizationSettingsDto Branding { get; set; } = new();
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public ImpactSummaryDto Impact { get; set; } = new();
    public DeckStatusCountsDto StatusCounts { get; set; } = new();
    public DeckTimelineSummaryDto Timeline { get; set; } = new();
    public List<DeckProjectDto> Projects { get; set; } = new();
    /// <summary>Yalnızca paylaşım linkinde: linkin bitiş zamanı.</summary>
    public DateTime? ExpiresAt { get; set; }
}

public class CreateShareLinkRequest
{
    [Required(ErrorMessage = "Başlık zorunludur.")]
    [MaxLength(200, ErrorMessage = "Başlık en fazla 200 karakter olabilir.")]
    public string Title { get; set; } = string.Empty;

    [MinLength(1, ErrorMessage = "En az bir proje seçin.")]
    public List<Guid> ProjectIds { get; set; } = new();

    [Range(1, 365, ErrorMessage = "Geçerlilik 1 ile 365 gün arasında olmalıdır.")]
    public int ExpiresInDays { get; set; } = 30;
}

public class ShareLinkDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int ProjectCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsActive { get; set; }
    public DateTime? RevokedAt { get; set; }
    public int ViewCount { get; set; }
    public DateTime? LastViewedAt { get; set; }
}

/// <summary>Link oluşturulduğunda bir kez dönen yanıt; anahtar sonradan tekrar gösterilemez.</summary>
public class CreatedShareLinkDto : ShareLinkDto
{
    public string Token { get; set; } = string.Empty;
}
