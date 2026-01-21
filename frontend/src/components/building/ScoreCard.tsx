'use client';

import { cn, getGradeColor, formatScore } from '@/lib/utils';
import type { BuildingScore } from '@/lib/types';

interface Props {
  score: BuildingScore | null;
}

export function ScoreCard({ score }: Props) {
  if (!score) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="text-center text-gray-500">
          No score data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Building Score
      </h2>

      {/* Main Grade Display */}
      <div className="flex items-center justify-center mb-6">
        <div
          className={cn(
            'w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold',
            getGradeColor(score.grade)
          )}
        >
          {score.grade ?? '-'}
        </div>
      </div>

      {/* Overall Score */}
      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-gray-900">
          {formatScore(score.overall)}
        </div>
        <div className="text-sm text-gray-500">Overall Score (0-100)</div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-3">
        <ScoreBar
          label="Violations"
          value={score.violation_score}
          maxValue={100}
          color="red"
        />
        <ScoreBar
          label="Complaints"
          value={score.complaints_score}
          maxValue={100}
          color="orange"
        />
        <ScoreBar
          label="Evictions"
          value={score.eviction_score}
          maxValue={100}
          color="yellow"
        />
        <ScoreBar
          label="Ownership"
          value={score.ownership_score}
          maxValue={100}
          color="purple"
        />
        <ScoreBar
          label="Resolution"
          value={score.resolution_score}
          maxValue={100}
          color="blue"
        />
      </div>

      {/* Percentile Rankings */}
      {(score.percentile_city !== null || score.percentile_borough !== null) && (
        <div className="mt-6 pt-4 border-t">
          <div className="text-sm font-medium text-gray-700 mb-2">Rankings</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {score.percentile_city !== null && (
              <div>
                <span className="text-gray-500">Citywide: </span>
                <span className="font-medium">
                  Top {(100 - score.percentile_city).toFixed(0)}%
                </span>
              </div>
            )}
            {score.percentile_borough !== null && (
              <div>
                <span className="text-gray-500">Borough: </span>
                <span className="font-medium">
                  Top {(100 - score.percentile_borough).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ScoreBar({
  label,
  value,
  maxValue,
  color,
}: {
  label: string;
  value: number | null;
  maxValue: number;
  color: string;
}) {
  const percentage = value !== null ? (value / maxValue) * 100 : 0;

  const colorClasses: Record<string, string> = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium">{formatScore(value)}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', colorClasses[color])}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
