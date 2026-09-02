import React from 'react';
import { ExternalLink, Eye, ShieldAlert, CheckCircle2, Clock, MonitorPlay, Layers } from 'lucide-react';
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
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span className={`badge ${getStatusBadgeClass(project.status)}`}>
            {project.statusText}
          </span>
          <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-secondary)' }}>
            {project.category}
          </span>
          {project.isVerified ? (
            <span className="badge badge-verified" title="Proje bilgileri doğrulanmıştır">
              <CheckCircle2 size={12} />
              <span>Doğrulandı</span>
            </span>
          ) : (
            <span className="badge badge-pending" title="Proje detayları veya URL'leri doğrulama beklemektedir">
              <Clock size={12} />
              <span>Doğrulama Bekliyor</span>
            </span>
          )}
        </div>

        {onStartPresentation && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onStartPresentation(project)}
            title="Sunum Modunda Aç"
            style={{ padding: '0.25rem 0.5rem', color: 'var(--text-muted)' }}
          >
            <MonitorPlay size={16} />
          </button>
        )}
      </div>

      {/* Title & Short Description */}
      <h3
        style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
          lineHeight: 1.3,
          cursor: 'pointer'
        }}
        onClick={() => onViewDetails(project.slug)}
      >
        {project.name}
      </h3>

      <p style={{
        color: 'var(--text-secondary)',
        fontSize: '0.88rem',
        lineHeight: 1.5,
        marginBottom: '1.25rem',
        flexGrow: 1
      }}>
        {project.shortDescription}
      </p>

      {/* Technologies */}
      {project.technologies && project.technologies.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.15rem' }}>
          {project.technologies.slice(0, 4).map((tech) => (
            <span
              key={tech}
              style={{
                fontSize: '0.74rem',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-muted)'
              }}
            >
              {tech}
            </span>
          ))}
          {project.technologies.length > 4 && (
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
              +{project.technologies.length - 4}
            </span>
          )}
        </div>
      )}

      {/* VPN & Network Warning Badge */}
      {(project.hasVpnLink || project.primaryLink?.requiresVpn) && (
        <div style={{ marginBottom: '1rem' }}>
          <span className="badge badge-vpn" style={{ fontSize: '0.74rem' }}>
            <ShieldAlert size={12} />
            <span>Şirket Ağı veya VPN Gerekebilir</span>
          </span>
        </div>
      )}

      {/* Footer Info & Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '0.85rem',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: 'auto',
        fontSize: '0.82rem',
        color: 'var(--text-muted)'
      }}>
        <div>
          {project.ownerName ? (
            <span>Sorumlu: <strong style={{ color: 'var(--text-secondary)' }}>{project.ownerName}</strong></span>
          ) : (
            <span>Güncellendi: {formattedDate || '-'}</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onViewDetails(project.slug)}
            id={`btn-details-${project.slug}`}
          >
            <Eye size={14} />
            <span>Detaylar</span>
          </button>

          {/* Primary Action Button */}
          {hasPrimaryUrl && (
            <a
              href={project.primaryLink!.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              id={`btn-open-${project.slug}`}
              title={project.primaryLink!.label || 'Uygulamayı Aç'}
            >
              <ExternalLink size={14} />
              <span>Uygulamayı Aç</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
