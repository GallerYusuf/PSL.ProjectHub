import React, { useState } from 'react';
import { Layers, LayoutDashboard, FolderGit2, ShieldCheck, LogIn, LogOut, UserCheck, PlaySquare, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: 'dashboard' | 'projects' | 'admin' | 'login';
  onSelectTab: (tab: 'dashboard' | 'projects' | 'admin' | 'login') => void;
  onOpenPresentation?: () => void;
  onSearchSubmit?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenPresentation,
  onSearchSubmit
}) => {
  const { user, isAdmin, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  // Ortam tespiti (Dev / Prod)
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (onSearchSubmit) {
        onSearchSubmit(searchQuery);
      }
      onSelectTab('projects');
    }
  };

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        {/* Sol: Logo, Başlık ve Ortam Rozeti */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            className="brand-group"
            style={{ cursor: 'pointer' }}
            onClick={() => onSelectTab('dashboard')}
            title="Dashboard'a Git"
          >
            <div className="brand-logo-badge">
              <Layers size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span className="brand-title">PSL Project Hub</span>
                <span className={`env-badge ${isDev ? 'env-badge-dev' : 'env-badge-prod'}`}>
                  {isDev ? 'DEV' : 'PROD'}
                </span>
              </div>
              <span className="brand-subtitle">Gallery Crystal / Proje Operasyon Merkezi</span>
            </div>
          </div>
        </div>

        {/* Orta: Hızlı Arama */}
        {isAuthenticated && (
          <div style={{ flex: '1', maxWidth: '320px', margin: '0 1rem' }}>
            <div className="search-input-wrap">
              <Search size={14} className="search-input-icon" />
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '0.82rem', padding: '0.35rem 0.6rem 0.35rem 2rem' }}
                placeholder="Proje veya servis ara... (Enter)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKey}
              />
            </div>
          </div>
        )}

        {/* Sağ: Gezinme Menüsü ve Kullanıcı Durumu */}
        <nav className="nav-links">
          {isAuthenticated && (
            <>
              <button
                className={`nav-link ${currentTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => onSelectTab('dashboard')}
              >
                <LayoutDashboard size={15} />
                <span>Dashboard</span>
              </button>

              <button
                className={`nav-link ${currentTab === 'projects' ? 'active' : ''}`}
                onClick={() => onSelectTab('projects')}
              >
                <FolderGit2 size={15} />
                <span>Projeler</span>
              </button>

              {isAdmin && (
                <button
                  className={`nav-link ${currentTab === 'admin' ? 'active' : ''}`}
                  onClick={() => onSelectTab('admin')}
                >
                  <ShieldCheck size={15} />
                  <span>Yönetim Paneli</span>
                </button>
              )}

              {onOpenPresentation && (
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenPresentation}
                  title="Yönetici / Paydaş Sunum Modunu Başlat"
                  style={{ marginLeft: '0.25rem' }}
                >
                  <PlaySquare size={14} />
                  <span>Sunum Modu</span>
                </button>
              )}

              <div style={{ width: '1px', height: '20px', background: 'var(--border-subtle)', margin: '0 0.4rem' }} />
            </>
          )}

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.82rem' }}>
                <UserCheck size={14} color="var(--primary)" />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user?.fullName || user?.username}</span>
                <span className={`badge ${isAdmin ? 'badge-verified' : 'badge-archived'}`}>
                  {isAdmin ? 'Admin' : 'Viewer'}
                </span>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={logout}
                title="Güvenli Çıkış Yap"
              >
                <LogOut size={14} />
                <span>Çıkış</span>
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onSelectTab('login')}
            >
              <LogIn size={14} />
              <span>Giriş Yap</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
