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

type Tab = 'dashboard' | 'projects' | 'admin' | 'login';

const AppContent: React.FC = () => {
  const { isAdmin } = useAuth();
  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  // Modals
  const [presentationProject, setPresentationProject] = useState<ProjectDetailDto | null>(null);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);

  // Sync with browser hash / location on back/forward
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
    handleHashChange(); // initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (tab: Tab, slug?: string) => {
    if (slug) {
      window.location.hash = `projects/${slug}`;
      setSelectedSlug(slug);
    } else {
      window.location.hash = tab === 'dashboard' ? '' : tab;
      setSelectedSlug(null);
    }
    setCurrentTab(tab);
  };

  const handleStartPresentation = async (projectSummary: ProjectSummaryDto) => {
    try {
      const detail = await api.getProject(projectSummary.slug);
      setPresentationProject(detail);
    } catch {
      // Fallback: minimal detail
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

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentTab={selectedSlug ? 'projects' : currentTab}
        onSelectTab={(tab) => navigateTo(tab)}
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
          />
        ) : currentTab === 'admin' ? (
          <AdminPage onViewDetails={(slug) => navigateTo('projects', slug)} />
        ) : currentTab === 'login' ? (
          <LoginPage onSuccess={() => navigateTo('dashboard')} />
        ) : null}
      </main>

      {/* Global Presentation Modal */}
      {presentationProject && (
        <PresentationModal
          project={presentationProject}
          onClose={() => setPresentationProject(null)}
        />
      )}

      {/* Global New Project Modal */}
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

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '1.5rem 0', marginTop: 'auto', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
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
