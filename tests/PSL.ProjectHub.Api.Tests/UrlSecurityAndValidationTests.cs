using PSL.ProjectHub.Application.Common;
using Xunit;

namespace PSL.ProjectHub.Api.Tests;

public class UrlSecurityAndValidationTests
{
    [Theory]
    [InlineData("http://localhost:5000")]
    [InlineData("https://gallerycrystal.com.tr")]
    [InlineData("https://api.internal.network/swagger")]
    [InlineData("http://192.168.1.100:8080/portal")]
    public void ValidateUrl_ValidHttpAndHttps_ReturnsTrue(string url)
    {
        var (isValid, errorMessage) = UrlValidator.ValidateUrl(url);

        Assert.True(isValid);
        Assert.Null(errorMessage);
    }

    [Theory]
    [InlineData("javascript:alert('xss')")]
    [InlineData("JAVASCRIPT:document.cookie")]
    [InlineData("data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==")]
    [InlineData("file:///C:/Windows/System32/drivers/etc/hosts")]
    [InlineData("vbscript:MsgBox(1)")]
    [InlineData("about:blank")]
    [InlineData("ftp://ftp.example.com")]
    public void ValidateUrl_DangerousOrInvalidSchemes_ReturnsFalse(string dangerousUrl)
    {
        var (isValid, errorMessage) = UrlValidator.ValidateUrl(dangerousUrl);

        Assert.False(isValid);
        Assert.NotNull(errorMessage);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    [InlineData("not-a-valid-url")]
    public void ValidateUrl_EmptyOrMalformed_ReturnsFalse(string? malformedUrl)
    {
        var (isValid, errorMessage) = UrlValidator.ValidateUrl(malformedUrl);

        Assert.False(isValid);
        Assert.NotNull(errorMessage);
    }

    [Fact]
    public void ContainsSensitiveParameters_WhenQueryContainsTokenOrSecret_ReturnsTrue()
    {
        var sensitiveUrl = "https://app.example.internal/callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
        var hasSensitive = UrlValidator.ContainsSensitiveParameters(sensitiveUrl, out var keyword);

        Assert.True(hasSensitive);
        Assert.Equal("token", keyword);
    }

    [Fact]
    public void ContainsSensitiveParameters_WhenSafeUrl_ReturnsFalse()
    {
        var safeUrl = "https://app.example.internal/projects?page=1&category=erp";
        var hasSensitive = UrlValidator.ContainsSensitiveParameters(safeUrl, out var keyword);

        Assert.False(hasSensitive);
        Assert.Null(keyword);
    }

    [Theory]
    [InlineData("Müşteri Platformu", "musteri-platformu")]
    [InlineData("E-Fatura & İrsaliye Otomasyonu!", "e-fatura-irsaliye-otomasyonu")]
    [InlineData("   Özel   Proje   Adı   ", "ozel-proje-adi")]
    public void NormalizeSlug_ProducesUrlFriendlySlug(string input, string expected)
    {
        var slug = UrlValidator.NormalizeSlug(input);
        Assert.Equal(expected, slug);
    }
}
