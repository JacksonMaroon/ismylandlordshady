const DEFAULT_SITE_URL = 'https://www.nyclandlordcheck.com';

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).trim();
}

export function getApiBase(): string {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').trim();
  return apiBase || getSiteUrl();
}

export function buildApiUrl(path: string): string {
  const base = getApiBase().replace(/\/$/, '');
  return `${base}${path}`;
}

export function formatTitleCase(input: string): string {
  return input
    .split('-')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}
