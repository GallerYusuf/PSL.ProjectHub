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

// Controller''lar ve enum string serileştirici
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// JWT Kimlik Doğrulama Yapılandırması
var jwtSecret = builder.Configuration["Jwt:Secret"];
if (builder.Environment.IsProduction())
{
    // Production''da secret eksikse veya kısaysa uygulama güvenle başlamayı reddeder
    if (string.IsNullOrWhiteSpace(jwtSecret) || jwtSecret.Length < 32)
    {
        throw new InvalidOperationException(
            "KRİTİK GÜVENLİK HATASI: Production ortamında ''Jwt:Secret'' zorunludur ve " +
            "en az 32 karakter (256-bit) uzunluğunda olmalıdır.");
    }
}
else
{
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

// Rate Limiting — brute-force koruması
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("LoginRateLimit", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueLimit = 0;
    });
});

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "PSL Project Hub API",
        Version = "v1",
        Description = "PSL Project Hub — Şirket İçi Proje Envanter ve Sunum Sistemi"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Bearer Yetkilendirme. Örnek: ''Bearer {token}''",
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
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// CORS — AllowAnyOrigin kaldırıldı; yapılandırmadaki izinli adreslerle sınırlandırıldı
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

// Global hata yönetim middleware
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

// Güvenlik header''ları (CSP, X-Frame-Options, vb.)
// ADR-001: JWT + localStorage + strict CSP XSS azaltma kombinasyonu
app.UseMiddleware<SecurityHeadersMiddleware>();

// HTTPS Redirection ve HSTS (production)
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

// Swagger (development ve staging)
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

// React SPA statik dosyaları
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// React SPA client-side yönlendirme fallback
app.MapFallbackToFile("index.html");

// Veritabanı migration ve tohumlama
// Ham SQL geçmişi manipülasyonu kaldırıldı — yalnızca EF Migrations kullanılır.
// Migration hatası uygulamanın "hazır" duruma geçmesini engeller.
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var db = services.GetRequiredService<AppDbContext>();
        if (db.Database.IsRelational())
        {
            logger.LogInformation("Veritabanı migration''ları kontrol ediliyor ve uygulanıyor...");
            await db.Database.MigrateAsync();
            logger.LogInformation("Veritabanı migration''ları başarıyla uygulandı.");
        }

        var seeder = services.GetRequiredService<DataSeeder>();
        await seeder.SeedAsync();
        logger.LogInformation("Başlangıç rolleri ve verileri kontrol edildi.");
    }
    catch (Exception ex)
    {
        var logger2 = services.GetRequiredService<ILogger<Program>>();
        logger2.LogCritical(ex, "Veritabanı migration veya tohumlama sırasında kritik hata: {Message}", ex.Message);
        // Migration hatası uygulamanın "hazır" duruma geçmesini engeller
        throw;
    }
}

app.Run();

// Entegrasyon testleri için Program sınıfı görünürlüğü
public partial class Program { }