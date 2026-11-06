import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, X, ExternalLink, Maximize2, Star } from 'lucide-react';
import { DeckDto, DeckProjectDto, ProjectStatus } from '../../types';
import { AuthenticatedImage } from '../AuthenticatedImage';
import { formatCompact, formatNumber } from '../../utils/impact';
import { applyAccentColor } from '../../context/BrandingContext';
import './deck.css';

const STATUS_LABEL: Record<ProjectStatus, string> = {
  Live: 'Canlıda',
  Pilot: 'Pilot',
  Development: 'Geliştiriliyor',
  Maintenance: 'Bakımda',
  Archived: 'Arşivde',
};

const STATUS_COLOR: Record<ProjectStatus, string> = {
  Live: 'var(--status-live)',
  Pilot: 'var(--status-pilot)',
  Development: 'var(--status-dev)',
  Maintenance: 'var(--status-maint)',
  Archived: 'var(--text-muted)',
};

const formatMonth = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) : undefined;

interface Slide {
  key: string;
  label: string;
  content: React.ReactNode;
}

const StatusPill: React.FC<{ status: ProjectStatus }> = ({ status }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', fontWeight: 700, color: STATUS_COLOR[status] }}>
    <span aria-hidden style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLOR[status] }} />
    {STATUS_LABEL[status]}
  </span>
);

