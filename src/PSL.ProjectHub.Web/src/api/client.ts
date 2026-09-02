import {
  DashboardMetricsDto,
  ProjectSummaryDto,
  ProjectDetailDto,
  ProjectLinkDto,
  ProjectStatus,
  AuthUser
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('psl_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP Hata: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorData.title || errorMessage;
    } catch {
      // Fallback to response.statusText
    }
    throw new Error(errorMessage);
  }

  // If 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<AuthUser> {
    return request<AuthUser>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  async getMe(): Promise<any> {
    return request('/auth/me');
  },

  async seedDefaultData(): Promise<{ message: string }> {
    return request('/auth/seed', { method: 'POST' });
  },

  // Dashboard
  async getDashboardMetrics(): Promise<DashboardMetricsDto> {
    return request<DashboardMetricsDto>('/dashboard/metrics');
  },

  // Projects
  async getProjects(params?: {
    search?: string;
    status?: ProjectStatus;
    category?: string;
    technology?: string;
    integration?: string;
    owner?: string;
    onlyWithLiveUrl?: boolean;
    sortBy?: string;
    includeArchived?: boolean;
  }): Promise<ProjectSummaryDto[]> {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request<ProjectSummaryDto[]>(`/projects${query}`);
  },

  async getProject(identifier: string): Promise<ProjectDetailDto> {
    return request<ProjectDetailDto>(`/projects/${encodeURIComponent(identifier)}`);
  },

  async createProject(data: any): Promise<ProjectDetailDto> {
    return request<ProjectDetailDto>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProject(id: string, data: any): Promise<ProjectDetailDto> {
    return request<ProjectDetailDto>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async archiveProject(id: string): Promise<void> {
    await request(`/projects/${id}`, { method: 'DELETE' });
  },

  async setVerified(id: string, isVerified: boolean): Promise<void> {
    await request(`/projects/${id}/verify?isVerified=${isVerified}`, { method: 'POST' });
  },

  async addComponent(projectId: string, component: any): Promise<void> {
    await request(`/projects/${projectId}/components`, {
      method: 'POST',
      body: JSON.stringify(component),
    });
  },

  async addIntegration(projectId: string, integration: any): Promise<void> {
    await request(`/projects/${projectId}/integrations`, {
      method: 'POST',
      body: JSON.stringify(integration),
    });
  },

  async addRelease(projectId: string, release: any): Promise<void> {
    await request(`/projects/${projectId}/releases`, {
      method: 'POST',
      body: JSON.stringify(release),
    });
  },

  async addNote(projectId: string, note: any): Promise<void> {
    await request(`/projects/${projectId}/notes`, {
      method: 'POST',
      body: JSON.stringify(note),
    });
  },

  // Links
  async getProjectLinks(projectId: string, includeInactive = false): Promise<ProjectLinkDto[]> {
    return request<ProjectLinkDto[]>(`/projects/${projectId}/links?includeInactive=${includeInactive}`);
  },

  async createLink(projectId: string, linkData: any): Promise<ProjectLinkDto> {
    return request<ProjectLinkDto>(`/projects/${projectId}/links`, {
      method: 'POST',
      body: JSON.stringify(linkData),
    });
  },

  async updateLink(linkId: string, linkData: any): Promise<ProjectLinkDto> {
    return request<ProjectLinkDto>(`/links/${linkId}`, {
      method: 'PUT',
      body: JSON.stringify(linkData),
    });
  },

  async deleteOrDeactivateLink(linkId: string, hardDelete = false): Promise<void> {
    await request(`/links/${linkId}?hardDelete=${hardDelete}`, { method: 'DELETE' });
  },

  async setPrimaryLink(linkId: string): Promise<void> {
    await request(`/links/${linkId}/primary`, { method: 'POST' });
  },

  async reorderLinks(projectId: string, orderedIds: string[]): Promise<void> {
    await request(`/projects/${projectId}/links/reorder`, {
      method: 'POST',
      body: JSON.stringify(orderedIds),
    });
  },

  // Import
  async importUrls(payload: any[]): Promise<any> {
    return request('/url-import', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async importUrlsFromFile(fileName?: string): Promise<any> {
    const q = fileName ? `?fileName=${encodeURIComponent(fileName)}` : '';
    return request(`/url-import/file${q}`, { method: 'POST' });
  },
};
