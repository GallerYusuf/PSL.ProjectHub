using PSL.ProjectHub.Application.DTOs;

namespace PSL.ProjectHub.Application.Interfaces;

/// <summary>
/// Sistem genelindeki operasyonel ve idari değişikliklerin denetim izini (Audit Trail)
/// kaydetmek ve sorgulamak için kullanılan servis arayüzü.
/// </summary>
public interface IAuditLogService
{
    /// <summary>
    /// Yeni bir denetim kaydı oluşturur.
    /// </summary>
    Task LogAsync(string entityName, string entityId, string action, string? userId, string? username, string? details, CancellationToken cancellationToken = default);

    /// <summary>
    /// Belirli bir varlığa (Örn: belirli bir projeye) ait denetim kayıtlarını listeler.
    /// </summary>
    Task<List<AuditLogDto>> GetLogsAsync(string entityName, string entityId, int take = 50, CancellationToken cancellationToken = default);
}