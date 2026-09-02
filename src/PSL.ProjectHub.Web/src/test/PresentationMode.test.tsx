import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PresentationModal } from '../components/PresentationModal';
import { ProjectDetailDto } from '../types';

describe('PresentationModal Component', () => {
  const sampleDetail: ProjectDetailDto = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Emilio Stok Sistemi',
    slug: 'emilio-stok-sistemi',
    shortDescription: 'Emilio mağazası için anlık stok ve varyant sorgulama sistemi.',
    category: 'Mağazacılık',
    status: 'Live',
    statusText: 'Canlı',
    isVerified: true,
    ownerName: 'Yusuf Emre Deniz',
    department: 'Yazılım',
    businessProblem: 'Müşteriler mağazadayken stok ve renk seçeneklerinin anlık bilinememesi.',
    businessSolution: 'Nebim veritabanını doğrudan ve yüksek performansla sorgulayan web arayüzü.',
    businessValue: 'Mağaza satış dönüşümünde %25 artış.',
    targetUsers: 'Mağaza Danışmanları',
    currentVersion: 'v1.1.0',
    createdAt: '2024-01-01T00:00:00Z',
    isArchived: false,
    technologies: ['C#', 'ASP.NET Core', 'SQL Server'],
    components: [],
    links: [],
    screenshots: [],
    integrations: [],
    releases: [],
    notes: [],
    activeLinksCount: 0,
    hasVpnLink: false,
  };

  it('renders executive summary, problem, solution, and value cards in presentation mode', () => {
    const onClose = vi.fn();
    render(<PresentationModal project={sampleDetail} onClose={onClose} />);

    expect(screen.getByText('Emilio Stok Sistemi')).toBeInTheDocument();
    expect(screen.getByText('PSL Executive Sunum Modu')).toBeInTheDocument();
    expect(screen.getByText('Çözülen İş Problemi')).toBeInTheDocument();
    expect(screen.getByText('Müşteriler mağazadayken stok ve renk seçeneklerinin anlık bilinememesi.')).toBeInTheDocument();
    expect(screen.getByText('Getirilen Çözüm')).toBeInTheDocument();
    expect(screen.getByText('Şirkete Sağlanan Değer')).toBeInTheDocument();
    expect(screen.getByText('Mağaza satış dönüşümünde %25 artış.')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<PresentationModal project={sampleDetail} onClose={onClose} />);

    const closeBtn = screen.getByRole('button', { name: /Kapat/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
