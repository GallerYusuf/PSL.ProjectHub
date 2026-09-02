using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Application.Interfaces;
using PSL.ProjectHub.Domain.Entities;
using PSL.ProjectHub.Infrastructure.Data;

namespace PSL.ProjectHub.Infrastructure.Services;

/// <summary>
/// Denetim izi (Audit Log) kayıt ve okuma işlemlerini gerçekleştiren servis implementasyonu.
/// </summary>
public class AuditLogService : IAuditLogService
{
    private readonly AppDbContext _context;
    private readonly ILogger<AuditLogService> _logger;

    public AuditLogService(AppDbContext context, ILogger<AuditLogService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task LogAsync(
        string entityName,
        string entityId,
        string action,
        string? userId,
        string? username,
        string? details,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var log = new AuditLog
            {
                EntityName = entityName,
                EntityId = entityId,
                Action = action,
                UserId = userId,
                Username = username,
                Details = details,
                Timestamp = DateTime.UtcNow
            };

            _context.AuditLogs.Add(log);
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            // Denetim kaydı atılırken hata oluşursa ana iş akışını kırmamak için hata loglanır
            _logger.LogError(ex, "Denetim kaydı oluşturulurken hata meydana geldi: {EntityName} - {EntityId}", entityName, entityId);
        }
    }

    public async Task<List<AuditLogDto>> GetLogsAsync(
        string entityName,
        string entityId,
        int take = 50,
        CancellationToken cancellationToken = default)
    {
        return await _context.AuditLogs
            .AsNoTracking()
            .Where(a => a.EntityName == entityName && a.EntityId == entityId)
            .OrderByDescending(a => a.Timestamp)
            .Take(take)
            .Select(a => new AuditLogDto
            {
                Id = a.Id,
                EntityName = a.EntityName,
                EntityId = a.EntityId,
                Action = a.Action,
                Username = a.Username,
                Details = a.Details,
                Timestamp = a.Timestamp
            })
            .ToListAsync(cancellationToken);
    }
}