import type { Metadata } from 'next';

function formatSlug(slug: string): string {
  return slug
    .split('-')
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(' ');
}

export async function generateMetadata({
  params,
}: {
  params: { neighborhood: string };
}): Promise<Metadata> {
  const neighborhoodName = formatSlug(params.neighborhood);

  return {
    title: `${neighborhoodName} Buildings & Landlords | NYCLandlordCheck`,
    description: `Explore buildings, landlords, and violations in ${neighborhoodName}.`,
    alternates: { canonical: `/neighborhood/${params.neighborhood}` },
  };
}

export default function NeighborhoodLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
