import React, { useState } from 'react';
import { X, Save, AlertCircle, ChevronDown, ChevronUp, Link2 } from 'lucide-react';
import { ProjectStatus, ProjectDetailDto } from '../types';
import { BulkLinkPaste, saveLinkDrafts, SaveLinksResult } from './BulkLinkPaste';
import { LinkDraft } from '../utils/linkGuess';

const CATEGORY_SUGGESTIONS = [
  'Satış', 'E-Ticaret', 'Muhasebe & Finans', 'Operasyon', 'Lojistik & Stok',
  'Müşteri İlişkileri', 'Entegrasyon', 'Raporlama', 'İnsan Kaynakları', 'İç Araçlar',
];

interface AdminProjectModalProps {
  initialData?: ProjectDetailDto | null;
  onClose: () => void;
  /** Yeni projede oluşturulan projeyi döndürmelidir ki yapıştırılan linkler ona eklenebilsin. */
  onSave: (data: any) => Promise<ProjectDetailDto | void>;
  /** Yeni proje ve linkleri kaydedildikten sonra çağrılır (ör. proje sayfasına gitmek için). */
  onCreated?: (project: ProjectDetailDto, links: SaveLinksResult) => void;
}

export const AdminProjectModal: React.FC<AdminProjectModalProps> = ({
  initialData,
  onClose,
  onSave,
  onCreated,
}) => {
  const isNew = !initialData;
  const [showAll, setShowAll] = useState(!isNew);
  const [name, setName] = useState(initialData?.name || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || '');
  const [category, setCategory] = useState(initialData?.category || 'Genel');
  const [status, setStatus] = useState<ProjectStatus>(initialData?.status || 'Development');
  const [isVerified, setIsVerified] = useState(initialData?.isVerified ?? false);
  const [ownerName, setOwnerName] = useState(initialData?.ownerName || '');
  const [department, setDepartment] = useState(initialData?.department || '');
  const [targetUsers, setTargetUsers] = useState(initialData?.targetUsers || '');
  const [businessProblem, setBusinessProblem] = useState(initialData?.businessProblem || '');
  const [businessSolution, setBusinessSolution] = useState(initialData?.businessSolution || '');
  const [businessValue, setBusinessValue] = useState(initialData?.businessValue || '');
  const [currentVersion, setCurrentVersion] = useState(initialData?.currentVersion || '');
  const [techInput, setTechInput] = useState(initialData?.technologies?.join(', ') || '');
  const [linkDrafts, setLinkDrafts] = useState<LinkDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortDescription.trim()) {
      setError('Proje adı ve tek cümlelik açıklama zorunludur.');
      return;
    }

    const techs = techInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      shortDescription: shortDescription.trim(),
      category: category.trim() || 'Genel',
      status,
      isVerified,
      ownerName: ownerName.trim() || undefined,
      department: department.trim() || undefined,
      targetUsers: targetUsers.trim() || undefined,
      businessProblem: businessProblem.trim() || undefined,
      businessSolution: businessSolution.trim() || undefined,
      businessValue: businessValue.trim() || undefined,
      currentVersion: currentVersion.trim() || undefined,
      technologies: techs,
    };

    try {
      setLoading(true);
      setError(null);
      const saved = await onSave(payload);

      if (isNew && saved) {
        const linkResult = linkDrafts.length > 0
          ? await saveLinkDrafts(saved.id, linkDrafts, false)
          : { created: 0, failed: [] };
        if (onCreated) {
          onCreated(saved, linkResult);
          return;
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Proje kaydedilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            {initialData ? 'Projeyi Düzenle' : 'Yeni Proje'}
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </div>

        {isNew && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '-0.25rem 0 1rem' }}>
            Başlamak için ad ve tek cümle yeterli. İş değeri, ekip ve teknoloji gibi detayları proje sayfasından sonra tamamlayabilirsiniz.
          </p>
        )}

        {error && (
          <div className="alert-box alert-warning">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="project-name">Proje Adı *</label>
            <input
              id="project-name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: E-Fatura Otomasyonu"
              maxLength={200}
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="project-summary">Ne işe yarıyor? (tek cümle) *</label>
            <input
              id="project-summary"
              className="form-input"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Örn: Gelen e-faturaları irsaliyelerle eşleştirip ERP'ye otomatik işler."
              maxLength={500}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="project-status">Durum</label>
              <select
                id="project-status"
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              >
                <option value="Development">Geliştiriliyor</option>
                <option value="Pilot">Pilot</option>
                <option value="Live">Canlı</option>
                <option value="Maintenance">Bakımda</option>
                <option value="Archived">Arşivlendi</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="project-category">Kategori</label>
              <input
                id="project-category"
                className="form-input"
                list="project-category-options"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Satış, Muhasebe, E-Ticaret..."
                maxLength={100}
              />
              <datalist id="project-category-options">
                {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
          </div>

          {isNew && (
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Link2 size={14} /> Bağlantılar (opsiyonel)
              </label>
              <BulkLinkPaste onChange={setLinkDrafts} disabled={loading} />
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
                Tür ve ortam adresten tahmin edilir; tablodan düzeltebilirsiniz. İlk canlı adres projenin ana bağlantısı olur.
              </p>
            </div>
          )}

          {isNew && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ marginBottom: '1rem', paddingLeft: 0 }}
              onClick={() => setShowAll((v) => !v)}
              aria-expanded={showAll}
            >
              {showAll ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{showAll ? 'Detayları gizle' : 'Detayları şimdi doldur (sorumlu, teknoloji, iş değeri...)'}</span>
            </button>
          )}

          {showAll && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="project-owner">Proje Sorumlusu</label>
                  <input id="project-owner" className="form-input" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Ad Soyad" maxLength={150} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="project-department">Kullanan Departman</label>
                  <input id="project-department" className="form-input" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Satış, Muhasebe vb." maxLength={150} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="project-version">Sürüm</label>
                  <input id="project-version" className="form-input" value={currentVersion} onChange={(e) => setCurrentVersion(e.target.value)} placeholder="v1.0.0" maxLength={50} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="project-target-users">Hedef Kullanıcılar</label>
                <input id="project-target-users" className="form-input" value={targetUsers} onChange={(e) => setTargetUsers(e.target.value)} placeholder="Mağaza personeli, bayiler, muhasebe..." maxLength={250} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="project-techs">Teknolojiler (virgülle ayırın)</label>
                <input id="project-techs" className="form-input" value={techInput} onChange={(e) => setTechInput(e.target.value)} placeholder="C#, .NET 8, React, SQL Server" />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="project-problem">Çözülen İş Problemi</label>
                <textarea id="project-problem" className="form-textarea" value={businessProblem} onChange={(e) => setBusinessProblem(e.target.value)} placeholder="Bu proje öncesinde ne zordu, ne yavaştı, ne hataya açıktı?" maxLength={2000} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="project-solution">Getirilen Çözüm</label>
                <textarea id="project-solution" className="form-textarea" value={businessSolution} onChange={(e) => setBusinessSolution(e.target.value)} placeholder="Sistem bu süreci nasıl değiştirdi?" maxLength={2000} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="project-value">Şirkete Sağlanan Değer</label>
                <textarea id="project-value" className="form-textarea" value={businessValue} onChange={(e) => setBusinessValue(e.target.value)} placeholder="Zaman tasarrufu, hata oranında düşüş, maliyet avantajı..." maxLength={2000} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="project-slug">Adres anahtarı (boş bırakılırsa addan üretilir)</label>
                <input id="project-slug" className="form-input" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e-fatura-otomasyonu" maxLength={200} />
              </div>

              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <input
                  type="checkbox"
                  id="isVerifiedCheckbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                />
                <label htmlFor="isVerifiedCheckbox" style={{ fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600 }}>
                  Proje bilgileri doğrulanmıştır
                </label>
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Vazgeç
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={16} />
              <span>
                {loading
                  ? 'Kaydediliyor...'
                  : isNew && linkDrafts.length > 0
                    ? `Projeyi ve ${linkDrafts.length} bağlantıyı kaydet`
                    : 'Projeyi Kaydet'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
