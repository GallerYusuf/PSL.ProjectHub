import React, { useEffect } from 'react';
import {
  X,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';
import { ProjectDetailDto } from '../types';

interface PresentationModalProps {
  project: ProjectDetailDto;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  currentIndex?: number;
  totalProjects?: number;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({
  project,
  onClose,
  onNext,
  onPrev,
  currentIndex,
  totalProjects
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && onPrev) {
        onPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev]);

  const hasPrimaryUrl = project.primaryLink &&
                        project.primaryLink.isActive &&
                        Boolean(project.primaryLink.url && project.primaryLink.url.trim().length > 0);

  const coverScreenshot = project.screenshots?.find(s => s.isCover) || project.screenshots?.[0];

  return (
    <div className="presentation-container" id="presentation-modal">
      {/* Üst Yönetici Barı */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="badge badge-verified" style={{ fontSize: '0.82rem', padding: '0.3rem 0.75rem' }}>
            PSL Executive Sunum Modu
          </span>
          <span className="badge" style={{ background: '#334155', color: '#f8fafc' }}>
            {project.category}
          </span>
          {totalProjects !== undefined && currentIndex !== undefined && (
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Proje {currentIndex + 1} / {totalProjects} (Yön tuşları: ← / →)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {onPrev && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onPrev}
              title="Önceki Proje (Sol Yön Tuşu)"
            >
              <ChevronLeft size={16} />
              <span>Önceki</span>
            </button>
          )}

          {onNext && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={onNext}
              title="Sonraki Proje (Sağ Yön Tuşu)"
            >
              <span>Sonraki</span>
              <ChevronRight size={16} />
            </button>
          )}

          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            title="Sunum Modundan Çık (Esc)"
          >
            <X size={16} />
            <span>Kapat (Esc)</span>
          </button>
        </div>
      </div>

      {/* Slayt Gövdesi */}
      <div className="presentation-hero">
        <div className="presentation-card">
          
          {/* Başlık ve Durum */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff', margin: 0 }}>
                  {project.name}
                </h1>
                <span className={`badge ${project.status === 'Live' ? 'badge-live' : 'badge-development'}`} style={{ fontSize: '0.85rem' }}>
                  {project.statusText}
                </span>
                {project.currentVersion && (
                  <span className="badge" style={{ background: '#334155', color: '#cbd5e1' }}>
                    {project.currentVersion}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '1.1rem', color: '#cbd5e1', lineHeight: 1.55, maxWidth: '820px' }}>
                {project.shortDescription}
              </p>
            </div>

            {/* Canlı Uygulama Butonu */}
            {hasPrimaryUrl && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                <a
                  href={project.primaryLink!.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary btn-lg"
                  style={{ fontSize: '0.95rem', padding: '0.65rem 1.4rem' }}
                >
                  <ExternalLink size={16} />
                  <span>{project.primaryLink!.label || 'Uygulamayı Aç'}</span>
                </a>
                {project.primaryLink!.requiresVpn && (
                  <span className="badge badge-vpn" style={{ fontSize: '0.75rem' }}>
                    <ShieldAlert size={12} />
                    <span>Şirket Ağı / VPN Gerekebilir</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Kapak Görseli (Varsa) */}
          {coverScreenshot && (
            <div style={{ marginBottom: '1.75rem', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '280px', border: '1px solid #334155' }}>
              <img
                src={coverScreenshot.filePath.startsWith('/api') ? coverScreenshot.filePath : `/api/screenshots/${coverScreenshot.id}/file`}
                alt={coverScreenshot.caption || project.name}
                style={{ width: '100%', height: '280px', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            </div>
          )}

          {/* 3 Ana Sütun: Problem, Çözüm, Değer */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
            <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', marginBottom: '0.5rem' }}>
                <Lightbulb size={18} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f87171' }}>Çözülen İş Problemi</h3>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.55 }}>
                {project.businessProblem || 'İş problemi tanımı belirtilmedi.'}
              </p>
            </div>

            <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', marginBottom: '0.5rem' }}>
                <CheckCircle2 size={18} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8' }}>Getirilen Çözüm</h3>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.55 }}>
                {project.businessSolution || 'Çözüm mimarisi belirtilmedi.'}
              </p>
            </div>

            <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#34d399', marginBottom: '0.5rem' }}>
                <TrendingUp size={18} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#34d399' }}>Şirkete Sağlanan Değer</h3>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.55 }}>
                {project.businessValue || 'Şirkete sağlanan değer tanımı belirtilmedi.'}
              </p>
            </div>
          </div>

          {/* Operasyonel Özet Bilgiler */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            fontSize: '0.82rem'
          }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>HEDEF KULLANICILAR</div>
              <strong style={{ color: '#ffffff' }}>{project.targetUsers || 'Şirket İçi Operasyon'}</strong>
            </div>

            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>BAŞLANGIÇ VE CANLI</div>
              <strong style={{ color: '#ffffff' }}>
                {project.startDate ? new Date(project.startDate).toLocaleDateString('tr-TR') : '-'}
                {' → '}
                {project.liveDate ? new Date(project.liveDate).toLocaleDateString('tr-TR') : 'Canlıda'}
              </strong>
            </div>

            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>PROJE SORUMLUSU</div>
              <strong style={{ color: '#ffffff' }}>
                {project.ownerName || 'Belirtilmedi'} {project.department ? `(${project.department})` : ''}
              </strong>
            </div>

            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>TEKNOLOJİ YIĞINI</div>
              <div style={{ color: '#cbd5e1' }}>
                {project.technologies?.slice(0, 3).join(', ') || 'Belirtilmedi'}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
