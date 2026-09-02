import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  AlertCircle,
  Layers,
  Upload,
  X
} from "lucide-react";
import { api } from "../api/client";
import { ProjectDetailDto, ProjectLinkDto, ProjectScreenshotDto } from "../types";
import { useAuth } from "../context/AuthContext";
import { AdminLinkModal } from "../components/AdminLinkModal";
import { PresentationModal } from "../components/PresentationModal";
import { ProjectDetailHeader } from "../components/project-detail/ProjectDetailHeader";
import { ProjectDossierTab } from "../components/project-detail/ProjectDossierTab";
import { ProjectTechnicalTab } from "../components/project-detail/ProjectTechnicalTab";
import { ProjectLinkInventory } from "../components/project-detail/ProjectLinkInventory";
import { ProjectScreenshotGallery } from "../components/project-detail/ProjectScreenshotGallery";

interface ProjectDetailPageProps {
  slug: string;
  onBack: () => void;
  onEditProject?: (project: ProjectDetailDto) => void;
}

export const ProjectDetailPage: React.FC<ProjectDetailPageProps> = ({
  slug,
  onBack,
  onEditProject
}) => {
  const { isAdmin, user } = useAuth();
  const isEditor = user?.roles?.includes("Editor") ?? false;

  const [project, setProject] = useState<ProjectDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sekmeler: 'dossier' (Yönetici Özeti) vs 'technical' (Teknik Mimari)
  const [activeTab, setActiveTab] = useState<"dossier" | "technical">("dossier");
  const [showPresentation, setShowPresentation] = useState(false);

  // Link Modalları
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ProjectLinkDto | null>(null);
  const [linkToDelete, setLinkToDelete] = useState<ProjectLinkDto | null>(null);

  // Screenshot Yükleme Modalı
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadIsCover, setUploadIsCover] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    loadProject();
  }, [slug]);

  const loadProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProject(slug);
      setProject(data);
    } catch (err: any) {
      setError(err.message || "Proje detayları yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerified = async () => {
    if (!project) return;
    try {
      await api.setVerified(project.id, !project.isVerified);
      await loadProject();
    } catch (err: any) {
      alert(err.message || "Doğrulama durumu değiştirilemedi.");
    }
  };

  const handleArchive = async () => {
    if (!project) return;
    if (confirm(`'${project.name}' projesini arşivlemek istediğinizden emin misiniz?`)) {
      try {
        await api.archiveProject(project.id);
        onBack();
      } catch (err: any) {
        alert(err.message || "Proje arşivlenemedi.");
      }
    }
  };

  const handleSaveLink = async (linkData: any) => {
    if (!project) return;
    try {
      if (editingLink) {
        await api.updateLink(editingLink.id, linkData);
      } else {
        await api.createLink(project.id, linkData);
      }
      setLinkModalOpen(false);
      setEditingLink(null);
      await loadProject();
    } catch (err: any) {
      alert(err.message || "Bağlantı kaydedilemedi.");
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await api.deleteLink(linkId);
      setLinkToDelete(null);
      await loadProject();
    } catch (err: any) {
      alert(err.message || "Bağlantı silinemedi.");
    }
  };

  const handleSetPrimaryLink = async (linkId: string) => {
    try {
      await api.setPrimaryLink(linkId);
      await loadProject();
    } catch (err: any) {
      alert(err.message || "Birincil bağlantı ayarlanamadı.");
    }
  };

  const handleUploadScreenshot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !uploadFile) return;

    try {
      setUploadLoading(true);
      setUploadError(null);

      const formData = new FormData();
      formData.append("file", uploadFile);
      if (uploadCaption.trim()) {
        formData.append("caption", uploadCaption.trim());
      }
      formData.append("isCover", String(uploadIsCover));
      formData.append("displayOrder", String((project.screenshots?.length || 0) + 1));

      await api.uploadScreenshot(project.id, formData);
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadCaption("");
      setUploadIsCover(false);
      await loadProject();
    } catch (err: any) {
      setUploadError(err.message || "Ekran görüntüsü yüklenemedi.");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteScreenshot = async (screenshotId: string) => {
    if (confirm("Bu ekran görüntüsünü silmek istediğinizden emin misiniz?")) {
      try {
        await api.deleteScreenshot(screenshotId);
        await loadProject();
      } catch (err: any) {
        alert(err.message || "Ekran görüntüsü silinemedi.");
      }
    }
  };

  const handleSetCoverScreenshot = async (screenshot: ProjectScreenshotDto) => {
    try {
      await api.updateScreenshot(screenshot.id, {
        caption: screenshot.caption,
        isCover: true,
        displayOrder: screenshot.displayOrder
      });
      await loadProject();
    } catch (err: any) {
      alert(err.message || "Kapak görseli güncellenemedi.");
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "4rem 1.25rem", textAlign: "center" }}>
        <Layers size={36} className="animate-spin" color="var(--primary)" style={{ margin: "0 auto 0.75rem" }} />
        <div style={{ color: "var(--text-secondary)", fontSize: "0.92rem", fontWeight: 500 }}>
          Proje dosyası açılıyor...
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container" style={{ padding: "2.5rem 1.25rem" }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack} style={{ marginBottom: "1.25rem" }}>
          <ArrowLeft size={14} />
          <span>Geri Dön</span>
        </button>
        <div className="alert-box alert-danger">
          <AlertCircle size={18} />
          <div>{error || "Proje bulunamadı."}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "1.5rem 1.25rem 4rem" }}>
      {/* Üst Bilgi ve Başlık */}
      <ProjectDetailHeader
        project={project}
        isAdmin={isAdmin}
        isEditor={isEditor}
        onBack={onBack}
        onStartPresentation={() => setShowPresentation(true)}
        onToggleVerified={handleToggleVerified}
        onArchive={handleArchive}
        onEdit={onEditProject ? () => onEditProject(project) : undefined}
      />

      {/* URL Envanteri (Öncelikli Operasyonel Alan) */}
      <ProjectLinkInventory
        links={project.links || []}
        isAdmin={isAdmin}
        onAddLink={() => {
          setEditingLink(null);
          setLinkModalOpen(true);
        }}
        onEditLink={(link) => {
          setEditingLink(link);
          setLinkModalOpen(true);
        }}
        onDeleteLink={(link) => setLinkToDelete(link)}
        onSetPrimary={handleSetPrimaryLink}
      />

      {/* Sekmeler: Proje Dosyası vs Teknik Detaylar */}
      <div style={{ display: "flex", gap: "0.5rem", borderBottom: "1px solid var(--border-subtle)", marginBottom: "1.5rem" }}>
        <button
          className={`btn btn-ghost ${activeTab === "dossier" ? "active" : ""}`}
          style={{
            borderBottom: activeTab === "dossier" ? "2px solid var(--primary)" : "2px solid transparent",
            borderRadius: 0,
            padding: "0.65rem 1.25rem",
            color: activeTab === "dossier" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: 700,
            fontSize: "0.92rem"
          }}
          onClick={() => setActiveTab("dossier")}
        >
          <span>İş Dosyası & Yönetici Özeti</span>
        </button>

        <button
          className={`btn btn-ghost ${activeTab === "technical" ? "active" : ""}`}
          style={{
            borderBottom: activeTab === "technical" ? "2px solid var(--primary)" : "2px solid transparent",
            borderRadius: 0,
            padding: "0.65rem 1.25rem",
            color: activeTab === "technical" ? "var(--primary)" : "var(--text-muted)",
            fontWeight: 700,
            fontSize: "0.92rem"
          }}
          onClick={() => setActiveTab("technical")}
        >
          <span>Teknik Mimari & Bileşenler</span>
        </button>
      </div>

      {/* Aktif Sekme İçeriği */}
      <div style={{ marginBottom: "2rem" }}>
        {activeTab === "dossier" ? (
          <ProjectDossierTab project={project} />
        ) : (
          <ProjectTechnicalTab project={project} />
        )}
      </div>

      {/* Ekran Görüntüleri Galerisi */}
      <ProjectScreenshotGallery
        screenshots={project.screenshots || []}
        isAdmin={isAdmin}
        isEditor={isEditor}
        onUploadClick={() => setUploadModalOpen(true)}
        onSetCover={handleSetCoverScreenshot}
        onDelete={handleDeleteScreenshot}
      />

      {/* Ekran Görüntüsü Yükleme Modalı */}
      {uploadModalOpen && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: "460px" }}>
            <div className="modal-header">
              <h3 className="modal-title">Yeni Ekran Görüntüsü Yükle</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setUploadModalOpen(false)}
                disabled={uploadLoading}
              >
                <X size={18} />
              </button>
            </div>

            {uploadError && (
              <div className="alert-box alert-danger" style={{ margin: "1rem 1.25rem 0" }}>
                <AlertCircle size={16} />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadScreenshot} style={{ padding: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label">Görsel Dosyası (.png, .jpg, .webp)</label>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  className="form-control"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  required
                  disabled={uploadLoading}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Görsel Başlığı / Açıklama (İsteğe Bağlı)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Örn: E-Fatura Eşleştirme ve Kontrol Ekranı"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  disabled={uploadLoading}
                />
              </div>

              <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="chk-cover"
                  checked={uploadIsCover}
                  onChange={(e) => setUploadIsCover(e.target.checked)}
                  disabled={uploadLoading}
                  style={{ accentColor: "var(--primary)", width: "16px", height: "16px" }}
                />
                <label htmlFor="chk-cover" style={{ cursor: "pointer", margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  Bu görseli projenin kapak görseli olarak ayarla
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setUploadModalOpen(false)}
                  disabled={uploadLoading}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={uploadLoading || !uploadFile}
                >
                  <Upload size={14} />
                  <span>{uploadLoading ? "Yükleniyor..." : "Görseli Kaydet"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Link Modal */}
      {linkModalOpen && (
        <AdminLinkModal
          projectId={project.id}
          initialData={editingLink}
          onClose={() => {
            setLinkModalOpen(false);
            setEditingLink(null);
          }}
          onSave={handleSaveLink}
        />
      )}

      {/* Sunum Modu Modalı */}
      {showPresentation && (
        <PresentationModal
          project={project}
          onClose={() => setShowPresentation(false)}
        />
      )}

      {/* Link Silme Onay Modalı */}
      {linkToDelete && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: "420px" }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: "var(--status-maint)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertCircle size={18} />
                <span>Bağlantıyı Pasife Al</span>
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setLinkToDelete(null)}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: "1.25rem" }}>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                <strong>{linkToDelete.label}</strong> ({linkToDelete.url}) bağlantısını pasife almak istediğinizden emin misiniz?
                <br /><br />
                Pasife alınan bağlantılar genel envanterde görünmez ancak veritabanında arşivlenir.
              </p>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", padding: "1rem 1.25rem", borderTop: "1px solid var(--border-subtle)" }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setLinkToDelete(null)}>
                Vazgeç
              </button>
              <button
                className="btn btn-primary btn-sm"
                style={{ background: "var(--status-maint)", borderColor: "var(--status-maint)" }}
                onClick={() => handleDeleteLink(linkToDelete.id)}
              >
                Evet, Pasife Al
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;