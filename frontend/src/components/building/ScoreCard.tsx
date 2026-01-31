'use client';

import { cn, getGradeColor, formatScore } from '@/lib/utils';
import type { BuildingScore } from '@/lib/types';

interface Props {
  score: BuildingScore | null;
}

export function ScoreCard({ score }: Props) {
  if (!score) {
    return (
      <div className="bg-white border border-[#D4CFC4] rounded-xl p-6">
        <div className="text-center text-[#8A8A8A]">
          No score data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#D4CFC4] rounded-xl p-6">
      <h2 className="font-serif text-lg font-bold text-[#1A1A1A] mb-4">
        Building Score
      </h2>

      {/* Main Grade Display */}
      <div className="flex items-center justify-center mb-6">
        <div
          className={cn(
            'w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold border-4',
            getGradeColor(score.grade)
          )}
        >
          {score.grade ?? '-'}
        </div>
      </div>

      {/* Overall Score */}
      <div className="text-center mb-6">
        <div className="font-serif text-3xl font-bold text-[#1A1A1A]">
          {formatScore(score.overall)}
        </div>
        <div className="text-sm text-[#8A8A8A]">Overall Score (0-100)</div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-3">
        <ScoreBar
          label="Violations"
          value={score.violation_score}
          maxValue={100}
          color="bg-[#C65D3B]"
        />
        <ScoreBar
          label="Complaints"
          value={score.complaints_score}
          maxValue={100}
          color="bg-[#D4846B]"
        />
        <ScoreBar
          label="Evictions"
          value={score.eviction_score}
          maxValue={100}
          color="bg-[#E09070]"
        />
        <ScoreBar
          label="Ownership"
          value={score.ownership_score}
          maxValue={100}
          color="bg-[#4A4A4A]"
        />
        <ScoreBar
          label="Resolution"
          value={score.resolution_score}
          maxValue={100}
          color="bg-[#8A8A8A]"
        />
      </div>

      {/* Percentile Rankings */}
      {(score.percentile_city !== null || score.percentile_borough !== null) && (
        <div className="mt-6 pt-4 border-t border-[#D4CFC4]">
          <div className="text-sm font-medium text-[#4A4A4A] mb-2">Rankings</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {score.percentile_city !== null && (
              <div>
                <span className="text-[#8A8A8A]">Citywide: </span>
                <span className="font-semibold text-[#1A1A1A]">
                  Top {(100 - score.percentile_city).toFixed(0)}%
                </span>
              </div>
            )}
            {score.percentile_borough !== null && (
              <div>
                <span className="text-[#8A8A8A]">Borough: </span>
                <span className="font-semibold text-[#1A1A1A]">
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

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-[#4A4A4A]">{label}</span>
        <span className="font-medium text-[#1A1A1A]">{formatScore(value)}</span>
      </div>
      <div className="h-2 bg-[#F0EBE3] rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
