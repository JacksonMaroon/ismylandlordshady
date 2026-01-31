import type { Metadata } from 'next';
import type { OwnerPortfolio } from '@/lib/types';
import { buildApiUrl } from '@/lib/seo';

async function fetchOwner(id: string): Promise<OwnerPortfolio | null> {
  try {
    const response = await fetch(buildApiUrl(`/api/v1/owners/${id}`), {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as OwnerPortfolio;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const ownerId = params.id;
  const owner = await fetchOwner(ownerId);

  if (!owner) {
    return {
      title: `Landlord ${ownerId} Records | NYCLandlordCheck`,
      description: `Building portfolio, violations, and history for landlord ${ownerId}.`,
      alternates: { canonical: `/owner/${ownerId}` },
    };
  }

  const name = owner.name || `Landlord ${ownerId}`;

  return {
    title: `${name} Records | NYCLandlordCheck`,
    description: `Building portfolio, violations, and history for ${name} in NYC.`,
    alternates: { canonical: `/owner/${ownerId}` },
  };
}

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
