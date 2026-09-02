using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Infrastructure.Services;
using Xunit;

namespace PSL.ProjectHub.Api.Tests;

public class UrlImportTests
{
    [Fact]
    public async Task ImportUrlsAsync_IsIdempotent_DoesNotCreateDuplicatesOnMultipleRuns()
    {
        using var context = TestHelpers.CreateInMemoryDbContext();
        var projectService = new ProjectService(context);
        var importService = new UrlImportService(context);

        var project = await projectService.CreateProjectAsync(new CreateProjectRequest
        {
            Name = "Müşteri Platformu",
            Slug = "musteri-platformu",
            ShortDescription = "Açıklama",
            Category = "Satış"
        });

        var importData = new List<UrlImportItemDto>
        {
            new()
            {
                ProjectKey = "musteri-platformu",
                Links = new List<UrlImportLinkDto>
                {
                    new()
                    {
                        Label = "Canlı Portal",
                        Url = "https://customer.gallerycrystal.internal",
                        LinkType = "Production",
                        Environment = "Production",
                        IsPrimary = true,
                        RequiresVpn = true,
                        RequiresAuthentication = true
                    },
                    new()
                    {
                        Label = "API Swagger",
                        Url = "https://customer-api.gallerycrystal.internal/swagger",
                        LinkType = "Swagger",
                        Environment = "Production",
                        IsPrimary = false,
                        RequiresVpn = true
                    }
                }
            }
        };

        // First Import
        var firstResult = await importService.ImportUrlsAsync(importData);
        Assert.Equal(1, firstResult.TotalProjectsProcessed);
        Assert.Equal(2, firstResult.TotalLinksAdded);
        Assert.Equal(0, firstResult.TotalLinksUpdated);
        Assert.Equal(0, firstResult.TotalLinksSkipped);

        // Verify in DB
        var detailAfterFirst = await projectService.GetProjectByIdAsync(project.Id);
        Assert.NotNull(detailAfterFirst);
        Assert.Equal(2, detailAfterFirst.Links.Count);

        // Second Import with same data + 1 updated label
        importData[0].Links[0].Label = "Güncellenmiş Canlı Portal";
        var secondResult = await importService.ImportUrlsAsync(importData);

        // Verify idempotency: 0 links added, 2 links updated, 0 duplicates
        Assert.Equal(0, secondResult.TotalLinksAdded);
        Assert.Equal(2, secondResult.TotalLinksUpdated);

        var detailAfterSecond = await projectService.GetProjectByIdAsync(project.Id);
        Assert.NotNull(detailAfterSecond);
        Assert.Equal(2, detailAfterSecond.Links.Count);
        Assert.Contains(detailAfterSecond.Links, l => l.Label == "Güncellenmiş Canlı Portal");
    }

    [Fact]
    public async Task ImportUrlsAsync_SkipsNonExistentProjectsAndDangerousUrls()
    {
        using var context = TestHelpers.CreateInMemoryDbContext();
        var importService = new UrlImportService(context);

        var importData = new List<UrlImportItemDto>
        {
            new()
            {
                ProjectKey = "olmayan-proje-anahtari",
                Links = new List<UrlImportLinkDto>
                {
                    new() { Label = "Test", Url = "https://example.internal" }
                }
            }
        };

        var result = await importService.ImportUrlsAsync(importData);

        Assert.Equal(0, result.TotalProjectsProcessed);
        Assert.Equal(0, result.TotalLinksAdded);
        Assert.Equal(1, result.TotalLinksSkipped);
        Assert.Contains(result.Messages, m => m.Contains("sistemde bulunamadı"));
    }
}
