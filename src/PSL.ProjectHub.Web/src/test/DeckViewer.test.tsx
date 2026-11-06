import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeckViewer, buildSlides } from '../components/deck/DeckViewer';
import { App } from '../App';
import { api } from '../api/client';
import { DeckDto } from '../types';

const deck: DeckDto = {
  title: 'Yönetim Kurulu Sunumu',
  branding: { organizationName: 'Örnek A.Ş.', teamName: 'Yazılım Ekibi', accentColor: '#0f4c81', directorName: 'Ayşe Yılmaz', directorTitle: 'Yazılım Direktörü' },
  generatedAt: '2026-11-06T10:00:00Z',
  impact: {
    hoursSavedPerMonth: 120, usersReached: 45, costSavingPerYear: 0, projectsWithMetrics: 1,
    highlights: [{ projectId: 'p1', projectName: 'B2B Panel', projectSlug: 'b2b', kind: 'TimeSaved', label: 'Manuel iş', value: 120, unit: 'saat/ay' }],
  },
  statusCounts: { live: 1, pilot: 0, development: 1, maintenance: 0 },
  timeline: { year: 2026, projectsStarted: 1, projectsWentLive: 1, releases: 0 },
  projects: [
    {
      id: 'p1', name: 'B2B Panel', slug: 'b2b', shortDescription: 'Bayi sipariş paneli', category: 'Satış', status: 'Live',
      businessProblem: 'Siparişler telefonla alınıyordu', technologies: ['.NET 8'], imageUrls: [], liveUrl: 'https://b2b.firma.com',
      metrics: [{ id: 'm1', projectId: 'p1', kind: 'TimeSaved', label: 'Manuel iş kaldırıldı', value: 120, unit: 'saat/ay', displayOrder: 0 }],
      team: [{ teamMemberId: 't1', fullName: 'Mehmet Kaya', role: 'Geliştirici', isLead: true }],
    },
    {
      id: 'p2', name: 'Stok Uygulaması', slug: 'stok', shortDescription: 'Barkodla stok sorgu', category: 'Operasyon', status: 'Development',
      technologies: [], imageUrls: [], metrics: [], team: [],
    },
  ],
};

describe('Sunum görüntüleyici', () => {
  it('kapak, etki, portföy, projeler, yıl özeti ve kapanıştan oluşan akış üretir', () => {
    expect(buildSlides(deck).map(s => s.key)).toEqual(['cover', 'impact', 'portfolio', 'p-p1', 'p-p2', 'year', 'closing']);
    expect(buildSlides(deck, true).map(s => s.key)).toEqual(['p-p1', 'p-p2']);
  });

  it('kapakla açılır, klavyeyle ilerler ve Esc ile kapanır', () => {
    const onClose = vi.fn();
    render(<DeckViewer deck={deck} onClose={onClose} />);

    expect(screen.getByRole('heading', { name: 'Yönetim Kurulu Sunumu' })).toBeInTheDocument();
    expect(screen.getByText('1 / 7 · Kapak')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByRole('heading', { name: 'Ekibin etkisi rakamlarla' })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'End' });
    expect(screen.getByRole('heading', { name: 'Sırada ne var?' })).toBeInTheDocument();
    expect(screen.getByText('Stok Uygulaması')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('proje slaytında metrik, ekip ve canlı adres gösterir', () => {
    render(<DeckViewer deck={deck} projectsOnly />);
    expect(screen.getByRole('heading', { name: 'B2B Panel' })).toBeInTheDocument();
    expect(screen.getByText('Manuel iş kaldırıldı')).toBeInTheDocument();
    expect(screen.getByText(/Mehmet Kaya/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Uygulamayı Aç/ })).toHaveAttribute('href', 'https://b2b.firma.com');
  });
});

describe('Paylaşım linki sayfası', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('#share/ adresi oturum açmadan sunumu gösterir', async () => {
    const token = 'A'.repeat(43);
    const getPublicDeck = vi.spyOn(api, 'getPublicDeck').mockResolvedValue({ ...deck, expiresAt: '2026-12-06T00:00:00Z' });
    const getSetupStatus = vi.spyOn(api, 'getSetupStatus');
    window.location.hash = `#share/${token}`;

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Yönetim Kurulu Sunumu' })).toBeInTheDocument();
    expect(getPublicDeck).toHaveBeenCalledWith(token);
    expect(getSetupStatus).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Oturum Aç/i })).not.toBeInTheDocument();
    window.location.hash = '';
  });

  it('geçersiz link için anlaşılır hata gösterir', async () => {
    vi.spyOn(api, 'getPublicDeck').mockRejectedValue(new Error('Bu paylaşım linki geçersiz, süresi dolmuş ya da iptal edilmiş.'));
    window.location.hash = `#share/${'B'.repeat(43)}`;

    render(<App />);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('süresi dolmuş'));
    window.location.hash = '';
  });
});
