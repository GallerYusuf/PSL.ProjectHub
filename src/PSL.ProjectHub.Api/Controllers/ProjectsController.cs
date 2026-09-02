using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Application.Interfaces;
using PSL.ProjectHub.Domain.Enums;

namespace PSL.ProjectHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    [HttpGet]
    public async Task<ActionResult<List<ProjectSummaryDto>>> GetProjects(
        [FromQuery] string? search,
        [FromQuery] ProjectStatus? status,
        [FromQuery] string? category,
        [FromQuery] string? technology,
        [FromQuery] string? integration,
        [FromQuery] string? owner,
        [FromQuery] bool? onlyWithLiveUrl,
        [FromQuery] string? sortBy,
        [FromQuery] bool includeArchived = false,
        CancellationToken cancellationToken = default)
    {
        // Yalnızca Admin rolündeki kullanıcılar arşivlenmiş projeleri listeleyebilir
        var canIncludeArchived = includeArchived && User.IsInRole("Admin");

        var projects = await _projectService.GetAllProjectsAsync(
            search, status, category, technology, integration, owner, onlyWithLiveUrl, sortBy, canIncludeArchived, cancellationToken);
        return Ok(projects);
    }

    [HttpGet("{identifier}")]
    public async Task<ActionResult<ProjectDetailDto>> GetProject(
        string identifier,
        [FromQuery] bool includeInactive = false,
        CancellationToken cancellationToken = default)
    {
        // Yalnızca Admin rolü pasif bağlantıları görebilir
        var canSeeInactive = includeInactive && User.IsInRole("Admin");

        ProjectDetailDto? project;
        if (Guid.TryParse(identifier, out var id))
        {
            project = await _projectService.GetProjectByIdAsync(id, canSeeInactive, cancellationToken);
        }
        else
        {
            project = await _projectService.GetProjectBySlugAsync(identifier, canSeeInactive, cancellationToken);
        }

        if (project == null)
        {
            return NotFound(new { message = $"'{identifier}' projesi bulunamadı." });
        }

        return Ok(project);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ProjectDetailDto>> CreateProject([FromBody] CreateProjectRequest request, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var created = await _projectService.CreateProjectAsync(request, cancellationToken);
        return CreatedAtAction(nameof(GetProject), new { identifier = created.Slug }, created);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ProjectDetailDto>> UpdateProject(Guid id, [FromBody] UpdateProjectRequest request, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var updated = await _projectService.UpdateProjectAsync(id, request, cancellationToken);
        if (updated == null)
        {
            return NotFound(new { message = "Güncellenecek proje bulunamadı." });
        }

        return Ok(updated);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ArchiveProject(Guid id, CancellationToken cancellationToken = default)
    {
        var success = await _projectService.ArchiveProjectAsync(id, cancellationToken);
        if (!success)
        {
            return NotFound(new { message = "Arşivlenecek proje bulunamadı." });
        }

        return Ok(new { message = "Proje başarıyla arşivlendi." });
    }

    [HttpPost("{id:guid}/verify")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SetVerified(Guid id, [FromQuery] bool isVerified = true, CancellationToken cancellationToken = default)
    {
        var success = await _projectService.SetVerifiedStatusAsync(id, isVerified, cancellationToken);
        if (!success) return NotFound(new { message = "Proje bulunamadı." });

        return Ok(new { message = isVerified ? "Proje bilgileri doğrulandı olarak işaretlendi." : "Proje bilgileri doğrulama bekliyor olarak işaretlendi." });
    }

    [HttpPost("{id:guid}/components")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AddComponent(Guid id, [FromBody] ProjectComponentDto component, CancellationToken cancellationToken = default)
    {
        var success = await _projectService.AddComponentAsync(id, component, cancellationToken);
        if (!success) return NotFound(new { message = "Proje bulunamadı." });

        return Ok(new { message = "Bileşen başarıyla eklendi." });
    }

    [HttpPost("{id:guid}/integrations")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AddIntegration(Guid id, [FromBody] ProjectIntegrationDto integration, CancellationToken cancellationToken = default)
    {
        var success = await _projectService.AddIntegrationAsync(id, integration, cancellationToken);
        if (!success) return NotFound(new { message = "Proje bulunamadı." });

        return Ok(new { message = "Entegrasyon başarıyla eklendi." });
    }

    [HttpPost("{id:guid}/releases")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AddRelease(Guid id, [FromBody] ProjectReleaseDto release, CancellationToken cancellationToken = default)
    {
        var success = await _projectService.AddReleaseAsync(id, release, cancellationToken);
        if (!success) return NotFound(new { message = "Proje bulunamadı." });

        return Ok(new { message = "Sürüm başarıyla eklendi." });
    }

    [HttpPost("{id:guid}/notes")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AddNote(Guid id, [FromBody] ProjectNoteDto note, CancellationToken cancellationToken = default)
    {
        var success = await _projectService.AddNoteAsync(id, note, cancellationToken);
        if (!success) return NotFound(new { message = "Proje bulunamadı." });

        return Ok(new { message = "Geliştirme notu başarıyla eklendi." });
    }
}
