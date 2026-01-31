'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getWorstBuildings } from '@/lib/api';
import { cn, getGradeColor, formatNumber, formatScore } from '@/lib/utils';
import { Trophy, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';
import type { LeaderboardBuilding } from '@/lib/types';

const BOROUGH_DISPLAY_NAMES: Record<string, string> = {
  'manhattan': 'Manhattan',
  'brooklyn': 'Brooklyn',
  'queens': 'Queens',
  'bronx': 'Bronx',
  'staten-island': 'Staten Island',
};

function WorstBuildingsContent() {
  const searchParams = useSearchParams();
  const boroughSlug = searchParams.get('borough');
  const boroughName = boroughSlug ? BOROUGH_DISPLAY_NAMES[boroughSlug] : null;

  const [buildings, setBuildings] = useState<LeaderboardBuilding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getWorstBuildings({
      limit: 100,
      borough: boroughName || undefined
    })
      .then(setBuildings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [boroughName]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#C65D3B]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-red-600">Failed to load buildings: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Back link if filtering by borough */}
        {boroughName && (
          <Link
            href={`/borough/${boroughSlug}`}
            className="inline-flex items-center gap-2 text-[#C65D3B] hover:underline text-sm mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to {boroughName}
          </Link>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="h-8 w-8 text-[#C65D3B]" />
            <h1 className="font-serif text-3xl font-bold text-[#1A1A1A]">
              Worst Buildings {boroughName ? `in ${boroughName}` : 'in NYC'}
            </h1>
          </div>
          <p className="text-[#4A4A4A]">
            Buildings with the highest scores based on violations, complaints, and evictions.
          </p>

          {/* Borough Filter Pills */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Link
              href="/leaderboard/buildings"
              className={cn(
                'px-3 py-1.5 text-sm rounded-full border transition-colors',
                !boroughName
                  ? 'bg-[#C65D3B] text-white border-[#C65D3B]'
                  : 'bg-white text-[#4A4A4A] border-[#D4CFC4] hover:border-[#C65D3B]'
              )}
            >
              All NYC
            </Link>
            {Object.entries(BOROUGH_DISPLAY_NAMES).map(([slug, name]) => (
              <Link
                key={slug}
                href={`/leaderboard/buildings?borough=${slug}`}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-full border transition-colors',
                  boroughSlug === slug
                    ? 'bg-[#C65D3B] text-white border-[#C65D3B]'
                    : 'bg-white text-[#4A4A4A] border-[#D4CFC4] hover:border-[#C65D3B]'
                )}
              >
                {name}
              </Link>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#D4CFC4] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#FAF7F2] border-b border-[#D4CFC4]">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">
                  Rank
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">
                  Address
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">
                  Borough
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-[#1A1A1A]">
                  Units
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-[#1A1A1A]">
                  Violations
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-[#1A1A1A]">
                  Class C
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-[#1A1A1A]">
                  Score
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-[#1A1A1A]">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D4CFC4]">
              {buildings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[#8A8A8A]">
                    No buildings found {boroughName && `in ${boroughName}`}
                  </td>
                </tr>
              ) : (
                buildings.map((building, index) => (
                  <tr key={building.bbl} className="hover:bg-[#FAF7F2]">
                    <td className="px-4 py-3 text-sm">
                      <span className="font-bold text-[#1A1A1A]">{index + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/building/${building.bbl}`}
                        className="text-[#C65D3B] hover:underline font-medium"
                      >
                        {building.address}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4A4A4A]">
                      {building.borough}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#4A4A4A] text-right">
                      {formatNumber(building.units)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <span className="font-medium text-[#1A1A1A]">
                        {formatNumber(building.violations)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {building.class_c > 0 && (
                        <span className="inline-flex items-center gap-1 text-[#C65D3B] font-medium">
                          <AlertTriangle className="h-3 w-3" />
                          {formatNumber(building.class_c)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-mono text-[#1A1A1A]">
                      {formatScore(building.score)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          'px-2 py-1 rounded text-sm font-bold',
                          getGradeColor(building.grade)
                        )}
                      >
                        {building.grade}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function WorstBuildingsPage() {
  return (
    <Suspense fallback={
      <div className="bg-[#FAF7F2] min-h-screen flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#C65D3B]" />
      </div>
    }>
      <WorstBuildingsContent />
    </Suspense>
  );
}
