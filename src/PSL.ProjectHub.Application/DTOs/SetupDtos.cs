namespace PSL.ProjectHub.Application.DTOs;

public class SetupStatusResponse
{
    public bool IsInitialized { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class InitializeSystemRequest
{
    public string OrganizationName { get; set; } = string.Empty;
    public string AdminUsername { get; set; } = string.Empty;
    public string AdminEmail { get; set; } = string.Empty;
    public string AdminPassword { get; set; } = string.Empty;
    public string AdminFullName { get; set; } = string.Empty;
}