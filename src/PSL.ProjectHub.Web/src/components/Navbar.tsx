import React from 'react';
import { Layers, LayoutDashboard, FolderGit2, ShieldCheck, LogIn, LogOut, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: 'dashboard' | 'projects' | 'admin' | 'login';
  onSelectTab: (tab: 'dashboard' | 'projects' | 'admin' | 'login') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, isAdmin, isAuthenticated, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <div className="brand-group" style={{ cursor: 'pointer' }} onClick={() => onSelectTab('dashboard')}>
          <div className="brand-logo-badge">
            <Layers size={22} />
          </div>
          <div>
            <div className="brand-title">PSL Project Hub</div>
            <span className="brand-subtitle">Gallery Crystal / PSL Yazılım Merkezi</span>
          </div>
        </div>

        <nav className="nav-links">
          <button
            className={`nav-link ${currentTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => onSelectTab('dashboard')}
          >
            <LayoutDashboard size={17} />
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-link ${currentTab === 'projects' ? 'active' : ''}`}
            onClick={() => onSelectTab('projects')}
          >
            <FolderGit2 size={17} />
            <span>Projeler</span>
          </button>

          {isAdmin && (
            <button
              className={`nav-link ${currentTab === 'admin' ? 'active' : ''}`}
              onClick={() => onSelectTab('admin')}
            >
              <ShieldCheck size={17} />
              <span>Yönetim Paneli</span>
            </button>
          )}

          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)', margin: '0 0.5rem' }} />

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
                <UserCheck size={15} color="var(--primary)" />
                <span style={{ fontWeight: 600 }}>{user?.fullName || user?.username}</span>
                <span className={`badge ${isAdmin ? 'badge-verified' : 'badge-archived'}`} style={{ fontSize: '0.7rem' }}>
                  {isAdmin ? 'Admin' : 'Viewer'}
                </span>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={logout}
                title="Çıkış Yap"
              >
                <LogOut size={16} />
                <span>Çıkış</span>
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onSelectTab('login')}
            >
              <LogIn size={15} />
              <span>Giriş Yap</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
