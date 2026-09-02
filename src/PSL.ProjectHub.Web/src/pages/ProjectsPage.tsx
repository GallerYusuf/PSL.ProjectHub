import React, { useEffect, useState, useMemo } from 'react';
import {
  Search,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  RotateCcw,
  Plus,
  Layers,
  AlertCircle,
  ExternalLink,
  Eye,
  CheckCircle2,
  Clock,
  ShieldAlert,
  PlaySquare,
  FileText
} from 'lucide-react';
import { api } from '../api/client';
import { ProjectSummaryDto, ProjectStatus } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { useAuth } from '../context/AuthContext';

interface ProjectsPageProps {
  onViewDetails: (slug: string) => void;
  onStartPresentation: (project: ProjectSummaryDto) => void;
  onAddNewProject?: () => void;
  initialSearch?: string;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({
  onViewDetails,
  onStartPresentation,
  onAddNewProject,
  initialSearch = ''
}) => {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState<ProjectSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL Query parametreleri ile senkronizasyon
  const getInitialParam = (param: string, fallback: string = '') => {
    const params = new URLSearchParams(window.location.search);
    return params.get(param) || fallback;
  };

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [search, setSearch] = useState(initialSearch || getInitialParam('q'));
  const [status, setStatus] = useState<ProjectStatus | ''>(getInitialParam('status') as ProjectStatus | '');
  const [category, setCategory] = useState(getInitialParam('category'));
  const [onlyWithLiveUrl, setOnlyWithLiveUrl] = useState(getInitialParam('liveOnly') === 'true');
  const [sortBy, setSortBy] = useState(getInitialParam('sort', 'updated_desc'));

  // Filtreler değiştikçe URL parametrelerini güncelle
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (status) params.set('status', status);
    if (category) params.set('category', category);
    if (onlyWithLiveUrl) params.set('liveOnly', 'true');
    if (sortBy !== 'updated_desc') params.set('sort', sortBy);

    const queryString = params.toString();
    const newUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ''}${window.location.hash}`;
    window.history.replaceState(null, '', newUrl);

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

  const categories = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.category))).filter(Boolean);
  }, [projects]);

  return (
    <div className="container" style={{ padding: '1.75rem 1.25rem 3rem' }}>
      {/* Üst Başlık & Eylem Çubuğu */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
            PSL PROJECT HUB • PORTFÖY İNDEKSİ
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>
            Proje ve Uygulama Envanteri
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', marginTop: '0.2rem' }}>
            Kriterlere uyan <strong>{projects.length}</strong> sistem listeleniyor
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {/* Görünüm Değiştirici: Tablo vs Kart */}
          <div style={{ display: 'flex', background: '#ffffff', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border-card)' }}>
            <button
              className="btn btn-ghost btn-sm"
              style={{
                background: viewMode === 'table' ? 'var(--primary-subtle)' : 'transparent',
                color: viewMode === 'table' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: viewMode === 'table' ? 700 : 500,
                padding: '0.3rem 0.6rem'
              }}
              onClick={() => setViewMode('table')}
              title="Portföy Envanter Tablosu Görünümü"
            >
              <TableIcon size={14} />
              <span>Tablo</span>
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{
                background: viewMode === 'grid' ? 'var(--primary-subtle)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: viewMode === 'grid' ? 700 : 500,
                padding: '0.3rem 0.6rem'
              }}
              onClick={() => setViewMode('grid')}
              title="Kompakt Kart Görünümü"
            >
              <LayoutGrid size={14} />
              <span>Kartlar</span>
            </button>
          </div>

          {isAdmin && onAddNewProject && (
            <button className="btn btn-primary btn-sm" onClick={onAddNewProject}>
              <Plus size={14} />
              <span>Yeni Proje Tanımla</span>
            </button>
          )}
        </div>
      </div>

      {/* Gelişmiş Filtreleme Paneli */}
      <div className="card" style={{ padding: '0.9rem 1.15rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', alignItems: 'center' }}>
          
          {/* Arama Alanı */}
          <div className="search-input-wrap">
            <Search size={14} className="search-input-icon" />
            <input
              type="text"
              className="form-input"
              placeholder="Proje veya sorumlu ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Durum Filtresi */}
          <div>
            <select
              className="form-select"
              style={{ width: '100%' }}
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
            >
              <option value="">Tüm Durumlar</option>
              <option value="Live">Canlı (Live)</option>
              <option value="Pilot">Pilot Aşamada</option>
              <option value="Development">Geliştiriliyor</option>
              <option value="Maintenance">Bakımda</option>
              <option value="Archived">Arşivlendi</option>
            </select>
          </div>

          {/* Kategori Filtresi */}
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

          {/* Sıralama */}
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

        {/* Canlı URL Filtresi ve Temizleme */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid var(--border-subtle)', flexWrap: 'wrap', gap: '0.6rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={onlyWithLiveUrl}
              onChange={(e) => setOnlyWithLiveUrl(e.target.checked)}
              style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }}
            />
            <span>Yalnızca Canlı (Production) URL’si Bulunanlar</span>
          </label>

          <button
            className="btn btn-ghost btn-sm"
            onClick={handleResetFilters}
            style={{ fontSize: '0.78rem' }}
          >
            <RotateCcw size={12} />
            <span>Filtreleri Sıfırla</span>
          </button>
        </div>
      </div>

      {/* Yükleme ve Hata Durumları */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 0' }}>
          <Layers size={28} className="animate-spin" color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>Envanter kayıtları listeleniyor...</div>
        </div>
      ) : error ? (
        <div className="alert-box alert-danger">
          <AlertCircle size={16} />
          <div>{error}</div>
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <Filter size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
          <div className="empty-state-title">Aramanızla Eşleşen Proje Bulunamadı</div>
          <p style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>
            Arama terimini veya seçtiğiniz filtre kriterlerini değiştirerek tekrar deneyebilirsiniz.
          </p>
          <button className="btn btn-secondary btn-sm" onClick={handleResetFilters}>
            Filtreleri Temizle
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Kurumsal Portföy İndeksi / Envanter Tablosu */
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Proje Adı</th>
                <th>Kategori</th>
                <th>Durum</th>
                <th>Birincil URL</th>
                <th>Ağ & VPN</th>
                <th>Doğrulama</th>
                <th>Sorumlu</th>
                <th style={{ textAlign: 'right' }}>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const primary = p.primaryLink;
                return (
                  <tr key={p.id}>
                    <td>
                      <div
                        style={{ fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer' }}
                        onClick={() => onViewDetails(p.slug)}
                        title="Proje Dosyasını Aç"
                      >
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {p.slug} {p.currentVersion ? `• ${p.currentVersion}` : ''}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {p.category}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        p.status === 'Live' ? 'badge-live' :
                        p.status === 'Pilot' ? 'badge-pilot' :
                        p.status === 'Development' ? 'badge-development' :
                        p.status === 'Maintenance' ? 'badge-maintenance' : 'badge-archived'
                      }`}>
                        {p.statusText}
                      </span>
                    </td>
                    <td>
                      {primary ? (
                        <a
                          href={primary.url}
                          target="_blank"
                          rel="noreferrer"
                          className="code-url"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <span>{primary.label || primary.url}</span>
                          <ExternalLink size={11} />
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Bağlantı Yok</span>
                      )}
                    </td>
                    <td>
                      {p.hasVpnLink ? (
                        <span className="badge badge-vpn">VPN Gerekli</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Genel Ağ</span>
                      )}
                    </td>
                    <td>
                      {p.isVerified ? (
                        <span className="badge badge-verified">
                          <CheckCircle2 size={10} />
                          <span>Doğrulandı</span>
                        </span>
                      ) : (
                        <span className="badge badge-pending">
                          <Clock size={10} />
                          <span>İncelenmedi</span>
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {p.ownerName || 'Belirtilmedi'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {p.department || ''}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => onStartPresentation(p)}
                          title="Sunum Modunda Aç"
                        >
                          <PlaySquare size={13} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => onViewDetails(p.slug)}
                          title="Proje Dosyasını Aç"
                        >
                          <FileText size={13} />
                          <span>Dosya</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kompakt Kartlar Görünümü */
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
      )}
    </div>
  );
};
