using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PSL.ProjectHub.Domain.Entities;
using PSL.ProjectHub.Infrastructure.Data;

namespace PSL.ProjectHub.Api.Controllers;

public enum TimelineEventKind
{
    Started,   // Geliştirme başladı
    WentLive,  // Canlıya çıktı
    Release    // Sürüm yayınlandı
}

public class TimelineEventDto
{
    public DateTime Date { get; set; }
    public TimelineEventKind Kind { get; set; }
    public Guid ProjectId { get; set; }
    public string ProjectName { get; set; } = string.Empty;
    public string ProjectSlug { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Version { get; set; }
    public string? Description { get; set; }
}

public class TimelineSummaryDto
{
    public int ProjectsStarted { get; set; }
    public int ProjectsWentLive { get; set; }
    public int Releases { get; set; }
}

public class TimelineDto
{
    /// <summary>Seçili yıl; null ise tüm zamanlar.</summary>
    public int? Year { get; set; }
    /// <summary>Olay bulunan yıllar, yeniden eskiye.</summary>
    public List<int> AvailableYears { get; set; } = new();
    public TimelineSummaryDto Summary { get; set; } = new();
    /// <summary>Yeniden eskiye sıralı olaylar.</summary>
    public List<TimelineEventDto> Events { get; set; } = new();
}

/// <summary>
/// Ekibin yaptıklarını kronolojik olarak gösterir: projelerin başlangıç ve canlıya çıkış
/// tarihleri ile sürüm kayıtlarından türetilir; ayrı bir veri girişi gerektirmez.
/// </summary>
[ApiController]
[Authorize]
public class TimelineController : ControllerBase
{
    private readonly AppDbContext _context;

    public TimelineController(AppDbContext context) => _context = context;

    public static TimelineDto Build(IEnumerable<Project> projects, int? year)
    {
        var events = new List<TimelineEventDto>();
        foreach (var p in projects)
        {
            if (p.StartDate is DateTime start)
                events.Add(Event(p, start, TimelineEventKind.Started, "Geliştirme başladı"));
            if (p.LiveDate is DateTime live)
                events.Add(Event(p, live, TimelineEventKind.WentLive, "Canlıya çıktı"));
            foreach (var r in p.Releases)
            {
                var e = Event(p, r.ReleaseDate, TimelineEventKind.Release,
                    string.IsNullOrWhiteSpace(r.Title) ? $"{r.Version} yayınlandı" : r.Title);
                e.Version = r.Version;
                e.Description = r.Description;
                events.Add(e);
            }
        }

        var years = events.Select(e => e.Date.Year).Distinct().OrderByDescending(y => y).ToList();
        var selected = year.HasValue ? events.Where(e => e.Date.Year == year.Value).ToList() : events;

        return new TimelineDto
        {
            Year = year,
            AvailableYears = years,
            Summary = new TimelineSummaryDto
            {
                ProjectsStarted = selected.Count(e => e.Kind == TimelineEventKind.Started),
                ProjectsWentLive = selected.Count(e => e.Kind == TimelineEventKind.WentLive),
                Releases = selected.Count(e => e.Kind == TimelineEventKind.Release)
            },
            Events = selected
                .OrderByDescending(e => e.Date)
                .ThenBy(e => e.Kind == TimelineEventKind.WentLive ? 0 : e.Kind == TimelineEventKind.Release ? 1 : 2)
                .ToList()
        };
    }

    private static TimelineEventDto Event(Project p, DateTime date, TimelineEventKind kind, string title) => new()
    {
        Date = date,
        Kind = kind,
        ProjectId = p.Id,
        ProjectName = p.Name,
        ProjectSlug = p.Slug,
        Title = title
    };

    /// <summary>Zaman çizelgesi. year verilmezse tüm zamanlar döner.</summary>
    [HttpGet("api/timeline")]
    public async Task<ActionResult<TimelineDto>> Get([FromQuery] int? year, CancellationToken ct)
    {
        var projects = await _context.Projects
            .Include(p => p.Releases)
            .AsNoTracking()
            .ToListAsync(ct);
        return Ok(Build(projects, year));
    }
}
