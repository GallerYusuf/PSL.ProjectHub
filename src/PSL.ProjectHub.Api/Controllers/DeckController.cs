using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Application.Interfaces;
using PSL.ProjectHub.Domain.Entities;
using PSL.ProjectHub.Domain.Enums;
using PSL.ProjectHub.Infrastructure.Data;

namespace PSL.ProjectHub.Api.Controllers;

/// <summary>
/// Sunum (deck) verisini üretir. Uygulama içi sunum ve herkese açık paylaşım linki aynı yapıyı kullanır;
/// paylaşım görünümünde iç ağ adresleri ve dahili bağlantılar çıkarılır.
/// </summary>
public static class DeckBuilder
{
    private static readonly Dictionary<ProjectStatus, int> StatusOrder = new()
    {
        [ProjectStatus.Live] = 0, [ProjectStatus.Pilot] = 1, [ProjectStatus.Maintenance] = 2,
        [ProjectStatus.Development] = 3, [ProjectStatus.Archived] = 4
    };

    public static async Task<DeckDto> BuildAsync(
        AppDbContext context,
        IReadOnlyCollection<Guid>? projectIds,
        Func<Guid, string> imageUrl,
        bool publicView,
        CancellationToken ct)
    {
        var query = context.Projects
            .Include(p => p.ProjectTechnologies).ThenInclude(pt => pt.Technology)
            .Include(p => p.Links)
            .Include(p => p.Screenshots)
            .Include(p => p.Releases)
            .AsNoTracking()
            .Where(p => p.Status != ProjectStatus.Archived);
        if (projectIds is { Count: > 0 })
            query = query.Where(p => projectIds.Contains(p.Id));

        var projects = await query.ToListAsync(ct);
        var ids = projects.Select(p => p.Id).ToList();

        var metrics = await context.ProjectMetrics.Include(m => m.Project).AsNoTracking()
            .Where(m => ids.Contains(m.ProjectId)).ToListAsync(ct);
        var members = await context.ProjectMembers.Include(m => m.TeamMember).AsNoTracking()
            .Where(m => ids.Contains(m.ProjectId)).ToListAsync(ct);
        var settings = await SettingsController.GetOrCreateAsync(context, ct);

        return new DeckDto
        {
            Branding = SettingsController.ToDto(settings),
            Impact = ImpactController.ComputeSummary(metrics),
            StatusCounts = new DeckStatusCountsDto
            {
                Live = projects.Count(p => p.Status == ProjectStatus.Live),
                Pilot = projects.Count(p => p.Status == ProjectStatus.Pilot),
                Development = projects.Count(p => p.Status == ProjectStatus.Development),
                Maintenance = projects.Count(p => p.Status == ProjectStatus.Maintenance),
            },
            Timeline = ToTimelineSummary(TimelineController.Build(projects, DateTime.UtcNow.Year)),
            Projects = projects
                .OrderBy(p => StatusOrder[p.Status])
                .ThenByDescending(p => p.LiveDate ?? p.StartDate ?? p.CreatedAt)
                .Select(p => new DeckProjectDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Slug = p.Slug,
                    ShortDescription = p.ShortDescription,
                    Category = p.Category,
                    Status = p.Status,
                    BusinessProblem = p.BusinessProblem,
                    BusinessSolution = p.BusinessSolution,
                    BusinessValue = p.BusinessValue,
                    TargetUsers = p.TargetUsers,
                    OwnerName = p.OwnerName,
                    StartDate = p.StartDate,
                    LiveDate = p.LiveDate,
                    Technologies = p.ProjectTechnologies.Select(t => t.Technology.Name).OrderBy(n => n).ToList(),
                    Metrics = metrics.Where(m => m.ProjectId == p.Id).OrderBy(m => m.DisplayOrder)
                        .Select(ImpactController.ToDto).ToList(),
                    Team = members.Where(m => m.ProjectId == p.Id)
                        .OrderByDescending(m => m.IsLead).ThenBy(m => m.TeamMember.FullName)
                        .Select(TeamController.ToDto).ToList(),
                    ImageUrls = p.Screenshots.OrderByDescending(s => s.IsCover).ThenBy(s => s.DisplayOrder)
                        .Take(3).Select(s => imageUrl(s.Id)).ToList(),
                    LiveUrl = SelectLiveUrl(p.Links, publicView)
                })
                .ToList()
        };
    }

    /// <summary>
    /// Sunumda gösterilecek canlı adres. Paylaşım görünümünde yalnızca VPN gerektirmeyen, aktif,
    /// canlı ortam uygulama adresi verilir; admin/swagger/repo gibi dahili adresler asla paylaşılmaz.
    /// </summary>
    public static string? SelectLiveUrl(IEnumerable<ProjectLink> links, bool publicView)
    {
        // "Uygulamayı Aç" yalnızca kullanıcıya açık ekranlara gider; repo, API, swagger, doküman ve izleme adresleri hariç
        var candidates = links.Where(l => l.IsActive && l.LinkType is LinkType.Production or LinkType.AdminPanel);
        if (publicView)
            candidates = candidates.Where(l =>
                !l.RequiresVpn &&
                l.LinkType == LinkType.Production &&
                l.Environment is EnvironmentType.Production or EnvironmentType.External);

        return candidates
            .OrderByDescending(l => l.IsPrimary)
            .ThenBy(l => l.LinkType == LinkType.Production ? 0 : 1)
            .ThenBy(l => l.DisplayOrder)
            .Select(l => l.Url)
            .FirstOrDefault();
    }

    private static DeckTimelineSummaryDto ToTimelineSummary(TimelineDto t) => new()
    {
        Year = t.Year ?? DateTime.UtcNow.Year,
        ProjectsStarted = t.Summary.ProjectsStarted,
        ProjectsWentLive = t.Summary.ProjectsWentLive,
        Releases = t.Summary.Releases
    };
}

