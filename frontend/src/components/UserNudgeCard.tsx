'use client';

import React from 'react';
import { AlertTriangle, ArrowRight, Lightbulb, RefreshCw } from 'lucide-react';

interface UserNudgeCardProps {
  nudge: string;
  onRetryClick?: () => void;
}

export const UserNudgeCard: React.FC<UserNudgeCardProps> = ({ nudge, onRetryClick }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-950 p-6 shadow-2xl backdrop-blur-md">
      {/* Decorative gradient glow */}
      <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-500/10 blur-2xl" />

      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-lg shadow-amber-500/10">
          <AlertTriangle className="h-6 w-6" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
              User Retry Guide
            </span>
            <span className="inline-flex items-center rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
              Immediate Feedback
            </span>
          </div>

          <h3 className="mt-1 text-base font-bold text-white">
            Action Required to Complete Verification
          </h3>

          <div className="mt-3 rounded-xl bg-slate-950/80 border border-slate-800/80 p-4 font-sans text-sm text-slate-300 whitespace-pre-line leading-relaxed">
            {nudge}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Lightbulb className="h-4 w-4 text-amber-400" />
              <span>Fix the highlighted document and submit again. No account reset needed.</span>
            </div>

            {onRetryClick && (
              <button
                type="button"
                onClick={onRetryClick}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-600/20 hover:from-amber-500 hover:to-amber-600 transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset & Re-upload</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
