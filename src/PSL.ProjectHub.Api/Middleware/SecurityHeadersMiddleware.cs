namespace PSL.ProjectHub.Api.Middleware;

/// <summary>
/// Content Security Policy (CSP) ve güvenlik headerları middleware.
/// JWT + localStorage kullanıldığından XSS riskini azaltmak için strict CSP zorunludur.
/// ADR-001''e bakınız.
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;

        // CSP: inline script ve inline style yasak; eval yasak
        // Kaynaklar yalnızca aynı origin''den (self) gelir
        headers["Content-Security-Policy"] =
            "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
            "font-src 'self' https://fonts.gstatic.com; " +
            "img-src 'self' data: blob:; " +
            "connect-src 'self'; " +
            "frame-ancestors 'none'; " +
            "object-src 'none'; " +
            "base-uri 'self';";

        // Clickjacking koruması
        headers["X-Frame-Options"] = "DENY";

        // MIME type sniffing koruması
        headers["X-Content-Type-Options"] = "nosniff";

        // Referrer bilgisini dış sitelere sızdırma
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        // Permissions Policy — gereksiz browser özelliklerini kapat
        headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=(), payment=()";

        // Server başlığını gizle
        headers.Remove("Server");
        headers.Remove("X-Powered-By");

        await _next(context);
    }
}