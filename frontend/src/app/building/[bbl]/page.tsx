import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Building2 } from 'lucide-react';
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
      title: `${building.address} | NYCLandlordCheck`,
      description: `Building report for ${building.address}. Grade: ${building.score?.grade ?? 'N/A'}. ${building.violations.total} violations, ${building.complaints.total} complaints.`,
      openGraph: {
        title: `${building.address} - Grade ${building.score?.grade ?? 'N/A'}`,
        description: `${building.violations.total} violations, ${building.complaints.total} complaints, ${building.evictions.total} evictions`,
      },
    };
  } catch {
    return {
      title: 'Building Not Found | NYCLandlordCheck',
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
    <div className="bg-[#FAF7F2] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#C65D3B] hover:underline text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[#8A8A8A] text-sm mb-2">
            <MapPin className="w-4 h-4" />
            <span>{building.borough}</span>
            <span>•</span>
            <span>BBL: {building.bbl}</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-2">
            {building.address}
          </h1>
          {building.total_units && (
            <div className="flex items-center gap-2 text-[#4A4A4A]">
              <Building2 className="w-4 h-4" />
              <span>{building.total_units} units</span>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Score & Summary */}
          <div className="lg:col-span-1 space-y-6">
            <ScoreCard score={building.score} />
            <ViolationSummary violations={building.violations} />
            {building.owner && <OwnerCard owner={building.owner} />}
            <BuildingDetails building={building} />
          </div>

          {/* Right Column - Timeline & Details */}
          <div className="lg:col-span-2">
            <Suspense fallback={
              <div className="bg-white border border-[#D4CFC4] rounded-xl p-6 text-center text-[#8A8A8A]">
                Loading timeline...
              </div>
            }>
              <ViolationTimeline
                bbl={building.bbl}
                recentViolations={building.recent_violations}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
