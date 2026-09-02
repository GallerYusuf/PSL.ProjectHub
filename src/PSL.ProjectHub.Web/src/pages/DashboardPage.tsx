import React, { useEffect, useState } from 'react';
import {
  Layers,
  Activity,
  CheckCircle2,
  Clock,
  Wrench,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  GitCommit,
  Share2,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';
import { DashboardMetricsDto, ProjectSummaryDto } from '../types';
import { ProjectCard } from '../components/ProjectCard';

interface DashboardPageProps {
  onNavigateProjects: () => void;
  onViewDetails: (slug: string) => void;
  onStartPresentation: (project: ProjectSummaryDto) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateProjects,
  onViewDetails,
  onStartPresentation,
}) => {
  const [metrics, setMetrics] = useState<DashboardMetricsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Dashboard verileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
          <Layers size={36} className="animate-spin" />
        </div>
        <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
          Proje Hub verileri yükleniyor...
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        <div className="alert-box alert-warning">
          <AlertCircle size={20} />
          <div>
            <strong>Veriler Alınamadı:</strong> {error}
            <div style={{ marginTop: '0.5rem' }}>
              <button className="btn btn-secondary btn-sm" onClick={loadMetrics}>
                Tekrar Dene
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      {/* Hero Welcome */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', marginBottom: '0.4rem', fontWeight: 600, fontSize: '0.85rem' }}>
          <Sparkles size={16} />
          <span>PSL İÇ VE DIŞ TİCARET A.Ş. / GALLERY CRYSTAL</span>
        </div>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          Kurumsal Yazılım ve Proje Merkezi
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', maxWidth: '800px' }}>
          Şirket bünyesinde geliştirilen sistemleri, canlı uygulama URL’lerini, API ve yönetim panellerini tek noktadan izleyin ve yönetin.
        </p>
      </div>

      {/* Stat KPI Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">Toplam Proje</span>
          <span className="stat-value">{metrics.totalProjects}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kayıtlı sistemler</span>
        </div>

        <div className="stat-card" style={{ '--primary': 'var(--accent-emerald)' } as any}>
          <span className="stat-label">Canlıda (Live)</span>
          <span className="stat-value" style={{ color: '#34d399' }}>{metrics.liveProjects}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kullanılan uygulamalar</span>
        </div>

        <div className="stat-card" style={{ '--primary': 'var(--accent-amber)' } as any}>
          <span className="stat-label">Pilot Aşamada</span>
          <span className="stat-value" style={{ color: '#fbbf24' }}>{metrics.pilotProjects}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Saha testindeki sistemler</span>
        </div>

        <div className="stat-card" style={{ '--primary': 'var(--accent-cyan)' } as any}>
          <span className="stat-label">Geliştiriliyor</span>
          <span className="stat-value" style={{ color: '#38bdf8' }}>{metrics.developmentProjects}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aktif kodlama</span>
        </div>

        <div className="stat-card" style={{ '--primary': 'var(--accent-rose)' } as any}>
          <span className="stat-label">Bakımda</span>
          <span className="stat-value" style={{ color: '#fb7185' }}>{metrics.maintenanceProjects}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Güncelleme süreci</span>
        </div>

        <div className="stat-card" style={{ '--primary': 'var(--accent-purple)' } as any}>
          <span className="stat-label">Doğrulama Bekleyen</span>
          <span className="stat-value" style={{ color: '#c084fc' }}>{metrics.pendingVerificationProjects}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>İncelenecek envanter</span>
        </div>
      </div>

      {/* Quick Access Section: Hızlı Erişim */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Hızlı Erişim (Canlı Uygulamalar)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Doğrudan kullanıma hazır birincil web ve portal adresleri
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onNavigateProjects}>
            <span>Tüm Projeleri Gör</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {metrics.quickAccessProjects && metrics.quickAccessProjects.length > 0 ? (
          <div className="projects-grid">
            {metrics.quickAccessProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onViewDetails={onViewDetails}
                onStartPresentation={onStartPresentation}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
            <Activity size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Henüz Birincil Bağlantı Eklenmedi
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '500px', margin: '0 auto 1.25rem' }}>
              Projelerin mevcut çalışan adreslerini Admin panelinden veya 'project-urls.json' dosyası üzerinden içeri aktarabilirsiniz.
            </p>
            <button className="btn btn-primary btn-sm" onClick={onNavigateProjects}>
              Projeleri Listele
            </button>
          </div>
        )}
      </div>

      {/* Two-Column Section: Son Güncellemeler & Kritik Entegrasyonlar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
        {/* Recently Updated Projects */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Clock size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Son Güncellenen Projeler</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {metrics.recentlyUpdatedProjects.map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
                onClick={() => onViewDetails(p.slug)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {p.category} • {p.currentVersion || 'v1.0.0'}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className={`badge ${p.status === 'Live' ? 'badge-live' : 'badge-development'}`} style={{ fontSize: '0.7rem' }}>
                    {p.statusText}
                  </span>
                  <ArrowRight size={14} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Integrations & Releases */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Share2 size={18} color="var(--accent-amber)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Kritik Entegrasyonlar</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {metrics.criticalIntegrations.map((ci) => (
              <div
                key={ci.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                    {ci.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {ci.integrationType} {ci.description ? `• ${ci.description}` : ''}
                  </div>
                </div>
                <span className="badge badge-vpn" style={{ fontSize: '0.7rem' }}>
                  Kritik
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
