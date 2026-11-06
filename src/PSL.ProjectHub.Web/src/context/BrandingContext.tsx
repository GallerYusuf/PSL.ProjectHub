import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { api } from '../api/client';
import { OrganizationSettings } from '../types';

const DEFAULT_BRANDING: OrganizationSettings = {
  organizationName: '',
  teamName: 'Yazılım Ekibi',
  accentColor: '#0f4c81',
};

export const PRODUCT_NAME = 'Project Hub';

interface BrandingContextValue {
  branding: OrganizationSettings;
  /** Sunucudan marka (ve oturum varsa tam ayar) bilgisini tekrar çeker. */
  refresh: () => Promise<void>;
  /** Kaydedilen ayarları sunucuya gitmeden uygular. */
  apply: (settings: OrganizationSettings) => void;
}

const BrandingContext = createContext<BrandingContextValue | undefined>(undefined);

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
}

function mix(rgb: [number, number, number], target: number, amount: number): string {
  const c = rgb.map(v => Math.round(v + (target - v) * amount));
  return `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Vurgu rengini tasarım token'larına (primary, hover, subtle, border) yayar. */
export function applyAccentColor(hex: string) {
  const rgb = hexToRgb(hex);
  if (!rgb) return;
  const root = document.documentElement.style;
  root.setProperty('--primary', hex);
  root.setProperty('--primary-hover', mix(rgb, 0, 0.28));
  root.setProperty('--primary-subtle', mix(rgb, 255, 0.9));
  root.setProperty('--primary-border', mix(rgb, 255, 0.6));
}

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<OrganizationSettings>(DEFAULT_BRANDING);

  const apply = useCallback((settings: OrganizationSettings) => {
    setBranding(settings);
    applyAccentColor(settings.accentColor);
    document.title = settings.organizationName
      ? `${settings.teamName} | ${settings.organizationName}`
      : PRODUCT_NAME;
  }, []);

  const refresh = useCallback(async () => {
    try {
      const hasSession = !!localStorage.getItem('psl_token');
      apply(hasSession ? await api.getSettings() : await api.getBranding());
    } catch {
      try {
        apply(await api.getBranding());
      } catch {
        // Marka bilgisi alınamazsa varsayılan görünümle devam edilir
      }
    }
  }, [apply]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <BrandingContext.Provider value={{ branding, refresh, apply }}>
      {children}
    </BrandingContext.Provider>
  );
};

export function useBranding(): BrandingContextValue {
  const ctx = useContext(BrandingContext);
  // Provider dışında (ör. izole bileşen testleri) varsayılan marka ile çalışır
  return ctx ?? { branding: DEFAULT_BRANDING, refresh: async () => {}, apply: () => {} };
}

/** Firma logosu yüklüyse logoyu, değilse tipografik rozet gösterir. */
export const BrandMark: React.FC<{ size?: number }> = ({ size = 36 }) => {
  const { branding } = useBranding();
  if (branding.logoUrl) {
    return (
      <img
        src={branding.logoUrl}
        alt={branding.organizationName}
        style={{ height: size, maxWidth: size * 3, objectFit: 'contain', display: 'block' }}
      />
    );
  }
  return (
    <div className="brand-logo-badge" style={{ width: size, height: size }}>
      <Layers size={Math.round(size / 2)} />
    </div>
  );
};
