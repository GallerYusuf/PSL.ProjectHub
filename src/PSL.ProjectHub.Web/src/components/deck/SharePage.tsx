import React, { useEffect, useState } from 'react';
import { Layers, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import { DeckDto } from '../../types';
import { DeckViewer } from './DeckViewer';

/**
 * Paylaşım linkiyle açılan, oturum gerektirmeyen salt okunur sunum sayfası.
 */
export const SharePage: React.FC<{ token: string }> = ({ token }) => {
  const [deck, setDeck] = useState<DeckDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.getPublicDeck(token)
      .then(d => {
        if (cancelled) return;
        setDeck(d);
        document.title = d.title || d.branding.teamName;
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Sunum açılamadı.'); });
    return () => { cancelled = true; };
  }, [token]);

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', background: 'var(--bg-app)' }}>
        <div className="card" role="alert" style={{ maxWidth: 440, padding: '2rem', textAlign: 'center' }}>
          <AlertCircle size={32} color="var(--status-maint)" style={{ margin: '0 auto 0.75rem' }} />
          <h1 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.4rem' }}>Sunum açılamadı</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!deck) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)' }}>
        <Layers size={32} color="var(--primary)" className="animate-spin" aria-label="Yükleniyor" />
      </div>
    );
  }

  const expires = deck.expiresAt
    ? `${new Date(deck.expiresAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihine kadar geçerli`
    : undefined;

  return <DeckViewer deck={deck} notice={expires ? `Salt okunur · ${expires}` : 'Salt okunur'} />;
};
