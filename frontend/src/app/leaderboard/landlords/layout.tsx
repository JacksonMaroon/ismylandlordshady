import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Worst Landlords | NYCLandlordCheck',
  description: 'Ranked NYC landlords based on violations, response time, and litigation.',
  alternates: { canonical: '/leaderboard/landlords' },
};

export default function LandlordLeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
