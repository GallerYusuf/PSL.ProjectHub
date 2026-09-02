import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  Grid,
  List,
  RotateCcw,
  Plus,
  Layers,
  AlertCircle,
  ExternalLink,
  Eye,
  CheckCircle2,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { api } from '../api/client';
import { ProjectSummaryDto, ProjectStatus } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { useAuth } from '../context/AuthContext';

interface ProjectsPageProps {
  onViewDetails: (slug: string) => void;
  onStartPresentation: (project: ProjectSummaryDto) => void;
  onAddNewProject?: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  onViewDetails,
  onStartPresentation,
  onAddNewProject,
}) => {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState<ProjectSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ProjectStatus | ''>('');
  const [category, setCategory] = useState('');
  const [onlyWithLiveUrl, setOnlyWithLiveUrl] = useState(false);
  const [sortBy, setSortBy] = useState('updated_desc');

  useEffect(() => {
    loadProjects();
  }, [search, status, category, onlyWithLiveUrl, sortBy]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProjects({
        search: search || undefined,
        status: status || undefined,
        category: category || undefined,
        onlyWithLiveUrl: onlyWithLiveUrl || undefined,
        sortBy,
      });
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Projeler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('');
    setCategory('');
    setOnlyWithLiveUrl(false);
    setSortBy('updated_desc');
  };

  // Distinct categories from returned projects or defaults
  const categories = Array.from(new Set(projects.map((p) => p.category))).filter(Boolean);

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Şirket Projeleri Envanteri
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Toplam {projects.length} proje listeleniyor
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isAdmin && onAddNewProject && (
            <button className="btn btn-primary btn-sm" onClick={onAddNewProject}>
              <Plus size={16} />
              <span>Yeni Proje Tanımla</span>
            </button>
          )}

          {/* View Mode Toggle */}
          <div style={{ display: 'flex', background: 'var(--surface-elevated)', borderRadius: 'var(--radius-md)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
            <button
              className={`btn btn-ghost btn-sm ${viewMode === 'grid' ? 'active' : ''}`}
              style={{ padding: '0.35rem 0.6rem', background: viewMode === 'grid' ? 'var(--primary-light)' : 'transparent', color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-muted)' }}
              onClick={() => setViewMode('grid')}
              title="Kart Görünümü"
            >
              <Grid size={16} />
            </button>
            <button
              className={`btn btn-ghost btn-sm ${viewMode === 'list' ? 'active' : ''}`}
              style={{ padding: '0.35rem 0.6rem', background: viewMode === 'list' ? 'var(--primary-light)' : 'transparent', color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-muted)' }}
              onClick={() => setViewMode('list')}
              title="Liste Görünümü"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ width: '100%', paddingLeft: '2.4rem' }}
              placeholder="Proje adı veya sorumlu ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Status Dropdown */}
          <div>
            <select
              className="form-select"
              style={{ width: '100%' }}
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="">Tüm Durumlar</option>
              <option value="Live">Canlı (Live)</option>
              <option value="Pilot">Pilot</option>
              <option value="Development">Geliştiriliyor</option>
              <option value="Maintenance">Bakımda</option>
              <option value="Archived">Arşivlendi</option>
            </select>
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              className="form-select"
              style={{ width: '100%' }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div>
            <select
              className="form-select"
              style={{ width: '100%' }}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="updated_desc">Son Güncellenen</option>
              <option value="name">İsim (A-Z)</option>
              <option value="name_desc">İsim (Z-A)</option>
              <option value="created_desc">En Yeni Eklenen</option>
            </select>
          </div>
        </div>

        {/* Filter Checkboxes & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.75rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={onlyWithLiveUrl}
              onChange={(e) => setOnlyWithLiveUrl(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--primary)' }}
            />
            <span>Yalnızca Canlı (Production) URL’si Bulunanlar</span>
          </label>

          <button
            className="btn btn-ghost btn-sm"
            onClick={handleResetFilters}
            style={{ fontSize: '0.82rem' }}
          >
            <RotateCcw size={13} />
            <span>Filtreleri Temizle</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <Layers size={36} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
          <div style={{ color: 'var(--text-secondary)' }}>Projeler filtreleniyor...</div>
        </div>
      ) : error ? (
        <div className="alert-box alert-warning">
          <AlertCircle size={20} />
          <div>{error}</div>
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Filter size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Aramanızla Eşleşen Proje Bulunamadı
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Lütfen arama terimlerini veya seçtiğiniz filtre kriterlerini değiştirerek tekrar deneyin.
          </p>
          <button className="btn btn-secondary btn-sm" onClick={handleResetFilters}>
            Tüm Filtreleri Temizle
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="projects-grid">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onViewDetails={onViewDetails}
              onStartPresentation={onStartPresentation}
            />
          ))}
        </div>
      ) : (
        /* List View */
        <div className="projects-list">
          {projects.map((p) => {
            const hasPrimaryUrl = p.primaryLink && p.primaryLink.isActive && p.primaryLink.url;
            return (
              <div
                key={p.id}
                className="glass-card"
                style={{
                  padding: '1.15rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1.5rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: '1 1 350px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                    <h3
                      style={{ fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}
                      onClick={() => onViewDetails(p.slug)}
                    >
                      {p.name}
                    </h3>
                    <span className={`badge ${p.status === 'Live' ? 'badge-live' : 'badge-development'}`} style={{ fontSize: '0.72rem' }}>
                      {p.statusText}
                    </span>
                    <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', fontSize: '0.72rem' }}>
                      {p.category}
                    </span>
                    {p.isVerified ? (
                      <span className="badge badge-verified" style={{ fontSize: '0.7rem' }}>
                        <CheckCircle2 size={11} />
                        <span>Doğrulandı</span>
                      </span>
                    ) : (
                      <span className="badge badge-pending" style={{ fontSize: '0.7rem' }}>
                        <Clock size={11} />
                        <span>Doğrulama Bekliyor</span>
                      </span>
                    )}
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {p.shortDescription}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {p.hasVpnLink && (
                    <span className="badge badge-vpn" style={{ fontSize: '0.72rem' }}>
                      <ShieldAlert size={12} />
                      <span>İç Ağ / VPN</span>
                    </span>
                  )}

                  <button className="btn btn-secondary btn-sm" onClick={() => onViewDetails(p.slug)}>
                    <Eye size={14} />
                    <span>Detaylar</span>
                  </button>

                  {hasPrimaryUrl && (
                    <a
                      href={p.primaryLink!.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary btn-sm"
                      title={p.primaryLink!.label}
                    >
                      <ExternalLink size={14} />
                      <span>Uygulamayı Aç</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
