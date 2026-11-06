import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Plus, Trash2, Star, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import { ImpactKind, ProjectMemberDto, ProjectMetricDto, TeamMemberDto } from '../../types';
import { IMPACT_KINDS, formatNumber, kindInfo, parseTrNumber } from '../../utils/impact';

const ROLE_SUGGESTIONS = ['Geliştirici', 'Teknik Lider', 'Analist', 'Tasarımcı', 'Test', 'Proje Yöneticisi', 'İş Birimi Sorumlusu'];

interface ProjectImpactTeamProps {
  projectId: string;
  metrics: ProjectMetricDto[];
  members: ProjectMemberDto[];
  canEdit: boolean;
  /** Bir değişiklikten sonra proje verisini (metrikler, ekip, sorumlu) yeniden yükler. */
  onChanged: () => Promise<void> | void;
}

/**
 * Projenin iş etkisi rakamları ve çalışan ekip. Direktör sunumunda gösterilen ana bölüm.
 */
export const ProjectImpactTeam: React.FC<ProjectImpactTeamProps> = ({ projectId, metrics, members, canEdit, onChanged }) => {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [metricForm, setMetricForm] = useState({ kind: 'TimeSaved' as ImpactKind, label: '', value: '', unit: '' });
  const [memberForm, setMemberForm] = useState({ name: '', role: 'Geliştirici', isLead: false });
  const [team, setTeam] = useState<TeamMemberDto[]>([]);

  useEffect(() => {
    if (canEdit) api.getTeam().then(setTeam).catch(() => setTeam([]));
  }, [canEdit, members]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      await onChanged();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem başarısız.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const fixedUnit = kindInfo(metricForm.kind).unit;

  const addMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseTrNumber(metricForm.value);
    if (!metricForm.label.trim() || Number.isNaN(value) || value < 0) {
      setError('Metrik için açıklama ve 0 veya daha büyük bir sayı girin (ör. 120 veya 2,5).');
      return;
    }
    const ok = await run(() => api.createMetric(projectId, {
      kind: metricForm.kind,
      label: metricForm.label.trim(),
      value,
      unit: fixedUnit ? undefined : metricForm.unit.trim(),
      displayOrder: metrics.length,
    }));
    if (ok) setMetricForm(f => ({ ...f, label: '', value: '', unit: '' }));
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = memberForm.name.trim();
    if (!name) {
      setError('Ekip üyesinin adını yazın veya listeden seçin.');
      return;
    }
    const existing = team.find(t => t.fullName.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr'));
    const ok = await run(() => api.assignProjectMember(projectId, {
      teamMemberId: existing?.id,
      newMemberName: existing ? undefined : name,
      role: memberForm.role.trim() || 'Geliştirici',
      isLead: memberForm.isLead,
    }));
    if (ok) setMemberForm({ name: '', role: 'Geliştirici', isLead: false });
  };

  return (
    <div id="project-impact" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
      {/* İş Etkisi */}
      <section className="card" style={{ padding: '1.25rem' }} aria-labelledby="impact-title">
        <h3 id="impact-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
          <TrendingUp size={18} color="var(--primary)" /> İş Etkisi
        </h3>

        {metrics.length === 0 ? (
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
            Henüz etki rakamı girilmedi. Örn: "Ayda 120 saat manuel iş kaldırıldı", "45 bayi kullanıyor".
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem', display: 'grid', gap: '0.6rem' }}>
            {metrics.map(m => (
              <li key={m.id} style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.55rem' }}>
                <span style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                  {formatNumber(m.value)}
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{m.unit}</span>
                <span style={{ flex: 1, fontSize: '0.86rem', color: 'var(--text-primary)' }}>{m.label}</span>
                {canEdit && (
                  <button className="btn btn-ghost btn-sm" onClick={() => run(() => api.deleteMetric(m.id))} disabled={busy} aria-label={`${m.label} metriğini sil`}>
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {canEdit && (
          <form onSubmit={addMetric} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }} aria-label="Etki rakamı ekle">
            <select
              className="form-select"
              value={metricForm.kind}
              onChange={e => setMetricForm(f => ({ ...f, kind: e.target.value as ImpactKind }))}
              aria-label="Etki türü"
              disabled={busy}
            >
              {IMPACT_KINDS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <input
                className="form-input"
                style={{ width: '100%', minWidth: 0 }}
                inputMode="decimal"
                placeholder="Değer"
                value={metricForm.value}
                onChange={e => setMetricForm(f => ({ ...f, value: e.target.value }))}
                aria-label="Değer"
                disabled={busy}
              />
              {fixedUnit ? (
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{fixedUnit}</span>
              ) : (
                <input
                  className="form-input"
                  style={{ width: '100%', minWidth: 0 }}
                  placeholder="Birim (fatura/gün)"
                  value={metricForm.unit}
                  onChange={e => setMetricForm(f => ({ ...f, unit: e.target.value }))}
                  aria-label="Birim"
                  maxLength={50}
                  required
                  disabled={busy}
                />
              )}
            </div>
            <input
              className="form-input"
              style={{ gridColumn: '1 / -1' }}
              placeholder={`Açıklama (ör. ${kindInfo(metricForm.kind).example})`}
              value={metricForm.label}
              onChange={e => setMetricForm(f => ({ ...f, label: e.target.value }))}
              aria-label="Metrik açıklaması"
              maxLength={150}
              disabled={busy}
            />
            <button type="submit" className="btn btn-primary btn-sm" style={{ gridColumn: '1 / -1', justifyContent: 'center' }} disabled={busy}>
              <Plus size={14} /> <span>Etki Rakamı Ekle</span>
            </button>
          </form>
        )}
      </section>

      {/* Ekip */}
      <section className="card" style={{ padding: '1.25rem' }} aria-labelledby="team-title">
        <h3 id="team-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
          <Users size={18} color="var(--primary)" /> Ekip
        </h3>

        {members.length === 0 ? (
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: '0 0 1rem' }}>
            Bu projede çalışan kimse atanmadı.
          </p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem', display: 'grid', gap: '0.5rem' }}>
            {members.map(m => (
              <li key={m.teamMemberId} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span
                  aria-hidden
                  style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}
                >
                  {m.fullName.split(' ').map(p => p[0]).slice(0, 2).join('').toLocaleUpperCase('tr')}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {m.fullName}
                    {m.isLead && (
                      <span className="badge badge-verified" style={{ fontSize: '0.68rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Star size={10} /> Sorumlu
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.role}{m.title ? ` · ${m.title}` : ''}</div>
                </div>
                {canEdit && (
                  <button className="btn btn-ghost btn-sm" onClick={() => run(() => api.removeProjectMember(projectId, m.teamMemberId))} disabled={busy} aria-label={`${m.fullName} kişisini projeden çıkar`}>
                    <Trash2 size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {canEdit && (
          <form onSubmit={addMember} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }} aria-label="Ekip üyesi ekle">
            <input
              className="form-input"
              list="team-member-options"
              placeholder="Ad Soyad (listeden seçin ya da yazın)"
              value={memberForm.name}
              onChange={e => setMemberForm(f => ({ ...f, name: e.target.value }))}
              aria-label="Ekip üyesi"
              maxLength={150}
              disabled={busy}
            />
            <datalist id="team-member-options">
              {team.filter(t => t.isActive).map(t => <option key={t.id} value={t.fullName}>{t.title}</option>)}
            </datalist>
            <input
              className="form-input"
              list="team-role-options"
              placeholder="Rol"
              value={memberForm.role}
              onChange={e => setMemberForm(f => ({ ...f, role: e.target.value }))}
              aria-label="Rol"
              maxLength={100}
              disabled={busy}
            />
            <datalist id="team-role-options">
              {ROLE_SUGGESTIONS.map(r => <option key={r} value={r} />)}
            </datalist>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', gridColumn: '1 / -1' }}>
              <input type="checkbox" checked={memberForm.isLead} onChange={e => setMemberForm(f => ({ ...f, isLead: e.target.checked }))} disabled={busy} />
              Proje sorumlusu
            </label>
            <button type="submit" className="btn btn-primary btn-sm" style={{ gridColumn: '1 / -1', justifyContent: 'center' }} disabled={busy}>
              <Plus size={14} /> <span>Ekibe Ekle</span>
            </button>
          </form>
        )}

        {error && (
          <div className="alert-box alert-danger" style={{ marginTop: '0.75rem' }}>
            <AlertCircle size={16} /> <span>{error}</span>
          </div>
        )}
      </section>
    </div>
  );
};
