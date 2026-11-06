using PSL.ProjectHub.Api.Controllers;
using PSL.ProjectHub.Domain.Entities;
using PSL.ProjectHub.Domain.Enums;
using PSL.ProjectHub.Infrastructure.Services;
using Xunit;

namespace PSL.ProjectHub.Api.Tests;

public class TimelineTests
{
    private static Project P(string name, DateTime? start = null, DateTime? live = null, params (string v, DateTime d)[] releases)
    {
        var p = new Project { Id = Guid.NewGuid(), Name = name, Slug = name.ToLowerInvariant(), StartDate = start, LiveDate = live };
        foreach (var (v, d) in releases)
            p.Releases.Add(new ProjectRelease { ProjectId = p.Id, Version = v, ReleaseDate = d });
        return p;
    }

    [Fact]
    public void Build_MergesStartLiveAndReleases_NewestFirst_AndSummarizesSelectedYear()
    {
        var projects = new[]
        {
            P("B2B", start: new DateTime(2026, 3, 17), live: new DateTime(2026, 6, 1), ("v2.0", new DateTime(2026, 10, 5))),
            P("Family", start: new DateTime(2025, 10, 2), live: new DateTime(2025, 12, 1)),
            P("Taslak") // tarihsiz proje çizelgeye girmez
        };

        var all = TimelineController.Build(projects, year: null);
        Assert.Equal(5, all.Events.Count);
        Assert.Equal(new[] { 2026, 2025 }, all.AvailableYears);
        Assert.Equal(new DateTime(2026, 10, 5), all.Events[0].Date);
        Assert.Equal("v2.0 yayınlandı", all.Events[0].Title);

        var y2026 = TimelineController.Build(projects, year: 2026);
        Assert.Equal(3, y2026.Events.Count);
        Assert.Equal(1, y2026.Summary.ProjectsStarted);
        Assert.Equal(1, y2026.Summary.ProjectsWentLive);
        Assert.Equal(1, y2026.Summary.Releases);
        Assert.Equal(new[] { 2026, 2025 }, y2026.AvailableYears); // yıl seçici her zaman tüm yılları gösterir
    }

    [Fact]
    public void EnsureLiveDate_FillsTodayOnlyWhenProjectTransitionsToLive()
    {
        var justWentLive = new Project { Status = ProjectStatus.Live };
        var alreadyLive = new Project { Status = ProjectStatus.Live };   // geriye dönük kayıt: tahmin yazılmaz
        var dev = new Project { Status = ProjectStatus.Development };
        var keep = new Project { Status = ProjectStatus.Live, LiveDate = new DateTime(2025, 1, 1) };

        ProjectService.EnsureLiveDate(justWentLive, ProjectStatus.Pilot);
        ProjectService.EnsureLiveDate(alreadyLive, ProjectStatus.Live);
        ProjectService.EnsureLiveDate(dev, ProjectStatus.Development);
        ProjectService.EnsureLiveDate(keep, ProjectStatus.Pilot);

        Assert.Equal(DateTime.UtcNow.Date, justWentLive.LiveDate);
        Assert.Null(alreadyLive.LiveDate);
        Assert.Null(dev.LiveDate);
        Assert.Equal(new DateTime(2025, 1, 1), keep.LiveDate);
    }
}
