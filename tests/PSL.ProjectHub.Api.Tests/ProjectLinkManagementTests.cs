using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Domain.Enums;
using PSL.ProjectHub.Infrastructure.Services;
using Xunit;

namespace PSL.ProjectHub.Api.Tests;

public class ProjectLinkManagementTests
{
    [Fact]
    public async Task CreateLink_ValidLink_AddsSuccessfully()
    {
        using var context = TestHelpers.CreateInMemoryDbContext();
        var projectService = new ProjectService(context);
        var linkService = new ProjectLinkService(context);

        var project = await projectService.CreateProjectAsync(new CreateProjectRequest
        {
            Name = "Link Test Projesi",
            ShortDescription = "Açıklama",
            Category = "Test"
        });

        var request = new CreateLinkRequest
        {
            Label = "Canlı Uygulama",
            Url = "https://portal.gallerycrystal.com.tr",
            LinkType = LinkType.Production,
            Environment = EnvironmentType.Production,
            IsPrimary = true,
            RequiresVpn = true,
            RequiresAuthentication = true
        };

        var link = await linkService.CreateLinkAsync(project.Id, request);

        Assert.NotNull(link);
        Assert.Equal("Canlı Uygulama", link.Label);
        Assert.Equal("https://portal.gallerycrystal.com.tr", link.Url);
        Assert.True(link.IsPrimary);
        Assert.True(link.RequiresVpn);
        Assert.True(link.RequiresAuthentication);
    }

    [Fact]
    public async Task CreateLink_DuplicateUrlInSameProject_ThrowsInvalidOperationException()
    {
        using var context = TestHelpers.CreateInMemoryDbContext();
        var projectService = new ProjectService(context);
        var linkService = new ProjectLinkService(context);

        var project = await projectService.CreateProjectAsync(new CreateProjectRequest
        {
            Name = "Mükerrer Link Test Projesi",
            ShortDescription = "Açıklama",
            Category = "Test"
        });

        var request1 = new CreateLinkRequest
        {
            Label = "İlk Link",
            Url = "https://app.example.internal",
            LinkType = LinkType.Production
        };

        var request2 = new CreateLinkRequest
        {
            Label = "Aynı URL Tekrar",
            Url = "https://app.example.internal", // Duplicate
            LinkType = LinkType.Test
        };

        await linkService.CreateLinkAsync(project.Id, request1);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            linkService.CreateLinkAsync(project.Id, request2));

        Assert.Contains("zaten kayıtlıdır", ex.Message);
    }

    [Fact]
    public async Task CreateLink_DangerousProtocol_ThrowsArgumentException()
    {
        using var context = TestHelpers.CreateInMemoryDbContext();
        var projectService = new ProjectService(context);
        var linkService = new ProjectLinkService(context);

        var project = await projectService.CreateProjectAsync(new CreateProjectRequest
        {
            Name = "Güvenlik Test Projesi",
            ShortDescription = "Açıklama",
            Category = "Test"
        });

        var dangerousRequest = new CreateLinkRequest
        {
            Label = "XSS Saldırısı",
            Url = "javascript:alert(1)"
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            linkService.CreateLinkAsync(project.Id, dangerousRequest));

        Assert.Contains("Güvenlik uyarısı", ex.Message);
    }

    [Fact]
    public async Task SetPrimaryLink_TogglesOtherLinksToFalse()
    {
        using var context = TestHelpers.CreateInMemoryDbContext();
        var projectService = new ProjectService(context);
        var linkService = new ProjectLinkService(context);

        var project = await projectService.CreateProjectAsync(new CreateProjectRequest
        {
            Name = "Primary Test Projesi",
            ShortDescription = "Açıklama",
            Category = "Test"
        });

        var link1 = await linkService.CreateLinkAsync(project.Id, new CreateLinkRequest
        {
            Label = "Link 1",
            Url = "https://app1.example.internal",
            IsPrimary = true
        });

        var link2 = await linkService.CreateLinkAsync(project.Id, new CreateLinkRequest
        {
            Label = "Link 2",
            Url = "https://app2.example.internal",
            IsPrimary = true // this should make link1 non-primary
        });

        var links = await linkService.GetLinksByProjectIdAsync(project.Id);
        var updatedLink1 = links.First(l => l.Id == link1.Id);
        var updatedLink2 = links.First(l => l.Id == link2.Id);

        Assert.False(updatedLink1.IsPrimary);
        Assert.True(updatedLink2.IsPrimary);
    }

    [Fact]
    public async Task DeactivateLink_HidesFromDefaultList()
    {
        using var context = TestHelpers.CreateInMemoryDbContext();
        var projectService = new ProjectService(context);
        var linkService = new ProjectLinkService(context);

        var project = await projectService.CreateProjectAsync(new CreateProjectRequest
        {
            Name = "Deactive Test Projesi",
            ShortDescription = "Açıklama",
            Category = "Test"
        });

        var link = await linkService.CreateLinkAsync(project.Id, new CreateLinkRequest
        {
            Label = "Eski Link",
            Url = "https://old.example.internal"
        });

        // Deactivate
        await linkService.DeleteOrDeactivateLinkAsync(link.Id, hardDelete: false);

        // includeInactive: false should return empty
        var activeOnly = await linkService.GetLinksByProjectIdAsync(project.Id, includeInactive: false);
        Assert.Empty(activeOnly);

        // includeInactive: true should return the link with IsActive = false
        var withInactive = await linkService.GetLinksByProjectIdAsync(project.Id, includeInactive: true);
        Assert.Single(withInactive);
        Assert.False(withInactive[0].IsActive);
    }
}