/// <summary>Oturum açmış kullanıcılar için sunum verisi.</summary>
[ApiController]
[Authorize]
public class DeckController : ControllerBase
{
    private readonly AppDbContext _context;
    public DeckController(AppDbContext context) => _context = context;

    /// <summary>Sunum verisi. projectIds verilmezse arşivlenmemiş tüm projeler.</summary>
    [HttpGet("api/deck")]
    public async Task<ActionResult<DeckDto>> Get([FromQuery] List<Guid>? projectIds, CancellationToken ct)
    {
        var deck = await DeckBuilder.BuildAsync(_context, projectIds, id => $"/api/screenshots/{id}/file", publicView: false, ct);
        return Ok(deck);
    }
}

/// <summary>
/// Süreli, salt okunur paylaşım linkleri. Yönetim uçları Admin'e, görüntüleme uçları herkese açıktır.
/// </summary>
[ApiController]
public class ShareController : ControllerBase
{
    public const string RateLimitPolicy = "PublicShare";

    private readonly AppDbContext _context;
    private readonly IAuditLogService _audit;
    private readonly IConfiguration _configuration;
    private readonly IWebHostEnvironment _env;

    public ShareController(AppDbContext context, IAuditLogService audit, IConfiguration configuration, IWebHostEnvironment env)
    {
        _context = context;
        _audit = audit;
        _configuration = configuration;
        _env = env;
    }

    /// <summary>256 bit rastgele, URL'de güvenli anahtar üretir.</summary>
    public static string GenerateToken() =>
        Convert.ToBase64String(RandomNumberGenerator.GetBytes(32)).TrimEnd('=').Replace('+', '-').Replace('/', '_');

