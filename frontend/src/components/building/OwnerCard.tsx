'use client';

import Link from 'next/link';
import { Building, ExternalLink, AlertTriangle } from 'lucide-react';
import { cn, getGradeColor, formatNumber } from '@/lib/utils';
import type { OwnerInfo } from '@/lib/types';

interface Props {
  owner: OwnerInfo;
}

export function OwnerCard({ owner }: Props) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Owner Information
      </h2>

      <div className="space-y-4">
        {/* Owner Name */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{owner.name}</span>
            {owner.is_llc && (
              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                LLC
              </span>
            )}
          </div>
          {owner.address && (
            <div className="text-sm text-gray-500 mt-1">{owner.address}</div>
          )}
        </div>

        {/* Portfolio Info */}
        {owner.portfolio_id && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Building className="h-4 w-4" />
                <span className="text-sm">Portfolio</span>
              </div>
              {owner.portfolio_grade && (
                <span
                  className={cn(
                    'px-2 py-0.5 rounded text-sm font-bold',
                    getGradeColor(owner.portfolio_grade)
                  )}
                >
                  {owner.portfolio_grade}
                </span>
              )}
            </div>

            <div className="text-2xl font-bold text-gray-900">
              {formatNumber(owner.portfolio_size)} buildings
            </div>

            {owner.portfolio_size && owner.portfolio_size > 5 && (
              <div className="flex items-center gap-1 mt-2 text-sm text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                <span>Large portfolio owner</span>
              </div>
            )}

            <Link
              href={`/owner/${owner.portfolio_id}`}
              className="inline-flex items-center gap-1 mt-4 text-blue-600 hover:text-blue-800 text-sm"
            >
              <span>View full portfolio</span>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
