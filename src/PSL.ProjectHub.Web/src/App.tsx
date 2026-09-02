import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import { PresentationModal } from './components/PresentationModal';
import { AdminProjectModal } from './components/AdminProjectModal';
import { ProjectSummaryDto, ProjectDetailDto } from './types';
import { api } from './api/client';
import { ShieldAlert, Layers } from 'lucide-react';

type Tab = 'dashboard' | 'projects' | 'admin' | 'login';

export const AppContent: React.FC = () => {
  const { user, isAdmin, isAuthenticated, loading, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  // Global Sunum Modu ve Yeni Proje Modalı
  const [presentationProject, setPresentationProject] = useState<ProjectDetailDto | null>(null);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Hash navigasyonu ve geri/ileri tuşu senkronizasyonu
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '');
      if (hash.startsWith('projects/')) {
        const slug = hash.replace('projects/', '');
        setSelectedSlug(slug);
        setCurrentTab('projects');
      } else if (hash === 'projects') {
        setSelectedSlug(null);
        setCurrentTab('projects');
      } else if (hash === 'admin') {
        setSelectedSlug(null);
        setCurrentTab('admin');
      } else if (hash === 'login') {
        setSelectedSlug(null);
        setCurrentTab('login');
      } else {
        setSelectedSlug(null);
        setCurrentTab('dashboard');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Oturum kontrolü: Yükleme bittiğinde ve oturum açılmamışsa login ekranına yönlendir
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      if (currentTab !== 'login') {
        setCurrentTab('login');
        window.location.hash = 'login';
      }
    }
  }, [loading, isAuthenticated, currentTab]);

  const navigateTo = (tab: Tab, slug?: string) => {
    if (slug) {
      window.location.hash = `projects/${slug}`;
      setSelectedSlug(slug);
      setCurrentTab('projects');
    } else {
      window.location.hash = tab === 'dashboard' ? '' : tab;
      setSelectedSlug(null);
      setCurrentTab(tab);
    }
  };

  const handleStartPresentation = async (projectSummary: ProjectSummaryDto) => {
    try {
      const detail = await api.getProject(projectSummary.slug);
      setPresentationProject(detail);
    } catch {
      setPresentationProject({
        ...projectSummary,
        components: [],
        links: projectSummary.primaryLink ? [projectSummary.primaryLink] : [],
        screenshots: [],
        integrations: [],
        releases: [],
        notes: [],
      });
    }
  };

  const handleLaunchFirstProjectPresentation = async () => {
    try {
      const projects = await api.getProjects();
      if (projects.length > 0) {
        await handleStartPresentation(projects[0]);
      }
    } catch {
      // sessizce geç
    }
  };

  // Oturum ilk yüklenirken gösterilecek kurumsal bekleme ekranı
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
        <div style={{ textAlign: 'center' }}>
          <Layers size={36} color="var(--primary)" className="animate-spin" style={{ margin: '0 auto 1rem' }} />
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1.1rem' }}>PSL Project Hub</div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Oturum ve güvenlik yetkileri doğrulanıyor...</div>
        </div>
      </div>
    );
  }

  // Giriş Yapılmamışsa Login Sayfasını Göster
  if (!isAuthenticated) {
    return <LoginPage onSuccess={() => navigateTo('dashboard')} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentTab={selectedSlug ? 'projects' : currentTab}
        onSelectTab={(tab) => navigateTo(tab)}
        onOpenPresentation={handleLaunchFirstProjectPresentation}
        onSearchSubmit={(q) => {
          setGlobalSearch(q);
          navigateTo('projects');
        }}
      />

      <main style={{ flex: 1 }}>
        {selectedSlug ? (
          <ProjectDetailPage
            slug={selectedSlug}
            onBack={() => navigateTo('projects')}
          />
        ) : currentTab === 'dashboard' ? (
          <DashboardPage
            onNavigateProjects={() => navigateTo('projects')}
            onViewDetails={(slug) => navigateTo('projects', slug)}
            onStartPresentation={handleStartPresentation}
          />
        ) : currentTab === 'projects' ? (
          <ProjectsPage
            onViewDetails={(slug) => navigateTo('projects', slug)}
            onStartPresentation={handleStartPresentation}
            onAddNewProject={isAdmin ? () => setNewProjectModalOpen(true) : undefined}
            initialSearch={globalSearch}
          />
        ) : currentTab === 'admin' ? (
          isAdmin ? (
            <AdminPage onViewDetails={(slug) => navigateTo('projects', slug)} />
          ) : (
            /* 403 Forbidden Durumu: Admin yetkisi olmayan kullanıcı */
            <div className="container" style={{ padding: '4rem 1.25rem', textAlign: 'center' }}>
              <div className="card" style={{ maxWidth: '480px', margin: '0 auto', padding: '2.5rem' }}>
                <ShieldAlert size={42} color="var(--status-maint)" style={{ margin: '0 auto 0.75rem' }} />
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                  403 — Yetkisiz Erişim (Forbidden)
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.55, marginBottom: '1.5rem' }}>
                  Bu operasyon konsoluna erişim yetkiniz bulunmamaktadır. Yalnızca Sistem Yöneticisi (Admin) rolüne sahip kullanıcılar işlem yapabilir.
                </p>
                <button className="btn btn-primary" onClick={() => navigateTo('dashboard')}>
                  Dashboard'a Geri Dön
                </button>
              </div>
            </div>
          )
        ) : currentTab === 'login' ? (
          <LoginPage onSuccess={() => navigateTo('dashboard')} />
        ) : null}
      </main>

      {/* Genel Sunum Modu Modalı */}
      {presentationProject && (
        <PresentationModal
          project={presentationProject}
          onClose={() => setPresentationProject(null)}
        />
      )}

      {/* Yeni Proje Ekleme Modalı */}
      {newProjectModalOpen && (
        <AdminProjectModal
          onClose={() => setNewProjectModalOpen(false)}
          onSave={async (data) => {
            await api.createProject(data);
            setNewProjectModalOpen(false);
            navigateTo('projects');
          }}
        />
      )}

      {/* Alt Bilgi */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', background: '#ffffff', padding: '1rem 0', marginTop: 'auto', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <div className="container">
          <div>PSL İç ve Dış Ticaret A.Ş. & Gallery Crystal © {new Date().getFullYear()} — PSL Project Hub</div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
