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
        var targetFile = string.IsNullOrWhiteSpace(fileName) ? "project-urls.json" : fileName;
        
        // Search in content root, then parent directory (solution root)
        var path = Path.Combine(_env.ContentRootPath, targetFile);
        if (!System.IO.File.Exists(path))
        {
            var parentPath = Path.Combine(_env.ContentRootPath, "..", "..", targetFile);
            if (System.IO.File.Exists(parentPath))
            {
                path = parentPath;
            }
        }

        if (!System.IO.File.Exists(path))
        {
            return NotFound(new { message = $"'{targetFile}' dosyası bulunamadı. Lütfen dosyanın proje kök dizininde olduğundan emin olun." });
        }

        var result = await _importService.ImportFromJsonFileAsync(path, cancellationToken);
        return Ok(result);
    }
}
