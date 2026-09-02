using System.Text.RegularExpressions;

namespace PSL.ProjectHub.Application.Common;

public static class UrlValidator
{
    private static readonly string[] DangerousSchemes = ["javascript", "data", "file", "vbscript", "about", "blob"];
    private static readonly string[] SensitiveKeywords = ["token", "password", "secret", "apikey", "api_key", "passwd", "auth_key", "bearer"];

    public static (bool IsValid, string? ErrorMessage) ValidateUrl(string? rawUrl)
    {
        if (string.IsNullOrWhiteSpace(rawUrl))
            return (false, "URL adresi boş bırakılamaz.");

        var trimmed = rawUrl.Trim();

        // Prevent dangerous protocol schemes via explicit check
        foreach (var scheme in DangerousSchemes)
        {
            if (trimmed.StartsWith($"{scheme}:", StringComparison.OrdinalIgnoreCase))
                return (false, $"Güvenlik uyarısı: '{scheme}:' protokolü kabul edilmemektedir.");
        }

        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var parsedUri))
            return (false, "Geçersiz URL formatı. Lütfen tam bir web adresi girin (örn: https://ornek.sirket.internal).");

        if (parsedUri.Scheme != Uri.UriSchemeHttp && parsedUri.Scheme != Uri.UriSchemeHttps)
            return (false, $"Yalnızca HTTP ve HTTPS protokolleri kabul edilmektedir. Girilen protokol: {parsedUri.Scheme}");

        return (true, null);
    }

    public static bool ContainsSensitiveParameters(string rawUrl, out string? foundKeyword)
    {
        foundKeyword = null;
        if (string.IsNullOrWhiteSpace(rawUrl)) return false;

        if (Uri.TryCreate(rawUrl.Trim(), UriKind.Absolute, out var uri))
        {
            var query = uri.Query;
            if (!string.IsNullOrEmpty(query))
            {
                foreach (var keyword in SensitiveKeywords)
                {
                    if (query.Contains(keyword, StringComparison.OrdinalIgnoreCase))
                    {
                        foundKeyword = keyword;
                        return true;
                    }
                }
            }
        }

        return false;
    }

    public static string NormalizeSlug(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;

        var str = input.Trim()
            .Replace('İ', 'i')
            .Replace('I', 'i')
            .Replace('ı', 'i')
            .Replace('Ğ', 'g')
            .Replace('ğ', 'g')
            .Replace('Ü', 'u')
            .Replace('ü', 'u')
            .Replace('Ş', 's')
            .Replace('ş', 's')
            .Replace('Ö', 'o')
            .Replace('ö', 'o')
            .Replace('Ç', 'c')
            .Replace('ç', 'c')
            .ToLowerInvariant();

        var clean = Regex.Replace(str, @"[^a-z0-9\s-]", "");
        clean = Regex.Replace(clean, @"\s+", "-").Trim('-');
        return clean;
    }
}
