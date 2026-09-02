namespace PSL.ProjectHub.Application.DTOs;

/// <summary>
/// Denetim izi kaydını taşıyan DTO sınıfı.
/// </summary>
public class AuditLogDto
{
    public Guid Id { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? Username { get; set; }
    public string? Details { get; set; }
    public DateTime Timestamp { get; set; }
}