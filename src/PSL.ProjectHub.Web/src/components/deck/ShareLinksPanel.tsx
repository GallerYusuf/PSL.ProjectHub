import React, { useEffect, useState } from 'react';
import { Link2, Ban, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import { ShareLinkDto } from '../../types';

const fmt = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/**
 * Yönetim panelinde paylaşım linklerinin listesi: kim, ne zaman, kaç kez açıldı; iptal.
 * Yeni link "Sunum Modu → Sunum Hazırla" penceresinden oluşturulur.
 */
export const ShareLinksPanel: React.FC = () => {
  const [links, setLinks] = useState<ShareLinkDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () => api.getShareLinks().then(setLinks).catch(err => setError(err instanceof Error ? err.message : 'Linkler yüklenemedi.'));

  useEffect(() => {
    load();
  }, []);

  const revoke = async (link: ShareLinkDto) => {
    if (!confirm(`'${link.title}' linki iptal edilsin mi? Linke sahip kimse sunumu artık açamaz.`)) return;
    try {
      await api.revokeShareLink(link.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İptal edilemedi.');
    }
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <Link2 size={16} color="var(--primary)" />
            <span>Paylaşım Linkleri</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
            Yeni link üst menüdeki "Sunum Modu" penceresinden oluşturulur.
          </p>
        </div>
      </div>

      {error && <div className="alert-box alert-danger"><AlertCircle size={16} /> <span>{error}</span></div>}

      {links.length === 0 ? (
        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0 }}>Henüz paylaşım linki oluşturulmadı.</p>
      ) : (
        <div className="table-container">
          <table className="table" style={{ fontSize: '0.84rem' }}>
            <thead>
              <tr>
                <th>Başlık</th>
                <th>Proje</th>
                <th>Oluşturan</th>
                <th>Bitiş</th>
                <th>Açılma</th>
                <th>Durum</th>
                <th aria-label="İşlem"></th>
              </tr>
            </thead>
            <tbody>
              {links.map(l => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 600 }}>{l.title}</td>
                  <td>{l.projectCount}</td>
                  <td>{l.createdBy ?? '—'}<div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{fmt(l.createdAt)}</div></td>
                  <td>{fmt(l.expiresAt)}</td>
                  <td>{l.viewCount}{l.lastViewedAt && <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>son: {fmt(l.lastViewedAt)}</div>}</td>
                  <td>
                    <span className={`badge ${l.isActive ? 'badge-verified' : ''}`}>
                      {l.isActive ? 'Aktif' : l.revokedAt ? 'İptal edildi' : 'Süresi doldu'}
                    </span>
                  </td>
                  <td>
                    {l.isActive && (
                      <button className="btn btn-ghost btn-sm" onClick={() => revoke(l)} aria-label={`${l.title} linkini iptal et`}>
                        <Ban size={14} /> <span>İptal</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
