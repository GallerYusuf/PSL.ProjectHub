import { describe, it, expect } from 'vitest';

export function isSafeUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('file:') ||
      trimmed.startsWith('vbscript:')) {
    return false;
  }

  try {
    const parsed = new URL(rawUrl.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

describe('Frontend URL Safety Logic', () => {
  it('accepts valid http and https addresses', () => {
    expect(isSafeUrl('http://localhost:5000')).toBe(true);
    expect(isSafeUrl('https://portal.gallerycrystal.com.tr')).toBe(true);
    expect(isSafeUrl('https://192.168.1.50:8080/app')).toBe(true);
  });

  it('rejects dangerous javascript, data, and file schemes', () => {
    expect(isSafeUrl("javascript:alert('xss')")).toBe(false);
    expect(isSafeUrl('data:text/html,<html>test</html>')).toBe(false);
    expect(isSafeUrl('file:///C:/secrets.txt')).toBe(false);
    expect(isSafeUrl('vbscript:MsgBox(1)')).toBe(false);
  });

  it('rejects malformed and empty urls', () => {
    expect(isSafeUrl('')).toBe(false);
    expect(isSafeUrl('   ')).toBe(false);
    expect(isSafeUrl('not-a-url')).toBe(false);
  });
});
