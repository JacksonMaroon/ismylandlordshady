'use client';

import { Building, Calendar, Home, MapPin } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { BuildingReport } from '@/lib/types';

interface Props {
  building: BuildingReport;
}

export function BuildingDetails({ building }: Props) {
  return (
    <div className="bg-white border border-[#D4CFC4] rounded-xl p-6">
      <h2 className="font-serif text-lg font-bold text-[#1A1A1A] mb-4">
        Building Details
      </h2>

      <div className="space-y-3">
        <DetailRow
          icon={<MapPin className="h-4 w-4" />}
          label="Address"
          value={building.address}
        />
        <DetailRow
          icon={<Home className="h-4 w-4" />}
          label="Units"
          value={
            building.total_units
              ? `${formatNumber(building.total_units)} total (${formatNumber(building.residential_units)} residential)`
              : null
          }
        />
        <DetailRow
          icon={<Calendar className="h-4 w-4" />}
          label="Year Built"
          value={building.year_built?.toString()}
        />
        <DetailRow
          icon={<Building className="h-4 w-4" />}
          label="BBL"
          value={building.bbl}
        />
        <DetailRow
          icon={<MapPin className="h-4 w-4" />}
          label="ZIP Code"
          value={building.zip_code}
        />
      </div>

      {/* Quick Stats */}
      <div className="mt-6 pt-4 border-t border-[#D4CFC4]">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="font-serif text-lg font-bold text-[#1A1A1A]">
              {formatNumber(building.complaints.total)}
            </div>
            <div className="text-xs text-[#8A8A8A]">311 Complaints</div>
          </div>
          <div>
            <div className="font-serif text-lg font-bold text-[#1A1A1A]">
              {formatNumber(building.complaints.last_year)}
            </div>
            <div className="text-xs text-[#8A8A8A]">Last Year</div>
          </div>
          <div>
            <div className="font-serif text-lg font-bold text-[#C65D3B]">
              {formatNumber(building.evictions.total)}
            </div>
            <div className="text-xs text-[#8A8A8A]">Evictions</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="text-[#8A8A8A]">{icon}</div>
      <div>
        <div className="text-xs text-[#8A8A8A]">{label}</div>
        <div className="text-sm font-medium text-[#1A1A1A]">{value}</div>
      </div>
    </div>
  );
}
