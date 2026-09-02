import React, { useState } from 'react';
import { X, Save, AlertTriangle, ShieldCheck } from 'lucide-react';
import { LinkType, EnvironmentType, ProjectLinkDto } from '../types';

interface AdminLinkModalProps {
  projectId: string;
  initialData?: ProjectLinkDto | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export const AdminLinkModal: React.FC<AdminLinkModalProps> = ({
  projectId,
  initialData,
  onClose,
  onSave,
}) => {
  const [label, setLabel] = useState(initialData?.label || '');
  const [url, setUrl] = useState(initialData?.url || '');
  const [linkType, setLinkType] = useState<LinkType>(initialData?.linkType || 'Production');
  const [environment, setEnvironment] = useState<EnvironmentType>(initialData?.environment || 'Production');
  const [isPrimary, setIsPrimary] = useState(initialData?.isPrimary || false);
  const [requiresVpn, setRequiresVpn] = useState(initialData?.requiresVpn || false);
  const [requiresAuthentication, setRequiresAuthentication] = useState(initialData?.requiresAuthentication || false);
  const [openInNewTab, setOpenInNewTab] = useState(initialData?.openInNewTab ?? true);
  const [displayOrder, setDisplayOrder] = useState(initialData?.displayOrder || 0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for sensitive query parameters in URL
  const checkSensitiveQuery = (inputUrl: string): boolean => {
    const lower = inputUrl.toLowerCase();
    const sensitive = ['token=', 'password=', 'secret=', 'apikey=', 'api_key=', 'auth='];
    return sensitive.some((s) => lower.includes(s));
  };

  const hasSensitiveQuery = checkSensitiveQuery(url);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedUrl = url.trim();
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setError('Güvenlik kuralı: Yalnızca http:// ve https:// protokolleri kabul edilir.');
      return;
    }

    if (!label.trim()) {
      setError('Bağlantı görünen adı zorunludur.');
      return;
    }

    const payload = {
      label: label.trim(),
      url: trimmedUrl,
      linkType,
      environment,
      isPrimary,
      requiresVpn,
      requiresAuthentication,
      openInNewTab,
      displayOrder: Number(displayOrder),
    };

    try {
      setLoading(true);
      setError(null);
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Bağlantı kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '580px' }}>
        <div className="modal-header">
          <h2 className="modal-title">
            {initialData ? 'Bağlantıyı Düzenle' : 'Yeni Bağlantı Ekle'}
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Security Alert: Sensitive parameters warning */}
        <div className="alert-box alert-warning">
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Güvenlik İlkesi:</strong> URL adresi içerisine oturum token'ı, API anahtarı veya parola gibi hassas bilgiler eklemeyiniz. Yalnızca doğrudan uygulama veya servis kök adreslerini giriniz.
          </div>
        </div>

        {hasSensitiveQuery && (
          <div className="alert-box alert-warning" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>Dikkat:</strong> Girilen URL adresinde gizli parametre (token, key, password) tespit edildi. Lütfen bu parametreleri URL'den temizleyiniz.
            </div>
          </div>
        )}

        {error && (
          <div className="alert-box alert-warning" style={{ background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)', color: '#fca5a5' }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Görünen Ad (Label) *</label>
            <input
              className="form-input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Örn: Canlı Web Portalı, Test Ortamı, Swagger API"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Gerçek Web Adresi (URL) *</label>
            <input
              className="form-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://app.gallerycrystal.internal veya https://..."
              required
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Sadece http:// ve https:// protokolleri kabul edilir. javascript:, data:, file: yasaktır.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Bağlantı Türü</label>
              <select
                className="form-select"
                value={linkType}
                onChange={(e) => setLinkType(e.target.value as LinkType)}
              >
                <option value="Production">Canlı Ortam (Production)</option>
                <option value="Test">Test Ortamı (Test/Staging)</option>
                <option value="AdminPanel">Yönetim Paneli</option>
                <option value="Api">API</option>
                <option value="Swagger">Swagger / OpenAPI</option>
                <option value="Documentation">Teknik Dokümantasyon</option>
                <option value="Repository">GitHub / Kaynak Kod</option>
                <option value="Monitoring">İzleme & Loglar</option>
                <option value="Other">Diğer</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Ortam Türü</label>
              <select
                className="form-select"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as EnvironmentType)}
              >
                <option value="Production">Production</option>
                <option value="Test">Test</option>
                <option value="Development">Development</option>
                <option value="Internal">Internal (İç Ağ)</option>
                <option value="External">External (Açık Web)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '0.75rem 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              <span>Birincil Bağlantı (Karttaki Ana Düğme)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input
                type="checkbox"
                checked={requiresVpn}
                onChange={(e) => setRequiresVpn(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-amber)' }}
              />
              <span>Şirket Ağı / VPN Gerektirir</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input
                type="checkbox"
                checked={requiresAuthentication}
                onChange={(e) => setRequiresAuthentication(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent-cyan)' }}
              />
              <span>Kimlik Doğrulama / Şifre Gerekir</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input
                type="checkbox"
                checked={openInNewTab}
                onChange={(e) => setOpenInNewTab(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              />
              <span>Yeni Sekmede Aç</span>
            </label>
          </div>

          <div className="form-group" style={{ width: '160px' }}>
            <label className="form-label">Gösterim Sırası</label>
            <input
              type="number"
              className="form-input"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Vazgeç
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={16} />
              <span>{loading ? 'Kaydediliyor...' : 'Bağlantıyı Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
