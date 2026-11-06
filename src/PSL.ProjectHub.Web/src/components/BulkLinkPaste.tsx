import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { api } from '../api/client';
import { EnvironmentType, LinkType } from '../types';
import { ENVIRONMENT_LABELS, LINK_TYPE_LABELS, LinkDraft, parseLinkText } from '../utils/linkGuess';

export interface SaveLinksResult {
  created: number;
  failed: { url: string; reason: string }[];
}

/**
 * Taslakları sırayla kaydeder. Projede henüz birincil bağlantı yoksa ilk canlı uygulama
 * adresi birincil yapılır. Tekrarlanan adres gibi hatalar toplanıp geri döndürülür.
 */
export async function saveLinkDrafts(
  projectId: string,
  drafts: LinkDraft[],
  hasPrimary: boolean
): Promise<SaveLinksResult> {
  const result: SaveLinksResult = { created: 0, failed: [] };
  let primaryAssigned = hasPrimary;

  for (const [index, draft] of drafts.entries()) {
    const makePrimary = !primaryAssigned && draft.linkType === 'Production';
    try {
      await api.createLink(projectId, {
        ...draft,
        isPrimary: makePrimary,
        openInNewTab: true,
        displayOrder: index,
      });
      result.created++;
      if (makePrimary) primaryAssigned = true;
    } catch (err) {
      result.failed.push({ url: draft.url, reason: err instanceof Error ? err.message : 'Kaydedilemedi' });
    }
  }
  return result;
}

interface BulkLinkModalProps {
  projectId: string;
  projectName: string;
  hasPrimary: boolean;
  onClose: () => void;
  onSaved: (result: SaveLinksResult) => void;
}

/** Var olan bir projeye toplu bağlantı ekleme penceresi. */
export const BulkLinkModal: React.FC<BulkLinkModalProps> = ({ projectId, projectName, hasPrimary, onClose, onSaved }) => {
  const [drafts, setDrafts] = useState<LinkDraft[]>([]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      onSaved(await saveLinkDrafts(projectId, drafts, hasPrimary));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">{projectName} — Bağlantıları Yapıştır</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Kapat">
            <X size={18} />
          </button>
        </div>
        <BulkLinkPaste onChange={setDrafts} disabled={saving} autoFocus />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Vazgeç</button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || drafts.length === 0}>
            {saving ? 'Kaydediliyor...' : `${drafts.length} bağlantıyı kaydet`}
          </button>
        </div>
      </div>
    </div>
  );
};

interface BulkLinkPasteProps {
  /** Kararlı bir fonksiyon verilmeli (ör. useState setter). */
  onChange: (drafts: LinkDraft[]) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Adres yapıştırma alanı + tür/ortam tahmini yapılmış, düzenlenebilir önizleme tablosu.
 */
export const BulkLinkPaste: React.FC<BulkLinkPasteProps> = ({ onChange, disabled, autoFocus }) => {
  const [text, setText] = useState('');
  const [drafts, setDrafts] = useState<LinkDraft[]>([]);
  const [invalidLines, setInvalidLines] = useState<string[]>([]);

  useEffect(() => {
    const parsed = parseLinkText(text);
    setDrafts(parsed.drafts);
    setInvalidLines(parsed.invalidLines);
  }, [text]);

  useEffect(() => {
    onChange(drafts);
  }, [drafts, onChange]);

  const update = (index: number, patch: Partial<LinkDraft>) =>
    setDrafts(list => list.map((d, i) => (i === index ? { ...d, ...patch } : d)));

  const remove = (index: number) => setDrafts(list => list.filter((_, i) => i !== index));

  return (
    <div>
      <textarea
        className="form-textarea"
        style={{ minHeight: '96px', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.82rem' }}
        value={text}
        onChange={e => setText(e.target.value)}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label="Bağlantı adresleri"
        placeholder={'Her satıra bir adres yapıştırın. İsterseniz başına etiket yazın:\nhttps://panel.firma.com\nTest Ortamı | https://test.firma.com\nhttps://api.firma.com/swagger'}
      />

      {invalidLines.length > 0 && (
        <div className="alert-box alert-warning" style={{ marginTop: '0.5rem' }}>
          <AlertCircle size={16} />
          <span>Adres olarak okunamayan satırlar atlandı: {invalidLines.join(' · ')}</span>
        </div>
      )}

      {drafts.length > 0 && (
        <div className="table-container" style={{ marginTop: '0.65rem' }}>
          <table className="table" style={{ fontSize: '0.8rem' }}>
            <thead>
              <tr>
                <th>Etiket</th>
                <th>Adres</th>
                <th>Tür</th>
                <th>Ortam</th>
                <th title="VPN gerekli">VPN</th>
                <th aria-label="Kaldır"></th>
              </tr>
            </thead>
            <tbody>
              {drafts.map((d, i) => (
                <tr key={d.url}>
                  <td>
                    <input
                      className="form-input"
                      style={{ padding: '0.3rem 0.45rem', fontSize: '0.8rem', minWidth: '140px' }}
                      value={d.label}
                      maxLength={150}
                      onChange={e => update(i, { label: e.target.value })}
                      disabled={disabled}
                      aria-label={`${d.url} etiketi`}
                    />
                  </td>
                  <td style={{ wordBreak: 'break-all', color: 'var(--text-secondary)' }}>{d.url}</td>
                  <td>
                    <select
                      className="form-select"
                      style={{ padding: '0.3rem', fontSize: '0.8rem' }}
                      value={d.linkType}
                      onChange={e => update(i, { linkType: e.target.value as LinkType })}
                      disabled={disabled}
                      aria-label={`${d.url} türü`}
                    >
                      {Object.entries(LINK_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      className="form-select"
                      style={{ padding: '0.3rem', fontSize: '0.8rem' }}
                      value={d.environment}
                      onChange={e => update(i, { environment: e.target.value as EnvironmentType })}
                      disabled={disabled}
                      aria-label={`${d.url} ortamı`}
                    >
                      {Object.entries(ENVIRONMENT_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={d.requiresVpn}
                      onChange={e => update(i, { requiresVpn: e.target.checked })}
                      disabled={disabled}
                      aria-label={`${d.url} VPN gerektirir`}
                    />
                  </td>
                  <td>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(i)} disabled={disabled} aria-label={`${d.url} kaldır`}>
                      <X size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
