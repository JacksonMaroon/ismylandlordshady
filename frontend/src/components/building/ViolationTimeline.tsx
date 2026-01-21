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
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Violations
        </h2>
        <div className="text-center py-8 text-gray-500">
          No violations found for this building.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Recent Violations
        </h2>
        <span className="text-sm text-gray-500">
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
    switch (violation.class) {
      case 'C':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'B':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case 'A':
        return <Info className="h-5 w-5 text-yellow-500" />;
      default:
        return <FileWarning className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-1">{getIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* Class Badge */}
            {violation.class && (
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded border',
                  getViolationClassColor(violation.class)
                )}
              >
                Class {violation.class}
              </span>
            )}

            {/* Status Badge */}
            {violation.status && (
              <span
                className={cn(
                  'px-2 py-0.5 text-xs rounded',
                  violation.status === 'OPEN'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                )}
              >
                {violation.status}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-700 mb-2">
            {truncateText(violation.description, 200)}
          </p>

          {/* Meta info */}
          <div className="flex items-center gap-4 text-xs text-gray-500">
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
