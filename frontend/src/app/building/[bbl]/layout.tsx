import type { Metadata } from 'next';
import type { BuildingReport } from '@/lib/types';
import { buildApiUrl } from '@/lib/seo';

function formatBoroughName(borough: string): string {
  return borough
    .toLowerCase()
    .split(' ')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}

async function fetchBuilding(bbl: string): Promise<BuildingReport | null> {
  try {
    const response = await fetch(buildApiUrl(`/api/v1/buildings/${bbl}`), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as BuildingReport;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { bbl: string };
}): Promise<Metadata> {
  const bbl = params.bbl;
  const building = await fetchBuilding(bbl);

  if (!building) {
    return {
      title: `Building ${bbl} Records | NYCLandlordCheck`,
      description: `Violation history, complaints, and ownership records for NYC building ${bbl}.`,
      alternates: { canonical: `/building/${bbl}` },
    };
  }

  const address = building.address || `Building ${bbl}`;
  const borough = building.borough ? formatBoroughName(building.borough) : null;
  const location = borough ? `${borough}, NYC` : 'NYC';

  return {
    title: `${address}${borough ? `, ${borough}` : ''} | NYCLandlordCheck`,
    description: `Violations, complaints, evictions, and ownership records for ${address} in ${location}.`,
    alternates: { canonical: `/building/${bbl}` },
  };
}

export default function BuildingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
