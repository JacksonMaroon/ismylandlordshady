import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getBuilding } from '@/lib/api';
import { ScoreCard } from '@/components/building/ScoreCard';
import { ViolationSummary } from '@/components/building/ViolationSummary';
import { OwnerCard } from '@/components/building/OwnerCard';
import { ViolationTimeline } from '@/components/building/ViolationTimeline';
import { BuildingDetails } from '@/components/building/BuildingDetails';

interface Props {
  params: { bbl: string };
}

export async function generateMetadata({ params }: Props) {
  try {
    const building = await getBuilding(params.bbl);
    return {
      title: `${building.address} | IsMyLandlordShady.nyc`,
      description: `Building report for ${building.address}. Grade: ${building.score?.grade ?? 'N/A'}. ${building.violations.total} violations, ${building.complaints.total} complaints.`,
      openGraph: {
        title: `${building.address} - Grade ${building.score?.grade ?? 'N/A'}`,
        description: `${building.violations.total} violations, ${building.complaints.total} complaints, ${building.evictions.total} evictions`,
      },
    };
  } catch {
    return {
      title: 'Building Not Found | IsMyLandlordShady.nyc',
    };
  }
}

export default async function BuildingPage({ params }: Props) {
  let building;
  try {
    building = await getBuilding(params.bbl);
  } catch {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {building.address}
        </h1>
        <p className="text-gray-600">
          {building.borough} | BBL: {building.bbl}
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Score & Summary */}
        <div className="lg:col-span-1 space-y-6">
          <ScoreCard score={building.score} />
          <ViolationSummary violations={building.violations} />
          {building.owner && <OwnerCard owner={building.owner} />}
          <BuildingDetails building={building} />
        </div>

        {/* Right Column - Timeline & Details */}
        <div className="lg:col-span-2">
          <Suspense fallback={<div>Loading timeline...</div>}>
            <ViolationTimeline
              bbl={building.bbl}
              recentViolations={building.recent_violations}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