const ProjectSlide: React.FC<{ project: DeckProjectDto }> = ({ project: p }) => {
  const story = [
    { title: 'Sorun', text: p.businessProblem },
    { title: 'Çözüm', text: p.businessSolution },
    { title: 'Kazanım', text: p.businessValue },
  ].filter(s => s.text && s.text.trim());

  return (
    <div style={{ display: 'grid', gridTemplateColumns: p.imageUrls.length > 0 ? 'minmax(0, 1.15fr) minmax(0, 1fr)' : '1fr', gap: '2rem', alignItems: 'start' }}>
      <div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
          <span className="deck-kicker" style={{ margin: 0 }}>{p.category}</span>
          <StatusPill status={p.status} />
          {p.liveDate && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatMonth(p.liveDate)} itibarıyla canlıda</span>}
        </div>
        <h2 className="deck-title" style={{ fontSize: 'clamp(1.8rem, 3.4vw, 2.7rem)' }}>{p.name}</h2>
        <p className="deck-lead" style={{ marginBottom: '1.5rem' }}>{p.shortDescription}</p>

        {p.metrics.length > 0 && (
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            {p.metrics.slice(0, 3).map(m => (
              <div key={m.id} style={{ maxWidth: '220px' }}>
                <div className="deck-big-number" style={{ fontSize: 'clamp(1.9rem, 3.4vw, 2.8rem)' }}>
                  {formatNumber(m.value)} <span style={{ fontSize: '1rem', fontWeight: 700 }}>{m.unit}</span>
                </div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{m.label}</div>
              </div>
            ))}
          </div>
        )}

        {story.length > 0 && (
          <div className="deck-grid" style={{ gridTemplateColumns: `repeat(${Math.min(story.length, 3)}, minmax(0, 1fr))`, gap: '0.85rem', marginBottom: '1.25rem' }}>
            {story.map(s => (
              <div key={s.title} className="deck-panel">
                <h3>{s.title}</h3>
                <p style={{ fontSize: '0.92rem' }}>{s.text}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {p.team.length > 0 && (
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Ekip: </strong>
              {p.team.map((t, i) => (
                <span key={t.teamMemberId}>
                  {i > 0 && ', '}
                  {t.isLead && <Star size={12} color="var(--primary)" style={{ verticalAlign: '-1px', marginRight: 2 }} aria-label="Sorumlu" />}
                  {t.fullName}
                </span>
              ))}
            </div>
          )}
          {p.targetUsers && <div><strong style={{ color: 'var(--text-primary)' }}>Kullananlar: </strong>{p.targetUsers}</div>}
          {p.technologies.length > 0 && <div><strong style={{ color: 'var(--text-primary)' }}>Teknoloji: </strong>{p.technologies.join(', ')}</div>}
        </div>

        {p.liveUrl && (
          <a href={p.liveUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginTop: '1.25rem', display: 'inline-flex', gap: '0.4rem' }}>
            <ExternalLink size={16} /> Uygulamayı Aç
          </a>
        )}
      </div>

      {p.imageUrls.length > 0 && (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          <AuthenticatedImage src={p.imageUrls[0]} alt={`${p.name} ekran görüntüsü`} className="deck-image" />
          {p.imageUrls.length > 1 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {p.imageUrls.slice(1, 3).map((url, i) => (
                <AuthenticatedImage key={url} src={url} alt={`${p.name} ekran görüntüsü ${i + 2}`} className="deck-image" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/** Sunum verisinden slayt akışını üretir. Tek proje modunda yalnızca proje slaytları gösterilir. */
export function buildSlides(deck: DeckDto, projectsOnly = false): Slide[] {
  const b = deck.branding;
  const slides: Slide[] = [];
  const projectSlides = deck.projects.map(p => ({ key: `p-${p.id}`, label: p.name, content: <ProjectSlide project={p} /> }));
  if (projectsOnly) return projectSlides;

  const year = deck.timeline.year;
  slides.push({
    key: 'cover',
    label: 'Kapak',
    content: (
      <div>
        {b.logoUrl && <img src={b.logoUrl} alt={b.organizationName} style={{ height: 64, maxWidth: 260, objectFit: 'contain', marginBottom: '2rem' }} />}
        <div className="deck-kicker">{b.organizationName}</div>
        <h1 className="deck-title" style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.4rem)' }}>{deck.title || `${b.teamName}`}</h1>
        <p className="deck-lead">{b.tagline || `${deck.projects.length} proje ile şirketin dijital dönüşümü`}</p>
        {b.directorName && (
          <p style={{ marginTop: '2.5rem', fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{b.directorName}</strong>{b.directorTitle ? ` · ${b.directorTitle}` : ''}
          </p>
        )}
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
          {new Date(deck.generatedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>
    ),
  });

  const imp = deck.impact;
  const totals = [
    { value: imp.hoursSavedPerMonth, unit: 'saat / ay', label: 'manuel iş ortadan kalktı' },
    { value: imp.usersReached, unit: 'kullanıcı', label: 'sistemlerimizi her gün kullanıyor' },
    { value: imp.costSavingPerYear, unit: 'TL / yıl', label: 'tasarruf sağlandı' },
  ].filter(t => t.value > 0);
  if (imp.projectsWithMetrics > 0) {
    slides.push({
      key: 'impact',
      label: 'Etki',
      content: (
        <div>
          <div className="deck-kicker">Şirkete kazandırdıklarımız</div>
          <h2 className="deck-title">Ekibin etkisi rakamlarla</h2>
          {totals.length > 0 && (
            <div className="deck-grid" style={{ margin: '2rem 0' }}>
              {totals.map(t => (
                <div key={t.unit}>
                  <div className="deck-big-number">{formatCompact(t.value)}</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--primary)' }}>{t.unit}</div>
                  <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>{t.label}</div>
                </div>
              ))}
            </div>
          )}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.55rem' }}>
            {imp.highlights.map(h => (
              <li key={h.projectId} style={{ fontSize: '1.05rem' }}>
                <strong>{h.projectName}</strong>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}> — {formatNumber(h.value)} {h.unit}</span>
                <span style={{ color: 'var(--text-secondary)' }}> {h.label}</span>
              </li>
            ))}
          </ul>
        </div>
      ),
    });
  }

  const sc = deck.statusCounts;
  slides.push({
    key: 'portfolio',
    label: 'Portföy',
    content: (
      <div>
        <div className="deck-kicker">Portföy</div>
        <h2 className="deck-title">{deck.projects.length} sistem, tek ekip</h2>
        <div className="deck-grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', margin: '1.5rem 0 2rem' }}>
          {[
            { n: sc.live, label: 'Canlıda', color: 'var(--status-live)' },
            { n: sc.pilot, label: 'Pilot', color: 'var(--status-pilot)' },
            { n: sc.development, label: 'Geliştiriliyor', color: 'var(--status-dev)' },
            { n: sc.maintenance, label: 'Bakımda', color: 'var(--status-maint)' },
          ].map(s => (
            <div key={s.label}>
              <div className="deck-big-number" style={{ color: s.color }}>{s.n}</div>
              <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div className="deck-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.75rem' }}>
          {deck.projects.map(p => (
            <div key={p.id} className="deck-panel" style={{ padding: '0.8rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'baseline' }}>
                <strong style={{ fontSize: '1rem' }}>{p.name}</strong>
                <StatusPill status={p.status} />
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{p.shortDescription}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  });

  slides.push(...projectSlides);

  const t = deck.timeline;
  if (t.projectsStarted + t.projectsWentLive + t.releases > 0) {
    slides.push({
      key: 'year',
      label: `${year} özeti`,
      content: (
        <div>
          <div className="deck-kicker">{year} yılında</div>
          <h2 className="deck-title">Bu yıl neler yaptık?</h2>
          <div className="deck-grid" style={{ marginTop: '2rem' }}>
            {[
              { n: t.projectsWentLive, label: 'proje canlıya alındı' },
              { n: t.releases, label: 'sürüm yayınlandı' },
              { n: t.projectsStarted, label: 'yeni proje başladı' },
            ].map(s => (
              <div key={s.label}>
                <div className="deck-big-number">{s.n}</div>
                <div style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  const upcoming = deck.projects.filter(p => p.status === 'Development' || p.status === 'Pilot');
  slides.push({
    key: 'closing',
    label: 'Kapanış',
    content: (
      <div>
        {upcoming.length > 0 ? (
          <>
            <div className="deck-kicker">Yolda olanlar</div>
            <h2 className="deck-title">Sırada ne var?</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: '1.5rem 0 2.5rem', display: 'grid', gap: '0.75rem' }}>
              {upcoming.map(p => (
                <li key={p.id} style={{ fontSize: '1.1rem' }}>
                  <StatusPill status={p.status} /> <strong style={{ marginLeft: '0.5rem' }}>{p.name}</strong>
                  <span style={{ color: 'var(--text-secondary)' }}> — {p.shortDescription}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <h2 className="deck-title">Teşekkürler</h2>
        )}
        <p className="deck-lead">
          {b.teamName}{b.organizationName ? ` · ${b.organizationName}` : ''}
          {b.directorName ? ` · ${b.directorName}${b.directorTitle ? `, ${b.directorTitle}` : ''}` : ''}
        </p>
      </div>
    ),
  });

  return slides;
}

interface DeckViewerProps {
  deck: DeckDto;
  /** Verilirse kapat butonu ve Esc ile kapanır (uygulama içi sunum). */
  onClose?: () => void;
  /** Yalnızca proje slaytlarını göster (tek proje sunumu). */
  projectsOnly?: boolean;
  /** Üst çubukta gösterilecek ek not (ör. paylaşım linkinin bitiş tarihi). */
  notice?: string;
}

/**
 * Tam ekran slayt görüntüleyici. Ok tuşları / boşluk ile ilerler, Esc ile kapanır.
 */
export const DeckViewer: React.FC<DeckViewerProps> = ({ deck, onClose, projectsOnly = false, notice }) => {
  const slides = useMemo(() => buildSlides(deck, projectsOnly), [deck, projectsOnly]);
  const [index, setIndex] = useState(0);

  const next = useCallback(() => setIndex(i => Math.min(i + 1, slides.length - 1)), [slides.length]);
  const prev = useCallback(() => setIndex(i => Math.max(i - 1, 0)), []);

  // Paylaşım sayfasında marka rengi sunumdan uygulanır
  useEffect(() => {
    if (deck.branding.accentColor) applyAccentColor(deck.branding.accentColor);
  }, [deck.branding.accentColor]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); next(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
      else if (e.key === 'Home') setIndex(0);
      else if (e.key === 'End') setIndex(slides.length - 1);
      else if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose, slides.length]);

  if (slides.length === 0) {
    return (
      <div className="deck" role="dialog" aria-modal="true" aria-label="Sunum">
        <div className="deck-stage"><p className="deck-lead">Sunumda gösterilecek proje yok.</p></div>
        {onClose && <div className="deck-controls"><button className="btn btn-secondary" onClick={onClose}>Kapat</button></div>}
      </div>
    );
  }

  const slide = slides[Math.min(index, slides.length - 1)];
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => undefined);
  };

  return (
    <div className="deck" role="dialog" aria-modal="true" aria-label={`Sunum: ${deck.title || deck.branding.teamName}`}>
      <header className="deck-topbar">
        <div className="deck-topbar-brand">
          {deck.branding.logoUrl && <img src={deck.branding.logoUrl} alt="" style={{ height: 22, maxWidth: 90, objectFit: 'contain' }} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deck.branding.teamName}</span>
          {notice && <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>· {notice}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={toggleFullscreen} aria-label="Tam ekran">
            <Maximize2 size={16} />
          </button>
          {onClose && (
            <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Sunumu kapat">
              <X size={18} />
            </button>
          )}
        </div>
      </header>

      <main className="deck-stage" onClick={(e) => { if (e.target === e.currentTarget) next(); }}>
        <section className="deck-slide" key={slide.key} aria-roledescription="slayt" aria-label={`${index + 1} / ${slides.length}: ${slide.label}`}>
          {slide.content}
        </section>
      </main>

      <footer className="deck-controls">
        <button className="btn btn-secondary btn-sm" onClick={prev} disabled={index === 0} aria-label="Önceki slayt">
          <ChevronLeft size={16} /> <span>Önceki</span>
        </button>
        <div className="deck-progress" aria-hidden><div style={{ width: `${((index + 1) / slides.length) * 100}%` }} /></div>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }} aria-live="polite">
          {index + 1} / {slides.length} · {slide.label}
        </span>
        <button className="btn btn-primary btn-sm" onClick={next} disabled={index === slides.length - 1} aria-label="Sonraki slayt">
          <span>Sonraki</span> <ChevronRight size={16} />
        </button>
      </footer>
    </div>
  );
};
