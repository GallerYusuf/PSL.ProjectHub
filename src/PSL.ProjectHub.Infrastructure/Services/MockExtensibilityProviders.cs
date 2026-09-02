using PSL.ProjectHub.Application.Interfaces;

namespace PSL.ProjectHub.Infrastructure.Services;

public class MockRepositoryMetadataProvider : IRepositoryMetadataProvider
{
    public Task<RepositoryMetadata?> GetMetadataAsync(string repositoryUrl, CancellationToken cancellationToken = default)
    {
        // Safe mock telemetry for MVP, no external SSRF calls
        if (string.IsNullOrWhiteSpace(repositoryUrl)) return Task.FromResult<RepositoryMetadata?>(null);

        var meta = new RepositoryMetadata(
            DefaultBranch: "main",
            LastCommitSha: "a8f3c91",
            LastCommitMessage: "Güncelleme ve performans iyileştirmesi",
            LastCommitDate: DateTime.UtcNow.AddDays(-2),
            OpenIssuesCount: 0,
            LatestReleaseTag: "v1.0.0"
        );

        return Task.FromResult<RepositoryMetadata?>(meta);
    }
}

public class MockApplicationHealthProvider : IApplicationHealthProvider
{
    public Task<ApplicationHealth> CheckHealthAsync(string applicationUrl, CancellationToken cancellationToken = default)
    {
        // Safe simulated health check, no outbound HTTP ping to prevent SSRF
        var health = new ApplicationHealth(
            Status: "Online (Simüle)",
            ResponseTimeMs: 42,
            CheckedAt: DateTime.UtcNow,
            Details: "İç ağ erişim kontrolü simüle edilmiştir. Güvenlik gerekçesiyle otomatik dış HTTP isteği engellenmiştir."
        );

        return Task.FromResult(health);
    }
}

public class MockDeploymentInfoProvider : IDeploymentInfoProvider
{
    public Task<DeploymentInfo?> GetDeploymentInfoAsync(string projectName, string environment, CancellationToken cancellationToken = default)
    {
        var info = new DeploymentInfo(
            Environment: environment ?? "Production",
            Version: "1.0.0",
            LastDeployedAt: DateTime.UtcNow.AddDays(-5),
            ServerName: "WIN-SRV-PSL01",
            AppPoolStatus: "Started"
        );

        return Task.FromResult<DeploymentInfo?>(info);
    }
}
