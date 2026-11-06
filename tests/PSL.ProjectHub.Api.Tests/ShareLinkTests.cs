using System.Security.Claims;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging.Abstractions;
using PSL.ProjectHub.Api.Controllers;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Domain.Entities;
using PSL.ProjectHub.Domain.Enums;
using PSL.ProjectHub.Infrastructure.Data;
using PSL.ProjectHub.Infrastructure.Services;
using Xunit;

namespace PSL.ProjectHub.Api.Tests;

public class ShareLinkTests
{
    private sealed class TestEnv : IWebHostEnvironment
    {
        public string WebRootPath { get; set; } = Path.GetTempPath();
        public IFileProvider WebRootFileProvider { get; set; } = new NullFileProvider();
        public string ApplicationName { get; set; } = "tests";
        public IFileProvider ContentRootFileProvider { get; set; } = new NullFileProvider();
        public string ContentRootPath { get; set; } = Path.Combine(Path.GetTempPath(), "projecthub-tests-" + Guid.NewGuid().ToString("N"));
        public string EnvironmentName { get; set; } = "Testing";
    }

    private static ShareController Controller(AppDbContext ctx)
    {
        var controller = new ShareController(ctx, new AuditLogService(ctx, NullLogger<AuditLogService>.Instance),
            new ConfigurationBuilder().Build(), new TestEnv());
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

    private static (AppDbContext ctx, Project shared, Project other) Seed()
    {
        var ctx = TestHelpers.CreateInMemoryDbContext();
        var shared = new Project { Name = "B2B Panel", Slug = "b2b", ShortDescription = "x", Category = "Satış", Status = ProjectStatus.Live };
        shared.Links.Add(new ProjectLink { Label = "Admin", Url = "https://b2b.firma.com/admin", LinkType = LinkType.AdminPanel, IsPrimary = true });
        shared.Links.Add(new ProjectLink { Label = "İç", Url = "http://10.0.0.5", LinkType = LinkType.Production, Environment = EnvironmentType.Internal, RequiresVpn = true });
        shared.Links.Add(new ProjectLink { Label = "Canlı", Url = "https://b2b.firma.com", LinkType = LinkType.Production });
        var other = new Project { Name = "Gizli", Slug = "gizli", ShortDescription = "y", Category = "İç", Status = ProjectStatus.Live };
        ctx.Projects.AddRange(shared, other);
        ctx.SaveChanges();
        return (ctx, shared, other);
    }

    private static async Task<CreatedShareLinkDto> CreateLink(ShareController c, params Guid[] ids)
    {
        var result = await c.Create(new CreateShareLinkRequest { Title = "Yönetim Kurulu", ProjectIds = ids.ToList(), ExpiresInDays = 7 }, default);
        return Assert.IsType<CreatedShareLinkDto>(Assert.IsType<OkObjectResult>(result.Result).Value);
    }

    [Fact]
    public async Task Create_StoresOnlyHash_AndTokenOpensDeckWithOnlySharedProjects()
    {
        var (ctx, shared, _) = Seed();
        var c = Controller(ctx);
        var created = await CreateLink(c, shared.Id);

        Assert.True(created.Token.Length >= 40);
        var stored = await ctx.ShareLinks.SingleAsync();
        Assert.NotEqual(created.Token, stored.TokenHash);
        Assert.Equal(ShareController.HashToken(created.Token), stored.TokenHash);

        var view = await c.View(created.Token, default);
        var deck = Assert.IsType<DeckDto>(Assert.IsType<OkObjectResult>(view.Result).Value);
        Assert.Equal("Yönetim Kurulu", deck.Title);
        Assert.Single(deck.Projects);
        Assert.Equal("B2B Panel", deck.Projects[0].Name);
        Assert.Equal(1, (await ctx.ShareLinks.SingleAsync()).ViewCount);
    }

    [Fact]
    public async Task PublicDeck_NeverExposesAdminOrVpnLinks()
    {
        var (ctx, shared, _) = Seed();
        var c = Controller(ctx);
        var created = await CreateLink(c, shared.Id);

        var deck = Assert.IsType<DeckDto>(Assert.IsType<OkObjectResult>((await c.View(created.Token, default)).Result).Value);
        Assert.Equal("https://b2b.firma.com", deck.Projects[0].LiveUrl);

        // İç görünümde birincil (admin) bağlantı seçilebilir; paylaşımda asla
        Assert.Equal("https://b2b.firma.com/admin", DeckBuilder.SelectLiveUrl(shared.Links, publicView: false));
    }

    [Fact]
    public void LiveUrl_IsNeverARepositoryOrApiAddress_EvenInternally()
    {
        var links = new List<ProjectLink>
        {
            new() { Url = "https://github.com/firma/proje", LinkType = LinkType.Repository, IsPrimary = true },
            new() { Url = "http://88.0.0.1:5000", LinkType = LinkType.Api },
        };
        Assert.Null(DeckBuilder.SelectLiveUrl(links, publicView: false));
        Assert.Null(DeckBuilder.SelectLiveUrl(links, publicView: true));
    }

    [Theory]
    [InlineData("revoked")]
    [InlineData("expired")]
    [InlineData("wrong")]
    public async Task View_Returns404_ForRevokedExpiredOrUnknownTokens(string scenario)
    {
        var (ctx, shared, _) = Seed();
        var c = Controller(ctx);
        var created = await CreateLink(c, shared.Id);
        var token = created.Token;

        if (scenario == "revoked") await c.Revoke(created.Id, default);
        if (scenario == "expired")
        {
            var link = await ctx.ShareLinks.SingleAsync();
            link.ExpiresAt = DateTime.UtcNow.AddMinutes(-1);
            await ctx.SaveChangesAsync();
        }
        if (scenario == "wrong") token = ShareController.GenerateToken();

        Assert.IsType<NotFoundObjectResult>((await c.View(token, default)).Result);
    }

    [Fact]
    public async Task Screenshot_FromProjectOutsideTheShare_IsNotServed()
    {
        var (ctx, shared, other) = Seed();
        var foreignShot = new ProjectScreenshot { ProjectId = other.Id, FileName = "gizli.png" };
        ctx.ProjectScreenshots.Add(foreignShot);
        await ctx.SaveChangesAsync();

        var c = Controller(ctx);
        var created = await CreateLink(c, shared.Id);

        Assert.IsType<NotFoundResult>(await c.Screenshot(created.Token, foreignShot.Id, default));
    }

    [Fact]
    public async Task Create_RejectsUnknownProjects()
    {
        var (ctx, _, _) = Seed();
        var result = await Controller(ctx).Create(
            new CreateShareLinkRequest { Title = "x", ProjectIds = [Guid.NewGuid()], ExpiresInDays = 7 }, default);
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }
}
