using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Application.Interfaces;

namespace PSL.ProjectHub.Api.Controllers;

[ApiController]
[Route("api/url-import")]
[Authorize(Roles = "Admin")]
public class UrlImportController : ControllerBase
{
    private readonly IUrlImportService _importService;
    private readonly IWebHostEnvironment _env;

    public UrlImportController(IUrlImportService importService, IWebHostEnvironment env)
    {
        _importService = importService;
        _env = env;
    }

    [HttpPost]
    public async Task<ActionResult<UrlImportResultDto>> ImportFromPayload([FromBody] List<UrlImportItemDto> items, CancellationToken cancellationToken = default)
    {
        if (items == null || items.Count == 0)
        {
            return BadRequest(new { message = "İçe aktarılacak URL listesi boş olamaz." });
        }

        var result = await _importService.ImportUrlsAsync(items, cancellationToken);
        return Ok(result);
    }

    [HttpPost("file")]
    public async Task<ActionResult<UrlImportResultDto>> ImportFromWorkspaceFile([FromQuery] string? fileName, CancellationToken cancellationToken = default)
    {
        var targetFile = string.IsNullOrWhiteSpace(fileName) ? "project-urls.json" : fileName.Trim();

        // Path Traversal saldırılarını önleme: ../, mutlak yol, sürücü harfi vb. engelle
        if (targetFile.Contains("..") ||
            targetFile.Contains('/') ||
            targetFile.Contains('\\') ||
            Path.IsPathRooted(targetFile) ||
            targetFile.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
        {
            return BadRequest(new { message = "Güvenlik İhlali: Geçersiz dosya adı. Dizin değiştirme (Path Traversal) karakterleri tespit edildi." });
        }

        // Yalnızca .json uzantısına izin verilir
        if (!targetFile.EndsWith(".json", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Yalnızca .json uzantılı dosyalar içe aktarılabilir." });
        }

        var safeFileName = Path.GetFileName(targetFile);

        // Arama sadece izin verilen klasör sınırları içerisinde yapılır
        var path = Path.Combine(_env.ContentRootPath, safeFileName);
        if (!System.IO.File.Exists(path))
        {
            var parentDir = Path.GetFullPath(Path.Combine(_env.ContentRootPath, "..", ".."));
            var parentPath = Path.Combine(parentDir, safeFileName);
            if (System.IO.File.Exists(parentPath))
            {
                path = parentPath;
            }
        }

        if (!System.IO.File.Exists(path))
        {
            return NotFound(new { message = $"'{safeFileName}' dosyası bulunamadı. Lütfen dosyanın proje kök dizininde olduğundan emin olun." });
        }

        var result = await _importService.ImportFromJsonFileAsync(path, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Güvenli dosya yükleme uç noktası. JSON dosyasını sunucuya doğrudan yükleyerek içe aktarır.
    /// </summary>
    [HttpPost("upload")]
    public async Task<ActionResult<UrlImportResultDto>> UploadAndImport(IFormFile? file, CancellationToken cancellationToken = default)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new { message = "Lütfen geçerli bir JSON dosyası seçiniz." });
        }

        // Dosya boyutu sınırı (En fazla 2 MB)
        const long maxSizeBytes = 2 * 1024 * 1024;
        if (file.Length > maxSizeBytes)
        {
            return BadRequest(new { message = "Dosya boyutu 2 MB sınırını aşamaz." });
        }

        // Uzantı kontrolü
        var extension = Path.GetExtension(file.FileName);
        if (!string.Equals(extension, ".json", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Yalnızca .json uzantılı dosyalar kabul edilir." });
        }

        try
        {
            using var streamReader = new StreamReader(file.OpenReadStream());
            var json = await streamReader.ReadToEndAsync(cancellationToken);
            var options = new System.Text.Json.JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
            var items = System.Text.Json.JsonSerializer.Deserialize<List<UrlImportItemDto>>(json, options);
            if (items == null || items.Count == 0)
            {
                return BadRequest(new { message = "Dosya içeriğinde geçerli URL import verisi bulunamadı." });
            }

            var result = await _importService.ImportUrlsAsync(items, cancellationToken);
            return Ok(result);
        }
        catch (System.Text.Json.JsonException ex)
        {
            return BadRequest(new { message = $"Geçersiz JSON biçimi: {ex.Message}" });
        }
    }
}
