using PSL.ProjectHub.Application.Interfaces;

namespace PSL.ProjectHub.Infrastructure.Services;

/// <summary>
/// Harici repository entegrasyonu henüz bağlanmadığında yanıltıcı sahte veri üretmez, entegrasyon durumunu açıkça belirtir.
/// </summary>
public class MockRepositoryMetadataProvider : IRepositoryMetadataProvider
{
    public Task<RepositoryMetadata?> GetMetadataAsync(string repositoryUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(repositoryUrl)) return Task.FromResult<RepositoryMetadata?>(null);

        // Gerçek entegrasyon bağlanana kadar sahte commit üretmek yerine bilinmeyen alanları belirtilmedi olarak işaretle
        var meta = new RepositoryMetadata(
            DefaultBranch: "main",
            LastCommitSha: "Doğrulanmadı",
            LastCommitMessage: "Canlı VCS entegrasyonu yapılandırılmadı",
            LastCommitDate: null,
            OpenIssuesCount: 0,
            LatestReleaseTag: null
        );

        return Task.FromResult<RepositoryMetadata?>(meta);
    }
}

/// <summary>
/// Otomatik sağlık kontrolü entegrasyonu bağlanana kadar sahte başarı döndürmez.
/// </summary>
public class MockApplicationHealthProvider : IApplicationHealthProvider
{
    public Task<ApplicationHealth> CheckHealthAsync(string applicationUrl, CancellationToken cancellationToken = default)
    {
        var health = new ApplicationHealth(
            Status: "Doğrulama Bekliyor",
            ResponseTimeMs: null,
            CheckedAt: DateTime.UtcNow,
            Details: "Otomatik ağ kontrolü henüz yapılandırılmadı. Bağlantı elle test edilmelidir."
        );

        return Task.FromResult(health);
    }
}

/// <summary>
/// Dağıtım (deployment) bilgisi gerçek sunucu ajanı olmadan sahte sunucu adı veya sürüm üretmez.
/// </summary>
public class MockDeploymentInfoProvider : IDeploymentInfoProvider
{
    public Task<DeploymentInfo?> GetDeploymentInfoAsync(string projectName, string environment, CancellationToken cancellationToken = default)
    {
        var info = new DeploymentInfo(
            Environment: environment ?? "Belirtilmedi",
            Version: "Belirtilmedi",
            LastDeployedAt: null,
            ServerName: "Belirtilmedi",
            AppPoolStatus: "Doğrulanmadı"
        );

        return Task.FromResult<DeploymentInfo?>(info);
    }
}
