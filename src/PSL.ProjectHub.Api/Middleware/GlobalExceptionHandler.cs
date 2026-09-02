using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace PSL.ProjectHub.Api.Middleware;

public class GlobalExceptionHandlerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandlerMiddleware> _logger;

    public GlobalExceptionHandlerMiddleware(RequestDelegate next, ILogger<GlobalExceptionHandlerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "İstek işlenirken işlenmemiş bir hata meydana geldi: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
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

        var problemDetails = new ProblemDetails
        {
            Status = (int)statusCode,
            Title = title,
            Detail = exception.Message,
            Instance = context.Request.Path
        };

        problemDetails.Extensions["traceId"] = context.TraceIdentifier;

        var json = JsonSerializer.Serialize(problemDetails);
        return context.Response.WriteAsync(json);
    }
}
