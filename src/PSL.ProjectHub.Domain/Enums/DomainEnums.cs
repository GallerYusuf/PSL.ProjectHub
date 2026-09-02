namespace PSL.ProjectHub.Domain.Enums;

public enum ProjectStatus
{
    Development, // Geliştiriliyor
    Pilot,       // Pilot
    Live,        // Canlı
    Maintenance, // Bakımda
    Archived     // Arşivlendi
}

public enum LinkType
{
    Production,
    Test,
    AdminPanel,
    Api,
    Swagger,
    Documentation,
    Repository,
    Monitoring,
    Other
}

public enum EnvironmentType
{
    Production,
    Test,
    Development,
    Internal,
    External
}

public enum ComponentType
{
    API,
    Web,
    Gateway,
    Worker,
    WindowsService,
    ScheduledJob,
    Other
}

public enum TechnologyCategory
{
    Backend,
    Frontend,
    Database,
    Infrastructure,
    Integration,
    Tool
}

public enum NoteType
{
    KnownIssue,
    DevelopmentNote,
    Decision,
    FuturePlan
}
