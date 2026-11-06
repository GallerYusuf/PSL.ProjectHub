import React, { useState, useEffect } from "react";
import { Layers, ShieldCheck, AlertCircle, Building2, User, Mail, Lock, CheckCircle2, ArrowRight, Users, Palette } from "lucide-react";
import { api } from "../api/client";

interface SetupPageProps {
  onComplete: () => void;
}

/** Sunucudaki ASP.NET Identity şifre politikasıyla birebir aynı kurallar. */
const PASSWORD_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "en az 8 karakter", test: p => p.length >= 8 },
  { label: "büyük harf", test: p => /[A-ZÇĞİÖŞÜ]/.test(p) },
  { label: "küçük harf", test: p => /[a-zçğıöşü]/.test(p) },
  { label: "rakam", test: p => /[0-9]/.test(p) },
  { label: "sembol (! * . - gibi)", test: p => /[^A-Za-z0-9ÇĞİÖŞÜçğıöşü]/.test(p) },
];

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { score, label: "Zayıf", color: "#ef4444" };
  if (score <= 4) return { score, label: "Orta", color: "#f59e0b" };
  return { score, label: "Güçlü", color: "#10b981" };
}

export const SetupPage: React.FC<SetupPageProps> = ({ onComplete }) => {
  const [step, setStep] = useState<"loading" | "setup" | "done">("loading");
  const [form, setForm] = useState({
    organizationName: "",
    teamName: "Yazılım Ekibi",
    directorName: "",
    directorTitle: "",
    accentColor: "#0f4c81",
    adminFullName: "",
    adminUsername: "",
    adminEmail: "",
    adminPassword: "",
    adminPasswordConfirm: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const strength = getPasswordStrength(form.adminPassword);

  useEffect(() => {
    api.getSetupStatus()
      .then(status => setStep(status.isInitialized ? "done" : "setup"))
      .catch(() => setStep("setup"));
  }, []);

  useEffect(() => {
    if (step === "done") {
      const timer = setTimeout(() => onComplete(), 1800);
      return () => clearTimeout(timer);
    }
  }, [step, onComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.adminPassword !== form.adminPasswordConfirm) {
      setError("Şifreler eşleşmiyor. Lütfen her iki alana da aynı şifreyi giriniz.");
      return;
    }
    const missing = PASSWORD_RULES.filter(r => !r.test(form.adminPassword)).map(r => r.label);
    if (missing.length > 0) {
      setError(`Şifre şu kuralları karşılamıyor: ${missing.join(", ")}.`);
      return;
    }
    setSubmitting(true);
    try {
      await api.initializeSystem({
        organizationName: form.organizationName.trim(),
        teamName: form.teamName.trim() || undefined,
        directorName: form.directorName.trim() || undefined,
        directorTitle: form.directorTitle.trim() || undefined,
        accentColor: form.accentColor,
        adminUsername: form.adminUsername.trim(),
        adminEmail: form.adminEmail.trim(),
        adminPassword: form.adminPassword,
        adminFullName: form.adminFullName.trim()
      });
      setStep("done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kurulum sırasında bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-app)" }}>
        <div style={{ textAlign: "center" }}>
          <Layers size={36} color="var(--primary)" className="animate-spin" style={{ margin: "0 auto 1rem" }} />
          <div style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1.1rem" }}>Project Hub</div>
          <div style={{ fontSize: "0.84rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>Sistem yapılandırma durumu denetleniyor...</div>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-app)", padding: "1.5rem" }}>
        <div className="card" style={{ width: "100%", maxWidth: "460px", padding: "2.5rem", textAlign: "center" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "var(--status-live-bg)", border: "1px solid var(--status-live-border)", color: "var(--status-live)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <CheckCircle2 size={32} />
          </div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
            Sistem Kurulumu Tamamlandı
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
            Yönetici hesabı ve temel veri katmanı başarıyla oluşturuldu. Giriş ekranına yönlendiriliyorsunuz...
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "var(--primary)", fontSize: "0.85rem", fontWeight: 600 }}>
            <span>Devam ediliyor</span>
            <ArrowRight size={16} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-app)", padding: "2rem 1.25rem" }}>
      <div className="card" style={{ width: "100%", maxWidth: "520px", padding: "2.25rem" }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div className="brand-logo-badge" style={{ margin: "0 auto 0.85rem", width: "48px", height: "48px" }}>
            <Layers size={24} />
          </div>
          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.25rem" }}>
            Project Hub İlk Kurulum
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.84rem" }}>
            Firma ve ekip bilgileriniz giriş ekranına, menüye ve sunum kapağına otomatik yerleşir. Hepsi sonradan Yönetim → Firma Ayarları'ndan değiştirilebilir.
          </p>
        </div>

        {error && (
          <div className="alert-box alert-danger" role="alert" style={{ marginBottom: "1.25rem" }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.35rem", marginTop: "0.25rem" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
              1. Firma ve Ekip
            </span>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="setup-org-name" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Building2 size={14} /> Firma Adı
            </label>
            <input
              id="setup-org-name"
              type="text"
              className="form-control"
              placeholder="Örn: Örnek Teknoloji A.Ş."
              value={form.organizationName}
              onChange={e => setForm(f => ({ ...f, organizationName: e.target.value }))}
              required
              disabled={submitting}
              autoComplete="organization"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.75rem", alignItems: "end" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="setup-team-name" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Users size={14} /> Ekip Adı
              </label>
              <input
                id="setup-team-name"
                type="text"
                className="form-control"
                placeholder="Örn: Yazılım Geliştirme Ekibi"
                value={form.teamName}
                onChange={e => setForm(f => ({ ...f, teamName: e.target.value }))}
                required
                disabled={submitting}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="setup-accent" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Palette size={14} /> Kurumsal Renk
              </label>
              <input
                id="setup-accent"
                type="color"
                className="form-control"
                style={{ width: "72px", padding: "0.2rem", height: "38px" }}
                value={form.accentColor}
                onChange={e => setForm(f => ({ ...f, accentColor: e.target.value }))}
                disabled={submitting}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="setup-director-name">Ekip Yöneticisi (opsiyonel)</label>
              <input
                id="setup-director-name"
                type="text"
                className="form-control"
                placeholder="Ad Soyad"
                value={form.directorName}
                onChange={e => setForm(f => ({ ...f, directorName: e.target.value }))}
                disabled={submitting}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="setup-director-title">Unvanı</label>
              <input
                id="setup-director-title"
                type="text"
                className="form-control"
                placeholder="Örn: Yazılım Direktörü"
                value={form.directorTitle}
                onChange={e => setForm(f => ({ ...f, directorTitle: e.target.value }))}
                disabled={submitting}
              />
            </div>
          </div>

          <div style={{ borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.35rem", marginTop: "0.5rem" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
              2. Ana Yönetici (Admin) Hesabı
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="setup-full-name" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <User size={14} /> Ad Soyad
              </label>
              <input
                id="setup-full-name"
                type="text"
                className="form-control"
                placeholder="Yusuf Emre Deniz"
                value={form.adminFullName}
                onChange={e => setForm(f => ({ ...f, adminFullName: e.target.value }))}
                required
                disabled={submitting}
                autoComplete="name"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="setup-username" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <ShieldCheck size={14} /> Kullanıcı Adı
              </label>
              <input
                id="setup-username"
                type="text"
                className="form-control"
                placeholder="admin"
                value={form.adminUsername}
                onChange={e => setForm(f => ({ ...f, adminUsername: e.target.value }))}
                required
                disabled={submitting}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label htmlFor="setup-email" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Mail size={14} /> E-posta Adresi
            </label>
            <input
              id="setup-email"
              type="email"
              className="form-control"
              placeholder="admin@sirket.com"
              value={form.adminEmail}
              onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))}
              required
              disabled={submitting}
              autoComplete="email"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="setup-password" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Lock size={14} /> Şifre
              </label>
              <input
                id="setup-password"
                type="password"
                className="form-control"
                placeholder="En az 8 karakter"
                value={form.adminPassword}
                onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))}
                required
                disabled={submitting}
                autoComplete="new-password"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="setup-password-confirm" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <Lock size={14} /> Şifre (Tekrar)
              </label>
              <input
                id="setup-password-confirm"
                type="password"
                className="form-control"
                placeholder="Şifreyi onaylayın"
                value={form.adminPasswordConfirm}
                onChange={e => setForm(f => ({ ...f, adminPasswordConfirm: e.target.value }))}
                required
                disabled={submitting}
                autoComplete="new-password"
              />
            </div>
          </div>

          {form.adminPassword && (
            <div style={{ background: "var(--bg-subtle)", padding: "0.5rem 0.75rem", borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.78rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Şifre Karmaşıklığı:</span>
              <span style={{ fontWeight: 700, color: strength.color }}>{strength.label}</span>
            </div>
          )}

          <ul aria-label="Şifre kuralları" style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", gap: "0.35rem 0.85rem", fontSize: "0.76rem" }}>
            {PASSWORD_RULES.map(rule => {
              const ok = rule.test(form.adminPassword);
              return (
                <li key={rule.label} style={{ color: ok ? "var(--status-live)" : "var(--text-muted)", fontWeight: ok ? 600 : 400 }}>
                  {ok ? "✓" : "○"} {rule.label}
                </li>
              );
            })}
          </ul>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "0.75rem", padding: "0.7rem 1.25rem", justifyContent: "center" }}
            disabled={submitting}
          >
            {submitting ? "Kurulum Yapılıyor..." : "Kurulumu Tamamla ve Başlat"}
          </button>
        </form>

        <p style={{ marginTop: "1.25rem", fontSize: "0.74rem", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.4 }}>
          Bu ekran yalnızca veritabanında henüz bir kullanıcı hesabı bulunmadığında bir defaya mahsus gösterilir.
        </p>
      </div>
    </div>
  );
};

export default SetupPage;