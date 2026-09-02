using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Domain.Enums;
using PSL.ProjectHub.Infrastructure.Services;
using Xunit;

namespace PSL.ProjectHub.Api.Tests;

public class ProjectRestoreAndSubEntityTests
{
    [Fact]
    public async Task ArchiveAndRestoreProject_WorksCorrectly()
    {
        using var context = TestHelpers.CreateInMemoryDbContext();
        var service = new ProjectService(context);

        var created = await service.CreateProjectAsync(new CreateProjectRequest
        {
            Name = "Arşiv Test Projesi",
            ShortDescription = "Açıklama",
            Category = "Test"
        });

        // 1. Arşivle
        var archiveResult = await service.ArchiveProjectAsync(created.Id);
        Assert.True(archiveResult);

        // Global query filter nedeniyle normal sorguda görünmemeli
        var activeProjects = await service.GetAllProjectsAsync(includeArchived: false);
        Assert.DoesNotContain(activeProjects, p => p.Id == created.Id);

        // includeArchived: true ile görünmeli
        var allProjects = await service.GetAllProjectsAsync(includeArchived: true);
        Assert.Contains(allProjects, p => p.Id == created.Id);

        // 2. Geri Yükle (Restore)
        var restoreResult = await service.RestoreProjectAsync(created.Id);
        Assert.True(restoreResult);

        // Tekrar normal sorguda görünmeli
        activeProjects = await service.GetAllProjectsAsync(includeArchived: false);
        Assert.Contains(activeProjects, p => p.Id == created.Id);
    }

    [Fact]
    public async Task Component_CRUD_Operations_WorkCorrectly()
    {
        using var context = TestHelpers.CreateInMemoryDbContext();
        var service = new ProjectService(context);

        var project = await service.CreateProjectAsync(new CreateProjectRequest
        {
            Name = "Bileşen Test Projesi",
            ShortDescription = "Açıklama",
            Category = "Test"
        });

        // Add
        var addResult = await service.AddComponentAsync(project.Id, new ProjectComponentDto
        {
            Name = "Core API",
            ComponentType = ComponentType.API,
            Description = "İlk açıklama"
        });
        Assert.True(addResult);

        var detail = await service.GetProjectByIdAsync(project.Id);
        Assert.NotNull(detail);
        Assert.Single(detail.Components);
        var comp = detail.Components[0];
        Assert.Equal("Core API", comp.Name);

        // Update
        var updateResult = await service.UpdateComponentAsync(comp.Id, new ProjectComponentDto
        {
            Name = "Core API v2",
            ComponentType = ComponentType.API,
            Description = "Güncel açıklama"
        });
        Assert.True(updateResult);

        detail = await service.GetProjectByIdAsync(project.Id);
        Assert.Equal("Core API v2", detail!.Components[0].Name);
        Assert.Equal("Güncel açıklama", detail.Components[0].Description);

        // Delete
        var deleteResult = await service.DeleteComponentAsync(comp.Id);
        Assert.True(deleteResult);

        detail = await service.GetProjectByIdAsync(project.Id);
        Assert.Empty(detail!.Components);
    }

    [Fact]
    public async Task Integration_CRUD_Operations_WorkCorrectly()
    {
        using var context = TestHelpers.CreateInMemoryDbContext();
        var service = new ProjectService(context);

        var project = await service.CreateProjectAsync(new CreateProjectRequest
        {
            Name = "Entegrasyon Test Projesi",
            ShortDescription = "Açıklama",
            Category = "Test"
        });

        // Add
        var addResult = await service.AddIntegrationAsync(project.Id, new ProjectIntegrationDto
        {
            Name = "Nebim ERP",
            IntegrationType = "SQL",
            IsCritical = true
        });
        Assert.True(addResult);

        var detail = await service.GetProjectByIdAsync(project.Id);
        Assert.NotNull(detail);
        Assert.Single(detail.Integrations);
        var integ = detail.Integrations[0];

        // Update
        var updateResult = await service.UpdateIntegrationAsync(integ.Id, new ProjectIntegrationDto
        {
            Name = "Nebim ERP V3",
            IntegrationType = "REST API",
            IsCritical = false
        });
        Assert.True(updateResult);

        detail = await service.GetProjectByIdAsync(project.Id);
        Assert.Equal("Nebim ERP V3", detail!.Integrations[0].Name);
        Assert.False(detail.Integrations[0].IsCritical);

        // Delete
        var deleteResult = await service.DeleteIntegrationAsync(integ.Id);
        Assert.True(deleteResult);

        detail = await service.GetProjectByIdAsync(project.Id);
        Assert.Empty(detail!.Integrations);
    }

    [Fact]
    public async Task ReleaseAndNote_CRUD_Operations_WorkCorrectly()
    {
        using var context = TestHelpers.CreateInMemoryDbContext();
        var service = new ProjectService(context);

        var project = await service.CreateProjectAsync(new CreateProjectRequest
        {
            Name = "Sürüm Not Test Projesi",
            ShortDescription = "Açıklama",
            Category = "Test"
        });

        // Release Add
        await service.AddReleaseAsync(project.Id, new ProjectReleaseDto
        {
            Version = "v1.0.0",
            Title = "İlk Kararlı Sürüm"
        });

        var detail = await service.GetProjectByIdAsync(project.Id);
        Assert.Single(detail!.Releases);
        Assert.Equal("v1.0.0", detail.CurrentVersion);

        // Release Update
        var rel = detail.Releases[0];
        await service.UpdateReleaseAsync(rel.Id, new ProjectReleaseDto
        {
            Version = "v1.0.1",
            Title = "Yama Sürümü"
        });

        detail = await service.GetProjectByIdAsync(project.Id);
        Assert.Equal("v1.0.1", detail!.Releases[0].Version);

        // Release Delete
        await service.DeleteReleaseAsync(rel.Id);
        detail = await service.GetProjectByIdAsync(project.Id);
        Assert.Empty(detail!.Releases);

        // Note Add
        await service.AddNoteAsync(project.Id, new ProjectNoteDto
        {
            Title = "Mimari Karar",
            Content = "REST API standardı seçildi."
        });

        detail = await service.GetProjectByIdAsync(project.Id);
        Assert.Single(detail!.Notes);
        var note = detail.Notes[0];

        // Note Update
        await service.UpdateNoteAsync(note.Id, new ProjectNoteDto
        {
            Title = "Mimari Karar (Revize)",
            Content = "REST API + Dapper seçildi."
        });

        detail = await service.GetProjectByIdAsync(project.Id);
        Assert.Equal("Mimari Karar (Revize)", detail!.Notes[0].Title);

        // Note Delete
        await service.DeleteNoteAsync(note.Id);
        detail = await service.GetProjectByIdAsync(project.Id);
        Assert.Empty(detail!.Notes);
    }
}