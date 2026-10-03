import React from 'react';
import type { Usage } from '../types';

interface UsageMeterProps {
  usage: Usage;
  onUpgradeClick: () => void;
}

/** Compact "x of 10 free generations left" indicator with a progress bar. */
export const UsageMeter: React.FC<UsageMeterProps> = ({ usage, onUpgradeClick }) => {
  if (usage.unlimited) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-sm">
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
        Unlimited
      </span>
    );
  }

  const percentUsed = Math.min(100, (usage.used / Math.max(1, usage.limit)) * 100);
  const exhausted = usage.remaining <= 0;
  const low = usage.remaining <= 2;

  const barColour = exhausted
    ? 'bg-red-500'
    : low
      ? 'bg-amber-500'
      : 'bg-gradient-to-r from-green-500 to-emerald-500';

  return (
    <div className="flex items-center gap-3">
      <div className="min-w-[8.5rem]">
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-xs font-semibold text-gray-600">
            {exhausted ? 'No free generations left' : `${usage.remaining} of ${usage.limit} left`}
          </span>
        </div>
        <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${barColour}`} style={{ width: `${percentUsed}%` }} />
        </div>
      </div>
      {(exhausted || low) && (
        <button
          onClick={onUpgradeClick}
          className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm hover:shadow-md transition-shadow"
        >
          Get unlimited
        </button>
      )}
    </div>
  );
};
