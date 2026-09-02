using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Application.Interfaces;

namespace PSL.ProjectHub.Api.Controllers;

[ApiController]
public class ProjectLinksController : ControllerBase
{
    private readonly IProjectLinkService _linkService;

    public ProjectLinksController(IProjectLinkService linkService)
    {
        _linkService = linkService;
    }

    [HttpGet("api/projects/{projectId:guid}/links")]
    public async Task<ActionResult<List<ProjectLinkDto>>> GetProjectLinks(Guid projectId, [FromQuery] bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        var links = await _linkService.GetLinksByProjectIdAsync(projectId, includeInactive, cancellationToken);
        return Ok(links);
    }

    [HttpPost("api/projects/{projectId:guid}/links")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ProjectLinkDto>> CreateLink(Guid projectId, [FromBody] CreateLinkRequest request, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var created = await _linkService.CreateLinkAsync(projectId, request, cancellationToken);
        return Created($"api/links/{created.Id}", created);
    }

    [HttpPut("api/links/{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ProjectLinkDto>> UpdateLink(Guid id, [FromBody] UpdateLinkRequest request, CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var updated = await _linkService.UpdateLinkAsync(id, request, cancellationToken);
        if (updated == null)
        {
            return NotFound(new { message = "Bağlantı bulunamadı." });
        }

        return Ok(updated);
    }

    [HttpDelete("api/links/{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteLink(Guid id, [FromQuery] bool hardDelete = false, CancellationToken cancellationToken = default)
    {
        var success = await _linkService.DeleteOrDeactivateLinkAsync(id, hardDelete, cancellationToken);
        if (!success) return NotFound(new { message = "Bağlantı bulunamadı." });

        return Ok(new { message = hardDelete ? "Bağlantı kalıcı olarak silindi." : "Bağlantı pasif duruma getirildi." });
    }

    [HttpPost("api/links/{id:guid}/primary")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> SetPrimary(Guid id, CancellationToken cancellationToken = default)
    {
        var success = await _linkService.SetPrimaryLinkAsync(id, cancellationToken);
        if (!success) return NotFound(new { message = "Bağlantı bulunamadı." });

        return Ok(new { message = "Bağlantı birincil olarak belirlendi." });
    }

    [HttpPost("api/projects/{projectId:guid}/links/reorder")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ReorderLinks(Guid projectId, [FromBody] List<Guid> orderedIds, CancellationToken cancellationToken = default)
    {
        var success = await _linkService.ReorderLinksAsync(projectId, orderedIds, cancellationToken);
        return Ok(new { message = "Sıralama güncellendi." });
    }
}
