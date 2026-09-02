using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Application.Interfaces;

namespace PSL.ProjectHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IWebHostEnvironment _env;

    public AuthController(IAuthService authService, IWebHostEnvironment env)
    {
        _authService = authService;
        _env = env;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("LoginRateLimit")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var response = await _authService.LoginAsync(request);
            if (response == null)
            {
                return Unauthorized(new { message = "Geçersiz kullanıcı adı veya şifre." });
            }

            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(423, new { message = ex.Message });
        }
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

    /// <summary>
    /// Yalnızca Development ortamında kullanılabilen, başlangıç tohumlama uç noktası.
    /// Üretim ortamında kesinlikle anonim kullanıcı oluşturulamaz.
    /// </summary>
    [HttpPost("seed")]
    public async Task<IActionResult> Seed()
    {
        if (!_env.IsDevelopment())
        {
            return NotFound(new { message = "Bu işlem üretim ortamında güvenlik nedeniyle devre dışıdır." });
        }

        await _authService.SeedDefaultUsersAndRolesAsync();
        return Ok(new { message = "Geliştirme ortamı verileri başarıyla tohumlandı." });
    }
}
