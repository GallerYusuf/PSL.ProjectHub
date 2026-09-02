using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PSL.ProjectHub.Application.Interfaces;
using PSL.ProjectHub.Infrastructure.Data;
using PSL.ProjectHub.Infrastructure.Identity;
using PSL.ProjectHub.Infrastructure.Services;

namespace PSL.ProjectHub.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Server=(localdb)\\mssqllocaldb;Database=PSLProjectHub;Trusted_Connection=True;MultipleActiveResultSets=true";

        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseSqlServer(connectionString);
        });

        services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
        {
            // Güçlendirilmiş kurumsal parola politikası
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = true;
            options.Password.RequiredLength = 8;
            options.User.RequireUniqueEmail = true;

            // Brute-force saldırılarına karşı hesap kilitleme koruması
            options.Lockout.AllowedForNewUsers = true;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            options.Lockout.MaxFailedAccessAttempts = 5;
        })
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders();

        services.AddScoped<DataSeeder>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<IProjectLinkService, ProjectLinkService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IUrlImportService, UrlImportService>();
        services.AddScoped<IAuthService, AuthService>();

        // Extensibility Providers (Mock for MVP)
        services.AddScoped<IRepositoryMetadataProvider, MockRepositoryMetadataProvider>();
        services.AddScoped<IApplicationHealthProvider, MockApplicationHealthProvider>();
        services.AddScoped<IDeploymentInfoProvider, MockDeploymentInfoProvider>();

        return services;
    }
}
