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
    <div className="bg-white border border-[#D4CFC4] rounded-xl p-6">
      <h2 className="font-serif text-lg font-bold text-[#1A1A1A] mb-4">
        Owner Information
      </h2>

      <div className="space-y-4">
        {/* Owner Name */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-[#1A1A1A]">{owner.name}</span>
            {owner.is_llc && (
              <span className="px-2 py-0.5 text-xs bg-[#4A4A4A]/10 text-[#4A4A4A] rounded">
                LLC
              </span>
            )}
          </div>
          {owner.address && (
            <div className="text-sm text-[#8A8A8A] mt-1">{owner.address}</div>
          )}
        </div>

        {/* Portfolio Info */}
        {owner.portfolio_id && (
          <div className="pt-4 border-t border-[#D4CFC4]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-[#4A4A4A]">
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

            <div className="font-serif text-2xl font-bold text-[#1A1A1A]">
              {formatNumber(owner.portfolio_size)} buildings
            </div>

            {owner.portfolio_size && owner.portfolio_size > 5 && (
              <div className="flex items-center gap-1 mt-2 text-sm text-[#C65D3B]">
                <AlertTriangle className="h-4 w-4" />
                <span>Large portfolio owner</span>
              </div>
            )}

            <Link
              href={`/owner/${owner.portfolio_id}`}
              className="inline-flex items-center gap-1 mt-4 text-[#C65D3B] hover:underline text-sm font-medium"
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
