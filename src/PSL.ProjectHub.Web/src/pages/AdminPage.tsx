import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Plus,
  FileDown,
  Upload,
  CheckCircle2,
  Clock,
  Edit,
  Archive,
  RefreshCw,
  AlertCircle,
  Database,
  ExternalLink,
  FileText
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
  const [importFile, setImportFile] = useState<File | null>(null);
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
      setError(err.message || 'İçe aktarma sırasında hata oluştu. project-urls.json dosyasının proje kök dizininde olduğundan emin olun.');
    } finally {
      setImporting(false);
    }
  };

  const handleFileUploadAndImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    try {
      setImporting(true);
      setImportResult(null);
      setError(null);
      const formData = new FormData();
      formData.append('file', importFile);
      const res = await api.uploadUrlImportFile(formData);
      setImportResult(res);
      setMessage('JSON dosyası başarıyla yüklendi ve içe aktarıldı.');
      setImportFile(null);
      await loadProjects();
    } catch (err: any) {
      setError(err.message || 'Dosya yükleme ve aktarma başarısız.');
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
      const payload = Array.isArray(parsed) ? parsed : [parsed];
      const res = await api.importUrls(payload);
      setImportResult(res);
      setMessage('JSON başarıyla içe aktarıldı.');
      setImportJsonText('');
      await loadProjects();
    } catch (err: any) {
      setError(err.message || 'Geçersiz JSON biçimi veya içe aktarma hatası.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '1.75rem 1.25rem 3.5rem' }}>
      
      {/* Başlık ve Butonlar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
            SİSTEM YÖNETİMİ & OPERASYON KONTROL
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Proje ve URL Yönetim Konsolu
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '0.2rem' }}>
            Portföy projelerini tanımlayın, durumlarını doğrulayın ve URL envanterini senkronize edin.
          </p>
        </div>

        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setEditingProject(null);
            setProjectModalOpen(true);
          }}
        >
          <Plus size={14} />
          <span>Yeni Proje Tanımla</span>
        </button>
      </div>

      {/* Mesaj & Hata Bildirimleri */}
      {message && (
        <div className="alert-box alert-info">
          <CheckCircle2 size={16} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="alert-box alert-danger">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* URL İçe Aktarma (Import) Kartı */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <Database size={16} color="var(--primary)" />
              <span>URL Envanteri Toplu İçe Aktarma</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
              JSON dosyasından tüm sistemlerin canlı, test ve swagger adreslerini senkronize edin.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', alignItems: 'flex-start' }}>
          
          {/* Seçenek 1: Kök Dizinden Aktar */}
          <div style={{ background: 'var(--bg-app)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              1. Sunucu Dosyasından Aktar
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Proje kök dizinindeki <code>project-urls.json</code> dosyasını okuyarak veritabanına aktarır.
            </p>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleImportFromFile}
              disabled={importing}
            >
              <FileDown size={14} />
              <span>{importing ? 'İşleniyor...' : 'project-urls.json Dosyasını Aktar'}</span>
            </button>
          </div>

          {/* Seçenek 2: Dosya Yükle (IFormFile) */}
          <div style={{ background: 'var(--bg-app)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              2. Güvenli Dosya Yükleme (.json)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Yerel bilgisayarınızdan JSON dosyasını seçip yükleyerek içeri aktarabilirsiniz (Maks 2 MB).
            </p>
            <form onSubmit={handleFileUploadAndImport} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="file"
                accept=".json"
                className="form-input"
                style={{ fontSize: '0.78rem', padding: '0.3rem 0.5rem' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImportFile(e.target.files[0]);
                  }
                }}
              />
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={importing || !importFile}
              >
                <Upload size={13} />
                <span>Yükle</span>
              </button>
            </form>
          </div>
        </div>

        {/* JSON Metin Yapıştırma */}
        <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
            Veya JSON metnini buraya yapıştırıp içe aktarın:
          </label>
          <textarea
            className="form-textarea"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', minHeight: '70px' }}
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
              Metin JSON'ı Aktar
            </button>
          </div>
        </div>

        {importResult && (
          <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#ffffff', border: '1px solid var(--border-card)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
            <strong>Aktarım Raporu:</strong> Toplam {importResult.totalProjectsProcessed} proje işlendi. {importResult.totalLinksAdded} yeni bağlantı eklendi, {importResult.totalLinksUpdated} güncellendi, {importResult.totalLinksSkipped} atlandı.
            {importResult.messages && importResult.messages.length > 0 && (
              <ul style={{ marginTop: '0.4rem', paddingLeft: '1.2rem', color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                {importResult.messages.map((m: string, i: number) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Projeler Yönetim Tablosu */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="card-header">
          <h2 className="card-title">
            <ShieldCheck size={16} color="var(--primary)" />
            <span>Portföy ve Sistem Yönetimi ({projects.length})</span>
          </h2>
          <button className="btn btn-ghost btn-sm" onClick={loadProjects}>
            <RefreshCw size={13} />
            <span>Yenile</span>
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Proje Adı</th>
                <th>Slug</th>
                <th>Kategori</th>
                <th>Durum</th>
                <th>Doğrulama</th>
                <th>Aktif URL</th>
                <th style={{ textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} style={{ opacity: p.isArchived ? 0.55 : 1 }}>
                  <td>
                    <strong
                      style={{ color: 'var(--text-primary)', cursor: 'pointer' }}
                      onClick={() => onViewDetails(p.slug)}
                      title="Proje Dosyasını Aç"
                    >
                      {p.name}
                    </strong>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {p.slug}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.category}</span>
                  </td>
                  <td>
                    <span className={`badge ${p.status === 'Live' ? 'badge-live' : 'badge-development'}`}>
                      {p.statusText}
                    </span>
                  </td>
                  <td>
                    <button
                      className={`badge ${p.isVerified ? 'badge-verified' : 'badge-pending'}`}
                      style={{ cursor: 'pointer', border: 'none' }}
                      onClick={() => handleToggleVerified(p.id, p.isVerified)}
                      title="Doğrulama durumunu değiştirmek için tıklayın"
                    >
                      {p.isVerified ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                      <span>{p.isVerified ? 'Doğrulandı' : 'Doğrulama Bekliyor'}</span>
                    </button>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {p.activeLinksCount} bağlantı
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={async () => {
                          const full = await api.getProject(p.slug);
                          setEditingProject(full);
                          setProjectModalOpen(true);
                        }}
                        title="Projeyi Düzenle"
                      >
                        <Edit size={13} />
                      </button>

                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onViewDetails(p.slug)}
                        title="Proje Dosyasını Aç"
                      >
                        <FileText size={13} />
                        <span>Dosya</span>
                      </button>

                      {!p.isArchived && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--status-maint)' }}
                          onClick={() => handleArchiveProject(p.id, p.name)}
                          title="Arşivle"
                        >
                          <Archive size={13} />
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
