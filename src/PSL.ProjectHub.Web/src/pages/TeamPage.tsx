import React, { useEffect, useState } from 'react';
import { Users, Star, Pencil, Trash2, Save, X, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import { TeamMemberDto } from '../types';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../context/BrandingContext';

interface TeamPageProps {
  onViewDetails: (slug: string) => void;
}

/**
 * Ekip üyeleri ve her birinin çalıştığı projeler. "Kim ne yaptı" sorusunun tek ekranlık cevabı.
 * Üyeler proje sayfalarındaki "Ekip" bölümünden eklenir; burada düzenlenir.
 */
export const TeamPage: React.FC<TeamPageProps> = ({ onViewDetails }) => {
  const { isAdmin } = useAuth();
  const { branding } = useBranding();
  const [team, setTeam] = useState<TeamMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; fullName: string; title: string; email: string } | null>(null);

  const load = async () => {
    try {
      setError(null);
      setTeam(await api.getTeam());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ekip yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await api.updateTeamMember(editing.id, {
        fullName: editing.fullName,
        title: editing.title || undefined,
        email: editing.email || undefined,
        isActive: true,
      });
      setEditing(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kaydedilemedi.');
    }
  };

  const remove = async (member: TeamMemberDto) => {
    if (!confirm(`${member.fullName} ekipten ve tüm proje atamalarından çıkarılsın mı?`)) return;
    try {
      await api.deleteTeamMember(member.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silinemedi.');
    }
  };

  const activeCount = team.filter(t => t.isActive).length;
  const assignmentCount = team.reduce((n, t) => n + t.projects.length, 0);

  return (
    <div className="container" style={{ padding: '1.75rem 1.25rem 3rem' }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {branding.teamName} • Ekip
        </div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0.2rem 0' }}>Kim Hangi Projede?</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: 0 }}>
          {activeCount} kişi, {assignmentCount} proje görevi. Üyeler proje sayfalarındaki "Ekip" bölümünden eklenir.
        </p>
      </div>

      {error && (
        <div className="alert-box alert-danger" style={{ marginBottom: '1rem' }}>
          <AlertCircle size={16} /> <span>{error}</span>
        </div>
      )}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Yükleniyor...</p>
      ) : team.length === 0 ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <Users size={28} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem' }} />
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            Henüz ekip üyesi yok. Bir projenin sayfasını açıp "Ekip" bölümünden kişi ekleyin.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {team.map(member => (
            <article key={member.id} className="card" style={{ padding: '1.1rem', opacity: member.isActive ? 1 : 0.6 }}>
              {editing?.id === member.id ? (
                <div style={{ display: 'grid', gap: '0.45rem' }}>
                  <input className="form-input" aria-label="Ad soyad" value={editing.fullName} onChange={e => setEditing({ ...editing, fullName: e.target.value })} maxLength={150} />
                  <input className="form-input" aria-label="Unvan" placeholder="Unvan" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} maxLength={150} />
                  <input className="form-input" aria-label="E-posta" placeholder="E-posta" type="email" value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} maxLength={200} />
                  <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setEditing(null)}><X size={14} /> <span>Vazgeç</span></button>
                    <button className="btn btn-primary btn-sm" onClick={saveEdit} disabled={!editing.fullName.trim()}><Save size={14} /> <span>Kaydet</span></button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <span
                    aria-hidden
                    style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, flexShrink: 0 }}
                  >
                    {member.fullName.split(' ').map(p => p[0]).slice(0, 2).join('').toLocaleUpperCase('tr')}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0 }}>{member.fullName}</h2>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{member.title || 'Unvan girilmedi'}</div>
                  </div>
                  {isAdmin && (
                    <div style={{ display: 'flex' }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        aria-label={`${member.fullName} düzenle`}
                        onClick={() => setEditing({ id: member.id, fullName: member.fullName, title: member.title ?? '', email: member.email ?? '' })}
                      >
                        <Pencil size={14} />
                      </button>
                      <button className="btn btn-ghost btn-sm" aria-label={`${member.fullName} sil`} onClick={() => remove(member)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              <ul style={{ listStyle: 'none', padding: 0, margin: '0.85rem 0 0', display: 'grid', gap: '0.3rem' }} aria-label={`${member.fullName} projeleri`}>
                {member.projects.length === 0 && (
                  <li style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Atandığı aktif proje yok.</li>
                )}
                {member.projects.map(p => (
                  <li key={p.projectId}>
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ padding: 0, width: '100%', justifyContent: 'space-between', fontWeight: 400 }}
                      onClick={() => onViewDetails(p.projectSlug)}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {p.isLead && <Star size={12} color="var(--primary)" aria-label="Proje sorumlusu" />}
                        {p.projectName}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.role}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
