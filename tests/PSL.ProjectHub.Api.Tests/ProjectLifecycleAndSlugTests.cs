using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Domain.Enums;
using PSL.ProjectHub.Infrastructure.Services;
using Xunit;

namespace PSL.ProjectHub.Api.Tests;

public class ProjectLifecycleAndSlugTests
{
    [Fact]
    public async Task CreateProject_NormalizesSlugAndSaves()
    {
        using var context = TestHelpers.CreateInMemoryDbContext();
        var service = new ProjectService(context);

        var request = new CreateProjectRequest
        {
            Name = "Yeni Şirket Projesi",
            ShortDescription = "Kısa test açıklaması",
            Category = "Lojistik",
            Status = ProjectStatus.Development
        };

        var result = await service.CreateProjectAsync(request);

        Assert.NotNull(result);
        Assert.Equal("Yeni Şirket Projesi", result.Name);
        Assert.Equal("yeni-sirket-projesi", result.Slug);
        Assert.Equal("Lojistik", result.Category);
        Assert.Equal(ProjectStatus.Development, result.Status);
    }

    [Fact]
    public async Task CreateProject_DuplicateSlug_AppendsCounterToEnsureUniqueness()
    {
        using var context = TestHelpers.CreateInMemoryDbContext();
        var service = new ProjectService(context);

        var request1 = new CreateProjectRequest
        {
            Name = "Aynı İsimli Proje",
            ShortDescription = "İlk proje",
            Category = "Genel"
        };

        var request2 = new CreateProjectRequest
        {
            Name = "Aynı İsimli Proje",
            ShortDescription = "İkinci proje",
            Category = "Genel"
        };

        var p1 = await service.CreateProjectAsync(request1);
        var p2 = await service.CreateProjectAsync(request2);

        Assert.Equal("ayni-isimli-proje", p1.Slug);
        Assert.Equal("ayni-isimli-proje-1", p2.Slug);
    }

    [Fact]
    public async Task ArchiveProject_SetsIsArchivedAndHidesFromDefaultList()
    {
        using var context = TestHelpers.CreateInMemoryDbContext();
        var service = new ProjectService(context);

        var created = await service.CreateProjectAsync(new CreateProjectRequest
        {
            Name = "Arşivlenecek Proje",
            ShortDescription = "Test",
            Category = "İK"
        });

        // Verify it exists in list
        var listBefore = await service.GetAllProjectsAsync();
        Assert.Single(listBefore);

        // Archive it
        var archived = await service.ArchiveProjectAsync(created.Id);
        Assert.True(archived);

        // Verify it is hidden from default list
        var listAfter = await service.GetAllProjectsAsync(includeArchived: false);
        Assert.Empty(listAfter);

        // Verify it appears when includeArchived = true
        var listWithArchived = await service.GetAllProjectsAsync(includeArchived: true);
        Assert.Single(listWithArchived);
        Assert.True(listWithArchived[0].IsArchived);
    }

    [Fact]
    public async Task GetAllProjects_FiltersBySearchAndStatus()
    {
        using var context = TestHelpers.CreateInMemoryDbContext();
        var service = new ProjectService(context);

        await service.CreateProjectAsync(new CreateProjectRequest
        {
            Name = "Nebim Satış Portalı",
            ShortDescription = "Satış entegrasyonu",
            Category = "Satış",
            Status = ProjectStatus.Live
        });

        await service.CreateProjectAsync(new CreateProjectRequest
        {
            Name = "Depo WMS Sistemi",
            ShortDescription = "Depo yönetimi",
            Category = "Lojistik",
            Status = ProjectStatus.Development
        });

        // Search by keyword "Nebim"
        var searchResults = await service.GetAllProjectsAsync(search: "Nebim");
        Assert.Single(searchResults);
        Assert.Equal("Nebim Satış Portalı", searchResults[0].Name);

        // Filter by Status = Development
        var devResults = await service.GetAllProjectsAsync(status: ProjectStatus.Development);
        Assert.Single(devResults);
        Assert.Equal("Depo WMS Sistemi", devResults[0].Name);

        // Filter by Category = Lojistik
        var logResults = await service.GetAllProjectsAsync(category: "Lojistik");
        Assert.Single(logResults);
    }
}
