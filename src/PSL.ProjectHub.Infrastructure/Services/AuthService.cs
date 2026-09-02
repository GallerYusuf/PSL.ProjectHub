using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Application.Interfaces;
using PSL.ProjectHub.Infrastructure.Data;
using PSL.ProjectHub.Infrastructure.Identity;
using System.Text.Json;

namespace PSL.ProjectHub.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _configuration = configuration;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByNameAsync(request.Username);
        if (user == null)
            user = await _userManager.FindByEmailAsync(request.Username);

        if (user == null) return null;

        // Hesap kilitlenme kontrolü
        if (await _userManager.IsLockedOutAsync(user))
        {
            throw new InvalidOperationException(
                "Hesabınız çok sayıda hatalı giriş denemesi nedeniyle geçici olarak kilitlenmiştir. " +
                "Lütfen daha sonra tekrar deneyiniz.");
        }

        var isValidPassword = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isValidPassword)
        {
            await _userManager.AccessFailedAsync(user);
            return null;
        }

        await _userManager.ResetAccessFailedCountAsync(user);

        var roles = await _userManager.GetRolesAsync(user);

        var secret = _configuration["Jwt:Secret"];
        if (string.IsNullOrWhiteSpace(secret) || secret.Length < 32)
            throw new InvalidOperationException("JWT Secret yapılandırması eksik veya güvensizdir.");

        var issuer = _configuration["Jwt:Issuer"] ?? "PSLProjectHub";
        var audience = _configuration["Jwt:Audience"] ?? "PSLProjectHubAudience";

        var claims = new List<System.Security.Claims.Claim>
        {
            new(System.Security.Claims.ClaimTypes.NameIdentifier, user.Id),
            new(System.Security.Claims.ClaimTypes.Name, user.UserName ?? string.Empty),
            new(System.Security.Claims.ClaimTypes.Email, user.Email ?? string.Empty),
            new("FullName", user.FullName)
        };

        foreach (var role in roles)
            claims.Add(new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, role));

        var key = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
            System.Text.Encoding.UTF8.GetBytes(secret));
        var creds = new Microsoft.IdentityModel.Tokens.SigningCredentials(
            key, Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256);

        var expiresAt = DateTime.UtcNow.AddHours(8);
        var token = new System.IdentityModel.Tokens.Jwt.JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds);

        return new AuthResponse
        {
            Token = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().WriteToken(token),
            Username = user.UserName ?? string.Empty,
            FullName = user.FullName,
            Email = user.Email ?? string.Empty,
            Roles = roles.ToList(),
            ExpiresAt = expiresAt
        };
    }

    public Task SeedDefaultUsersAndRolesAsync()
    {
        // Bu metot kaldırıldı: seeding artık yalnızca DataSeeder üzerinden startup'ta yapılıyor.
        // AuthService'in seeding sorumluluğu yoktur.
        return Task.CompletedTask;
    }
}