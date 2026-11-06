import React, { useEffect, useRef, useState } from 'react';
import { Building2, Save, Upload, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { BrandMark, useBranding } from '../context/BrandingContext';

/**
 * Firma kimliği ayarları: ad, ekip, yönetici, slogan, kurumsal renk ve logo.
 * Kaydedilen değerler anında tüm uygulamaya (menü, giriş, sunum) yansır.
 */
export const OrganizationSettingsPanel: React.FC = () => {
  const { branding, apply } = useBranding();
  const [form, setForm] = useState({
    organizationName: '',
    teamName: '',
    directorName: '',
    directorTitle: '',
    tagline: '',
    accentColor: '#0f4c81',
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm({
      organizationName: branding.organizationName ?? '',
      teamName: branding.teamName ?? '',
      directorName: branding.directorName ?? '',
      directorTitle: branding.directorTitle ?? '',
      tagline: branding.tagline ?? '',
      accentColor: branding.accentColor ?? '#0f4c81',
    });
  }, [branding]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const run = async (action: () => Promise<void>, okText: string) => {
    setSaving(true);
    setNotice(null);
    try {
      await action();
      setNotice({ kind: 'ok', text: okText });
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'İşlem başarısız.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => apply(await api.updateSettings(form)), 'Firma ayarları kaydedildi.');
  };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) run(async () => apply(await api.uploadLogo(file)), 'Logo güncellendi.');
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <Building2 size={16} color="var(--primary)" />
            <span>Firma Ayarları</span>
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
            Giriş ekranı, menü, sunum kapağı ve paylaşım sayfasında görünen kimlik bilgileri.
          </p>
        </div>
      </div>

      {notice && (
        <div className={`alert-box ${notice.kind === 'ok' ? 'alert-info' : 'alert-danger'}`} style={{ marginBottom: '1rem' }}>
          {notice.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{notice.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="org-name">Firma Adı</label>
          <input id="org-name" className="form-control" value={form.organizationName} onChange={set('organizationName')} required disabled={saving} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="org-team">Ekip Adı</label>
          <input id="org-team" className="form-control" value={form.teamName} onChange={set('teamName')} required disabled={saving} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="org-director">Ekip Yöneticisi</label>
          <input id="org-director" className="form-control" value={form.directorName} onChange={set('directorName')} placeholder="Ad Soyad" disabled={saving} />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="org-director-title">Unvanı</label>
          <input id="org-director-title" className="form-control" value={form.directorTitle} onChange={set('directorTitle')} placeholder="Örn: Yazılım Direktörü" disabled={saving} />
        </div>
        <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
          <label htmlFor="org-tagline">Slogan / Kısa Tanım</label>
          <input id="org-tagline" className="form-control" value={form.tagline} onChange={set('tagline')} placeholder="Örn: Operasyonu yazılımla hızlandırıyoruz" maxLength={300} disabled={saving} />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="org-accent">Kurumsal Renk</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input id="org-accent" type="color" className="form-control" style={{ width: '64px', padding: '0.2rem', height: '38px' }} value={form.accentColor} onChange={set('accentColor')} disabled={saving} />
            <code style={{ fontSize: '0.8rem' }}>{form.accentColor}</code>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label>Logo (PNG/JPG/WEBP, en fazla 2 MB)</label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <BrandMark size={38} />
            <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogo} style={{ display: 'none' }} />
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileInput.current?.click()} disabled={saving}>
              <Upload size={14} /> <span>Yükle</span>
            </button>
            {branding.logoUrl && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => run(async () => apply(await api.deleteLogo()), 'Logo kaldırıldı.')} disabled={saving}>
                <Trash2 size={14} /> <span>Kaldır</span>
              </button>
            )}
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            <Save size={14} /> <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
