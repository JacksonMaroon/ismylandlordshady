import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Worst Buildings | NYCLandlordCheck',
  description: 'Explore NYC buildings with the most violations, complaints, and poor records.',
  alternates: { canonical: '/leaderboard/buildings' },
};

export default function BuildingLeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
