import React from 'react';
import { ExternalLink, Eye, ShieldAlert, CheckCircle2, Clock, PlaySquare } from 'lucide-react';
import { ProjectSummaryDto, ProjectStatus } from '../types';

interface ProjectCardProps {
  project: ProjectSummaryDto;
  onViewDetails: (slug: string) => void;
  onStartPresentation?: (project: ProjectSummaryDto) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onViewDetails,
  onStartPresentation,
}) => {
  const getStatusBadgeClass = (status: ProjectStatus) => {
    switch (status) {
      case 'Live': return 'badge-live';
      case 'Pilot': return 'badge-pilot';
      case 'Development': return 'badge-development';
      case 'Maintenance': return 'badge-maintenance';
      case 'Archived': return 'badge-archived';
      default: return 'badge-archived';
    }
  };

  const hasPrimaryUrl = project.primaryLink &&
                        project.primaryLink.isActive &&
                        Boolean(project.primaryLink.url && project.primaryLink.url.trim().length > 0);

  const formattedDate = project.updatedAt || project.createdAt
    ? new Date(project.updatedAt || project.createdAt).toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.25rem' }}>
      {/* Üst Kısım: Rozetler ve Sunum Düğmesi */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.6rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span className={`badge ${getStatusBadgeClass(project.status)}`}>
            {project.statusText}
          </span>
          <span className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
            {project.category}
          </span>
          {project.isVerified ? (
            <span className="badge badge-verified" title="Proje bilgileri doğrulanmıştır">
              <CheckCircle2 size={11} />
              <span>Doğrulandı</span>
            </span>
          ) : (
            <span className="badge badge-pending" title="Proje detayları veya URL'leri doğrulama beklemektedir">
              <Clock size={11} />
              <span>Doğrulama Bekliyor</span>
            </span>
          )}
        </div>

        {onStartPresentation && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onStartPresentation(project)}
            title="Sunum Modunda Aç"
            style={{ padding: '0.2rem 0.45rem', color: 'var(--text-muted)' }}
          >
            <PlaySquare size={15} />
          </button>
        )}
      </div>

      {/* Proje Başlığı */}
      <h3
        style={{
          fontSize: '1.05rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '0.4rem',
          lineHeight: 1.3,
          cursor: 'pointer'
        }}
        onClick={() => onViewDetails(project.slug)}
      >
        {project.name}
      </h3>

      {/* Kısa Açıklama */}
      <p style={{
        color: 'var(--text-secondary)',
        fontSize: '0.84rem',
        lineHeight: 1.5,
        marginBottom: '1rem',
        flexGrow: 1
      }}>
        {project.shortDescription}
      </p>

      {/* Teknolojiler */}
      {project.technologies && project.technologies.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.85rem' }}>
          {project.technologies.slice(0, 4).map((tech) => (
            <span
              key={tech}
              style={{
                fontSize: '0.72rem',
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                padding: '0.1rem 0.45rem',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-secondary)',
                fontWeight: 500
              }}
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > 4 && (
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
              +{project.technologies.length - 4}
            </span>
          )}
        </div>
      )}

      {/* VPN & Ağ Uyarısı */}
      {(project.hasVpnLink || project.primaryLink?.requiresVpn) && (
        <div style={{ marginBottom: '0.85rem' }}>
          <span className="badge badge-vpn">
            <ShieldAlert size={11} />
            <span>Şirket Ağı veya VPN Gerekebilir</span>
          </span>
        </div>
      )}

      {/* Alt Bilgi ve Eylem Düğmeleri */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: 'auto',
        fontSize: '0.78rem',
        color: 'var(--text-muted)'
      }}>
        <div>
          {project.ownerName ? (
            <span>Sorumlu: <strong style={{ color: 'var(--text-secondary)' }}>{project.ownerName}</strong></span>
          ) : (
            <span>{formattedDate ? `Güncellendi: ${formattedDate}` : ''}</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onViewDetails(project.slug)}
            id={`btn-details-${project.slug}`}
          >
            <Eye size={13} />
            <span>Detaylar</span>
          </button>

          {hasPrimaryUrl && (
            <a
              href={project.primaryLink!.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              id={`btn-open-${project.slug}`}
              title={project.primaryLink!.label || 'Uygulamayı Aç'}
            >
              <ExternalLink size={13} />
              <span>Uygulamayı Aç</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
