import React from "react";
import {
  Lightbulb,
  TrendingUp,
  Users,
  Building2,
  Calendar,
  Layers,
  Cpu
} from "lucide-react";
import { ProjectDetailDto } from "../../types";

interface ProjectDossierTabProps {
  project: ProjectDetailDto;
}

export const ProjectDossierTab: React.FC<ProjectDossierTabProps> = ({ project }) => {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Belirtilmedi";
    try {
      return new Date(dateString).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* 3 Temel Sütun: Problem / Çözüm / Değer */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
        {/* Problem */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", background: "var(--status-maint-bg)", color: "var(--status-maint)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Lightbulb size={18} />
            </div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Çözülen İş Problemi
            </h3>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6 }}>
            {project.businessProblem || "Bu proje için iş problemi tanımı henüz eklenmemiştir."}
          </p>
        </div>

        {/* Çözüm */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", background: "var(--status-dev-bg)", color: "var(--status-dev)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Layers size={18} />
            </div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Getirilen Çözüm
            </h3>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6 }}>
            {project.businessSolution || "Bu proje için teknik ve operasyonel çözüm tanımı henüz eklenmemiştir."}
          </p>
        </div>

        {/* Sağlanan Değer */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "var(--radius-sm)", background: "var(--status-live-bg)", color: "var(--status-live)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={18} />
            </div>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Şirkete Sağlanan Değer
            </h3>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.6 }}>
            {project.businessValue || "Bu proje için somut iş kazanımı henüz ölçümlenmemiş veya doğrulanmamıştır."}
          </p>
        </div>
      </div>

      {/* İdari ve Süreç Bilgileri */}
      <div className="card" style={{ padding: "1.5rem" }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.75rem" }}>
          Organizasyonel ve Takvim Bilgileri
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.25rem" }}>
              <Users size={14} /> Hedef Kullanıcı Kitlesi
            </div>
            <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-primary)" }}>
              {project.targetUsers || "Belirtilmedi"}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.25rem" }}>
              <Building2 size={14} /> İlgili Departman / Birim
            </div>
            <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-primary)" }}>
              {project.department || "Belirtilmedi"}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.25rem" }}>
              <Calendar size={14} /> Başlangıç Tarihi
            </div>
            <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-primary)" }}>
              {formatDate(project.startDate)}
            </div>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase", marginBottom: "0.25rem" }}>
              <Calendar size={14} /> Canlıya Alınma Tarihi
            </div>
            <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-primary)" }}>
              {formatDate(project.liveDate)}
            </div>
          </div>
        </div>
      </div>

      {/* Kullanılan Teknolojiler */}
      {project.technologies && project.technologies.length > 0 && (
        <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
            <Cpu size={16} color="var(--primary)" />
            <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-primary)" }}>
              Teknoloji Kümesi & Yığın
            </h3>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
            {project.technologies.map((tech, idx) => (
              <span
                key={idx}
                className="badge"
                style={{ background: "var(--primary-subtle)", color: "var(--primary)", border: "1px solid var(--primary-border)", fontWeight: 600 }}
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};