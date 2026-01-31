import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const ownerId = params.id;

  return {
    title: `Landlord ${ownerId} Records | NYCLandlordCheck`,
    description: `Building portfolio, violations, and history for landlord ${ownerId}.`,
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
