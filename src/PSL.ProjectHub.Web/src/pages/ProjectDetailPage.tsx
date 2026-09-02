import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Clock,
  PlaySquare,
  Layers,
  Plus,
  Edit,
  Trash2,
  Lock,
  Calendar,
  Users,
  Lightbulb,
  TrendingUp,
  Cpu,
  Share2,
  FileText,
  AlertCircle,
  Archive,
  Star,
  Image as ImageIcon,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { api } from '../api/client';
import { ProjectDetailDto, ProjectLinkDto, ProjectScreenshotDto } from '../types';
import { useAuth } from '../context/AuthContext';
import { AdminLinkModal } from '../components/AdminLinkModal';
import { PresentationModal } from '../components/PresentationModal';

interface ProjectDetailPageProps {
  slug: string;
  onBack: () => void;
  onEditProject?: (project: ProjectDetailDto) => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  slug,
  onBack,
  onEditProject,
}) => {
  const { isAdmin } = useAuth();
  const [project, setProject] = useState<ProjectDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs: 'dossier' (Proje Dosyası & Yönetici Özeti) vs 'technical' (Teknik Detaylar & Mimari)
  const [activeTab, setActiveTab] = useState<'dossier' | 'technical'>('dossier');
  const [showPresentation, setShowPresentation] = useState(false);

  // Link Modal
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ProjectLinkDto | null>(null);

  // Screenshot Fullscreen Lightbox & Upload Modal
  const [activeScreenshotIndex, setActiveScreenshotIndex] = useState<number | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadIsCover, setUploadIsCover] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    loadProject();
  }, [slug]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProject(slug);
      setProject(data);
    } catch (err: any) {
      setError(err.message || 'Proje detayları yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerified = async () => {
    if (!project) return;
    try {
      await api.setVerified(project.id, !project.isVerified);
      await loadProject();
    } catch (err: any) {
      alert(err.message || 'Doğrulama durumu değiştirilemedi.');
    }
  };

  const handleArchive = async () => {
    if (!project) return;
    if (confirm(`'${project.name}' projesini arşivlemek istediğinizden emin misiniz?`)) {
      try {
        await api.archiveProject(project.id);
        alert('Proje arşivlendi.');
        onBack();
      } catch (err: any) {
        alert(err.message || 'Proje arşivlenirken hata oluştu.');
      }
    }
  };

  const handleSaveLink = async (payload: any) => {
    if (!project) return;
    try {
      if (editingLink) {
        await api.updateLink(editingLink.id, payload);
      } else {
        await api.createLink(project.id, payload);
      }
      setLinkModalOpen(false);
      setEditingLink(null);
      await loadProject();
    } catch (err: any) {
      alert(err.message || 'Bağlantı kaydedilemedi.');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    if (confirm('Bu bağlantıyı pasife almak istediğinizden emin misiniz?')) {
      try {
        await api.deleteOrDeactivateLink(linkId, false);
        await loadProject();
      } catch (err: any) {
        alert(err.message || 'Bağlantı silinemedi.');
      }
    }
  };

  const handleSetPrimary = async (linkId: string) => {
    try {
      await api.setPrimaryLink(linkId);
      await loadProject();
    } catch (err: any) {
      alert(err.message || 'Birincil bağlantı güncellenemedi.');
    }
  };

  // Ekran Görüntüsü Yükleme
  const handleUploadScreenshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !uploadFile) return;

    try {
      setUploadLoading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append('file', uploadFile);
      if (uploadCaption.trim()) {
        formData.append('caption', uploadCaption.trim());
      }
      formData.append('isCover', String(uploadIsCover));
      formData.append('displayOrder', String(project.screenshots.length + 1));

      await api.uploadScreenshot(project.id, formData);
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadCaption('');
      setUploadIsCover(false);
      await loadProject();
    } catch (err: any) {
      setUploadError(err.message || 'Ekran görüntüsü yüklenemedi.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteScreenshot = async (screenshotId: string) => {
    if (confirm('Bu ekran görüntüsünü kalıcı olarak silmek istediğinizden emin misiniz?')) {
      try {
        await api.deleteScreenshot(screenshotId);
        if (activeScreenshotIndex !== null) setActiveScreenshotIndex(null);
        await loadProject();
      } catch (err: any) {
        alert(err.message || 'Ekran görüntüsü silinemedi.');
      }
    }
  };

  const handleSetCoverScreenshot = async (screenshot: ProjectScreenshotDto) => {
    try {
      await api.updateScreenshot(screenshot.id, {
        caption: screenshot.caption,
        isCover: true,
        displayOrder: screenshot.displayOrder
      });
      await loadProject();
    } catch (err: any) {
      alert(err.message || 'Kapak görseli güncellenemedi.');
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
        <Layers size={32} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Proje dosyası açılıyor...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container" style={{ padding: '2.5rem 1.25rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginBottom: '1.25rem' }}>
          <ArrowLeft size={14} />
          <span>Geri Dön</span>
        </button>
        <div className="alert-box alert-danger">
          <AlertCircle size={18} />
          <div>{error || 'Proje bulunamadı.'}</div>
        </div>
      </div>
    );
  }

  const primaryLink = project.primaryLink;
  const screenshots = project.screenshots || [];
  const currentScreenshot = activeScreenshotIndex !== null ? screenshots[activeScreenshotIndex] : null;

  return (
    <div className="container" style={{ padding: '1.5rem 1.25rem 3.5rem' }}>
      
      {/* Üst Bar: Navigasyon ve Eylemler */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={13} />
          <span>Tüm Projeler</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowPresentation(true)}
            title="Yönetici / Paydaş Sunum Modu"
          >
            <PlaySquare size={14} />
            <span>Sunum Modu</span>
          </button>

          {isAdmin && (
            <>
              <button
                className={`btn btn-sm ${project.isVerified ? 'btn-secondary' : 'btn-primary'}`}
                onClick={handleToggleVerified}
                title="Doğrulama Durumunu Değiştir"
              >
                <CheckCircle2 size={13} />
                <span>{project.isVerified ? 'Doğrulamayı Kaldır' : 'Doğrulandı Olarak İşaretle'}</span>
              </button>

              {onEditProject && (
                <button className="btn btn-secondary btn-sm" onClick={() => onEditProject(project)}>
                  <Edit size={13} />
                  <span>Düzenle</span>
                </button>
              )}

              <button className="btn btn-danger btn-sm" onClick={handleArchive}>
                <Archive size={13} />
                <span>Arşivle</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Proje Dosyası (Project Dossier) Başlık Kartı */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div style={{ flex: '1 1 500px' }}>
            {/* Rozetler */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
              <span className={`badge ${project.status === 'Live' ? 'badge-live' : 'badge-development'}`}>
                {project.statusText}
              </span>
              <span className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                {project.category}
              </span>
              {project.isVerified ? (
                <span className="badge badge-verified">
                  <CheckCircle2 size={11} />
                  <span>Doğrulandı</span>
                </span>
              ) : (
                <span className="badge badge-pending">
                  <Clock size={11} />
                  <span>Doğrulama Bekliyor</span>
                </span>
              )}
              {project.currentVersion && (
                <span className="badge" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                  {project.currentVersion}
                </span>
              )}
            </div>

            {/* Proje Başlığı */}
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
              {project.name}
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55, marginBottom: '1rem' }}>
              {project.shortDescription}
            </p>

            {/* Teknik Metadata Satırı */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', fontSize: '0.8rem', background: 'var(--bg-app)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>Sorumlu</span>
                <strong style={{ color: 'var(--text-primary)' }}>{project.ownerName || 'Belirtilmedi'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>Departman</span>
                <strong style={{ color: 'var(--text-primary)' }}>{project.department || 'Belirtilmedi'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>Canlıya Geçiş</span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {project.liveDate ? new Date(project.liveDate).toLocaleDateString('tr-TR') : 'Belirtilmedi'}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.72rem', textTransform: 'uppercase' }}>Son Güncelleme</span>
                <strong style={{ color: 'var(--text-primary)' }}>
                  {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString('tr-TR') : '-'}
                </strong>
              </div>
            </div>
          </div>

          {/* Birincil Canlı URL Butonu */}
          {primaryLink && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.45rem' }}>
              <a
                href={primaryLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg"
                id="btn-hero-launch"
              >
                <ExternalLink size={15} />
                <span>{primaryLink.label || 'Uygulamayı Aç'}</span>
              </a>

              {primaryLink.requiresVpn && (
                <span className="badge badge-vpn">
                  <ShieldAlert size={11} />
                  <span>Şirket Ağı veya VPN Gerekebilir</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sekmeler: Proje Dosyası vs Teknik Mimari */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
        <button
          className={`btn btn-ghost ${activeTab === 'dossier' ? 'active' : ''}`}
          style={{
            borderBottom: activeTab === 'dossier' ? '2px solid var(--primary)' : '2px solid transparent',
            borderRadius: 0,
            padding: '0.6rem 1rem',
            color: activeTab === 'dossier' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.92rem'
          }}
          onClick={() => setActiveTab('dossier')}
        >
          <span>Proje Dosyası (Yönetici Özeti)</span>
        </button>

        <button
          className={`btn btn-ghost ${activeTab === 'technical' ? 'active' : ''}`}
          style={{
            borderBottom: activeTab === 'technical' ? '2px solid var(--primary)' : '2px solid transparent',
            borderRadius: 0,
            padding: '0.6rem 1rem',
            color: activeTab === 'technical' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '0.92rem'
          }}
          onClick={() => setActiveTab('technical')}
        >
          <span>Teknik Detaylar & Mimari</span>
        </button>
      </div>

      {/* TAB 1: PROJE DOSYASI / YÖNETİCİ ÖZETİ */}
      {activeTab === 'dossier' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-maint)', marginBottom: '0.6rem' }}>
              <Lightbulb size={16} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Çözülen İş Problemi</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.6 }}>
              {project.businessProblem || 'İş problemi tanımı henüz belirtilmedi.'}
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '0.6rem' }}>
              <TrendingUp size={16} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Geliştirilen Çözüm & Mimari</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.6 }}>
              {project.businessSolution || 'Çözüm tanımı henüz belirtilmedi.'}
            </p>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-live)', marginBottom: '0.6rem' }}>
              <CheckCircle2 size={16} />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Şirkete Sağlanan İş Değeri</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', lineHeight: 1.6 }}>
              {project.businessValue || 'İş değeri tanımı henüz belirtilmedi.'}
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: TEKNİK DETAYLAR & BİLEŞENLER */}
      {activeTab === 'technical' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {/* Bileşenler */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="card-header">
              <h3 className="card-title">
                <Cpu size={16} color="var(--primary)" />
                <span>Teknik Bileşenler ({project.components.length})</span>
              </h3>
            </div>
            {project.components.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {project.components.map((c) => (
                  <div key={c.id} style={{ padding: '0.6rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '0.85rem' }}>{c.name}</strong>
                      <span className="badge" style={{ background: 'var(--bg-subtle)' }}>{c.componentTypeText}</span>
                    </div>
                    {c.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{c.description}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Kayıtlı bileşen bulunmuyor.</p>
            )}
          </div>

          {/* Entegrasyonlar */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="card-header">
              <h3 className="card-title">
                <Share2 size={16} color="var(--status-pilot)" />
                <span>Entegrasyonlar ({project.integrations.length})</span>
              </h3>
            </div>
            {project.integrations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {project.integrations.map((i) => (
                  <div key={i.id} style={{ padding: '0.6rem', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <strong style={{ fontSize: '0.85rem' }}>{i.name}</strong>
                      {i.isCritical && <span className="badge badge-vpn">Kritik</span>}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {i.integrationType} {i.description ? `— ${i.description}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Kayıtlı entegrasyon bulunmuyor.</p>
            )}
          </div>
        </div>
      )}

      {/* ==========================================================================
         BÖLÜM 1: URL ENVANTERİ (Teknik Dosya Tablosu)
         ========================================================================== */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <FileText size={16} color="var(--primary)" />
              <span>URL Envanteri ({project.links.length})</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
              Sistemin canlı, test, API, yönetim paneli, swagger ve dokümantasyon adresleri
            </p>
          </div>

          {isAdmin && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setEditingLink(null);
                setLinkModalOpen(true);
              }}
              id="btn-add-link"
            >
              <Plus size={13} />
              <span>Yeni URL Tanımla</span>
            </button>
          )}
        </div>

        {project.links.length === 0 ? (
          <div className="empty-state">
            <ExternalLink size={28} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
            <div className="empty-state-title">Kayıtlı URL Bulunamadı</div>
            <p style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>Bu sistem için henüz tanımlanmış bir URL bağlantısı bulunmuyor.</p>
            {isAdmin && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setEditingLink(null);
                  setLinkModalOpen(true);
                }}
              >
                İlk Bağlantıyı Ekle
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Bağlantı Tanımı</th>
                  <th>Ortam</th>
                  <th>Tür</th>
                  <th>URL Adresi</th>
                  <th>Ağ Erişimi</th>
                  <th>Kimlik Doğrulama</th>
                  <th style={{ textAlign: 'right' }}>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {project.links.map((link) => (
                  <tr key={link.id} style={{ opacity: link.isActive ? 1 : 0.6 }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{link.label}</strong>
                        {link.isPrimary && (
                          <span className="badge badge-live" style={{ fontSize: '0.68rem' }}>
                            <Star size={10} fill="currentColor" />
                            <span>Birincil</span>
                          </span>
                        )}
                        {!link.isActive && (
                          <span className="badge badge-archived" style={{ fontSize: '0.68rem' }}>
                            Pasif
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ background: 'var(--bg-subtle)' }}>
                        {link.environmentText}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {link.linkTypeText}
                      </span>
                    </td>
                    <td>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="code-url"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <span>{link.url}</span>
                        <ExternalLink size={11} />
                      </a>
                    </td>
                    <td>
                      {link.requiresVpn ? (
                        <span className="badge badge-vpn">VPN Gerekli</span>
                      ) : (
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Genel Ağ</span>
                      )}
                    </td>
                    <td>
                      {link.requiresAuthentication ? (
                        <span className="badge" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                          <Lock size={10} />
                          <span>Gerekli</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Serbest</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-sm"
                        >
                          <ExternalLink size={12} />
                          <span>Aç</span>
                        </a>

                        {isAdmin && (
                          <>
                            {!link.isPrimary && (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleSetPrimary(link.id)}
                                title="Birincil Yap"
                              >
                                <Star size={13} />
                              </button>
                            )}

                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => {
                                setEditingLink(link);
                                setLinkModalOpen(true);
                              }}
                              title="Düzenle"
                            >
                              <Edit size={13} />
                            </button>

                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleDeleteLink(link.id)}
                              title="Pasife Al"
                              style={{ color: 'var(--status-maint)' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==========================================================================
         BÖLÜM 2: EKRAN GÖRÜNTÜLERİ GALERİSİ
         ========================================================================== */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">
              <ImageIcon size={16} color="var(--primary)" />
              <span>Ekran Görüntüleri Galerisi ({screenshots.length})</span>
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
              Kullanıcı arayüzü, yönetim panelleri ve operasyon ekranları
            </p>
          </div>

          {isAdmin && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setUploadModalOpen(true)}
            >
              <Upload size={13} />
              <span>Görsel Yükle</span>
            </button>
          )}
        </div>

        {screenshots.length === 0 ? (
          <div className="empty-state">
            <ImageIcon size={28} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
            <div className="empty-state-title">Ekran Görüntüsü Bulunmuyor</div>
            <p style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>
              Bu proje için henüz arayüz görseli yüklenmemiş.
            </p>
            {isAdmin && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setUploadModalOpen(true)}
              >
                Görsel Yükle
              </button>
            )}
          </div>
        ) : (
          <div className="screenshot-grid">
            {screenshots.map((s, index) => {
              const fileUrl = s.filePath.startsWith('/api')
                ? s.filePath
                : `/api/screenshots/${s.id}/file`;

              return (
                <div
                  key={s.id}
                  className="screenshot-card"
                  onClick={() => setActiveScreenshotIndex(index)}
                >
                  {s.isCover && (
                    <span className="screenshot-cover-badge">Kapak</span>
                  )}

                  <img
                    src={fileUrl}
                    alt={s.caption || s.fileName}
                    className="screenshot-thumb"
                    onError={(e) => {
                      // Kırık görsel fallback'i
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />

                  <div className="screenshot-caption">
                    {s.caption || s.fileName}
                  </div>

                  {isAdmin && (
                    <div
                      style={{
                        padding: '0.35rem 0.5rem',
                        borderTop: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        background: 'var(--bg-app)'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {!s.isCover && (
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: '0.7rem', padding: '0.15rem 0.35rem' }}
                          onClick={() => handleSetCoverScreenshot(s)}
                          title="Kapak Görseli Yap"
                        >
                          <Star size={11} />
                          <span>Kapak Yap</span>
                        </button>
                      )}
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.7rem', padding: '0.15rem 0.35rem', color: 'var(--status-maint)' }}
                        onClick={() => handleDeleteScreenshot(s.id)}
                        title="Görseli Sil"
                      >
                        <Trash2 size={11} />
                        <span>Sil</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==========================================================================
         TAM EKRAN GÖRSEL GÖRÜNTÜLEYİCİ (LIGHTBOX MODAL)
         ========================================================================== */}
      {currentScreenshot && (
        <div
          className="modal-overlay"
          style={{ background: 'rgba(15, 23, 42, 0.92)', zIndex: 3000 }}
          onClick={() => setActiveScreenshotIndex(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Kapat Butonu */}
            <button
              className="btn btn-ghost btn-sm"
              style={{ position: 'absolute', top: '-2.5rem', right: '0', color: '#ffffff' }}
              onClick={() => setActiveScreenshotIndex(null)}
            >
              <X size={20} />
              <span>Kapat</span>
            </button>

            {/* Büyük Resim */}
            <img
              src={currentScreenshot.filePath.startsWith('/api') ? currentScreenshot.filePath : `/api/screenshots/${currentScreenshot.id}/file`}
              alt={currentScreenshot.caption || currentScreenshot.fileName}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
              }}
            />

            {/* Resim Açıklaması ve Navigasyon */}
            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', color: '#f8fafc' }}>
              <div style={{ fontSize: '0.88rem' }}>
                {currentScreenshot.caption || currentScreenshot.fileName}
                {currentScreenshot.isCover && <span className="badge badge-verified" style={{ marginLeft: '0.5rem' }}>Kapak</span>}
              </div>

              {screenshots.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={activeScreenshotIndex === 0}
                    onClick={() => setActiveScreenshotIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                    {(activeScreenshotIndex ?? 0) + 1} / {screenshots.length}
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={activeScreenshotIndex === screenshots.length - 1}
                    onClick={() => setActiveScreenshotIndex((prev) => (prev !== null && prev < screenshots.length - 1 ? prev + 1 : prev))}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================================
         EKRAN GÖRÜNTÜSÜ YÜKLEME MODALI (ADMIN ONLY)
         ========================================================================== */}
      {uploadModalOpen && (
        <div className="modal-overlay" onClick={() => setUploadModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Yeni Ekran Görüntüsü Yükle</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setUploadModalOpen(false)}>
                <X size={16} />
              </button>
            </div>

            {uploadError && (
              <div className="alert-box alert-danger">
                <AlertCircle size={15} />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadScreenshot}>
              <div className="form-group">
                <label className="form-label">Görsel Dosyası (PNG, JPG, WEBP - Maksimum 5 MB)</label>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  className="form-input"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Görsel Açıklaması / Başlık (İsteğe Bağlı)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Örn: Müşteri Arama Ekranı"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  id="chk-cover"
                  checked={uploadIsCover}
                  onChange={(e) => setUploadIsCover(e.target.checked)}
                  style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }}
                />
                <label htmlFor="chk-cover" className="form-label" style={{ cursor: 'pointer', margin: 0 }}>
                  Bu görseli projenin kapak görseli olarak ayarla
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setUploadModalOpen(false)}
                  disabled={uploadLoading}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={uploadLoading || !uploadFile}
                >
                  <Upload size={14} />
                  <span>{uploadLoading ? 'Yükleniyor...' : 'Görseli Kaydet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Link Modal */}
      {linkModalOpen && (
        <AdminLinkModal
          projectId={project.id}
          initialData={editingLink}
          onClose={() => {
            setLinkModalOpen(false);
            setEditingLink(null);
          }}
          onSave={handleSaveLink}
        />
      )}

      {/* Sunum Modu Tam Ekran Modalı */}
      {showPresentation && (
        <PresentationModal
          project={project}
          onClose={() => setShowPresentation(false)}
        />
      )}
    </div>
  );
};
