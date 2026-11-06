using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using PSL.ProjectHub.Api.Controllers;
using PSL.ProjectHub.Application.DTOs;
using PSL.ProjectHub.Application.Interfaces;
using PSL.ProjectHub.Infrastructure.Data;
using PSL.ProjectHub.Infrastructure.Identity;
using Xunit;

namespace PSL.ProjectHub.Api.Tests;

public class SetupAndSecurityEndpointTests
{
    [Fact]
    public async Task SetupController_GetStatus_ReturnsFalse_WhenNoUsersExist()
    {
        var provider = TestHelpers.CreateIdentityServiceProvider();
        using var scope = provider.CreateScope();

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
        var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<SetupController>>();

        var controller = new SetupController(userManager, roleManager, seeder, scope.ServiceProvider.GetRequiredService<AppDbContext>(), logger);

        var actionResult = await controller.GetStatus();
        var okResult = Assert.IsType<OkObjectResult>(actionResult.Result);
        var response = Assert.IsType<SetupStatusResponse>(okResult.Value);

        Assert.False(response.IsInitialized);
    }

    [Fact]
    public async Task SetupController_Initialize_CreatesAdmin_WhenNoUsersExist()
    {
        var provider = TestHelpers.CreateIdentityServiceProvider();
        using var scope = provider.CreateScope();

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
        var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<SetupController>>();

        var controller = new SetupController(userManager, roleManager, seeder, scope.ServiceProvider.GetRequiredService<AppDbContext>(), logger);

        var result = await controller.Initialize(new InitializeSystemRequest
        {
            OrganizationName = "PSL İç ve Dış Ticaret A.Ş.",
            AdminFullName = "Yusuf Emre Deniz",
            AdminUsername = "admin",
            AdminEmail = "admin@psl.com.tr",
            AdminPassword = "SecureInitialPassword2026!"
        });

        Assert.IsType<OkObjectResult>(result);

        // Kullanıcı ve rol doğrulaması
        var adminUser = await userManager.FindByNameAsync("admin");
        Assert.NotNull(adminUser);
        Assert.Equal("admin@psl.com.tr", adminUser.Email);
        Assert.True(await userManager.IsInRoleAsync(adminUser, "Admin"));

        // Firma adı kaydedilmeli, ekip adı verilmediyse varsayılan kullanılmalı
        var settings = await scope.ServiceProvider.GetRequiredService<AppDbContext>()
            .OrganizationSettings.SingleAsync();
        Assert.Equal("PSL İç ve Dış Ticaret A.Ş.", settings.OrganizationName);
        Assert.Equal("Yazılım Ekibi", settings.TeamName);

        // Status artık true dönmeli
        var statusResult = await controller.GetStatus();
        var okStatus = Assert.IsType<OkObjectResult>(statusResult.Result);
        var status = Assert.IsType<SetupStatusResponse>(okStatus.Value);
        Assert.True(status.IsInitialized);
    }

    [Fact]
    public async Task SetupController_Initialize_ReturnsConflict_WhenCalledSecondTime()
    {
        var provider = TestHelpers.CreateIdentityServiceProvider();
        using var scope = provider.CreateScope();

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
        var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<SetupController>>();

        var controller = new SetupController(userManager, roleManager, seeder, scope.ServiceProvider.GetRequiredService<AppDbContext>(), logger);

        // İlk kurulum
        await controller.Initialize(new InitializeSystemRequest
        {
            OrganizationName = "PSL",
            AdminFullName = "Admin",
            AdminUsername = "admin",
            AdminEmail = "admin@psl.com.tr",
            AdminPassword = "InitialPassword123!"
        });

        // İkinci çağrı — Conflict (409) dönmeli
        var secondCallResult = await controller.Initialize(new InitializeSystemRequest
        {
            OrganizationName = "Attack Attempt",
            AdminFullName = "Attacker",
            AdminUsername = "attacker",
            AdminEmail = "attacker@evil.com",
            AdminPassword = "EvilPassword123!"
        });

        Assert.IsType<ConflictObjectResult>(secondCallResult);
    }

    [Fact]
    public async Task SetupController_Initialize_ReturnsBadRequest_WhenPasswordTooShort()
    {
        var provider = TestHelpers.CreateIdentityServiceProvider();
        using var scope = provider.CreateScope();

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
        var seeder = scope.ServiceProvider.GetRequiredService<DataSeeder>();
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<SetupController>>();

        var controller = new SetupController(userManager, roleManager, seeder, scope.ServiceProvider.GetRequiredService<AppDbContext>(), logger);

        var result = await controller.Initialize(new InitializeSystemRequest
        {
            OrganizationName = "PSL",
            AdminFullName = "Admin",
            AdminUsername = "admin",
            AdminEmail = "admin@psl.com.tr",
            AdminPassword = "short" // 8 karakterden kısa
        });

        Assert.IsType<BadRequestObjectResult>(result);
    }

    private class FakeLockedAuthService : IAuthService
    {
        public Task<AuthResponse?> LoginAsync(LoginRequest request)
        {
            throw new InvalidOperationException("Hesabınız kilitlenmiştir.");
        }

        public Task SeedDefaultUsersAndRolesAsync() => Task.CompletedTask;
    }

    [Fact]
    public async Task AuthController_Login_ReturnsLockedStatus_WhenAccountIsLocked()
    {
        var controller = new AuthController(new FakeLockedAuthService());

        var result = await controller.Login(new LoginRequest
        {
            Username = "lockedUser",
            Password = "Password123!"
        });

        var statusResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(423, statusResult.StatusCode);
    }
}