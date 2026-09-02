import React from "react";
import {
  ArrowLeft,
  PlaySquare,
  CheckCircle2,
  Clock,
  Archive,
  Edit,
  ExternalLink,
  ShieldAlert
} from "lucide-react";
import { ProjectDetailDto } from "../../types";

interface ProjectDetailHeaderProps {
  project: ProjectDetailDto;
  isAdmin: boolean;
  isEditor?: boolean;
  onBack: () => void;
  onStartPresentation: () => void;
  onToggleVerified: () => void;
  onArchive: () => void;
  onEdit?: () => void;
}

export const ProjectDetailHeader: React.FC<ProjectDetailHeaderProps> = ({
  project,
  isAdmin,
  isEditor = false,
  onBack,
  onStartPresentation,
  onToggleVerified,
  onArchive,
  onEdit
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Live":
        return <span className="badge badge-live">● Canlı / Üretim</span>;
      case "Development":
        return <span className="badge badge-dev">● Geliştirme Aşamasında</span>;
      case "Pilot":
        return <span className="badge badge-pilot">● Pilot Kullanımda</span>;
      case "Maintenance":
        return <span className="badge badge-maint">● Bakım Modunda</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const primaryUrl = project.primaryLink?.url;
  const isPrimaryActive = project.primaryLink?.isActive;

  return (
    <div style={{ marginBottom: "1.75rem" }}>
      {/* Üst Gezinim Barı */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <button
          onClick={onBack}
          className="btn btn-secondary btn-sm"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
        >
          <ArrowLeft size={16} />
          <span>Proje Envanterine Dön</span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {primaryUrl && isPrimaryActive && (
            <a
              href={primaryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <ExternalLink size={15} />
              <span>Canlı Uygulamayı Aç</span>
            </a>
          )}

          <button
            onClick={onStartPresentation}
            className="btn btn-secondary btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            title="Yönetim Sunumu Modu (Executive Presentation)"
          >
            <PlaySquare size={15} color="var(--primary)" />
            <span>Sunum Modu</span>
          </button>

          {(isAdmin || isEditor) && onEdit && (
            <button
              onClick={onEdit}
              className="btn btn-secondary btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
            >
              <Edit size={15} />
              <span>Düzenle</span>
            </button>
          )}

          {isAdmin && (
            <>
              <button
                onClick={onToggleVerified}
                className="btn btn-secondary btn-sm"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  borderColor: project.isVerified ? "var(--status-live-border)" : "var(--status-pilot-border)",
                  color: project.isVerified ? "var(--status-live)" : "var(--status-pilot)"
                }}
                title={project.isVerified ? "Doğrulamayı Kaldır" : "Doğrulanmış Olarak İşaretle"}
              >
                {project.isVerified ? <CheckCircle2 size={15} /> : <Clock size={15} />}
                <span>{project.isVerified ? "Doğrulandı" : "Doğrula"}</span>
              </button>

              <button
                onClick={onArchive}
                className="btn btn-secondary btn-sm"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--status-maint)" }}
                title="Projeyi Arşive Taşı"
              >
                <Archive size={15} />
                <span>Arşivle</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Proje Başlık ve Rozetler */}
      <div className="card" style={{ padding: "1.5rem 1.75rem", background: "var(--surface-card)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1.25rem", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
              <span className="badge" style={{ background: "var(--bg-subtle)", color: "var(--text-secondary)", fontWeight: 600 }}>
                {project.category}
              </span>
              {getStatusBadge(project.status)}
              {project.isVerified ? (
                <span className="badge badge-verified" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                  <CheckCircle2 size={12} />
                  <span>Doğrulanmış Proje</span>
                </span>
              ) : (
                <span className="badge badge-unverified" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                  <Clock size={12} />
                  <span>Doğrulama Bekliyor</span>
                </span>
              )}
              {project.hasVpnLink && (
                <span className="badge badge-vpn" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                  <ShieldAlert size={12} />
                  <span>Kurumsal VPN Gerekli</span>
                </span>
              )}
            </div>

            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "0.5rem" }}>
              {project.name}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", maxWidth: "880px", lineHeight: 1.55 }}>
              {project.shortDescription}
            </p>
          </div>

          {project.currentVersion && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                Mevcut Sürüm
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 700, color: "var(--primary)" }}>
                {project.currentVersion}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};