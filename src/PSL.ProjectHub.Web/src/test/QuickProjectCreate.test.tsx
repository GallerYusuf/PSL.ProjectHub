import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminProjectModal } from '../components/AdminProjectModal';
import { ProjectCompleteness } from '../components/project-detail/ProjectCompleteness';
import { api } from '../api/client';
import { ProjectDetailDto } from '../types';

const createdProject = {
  id: 'p1', name: 'B2B Panel', slug: 'b2b-panel', shortDescription: 'Bayi paneli',
  category: 'Satış', status: 'Live', statusText: 'Live', isVerified: false,
  createdAt: '2026-11-06T00:00:00Z', isArchived: false, technologies: [],
  hasVpnLink: false, activeLinksCount: 0, components: [], links: [], screenshots: [],
  integrations: [], releases: [], notes: [],
} as unknown as ProjectDetailDto;

describe('Hızlı proje ekleme', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('yalnızca ad ve tek cümle ile projeyi, yapıştırılan bağlantılarla birlikte oluşturur', async () => {
    const createLink = vi.spyOn(api, 'createLink').mockResolvedValue({} as never);
    const onSave = vi.fn().mockResolvedValue(createdProject);
    const onCreated = vi.fn();

    render(<AdminProjectModal onClose={() => {}} onSave={onSave} onCreated={onCreated} />);

    // Detay alanları varsayılan olarak gizli
    expect(screen.queryByLabelText('Çözülen İş Problemi')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Proje Adı *'), { target: { value: 'B2B Panel' } });
    fireEvent.change(screen.getByLabelText('Ne işe yarıyor? (tek cümle) *'), { target: { value: 'Bayi paneli' } });
    fireEvent.change(screen.getByLabelText('Bağlantı adresleri'), {
      target: { value: 'https://b2b.firma.com\nhttps://b2b.firma.com/swagger' },
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Projeyi ve 2 bağlantıyı kaydet' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'B2B Panel', category: 'Genel' }));
    expect(createLink).toHaveBeenCalledTimes(2);
    // İlk canlı adres ana bağlantı yapılır, swagger yapılmaz
    expect(createLink.mock.calls[0][1]).toMatchObject({ url: 'https://b2b.firma.com', isPrimary: true, linkType: 'Production' });
    expect(createLink.mock.calls[1][1]).toMatchObject({ linkType: 'Swagger', isPrimary: false });
    expect(onCreated.mock.calls[0][1]).toEqual({ created: 2, failed: [] });
  });

  it('eklenemeyen bağlantıları sebebiyle birlikte bildirir', async () => {
    vi.spyOn(api, 'createLink').mockRejectedValue(new Error('Bu adres zaten kayıtlı.'));
    const onCreated = vi.fn();

    render(<AdminProjectModal onClose={() => {}} onSave={vi.fn().mockResolvedValue(createdProject)} onCreated={onCreated} />);
    fireEvent.change(screen.getByLabelText('Proje Adı *'), { target: { value: 'X' } });
    fireEvent.change(screen.getByLabelText('Ne işe yarıyor? (tek cümle) *'), { target: { value: 'Y' } });
    fireEvent.change(screen.getByLabelText('Bağlantı adresleri'), { target: { value: 'https://x.firma.com' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Projeyi ve 1 bağlantıyı kaydet' }));

    await waitFor(() => expect(onCreated).toHaveBeenCalled());
    expect(onCreated.mock.calls[0][1].failed).toEqual([{ url: 'https://x.firma.com', reason: 'Bu adres zaten kayıtlı.' }]);
  });
});

describe('Proje dosyası doluluk kartı', () => {
  it('eksik alanları listeler ve tıklanınca ilgili aksiyonu tetikler', () => {
    const onAction = vi.fn();
    render(<ProjectCompleteness project={createdProject} onAction={onAction} />);

    expect(screen.getByText('Sunuma hazırlık: %0')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '+ Ekran görüntüsü' }));
    expect(onAction).toHaveBeenCalledWith('screenshot', undefined);
    fireEvent.click(screen.getByRole('button', { name: '+ Şirkete değeri' }));
    // Düzenleme formu ilgili alana odaklanarak açılır
    expect(onAction).toHaveBeenCalledWith('edit', 'project-value');
  });
});
