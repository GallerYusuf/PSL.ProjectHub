import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectSummaryDto } from '../types';

describe('ProjectCard Component', () => {
  const baseProject: ProjectSummaryDto = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'E-Fatura Otomasyonu',
    slug: 'e-fatura-otomasyonu',
    shortDescription: 'Kütahya şubesi faturalama hazırlık sistemi.',
    category: 'Muhasebe',
    status: 'Live',
    statusText: 'Canlı',
    isVerified: true,
    ownerName: 'İbrahim Çevik',
    department: 'Yazılım',
    createdAt: '2024-01-01T00:00:00Z',
    isArchived: false,
    technologies: ['C#', '.NET 8', 'SQL Server'],
    activeLinksCount: 1,
    hasVpnLink: false,
  };

  it('renders project name, description and status badge correctly', () => {
    const onViewDetails = vi.fn();
    render(<ProjectCard project={baseProject} onViewDetails={onViewDetails} />);

    expect(screen.getByText('E-Fatura Otomasyonu')).toBeInTheDocument();
    expect(screen.getByText('Kütahya şubesi faturalama hazırlık sistemi.')).toBeInTheDocument();
    expect(screen.getByText('Canlı')).toBeInTheDocument();
    expect(screen.getByText('Muhasebe')).toBeInTheDocument();
    expect(screen.getByText('Doğrulandı')).toBeInTheDocument();
  });

  it('renders "Uygulamayı Aç" button with target="_blank" and noopener noreferrer when primary URL exists', () => {
    const projectWithUrl: ProjectSummaryDto = {
      ...baseProject,
      primaryLink: {
        id: '22222222-2222-2222-2222-222222222222',
        projectId: baseProject.id,
        label: 'Canlı Uygulama',
        url: 'https://efatura.gallerycrystal.internal',
        linkType: 'Production',
        linkTypeText: 'Production',
        environment: 'Production',
        environmentText: 'Production',
        isPrimary: true,
        isActive: true,
        requiresVpn: false,
        requiresAuthentication: true,
        openInNewTab: true,
        displayOrder: 1,
        createdAt: '2024-01-01T00:00:00Z',
      },
    };

    render(<ProjectCard project={projectWithUrl} onViewDetails={vi.fn()} />);

    const openButton = screen.getByRole('link', { name: /Uygulamayı Aç/i });
    expect(openButton).toBeInTheDocument();
    expect(openButton).toHaveAttribute('href', 'https://efatura.gallerycrystal.internal');
    expect(openButton).toHaveAttribute('target', '_blank');
    expect(openButton).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('does NOT render "Uygulamayı Aç" button when primary URL is missing', () => {
    const projectWithoutUrl: ProjectSummaryDto = {
      ...baseProject,
      primaryLink: undefined,
    };

    render(<ProjectCard project={projectWithoutUrl} onViewDetails={vi.fn()} />);

    expect(screen.queryByRole('link', { name: /Uygulamayı Aç/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Detaylar/i })).toBeInTheDocument();
  });

  it('renders "Şirket Ağı veya VPN Gerekebilir" badge when requiresVpn is true', () => {
    const vpnProject: ProjectSummaryDto = {
      ...baseProject,
      hasVpnLink: true,
      primaryLink: {
        id: '33333333-3333-3333-3333-333333333333',
        projectId: baseProject.id,
        label: 'İç Ağ Portalı',
        url: 'https://internal.gallerycrystal.internal',
        linkType: 'Production',
        linkTypeText: 'Production',
        environment: 'Internal',
        environmentText: 'Internal',
        isPrimary: true,
        isActive: true,
        requiresVpn: true,
        requiresAuthentication: true,
        openInNewTab: true,
        displayOrder: 1,
        createdAt: '2024-01-01T00:00:00Z',
      },
    };

    render(<ProjectCard project={vpnProject} onViewDetails={vi.fn()} />);

    expect(screen.getByText(/Şirket Ağı veya VPN Gerekebilir/i)).toBeInTheDocument();
  });
});
