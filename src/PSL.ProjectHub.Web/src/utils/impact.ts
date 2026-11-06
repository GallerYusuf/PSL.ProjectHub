import { ImpactKind } from '../types';

export const IMPACT_KINDS: { value: ImpactKind; label: string; unit?: string; example: string }[] = [
  { value: 'TimeSaved', label: 'Zaman tasarrufu', unit: 'saat/ay', example: 'Manuel fatura girişi kaldırıldı' },
  { value: 'Users', label: 'Kullanıcı sayısı', unit: 'kullanıcı', example: 'Sistemi kullanan bayi' },
  { value: 'CostSaving', label: 'Maliyet tasarrufu', unit: 'TL/yıl', example: 'Lisans gideri azaldı' },
  { value: 'Volume', label: 'İşlem hacmi', example: 'Otomatik eşleşen fatura' },
  { value: 'Other', label: 'Diğer', example: 'Hata oranında düşüş' },
];

export const kindInfo = (kind: ImpactKind) => IMPACT_KINDS.find(k => k.value === kind) ?? IMPACT_KINDS[4];

/**
 * Kullanıcının yazdığı sayıyı okur: "12.500" → 12500, "2,5" → 2.5, "1.250,75" → 1250.75, "2.5" → 2.5.
 * Noktadan sonra tam 3 hane varsa binlik ayırıcı sayılır. Okunamazsa NaN döner.
 */
export function parseTrNumber(input: string): number {
  let s = input.trim().replace(/\s/g, '');
  if (!s) return NaN;
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    s = s.replace(/\./g, '');
  }
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
}

/** Türkçe sayı biçimi (ör. 12.500 veya 2,5). */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(value);
}

/** Büyük sayıları kısaltır (ör. 1,2 Mn). Sunum ekranlarında kullanılır. */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}
