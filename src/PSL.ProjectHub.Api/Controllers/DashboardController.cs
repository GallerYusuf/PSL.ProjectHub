using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Application.Interfaces;

namespace PSL.ProjectHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;

    public DashboardController(IDashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("metrics")]
    public async Task<ActionResult<DashboardMetricsDto>> GetMetrics(CancellationToken cancellationToken = default)
    {
        var metrics = await _dashboardService.GetDashboardMetricsAsync(cancellationToken);
        return Ok(metrics);
    }
}
