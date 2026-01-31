import type {
  BuildingSearch,
  BuildingReport,
  ViolationItem,
  TimelineEvent,
  OwnerPortfolio,
  LeaderboardBuilding,
  LeaderboardLandlord,
} from './types';

const RAW_API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').trim();
// Use relative /api in the browser to avoid CORS; server uses absolute backend URL.
const API_BASE = typeof window === 'undefined' ? RAW_API_BASE : '';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// Buildings API
export async function searchBuildings(query: string, limit = 10): Promise<BuildingSearch[]> {
  const params = new URLSearchParams({ q: query, limit: String(limit) });
  const data = await fetchApi<{ results: BuildingSearch[] }>(
    `/api/v1/buildings/search?${params}`
  );
  return data.results;
}

export async function getBuilding(bbl: string): Promise<BuildingReport> {
  return fetchApi<BuildingReport>(`/api/v1/buildings/${bbl}`);
}

export async function getBuildingViolations(
  bbl: string,
  options: {
    limit?: number;
    offset?: number;
    status?: string;
    violation_class?: string;
  } = {}
): Promise<{ items: ViolationItem[]; total: number }> {
  const params = new URLSearchParams();
  if (options.limit) params.set('limit', String(options.limit));
  if (options.offset) params.set('offset', String(options.offset));
  if (options.status) params.set('status', options.status);
  if (options.violation_class) params.set('violation_class', options.violation_class);

  return fetchApi(`/api/v1/buildings/${bbl}/violations?${params}`);
}

export async function getBuildingTimeline(
  bbl: string,
  limit = 50
): Promise<{ events: TimelineEvent[] }> {
  return fetchApi(`/api/v1/buildings/${bbl}/timeline?limit=${limit}`);
}

// Owners API
export async function getOwnerPortfolio(portfolioId: number): Promise<OwnerPortfolio> {
  return fetchApi<OwnerPortfolio>(`/api/v1/owners/${portfolioId}`);
}

// Leaderboards API
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export async function getWorstBuildings(options: {
  borough?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<LeaderboardBuilding[]> {
  const params = new URLSearchParams();
  if (options.borough) params.set('borough', options.borough);
  if (options.limit) params.set('limit', String(options.limit));
  if (options.offset) params.set('offset', String(options.offset));

  const response = await fetchApi<PaginatedResponse<LeaderboardBuilding>>(`/api/v1/leaderboards/worst-buildings?${params}`);
  return response.items;
}

export async function getWorstLandlords(options: {
  limit?: number;
  offset?: number;
} = {}): Promise<LeaderboardLandlord[]> {
  const params = new URLSearchParams();
  if (options.limit) params.set('limit', String(options.limit));
  if (options.offset) params.set('offset', String(options.offset));

  const response = await fetchApi<PaginatedResponse<LeaderboardLandlord>>(`/api/v1/leaderboards/worst-landlords?${params}`);
  return response.items;
}

// Recent violations API
export interface RecentViolation {
  id: number;
  violation_class: string | null;
  status: string | null;
  inspection_date: string | null;
  description: string | null;
  apartment: string | null;
  story: string | null;
  bbl: string;
  address: string | null;
  borough: string | null;
}

export async function getRecentViolations(options: {
  limit?: number;
  violation_class?: string;
} = {}): Promise<RecentViolation[]> {
  const params = new URLSearchParams();
  if (options.limit) params.set('limit', String(options.limit));
  if (options.violation_class) params.set('violation_class', options.violation_class);

  const response = await fetchApi<{ items: RecentViolation[] }>(`/api/v1/buildings/violations/recent?${params}`);
  return response.items;
}
