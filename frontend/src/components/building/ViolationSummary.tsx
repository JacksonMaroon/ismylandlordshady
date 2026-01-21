'use client';

import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { ViolationSummary as ViolationSummaryType } from '@/lib/types';

interface Props {
  violations: ViolationSummaryType;
}

export function ViolationSummary({ violations }: Props) {
  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Violation Summary
      </h2>

      {/* Total & Open */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(violations.total)}
          </div>
          <div className="text-sm text-gray-500">Total Violations</div>
        </div>
        <div className="text-center p-4 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">
            {formatNumber(violations.open)}
          </div>
          <div className="text-sm text-gray-500">Open Violations</div>
        </div>
      </div>

      {/* By Class */}
      <div className="space-y-3">
        <ViolationClassRow
          icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
          label="Class C (Hazardous)"
          count={violations.by_class.C}
          description="Immediately hazardous conditions"
          bgColor="bg-red-50"
          textColor="text-red-700"
        />
        <ViolationClassRow
          icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
          label="Class B (Hazardous)"
          count={violations.by_class.B}
          description="Hazardous but not immediately dangerous"
          bgColor="bg-orange-50"
          textColor="text-orange-700"
        />
        <ViolationClassRow
          icon={<Info className="h-5 w-5 text-yellow-500" />}
          label="Class A (Non-Hazardous)"
          count={violations.by_class.A}
          description="Non-hazardous conditions"
          bgColor="bg-yellow-50"
          textColor="text-yellow-700"
        />
      </div>
    </div>
  );
}

function ViolationClassRow({
  icon,
  label,
  count,
  description,
  bgColor,
  textColor,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  description: string;
  bgColor: string;
  textColor: string;
}) {
  return (
    <div className={`p-3 rounded-lg ${bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <div className={`font-medium ${textColor}`}>{label}</div>
            <div className="text-xs text-gray-500">{description}</div>
          </div>
        </div>
        <div className={`text-xl font-bold ${textColor}`}>
          {formatNumber(count)}
        </div>
      </div>
    </div>
  );
}
