import React, { useEffect, useState } from 'react';
import { X, Play, Link2, Copy, Check, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import { DeckDto, ProjectSummaryDto } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useBranding } from '../../context/BrandingContext';

interface PresentationSetupProps {
  onClose: () => void;
  onStart: (deck: DeckDto) => void;
}

const STATUS_TEXT: Record<string, string> = {
  Live: 'Canlı', Pilot: 'Pilot', Development: 'Geliştiriliyor', Maintenance: 'Bakımda', Archived: 'Arşiv',
};

/** Paylaşım linkinin tam adresi. Anahtar hash içinde taşınır; sunucu loglarına ve Referer başlığına düşmez. */
export const shareUrl = (token: string) => `${window.location.origin}${window.location.pathname}#share/${token}`;

/**
 * Sunum öncesi proje seçimi; sunumu başlatır veya (Admin) süreli paylaşım linki üretir.
 */
export const PresentationSetup: React.FC<PresentationSetupProps> = ({ onClose, onStart }) => {
  const { isAdmin } = useAuth();
  const { branding } = useBranding();
  const [projects, setProjects] = useState<ProjectSummaryDto[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shareTitle, setShareTitle] = useState('');
  const [expiresInDays, setExpiresInDays] = useState(30);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setShareTitle(`${branding.teamName} — ${new Date().getFullYear()} Proje Portföyü`);
  }, [branding.teamName]);

  useEffect(() => {
    api.getProjects()
      .then(list => {
        const visible = list.filter(p => p.status !== 'Archived');
        setProjects(visible);
        setSelected(new Set(visible.filter(p => p.status !== 'Development').map(p => p.id)));
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Projeler yüklenemedi.'))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) =>
    setSelected(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const ids = projects.filter(p => selected.has(p.id)).map(p => p.id);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      onStart(await api.getDeck(ids));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sunum hazırlanamadı.');
    } finally {
      setBusy(false);
    }
  };

  const createLink = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await api.createShareLink({ title: shareTitle.trim(), projectIds: ids, expiresInDays });
      setCreatedUrl(shareUrl(created.token));
      setCopied(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Link oluşturulamadı.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!createdUrl) return;
    try {
      await navigator.clipboard.writeText(createdUrl);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" role="dialog" aria-modal="true" aria-labelledby="presentation-setup-title" style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <h2 className="modal-title" id="presentation-setup-title">Sunum Hazırla</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Kapat"><X size={18} /></button>
        </div>

        <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '-0.25rem 0 0.85rem' }}>
          Sunum kapak, ekibin etkisi, portföy özeti, seçili projeler ve yıl özetinden oluşur. Varsayılan olarak geliştirme aşamasındakiler hariç tüm projeler seçilidir.
        </p>

        {error && <div className="alert-box alert-danger"><AlertCircle size={16} /> <span>{error}</span></div>}

        {loading ? (
          <p style={{ color: 'var(--text-muted)' }}>Projeler yükleniyor...</p>
        ) : (
          <fieldset style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', maxHeight: '260px', overflowY: 'auto', margin: 0 }}>
            <legend style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', padding: '0 0.3rem' }}>
              Projeler ({ids.length}/{projects.length})
            </legend>
            {projects.length === 0 && <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Henüz proje yok.</p>}
            {projects.map(p => (
              <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.3rem 0', fontSize: '0.88rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                <span style={{ flex: 1, fontWeight: 600 }}>{p.name}</span>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{STATUS_TEXT[p.status] ?? p.status}</span>
              </label>
            ))}
          </fieldset>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem' }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={busy}>Vazgeç</button>
          <button className="btn btn-primary" onClick={start} disabled={busy || loading || ids.length === 0}>
            <Play size={16} /> <span>Sunumu Başlat</span>
          </button>
        </div>

        {isAdmin && (
          <section aria-labelledby="share-title" style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <h3 id="share-title" style={{ fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: '0 0 0.35rem' }}>
              <Link2 size={16} color="var(--primary)" /> Paylaşım Linki
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0 0 0.65rem' }}>
              Giriş yapmadan açılan, salt okunur ve süreli link. Yalnızca seçili projeler görünür; iç ağ, VPN, yönetim paneli ve Swagger adresleri paylaşılmaz.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px auto', gap: '0.5rem' }}>
              <input className="form-input" aria-label="Link başlığı" value={shareTitle} onChange={e => setShareTitle(e.target.value)} maxLength={200} disabled={busy} />
              <select className="form-select" aria-label="Geçerlilik süresi" value={expiresInDays} onChange={e => setExpiresInDays(Number(e.target.value))} disabled={busy}>
                <option value={7}>7 gün</option>
                <option value={30}>30 gün</option>
                <option value={90}>90 gün</option>
              </select>
              <button className="btn btn-secondary" onClick={createLink} disabled={busy || ids.length === 0 || !shareTitle.trim()}>
                Link Oluştur
              </button>
            </div>

            {createdUrl && (
              <div className="alert-box alert-info" style={{ marginTop: '0.75rem', display: 'block' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input className="form-input" readOnly value={createdUrl} aria-label="Paylaşım linki" style={{ flex: 1, fontSize: '0.78rem' }} onFocus={e => e.target.select()} />
                  <button className="btn btn-primary btn-sm" onClick={copy}>
                    {copied ? <Check size={14} /> : <Copy size={14} />} <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
                  </button>
                </div>
                <p style={{ fontSize: '0.76rem', margin: '0.45rem 0 0' }}>
                  Bu link yalnızca şimdi gösterilir; güvenlik için sistemde açık hali saklanmaz. Linkleri Yönetim Paneli'nden izleyip iptal edebilirsiniz.
                </p>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
