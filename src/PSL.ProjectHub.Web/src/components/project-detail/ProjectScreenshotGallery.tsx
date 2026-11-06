import React, { useState } from "react";
import {
  Image as ImageIcon,
  Upload,
  Star,
  Trash2,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { ProjectScreenshotDto } from "../../types";
import { AuthenticatedImage } from "../AuthenticatedImage";

interface ProjectScreenshotGalleryProps {
  screenshots: ProjectScreenshotDto[];
  isAdmin: boolean;
  isEditor?: boolean;
  onUploadClick: () => void;
  onSetCover: (screenshot: ProjectScreenshotDto) => void;
  onDelete: (screenshotId: string) => void;
}

export const ProjectScreenshotGallery: React.FC<ProjectScreenshotGalleryProps> = ({
  screenshots,
  isAdmin,
  isEditor = false,
  onUploadClick,
  onSetCover,
  onDelete
}) => {
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  const currentScreenshot = activeLightboxIndex !== null ? screenshots[activeLightboxIndex] : null;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeLightboxIndex !== null && activeLightboxIndex > 0) {
      setActiveLightboxIndex(activeLightboxIndex - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeLightboxIndex !== null && activeLightboxIndex < screenshots.length - 1) {
      setActiveLightboxIndex(activeLightboxIndex + 1);
    }
  };

  return (
    <div className="card" style={{ padding: "1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <ImageIcon size={18} color="var(--primary)" />
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Sistem Arayüzleri ve Ekran Görüntüleri ({screenshots.length})
          </h3>
        </div>

        {(isAdmin || isEditor) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onUploadClick}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
          >
            <Upload size={14} />
            <span>Ekran Görüntüsü Yükle</span>
          </button>
        )}
      </div>

      {screenshots.length === 0 ? (
        <div style={{ padding: "2.5rem 1rem", textAlign: "center", border: "1px dashed var(--border-subtle)", borderRadius: "var(--radius-sm)" }}>
          <ImageIcon size={32} color="var(--text-muted)" style={{ margin: "0 auto 0.5rem" }} />
          <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
            Kayıtlı Ekran Görüntüsü Bulunmuyor
          </div>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Bu uygulamanın kullanıcı arayüzü henüz belgelenmemiştir.
          </p>
          {(isAdmin || isEditor) && (
            <button className="btn btn-secondary btn-sm" onClick={onUploadClick}>
              Görsel Yükle
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
          {screenshots.map((s, idx) => (
            <div
              key={s.id}
              style={{
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-sm)",
                overflow: "hidden",
                background: "var(--bg-app)",
                position: "relative",
                transition: "transform 0.15s ease, box-shadow 0.15s ease"
              }}
            >
              <div
                style={{ height: "150px", overflow: "hidden", cursor: "pointer", position: "relative", background: "#0f172a" }}
                onClick={() => setActiveLightboxIndex(idx)}
              >
                <AuthenticatedImage
                  src={s.filePath}
                  alt={s.caption || s.fileName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  loading="lazy"
                />
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)", opacity: 0, transition: "opacity 0.2s ease", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                >
                  <Maximize2 size={24} color="#ffffff" />
                </div>
                {s.isCover && (
                  <span
                    className="badge badge-live"
                    style={{ position: "absolute", top: "8px", left: "8px", fontSize: "0.68rem", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}
                  >
                    <Star size={10} fill="currentColor" /> Kapak Görseli
                  </span>
                )}
              </div>

              <div style={{ padding: "0.75rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {s.caption || s.fileName}
                </span>

                {(isAdmin || isEditor) && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
                    {!s.isCover && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => onSetCover(s)}
                        title="Kapak Görseli Yap"
                        style={{ padding: "0.2rem 0.4rem" }}
                      >
                        <Star size={12} />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => onDelete(s.id)}
                        title="Görseli Sil"
                        style={{ color: "var(--status-maint)", padding: "0.2rem 0.4rem" }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Önizleme Modalı */}
      {currentScreenshot && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.92)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem"
          }}
          onClick={() => setActiveLightboxIndex(null)}
        >
          <div style={{ position: "absolute", top: "1.25rem", right: "1.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
              {activeLightboxIndex! + 1} / {screenshots.length}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveLightboxIndex(null)}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff" }}
            >
              <X size={18} />
            </button>
          </div>

          {activeLightboxIndex! > 0 && (
            <button
              onClick={handlePrev}
              style={{
                position: "absolute",
                left: "1.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: "50%",
                width: "44px",
                height: "44px",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {activeLightboxIndex! < screenshots.length - 1 && (
            <button
              onClick={handleNext}
              style={{
                position: "absolute",
                right: "1.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(255,255,255,0.15)",
                border: "none",
                borderRadius: "50%",
                width: "44px",
                height: "44px",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <ChevronRight size={24} />
            </button>
          )}

          <div
            style={{ maxWidth: "90vw", maxHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <AuthenticatedImage
              src={currentScreenshot.filePath}
              alt={currentScreenshot.caption || currentScreenshot.fileName}
              style={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: "var(--radius-sm)" }}
            />
            {currentScreenshot.caption && (
              <div style={{ color: "#f8fafc", marginTop: "0.75rem", fontSize: "0.95rem", textAlign: "center" }}>
                {currentScreenshot.caption}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};