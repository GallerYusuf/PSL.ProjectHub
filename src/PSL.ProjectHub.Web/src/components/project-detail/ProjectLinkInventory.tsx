import React from "react";
import {
  ExternalLink,
  Plus,
  Star,
  Edit,
  Trash2,
  Lock,
  ShieldAlert,
  Layers
} from "lucide-react";
import { ProjectLinkDto } from "../../types";

interface ProjectLinkInventoryProps {
  links: ProjectLinkDto[];
  isAdmin: boolean;
  onAddLink: () => void;
  onEditLink: (link: ProjectLinkDto) => void;
  onDeleteLink: (link: ProjectLinkDto) => void;
  onSetPrimary: (linkId: string) => void;
}

export const ProjectLinkInventory: React.FC<ProjectLinkInventoryProps> = ({
  links,
  isAdmin,
  onAddLink,
  onEditLink,
  onDeleteLink,
  onSetPrimary
}) => {
  return (
    <div className="card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Layers size={18} color="var(--primary)" />
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            Sistem Bağlantıları ve Canlı Adres Envanteri ({links.length})
          </h3>
        </div>

        {isAdmin && (
          <button
            className="btn btn-primary btn-sm"
            onClick={onAddLink}
            style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
          >
            <Plus size={14} />
            <span>Yeni URL Tanımla</span>
          </button>
        )}
      </div>

      {links.length === 0 ? (
        <div className="empty-state" style={{ padding: "2.5rem 1rem", textAlign: "center" }}>
          <ExternalLink size={28} color="var(--text-muted)" style={{ margin: "0 auto 0.5rem" }} />
          <div className="empty-state-title" style={{ fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
            Kayıtlı URL Bulunamadı
          </div>
          <p style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Bu sistem için henüz tanımlanmış bir erişim adresi bulunmuyor.
          </p>
          {isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={onAddLink}>
              İlk Bağlantıyı Ekle
            </button>
          )}
        </div>
      ) : (
        <div className="table-container" style={{ overflowX: "auto" }}>
          <table className="table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                <th style={{ padding: "0.6rem 0.75rem", fontSize: "0.76rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Bağlantı Tanımı
                </th>
                <th style={{ padding: "0.6rem 0.75rem", fontSize: "0.76rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Ortam
                </th>
                <th style={{ padding: "0.6rem 0.75rem", fontSize: "0.76rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Tür
                </th>
                <th style={{ padding: "0.6rem 0.75rem", fontSize: "0.76rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  URL Adresi
                </th>
                <th style={{ padding: "0.6rem 0.75rem", fontSize: "0.76rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Ağ Kapsamı
                </th>
                <th style={{ padding: "0.6rem 0.75rem", fontSize: "0.76rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Kimlik Doğrulama
                </th>
                <th style={{ padding: "0.6rem 0.75rem", fontSize: "0.76rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, textAlign: "right" }}>
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr
                  key={link.id}
                  style={{
                    borderBottom: "1px solid var(--border-subtle)",
                    opacity: link.isActive ? 1 : 0.6
                  }}
                >
                  <td style={{ padding: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <strong style={{ color: "var(--text-primary)", fontSize: "0.88rem" }}>
                        {link.label}
                      </strong>
                      {link.isPrimary && (
                        <span className="badge badge-live" style={{ fontSize: "0.68rem", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                          <Star size={10} fill="currentColor" />
                          <span>Birincil</span>
                        </span>
                      )}
                      {!link.isActive && (
                        <span className="badge badge-archived" style={{ fontSize: "0.68rem" }}>
                          Pasif
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <span className="badge" style={{ background: "var(--bg-subtle)", fontSize: "0.74rem" }}>
                      {link.environmentText || link.environment}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {link.linkTypeText || link.linkType}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="code-url"
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem", fontFamily: "var(--font-mono)" }}
                    >
                      <span>{link.url}</span>
                      <ExternalLink size={12} />
                    </a>
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    {link.requiresVpn ? (
                      <span className="badge badge-vpn" style={{ fontSize: "0.72rem" }}>
                        <ShieldAlert size={10} /> VPN Gerekli
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Doğrudan Ağ</span>
                    )}
                  </td>
                  <td style={{ padding: "0.75rem" }}>
                    {link.requiresAuthentication ? (
                      <span className="badge" style={{ background: "var(--primary-subtle)", color: "var(--primary)", fontSize: "0.72rem", display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                        <Lock size={10} />
                        <span>Gerekli</span>
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Serbest</span>
                    )}
                  </td>
                  <td style={{ padding: "0.75rem", textAlign: "right", whiteSpace: "nowrap" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                      >
                        <ExternalLink size={12} />
                        <span>Aç</span>
                      </a>

                      {isAdmin && (
                        <>
                          {!link.isPrimary && (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => onSetPrimary(link.id)}
                              title="Birincil Bağlantı Yap"
                            >
                              <Star size={13} />
                            </button>
                          )}

                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => onEditLink(link)}
                            title="Düzenle"
                          >
                            <Edit size={13} />
                          </button>

                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => onDeleteLink(link)}
                            title="Sil / Pasife Al"
                            style={{ color: "var(--status-maint)" }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};