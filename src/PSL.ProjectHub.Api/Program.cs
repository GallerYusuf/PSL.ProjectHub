using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using PSL.ProjectHub.Api.Middleware;
using PSL.ProjectHub.Infrastructure;
using PSL.ProjectHub.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// Add Infrastructure layer (DbContext, Identity, Services)
builder.Services.AddInfrastructure(builder.Configuration);

// Add Controllers with string enum serializer
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

// JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "PSL_ProjectHub_Super_Secret_Key_For_Development_2026_Secure_Token!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "PSLProjectHub";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "PSLProjectHubAudience";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// Swagger / OpenAPI with JWT Bearer configuration
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "PSL Project Hub API",
        Version = "v1",
        Description = "PSL İç ve Dış Ticaret A.Ş. / Gallery Crystal Proje Merkezi Yönetim API'si"
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

// CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Global Exception Handler
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

// Enable Swagger in Development & Staging
if (app.Environment.IsDevelopment() || app.Environment.IsStaging())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "PSL Project Hub API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("AllowAllOrigins");

// Static files for React SPA
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// SPA fallback for HTML5 History API (client-side routing)
app.MapFallbackToFile("index.html");

// Automatic Migration & Seeder execution on application startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var db = services.GetRequiredService<AppDbContext>();
        // If SQL Server is available, apply pending migrations or ensure created
        if (db.Database.IsRelational())
        {
            await db.Database.EnsureCreatedAsync();
        }
        var seeder = services.GetRequiredService<DataSeeder>();
        await seeder.SeedAsync();
        logger.LogInformation("Veritabanı kontrol edildi ve başlangıç verileri başarıyla hazırlandı.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Veritabanı otomatik başlatma sırasında uyarı/hata alındı. Manuel migration gerekebilir: {Message}", ex.Message);
    }
}

app.Run();

// For integration tests
public partial class Program { }
