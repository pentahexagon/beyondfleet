'use client';

import type { PhaseProgress as PhaseProgressType } from '@/types/dashboard';
import { PHASE_INFO } from '@/types/dashboard';

interface PhaseProgressProps {
  progress: PhaseProgressType[];
}

export default function PhaseProgress({ progress }: PhaseProgressProps) {
  const overallCompleted = progress.reduce((acc, p) => acc + p.completed, 0);
  const overallTotal = progress.reduce((acc, p) => acc + p.total, 0);
  const overallPercentage = overallTotal > 0 ? Math.round((overallCompleted / overallTotal) * 100) : 0;

  return (
    <div className="bg-space-800/60 border border-purple-500/20 rounded-xl p-4">
      {/* Overall Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">Overall Progress</span>
          <span className="text-sm font-bold text-white">{overallPercentage}%</span>
        </div>
        <div className="h-2 bg-space-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${overallPercentage}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {overallCompleted} of {overallTotal} tasks completed
        </p>
      </div>

      {/* Phase Progress Bars */}
      <div className="space-y-3">
        {progress.map((p) => {
          const phaseInfo = PHASE_INFO[p.phase];
          return (
            <div key={p.phase}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">{phaseInfo.name}</span>
                <span className="text-xs text-gray-500">
                  {p.completed}/{p.total}
                </span>
              </div>
              <div className="h-1.5 bg-space-700 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${p.percentage}%`,
                    backgroundColor: phaseInfo.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
