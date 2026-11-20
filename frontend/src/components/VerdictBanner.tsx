'use client';

import React from 'react';
import { CheckCircle2, AlertOctagon, Clock, UserCheck, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { SubmissionStatus, LatencyBreakdown } from '../types/kyc';

interface VerdictBannerProps {
  status: SubmissionStatus;
  submissionId: string;
  latencies: LatencyBreakdown;
  applicantType: string;
  onViewInOps?: () => void;
}

export const VerdictBanner: React.FC<VerdictBannerProps> = ({
  status,
  submissionId,
  latencies,
  applicantType,
  onViewInOps,
}) => {
  const isApproved = status === 'AUTO_APPROVED' || status === 'OVERRIDDEN_APPROVED';
  const isRetry = status === 'USER_RETRY_REQUIRED';
  const isReview = status === 'OPS_MANUAL_REVIEW';

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-6 transition-all shadow-xl backdrop-blur-md ${
      isApproved 
        ? 'border-emerald-500/50 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 shadow-emerald-950/30'
        : isRetry
          ? 'border-rose-500/50 bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-950 shadow-rose-950/30'
          : 'border-blue-500/50 bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-950 shadow-blue-950/30'
    }`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border shadow-lg ${
            isApproved 
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-500/20'
              : isRetry
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-rose-500/20'
                : 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-blue-500/20'
          }`}>
            {isApproved ? (
              <CheckCircle2 className="h-8 w-8" />
            ) : isRetry ? (
              <AlertOctagon className="h-8 w-8" />
            ) : (
              <ShieldAlert className="h-8 w-8" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                Final Decision Engine
              </span>
              <span className="text-xs font-mono text-slate-500">ID: {submissionId}</span>
            </div>
            <h2 className="text-xl font-extrabold text-white">
              {isApproved && 'KYC Successfully Auto-Approved'}
              {isRetry && 'User Retry Required (Issues Detected)'}
              {isReview && 'Queued for Ops Underwriter Review'}
              {status === 'OVERRIDDEN_APPROVED' && 'Approved via Risk Officer Override'}
              {status === 'OVERRIDDEN_REJECTED' && 'Rejected via Risk Officer Override'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-300">
              {isApproved && 'All deterministic OpenCV quality and compliance cross-checks passed with 100% confidence.'}
              {isRetry && 'Immediate resolution required. Review the diagnostic breakdown and retry guide below.'}
              {isReview && 'Document cross-match requires underwriting sign-off due to borderline similarity.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 md:justify-end">
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-right">
            <span className="block text-[10px] uppercase font-mono text-slate-400">Total Latency</span>
            <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-sky-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{latencies.total_ms.toFixed(1)} ms</span>
            </div>
          </div>

          {onViewInOps && (
            <button
              type="button"
              onClick={onViewInOps}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-all"
            >
              <span>View in Audit Log</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
