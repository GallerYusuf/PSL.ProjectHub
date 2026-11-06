using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Application.Interfaces;
using PSL.ProjectHub.Domain.Entities;
using PSL.ProjectHub.Domain.Enums;
using PSL.ProjectHub.Infrastructure.Data;

namespace PSL.ProjectHub.Api.Controllers;

/// <summary>
/// Projelerin iş etkisi rakamları ve portföy geneli etki özeti.
/// </summary>
[ApiController]
[Authorize]
public class ImpactController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IAuditLogService _audit;

    public ImpactController(AppDbContext context, IAuditLogService audit)
    {
        _context = context;
        _audit = audit;
    }

    /// <summary>Sabit birimli türlerin birimi; serbest birimlilerde kullanıcının girdiği birim.</summary>
    public static string UnitFor(ImpactKind kind, string? customUnit) => kind switch
    {
        ImpactKind.TimeSaved => "saat/ay",
        ImpactKind.Users => "kullanıcı",
        ImpactKind.CostSaving => "TL/yıl",
        _ => customUnit?.Trim() ?? string.Empty
    };

    /// <summary>
    /// Portföy toplamlarını hesaplar. Sabit birimli türler toplanır; öne çıkanlar her projeden
    /// en anlamlı tek metrikle (zaman > maliyet > kullanıcı > hacim > diğer) seçilir.
    /// </summary>
    public static ImpactSummaryDto ComputeSummary(IEnumerable<ProjectMetric> metrics, int maxHighlights = 6)
    {
        var list = metrics.ToList();
        var priority = new Dictionary<ImpactKind, int>
        {
            [ImpactKind.TimeSaved] = 0, [ImpactKind.CostSaving] = 1, [ImpactKind.Users] = 2,
            [ImpactKind.Volume] = 3, [ImpactKind.Other] = 4
        };

        return new ImpactSummaryDto
        {
            HoursSavedPerMonth = list.Where(m => m.Kind == ImpactKind.TimeSaved).Sum(m => m.Value),
            UsersReached = list.Where(m => m.Kind == ImpactKind.Users).Sum(m => m.Value),
            CostSavingPerYear = list.Where(m => m.Kind == ImpactKind.CostSaving).Sum(m => m.Value),
            ProjectsWithMetrics = list.Select(m => m.ProjectId).Distinct().Count(),
            Highlights = list
                .GroupBy(m => m.ProjectId)
                .Select(g => g.OrderBy(m => priority[m.Kind]).ThenBy(m => m.DisplayOrder).First())
                .OrderBy(m => priority[m.Kind])
                .ThenByDescending(m => m.Value)
                .Take(maxHighlights)
                .Select(m => new ImpactHighlightDto
                {
                    ProjectId = m.ProjectId,
                    ProjectName = m.Project?.Name ?? string.Empty,
                    ProjectSlug = m.Project?.Slug ?? string.Empty,
                    Kind = m.Kind,
                    Label = m.Label,
                    Value = m.Value,
                    Unit = UnitFor(m.Kind, m.Unit)
                })
                .ToList()
        };
    }

    private static ProjectMetricDto ToDto(ProjectMetric m) => new()
    {
        Id = m.Id,
        ProjectId = m.ProjectId,
        Kind = m.Kind,
        Label = m.Label,
        Value = m.Value,
        Unit = UnitFor(m.Kind, m.Unit),
        Note = m.Note,
        DisplayOrder = m.DisplayOrder
    };

    private Task LogAsync(string id, string action, string details, CancellationToken ct) =>
        _audit.LogAsync("ProjectMetric", id, action,
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value, User.Identity?.Name, details, ct);

    [HttpGet("api/impact/summary")]
    public async Task<ActionResult<ImpactSummaryDto>> GetSummary(CancellationToken ct)
    {
        var metrics = await _context.ProjectMetrics.Include(m => m.Project).AsNoTracking().ToListAsync(ct);
        return Ok(ComputeSummary(metrics));
    }

    [HttpGet("api/projects/{projectId:guid}/metrics")]
    public async Task<ActionResult<List<ProjectMetricDto>>> GetMetrics(Guid projectId, CancellationToken ct)
    {
        var metrics = await _context.ProjectMetrics
            .Where(m => m.ProjectId == projectId)
            .OrderBy(m => m.DisplayOrder).ThenBy(m => m.CreatedAt)
            .AsNoTracking()
            .ToListAsync(ct);
        return Ok(metrics.Select(ToDto).ToList());
    }

    [HttpPost("api/projects/{projectId:guid}/metrics")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<ActionResult<ProjectMetricDto>> Create(
        Guid projectId, [FromBody] UpsertProjectMetricRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        if (!await _context.Projects.AnyAsync(p => p.Id == projectId, ct))
            return NotFound(new { message = "Proje bulunamadı." });
        if (RequiresCustomUnit(request.Kind) && string.IsNullOrWhiteSpace(request.Unit))
            return BadRequest(new { message = "Bu metrik türü için birim zorunludur (ör. fatura/gün)." });

        var metric = new ProjectMetric { ProjectId = projectId };
        Apply(metric, request);
        _context.ProjectMetrics.Add(metric);
        await _context.SaveChangesAsync(ct);
        await LogAsync(metric.Id.ToString(), "Create", $"Etki metriği eklendi: {metric.Label} = {metric.Value}", ct);
        return Ok(ToDto(metric));
    }

    [HttpPut("api/metrics/{id:guid}")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<ActionResult<ProjectMetricDto>> Update(
        Guid id, [FromBody] UpsertProjectMetricRequest request, CancellationToken ct)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);
        var metric = await _context.ProjectMetrics.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (metric == null) return NotFound();
        if (RequiresCustomUnit(request.Kind) && string.IsNullOrWhiteSpace(request.Unit))
            return BadRequest(new { message = "Bu metrik türü için birim zorunludur (ör. fatura/gün)." });

        Apply(metric, request);
        metric.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(ct);
        await LogAsync(metric.Id.ToString(), "Update", $"Etki metriği güncellendi: {metric.Label} = {metric.Value}", ct);
        return Ok(ToDto(metric));
    }

    [HttpDelete("api/metrics/{id:guid}")]
    [Authorize(Roles = "Admin,Editor")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        var metric = await _context.ProjectMetrics.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (metric == null) return NotFound();
        _context.ProjectMetrics.Remove(metric);
        await _context.SaveChangesAsync(ct);
        await LogAsync(id.ToString(), "Delete", $"Etki metriği silindi: {metric.Label}", ct);
        return NoContent();
    }

    private static bool RequiresCustomUnit(ImpactKind kind) => kind is ImpactKind.Volume or ImpactKind.Other;

    private static void Apply(ProjectMetric metric, UpsertProjectMetricRequest request)
    {
        metric.Kind = request.Kind;
        metric.Label = request.Label.Trim();
        metric.Value = request.Value;
        metric.Unit = RequiresCustomUnit(request.Kind) ? request.Unit?.Trim() : null;
        metric.Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
        metric.DisplayOrder = request.DisplayOrder;
    }
}
