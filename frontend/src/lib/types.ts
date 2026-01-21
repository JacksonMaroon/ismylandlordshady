// Building types
export interface BuildingSearch {
  bbl: string;
  address: string | null;
  borough: string | null;
  units: number | null;
  grade: string | null;
  score: number | null;
}

export interface BuildingScore {
  overall: number | null;
  grade: string | null;
  violation_score: number | null;
  complaints_score: number | null;
  eviction_score: number | null;
  ownership_score: number | null;
  resolution_score: number | null;
  percentile_city: number | null;
  percentile_borough: number | null;
}

export interface ViolationSummary {
  total: number;
  open: number;
  by_class: {
    A: number;
    B: number;
    C: number;
  };
}

export interface ComplaintSummary {
  total: number;
  last_year: number;
  by_type: Array<{ type: string; count: number }>;
}

export interface EvictionSummary {
  total: number;
}

export interface OwnerInfo {
  name: string | null;
  address: string | null;
  portfolio_id: number | null;
  portfolio_size: number | null;
  portfolio_grade: string | null;
  is_llc: boolean;
}

export interface ViolationItem {
  id: number;
  class: string | null;
  status: string | null;
  inspection_date: string | null;
  description: string | null;
  apartment: string | null;
  story: string | null;
}

export interface BuildingReport {
  bbl: string;
  address: string | null;
  borough: string | null;
  zip_code: string | null;
  total_units: number | null;
  residential_units: number | null;
  year_built: number | null;
  latitude: number | null;
  longitude: number | null;
  score: BuildingScore | null;
  owner: OwnerInfo | null;
  violations: ViolationSummary;
  recent_violations: ViolationItem[];
  complaints: ComplaintSummary;
  evictions: EvictionSummary;
}

export interface TimelineEvent {
  type: 'violation' | 'complaint' | 'eviction';
  date: string | null;
  severity: string | null;
  description: string | null;
  status: string | null;
}

// Owner types
export interface PortfolioStats {
  total_buildings: number;
  total_units: number;
  total_violations: number;
  class_c_violations: number;
  class_b_violations: number;
  class_a_violations: number;
}

export interface PortfolioBuilding {
  bbl: string;
  address: string | null;
  borough: string | null;
  units: number | null;
  score: number | null;
  grade: string | null;
}

export interface OwnerPortfolio {
  id: number;
  name: string;
  address: string | null;
  is_llc: boolean;
  stats: PortfolioStats;
  score: number | null;
  grade: string | null;
  buildings: PortfolioBuilding[];
}

// Leaderboard types
export interface LeaderboardBuilding {
  bbl: string;
  address: string | null;
  borough: string | null;
  units: number | null;
  score: number;
  grade: string;
  violations: number;
  class_c: number;
  complaints: number;
  evictions: number;
}

export interface LeaderboardLandlord {
  id: number;
  name: string;
  buildings: number;
  units: number;
  violations: number;
  class_c: number;
  score: number;
  grade: string;
  is_llc: boolean;
}

// Grade type helper
export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';
