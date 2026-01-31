import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOwnerPortfolio } from '@/lib/api';
import { cn, getGradeColor, formatNumber, formatScore } from '@/lib/utils';
import { Building, AlertTriangle, Home } from 'lucide-react';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  try {
    const portfolio = await getOwnerPortfolio(parseInt(params.id));
    return {
      title: `${portfolio.name} Portfolio | NYCLandlordCheck`,
      description: `Landlord portfolio: ${portfolio.stats.total_buildings} buildings, ${portfolio.stats.total_units} units, ${portfolio.stats.total_violations} violations.`,
    };
  } catch {
    return {
      title: 'Portfolio Not Found | NYCLandlordCheck',
    };
  }
}

export default async function OwnerPage({ params }: Props) {
  let portfolio;
  try {
    portfolio = await getOwnerPortfolio(parseInt(params.id));
  } catch {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-gray-900">{portfolio.name}</h1>
          {portfolio.is_llc && (
            <span className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded">
              LLC
            </span>
          )}
        </div>
        {portfolio.address && (
          <p className="text-gray-600">{portfolio.address}</p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Grade Card */}
        <div className="bg-white rounded-xl border p-6 text-center">
          <div
            className={cn(
              'w-16 h-16 mx-auto rounded-full flex items-center justify-center text-2xl font-bold mb-2',
              getGradeColor(portfolio.grade)
            )}
          >
            {portfolio.grade ?? '-'}
          </div>
          <div className="text-sm text-gray-500">Portfolio Grade</div>
          {portfolio.score !== null && (
            <div className="text-xs text-gray-400 mt-1">
              Score: {formatScore(portfolio.score)}
            </div>
          )}
        </div>

        {/* Buildings */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Building className="h-5 w-5" />
            <span className="text-sm">Buildings</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatNumber(portfolio.stats.total_buildings)}
          </div>
          <div className="text-sm text-gray-500">
            {formatNumber(portfolio.stats.total_units)} total units
          </div>
        </div>

        {/* Violations */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">Violations</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatNumber(portfolio.stats.total_violations)}
          </div>
          <div className="text-sm text-red-600">
            {formatNumber(portfolio.stats.class_c_violations)} Class C
          </div>
        </div>

        {/* Violations per Unit */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Home className="h-5 w-5" />
            <span className="text-sm">Per Unit</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {portfolio.stats.total_units > 0
              ? (
                  portfolio.stats.total_violations / portfolio.stats.total_units
                ).toFixed(1)
              : '-'}
          </div>
          <div className="text-sm text-gray-500">violations per unit</div>
        </div>
      </div>

      {/* Buildings List */}
      <div className="bg-white rounded-xl border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Buildings in Portfolio
          </h2>
        </div>

        <div className="divide-y">
          {portfolio.buildings.map((building) => (
            <Link
              key={building.bbl}
              href={`/building/${building.bbl}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div>
                <div className="font-medium text-gray-900">
                  {building.address}
                </div>
                <div className="text-sm text-gray-500">
                  {building.borough} | {formatNumber(building.units)} units
                </div>
              </div>
              <div className="flex items-center gap-4">
                {building.score !== null && (
                  <span className="text-sm text-gray-500">
                    Score: {formatScore(building.score)}
                  </span>
                )}
                {building.grade && (
                  <span
                    className={cn(
                      'px-3 py-1 rounded-full text-sm font-bold',
                      getGradeColor(building.grade)
                    )}
                  >
                    {building.grade}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
