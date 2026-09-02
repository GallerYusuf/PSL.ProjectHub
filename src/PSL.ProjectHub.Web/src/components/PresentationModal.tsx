import React, { useEffect } from 'react';
import { X, ExternalLink, ShieldAlert, CheckCircle2, TrendingUp, Lightbulb, Users, Calendar } from 'lucide-react';
import { ProjectDetailDto } from '../types';

interface PresentationModalProps {
  project: ProjectDetailDto;
  onClose: () => void;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({ project, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const hasPrimaryUrl = project.primaryLink &&
                        project.primaryLink.isActive &&
                        Boolean(project.primaryLink.url && project.primaryLink.url.trim().length > 0);

  return (
    <div className="presentation-container" id="presentation-modal">
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge badge-verified" style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>
            PSL Executive Sunum Modu
          </span>
          <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white' }}>
            {project.category}
          </span>
        </div>

        <button
          className="btn btn-secondary btn-sm"
          onClick={onClose}
          style={{ borderRadius: 'var(--radius-full)' }}
          title="Sunum Modundan Çık (Esc)"
        >
          <X size={18} />
          <span>Kapat (Esc)</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="presentation-hero">
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '2.75rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              {project.name}
            </h1>
            <span className="badge badge-live" style={{ fontSize: '0.9rem', padding: '0.35rem 0.85rem' }}>
              {project.statusText}
            </span>
          </div>

          <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '850px' }}>
            {project.shortDescription}
          </p>
        </div>

        {/* Primary Action Button */}
        {hasPrimaryUrl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
            <a
              href={project.primaryLink!.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg"
              style={{ fontSize: '1.05rem', padding: '0.85rem 1.85rem' }}
            >
              <ExternalLink size={20} />
              <span>{project.primaryLink!.label || 'Uygulamayı Aç'}</span>
            </a>

            {project.primaryLink!.requiresVpn && (
              <span className="badge badge-vpn" style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}>
                <ShieldAlert size={16} />
                <span>Şirket Ağı veya VPN Gerekebilir</span>
              </span>
            )}
          </div>
        )}

        {/* 3 Pillar Cards: Problem, Solution, Value */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          {project.businessProblem && (
            <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-rose)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', color: 'var(--accent-rose)' }}>
                <Lightbulb size={20} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Çözülen İş Problemi</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                {project.businessProblem}
              </p>
            </div>
          )}

          {project.businessSolution && (
            <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-cyan)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', color: 'var(--accent-cyan)' }}>
                <CheckCircle2 size={20} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Getirilen Çözüm</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                {project.businessSolution}
              </p>
            </div>
          )}

          {project.businessValue && (
            <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-emerald)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem', color: 'var(--accent-emerald)' }}>
                <TrendingUp size={20} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Şirkete Sağlanan Değer</h3>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                {project.businessValue}
              </p>
            </div>
          )}
        </div>

        {/* Operational Metadata */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '2.5rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
              <Users size={15} />
              <span>HEDEF KULLANICILAR</span>
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {project.targetUsers || 'Şirket İçi Operasyon'}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
              <Calendar size={15} />
              <span>BAŞLANGIÇ & CANLI TARİHİ</span>
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {project.startDate ? new Date(project.startDate).toLocaleDateString('tr-TR') : '-'}
              {' → '}
              {project.liveDate ? new Date(project.liveDate).toLocaleDateString('tr-TR') : 'Canlıda'}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
              <span>PROJE SORUMLUSU</span>
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {project.ownerName || 'PSL Yazılım Ekibi'} ({project.department || 'BT'})
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.25rem' }}>
              <span>GÜNCEL SÜRÜM</span>
            </div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {project.currentVersion || 'v1.0.0'}
            </div>
          </div>
        </div>

        {/* Screenshots Gallery */}
        {project.screenshots && project.screenshots.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
              Ekran Görüntüleri
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
              {project.screenshots.map((s) => (
                <div key={s.id} className="glass-card" style={{ padding: '0.75rem' }}>
                  <img
                    src={s.filePath}
                    alt={s.caption || s.fileName}
                    style={{ width: '100%', borderRadius: 'var(--radius-md)', height: '220px', objectFit: 'cover' }}
                  />
                  {s.caption && (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
                      {s.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
