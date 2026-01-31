import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recent Violations | NYCLandlordCheck',
  description: 'Recent NYC building violations and compliance issues, updated regularly.',
  alternates: { canonical: '/violations/recent' },
};

export default function RecentViolationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
