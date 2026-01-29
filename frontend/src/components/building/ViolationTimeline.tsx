'use client';

import { AlertTriangle, AlertCircle, Info, Home, FileWarning } from 'lucide-react';
import { cn, formatDate, getViolationClassColor, truncateText } from '@/lib/utils';
import type { ViolationItem } from '@/lib/types';

interface Props {
  bbl: string;
  recentViolations: ViolationItem[];
}

export function ViolationTimeline({ bbl, recentViolations }: Props) {
  if (recentViolations.length === 0) {
    return (
      <div className="bg-white border border-[#D4CFC4] rounded-xl p-6">
        <h2 className="font-serif text-lg font-bold text-[#1A1A1A] mb-4">
          Recent Violations
        </h2>
        <div className="text-center py-8 text-[#8A8A8A]">
          No violations found for this building.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#D4CFC4] rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-serif text-lg font-bold text-[#1A1A1A]">
          Recent Violations
        </h2>
        <span className="text-sm text-[#8A8A8A]">
          Showing {recentViolations.length} most recent
        </span>
      </div>

      <div className="space-y-4">
        {recentViolations.map((violation, index) => (
          <ViolationCard key={violation.id || index} violation={violation} />
        ))}
      </div>
    </div>
  );
}

function ViolationCard({ violation }: { violation: ViolationItem }) {
  const getIcon = () => {
    switch (violation.violation_class) {
      case 'C':
        return <AlertTriangle className="h-5 w-5 text-[#C65D3B]" />;
      case 'B':
        return <AlertCircle className="h-5 w-5 text-[#D4846B]" />;
      case 'A':
        return <Info className="h-5 w-5 text-[#E09070]" />;
      default:
        return <FileWarning className="h-5 w-5 text-[#8A8A8A]" />;
    }
  };

  const getClassColor = (violationClass: string) => {
    switch (violationClass) {
      case 'C':
        return 'bg-[#C65D3B]/10 text-[#C65D3B] border-[#C65D3B]/20';
      case 'B':
        return 'bg-[#D4846B]/10 text-[#D4846B] border-[#D4846B]/20';
      case 'A':
        return 'bg-[#E09070]/10 text-[#E09070] border-[#E09070]/20';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="border border-[#D4CFC4] rounded-lg p-4">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-1">{getIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* Class Badge */}
            {violation.violation_class && (
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded border',
                  getClassColor(violation.violation_class)
                )}
              >
                Class {violation.violation_class}
              </span>
            )}

            {/* Status Badge */}
            {violation.status && (
              <span
                className={cn(
                  'px-2 py-0.5 text-xs rounded',
                  violation.status === 'OPEN'
                    ? 'bg-[#C65D3B]/10 text-[#C65D3B]'
                    : 'bg-[#FAF7F2] text-[#4A4A4A]'
                )}
              >
                {violation.status}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-[#4A4A4A] mb-2 leading-relaxed">
            {truncateText(violation.description, 200)}
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-xs text-[#8A8A8A]">
            <span>{formatDate(violation.inspection_date)}</span>
            {violation.apartment && (
              <span className="flex items-center gap-1">
                <Home className="h-3 w-3" />
                Apt {violation.apartment}
              </span>
            )}
            {violation.story && <span>Floor {violation.story}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
