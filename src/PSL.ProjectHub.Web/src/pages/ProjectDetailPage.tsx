import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Clock,
  MonitorPlay,
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
  History,
  FileText,
  AlertCircle,
  Archive,
  Star
} from 'lucide-react';
import { api } from '../api/client';
import { ProjectDetailDto, ProjectLinkDto, LinkType } from '../types';
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

  // Tabs: 'summary' (Yönetici Özeti) vs 'technical' (Teknik Detaylar)
  const [activeTab, setActiveTab] = useState<'summary' | 'technical'>('summary');
  const [showPresentation, setShowPresentation] = useState(false);

  // Admin Link Modal
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ProjectLinkDto | null>(null);

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
    if (editingLink) {
      await api.updateLink(editingLink.id, payload);
    } else {
      await api.createLink(project.id, payload);
    }
    await loadProject();
  };

  const handleDeleteLink = async (linkId: string) => {
    if (confirm('Bu bağlantıyı pasif duruma getirmek istediğinizden emin misiniz?')) {
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

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <Layers size={36} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
        <div style={{ color: 'var(--text-secondary)' }}>Proje detayları yükleniyor...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        <div className="alert-box alert-warning">
          <AlertCircle size={20} />
          <div>{error || 'Proje bulunamadı.'}</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Geri Dön</span>
        </button>
      </div>
    );
  }

  const hasPrimaryUrl = project.primaryLink &&
                        project.primaryLink.isActive &&
                        Boolean(project.primaryLink.url && project.primaryLink.url.trim().length > 0);

  // Group links by LinkType or Environment
  const groupedLinks = project.links.reduce((acc, link) => {
    const group = link.environment || 'Production';
    if (!acc[group]) acc[group] = [];
    acc[group].push(link);
    return acc;
  }, {} as Record<string, ProjectLinkDto[]>);

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      {/* Back Button & Top Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <button className="btn btn-ghost btn-sm" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Tüm Projelere Dön</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Presentation Mode Button */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowPresentation(true)}
            id="btn-presentation-mode"
          >
            <MonitorPlay size={16} color="var(--accent-cyan)" />
            <span>Sunum Modu</span>
          </button>

          {isAdmin && (
            <>
              <button
                className={`btn btn-sm ${project.isVerified ? 'btn-secondary' : 'btn-primary'}`}
                onClick={handleToggleVerified}
                title="Doğrulama durumunu güncelle"
              >
                <CheckCircle2 size={15} />
                <span>{project.isVerified ? 'Doğrulamayı Kaldır' : 'Doğrulandı Yap'}</span>
              </button>

              {onEditProject && (
                <button className="btn btn-secondary btn-sm" onClick={() => onEditProject(project)}>
                  <Edit size={15} />
                  <span>Düzenle</span>
                </button>
              )}

              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-rose)' }} onClick={handleArchive}>
                <Archive size={15} />
                <span>Arşivle</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Hero Card */}
      <div className="glass-card" style={{ marginBottom: '2rem', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ maxWidth: '850px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <span className="badge badge-live" style={{ fontSize: '0.8rem' }}>
                {project.statusText}
              </span>
              <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)' }}>
                {project.category}
              </span>
              {project.isVerified ? (
                <span className="badge badge-verified">
                  <CheckCircle2 size={13} />
                  <span>Doğrulandı</span>
                </span>
              ) : (
                <span className="badge badge-pending">
                  <Clock size={13} />
                  <span>Doğrulama Bekliyor</span>
                </span>
              )}
              {project.currentVersion && (
                <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                  {project.currentVersion}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '2.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
              {project.name}
            </h1>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {project.shortDescription}
            </p>

            {/* Quick Meta Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {project.ownerName && (
                <div>
                  Sorumlu: <strong style={{ color: 'var(--text-primary)' }}>{project.ownerName}</strong>
                </div>
              )}
              {project.department && (
                <div>
                  Departman: <strong style={{ color: 'var(--text-primary)' }}>{project.department}</strong>
                </div>
              )}
              {project.liveDate && (
                <div>
                  Canlıya Geçiş: <strong style={{ color: 'var(--text-primary)' }}>{new Date(project.liveDate).toLocaleDateString('tr-TR')}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Primary Action Button in Hero */}
          {hasPrimaryUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
              <a
                href={project.primaryLink!.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg"
                id="btn-hero-launch"
              >
                <ExternalLink size={18} />
                <span>{project.primaryLink!.label || 'Uygulamayı Aç'}</span>
              </a>

              {project.primaryLink!.requiresVpn && (
                <span className="badge badge-vpn" style={{ fontSize: '0.75rem' }}>
                  <ShieldAlert size={12} />
                  <span>Şirket Ağı veya VPN Gerekebilir</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation: Yönetici Özeti vs Teknik Detaylar */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '2rem' }}>
        <button
          className={`btn btn-ghost ${activeTab === 'summary' ? 'active' : ''}`}
          style={{
            borderBottom: activeTab === 'summary' ? '2px solid var(--primary)' : '2px solid transparent',
            borderRadius: '0',
            paddingBottom: '0.85rem',
            color: activeTab === 'summary' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '1.02rem',
          }}
          onClick={() => setActiveTab('summary')}
          id="tab-executive-summary"
        >
          <span>Yönetici Özeti</span>
        </button>

        <button
          className={`btn btn-ghost ${activeTab === 'technical' ? 'active' : ''}`}
          style={{
            borderBottom: activeTab === 'technical' ? '2px solid var(--primary)' : '2px solid transparent',
            borderRadius: '0',
            paddingBottom: '0.85rem',
            color: activeTab === 'technical' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 700,
            fontSize: '1.02rem',
          }}
          onClick={() => setActiveTab('technical')}
          id="tab-technical-details"
        >
          <span>Teknik Detaylar</span>
        </button>
      </div>

      {/* TAB 1: YÖNETİCİ ÖZETİ */}
      {activeTab === 'summary' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
            {project.businessProblem ? (
              <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-rose)', marginBottom: '0.75rem' }}>
                  <Lightbulb size={20} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Çözülen İş Problemi</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {project.businessProblem}
                </p>
              </div>
            ) : (
              <div className="glass-card" style={{ opacity: 0.7 }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  İş Problemi Tanımı
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Henüz girilmedi.</p>
              </div>
            )}

            {project.businessSolution ? (
              <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', marginBottom: '0.75rem' }}>
                  <CheckCircle2 size={20} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Getirilen Çözüm</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {project.businessSolution}
                </p>
              </div>
            ) : null}

            {project.businessValue ? (
              <div className="glass-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', marginBottom: '0.75rem' }}>
                  <TrendingUp size={20} />
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Şirkete Sağlanan Değer</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {project.businessValue}
                </p>
              </div>
            ) : null}
          </div>

          {/* Operational Box */}
          <div className="glass-card" style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1.25rem' }}>
              Operasyonel Bilgiler
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.25rem' }}>HEDEF KULLANICILAR</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{project.targetUsers || 'Belirtilmedi'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.25rem' }}>BAŞLANGIÇ TARİHİ</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{project.startDate ? new Date(project.startDate).toLocaleDateString('tr-TR') : '-'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.25rem' }}>CANLIYA GEÇİŞ</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{project.liveDate ? new Date(project.liveDate).toLocaleDateString('tr-TR') : '-'}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.25rem' }}>GÜNCEL SÜRÜM</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{project.currentVersion || 'v1.0.0'}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEKNİK DETAYLAR */}
      {activeTab === 'technical' && (
        <div>
          {/* Components Grid */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Cpu size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Teknik Bileşenler</h3>
              </div>
            </div>

            {project.components && project.components.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {project.components.map((c) => (
                  <div key={c.id} style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{c.name}</strong>
                      <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                        {c.componentType}
                      </span>
                    </div>
                    {c.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Henüz teknik bileşen kaydedilmedi.</p>
            )}
          </div>

          {/* Integrations */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Share2 size={18} color="var(--accent-amber)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Sistem Entegrasyonları</h3>
            </div>

            {project.integrations && project.integrations.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {project.integrations.map((i) => (
                  <div key={i.id} style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{i.name}</strong>
                      {i.isCritical && <span className="badge badge-vpn">Kritik</span>}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{i.integrationType}</div>
                    {i.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{i.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Henüz entegrasyon kaydedilmedi.</p>
            )}
          </div>

          {/* Release History */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <History size={18} color="var(--accent-indigo)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Sürüm Geçmişi</h3>
            </div>

            {project.releases && project.releases.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {project.releases.map((r) => (
                  <div key={r.id} style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <strong>{r.version} - {r.title}</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(r.releaseDate).toLocaleDateString('tr-TR')}</span>
                    </div>
                    {r.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Henüz sürüm geçmişi girilmedi.</p>
            )}
          </div>

          {/* Project Notes */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <FileText size={18} color="var(--accent-emerald)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Geliştirme ve Mimari Notları</h3>
            </div>

            {project.notes && project.notes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {project.notes.map((n) => (
                  <div key={n.id} style={{ padding: '0.85rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <strong>{n.title}</strong>
                      <span className="badge" style={{ fontSize: '0.7rem' }}>{n.noteTypeText}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{n.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Henüz geliştirme notu girilmedi.</p>
            )}
          </div>
        </div>
      )}

      {/* SECTION: PROJE BAĞLANTILARI (PROJECT LINKS) */}
      <div className="glass-card" style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Proje Bağlantıları ({project.links.length})
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Sistemin canlı, test, API, yönetim paneli ve dokümantasyon adresleri
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
              <Plus size={16} />
              <span>Yeni Bağlantı Ekle</span>
            </button>
          )}
        </div>

        {project.links.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
            <ExternalLink size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Henüz Kayıtlı Bağlantı Yok
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '450px', margin: '0 auto 1.25rem' }}>
              Bu proje için doğrulanmış canlı veya test bağlantısı henüz eklenmemiştir.
            </p>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {Object.entries(groupedLinks).map(([groupName, links]) => (
              <div key={groupName}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem' }}>
                  {groupName} Ortamı
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                  {links.map((link) => (
                    <div
                      key={link.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: link.isPrimary ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1.15rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.85rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
                          <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.06)' }}>
                            {link.linkTypeText}
                          </span>
                          {link.isPrimary && (
                            <span className="badge badge-live" style={{ fontSize: '0.7rem' }}>
                              <Star size={11} fill="currentColor" />
                              <span>Birincil</span>
                            </span>
                          )}
                        </div>

                        <div style={{ fontWeight: 700, fontSize: '1.02rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                          {link.label}
                        </div>

                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
                          {link.url}
                        </div>

                        {/* VPN & Auth Badges */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.65rem' }}>
                          {link.requiresVpn && (
                            <span className="badge badge-vpn" style={{ fontSize: '0.7rem' }}>
                              <ShieldAlert size={11} />
                              <span>İç Ağ / VPN Gerekir</span>
                            </span>
                          )}
                          {link.requiresAuthentication && (
                            <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', fontSize: '0.7rem' }}>
                              <Lock size={11} />
                              <span>Giriş Gerekir</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                        >
                          <ExternalLink size={14} />
                          <span>Aç</span>
                        </a>

                        {isAdmin && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {!link.isPrimary && (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => handleSetPrimary(link.id)}
                                title="Birincil Yap"
                                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
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
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            >
                              <Edit size={13} />
                            </button>

                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleDeleteLink(link.id)}
                              title="Pasife Al"
                              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: 'var(--accent-rose)' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

      {/* Presentation Mode Fullscreen Modal */}
      {showPresentation && (
        <PresentationModal
          project={project}
          onClose={() => setShowPresentation(false)}
        />
      )}
    </div>
  );
};
