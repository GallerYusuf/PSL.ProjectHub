import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Plus,
  FileDown,
  UploadCloud,
  CheckCircle2,
  Clock,
  Edit,
  Archive,
  RefreshCw,
  AlertCircle,
  Database,
  ExternalLink
} from 'lucide-react';
import { api } from '../api/client';
import { ProjectSummaryDto, ProjectDetailDto } from '../types';
import { AdminProjectModal } from '../components/AdminProjectModal';

interface AdminPageProps {
  onViewDetails: (slug: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onViewDetails }) => {
  const [projects, setProjects] = useState<ProjectSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Project Modal
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectDetailDto | null>(null);

  // Import JSON Modal/Panel
  const [importJsonText, setImportJsonText] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProjects({ includeArchived: true });
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Projeler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async (payload: any) => {
    if (editingProject) {
      await api.updateProject(editingProject.id, payload);
      setMessage('Proje başarıyla güncellendi.');
    } else {
      await api.createProject(payload);
      setMessage('Yeni proje başarıyla eklendi.');
    }
    await loadProjects();
  };

  const handleArchiveProject = async (id: string, name: string) => {
    if (confirm(`'${name}' projesini arşivlemek istediğinizden emin misiniz?`)) {
      try {
        await api.archiveProject(id);
        setMessage('Proje arşivlendi.');
        await loadProjects();
      } catch (err: any) {
        setError(err.message || 'Arşivleme başarısız.');
      }
    }
  };

  const handleToggleVerified = async (id: string, currentStatus: boolean) => {
    try {
      await api.setVerified(id, !currentStatus);
      await loadProjects();
      setMessage(!currentStatus ? 'Proje doğrulandı.' : 'Proje doğrulama bekliyor durumuna alındı.');
    } catch (err: any) {
      setError(err.message || 'Durum değiştirilemedi.');
    }
  };

  const handleImportFromFile = async () => {
    try {
      setImporting(true);
      setImportResult(null);
      setError(null);
      const res = await api.importUrlsFromFile('project-urls.json');
      setImportResult(res);
      setMessage('project-urls.json başarıyla içe aktarıldı.');
      await loadProjects();
    } catch (err: any) {
      setError(err.message || 'İçe aktarma sırasında hata oluştu. project-urls.json dosyasının çözüm kök dizininde olduğundan emin olun.');
    } finally {
      setImporting(false);
    }
  };

  const handleImportFromJsonText = async () => {
    if (!importJsonText.trim()) return;
    try {
      setImporting(true);
      setImportResult(null);
      setError(null);
      const parsed = JSON.parse(importJsonText);
      const res = await api.importUrls(parsed);
      setImportResult(res);
      setMessage('URL verisi başarıyla içe aktarıldı.');
      setImportJsonText('');
      await loadProjects();
    } catch (err: any) {
      setError(err.message || 'JSON formatı geçersiz veya aktarım hatası.');
    } finally {
      setImporting(false);
    }
  };

  const handleSeed = async () => {
    if (confirm('Başlangıç verilerini (roller, kullanıcılar, projeler) veritabanına tohumlamak istiyor musunuz?')) {
      try {
        setLoading(true);
        const res = await api.seedDefaultData();
        setMessage(res.message);
        await loadProjects();
      } catch (err: any) {
        setError(err.message || 'Tohumlama hatası.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>
            <ShieldCheck size={16} />
            <span>SİSTEM YÖNETİCİSİ PANELİ</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Proje ve URL Envanter Yönetimi
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleSeed}>
            <Database size={15} />
            <span>Varsayılan Verileri Tohumla</span>
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              setEditingProject(null);
              setProjectModalOpen(true);
            }}
          >
            <Plus size={16} />
            <span>Yeni Proje Ekle</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="alert-box alert-info">
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="alert-box alert-warning">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* URL Import Accordion / Card */}
      <div className="glass-card" style={{ marginBottom: '2.5rem', borderLeft: '4px solid var(--accent-cyan)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UploadCloud size={18} color="var(--accent-cyan)" />
              <span>Toplu URL İçe Aktarma (project-urls.json)</span>
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Idempotent çalışır: Tekrar çalıştırıldığında mükerrer link oluşturmaz, mevcut linkleri günceller.
            </p>
          </div>

          <button className="btn btn-primary btn-sm" onClick={handleImportFromFile} disabled={importing}>
            <FileDown size={16} />
            <span>{importing ? 'Aktarılıyor...' : 'project-urls.json Dosyasından Aktar'}</span>
          </button>
        </div>

        {/* JSON Raw Paste Input */}
        <div style={{ marginTop: '1rem' }}>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
            Veya JSON metnini buraya yapıştırıp aktarın:
          </label>
          <textarea
            className="form-textarea"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', minHeight: '80px' }}
            placeholder='[ { "projectKey": "musteri-platformu", "links": [ { "label": "Canlı", "url": "https://example.internal" } ] } ]'
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
          />
          <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleImportFromJsonText}
              disabled={importing || !importJsonText.trim()}
            >
              Yapıştırılan JSON'ı Aktar
            </button>
          </div>
        </div>

        {importResult && (
          <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
            <strong>Aktarım Sonucu:</strong> {importResult.totalProjectsProcessed} proje işlendi. {importResult.totalLinksAdded} yeni bağlantı eklendi, {importResult.totalLinksUpdated} güncellendi, {importResult.totalLinksSkipped} atlandı.
            {importResult.messages && importResult.messages.length > 0 && (
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', color: 'var(--text-muted)' }}>
                {importResult.messages.map((m: string, i: number) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Projects Inventory Table */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            Tüm Sistemler ({projects.length})
          </h3>
          <button className="btn btn-ghost btn-sm" onClick={loadProjects}>
            <RefreshCw size={14} />
            <span>Yenile</span>
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Proje Adı</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Slug</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Kategori</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Durum</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Doğrulama</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>Aktif Bağlantı</th>
                <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr
                  key={p.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    opacity: p.isArchived ? 0.5 : 1,
                  }}
                >
                  <td style={{ padding: '0.85rem 0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    <div style={{ cursor: 'pointer' }} onClick={() => onViewDetails(p.slug)}>
                      {p.name}
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {p.slug}
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem' }}>{p.category}</td>
                  <td style={{ padding: '0.85rem 0.5rem' }}>
                    <span className={`badge ${p.status === 'Live' ? 'badge-live' : 'badge-development'}`}>
                      {p.statusText}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem' }}>
                    <button
                      className={`badge ${p.isVerified ? 'badge-verified' : 'badge-pending'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      onClick={() => handleToggleVerified(p.id, p.isVerified)}
                      title="Doğrulama durumunu değiştirmek için tıklayın"
                    >
                      {p.isVerified ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      <span>{p.isVerified ? 'Doğrulandı' : 'Doğrulama Bekliyor'}</span>
                    </button>
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem' }}>
                    {p.activeLinksCount} bağlantı
                  </td>
                  <td style={{ padding: '0.85rem 0.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={async () => {
                          const full = await api.getProject(p.slug);
                          setEditingProject(full);
                          setProjectModalOpen(true);
                        }}
                        title="Düzenle"
                      >
                        <Edit size={14} />
                      </button>

                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => onViewDetails(p.slug)}
                        title="Detay ve Bağlantılar"
                      >
                        <ExternalLink size={14} />
                      </button>

                      {!p.isArchived && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--accent-rose)' }}
                          onClick={() => handleArchiveProject(p.id, p.name)}
                          title="Arşivle"
                        >
                          <Archive size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Project Modal */}
      {projectModalOpen && (
        <AdminProjectModal
          initialData={editingProject}
          onClose={() => {
            setProjectModalOpen(false);
            setEditingProject(null);
          }}
          onSave={handleSaveProject}
        />
      )}
    </div>
  );
};
