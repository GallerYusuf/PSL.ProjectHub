import React, { useEffect, useState, useRef, useContext } from "react";
import {
  X,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  FileText,
  Cpu,
  Share2,
  Image as ImageIcon,
  Calendar,
  Layers,
  Sparkles
} from "lucide-react";
import { ProjectDetailDto } from "../types";
import { AuthContext } from "../context/AuthContext";

interface PresentationModalProps {
  project: ProjectDetailDto;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  currentIndex?: number;
  totalProjects?: number;
  isPresenter?: boolean;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({
  project,
  onClose,
  onNext,
  onPrev,
  currentIndex,
  totalProjects,
  isPresenter: isPresenterProp
}) => {
  const authContext = useContext(AuthContext);
  const isPresenter = isPresenterProp ?? (
    authContext?.user?.roles?.includes("Admin") ||
    authContext?.user?.roles?.includes("Presenter") ||
    false
  );

  const [activeSlide, setActiveSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(false);
  const [activeScreenshotIdx, setActiveScreenshotIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const slides = [
    { id: "overview", title: "Yönetici Özeti & Değer Matrisi" },
    { id: "screenshots", title: "Arayüz & Ekran Görüntüleri" },
    { id: "architecture", title: "Teknik Mimari & Entegrasyonlar" },
    { id: "operations", title: "Sürümler & Operasyonel Notlar" }
  ];

  // Klavye Gezinimi
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      } else if (e.key === "ArrowRight") {
        if (activeSlide < slides.length - 1) {
          setActiveSlide(s => s + 1);
        } else if (onNext) {
          onNext();
          setActiveSlide(0);
        }
      } else if (e.key === "ArrowLeft") {
        if (activeSlide > 0) {
          setActiveSlide(s => s - 1);
        } else if (onPrev) {
          onPrev();
          setActiveSlide(0);
        }
      } else if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      } else if (e.key.toLowerCase() === "s" && isPresenter) {
        setShowSpeakerNotes(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeSlide, onClose, onNext, onPrev, isPresenter]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const hasPrimaryUrl = project.primaryLink &&
    project.primaryLink.isActive &&
    Boolean(project.primaryLink.url && project.primaryLink.url.trim().length > 0);

  const screenshots = project.screenshots || [];
  const coverScreenshot = screenshots.find(s => s.isCover) || screenshots[0];

  return (
    <div
      ref={containerRef}
      className="presentation-container"
      id="presentation-modal"
      style={{
        position: "fixed",
        inset: 0,
        background: "#090d16",
        color: "#f8fafc",
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden"
      }}
    >
      {/* Üst Yönetici Barı */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.85rem 1.75rem",
          background: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #1e293b",
          flexShrink: 0
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <span
            className="badge badge-verified"
            style={{ fontSize: "0.8rem", padding: "0.3rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
          >
            <Sparkles size={13} />
            <span>PSL Executive Sunum Modu</span>
          </span>

          <span className="badge" style={{ background: "#334155", color: "#f8fafc" }}>
            {project.category}
          </span>

          {totalProjects !== undefined && currentIndex !== undefined && (
            <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
              Proje {currentIndex + 1} / {totalProjects}
            </span>
          )}

          {/* Slayt Sekmeleri */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginLeft: "1rem" }}>
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setActiveSlide(idx)}
                style={{
                  background: activeSlide === idx ? "var(--primary)" : "transparent",
                  color: activeSlide === idx ? "#ffffff" : "#94a3b8",
                  border: activeSlide === idx ? "1px solid var(--primary-border)" : "1px solid transparent",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.25rem 0.6rem",
                  fontSize: "0.76rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {idx + 1}. {s.title}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {isPresenter && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowSpeakerNotes(v => !v)}
              style={{
                background: showSpeakerNotes ? "rgba(15, 76, 129, 0.4)" : "rgba(255,255,255,0.1)",
                borderColor: showSpeakerNotes ? "var(--primary)" : "#334155",
                color: "#f8fafc",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem"
              }}
              title="Konuşmacı Notlarını Göster/Gizle (S)"
            >
              <FileText size={14} />
              <span>Notlar</span>
            </button>
          )}

          <button
            className="btn btn-secondary btn-sm"
            onClick={toggleFullscreen}
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid #334155", color: "#f8fafc" }}
            title={isFullscreen ? "Tam Ekrandan Çık (F)" : "Tam Ekran Yap (F)"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5" }}
            title="Kapat (Esc)"
          >
            <X size={14} />
            <span>Kapat (Esc)</span>
          </button>
        </div>
      </div>

      {/* Ana Slayt Gövdesi */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "2rem 2.5rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          maxWidth: "1360px",
          width: "100%",
          margin: "0 auto"
        }}
      >
        {/* SLAYT 1: YÖNETİCİ ÖZETİ & DEĞER MATRİSİ */}
        {activeSlide === 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem", marginBottom: "1.75rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.4rem" }}>
                  <h1 style={{ fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-0.02em", color: "#ffffff", margin: 0 }}>
                    {project.name}
                  </h1>
                  <span className={`badge ${project.status === "Live" ? "badge-live" : "badge-dev"}`} style={{ fontSize: "0.85rem" }}>
                    {project.statusText || (project.status === "Live" ? "Canlı" : "Geliştirme")}
                  </span>
                  {project.currentVersion && (
                    <span className="badge" style={{ background: "#334155", color: "#cbd5e1" }}>
                      {project.currentVersion}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: "1.1rem", color: "#cbd5e1", lineHeight: 1.6, maxWidth: "880px" }}>
                  {project.shortDescription}
                </p>
              </div>

              {hasPrimaryUrl && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
                  <a
                    href={project.primaryLink!.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ fontSize: "0.95rem", padding: "0.65rem 1.4rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                  >
                    <ExternalLink size={16} />
                    <span>{project.primaryLink!.label || "Uygulamayı Aç"}</span>
                  </a>
                  {project.primaryLink!.requiresVpn && (
                    <span className="badge badge-vpn" style={{ fontSize: "0.74rem" }}>
                      <ShieldAlert size={12} />
                      <span>Şirket Ağı / VPN Gerekebilir</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* 3 Ana Sütun: Problem, Çözüm, Değer */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", marginBottom: "1.75rem" }}>
              <div style={{ background: "#0f172a", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid #334155" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#f87171", marginBottom: "0.75rem" }}>
                  <Lightbulb size={20} />
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f87171" }}>Çözülen İş Problemi</h3>
                </div>
                <p style={{ color: "#cbd5e1", fontSize: "0.92rem", lineHeight: 1.6 }}>
                  {project.businessProblem || "İş problemi tanımı henüz belirtilmedi."}
                </p>
              </div>

              <div style={{ background: "#0f172a", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid #334155" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#38bdf8", marginBottom: "0.75rem" }}>
                  <CheckCircle2 size={20} />
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#38bdf8" }}>Getirilen Çözüm</h3>
                </div>
                <p style={{ color: "#cbd5e1", fontSize: "0.92rem", lineHeight: 1.6 }}>
                  {project.businessSolution || "Geliştirilen çözüm ve operasyonel yaklaşım belirtilmedi."}
                </p>
              </div>

              <div style={{ background: "#0f172a", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid #334155" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#34d399", marginBottom: "0.75rem" }}>
                  <TrendingUp size={20} />
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#34d399" }}>Şirkete Sağlanan Değer</h3>
                </div>
                <p style={{ color: "#cbd5e1", fontSize: "0.92rem", lineHeight: 1.6 }}>
                  {project.businessValue || "Ölçümlenen iş değeri veya kazanım henüz belirtilmedi."}
                </p>
              </div>
            </div>

            {/* Operasyonel Özet Bilgiler */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: "var(--radius-md)",
              padding: "1rem 1.5rem",
              fontSize: "0.85rem"
            }}>
              <div>
                <div style={{ color: "#94a3b8", fontSize: "0.72rem", textTransform: "uppercase", marginBottom: "0.2rem" }}>HEDEF KULLANICILAR</div>
                <strong style={{ color: "#ffffff" }}>{project.targetUsers || "Şirket İçi Operasyon"}</strong>
              </div>

              <div>
                <div style={{ color: "#94a3b8", fontSize: "0.72rem", textTransform: "uppercase", marginBottom: "0.2rem" }}>BAŞLANGIÇ & CANLI</div>
                <strong style={{ color: "#ffffff" }}>
                  {project.startDate ? new Date(project.startDate).toLocaleDateString("tr-TR") : "-"}
                  {" → "}
                  {project.liveDate ? new Date(project.liveDate).toLocaleDateString("tr-TR") : "Canlıda"}
                </strong>
              </div>

              <div>
                <div style={{ color: "#94a3b8", fontSize: "0.72rem", textTransform: "uppercase", marginBottom: "0.2rem" }}>BİRİM / DEPARTMAN</div>
                <strong style={{ color: "#ffffff" }}>
                  {project.department || "Belirtilmedi"} {project.ownerName ? `(${project.ownerName})` : ""}
                </strong>
              </div>

              <div>
                <div style={{ color: "#94a3b8", fontSize: "0.72rem", textTransform: "uppercase", marginBottom: "0.2rem" }}>TEKNOLOJİ KÜMESİ</div>
                <div style={{ color: "#cbd5e1" }}>
                  {project.technologies?.slice(0, 4).join(", ") || "Belirtilmedi"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SLAYT 2: EKRAN GÖRÜNTÜLERİ VE GÖRSEL TANITIM */}
        {activeSlide === 1 && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center" }}>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ImageIcon size={24} color="var(--primary)" />
              <span>Kullanıcı Arayüzü & Ekran Önizlemeleri</span>
            </h2>

            {screenshots.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    width: "100%",
                    maxHeight: "56vh",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    background: "#020617",
                    border: "1px solid #334155",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative"
                  }}
                >
                  <img
                    src={screenshots[activeScreenshotIdx].filePath}
                    alt={screenshots[activeScreenshotIdx].caption || project.name}
                    style={{ maxWidth: "100%", maxHeight: "56vh", objectFit: "contain" }}
                  />

                  {screenshots.length > 1 && (
                    <>
                      <button
                        onClick={() => setActiveScreenshotIdx(i => (i > 0 ? i - 1 : screenshots.length - 1))}
                        style={{ position: "absolute", left: "1rem", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={() => setActiveScreenshotIdx(i => (i < screenshots.length - 1 ? i + 1 : 0))}
                        style={{ position: "absolute", right: "1rem", background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", borderRadius: "50%", width: "40px", height: "40px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}
                </div>

                <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                  <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                    {screenshots[activeScreenshotIdx].caption || "Ekran Görüntüsü"}
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    {screenshots.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveScreenshotIdx(i)}
                        style={{
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: activeScreenshotIdx === i ? "var(--primary)" : "#334155",
                          border: "none",
                          cursor: "pointer"
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "3rem", background: "#0f172a", borderRadius: "var(--radius-md)", border: "1px solid #334155" }}>
                <ImageIcon size={48} color="#64748b" style={{ margin: "0 auto 1rem" }} />
                <p style={{ color: "#cbd5e1", fontSize: "1rem" }}>
                  Bu proje için henüz bir ekran görüntüsü yüklenmemiştir.
                </p>
              </div>
            )}
          </div>
        )}

        {/* SLAYT 3: TEKNİK MİMARİ & ENTEGRASYONLAR */}
        {activeSlide === 2 && (
          <div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Cpu size={24} color="var(--primary)" />
              <span>Teknik Mimari, Bileşenler ve Dış Entegrasyonlar</span>
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              {/* Bileşenler */}
              <div style={{ background: "#0f172a", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid #334155" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#38bdf8", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Layers size={18} />
                  <span>Sistem Bileşenleri ({project.components?.length || 0})</span>
                </h3>
                {project.components && project.components.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {project.components.map(c => (
                      <div key={c.id} style={{ borderBottom: "1px solid #1e293b", paddingBottom: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <strong style={{ color: "#fff" }}>{c.name}</strong>
                          <span className="badge" style={{ background: "#1e293b", color: "#cbd5e1", fontSize: "0.72rem" }}>
                            {c.componentType}
                          </span>
                        </div>
                        {c.description && <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: "0.25rem 0 0" }}>{c.description}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#64748b", fontStyle: "italic" }}>Tanımlanmış bileşen bulunmamaktadır.</p>
                )}
              </div>

              {/* Entegrasyonlar */}
              <div style={{ background: "#0f172a", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid #334155" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#34d399", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Share2 size={18} />
                  <span>Entegrasyon Noktaları ({project.integrations?.length || 0})</span>
                </h3>
                {project.integrations && project.integrations.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {project.integrations.map(i => (
                      <div key={i.id} style={{ borderBottom: "1px solid #1e293b", paddingBottom: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <strong style={{ color: "#fff" }}>{i.name}</strong>
                          <div style={{ display: "flex", gap: "0.3rem" }}>
                            {i.isCritical && <span className="badge badge-vpn" style={{ fontSize: "0.68rem" }}>Kritik</span>}
                            <span className="badge" style={{ background: "#1e293b", color: "#cbd5e1", fontSize: "0.72rem" }}>
                              {i.integrationType}
                            </span>
                          </div>
                        </div>
                        {i.description && <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: "0.25rem 0 0" }}>{i.description}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#64748b", fontStyle: "italic" }}>Tanımlanmış entegrasyon bulunmamaktadır.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SLAYT 4: SÜRÜMLER VE OPERASYON NOTLARI */}
        {activeSlide === 3 && (
          <div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calendar size={24} color="var(--primary)" />
              <span>Sürüm Yol Haritası ve Operasyonel Notlar</span>
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              {/* Sürümler */}
              <div style={{ background: "#0f172a", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid #334155" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#fbbf24", marginBottom: "1rem" }}>
                  Sürüm Günlüğü
                </h3>
                {project.releases && project.releases.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    {project.releases.map(r => (
                      <div key={r.id} style={{ borderLeft: "2px solid var(--primary)", paddingLeft: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ fontFamily: "var(--font-mono)", color: "var(--primary)", fontWeight: 700 }}>{r.version}</span>
                          <span style={{ color: "#fff", fontWeight: 600 }}>{r.title}</span>
                        </div>
                        {r.description && <p style={{ color: "#94a3b8", fontSize: "0.82rem", margin: "0.2rem 0 0" }}>{r.description}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#64748b", fontStyle: "italic" }}>Kayıtlı sürüm notu bulunmamaktadır.</p>
                )}
              </div>

              {/* Notlar */}
              <div style={{ background: "#0f172a", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid #334155" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#a78bfa", marginBottom: "1rem" }}>
                  Geliştirme & Operasyon Notları
                </h3>
                {project.notes && project.notes.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    {project.notes.map(n => (
                      <div key={n.id} style={{ background: "#1e293b", padding: "0.75rem", borderRadius: "var(--radius-sm)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                          <strong style={{ color: "#fff", fontSize: "0.88rem" }}>{n.title}</strong>
                          <span className="badge" style={{ background: "#0f172a", color: "#94a3b8", fontSize: "0.68rem" }}>
                            {n.noteType}
                          </span>
                        </div>
                        {n.content && <p style={{ color: "#cbd5e1", fontSize: "0.82rem", margin: 0 }}>{n.content}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#64748b", fontStyle: "italic" }}>Kayıtlı not bulunmamaktadır.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Konuşmacı Notları Alt Paneli (Açılır/Kapanır) */}
      {showSpeakerNotes && (
        <div
          style={{
            background: "#020617",
            borderTop: "2px solid var(--primary)",
            padding: "1rem 2rem",
            color: "#e2e8f0",
            fontSize: "0.85rem",
            maxHeight: "140px",
            overflowY: "auto",
            flexShrink: 0
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
            <strong style={{ color: "#38bdf8", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.06em" }}>
              🎤 Konuşmacı Notları & Sunum İpuçları (Yalnızca Yönetici Görür)
            </strong>
            <button
              onClick={() => setShowSpeakerNotes(false)}
              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
            >
              <X size={14} />
            </button>
          </div>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            {activeSlide === 0 && (
              <>
                Bu slaytta odak noktası projenin çözdüğü operasyonel maliyet ve hata riskidir.
                {project.businessValue
                  ? ` Şirkete sağlanan değer: "${project.businessValue}".`
                  : " Henüz sayısal kazanım ölçümlenmemiştir, süreci aktarın."}
              </>
            )}
            {activeSlide === 1 && "Kullanıcı arayüzünün sadeliğine ve şirket içi kullanıcıların adaptasyon hızına değinin."}
            {activeSlide === 2 && "Dış sistem entegrasyonlarının (ERP/Nebim vb.) sağlamlığı ve kritik hata durumlarındaki dayanıklılık vurgulanmalıdır."}
            {activeSlide === 3 && "Sürüm takvimi ve gelecekte planlanan genişletmeler hakkında bilgi verin."}
          </p>
        </div>
      )}

      {/* Alt Gezinim Barı */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.75rem 2rem",
          background: "rgba(15, 23, 42, 0.95)",
          borderTop: "1px solid #1e293b",
          flexShrink: 0
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (activeSlide > 0) setActiveSlide(s => s - 1);
              else if (onPrev) onPrev();
            }}
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid #334155", color: "#f8fafc" }}
            title="Önceki Slayt (Sol Ok)"
          >
            <ChevronLeft size={16} />
            <span>Geri</span>
          </button>

          <span style={{ fontSize: "0.82rem", color: "#94a3b8", padding: "0 0.5rem" }}>
            Slayt {activeSlide + 1} / {slides.length}
          </span>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (activeSlide < slides.length - 1) setActiveSlide(s => s + 1);
              else if (onNext) onNext();
            }}
            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid #334155", color: "#f8fafc" }}
            title="Sonraki Slayt (Sağ Ok)"
          >
            <span>İleri</span>
            <ChevronRight size={16} />
          </button>
        </div>

        <div style={{ fontSize: "0.76rem", color: "#64748b" }}>
          Klavye Kısayolları: ← / → (Gezin) · F (Tam Ekran) · S (Notlar) · Esc (Çıkış)
        </div>
      </div>
    </div>
  );
};

export default PresentationModal;