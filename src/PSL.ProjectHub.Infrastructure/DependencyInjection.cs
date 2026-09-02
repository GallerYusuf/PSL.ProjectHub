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
            options.Password.RequireDigit = false;
            options.Password.RequireLowercase = false;
            options.Password.RequireUppercase = false;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequiredLength = 6;
            options.User.RequireUniqueEmail = false;
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
