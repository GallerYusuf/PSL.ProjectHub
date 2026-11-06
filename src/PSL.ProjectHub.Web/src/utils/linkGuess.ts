import { EnvironmentType, LinkType } from '../types';

/** Toplu yapıştırılan bir satırdan çıkarılan, kaydedilmeye hazır bağlantı taslağı. */
export interface LinkDraft {
  label: string;
  url: string;
  linkType: LinkType;
  environment: EnvironmentType;
  requiresVpn: boolean;
  requiresAuthentication: boolean;
}

export interface ParsedLinks {
  drafts: LinkDraft[];
  /** URL olarak yorumlanamayan satırlar (kullanıcıya gösterilir). */
  invalidLines: string[];
}

export const LINK_TYPE_LABELS: Record<LinkType, string> = {
  Production: 'Canlı Uygulama',
  Test: 'Test Ortamı',
  AdminPanel: 'Yönetim Paneli',
  Api: 'API',
  Swagger: 'Swagger',
  Documentation: 'Dokümantasyon',
  Repository: 'Kaynak Kod',
  Monitoring: 'İzleme',
  Other: 'Diğer',
};

export const ENVIRONMENT_LABELS: Record<EnvironmentType, string> = {
  Production: 'Canlı',
  Test: 'Test',
  Development: 'Geliştirme',
  Internal: 'İç Ağ',
  External: 'Dış',
};

const TEST_HINT = /(^|[.\-/_])(test|testws|staging|stage|stg|uat|qa|preprod|sandbox|demo)([.\-/_\d]|$)/i;
const DEV_HINT = /(^|[.\-/_])(dev|development|local)([.\-/_\d]|$)|localhost|127\.0\.0\.1/i;
const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)|\.(local|lan|corp|internal|intranet)$/i;
const REPO_HOST = /(^|\.)(github\.com|gitlab\.com|bitbucket\.org|dev\.azure\.com|visualstudio\.com)$/i;

function normalizeUrl(raw: string): URL | null {
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    if (!url.hostname.includes('.') && url.hostname !== 'localhost') return null;
    return url;
  } catch {
    return null;
  }
}

/** Adresin kendisinden bağlantı türü, ortam ve VPN ihtiyacını tahmin eder. */
export function guessLink(url: URL): Omit<LinkDraft, 'label' | 'url'> {
  const host = url.hostname.toLowerCase();
  const path = url.pathname.toLowerCase();
  const full = `${host}${path}`;

  let linkType: LinkType = 'Production';
  if (REPO_HOST.test(host)) linkType = 'Repository';
  else if (/swagger|openapi|api-docs|scalar/.test(full)) linkType = 'Swagger';
  else if (/grafana|kibana|uptime|status\.|monitor|seq\.|sentry|healthz?(\/|$)/.test(full)) linkType = 'Monitoring';
  else if (/(^|\.)(docs?|wiki|confluence)\.|\/(docs?|wiki)(\/|$)/.test(full)) linkType = 'Documentation';
  else if (/(^|[.\-])(admin|panel|yonetim|backoffice)[.\-]|\/(admin|panel|yonetim|backoffice)(\/|$)/.test(full)) linkType = 'AdminPanel';
  else if (/(^|\.)api[.\-]|\/api(\/|$)|\/(v\d+)\//.test(full)) linkType = 'Api';

  const isPrivate = PRIVATE_HOST.test(host);
  let environment: EnvironmentType = 'Production';
  if (linkType === 'Repository' || linkType === 'Documentation') environment = 'External';
  else if (TEST_HINT.test(full)) environment = 'Test';
  else if (DEV_HINT.test(full)) environment = 'Development';
  else if (isPrivate) environment = 'Internal';

  if (environment === 'Test' && linkType === 'Production') linkType = 'Test';

  return {
    linkType,
    environment,
    requiresVpn: isPrivate && host !== 'localhost' && !host.startsWith('127.'),
    requiresAuthentication: linkType === 'AdminPanel' || linkType === 'Repository',
  };
}

/**
 * Serbest metni bağlantı taslaklarına çevirir. Her satır bir adres içerir; isteğe bağlı olarak
 * "Etiket | adres", "Etiket: adres" veya "Etiket - adres" biçiminde başlık verilebilir.
 */
export function parseLinkText(text: string): ParsedLinks {
  const drafts: LinkDraft[] = [];
  const invalidLines: string[] = [];
  const seen = new Set<string>();

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    // Önce açık http(s) adresi aranır; yoksa şemasız alan adı (örn. panel.firma.com) kabul edilir
    const urlMatch =
      line.match(/https?:\/\/\S+/i) ??
      line.match(/(?<![\w.-])[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(:\d+)?(\/\S*)?/i);
    if (!urlMatch) {
      invalidLines.push(line);
      continue;
    }

    const url = normalizeUrl(urlMatch[0].replace(/[),;]+$/, ''));
    if (!url) {
      invalidLines.push(line);
      continue;
    }

    const href = url.toString().replace(/\/$/, '');
    if (seen.has(href.toLowerCase())) continue;
    seen.add(href.toLowerCase());

    const explicitLabel = line
      .slice(0, urlMatch.index)
      .replace(/[\s|:\-–—]+$/, '')
      .trim();

    const guess = guessLink(url);
    drafts.push({
      ...guess,
      url: href,
      label: explicitLabel || `${LINK_TYPE_LABELS[guess.linkType]} (${url.hostname})`,
    });
  }

  return { drafts, invalidLines };
}
