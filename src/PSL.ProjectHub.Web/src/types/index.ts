export type ProjectStatus = 'Development' | 'Pilot' | 'Live' | 'Maintenance' | 'Archived';
export type LinkType = 'Production' | 'Test' | 'AdminPanel' | 'Api' | 'Swagger' | 'Documentation' | 'Repository' | 'Monitoring' | 'Other';
export type EnvironmentType = 'Production' | 'Test' | 'Development' | 'Internal' | 'External';
export type ComponentType = 'API' | 'Web' | 'Gateway' | 'Worker' | 'WindowsService' | 'ScheduledJob' | 'Other';
export type NoteType = 'KnownIssue' | 'DevelopmentNote' | 'Decision' | 'FuturePlan';

export interface ProjectLinkDto {
  id: string;
  projectId: string;
  projectComponentId?: string;
  projectComponentName?: string;
  label: string;
  url: string;
  linkType: LinkType;
  linkTypeText: string;
  environment: EnvironmentType;
  environmentText: string;
  isPrimary: boolean;
  isActive: boolean;
  requiresVpn: boolean;
  requiresAuthentication: boolean;
  openInNewTab: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt?: string;
}

export interface ProjectSummaryDto {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  category: string;
  status: ProjectStatus;
  statusText: string;
  isVerified: boolean;
  ownerName?: string;
  department?: string;
  liveDate?: string;
  currentVersion?: string;
  createdAt: string;
  updatedAt?: string;
  isArchived: boolean;
  technologies: string[];
  primaryLink?: ProjectLinkDto;
  hasVpnLink: boolean;
  activeLinksCount: number;
}

export interface ProjectComponentDto {
  id: string;
  projectId: string;
  name: string;
  componentType: ComponentType;
  componentTypeText: string;
  description?: string;
  environment?: string;
  displayOrder: number;
}

export interface ProjectScreenshotDto {
  id: string;
  projectId: string;
  fileName: string;
  filePath: string;
  caption?: string;
  isCover?: boolean;
  displayOrder: number;
}

export interface UpdateScreenshotRequest {
  caption?: string;
  isCover: boolean;
  displayOrder: number;
}

export interface ProjectIntegrationDto {
  id: string;
  projectId: string;
  name: string;
  integrationType: string;
  description?: string;
  isCritical: boolean;
}

export interface ProjectReleaseDto {
  id: string;
  projectId: string;
  version: string;
  title: string;
  description?: string;
  releaseDate: string;
  environment?: string;
}

export interface ProjectNoteDto {
  id: string;
  projectId: string;
  title: string;
  content: string;
  noteType: NoteType;
  noteTypeText: string;
  createdAt: string;
}

export interface ProjectDetailDto extends ProjectSummaryDto {
  businessProblem?: string;
  businessSolution?: string;
  businessValue?: string;
  targetUsers?: string;
  startDate?: string;
  components: ProjectComponentDto[];
  links: ProjectLinkDto[];
  screenshots: ProjectScreenshotDto[];
  integrations: ProjectIntegrationDto[];
  releases: ProjectReleaseDto[];
  notes: ProjectNoteDto[];
}

export interface DashboardMetricsDto {
  totalProjects: number;
  liveProjects: number;
  pilotProjects: number;
  developmentProjects: number;
  maintenanceProjects: number;
  pendingVerificationProjects: number;
  quickAccessProjects: ProjectSummaryDto[];
  recentlyUpdatedProjects: ProjectSummaryDto[];
  recentReleases: ProjectReleaseDto[];
  criticalIntegrations: ProjectIntegrationDto[];
}

export interface AuthUser {
  username: string;
  fullName: string;
  email: string;
  roles: string[];
  token: string;
}
