using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Domain.Entities;
using PSL.ProjectHub.Infrastructure.Data;

namespace PSL.ProjectHub.Api.Controllers;

[ApiController]
[Authorize]
public class ScreenshotsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ScreenshotsController> _logger;

    // Desteklenen görsel uzantıları ve izin verilen MIME türleri
    private static readonly Dictionary<string, string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        { ".png", "image/png" },
        { ".jpg", "image/jpeg" },
        { ".jpeg", "image/jpeg" },
        { ".webp", "image/webp" }
    };

    public ScreenshotsController(
        AppDbContext context,
        IWebHostEnvironment env,
        IConfiguration configuration,
        ILogger<ScreenshotsController> logger)
    {
        _context = context;
        _env = env;
        _configuration = configuration;
        _logger = logger;
    }

    private string GetUploadDirectory()
    {
        var configuredPath = _configuration["Storage:ScreenshotsPath"];
        var uploadDir = !string.IsNullOrWhiteSpace(configuredPath)
            ? configuredPath
            : Path.Combine(_env.WebRootPath ?? _env.ContentRootPath, "uploads", "screenshots");

        if (!Directory.Exists(uploadDir))
        {
            Directory.CreateDirectory(uploadDir);
        }

        return uploadDir;
    }

    /// <summary>
    /// Güvenlik için dosya başlık baytlarını (magic bytes) kontrol eder.
    /// </summary>
    private static bool ValidateImageMagicBytes(Stream stream, string extension)
    {
        stream.Position = 0;
        using var reader = new BinaryReader(stream, System.Text.Encoding.Default, leaveOpen: true);
        var bytes = reader.ReadBytes(12);
        stream.Position = 0;

        if (bytes.Length < 4) return false;

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (extension.Equals(".png", StringComparison.OrdinalIgnoreCase))
        {
            return bytes.Length >= 8 &&
                   bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47 &&
                   bytes[4] == 0x0D && bytes[5] == 0x0A && bytes[6] == 0x1A && bytes[7] == 0x0A;
        }

        // JPEG: FF D8 FF
        if (extension.Equals(".jpg", StringComparison.OrdinalIgnoreCase) ||
            extension.Equals(".jpeg", StringComparison.OrdinalIgnoreCase))
        {
            return bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF;
        }

        // WEBP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
        if (extension.Equals(".webp", StringComparison.OrdinalIgnoreCase))
        {
            return bytes.Length >= 12 &&
                   bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46 &&
                   bytes[8] == 0x57 && bytes[9] == 0x45 && bytes[10] == 0x42 && bytes[11] == 0x50;
        }

        return false;
    }

    [HttpGet("api/projects/{projectId:guid}/screenshots")]
    public async Task<ActionResult<List<ProjectScreenshotDto>>> GetProjectScreenshots(Guid projectId, CancellationToken cancellationToken = default)
    {
        var screenshots = await _context.ProjectScreenshots
            .Where(s => s.ProjectId == projectId)
            .OrderBy(s => s.DisplayOrder)
            .Select(s => new ProjectScreenshotDto
            {
                Id = s.Id,
                ProjectId = s.ProjectId,
                FileName = s.FileName,
                FilePath = s.FilePath,
                Caption = s.Caption,
                IsCover = s.IsCover,
                DisplayOrder = s.DisplayOrder
            })
            .ToListAsync(cancellationToken);

        return Ok(screenshots);
    }

    [HttpGet("api/screenshots/{id:guid}/file")]
    public async Task<IActionResult> GetScreenshotFile(Guid id, CancellationToken cancellationToken = default)
    {
        var screenshot = await _context.ProjectScreenshots.FindAsync([id], cancellationToken);
        if (screenshot == null) return NotFound();

        var filePath = Path.Combine(GetUploadDirectory(), screenshot.FileName);
        if (!System.IO.File.Exists(filePath)) return NotFound(new { message = "Görsel dosyası sunucuda bulunamadı." });

        var ext = Path.GetExtension(screenshot.FileName);
        var mimeType = AllowedExtensions.TryGetValue(ext, out var mime) ? mime : "application/octet-stream";

        return PhysicalFile(filePath, mimeType);
    }

    [HttpPost("api/projects/{projectId:guid}/screenshots")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ProjectScreenshotDto>> UploadScreenshot(
        Guid projectId,
        [FromForm] IFormFile? file,
        [FromForm] string? caption,
        [FromForm] bool isCover = false,
        [FromForm] int displayOrder = 0,
        CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Lütfen yüklenecek bir görsel dosyası seçiniz." });
        }

        // Dosya boyutu sınırı: 5 MB
        const long maxFileSize = 5 * 1024 * 1024;
        if (file.Length > maxFileSize)
        {
            return BadRequest(new { message = "Görsel boyutu 5 MB sınırını aşamaz." });
        }

        // Dosya uzantısı kontrolü
        var rawExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.ContainsKey(rawExtension))
        {
            return BadRequest(new { message = "Yalnızca PNG, JPG ve WEBP formatındaki görseller desteklenmektedir." });
        }

        // Güvenlik: Magic bytes kontrolü (dosya içeriğinin gerçekten geçerli bir resim olduğunu doğrula)
        using (var stream = file.OpenReadStream())
        {
            if (!ValidateImageMagicBytes(stream, rawExtension))
            {
                return BadRequest(new { message = "Yüklenen dosya içeriği geçerli bir görsel formatı ile eşleşmiyor." });
            }
        }

        var project = await _context.Projects.FindAsync([projectId], cancellationToken);
        if (project == null)
        {
            return NotFound(new { message = "Ekran görüntüsü eklenecek proje bulunamadı." });
        }

        var uploadDir = GetUploadDirectory();
        // Benzersiz ve güvenli dosya adı üretimi
        var uniqueFileName = $"{Guid.NewGuid():N}{rawExtension}";
        var physicalPath = Path.Combine(uploadDir, uniqueFileName);

        using (var fileStream = new FileStream(physicalPath, FileMode.Create, FileAccess.Write))
        {
            await file.CopyToAsync(fileStream, cancellationToken);
        }

        // Eğer kapak görseli olarak seçildiyse diğer kapakları kaldır
        if (isCover)
        {
            var existingCovers = await _context.ProjectScreenshots
                .Where(s => s.ProjectId == projectId && s.IsCover)
                .ToListAsync(cancellationToken);

            foreach (var existing in existingCovers)
            {
                existing.IsCover = false;
            }
        }

        var screenshot = new ProjectScreenshot
        {
            ProjectId = projectId,
            FileName = uniqueFileName,
            FilePath = $"/api/screenshots/{uniqueFileName}", // İstemciye servis edilen göreceli URL
            Caption = caption?.Trim(),
            IsCover = isCover,
            DisplayOrder = displayOrder,
            CreatedAt = DateTime.UtcNow
        };

        _context.ProjectScreenshots.Add(screenshot);
        project.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Yeni ekran görüntüsü yüklendi. ProjeId: {ProjectId}, Dosya: {FileName}", projectId, uniqueFileName);

        var dto = new ProjectScreenshotDto
        {
            Id = screenshot.Id,
            ProjectId = screenshot.ProjectId,
            FileName = screenshot.FileName,
            FilePath = $"/api/screenshots/{screenshot.Id}/file",
            Caption = screenshot.Caption,
            IsCover = screenshot.IsCover,
            DisplayOrder = screenshot.DisplayOrder
        };

        return CreatedAtAction(nameof(GetScreenshotFile), new { id = screenshot.Id }, dto);
    }

    [HttpPut("api/screenshots/{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ProjectScreenshotDto>> UpdateScreenshot(
        Guid id,
        [FromBody] UpdateScreenshotRequest request,
        CancellationToken cancellationToken = default)
    {
        var screenshot = await _context.ProjectScreenshots.FindAsync([id], cancellationToken);
        if (screenshot == null) return NotFound(new { message = "Ekran görüntüsü bulunamadı." });

        if (request.IsCover && !screenshot.IsCover)
        {
            var existingCovers = await _context.ProjectScreenshots
                .Where(s => s.ProjectId == screenshot.ProjectId && s.IsCover && s.Id != id)
                .ToListAsync(cancellationToken);

            foreach (var existing in existingCovers)
            {
                existing.IsCover = false;
            }
        }

        screenshot.Caption = request.Caption?.Trim();
        screenshot.IsCover = request.IsCover;
        screenshot.DisplayOrder = request.DisplayOrder;

        var project = await _context.Projects.FindAsync([screenshot.ProjectId], cancellationToken);
        if (project != null)
        {
            project.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new ProjectScreenshotDto
        {
            Id = screenshot.Id,
            ProjectId = screenshot.ProjectId,
            FileName = screenshot.FileName,
            FilePath = $"/api/screenshots/{screenshot.Id}/file",
            Caption = screenshot.Caption,
            IsCover = screenshot.IsCover,
            DisplayOrder = screenshot.DisplayOrder
        });
    }

    [HttpDelete("api/screenshots/{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteScreenshot(Guid id, CancellationToken cancellationToken = default)
    {
        var screenshot = await _context.ProjectScreenshots.FindAsync([id], cancellationToken);
        if (screenshot == null) return NotFound(new { message = "Silinecek ekran görüntüsü bulunamadı." });

        // Fiziksel dosyayı güvenle sil
        try
        {
            var filePath = Path.Combine(GetUploadDirectory(), screenshot.FileName);
            if (System.IO.File.Exists(filePath))
            {
                System.IO.File.Delete(filePath);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Ekran görüntüsü dosyası silinirken uyarı alındı: {FileName}", screenshot.FileName);
        }

        _context.ProjectScreenshots.Remove(screenshot);

        var project = await _context.Projects.FindAsync([screenshot.ProjectId], cancellationToken);
        if (project != null)
        {
            project.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Ekran görüntüsü başarıyla silindi." });
    }
}
