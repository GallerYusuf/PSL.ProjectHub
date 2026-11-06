using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Infrastructure.Data;
using PSL.ProjectHub.Infrastructure.Identity;

namespace PSL.ProjectHub.Api.Controllers;

/// <summary>
/// Sistem ilk kurulum endpoint''leri.
/// Bu endpoint''ler yalnızca sistemde hiç kullanıcı bulunmadığında çalışır.
/// Kurulum tamamlandıktan sonra tüm endpoint''ler 409 Conflict döndürür.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public class SetupController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly DataSeeder _seeder;
    private readonly AppDbContext _context;
    private readonly ILogger<SetupController> _logger;

    public SetupController(
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        DataSeeder seeder,
        AppDbContext context,
        ILogger<SetupController> logger)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
        _seeder = seeder;
        _logger = logger;
    }

    /// <summary>
    /// ASP.NET Identity hata kodlarını kullanıcının anlayacağı Türkçe açıklamalara çevirir.
    /// </summary>
    public static string TranslateIdentityError(string code, string fallback) => code switch
    {
        "PasswordTooShort" => "Şifre en az 8 karakter olmalı.",
        "PasswordRequiresDigit" => "Şifre en az bir rakam içermeli.",
        "PasswordRequiresLower" => "Şifre en az bir küçük harf içermeli.",
        "PasswordRequiresUpper" => "Şifre en az bir büyük harf içermeli.",
        "PasswordRequiresNonAlphanumeric" => "Şifre en az bir sembol içermeli (örn. ! * . -).",
        "PasswordRequiresUniqueChars" => "Şifrede daha fazla farklı karakter kullanılmalı.",
        "InvalidUserName" => "Kullanıcı adı yalnızca harf, rakam ve - . _ @ + karakterlerini içerebilir.",
        "DuplicateUserName" => "Bu kullanıcı adı zaten kullanılıyor.",
        "InvalidEmail" => "E-posta adresi geçersiz.",
        "DuplicateEmail" => "Bu e-posta adresi zaten kullanılıyor.",
        _ => fallback
    };

    /// <summary>
    /// Sistemin ilk kurulum durumunu döndürür.
    /// Hassas sistem bilgisi içermez.
    /// </summary>
    [HttpGet("status")]
    public async Task<ActionResult<SetupStatusResponse>> GetStatus()
    {
        var hasUsers = await _userManager.Users.AnyAsync();
        return Ok(new SetupStatusResponse
        {
            IsInitialized = hasUsers,
            Message = hasUsers
                ? "Sistem yapılandırılmış."
                : "İlk kurulum gerekiyor."
        });
    }

    /// <summary>
    /// İlk admin kullanıcısını ve sistem verilerini oluşturur.
    /// Yalnızca sistemde hiç kullanıcı yokken çalışır.
    /// </summary>
    [HttpPost("initialize")]
    public async Task<IActionResult> Initialize([FromBody] InitializeSystemRequest request)
    {
        // Zaten kuruluysa tekrar kullanılamaz
        if (await _userManager.Users.AnyAsync())
        {
            return Conflict(new { message = "Sistem zaten yapılandırılmış. Bu endpoint devre dışıdır." });
        }

        // Temel doğrulama
        if (string.IsNullOrWhiteSpace(request.AdminUsername) ||
            string.IsNullOrWhiteSpace(request.AdminEmail) ||
            string.IsNullOrWhiteSpace(request.AdminPassword) ||
            string.IsNullOrWhiteSpace(request.AdminFullName))
        {
            return BadRequest(new { message = "Tüm alanlar zorunludur." });
        }

        if (request.AdminPassword.Length < 8)
        {
            return BadRequest(new { message = "Şifre en az 8 karakter olmalıdır." });
        }

        if (string.IsNullOrWhiteSpace(request.OrganizationName))
        {
            return BadRequest(new { message = "Firma adı zorunludur." });
        }

        if (!string.IsNullOrWhiteSpace(request.AccentColor) && !SettingsController.IsValidColor(request.AccentColor))
        {
            return BadRequest(new { message = "Vurgu rengi #RRGGBB formatında olmalıdır." });
        }

        // Rolleri oluştur
        await _seeder.SeedAsync();

        // İlk admin kullanıcısını oluştur
        var adminUser = new ApplicationUser
        {
            UserName = request.AdminUsername.Trim(),
            Email = request.AdminEmail.Trim(),
            FullName = request.AdminFullName.Trim(),
            Department = "Sistem Yönetimi",
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(adminUser, request.AdminPassword);
        if (!result.Succeeded)
        {
            var reasons = result.Errors.Select(e => TranslateIdentityError(e.Code, e.Description)).Distinct().ToList();
            return BadRequest(new
            {
                message = "Kullanıcı oluşturulamadı: " + string.Join(" ", reasons),
                errors = reasons
            });
        }

        await _userManager.AddToRoleAsync(adminUser, "Admin");

        // Firma kimliği: uygulamanın tüm başlıkları, sunum kapağı ve paylaşım sayfası buradan beslenir
        var settings = await SettingsController.GetOrCreateAsync(_context, CancellationToken.None);
        settings.OrganizationName = request.OrganizationName.Trim();
        settings.TeamName = string.IsNullOrWhiteSpace(request.TeamName) ? "Yazılım Ekibi" : request.TeamName.Trim();
        settings.DirectorName = string.IsNullOrWhiteSpace(request.DirectorName) ? null : request.DirectorName.Trim();
        settings.DirectorTitle = string.IsNullOrWhiteSpace(request.DirectorTitle) ? null : request.DirectorTitle.Trim();
        if (!string.IsNullOrWhiteSpace(request.AccentColor))
            settings.AccentColor = request.AccentColor.ToLowerInvariant();
        settings.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Sistem ilk kurulumu tamamlandı. Admin kullanıcısı oluşturuldu: {Username}",
            adminUser.UserName);

        return Ok(new { message = "Sistem başarıyla yapılandırıldı. Giriş yapabilirsiniz." });
    }
}