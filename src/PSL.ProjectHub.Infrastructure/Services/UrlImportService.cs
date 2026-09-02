using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using PSL.ProjectHub.Application.Common;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Application.Interfaces;
using PSL.ProjectHub.Domain.Entities;
using PSL.ProjectHub.Domain.Enums;
using PSL.ProjectHub.Infrastructure.Data;

namespace PSL.ProjectHub.Infrastructure.Services;

public class UrlImportService : IUrlImportService
{
    private readonly AppDbContext _context;

    public UrlImportService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<UrlImportResultDto> ImportFromJsonFileAsync(string filePath, CancellationToken cancellationToken = default)
    {
        var result = new UrlImportResultDto();

        if (!File.Exists(filePath))
        {
            result.Messages.Add($"Hata: '{filePath}' dosyası bulunamadı.");
            return result;
        }

        try
        {
            var json = await File.ReadAllTextAsync(filePath, cancellationToken);
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
            var items = JsonSerializer.Deserialize<List<UrlImportItemDto>>(json, options);
            if (items == null || items.Count == 0)
            {
                result.Messages.Add("İçe aktarılacak proje URL verisi bulunamadı.");
                return result;
            }

            return await ImportUrlsAsync(items, cancellationToken);
        }
        catch (Exception ex)
        {
            result.Messages.Add($"JSON okuma hatası: {ex.Message}");
            return result;
        }
    }

    public async Task<UrlImportResultDto> ImportUrlsAsync(List<UrlImportItemDto> items, CancellationToken cancellationToken = default)
    {
        var result = new UrlImportResultDto();

        foreach (var item in items)
        {
            if (string.IsNullOrWhiteSpace(item.ProjectKey))
            {
                result.Messages.Add("Uyarı: Proje anahtarı (projectKey) boş olan kayıt atlandı.");
                result.TotalLinksSkipped += item.Links?.Count ?? 0;
                continue;
            }

            var cleanSlug = UrlValidator.NormalizeSlug(item.ProjectKey);
            var project = await _context.Projects
                .Include(p => p.Links)
                .FirstOrDefaultAsync(p => p.Slug.ToLower() == cleanSlug.ToLower(), cancellationToken);

            if (project == null)
            {
                result.Messages.Add($"Uyarı: '{item.ProjectKey}' anahtarına sahip proje sistemde bulunamadı. Bağlantılar atlandı.");
                result.TotalLinksSkipped += item.Links?.Count ?? 0;
                continue;
            }

            result.TotalProjectsProcessed++;

            if (item.Links == null || item.Links.Count == 0) continue;

            foreach (var linkDto in item.Links)
            {
                var (isValid, errorMessage) = UrlValidator.ValidateUrl(linkDto.Url);
                if (!isValid)
                {
                    result.Messages.Add($"Geçersiz URL ('{linkDto.Url}') atlandı: {errorMessage}");
                    result.TotalLinksSkipped++;
                    continue;
                }

                var normalizedUrl = linkDto.Url.Trim();

                // Enum parsing
                if (!Enum.TryParse<LinkType>(linkDto.LinkType, true, out var linkType))
                {
                    linkType = LinkType.Other;
                }

                if (!Enum.TryParse<EnvironmentType>(linkDto.Environment, true, out var envType))
                {
                    envType = EnvironmentType.Production;
                }

                // Check existing link with same URL in this project
                var existingLink = project.Links
                    .FirstOrDefault(l => l.Url.Equals(normalizedUrl, StringComparison.OrdinalIgnoreCase));

                if (existingLink != null)
                {
                    // Update existing link (Idempotent, no duplicates)
                    existingLink.Label = string.IsNullOrWhiteSpace(linkDto.Label) ? existingLink.Label : linkDto.Label.Trim();
                    existingLink.LinkType = linkType;
                    existingLink.Environment = envType;
                    existingLink.IsPrimary = linkDto.IsPrimary;
                    existingLink.RequiresVpn = linkDto.RequiresVpn;
                    existingLink.RequiresAuthentication = linkDto.RequiresAuthentication;
                    existingLink.OpenInNewTab = linkDto.OpenInNewTab;
                    existingLink.DisplayOrder = linkDto.DisplayOrder;
                    existingLink.IsActive = true;
                    existingLink.UpdatedAt = DateTime.UtcNow;

                    result.TotalLinksUpdated++;
                }
                else
                {
                    // Add new link
                    var newLink = new ProjectLink
                    {
                        ProjectId = project.Id,
                        Label = string.IsNullOrWhiteSpace(linkDto.Label) ? "Uygulama Bağlantısı" : linkDto.Label.Trim(),
                        Url = normalizedUrl,
                        LinkType = linkType,
                        Environment = envType,
                        IsPrimary = linkDto.IsPrimary,
                        RequiresVpn = linkDto.RequiresVpn,
                        RequiresAuthentication = linkDto.RequiresAuthentication,
                        OpenInNewTab = linkDto.OpenInNewTab,
                        DisplayOrder = linkDto.DisplayOrder,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.ProjectLinks.Add(newLink);
                    result.TotalLinksAdded++;
                }

                // If marked primary, ensure other links in the project are not primary
                if (linkDto.IsPrimary)
                {
                    foreach (var otherLink in project.Links.Where(l => !l.Url.Equals(normalizedUrl, StringComparison.OrdinalIgnoreCase)))
                    {
                        otherLink.IsPrimary = false;
                    }
                }
            }

            project.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
        result.Messages.Add($"İşlem tamamlandı. {result.TotalProjectsProcessed} proje işlendi, {result.TotalLinksAdded} yeni bağlantı eklendi, {result.TotalLinksUpdated} bağlantı güncellendi, {result.TotalLinksSkipped} bağlantı atlandı.");

        return result;
    }
}
