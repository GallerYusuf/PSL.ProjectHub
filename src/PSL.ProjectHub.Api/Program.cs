using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PSL.ProjectHub.Api.Middleware;
using PSL.ProjectHub.Infrastructure;
using PSL.ProjectHub.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Infrastructure katmanı kaydı (DbContext, Identity, Repository & Servisler)
builder.Services.AddInfrastructure(builder.Configuration);

// Controller'lar ve enum string serileştirici
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// JWT Kimlik Doğrulama Yapılandırması ve Güvenlik Sertleştirmesi
var jwtSecret = builder.Configuration["Jwt:Secret"];
if (builder.Environment.IsProduction())
{
    // Üretim ortamında secret eksikse veya 32 karakterden kısaysa uygulama güvenle başlamayı reddeder
    if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32)
    {
        throw new InvalidOperationException("KRİTİK GÜVENLİK HATASI: Production ortamında 'Jwt:Secret' zorunludur ve en az 32 karakter (256-bit) uzunluğunda olmalıdır. Uygulama başlatılamaz.");
    }
}
else
{
    // Geliştirme ortamında eğer secret ayarlanmamışsa güvenli geliştirici anahtarı kullanılır
    jwtSecret = string.IsNullOrWhiteSpace(jwtSecret)
        ? "PSL_ProjectHub_Dev_Super_Secret_Key_For_Local_2026_Secure_Token!"
        : jwtSecret;
}

var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "PSLProjectHub";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "PSLProjectHubAudience";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = builder.Environment.IsProduction();
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Rate Limiting (Kaba kuvvet / brute-force saldırılarına karşı koruma)
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("LoginRateLimit", opt =>
    {
        opt.PermitLimit = 5; // 1 dakikada en fazla 5 login denemesi
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });
});

// Swagger / OpenAPI Dokümantasyonu
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "PSL Project Hub API",
        Version = "v1",
        Description = "PSL İç ve Dış Ticaret A.Ş. / Gallery Crystal Proje Operasyon Merkezi API'si"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Bearer Yetkilendirme. Örnek: 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// CORS Yapılandırması: AllowAnyOrigin kaldırıldı, yapılandırmadaki izinli adreslerle sınırlandırıldı
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173", "http://localhost:3000", "http://localhost:5000"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("PslCorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Global Hata Yönetim Middleware'i
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

// HTTPS Redirection ve HSTS (Üretim ortamı için)
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

// Swagger arayüzü (Development ve Staging ortamlarında)
if (app.Environment.IsDevelopment() || app.Environment.IsStaging())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "PSL Project Hub API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("PslCorsPolicy");
app.UseRateLimiter();

// React SPA Statik Dosyaları
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// React SPA Client-side yönlendirme fallback
app.MapFallbackToFile("index.html");

// Kontrollü ve loglanabilir veritabanı migration & tohumlama işlemi (EnsureCreated kaldırıldı)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var db = services.GetRequiredService<AppDbContext>();
        if (db.Database.IsRelational())
        {
            logger.LogInformation("Veritabanı migration'ları kontrol ediliyor ve uygulanıyor...");
            await db.Database.MigrateAsync();
            logger.LogInformation("Veritabanı migration'ları başarıyla uygulandı.");
        }
        var seeder = services.GetRequiredService<DataSeeder>();
        await seeder.SeedAsync(app.Environment.IsDevelopment());
        logger.LogInformation("Başlangıç rolleri ve verileri kontrol edildi.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Veritabanı migration veya tohumlama sırasında hata alındı: {Message}", ex.Message);
    }
}

app.Run();

// Entegrasyon testleri için Program sınıfı görünürlüğü
public partial class Program { }
