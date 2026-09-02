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
        await SeedProductionProjectsAsync();
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

    /// <summary>
    /// PSL kurulumuna özgü başlangıç verisi. İdempotent — tekrar çalıştırıldığında
    /// mükerrer proje veya URL oluşturmaz. Genel ürün altyapısından ayrı tutulmuştur.
    /// </summary>
    private async Task SeedProductionProjectsAsync()
    {
        const string eFaturaSlug = "e-fatura-otomasyonu";

        if (await _context.Projects.IgnoreQueryFilters().AnyAsync(p => p.Slug == eFaturaSlug))
        {
            _logger.LogInformation("E-Fatura Otomasyonu kaydı zaten mevcut, atlanıyor.");
            return;
        }

        var project = new Project
        {
            Name = "E-Fatura Otomasyonu",
            Slug = eFaturaSlug,
            ShortDescription = "Kütahya şubesine ait e-irsaliye ve e-fatura süreçlerinde ürün kodu " +
                               "eşleştirme, mükerrer kayıt, miktar, fiyat ve KDV kontrolleri yaparak " +
                               "manuel iş yükünü ve hatalı faturalaşma riskini azaltmayı hedefleyen " +
                               "şirket içi otomasyon uygulaması.",
            BusinessProblem = "Kütahya şubesine gelen e-irsaliye ve e-faturaların manuel işlenmesi " +
                              "zaman almakta ve hatalı faturalaşma riski taşımaktadır.",
            BusinessSolution = "Gelen e-faturaları bağlı e-irsaliyelerle otomatik eşleştiren, gelen " +
                               "e-irsaliyeleri alış siparişi/irsaliyesine dönüştüren çift akışlı otomasyon.",
            BusinessValue = null, // Sayısal kazanımlar doğrulanmadan eklenmedi
            Category = "Muhasebe & Finans",
            Status = ProjectStatus.Live,
            IsVerified = false,
            OwnerName = null,        // Kullanıcı tarafından doğrulanmadı
            Department = "Muhasebe & Yazılım",
            TargetUsers = "Muhasebe ve İrsaliye Sorumluları",
            CurrentVersion = null,   // Kullanıcı tarafından doğrulanmadı
            StartDate = null,        // Kullanıcı tarafından doğrulanmadı
            LiveDate = null,         // Kullanıcı tarafından doğrulanmadı
            CreatedAt = DateTime.UtcNow
        };

        // Birincil bağlantı — şirket içi özel ağ, HTTP (zorla HTTPS dönüşümü yapılmaz)
        project.Links.Add(new ProjectLink
        {
            Label = "E-Fatura Otomasyon Paneli",
            Url = "http://10.38.0.25:8065/",
            LinkType = LinkType.Production,
            Environment = EnvironmentType.Production,
            IsPrimary = true,
            IsActive = true,
            RequiresVpn = false,
            RequiresAuthentication = true,
            OpenInNewTab = true,
            DisplayOrder = 0,
            CreatedAt = DateTime.UtcNow
        });

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        _logger.LogInformation("E-Fatura Otomasyonu başlangıç kaydı oluşturuldu.");
    }
}