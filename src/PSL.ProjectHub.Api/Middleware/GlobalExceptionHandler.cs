using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace PSL.ProjectHub.Api.Middleware;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;
    private readonly IWebHostEnvironment _env;

    public GlobalExceptionHandlerMiddleware(
        RequestDelegate next,
        ILogger<GlobalExceptionHandlerMiddleware> logger,
        IWebHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            // Log sistemine ayrıntılı hata yazılır; şifre, token gibi hassas veriler loglanmaz
            _logger.LogError(ex, "İstek işlenirken işlenmemiş bir hata meydana geldi. Yol: {Path}, TraceId: {TraceId}",
                context.Request.Path, context.TraceIdentifier);

            await HandleExceptionAsync(context, ex, _env);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception, IWebHostEnvironment env)
    {
        context.Response.ContentType = "application/problem+json";

        var (statusCode, title) = exception switch
        {
            ArgumentException => (HttpStatusCode.BadRequest, "Geçersiz İstek Parametresi"),
            InvalidOperationException => (HttpStatusCode.Conflict, "İşlem Çakışması / Kural İhlali"),
            KeyNotFoundException => (HttpStatusCode.NotFound, "Kayıt Bulunamadı"),
            UnauthorizedAccessException => (HttpStatusCode.Unauthorized, "Yetkisiz Erişim"),
            _ => (HttpStatusCode.InternalServerError, "Sunucu Hatası")
        };

        context.Response.StatusCode = (int)statusCode;

        // Üretim ortamında 500 hatalarında iç istisna detayları ve stack trace kullanıcıya kesinlikle gösterilmez
        string detail;
        if (statusCode == HttpStatusCode.InternalServerError)
        {
            detail = env.IsDevelopment()
                ? exception.Message
                : "İşlem sırasında beklenmeyen bir sunucu hatası oluştu. Lütfen sistem yöneticisiyle iletişime geçiniz.";
        }
        else
        {
            detail = exception.Message;
        }

        var problemDetails = new ProblemDetails
        {
            Status = (int)statusCode,
            Title = title,
            Detail = detail,
            Instance = context.Request.Path
        };

        problemDetails.Extensions["traceId"] = context.TraceIdentifier;

        var json = JsonSerializer.Serialize(problemDetails);
        return context.Response.WriteAsync(json);
    }
}
