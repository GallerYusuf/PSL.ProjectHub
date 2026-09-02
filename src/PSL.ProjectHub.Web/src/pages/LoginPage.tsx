import React, { useState } from 'react';
import { Layers, LogIn, KeyRound, User, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginPageProps {
  onSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Lütfen kullanıcı adı ve şifrenizi eksiksiz giriniz.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(username.trim(), password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız. Kullanıcı adı veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', padding: '2.25rem' }}>
        {/* Logo ve Başlık */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div className="brand-logo-badge" style={{ margin: '0 auto 0.85rem', width: '44px', height: '44px' }}>
            <Layers size={22} />
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            PSL Project Hub
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Proje Operasyon Merkezi Yetkili Kullanıcı Girişi
          </p>
        </div>

        {/* Hata Bildirimi */}
        {error && (
          <div className="alert-box alert-danger" role="alert">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Giriş Formu */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Kullanıcı Adı veya E-posta</label>
            <div style={{ position: 'relative' }}>
              <User size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="username"
                type="text"
                className="form-input"
                style={{ width: '100%', paddingLeft: '2.2rem' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı adınız"
                autoComplete="username"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Şifre</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="password"
                type="password"
                className="form-input"
                style={{ width: '100%', paddingLeft: '2.2rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.65rem', marginTop: '0.75rem' }}
            disabled={loading}
          >
            <LogIn size={15} />
            <span>{loading ? 'Doğrulanıyor...' : 'Oturum Aç'}</span>
          </button>
        </form>

        {/* Kurumsal Güvenlik Uyarısı */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
          <ShieldCheck size={14} color="var(--primary)" />
          <span>Yetkisiz erişim denemeleri kurumsal güvenlik ilkeleri gereği kayıt altına alınmaktadır.</span>
        </div>
      </div>
    </div>
  );
};
