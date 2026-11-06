using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using PSL.ProjectHub.Domain.Entities;
using PSL.ProjectHub.Domain.Enums;
using PSL.ProjectHub.Infrastructure.Identity;

namespace PSL.ProjectHub.Infrastructure.Data;

public class DataSeeder
{
    private readonly AppDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<ApplicationRole> _roleManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DataSeeder> _logger;

    public DataSeeder(
        AppDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        IConfiguration configuration,
        ILogger<DataSeeder> logger)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        await SeedRolesAsync();
        await SeedTechnologiesAsync();
        // Projeler kullanıcı tarafından manuel olarak ekleneceğinden otomatik tohumlama devre dışı bırakıldı.
    }

    private async Task SeedRolesAsync()
    {
        // Sistem rolleri: Admin tam yetkili, Editor içerik düzenleyebilir,
        // Viewer salt okuma, Presenter sunum yapabilir
        string[] roles = ["Admin", "Editor", "Viewer", "Presenter"];
        foreach (var role in roles)
        {
            if (!await _roleManager.RoleExistsAsync(role))
            {
                var result = await _roleManager.CreateAsync(new ApplicationRole(role, $"{role} Rolü"));
                if (result.Succeeded)
                    _logger.LogInformation("Rol oluşturuldu: {Role}", role);
                else
                    _logger.LogWarning("Rol oluşturulamadı: {Role} — {Errors}", role,
                        string.Join(", ", result.Errors.Select(e => e.Description)));
            }
        }
    }

    private async Task SeedTechnologiesAsync()
    {
        var techs = new List<(string Name, TechnologyCategory Cat)>
        {
            ("C#", TechnologyCategory.Backend),
            (".NET 8", TechnologyCategory.Backend),
            ("ASP.NET Core Web API", TechnologyCategory.Backend),
            ("ASP.NET Core MVC", TechnologyCategory.Backend),
            ("React", TechnologyCategory.Frontend),
            ("TypeScript", TechnologyCategory.Frontend),
            ("Vite", TechnologyCategory.Frontend),
            ("SQL Server", TechnologyCategory.Database),
            ("Dapper", TechnologyCategory.Backend),
            ("Entity Framework Core", TechnologyCategory.Backend),
            ("IIS", TechnologyCategory.Infrastructure),
            ("Nebim V3 ERP", TechnologyCategory.Integration),
            ("SMTP Email", TechnologyCategory.Integration)
        };

        foreach (var (name, cat) in techs)
        {
            if (!await _context.Technologies.AnyAsync(t => t.Name == name))
            {
                _context.Technologies.Add(new Technology { Name = name, Category = cat });
            }
        }

        await _context.SaveChangesAsync();
    }

}