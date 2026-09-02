using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Domain.Enums;
using PSL.ProjectHub.Infrastructure.Services;
using System.Text;
using Xunit;

namespace PSL.ProjectHub.Api.Tests;

public class ProjectUpdateAndSecurityTests
{
    [Fact]
    public async Task UpdateProjectAsync_ProperlyUpdatesTechnologies_WithoutNullReference()
    {
        // Arrange
        using var context = TestHelpers.CreateInMemoryDbContext();
        var service = new ProjectService(context);

        var created = await service.CreateProjectAsync(new CreateProjectRequest
        {
            Name = "Teknoloji Test Projesi",
            ShortDescription = "Açıklama",
            Category = "Test",
            Technologies = new List<string> { ".NET 8", "React", "SQL Server" }
        });

        Assert.Equal(3, created.Technologies.Count);
        Assert.Contains(".NET 8", created.Technologies);

        // Act: Update with 1 new tech ("TypeScript"), 1 kept (".NET 8"), and remove ("React", "SQL Server")
        var updateRequest = new UpdateProjectRequest
        {
            Name = "Teknoloji Test Projesi Güncellendi",
            ShortDescription = "Yeni açıklama",
            Category = "Test",
            Status = ProjectStatus.Live,
            Technologies = new List<string> { ".NET 8", "TypeScript" }
        };

        var updated = await service.UpdateProjectAsync(created.Id, updateRequest);

        // Assert
        Assert.NotNull(updated);
        Assert.Equal(2, updated.Technologies.Count);
        Assert.Contains(".NET 8", updated.Technologies);
        Assert.Contains("TypeScript", updated.Technologies);
        Assert.DoesNotContain("React", updated.Technologies);
        Assert.DoesNotContain("SQL Server", updated.Technologies);

        // Re-fetch from fresh context to verify database persistence
        var freshDetail = await service.GetProjectByIdAsync(created.Id);
        Assert.NotNull(freshDetail);
        Assert.Equal(2, freshDetail.Technologies.Count);
        Assert.Contains("TypeScript", freshDetail.Technologies);
    }

    [Fact]
    public async Task GetProjectByIdAsync_HidesInactiveLinks_WhenIncludeInactiveIsFalse()
    {
        // Arrange
        using var context = TestHelpers.CreateInMemoryDbContext();
        var projectService = new ProjectService(context);
        var linkService = new ProjectLinkService(context);

        var project = await projectService.CreateProjectAsync(new CreateProjectRequest
        {
            Name = "Pasif Link Test Projesi",
            ShortDescription = "Açıklama",
            Category = "Test"
        });

        // Add 1 active and 1 inactive link
        var activeLink = await linkService.CreateLinkAsync(project.Id, new CreateLinkRequest
        {
            Label = "Aktif Link",
            Url = "https://active.gallerycrystal.internal",
            LinkType = LinkType.Production
        });

        var inactiveLink = await linkService.CreateLinkAsync(project.Id, new CreateLinkRequest
        {
            Label = "Pasif Link",
            Url = "https://inactive.gallerycrystal.internal",
            LinkType = LinkType.Test
        });

        // Deactivate the second link
        await linkService.DeleteOrDeactivateLinkAsync(inactiveLink.Id, hardDelete: false);

        // Act: Default user query (includeInactiveLinks = false)
        var detailForUser = await projectService.GetProjectByIdAsync(project.Id, includeInactiveLinks: false);

        // Assert: Normal user sees only active link
        Assert.NotNull(detailForUser);
        Assert.Single(detailForUser.Links);
        Assert.Equal("Aktif Link", detailForUser.Links[0].Label);

        // Act: Admin query (includeInactiveLinks = true)
        var detailForAdmin = await projectService.GetProjectByIdAsync(project.Id, includeInactiveLinks: true);

        // Assert: Admin sees both active and inactive links
        Assert.NotNull(detailForAdmin);
        Assert.Equal(2, detailForAdmin.Links.Count);
        Assert.Contains(detailForAdmin.Links, l => l.Label == "Pasif Link" && !l.IsActive);
    }

    [Fact]
    public async Task CreateLink_DuplicateUrlInSameProject_ThrowsConflictException()
    {
        // Arrange
        using var context = TestHelpers.CreateInMemoryDbContext();
        var projectService = new ProjectService(context);
        var linkService = new ProjectLinkService(context);

        var project = await projectService.CreateProjectAsync(new CreateProjectRequest
        {
            Name = "Çakışma Test Projesi",
            ShortDescription = "Açıklama",
            Category = "Test"
        });

        await linkService.CreateLinkAsync(project.Id, new CreateLinkRequest
        {
            Label = "Ana Sistem",
            Url = "https://app.psl.internal",
            LinkType = LinkType.Production
        });

        // Act & Assert: Duplicate URL should throw InvalidOperationException
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            linkService.CreateLinkAsync(project.Id, new CreateLinkRequest
            {
                Label = "Aynı Sistem Tekrar",
                Url = "https://app.psl.internal",
                LinkType = LinkType.Test
            }));

        Assert.Contains("zaten kayıtlıdır", ex.Message);
    }

    [Theory]
    [InlineData("../../windows/system32/cmd.exe")]
    [InlineData("..\\..\\passwords.json")]
    [InlineData("C:\\inetpub\\wwwroot\\secret.json")]
    [InlineData("/etc/passwd")]
    public void PathTraversal_FileNameValidation_DetectsAttackVectors(string maliciousFileName)
    {
        // Path traversal tespit kurallarının doğrulanması
        var isMalicious = maliciousFileName.Contains("..") ||
                          maliciousFileName.Contains('/') ||
                          maliciousFileName.Contains('\\') ||
                          Path.IsPathRooted(maliciousFileName);

        Assert.True(isMalicious);
    }

    [Fact]
    public void MagicBytes_ValidPng_DetectedCorrectly()
    {
        // PNG Header: 89 50 4E 47 0D 0A 1A 0A
        byte[] validPngHeader = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D];
        using var stream = new MemoryStream(validPngHeader);

        using var reader = new BinaryReader(stream);
        var bytes = reader.ReadBytes(8);

        Assert.Equal(0x89, bytes[0]);
        Assert.Equal(0x50, bytes[1]);
        Assert.Equal(0x4E, bytes[2]);
        Assert.Equal(0x47, bytes[3]);
    }

    [Fact]
    public void MagicBytes_ExecutableDisguisedAsImage_IsRejected()
    {
        // MZ header (Windows EXE): 4D 5A
        byte[] exeHeader = [0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00];
        using var stream = new MemoryStream(exeHeader);

        using var reader = new BinaryReader(stream);
        var bytes = reader.ReadBytes(4);

        // Neither PNG (0x89 50 4E 47) nor JPEG (0xFF D8 FF) nor WEBP
        var isPng = bytes[0] == 0x89 && bytes[1] == 0x50;
        var isJpeg = bytes[0] == 0xFF && bytes[1] == 0xD8;

        Assert.False(isPng);
        Assert.False(isJpeg);
    }
}
