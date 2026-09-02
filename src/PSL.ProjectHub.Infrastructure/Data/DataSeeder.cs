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
    private readonly Microsoft.Extensions.Configuration.IConfiguration _configuration;
    private readonly Microsoft.Extensions.Logging.ILogger<DataSeeder> _logger;

    public DataSeeder(
        AppDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        Microsoft.Extensions.Configuration.IConfiguration configuration,
        Microsoft.Extensions.Logging.ILogger<DataSeeder> logger)
    {
        _context = context;
        _userManager = userManager;
        _roleManager = roleManager;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SeedAsync(bool isDevelopment = false)
    {
        await SeedRolesAndInitialAdminAsync(isDevelopment);
        await SeedTechnologiesAsync();

        // Üretim ortamında demo veriler otomatik eklenmez; sadece development ortamında tohumlanır
        if (isDevelopment || _configuration.GetValue<bool>("Seed:EnableDemoProjects", false))
        {
            await SeedProjectsAsync();
        }
    }

    private async Task SeedRolesAndInitialAdminAsync(bool isDevelopment)
    {
        string[] roles = ["Admin", "Viewer"];
        foreach (var role in roles)
        {
            if (!await _roleManager.RoleExistsAsync(role))
            {
                await _roleManager.CreateAsync(new ApplicationRole(role, $"{role} Rolü"));
            }
        }

        // İlk Admin kullanıcısının oluşturulması: Şifre kesinlikle kaynak kodda saklanmaz.
        // Ortam değişkeni (PSL_INITIAL_ADMIN_PASSWORD) veya güvenli configuration / user-secrets üzerinden okunur.
        var adminPassword = _configuration["InitialAdmin:Password"]
            ?? Environment.GetEnvironmentVariable("PSL_INITIAL_ADMIN_PASSWORD");

        if (!string.IsNullOrWhiteSpace(adminPassword))
        {
            var adminUser = await _userManager.FindByNameAsync("admin");
            if (adminUser == null)
            {
                var adminEmail = _configuration["InitialAdmin:Email"] ?? "admin@gallerycrystal.com.tr";
                adminUser = new ApplicationUser
                {
                    UserName = "admin",
                    Email = adminEmail,
                    FullName = "Sistem Yöneticisi",
                    Department = "Bilgi İşlem",
                    EmailConfirmed = true
                };
                var result = await _userManager.CreateAsync(adminUser, adminPassword);
                if (result.Succeeded)
                {
                    await _userManager.AddToRoleAsync(adminUser, "Admin");
                    _logger.LogInformation("İlk Admin kullanıcısı yapılandırılan güvenli parola ile başarıyla oluşturuldu.");
                }
                else
                {
                    _logger.LogWarning("Admin kullanıcısı oluşturulurken hata: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }
        }
        else
        {
            _logger.LogInformation("InitialAdmin parolası yapılandırılmamış. İlk admin hesabı CLI veya ortam değişkeni ile oluşturulabilir.");
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
            ("Tailwind CSS", TechnologyCategory.Frontend),
            ("IIS", TechnologyCategory.Infrastructure),
            ("Nebim V3 ERP", TechnologyCategory.Integration),
            ("NetGSM SMS", TechnologyCategory.Integration),
            ("SMTP Email", TechnologyCategory.Integration)
        };

        foreach (var (name, cat) in techs)
        {
            if (!await _context.Technologies.AnyAsync(t => t.Name == name))
            {
                _context.Technologies.Add(new Technology
                {
                    Name = name,
                    Category = cat
                });
            }
        }
        await _context.SaveChangesAsync();
    }

    private async Task SeedProjectsAsync()
    {
        // 1. Müşteri Platformu
        if (!await _context.Projects.IgnoreQueryFilters().AnyAsync(p => p.Slug == "musteri-platformu"))
        {
            var p = new Project
            {
                Name = "Müşteri Platformu",
                Slug = "musteri-platformu",
                ShortDescription = "Gallery Crystal mağazaları müşteri kayıt, KVKK / ETK onay süreçleri ve müşteri iletişim platformu.",
                BusinessProblem = "Mağazalarda müşteri iletişim bilgilerinin, KVKK ve Ticari Elektronik İleti izinlerinin dağınık ve kontrolsüz toplanması.",
                BusinessSolution = "Merkezi CustomerAPI, API Gateway ve SMS doğrulama ile mağaza içi anlık ve mevzuata tam uyumlu müşteri kayıt akışı.",
                BusinessValue = "Mevzuata %100 uyum, doğrulanmış müşteri veritabanı ve anlık SMS kampanyaları ile satış artışı.",
                Category = "Satış & Pazarlama",
                Status = ProjectStatus.Live,
                IsVerified = false,
                OwnerName = "İbrahim Çevik",
                Department = "Yazılım Geliştirme",
                TargetUsers = "Mağaza Satış Personeli, Pazarlama Departmanı",
                CurrentVersion = "v2.1.0",
                StartDate = new DateTime(2024, 1, 15, 0, 0, 0, DateTimeKind.Utc),
                LiveDate = new DateTime(2024, 6, 1, 0, 0, 0, DateTimeKind.Utc),
                CreatedAt = DateTime.UtcNow
            };

            p.Components.Add(new ProjectComponent { Name = "CustomerAPI", ComponentType = ComponentType.API, Description = "Müşteri, KVKK ve lokasyon REST API servisi." });
            p.Components.Add(new ProjectComponent { Name = "CustomerAPI.Gateway", ComponentType = ComponentType.Gateway, Description = "Merkezi API Gateway yönlendiricisi." });
            p.Components.Add(new ProjectComponent { Name = "customer-sms-sender", ComponentType = ComponentType.Web, Description = "React tabanlı SMS gönderim paneli." });
            p.Components.Add(new ProjectComponent { Name = "gallery-crystal", ComponentType = ComponentType.Web, Description = "Mağaza müşteri kayıt ekranı." });

            p.Integrations.Add(new ProjectIntegration { Name = "Nebim ERP", IntegrationType = "Veritabanı / SQL", Description = "Müşteri cari kartları ve eşleştirmeler", IsCritical = true });
            p.Integrations.Add(new ProjectIntegration { Name = "SMS Sağlayıcıları", IntegrationType = "REST API", Description = "NetGSM, İletim Merkezi, Vatan SMS", IsCritical = true });

            p.Releases.Add(new ProjectRelease { Version = "v2.1.0", Title = "SMS Entegrasyon Güncellemesi", Description = "Çoklu SMS sağlayıcı desteği eklendi.", ReleaseDate = DateTime.UtcNow.AddDays(-30) });
            p.Notes.Add(new ProjectNote { Title = "KVKK Onay Akışı", Content = "Müşteri kayıt sırasında SMS OTP kodu ile ETK onayı alınmaktadır.", NoteType = NoteType.DevelopmentNote });

            _context.Projects.Add(p);
        }

        // 2. Personel Platformu
        if (!await _context.Projects.IgnoreQueryFilters().AnyAsync(p => p.Slug == "personel-platformu"))
        {
            var p = new Project
            {
                Name = "Personel Platformu",
                Slug = "personel-platformu",
                ShortDescription = "Şirket personeli self-servis, izin ve özlük yönetimi platformu.",
                BusinessProblem = "Çalışan izin talepleri ve özlük bildirimlerinin kağıt ortamında veya dağınık yürütülmesi.",
                BusinessSolution = "Personelin izin, bordro görüntüleme ve talep işlemlerini dijital ortamda yönetebileceği portal ve API.",
                BusinessValue = "İK operasyon yükünün %40 azalması, şeffaf onay süreçleri.",
                Category = "İnsan Kaynakları",
                Status = ProjectStatus.Development,
                IsVerified = false,
                Department = "İnsan Kaynakları & BT",
                CurrentVersion = "v0.9.0-beta",
                StartDate = new DateTime(2024, 3, 1, 0, 0, 0, DateTimeKind.Utc),
                CreatedAt = DateTime.UtcNow
            };

            p.Components.Add(new ProjectComponent { Name = "EmployeeAPI", ComponentType = ComponentType.API, Description = "Personel REST API servisi." });
            p.Components.Add(new ProjectComponent { Name = "employee-portal", ComponentType = ComponentType.Web, Description = "Çalışan self-servis web portali." });

            _context.Projects.Add(p);
        }

        // 3. E-Fatura Otomasyonu
        if (!await _context.Projects.IgnoreQueryFilters().AnyAsync(p => p.Slug == "e-fatura-otomasyonu"))
        {
            var p = new Project
            {
                Name = "E-Fatura Otomasyonu",
                Slug = "e-fatura-otomasyonu",
                ShortDescription = "Kütahya şubesine ait e-irsaliyelerin Nebim ERP üzerinde faturalandırılmaya hazırlanmasını sağlayan sistemdir. Ürün kodu eşleştirme, mükerrer kayıt, miktar, fiyat ve KDV kontrolleri yaparak hatalı faturalaşma riskini azaltmayı hedefler.",
                BusinessProblem = "Kütahya şubesine gelen e-irsaliye ve e-faturaların manuel girilmesi zaman almakta ve hatalı faturalaşma riski taşımaktaydı.",
                BusinessSolution = "Gelen e-faturaları bağlı e-irsaliyelerle eşleştirerek otomatik faturalama ve gelen e-irsaliyeleri alış siparişi/irsaliyesine dönüştüren çift akışlı otomasyon.",
                BusinessValue = "Faturalaşma süresini dakikalara indirme, mükerrer kayıt ve KDV tutarsızlıklarını önleme.",
                Category = "Muhasebe & Finans",
                Status = ProjectStatus.Live,
                IsVerified = false, // Doğrulama Bekliyor olarak işaretlendi
                OwnerName = "İbrahim Çevik / Yusuf Emre Deniz",
                Department = "Muhasebe & Yazılım",
                TargetUsers = "Muhasebe ve İrsaliye Sorumluları",
                CurrentVersion = "v1.4.2",
                StartDate = new DateTime(2023, 11, 1, 0, 0, 0, DateTimeKind.Utc),
                LiveDate = new DateTime(2024, 2, 10, 0, 0, 0, DateTimeKind.Utc),
                CreatedAt = DateTime.UtcNow
            };

            p.Components.Add(new ProjectComponent { Name = "EFaturaOtomasyon.Api", ComponentType = ComponentType.API, Description = ".NET 8 Web API ve Dapper veri katmanı." });
            p.Components.Add(new ProjectComponent { Name = "E-Fatura Web Paneli", ComponentType = ComponentType.Web, Description = "Statik HTML/JS kullanıcı arayüzü." });
            p.Components.Add(new ProjectComponent { Name = "Orchestrator Worker", ComponentType = ComponentType.Worker, Description = "Günlük çalışan otomatik eşleştirme servisi." });

            p.Integrations.Add(new ProjectIntegration { Name = "Nebim ERP V3", IntegrationType = "SQL Server / Dapper", Description = "trInvoiceHeader, trInvoiceLine, trStock, MIY tabloları", IsCritical = true });
            p.Notes.Add(new ProjectNote { Title = "Kapsam Genişlemesi", Content = "Repo incelemesinde yalnızca e-fatura değil, Sipariş -> İrsaliye (1-BP-2 ve 1-BP-6) otomatik yazım akışının da devrede olduğu tespit edilmiştir.", NoteType = NoteType.DevelopmentNote });

            _context.Projects.Add(p);
        }

        // 4. B2B Platformu
        if (!await _context.Projects.IgnoreQueryFilters().AnyAsync(p => p.Slug == "b2b-platformu"))
        {
            var p = new Project
            {
                Name = "B2B Platformu",
                Slug = "b2b-platformu",
                ShortDescription = "Bayi sipariş toplama, cari ekstre ve ürün katalog sistemi.",
                BusinessProblem = "Bayi siparişlerinin telefon/e-posta yoluyla alınması kaynaklı karışıklıklar.",
                BusinessSolution = "Yetkili bayilerin fiyat listesi ve stok durumuna göre doğrudan sipariş oluşturabildiği B2B portalı.",
                BusinessValue = "Sipariş işleme hızının 3 katına çıkması, operasyonel hataların sıfırlanması.",
                Category = "B2B & Bayi",
                Status = ProjectStatus.Development,
                IsVerified = false,
                Department = "Satış & BT",
                CurrentVersion = "v1.0.0-rc",
                CreatedAt = DateTime.UtcNow
            };

            p.Integrations.Add(new ProjectIntegration { Name = "Nebim ERP", IntegrationType = "SQL / API", Description = "Bayi cari hesapları ve fiyat listeleri", IsCritical = true });

            _context.Projects.Add(p);
        }

        // 5. Gallery Crystal Web
        if (!await _context.Projects.IgnoreQueryFilters().AnyAsync(p => p.Slug == "gallery-crystal"))
        {
            var p = new Project
            {
                Name = "Gallery Crystal",
                Slug = "gallery-crystal",
                ShortDescription = "Gallery Crystal mağaza müşteri portalı ve kurumsal web arayüzü.",
                Category = "E-Ticaret & Web",
                Status = ProjectStatus.Live,
                IsVerified = false,
                Department = "Pazarlama & E-Ticaret",
                CurrentVersion = "v1.0.4",
                CreatedAt = DateTime.UtcNow
            };

            _context.Projects.Add(p);
        }

        // 6. Muhasebe Sistemi
        if (!await _context.Projects.IgnoreQueryFilters().AnyAsync(p => p.Slug == "muhasebe-sistemi"))
        {
            var p = new Project
            {
                Name = "Muhasebe Sistemi",
                Slug = "muhasebe-sistemi",
                ShortDescription = "Canlı muhasebe otomasyon ve servis platformu.",
                Category = "Muhasebe & Finans",
                Status = ProjectStatus.Live,
                IsVerified = false,
                Department = "Muhasebe",
                CurrentVersion = "v1.2.0",
                CreatedAt = DateTime.UtcNow
            };

            _context.Projects.Add(p);
        }

        // 7. BT Destek Merkezi
        if (!await _context.Projects.IgnoreQueryFilters().AnyAsync(p => p.Slug == "bt-destek-merkezi"))
        {
            var p = new Project
            {
                Name = "BT Destek Merkezi",
                Slug = "bt-destek-merkezi",
                ShortDescription = "Şirket içi BT servis ve destek taleplerinin yönetildiği merkezi portal.",
                Category = "Bilgi Teknolojileri",
                Status = ProjectStatus.Live,
                IsVerified = false,
                Department = "Bilgi İşlem",
                CurrentVersion = "v2.0.1",
                CreatedAt = DateTime.UtcNow
            };

            p.Components.Add(new ProjectComponent { Name = "MvcBtDestekMerkeziServisi", ComponentType = ComponentType.Web, Description = "ASP.NET MVC destek portalı." });

            _context.Projects.Add(p);
        }

        // 8. Emilio Stok Sistemi
        if (!await _context.Projects.IgnoreQueryFilters().AnyAsync(p => p.Slug == "emilio-stok-sistemi"))
        {
            var p = new Project
            {
                Name = "Emilio Stok Sistemi",
                Slug = "emilio-stok-sistemi",
                ShortDescription = "Emilio mağazası için Nebim SQL veritabanından ürün, fiyat, barkod, renk/beden ve depo stok bilgilerini sunan hızlı stok ekranı.",
                BusinessProblem = "Mağaza satış personelinin müşteri yanındayken stok, beden ve renk seçeneklerine hızla erişememesi.",
                BusinessSolution = "Nebim veritabanını doğrudan yüksek performansla sorgulayan, barkod okuma destekli MVC Web + API uygulaması.",
                BusinessValue = "Mağaza satış dönüşüm oranında artış, müşteri bekleme sürelerinde %70 azalma.",
                Category = "Mağazacılık & Stok",
                Status = ProjectStatus.Live,
                IsVerified = false,
                OwnerName = "Yusuf Emre Deniz",
                Department = "Yazılım Geliştirme",
                TargetUsers = "Emilio Mağaza Satış Danışmanları, Depo Görevlileri",
                CurrentVersion = "v1.1.0",
                StartDate = new DateTime(2024, 2, 1, 0, 0, 0, DateTimeKind.Utc),
                LiveDate = new DateTime(2024, 4, 15, 0, 0, 0, DateTimeKind.Utc),
                CreatedAt = DateTime.UtcNow
            };

            p.Components.Add(new ProjectComponent { Name = "Emilio.Api", ComponentType = ComponentType.API, Description = ".NET 8 Minimal API ile Nebim sorguları." });
            p.Components.Add(new ProjectComponent { Name = "Emilio.Web", ComponentType = ComponentType.Web, Description = "Razor MVC kullanıcı arayüzü." });

            p.Integrations.Add(new ProjectIntegration { Name = "Nebim SQL Server", IntegrationType = "SQL / SqlClient", Description = "Ürün, varyant ve stok tabloları", IsCritical = true });

            _context.Projects.Add(p);
        }

        // 9. Lokasyon/Taşıma Projesi
        if (!await _context.Projects.IgnoreQueryFilters().AnyAsync(p => p.Slug == "lokasyon-tasima-projesi"))
        {
            var p = new Project
            {
                Name = "Lokasyon/Taşıma Projesi",
                Slug = "lokasyon-tasima-projesi",
                ShortDescription = "Yurt dışı taşınma sürecini hedef tarihe göre kişiselleştirilmiş görev yol haritasına dönüştüren süreç takip platformu.",
                Category = "Operasyon",
                Status = ProjectStatus.Development,
                IsVerified = false,
                OwnerName = "Yusuf Emre Deniz",
                Department = "Yazılım Geliştirme",
                CurrentVersion = "v1.0.0-alpha",
                StartDate = new DateTime(2024, 5, 1, 0, 0, 0, DateTimeKind.Utc),
                CreatedAt = DateTime.UtcNow
            };

            p.Components.Add(new ProjectComponent { Name = "RelocationMap.API", ComponentType = ComponentType.API, Description = ".NET 8 Web API" });
            p.Components.Add(new ProjectComponent { Name = "relocation-map-client", ComponentType = ComponentType.Web, Description = "React 19 + Vite istemcisi" });

            _context.Projects.Add(p);
        }

        // 10. Crystal Family
        if (!await _context.Projects.IgnoreQueryFilters().AnyAsync(p => p.Slug == "crystal-family"))
        {
            var p = new Project
            {
                Name = "Crystal Family",
                Slug = "crystal-family",
                ShortDescription = "Gallery Crystal müşteri sadakat programı, kampanya ve iletişim altyapısı.",
                Category = "Sadakat & Müşteri",
                Status = ProjectStatus.Live,
                IsVerified = false,
                OwnerName = "İbrahim Çevik",
                Department = "Yazılım Geliştirme",
                CurrentVersion = "v2.0.0",
                CreatedAt = DateTime.UtcNow
            };

            _context.Projects.Add(p);
        }

        await _context.SaveChangesAsync();
    }
}
