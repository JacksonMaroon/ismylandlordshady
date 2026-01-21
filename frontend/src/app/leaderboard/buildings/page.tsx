import Link from 'next/link';
import { getWorstBuildings } from '@/lib/api';
import { cn, getGradeColor, formatNumber, formatScore } from '@/lib/utils';
import { Trophy, AlertTriangle } from 'lucide-react';

export const metadata = {
  title: 'Worst Buildings in NYC | IsMyLandlordShady.nyc',
  description:
    'See the worst-rated buildings in New York City based on violations, complaints, and evictions.',
};

export default async function WorstBuildingsPage() {
  const buildings = await getWorstBuildings({ limit: 100 });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900">
            Worst Buildings in NYC
          </h1>
        </div>
        <p className="text-gray-600">
          Buildings with the highest scores based on violations, complaints, and
          evictions.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Rank
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Address
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">
                Borough
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                Units
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                Violations
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                Class C
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                Score
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                Grade
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {buildings.map((building, index) => (
              <tr key={building.bbl} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  <span className="font-bold text-gray-900">{index + 1}</span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/building/${building.bbl}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {building.address}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {building.borough}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 text-right">
                  {formatNumber(building.units)}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <span className="font-medium">
                    {formatNumber(building.violations)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {building.class_c > 0 && (
                    <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      {formatNumber(building.class_c)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-right font-mono">
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
