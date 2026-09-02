import React from "react";
import {
  Cpu,
  Share2,
  FileText,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Tag
} from "lucide-react";
import { ProjectDetailDto } from "../../types";

interface ProjectTechnicalTabProps {
  project: ProjectDetailDto;
}

export const ProjectTechnicalTab: React.FC<ProjectTechnicalTabProps> = ({ project }) => {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Sistem Bileşenleri */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <Cpu size={18} color="var(--primary)" />
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Sistem Bileşenleri ({project.components?.length || 0})
          </h3>
        </div>

        {project.components && project.components.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem" }}>
            {project.components.map((c) => (
              <div
                key={c.id}
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.85rem 1rem",
                  background: "var(--bg-app)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary)" }}>
                    {c.name}
                  </span>
                  <span className="badge" style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", fontSize: "0.72rem" }}>
                    {c.componentType}
                  </span>
                </div>
                {c.description && (
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.45 }}>
                    {c.description}
                  </p>
                )}
                {c.environment && (
                  <div style={{ marginTop: "0.4rem", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Ortam: {c.environment}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: "0.86rem", fontStyle: "italic" }}>
            Tanımlanmış teknik bileşen bulunmamaktadır.
          </p>
        )}
      </div>

      {/* Entegrasyonlar */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <Share2 size={18} color="var(--primary)" />
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Dış Sistem & Servis Entegrasyonları ({project.integrations?.length || 0})
          </h3>
        </div>

        {project.integrations && project.integrations.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem" }}>
            {project.integrations.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.85rem 1rem",
                  background: "var(--bg-app)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.35rem" }}>
                  <span style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-primary)" }}>
                    {item.name}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    {item.isCritical && (
                      <span className="badge" style={{ background: "var(--status-maint-bg)", color: "var(--status-maint)", border: "1px solid var(--status-maint-border)", fontSize: "0.7rem" }}>
                        Kritik
                      </span>
                    )}
                    <span className="badge" style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", fontSize: "0.72rem" }}>
                      {item.integrationType}
                    </span>
                  </div>
                </div>
                {item.description && (
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.45 }}>
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: "0.86rem", fontStyle: "italic" }}>
            Tanımlanmış entegrasyon noktası bulunmamaktadır.
          </p>
        )}
      </div>

      {/* Sürüm Geçmişi & Notlar İkili Kolon */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
        {/* Sürümler */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Tag size={18} color="var(--primary)" />
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Sürüm Geçmişi ({project.releases?.length || 0})
            </h3>
          </div>

          {project.releases && project.releases.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {project.releases.map((rel) => (
                <div
                  key={rel.id}
                  style={{
                    borderLeft: "3px solid var(--primary)",
                    paddingLeft: "0.85rem",
                    paddingBottom: "0.4rem"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--primary)", fontSize: "0.88rem" }}>
                      {rel.version}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>
                      {rel.title}
                    </span>
                    {rel.releaseDate && (
                      <span style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginLeft: "auto" }}>
                        {formatDate(rel.releaseDate)}
                      </span>
                    )}
                  </div>
                  {rel.description && (
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.45 }}>
                      {rel.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "0.86rem", fontStyle: "italic" }}>
              Kayıtlı sürüm notu bulunmamaktadır.
            </p>
          )}
        </div>

        {/* Notlar */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <FileText size={18} color="var(--primary)" />
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Geliştirici & Operasyon Notları ({project.notes?.length || 0})
            </h3>
          </div>

          {project.notes && project.notes.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {project.notes.map((note) => (
                <div
                  key={note.id}
                  style={{
                    background: "var(--bg-app)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.75rem 0.9rem"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                    <span style={{ fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>
                      {note.title}
                    </span>
                    <span className="badge" style={{ fontSize: "0.7rem", background: "var(--bg-subtle)", color: "var(--text-muted)" }}>
                      {note.noteType}
                    </span>
                  </div>
                  {note.content && (
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.82rem", lineHeight: 1.45 }}>
                      {note.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--text-muted)", fontSize: "0.86rem", fontStyle: "italic" }}>
              Kayıtlı teknik veya operasyonel not bulunmamaktadır.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};