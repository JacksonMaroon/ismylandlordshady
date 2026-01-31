import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: { bbl: string };
}): Promise<Metadata> {
  const bbl = params.bbl;

  return {
    title: `Building ${bbl} Records | NYCLandlordCheck`,
    description: `Violation history, complaints, and ownership records for NYC building ${bbl}.`,
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
