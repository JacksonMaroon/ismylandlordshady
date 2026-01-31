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
  params: { borough: string };
}): Promise<Metadata> {
  const boroughName = formatSlug(params.borough);

  return {
    title: `${boroughName} Buildings & Landlords | NYCLandlordCheck`,
    description: `Explore buildings, landlords, and violations in ${boroughName}.`,
    alternates: { canonical: `/borough/${params.borough}` },
  };
}

export default function BoroughLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
