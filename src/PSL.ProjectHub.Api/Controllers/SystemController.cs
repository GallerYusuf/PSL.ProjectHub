using Microsoft.AspNetCore.Mvc;
using PSL.ProjectHub.Application.Interfaces;

namespace PSL.ProjectHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SystemController : ControllerBase
{
    private readonly IRepositoryMetadataProvider _repoProvider;
    private readonly IApplicationHealthProvider _healthProvider;
    private readonly IDeploymentInfoProvider _deployProvider;

    public SystemController(
        IRepositoryMetadataProvider repoProvider,
        IApplicationHealthProvider healthProvider,
        IDeploymentInfoProvider deployProvider)
    {
        _repoProvider = repoProvider;
        _healthProvider = healthProvider;
        _deployProvider = deployProvider;
    }

    [HttpGet("health")]
    public async Task<IActionResult> GetHealth([FromQuery] string url = "https://example.internal", CancellationToken cancellationToken = default)
    {
        var health = await _healthProvider.CheckHealthAsync(url, cancellationToken);
        return Ok(health);
    }

    [HttpGet("deployment-info")]
    public async Task<IActionResult> GetDeploymentInfo([FromQuery] string project = "PSL.ProjectHub", [FromQuery] string env = "Production", CancellationToken cancellationToken = default)
    {
        var info = await _deployProvider.GetDeploymentInfoAsync(project, env, cancellationToken);
        return Ok(info);
    }

    [HttpGet("repo-meta")]
    public async Task<IActionResult> GetRepoMeta([FromQuery] string repoUrl = "https://github.com/gallerycrystal/project", CancellationToken cancellationToken = default)
    {
        var meta = await _repoProvider.GetMetadataAsync(repoUrl, cancellationToken);
        return Ok(meta);
    }
}
