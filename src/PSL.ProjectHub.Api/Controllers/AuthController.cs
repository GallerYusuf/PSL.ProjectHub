using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Application.Interfaces;

namespace PSL.ProjectHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);
        if (response == null)
        {
            return Unauthorized(new { message = "Geçersiz kullanıcı adı veya şifre." });
        }

        return Ok(response);
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult GetCurrentUser()
    {
        var username = User.Identity?.Name;
        var roles = User.Claims
            .Where(c => c.Type == ClaimTypes.Role)
            .Select(c => c.Value)
            .ToList();
        var fullName = User.FindFirst("FullName")?.Value ?? username;
        var email = User.FindFirst(ClaimTypes.Email)?.Value;

        return Ok(new
        {
            username,
            fullName,
            email,
            roles
        });
    }

    [HttpPost("seed")]
    [AllowAnonymous]
    public async Task<IActionResult> Seed()
    {
        await _authService.SeedDefaultUsersAndRolesAsync();
        return Ok(new { message = "Başlangıç rolleri, kullanıcıları ve projeleri başarıyla tohumlandı." });
    }
}
