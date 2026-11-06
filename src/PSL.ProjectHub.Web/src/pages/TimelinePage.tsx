import React, { useEffect, useMemo, useState } from 'react';
import { Rocket, Flag, Tag, CalendarRange, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { TimelineDto, TimelineEventDto, TimelineEventKind } from '../types';
import { useBranding } from '../context/BrandingContext';

interface TimelinePageProps {
  onViewDetails: (slug: string) => void;
}

const KIND_STYLE: Record<TimelineEventKind, { icon: React.ReactNode; color: string; label: string }> = {
  WentLive: { icon: <Rocket size={14} />, color: 'var(--status-live)', label: 'Canlıya çıktı' },
  Release: { icon: <Tag size={14} />, color: 'var(--primary)', label: 'Sürüm' },
  Started: { icon: <Flag size={14} />, color: 'var(--status-dev)', label: 'Başladı' },
};

const monthKey = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
};

/**
 * Ekibin yaptıkları kronolojik sırayla: hangi proje ne zaman başladı, canlıya çıktı, hangi sürüm yayınlandı.
 * Veriler proje tarihlerinden ve sürüm kayıtlarından türetilir.
 */
export const TimelinePage: React.FC<TimelinePageProps> = ({ onViewDetails }) => {
  const { branding } = useBranding();
  const [year, setYear] = useState<number | undefined>(undefined);
  const [data, setData] = useState<TimelineDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialised, setInitialised] = useState(false);

  useEffect(() => {
    api.getTimeline(year)
      .then(result => {
        // İlk açılışta en güncel yıl seçilir; hiç olay yoksa tüm zamanlar gösterilir
        if (!initialised) {
          setInitialised(true);
          const latest = result.availableYears[0];
          if (latest !== undefined && year === undefined) {
            setYear(latest);
            return;
          }
        }
        setData(result);
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Zaman çizelgesi yüklenemedi.'));
  }, [year]); // eslint-disable-line react-hooks/exhaustive-deps

  const grouped = useMemo(() => {
    const groups: { month: string; events: TimelineEventDto[] }[] = [];
    for (const e of data?.events ?? []) {
      const m = monthKey(e.date);
      const last = groups[groups.length - 1];
      if (last && last.month === m) last.events.push(e);
      else groups.push({ month: m, events: [e] });
    }
    return groups;
  }, [data]);

  const periodLabel = year ? `${year} yılında` : 'Bugüne kadar';

  return (
    <div className="container" style={{ padding: '1.75rem 1.25rem 3rem', maxWidth: '960px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {branding.teamName} • Zaman Çizelgesi
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.2rem 0 0' }}>Ne Zaman Ne Yaptık?</h1>
        </div>
        {data && data.availableYears.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <CalendarRange size={16} color="var(--text-muted)" />
            <select
              className="form-select"
              value={year ?? ''}
              onChange={e => setYear(e.target.value ? Number(e.target.value) : undefined)}
              aria-label="Dönem"
            >
              {data.availableYears.map(y => <option key={y} value={y}>{y}</option>)}
              <option value="">Tüm zamanlar</option>
            </select>
          </label>
        )}
      </div>

      {error && (
        <div className="alert-box alert-danger"><AlertCircle size={16} /> <span>{error}</span></div>
      )}

      {data && (
        <>
          <section className="card" aria-label="Dönem özeti" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
            {[
              { n: data.summary.projectsWentLive, label: 'proje canlıya alındı', color: 'var(--status-live)' },
              { n: data.summary.releases, label: 'sürüm yayınlandı', color: 'var(--primary)' },
              { n: data.summary.projectsStarted, label: 'yeni proje başladı', color: 'var(--status-dev)' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{periodLabel}</div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.n}</div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>{s.label}</div>
              </div>
            ))}
          </section>

          {grouped.length === 0 ? (
            <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              Bu dönemde kayıtlı olay yok. Proje düzenleme formundaki başlangıç / canlıya çıkış tarihleri ve
              proje sayfasındaki Teknik sekmesinden eklenen sürümler burada listelenir.
            </div>
          ) : (
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {grouped.map(g => (
                <li key={g.month} style={{ marginBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', margin: '0 0 0.6rem' }}>
                    {g.month}
                  </h2>
                  <ol style={{ listStyle: 'none', margin: 0, padding: '0 0 0 1rem', borderLeft: '2px solid var(--border-subtle)', display: 'grid', gap: '0.6rem' }}>
                    {g.events.map((e, i) => {
                      const style = KIND_STYLE[e.kind];
                      return (
                        <li key={`${e.projectId}-${e.kind}-${e.date}-${i}`} style={{ position: 'relative' }}>
                          <span
                            aria-hidden
                            style={{ position: 'absolute', left: 'calc(-1rem - 9px)', top: '0.55rem', width: 16, height: 16, borderRadius: '50%', background: '#ffffff', border: `2px solid ${style.color}` }}
                          />
                          <button
                            className="card"
                            onClick={() => onViewDetails(e.projectSlug)}
                            style={{ width: '100%', textAlign: 'left', padding: '0.7rem 0.9rem', cursor: 'pointer', display: 'flex', gap: '0.75rem', alignItems: 'baseline', flexWrap: 'wrap' }}
                          >
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 700, color: style.color, minWidth: '110px' }}>
                              {style.icon} {style.label}
                            </span>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{e.projectName}</span>
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', flex: 1, minWidth: '160px' }}>
                              {e.version && <code style={{ color: 'var(--primary)', marginRight: '0.35rem' }}>{e.version}</code>}
                              {e.kind === 'Release' ? e.title : ''}
                              {e.description && <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{e.description}</span>}
                            </span>
                            <time dateTime={e.date} style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {new Date(e.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                            </time>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
};
