import React, { useEffect, useState } from 'react';
import {
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Share2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { api } from '../api/client';
import { DashboardMetricsDto, ProjectSummaryDto } from '../types';

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
      <div className="container" style={{ padding: '3rem 1.25rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>
          <Layers size={32} />
        </div>
        <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
          Operasyon merkezi metrikleri yükleniyor...
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="container" style={{ padding: '2.5rem 1.25rem' }}>
        <div className="alert-box alert-danger">
          <AlertCircle size={18} />
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
    <div className="container" style={{ padding: '1.75rem 1.25rem 3rem' }}>
      {/* Sayfa Başlığı ve Editoryal Özet */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.5rem' }}>
        <div>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.2rem' }}>
            PSL İÇ VE DIŞ TİCARET A.Ş. • OPERASYON MERKEZİ
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Proje ve Servis Envanteri
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '0.25rem', maxWidth: '750px' }}>
            Şirket bünyesindeki kurumsal yazılımlar, API servisleri, yönetim portalları ve canlı erişim bağlantıları.
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={onNavigateProjects}>
          <span>Tüm Proje Portföyü</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Yüksek Bilgi Yoğunluklu Tek Satır Metrik Şeridi */}
      <div className="metric-ribbon">
        <div className="metric-item">
          <span className="metric-label">Toplam Sistem</span>
          <span className="metric-val">{metrics.totalProjects}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Canlı (Live)</span>
          <span className="metric-val" style={{ color: 'var(--status-live)' }}>{metrics.liveProjects}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Pilot Fazında</span>
          <span className="metric-val" style={{ color: 'var(--status-pilot)' }}>{metrics.pilotProjects}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Geliştirme</span>
          <span className="metric-val" style={{ color: 'var(--status-dev)' }}>{metrics.developmentProjects}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Bakımda</span>
          <span className="metric-val" style={{ color: 'var(--status-maint)' }}>{metrics.maintenanceProjects}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Doğrulama Bekleyen</span>
          <span className="metric-val" style={{ color: 'var(--text-muted)' }}>{metrics.pendingVerificationProjects}</span>
        </div>
      </div>

      {/* Ana Çift Kolon / Tablo Düzeni */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.25rem', marginTop: '1.5rem' }}>
        
        {/* Kolon 1: Hızlı Erişim ve Canlı Servisler Tablosu */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="card-header">
            <h2 className="card-title">
              <Layers size={16} color="var(--primary)" />
              <span>Hızlı Erişim ve Canlı Servisler</span>
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {metrics.quickAccessProjects?.length || 0} Aktif Servis
            </span>
          </div>

          {metrics.quickAccessProjects && metrics.quickAccessProjects.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Proje Adı</th>
                    <th>Ortam</th>
                    <th>Birincil Bağlantı</th>
                    <th>Erişim</th>
                    <th style={{ textAlign: 'right' }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.quickAccessProjects.map((p) => {
                    const primary = p.primaryLink;
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.category}</div>
                        </td>
                        <td>
                          <span className={`badge ${p.status === 'Live' ? 'badge-live' : 'badge-development'}`}>
                            {p.statusText}
                          </span>
                        </td>
                        <td>
                          {primary ? (
                            <a
                              href={primary.url}
                              target="_blank"
                              rel="noreferrer"
                              className="code-url"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <span>{primary.label || primary.url}</span>
                              <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Belirtilmedi</span>
                          )}
                        </td>
                        <td>
                          {primary?.requiresVpn ? (
                            <span className="badge badge-vpn">VPN Gerekli</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Genel Ağ</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => onViewDetails(p.slug)}
                            title="Proje Dosyasını Aç"
                          >
                            <FileText size={13} />
                            <span>Dosya</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-title">Canlı URL Bulunmuyor</div>
              <p style={{ fontSize: '0.8rem' }}>Mevcut projelere henüz doğrulanmış birincil URL atanmamış.</p>
            </div>
          )}
        </div>

        {/* Kolon 2: Son Güncellemeler ve Doğrulama Kuyruğu */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Son Güncellenen Projeler */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="card-header">
              <h2 className="card-title">
                <Clock size={16} color="var(--primary)" />
                <span>Son Güncellenen Projeler</span>
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {metrics.recentlyUpdatedProjects.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    background: '#ffffff',
                    cursor: 'pointer'
                  }}
                  onClick={() => onViewDetails(p.slug)}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {p.category} {p.currentVersion ? `• ${p.currentVersion}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className={`badge ${p.status === 'Live' ? 'badge-live' : 'badge-development'}`}>
                      {p.statusText}
                    </span>
                    <ArrowRight size={13} color="var(--text-muted)" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Kritik Entegrasyonlar ve Telemetri Durumu */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="card-header">
              <h2 className="card-title">
                <Share2 size={16} color="var(--status-pilot)" />
                <span>Kritik Entegrasyonlar</span>
              </h2>
              <span className="badge badge-demo">Demo / Simüle Veri</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {metrics.criticalIntegrations.map((ci) => (
                <div
                  key={ci.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    background: '#ffffff'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      {ci.name}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      {ci.integrationType} {ci.description ? `— ${ci.description}` : ''}
                    </div>
                  </div>
                  <span className="badge badge-vpn">Kritik</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
