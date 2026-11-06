namespace PSL.ProjectHub.Application.DTOs;

/// <summary>
/// Giriş ekranı dahil herkese açık marka bilgileri. Kişisel bilgi içermez.
/// </summary>
public class BrandingDto
{
    public string OrganizationName { get; set; } = string.Empty;
    public string TeamName { get; set; } = string.Empty;
    public string? Tagline { get; set; }
    public string AccentColor { get; set; } = "#0f4c81";
    public string? LogoUrl { get; set; }
}

/// <summary>
/// Oturum açmış kullanıcılara dönen tam firma ayarları.
/// </summary>
public class OrganizationSettingsDto : BrandingDto
{
    public string? DirectorName { get; set; }
    public string? DirectorTitle { get; set; }
}

public class UpdateOrganizationSettingsRequest
{
    public string OrganizationName { get; set; } = string.Empty;
    public string TeamName { get; set; } = string.Empty;
    public string? DirectorName { get; set; }
    public string? DirectorTitle { get; set; }
    public string? Tagline { get; set; }
    public string AccentColor { get; set; } = "#0f4c81";
}
