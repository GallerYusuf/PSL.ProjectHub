import { describe, it, expect } from 'vitest';
import { parseLinkText } from '../utils/linkGuess';

describe('Toplu link yapıştırma ve tür tahmini', () => {
  it('her satırdan bir bağlantı çıkarır, şemasız adrese https ekler', () => {
    const { drafts, invalidLines } = parseLinkText(
      'https://b2bpanel.firma.com.tr\nportal.firma.com/giris\n\n   '
    );
    expect(invalidLines).toEqual([]);
    expect(drafts.map(d => d.url)).toEqual([
      'https://b2bpanel.firma.com.tr',
      'https://portal.firma.com/giris',
    ]);
    expect(drafts[0].linkType).toBe('Production');
    expect(drafts[0].environment).toBe('Production');
  });

  it('adres içeriğinden swagger, admin, api, repo ve test ortamını tahmin eder', () => {
    const { drafts } = parseLinkText(
      [
        'https://api.firma.com/swagger/index.html',
        'https://firma.com/admin',
        'https://api.firma.com/v1/orders',
        'https://github.com/firma/proje',
        'https://testws.odeme.com/Api/Vpos',
        'https://staging.firma.com',
      ].join('\n')
    );
    expect(drafts.map(d => [d.linkType, d.environment])).toEqual([
      ['Swagger', 'Production'],
      ['AdminPanel', 'Production'],
      ['Api', 'Production'],
      ['Repository', 'External'],
      ['Api', 'Test'],
      ['Test', 'Test'],
    ]);
  });

  it('iç ağ adreslerini VPN gerektiren İç Ağ ortamı olarak işaretler', () => {
    const { drafts } = parseLinkText('http://192.168.1.20:8080\nhttp://erp.corp');
    expect(drafts.every(d => d.environment === 'Internal' && d.requiresVpn)).toBe(true);
  });

  it('"Etiket | adres" ve "Etiket: adres" biçimlerinde etiketi korur, noktalı etiketi adres sanmaz', () => {
    const { drafts } = parseLinkText(
      'B2B Bayi Paneli | https://b2b.firma.com\nFissler.Servis - https://servis.firma.com\nCRM: crm.firma.com.tr'
    );
    expect(drafts.map(d => d.label)).toEqual(['B2B Bayi Paneli', 'Fissler.Servis', 'CRM']);
    expect(drafts[1].url).toBe('https://servis.firma.com');
    expect(drafts[2].url).toBe('https://crm.firma.com.tr');
  });

  it('tekrarlanan adresleri atlar, adres olmayan satırları ayrıca bildirir', () => {
    const { drafts, invalidLines } = parseLinkText(
      'https://a.firma.com\nhttps://A.firma.com/\nburası adres değil'
    );
    expect(drafts).toHaveLength(1);
    expect(invalidLines).toEqual(['burası adres değil']);
  });
});
