'use client';

import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import type { ViolationSummary as ViolationSummaryType } from '@/lib/types';

interface Props {
  violations: ViolationSummaryType;
}

export function ViolationSummary({ violations }: Props) {
  return (
    <div className="bg-white border border-[#D4CFC4] rounded-xl p-6">
      <h2 className="font-serif text-lg font-bold text-[#1A1A1A] mb-4">
        Violation Summary
      </h2>

      {/* Total & Open */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-[#FAF7F2] rounded-lg">
          <div className="font-serif text-2xl font-bold text-[#1A1A1A]">
            {formatNumber(violations.total)}
          </div>
          <div className="text-sm text-[#8A8A8A]">Total Violations</div>
        </div>
        <div className="text-center p-4 bg-[#C65D3B]/10 rounded-lg">
          <div className="font-serif text-2xl font-bold text-[#C65D3B]">
            {formatNumber(violations.open)}
          </div>
          <div className="text-sm text-[#8A8A8A]">Open Violations</div>
        </div>
      </div>

      {/* By Class */}
      <div className="space-y-3">
        <ViolationClassRow
          icon={<AlertTriangle className="h-5 w-5 text-[#C65D3B]" />}
          label="Class C (Hazardous)"
          count={violations.by_class.C}
          description="Immediately hazardous conditions"
          bgColor="bg-[#C65D3B]/10"
          textColor="text-[#C65D3B]"
        />
        <ViolationClassRow
          icon={<AlertCircle className="h-5 w-5 text-[#D4846B]" />}
          label="Class B (Hazardous)"
          count={violations.by_class.B}
          description="Hazardous but not immediately dangerous"
          bgColor="bg-[#D4846B]/10"
          textColor="text-[#D4846B]"
        />
        <ViolationClassRow
          icon={<Info className="h-5 w-5 text-[#E09070]" />}
          label="Class A (Non-Hazardous)"
          count={violations.by_class.A}
          description="Non-hazardous conditions"
          bgColor="bg-[#E09070]/10"
          textColor="text-[#E09070]"
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
            <div className="text-xs text-[#8A8A8A]">{description}</div>
          </div>
        </div>
        <div className={`font-serif text-xl font-bold ${textColor}`}>
          {formatNumber(count)}
        </div>
      </div>
    </div>
  );
}