    public static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token))).ToLowerInvariant();

    private static ShareLinkDto ToDto(ShareLink s) => Fill(new ShareLinkDto(), s);

    private static T Fill<T>(T dto, ShareLink s) where T : ShareLinkDto
    {
        dto.Id = s.Id;
        dto.Title = s.Title;
        dto.ProjectCount = s.ProjectIds.Count;
        dto.CreatedAt = s.CreatedAt;
        dto.CreatedBy = s.CreatedBy;
        dto.ExpiresAt = s.ExpiresAt;
        dto.IsActive = s.IsActive(DateTime.UtcNow);
        dto.RevokedAt = s.RevokedAt;
        dto.ViewCount = s.ViewCount;
        dto.LastViewedAt = s.LastViewedAt;
        return dto;
    }

    [HttpGet("api/shares")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<List<ShareLinkDto>>> List(CancellationToken ct)
    {
        var links = await _context.ShareLinks.AsNoTracking().OrderByDescending(s => s.CreatedAt).ToListAsync(ct);
        return Ok(links.Select(ToDto).ToList());
    }

    [HttpPost("api/shares")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CreatedShareLinkDto>> Create([FromBody] CreateShareLinkRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var requested = request.ProjectIds.Distinct().ToList();
        var existing = await _context.Projects.Where(p => requested.Contains(p.Id)).Select(p => p.Id).ToListAsync(ct);
        if (existing.Count == 0)
            return BadRequest(new { message = "Seçilen projeler bulunamadı." });

        var token = GenerateToken();
        var link = new ShareLink
        {
            TokenHash = HashToken(token),
            Title = request.Title.Trim(),
            ProjectIdsCsv = string.Join(',', existing),
            ExpiresAt = DateTime.UtcNow.AddDays(request.ExpiresInDays),
            CreatedBy = User.Identity?.Name
        };
        _context.ShareLinks.Add(link);
        await _context.SaveChangesAsync(ct);

        await _audit.LogAsync("ShareLink", link.Id.ToString(), "Create",
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value, User.Identity?.Name,
            $"Paylaşım linki oluşturuldu: '{link.Title}', {existing.Count} proje, {request.ExpiresInDays} gün", ct);

        var dto = Fill(new CreatedShareLinkDto(), link);
        dto.Token = token;
        return Ok(dto);
    }

    [HttpDelete("api/shares/{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Revoke(Guid id, CancellationToken ct)
    {
        var link = await _context.ShareLinks.FindAsync([id], ct);
        if (link == null) return NotFound();
        if (link.RevokedAt == null)
        {
            link.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);
            await _audit.LogAsync("ShareLink", id.ToString(), "Revoke",
                User.FindFirst(ClaimTypes.NameIdentifier)?.Value, User.Identity?.Name,
                $"Paylaşım linki iptal edildi: '{link.Title}'", ct);
        }
        return NoContent();
    }

    private async Task<ShareLink?> FindActiveAsync(string token, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(token) || token.Length > 100) return null;
        var hash = HashToken(token);
        var link = await _context.ShareLinks.FirstOrDefaultAsync(s => s.TokenHash == hash, ct);
        return link != null && link.IsActive(DateTime.UtcNow) ? link : null;
    }

    /// <summary>Paylaşım linkinin sunumu. Geçersiz, süresi dolmuş veya iptal edilmiş linkler 404 döner.</summary>
    [HttpGet("api/public/shares/{token}")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicy)]
    public async Task<ActionResult<DeckDto>> View(string token, CancellationToken ct)
    {
        var link = await FindActiveAsync(token, ct);
        if (link == null)
            return NotFound(new { message = "Bu paylaşım linki geçersiz, süresi dolmuş ya da iptal edilmiş." });

        var deck = await DeckBuilder.BuildAsync(_context, link.ProjectIds,
            id => $"/api/public/shares/{Uri.EscapeDataString(token)}/screenshots/{id}", publicView: true, ct);
        deck.Title = link.Title;
        deck.ExpiresAt = link.ExpiresAt;

        link.ViewCount++;
        link.LastViewedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        Response.Headers.CacheControl = "no-store";
        return Ok(deck);
    }

    /// <summary>Paylaşılan projeye ait ekran görüntüsü. Başka projenin görseli bu linkle açılamaz.</summary>
    [HttpGet("api/public/shares/{token}/screenshots/{id:guid}")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicy)]
    public async Task<IActionResult> Screenshot(string token, Guid id, CancellationToken ct)
    {
        var link = await FindActiveAsync(token, ct);
        if (link == null) return NotFound();

        var shot = await _context.ProjectScreenshots.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id, ct);
        if (shot == null || !link.ProjectIds.Contains(shot.ProjectId)) return NotFound();

        var path = Path.Combine(ScreenshotsController.ResolveUploadDirectory(_configuration, _env), shot.FileName);
        if (!System.IO.File.Exists(path)) return NotFound();

        var ext = Path.GetExtension(shot.FileName);
        var mime = ScreenshotsController.AllowedExtensions.TryGetValue(ext, out var m) ? m : "application/octet-stream";
        Response.Headers.CacheControl = "private, max-age=3600";
        return PhysicalFile(path, mime);
    }
}
