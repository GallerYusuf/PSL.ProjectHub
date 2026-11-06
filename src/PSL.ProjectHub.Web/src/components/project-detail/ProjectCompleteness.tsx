import React from 'react';
import { ListChecks } from 'lucide-react';
import { ProjectDetailDto } from '../../types';

export type CompletenessAction = 'edit' | 'links' | 'screenshot';

interface CheckItem {
  label: string;
  done: boolean;
  action: CompletenessAction;
}

/** Bir projenin sunuma hazır olması için doldurulması gereken alanları değerlendirir. */
export function evaluateCompleteness(project: ProjectDetailDto): CheckItem[] {
  const has = (v?: string | null) => !!v && v.trim().length > 0;
  return [
    { label: 'Ana bağlantı', done: (project.links ?? []).some(l => l.isActive !== false), action: 'links' },
    { label: 'Çözülen iş problemi', done: has(project.businessProblem), action: 'edit' },
    { label: 'Getirilen çözüm', done: has(project.businessSolution), action: 'edit' },
    { label: 'Şirkete değeri', done: has(project.businessValue), action: 'edit' },
    { label: 'Proje sorumlusu', done: has(project.ownerName), action: 'edit' },
    { label: 'Hedef kullanıcılar', done: has(project.targetUsers), action: 'edit' },
    { label: 'Teknolojiler', done: (project.technologies ?? []).length > 0, action: 'edit' },
    { label: 'Ekran görüntüsü', done: (project.screenshots ?? []).length > 0, action: 'screenshot' },
  ];
}

interface ProjectCompletenessProps {
  project: ProjectDetailDto;
  onAction: (action: CompletenessAction) => void;
}

/**
 * Yöneticiye eksik alanları gösteren ilerleme kartı. Proje tamamlandığında görünmez.
 */
export const ProjectCompleteness: React.FC<ProjectCompletenessProps> = ({ project, onAction }) => {
  const items = evaluateCompleteness(project);
  const missing = items.filter(i => !i.done);
  if (missing.length === 0) return null;

  const percent = Math.round(((items.length - missing.length) / items.length) * 100);

  return (
    <div
      className="card"
      style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', borderLeft: '3px solid var(--primary)' }}
      aria-label="Proje dosyası doluluk durumu"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ListChecks size={18} color="var(--primary)" />
          <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
            Sunuma hazırlık: %{percent}
          </strong>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            — {missing.length} eksik alan
          </span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => onAction(missing[0].action)}>
          Eksikleri Tamamla
        </button>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{ height: '6px', background: 'var(--bg-subtle)', borderRadius: '999px', margin: '0.75rem 0', overflow: 'hidden' }}
      >
        <div style={{ width: `${percent}%`, height: '100%', background: 'var(--primary)' }} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {missing.map(item => (
          <button
            key={item.label}
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.76rem', padding: '0.2rem 0.6rem' }}
            onClick={() => onAction(item.action)}
          >
            + {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};
