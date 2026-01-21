import Link from 'next/link';
import { getWorstLandlords } from '@/lib/api';
import { cn, getGradeColor, formatNumber, formatScore } from '@/lib/utils';
import { Trophy, AlertTriangle, Building } from 'lucide-react';

export const metadata = {
  title: 'Worst Landlords in NYC | IsMyLandlordShady.nyc',
  description:
    'See the worst-rated landlords in New York City based on their portfolio performance.',
};

export default async function WorstLandlordsPage() {
  const landlords = await getWorstLandlords({ limit: 100 });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <h1 className="text-3xl font-bold text-gray-900">
            Worst Landlords in NYC
          </h1>
        </div>
        <p className="text-gray-600">
          Landlords with multiple buildings and the highest average violation
          rates.
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
                Name
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                Buildings
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
            {landlords.map((landlord, index) => (
              <tr key={landlord.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  <span className="font-bold text-gray-900">{index + 1}</span>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/owner/${landlord.id}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {landlord.name}
                  </Link>
                  {landlord.is_llc && (
                    <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                      LLC
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <span className="inline-flex items-center gap-1">
                    <Building className="h-3 w-3 text-gray-400" />
                    {formatNumber(landlord.buildings)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 text-right">
                  {formatNumber(landlord.units)}
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <span className="font-medium">
                    {formatNumber(landlord.violations)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  {landlord.class_c > 0 && (
                    <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      {formatNumber(landlord.class_c)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-right font-mono">
                  {formatScore(landlord.score)}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={cn(
                      'px-2 py-1 rounded text-sm font-bold',
                      getGradeColor(landlord.grade)
                    )}
                  >
                    {landlord.grade}
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
