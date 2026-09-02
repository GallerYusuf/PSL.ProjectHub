import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { ProjectStatus, ProjectDetailDto } from '../types';

interface AdminProjectModalProps {
  initialData?: ProjectDetailDto | null;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export const AdminProjectModal: React.FC<AdminProjectModalProps> = ({
  initialData,
  onClose,
  onSave,
}) => {
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
  const [currentVersion, setCurrentVersion] = useState(initialData?.currentVersion || 'v1.0.0');
  const [techInput, setTechInput] = useState(initialData?.technologies?.join(', ') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortDescription.trim()) {
      setError('Proje adı ve kısa açıklama alanları zorunludur.');
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
      category: category.trim(),
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
      await onSave(payload);
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
            {initialData ? 'Projeyi Düzenle' : 'Yeni Proje Tanımla'}
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="alert-box alert-warning">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Proje Adı *</label>
              <input
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: E-Fatura Otomasyonu"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Slug (Boş bırakılırsa otomatik üretilir)</label>
              <input
                className="form-input"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e-fatura-otomasyonu"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kısa Açıklama *</label>
            <textarea
              className="form-textarea"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Proje kartında görünecek 1-2 cümlelik özet"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Kategori</label>
              <input
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Muhasebe, Satış, İK vb."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Durum</label>
              <select
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
              <label className="form-label">Sürüm</label>
              <input
                className="form-input"
                value={currentVersion}
                onChange={(e) => setCurrentVersion(e.target.value)}
                placeholder="v1.0.0"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Proje Sorumlusu</label>
              <input
                className="form-input"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Ad Soyad"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Departman</label>
              <input
                className="form-input"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Yazılım, Muhasebe vb."
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Hedef Kullanıcılar</label>
            <input
              className="form-input"
              value={targetUsers}
              onChange={(e) => setTargetUsers(e.target.value)}
              placeholder="Mağaza personeli, bayiler, muhasebe..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Teknolojiler (Virgülle ayırın)</label>
            <input
              className="form-input"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              placeholder="C#, .NET 8, React, SQL Server, Dapper"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Çözülen İş Problemi</label>
            <textarea
              className="form-textarea"
              value={businessProblem}
              onChange={(e) => setBusinessProblem(e.target.value)}
              placeholder="Bu proje şirket içinde hangi operasyonel darboğazı veya problemi çözüyor?"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Getirilen Çözüm</label>
            <textarea
              className="form-textarea"
              value={businessSolution}
              onChange={(e) => setBusinessSolution(e.target.value)}
              placeholder="Teknik ve işleyiş olarak nasıl bir çözüm getirildi?"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Şirkete Sağlanan Değer</label>
            <textarea
              className="form-textarea"
              value={businessValue}
              onChange={(e) => setBusinessValue(e.target.value)}
              placeholder="Zamandan tasarruf, hata oranında düşüş, maliyet avantajı..."
            />
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
              Proje bilgileri doğrulanmıştır (Doğrulandı olarak işaretle)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Vazgeç
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Save size={16} />
              <span>{loading ? 'Kaydediliyor...' : 'Projeyi Kaydet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
