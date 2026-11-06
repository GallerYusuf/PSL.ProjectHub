using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using PSL.ProjectHub.Api.Controllers;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Domain.Entities;
using PSL.ProjectHub.Domain.Enums;
using PSL.ProjectHub.Infrastructure.Data;
using PSL.ProjectHub.Infrastructure.Services;
using Xunit;

namespace PSL.ProjectHub.Api.Tests;

public class ImpactAndTeamTests
{
    private static T WithUser<T>(T controller) where T : ControllerBase
    {
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    [new Claim(ClaimTypes.NameIdentifier, "u1"), new Claim(ClaimTypes.Name, "admin")], "test"))
            }
        };
        return controller;
    }

    private static (AppDbContext ctx, Project project) Seed(string name = "B2B Panel")
    {
        var ctx = TestHelpers.CreateInMemoryDbContext();
        var project = new Project { Name = name, Slug = name.ToLowerInvariant().Replace(' ', '-'), ShortDescription = "x", Category = "Satış" };
        ctx.Projects.Add(project);
        ctx.SaveChanges();
        return (ctx, project);
    }

    private static ImpactController Impact(AppDbContext ctx) =>
        WithUser(new ImpactController(ctx, new AuditLogService(ctx, NullLogger<AuditLogService>.Instance)));

    private static TeamController Team(AppDbContext ctx) =>
        WithUser(new TeamController(ctx, new AuditLogService(ctx, NullLogger<AuditLogService>.Instance)));

    [Fact]
    public void ComputeSummary_SumsFixedUnitKinds_AndPicksOneHighlightPerProject()
    {
        var a = new Project { Id = Guid.NewGuid(), Name = "A", Slug = "a" };
        var b = new Project { Id = Guid.NewGuid(), Name = "B", Slug = "b" };
        var metrics = new List<ProjectMetric>
        {
            new() { ProjectId = a.Id, Project = a, Kind = ImpactKind.Users, Label = "Bayi", Value = 45 },
            new() { ProjectId = a.Id, Project = a, Kind = ImpactKind.TimeSaved, Label = "Manuel iş", Value = 120 },
            new() { ProjectId = b.Id, Project = b, Kind = ImpactKind.TimeSaved, Label = "Fatura girişi", Value = 80 },
            new() { ProjectId = b.Id, Project = b, Kind = ImpactKind.Volume, Label = "Fatura", Value = 300, Unit = "fatura/gün" },
            new() { ProjectId = b.Id, Project = b, Kind = ImpactKind.CostSaving, Label = "Lisans", Value = 50000 },
        };

        var summary = ImpactController.ComputeSummary(metrics);

        Assert.Equal(200, summary.HoursSavedPerMonth);
        Assert.Equal(45, summary.UsersReached);
        Assert.Equal(50000, summary.CostSavingPerYear);
        Assert.Equal(2, summary.ProjectsWithMetrics);
        // Her projeden zaman tasarrufu öne çıkar; büyük değer önce
        Assert.Equal(new[] { "A", "B" }, summary.Highlights.Select(h => h.ProjectName));
        Assert.All(summary.Highlights, h => Assert.Equal("saat/ay", h.Unit));
    }

    [Fact]
    public async Task CreateMetric_RequiresUnit_ForFreeUnitKinds_AndIgnoresUnitForFixedKinds()
    {
        var (ctx, project) = Seed();
        var controller = Impact(ctx);

        var missingUnit = await controller.Create(project.Id,
            new UpsertProjectMetricRequest { Kind = ImpactKind.Volume, Label = "Fatura", Value = 300 }, default);
        Assert.IsType<BadRequestObjectResult>(missingUnit.Result);

        var ok = await controller.Create(project.Id,
            new UpsertProjectMetricRequest { Kind = ImpactKind.TimeSaved, Label = "Manuel iş", Value = 120, Unit = "dakika" }, default);
        var dto = Assert.IsType<ProjectMetricDto>(Assert.IsType<OkObjectResult>(ok.Result).Value);
        Assert.Equal("saat/ay", dto.Unit);
        Assert.Null((await ctx.ProjectMetrics.SingleAsync()).Unit);
    }

    [Fact]
    public async Task ArchivedProjects_AreExcludedFromImpactSummary()
    {
        var (ctx, project) = Seed();
        ctx.ProjectMetrics.Add(new ProjectMetric { ProjectId = project.Id, Kind = ImpactKind.TimeSaved, Label = "x", Value = 10 });
        project.IsArchived = true;
        await ctx.SaveChangesAsync();

        var result = await Impact(ctx).GetSummary(default);
        var summary = Assert.IsType<ImpactSummaryDto>(Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Equal(0, summary.HoursSavedPerMonth);
    }

    [Fact]
    public async Task AssignMember_CreatesMemberInline_AndLeadBecomesProjectOwner()
    {
        var (ctx, project) = Seed();
        var team = Team(ctx);

        await team.AssignMember(project.Id, new AssignProjectMemberRequest { NewMemberName = "Ayşe Yılmaz", Role = "Geliştirici", IsLead = true }, default);
        Assert.Equal("Ayşe Yılmaz", (await ctx.Projects.SingleAsync()).OwnerName);

        // İkinci lider atanınca birincinin liderliği düşer ve sorumlu değişir
        await team.AssignMember(project.Id, new AssignProjectMemberRequest { NewMemberName = "Mehmet Kaya", Role = "Analist", IsLead = true }, default);
        var members = await ctx.ProjectMembers.Include(pm => pm.TeamMember).ToListAsync();
        Assert.Single(members, m => m.IsLead);
        Assert.Equal("Mehmet Kaya", members.Single(m => m.IsLead).TeamMember.FullName);
        Assert.Equal("Mehmet Kaya", (await ctx.Projects.SingleAsync()).OwnerName);

        // Aynı isimle tekrar atama yeni üye oluşturmaz, rolü günceller
        await team.AssignMember(project.Id, new AssignProjectMemberRequest { NewMemberName = "Ayşe Yılmaz", Role = "Teknik Lider" }, default);
        Assert.Equal(2, await ctx.TeamMembers.CountAsync());
        Assert.Equal("Teknik Lider", (await ctx.ProjectMembers.Include(p => p.TeamMember).SingleAsync(p => p.TeamMember.FullName == "Ayşe Yılmaz")).Role);
    }

    [Fact]
    public async Task RemovingLead_ClearsProjectOwner()
    {
        var (ctx, project) = Seed();
        var team = Team(ctx);
        var assigned = await team.AssignMember(project.Id, new AssignProjectMemberRequest { NewMemberName = "Ayşe Yılmaz", Role = "Geliştirici", IsLead = true }, default);
        var dto = Assert.IsType<ProjectMemberDto>(Assert.IsType<OkObjectResult>(assigned.Result).Value);

        await team.RemoveMember(project.Id, dto.TeamMemberId, default);

        Assert.Null((await ctx.Projects.SingleAsync()).OwnerName);
        Assert.Empty(await ctx.ProjectMembers.ToListAsync());
        Assert.Single(await ctx.TeamMembers.ToListAsync()); // üye ekipte kalır
    }

    [Fact]
    public async Task AssignMember_RequiresMemberIdOrName()
    {
        var (ctx, project) = Seed();
        var result = await Team(ctx).AssignMember(project.Id, new AssignProjectMemberRequest { Role = "Geliştirici" }, default);
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }
}
