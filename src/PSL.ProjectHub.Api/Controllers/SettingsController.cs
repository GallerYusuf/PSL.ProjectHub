using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Domain.Entities;
using PSL.ProjectHub.Infrastructure.Data;

namespace PSL.ProjectHub.Api.Controllers;

/// <summary>
/// Firma kimliği ve marka ayarları (tek satır). Marka bilgisi ve logo giriş ekranında da
/// gösterildiği için anonim okunabilir; değişiklik yalnızca Admin rolüne açıktır.
/// </summary>
[ApiController]
[Route("api/settings")]
[Authorize]
public class SettingsController : ControllerBase
{
    private const long MaxLogoBytes = 2 * 1024 * 1024;
    private static readonly Regex HexColor = new("^#[0-9a-fA-F]{6}$", RegexOptions.Compiled);

    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _configuration;

    public SettingsController(AppDbContext context, IWebHostEnvironment env, IConfiguration configuration)
    {
        _context = context;
        _env = env;
        _configuration = configuration;
    }

    internal static async Task<OrganizationSettings> GetOrCreateAsync(AppDbContext context, CancellationToken ct)
    {
        var settings = await context.OrganizationSettings.FindAsync([OrganizationSettings.SingletonId], ct);
        if (settings != null) return settings;

        // Kurulum tamamlanana kadar firma adı boş kalır; arayüz ürün adını gösterir
        settings = new OrganizationSettings();
        context.OrganizationSettings.Add(settings);
        await context.SaveChangesAsync(ct);
        return settings;
    }

    internal static bool IsValidColor(string? color) => color != null && HexColor.IsMatch(color);

    private string GetBrandingDirectory()
    {
        var configured = _configuration["Storage:BrandingPath"];
        var dir = !string.IsNullOrWhiteSpace(configured)
            ? configured
            : Path.Combine(_env.ContentRootPath, "uploads", "branding");
        Directory.CreateDirectory(dir);
        return dir;
    }

    private static string? LogoUrl(OrganizationSettings s) =>
        s.LogoFileName == null ? null : $"/api/settings/logo?v={s.UpdatedAt.Ticks}";

    [HttpGet("branding")]
    [AllowAnonymous]
    public async Task<ActionResult<BrandingDto>> GetBranding(CancellationToken ct)
    {
        var s = await GetOrCreateAsync(_context, ct);
        return Ok(new BrandingDto
        {
            OrganizationName = s.OrganizationName,
            TeamName = s.TeamName,
            Tagline = s.Tagline,
            AccentColor = s.AccentColor,
            LogoUrl = LogoUrl(s)
        });
    }

    [HttpGet]
    public async Task<ActionResult<OrganizationSettingsDto>> Get(CancellationToken ct)
    {
        var s = await GetOrCreateAsync(_context, ct);
        return Ok(ToDto(s));
    }

    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<OrganizationSettingsDto>> Update(
        [FromBody] UpdateOrganizationSettingsRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.OrganizationName))
            return BadRequest(new { message = "Firma adı zorunludur." });
        if (string.IsNullOrWhiteSpace(request.TeamName))
            return BadRequest(new { message = "Ekip adı zorunludur." });
        if (!IsValidColor(request.AccentColor))
            return BadRequest(new { message = "Vurgu rengi #RRGGBB formatında olmalıdır." });

        var s = await GetOrCreateAsync(_context, ct);
        s.OrganizationName = request.OrganizationName.Trim();
        s.TeamName = request.TeamName.Trim();
        s.DirectorName = NullIfEmpty(request.DirectorName);
        s.DirectorTitle = NullIfEmpty(request.DirectorTitle);
        s.Tagline = NullIfEmpty(request.Tagline);
        s.AccentColor = request.AccentColor.ToLowerInvariant();
        s.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        return Ok(ToDto(s));
    }

    [HttpGet("logo")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLogo(CancellationToken ct)
    {
        var s = await GetOrCreateAsync(_context, ct);
        if (s.LogoFileName == null) return NotFound();

        var path = Path.Combine(GetBrandingDirectory(), s.LogoFileName);
        if (!System.IO.File.Exists(path)) return NotFound();

        var ext = Path.GetExtension(s.LogoFileName);
        var mime = ScreenshotsController.AllowedExtensions.TryGetValue(ext, out var m) ? m : "application/octet-stream";
        Response.Headers.CacheControl = "public, max-age=86400";
        return PhysicalFile(path, mime);
    }

    [HttpPost("logo")]
    [Authorize(Roles = "Admin")]
    [RequestSizeLimit(MaxLogoBytes + 64 * 1024)]
    public async Task<ActionResult<OrganizationSettingsDto>> UploadLogo([FromForm] IFormFile? file, CancellationToken ct)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Logo dosyası seçilmedi." });
        if (file.Length > MaxLogoBytes)
            return BadRequest(new { message = "Logo en fazla 2 MB olabilir." });

        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrEmpty(ext) || !ScreenshotsController.AllowedExtensions.ContainsKey(ext))
            return BadRequest(new { message = "Yalnızca PNG, JPG veya WEBP yüklenebilir." });

        await using var stream = file.OpenReadStream();
        if (!ScreenshotsController.ValidateImageMagicBytes(stream, ext))
            return BadRequest(new { message = "Dosya içeriği geçerli bir görsel değil." });

        var dir = GetBrandingDirectory();
        var s = await GetOrCreateAsync(_context, ct);
        var oldFile = s.LogoFileName;

        var newName = $"logo-{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
        await using (var target = System.IO.File.Create(Path.Combine(dir, newName)))
        {
            stream.Position = 0;
            await stream.CopyToAsync(target, ct);
        }

        s.LogoFileName = newName;
        s.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);

        if (oldFile != null)
        {
            var oldPath = Path.Combine(dir, oldFile);
            if (System.IO.File.Exists(oldPath)) System.IO.File.Delete(oldPath);
        }

        return Ok(ToDto(s));
    }

    [HttpDelete("logo")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<OrganizationSettingsDto>> DeleteLogo(CancellationToken ct)
    {
        var s = await GetOrCreateAsync(_context, ct);
        if (s.LogoFileName != null)
        {
            var path = Path.Combine(GetBrandingDirectory(), s.LogoFileName);
            if (System.IO.File.Exists(path)) System.IO.File.Delete(path);
            s.LogoFileName = null;
            s.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(ct);
        }
        return Ok(ToDto(s));
    }

    private static string? NullIfEmpty(string? v) => string.IsNullOrWhiteSpace(v) ? null : v.Trim();

    private static OrganizationSettingsDto ToDto(OrganizationSettings s) => new()
    {
        OrganizationName = s.OrganizationName,
        TeamName = s.TeamName,
        Tagline = s.Tagline,
        AccentColor = s.AccentColor,
        LogoUrl = LogoUrl(s),
        DirectorName = s.DirectorName,
        DirectorTitle = s.DirectorTitle
    };
}
