'use client';

import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Cpu, 
  Eye, 
  FileCheck2, 
  Check, 
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { VerificationResponse } from '../types/kyc';

interface PipelineTrackerProps {
  result: VerificationResponse;
}

export const PipelineTracker: React.FC<PipelineTrackerProps> = ({ result }) => {
  const { stage1, stage2, stage3, latencies } = result;

  return (
    <div className="space-y-6">
      {/* Stage 1: Deterministic OpenCV Quality Gate */}
      <div className={`rounded-2xl border transition-all ${
        stage1.passed 
          ? 'border-emerald-500/30 bg-slate-900/90' 
          : 'border-rose-500/40 bg-slate-900/90 shadow-lg shadow-rose-950/20'
      } p-5 backdrop-blur-sm`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              stage1.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">Stage 1</span>
                <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-400 border border-blue-500/20">
                  OpenCV • Zero AI Cost
                </span>
                {stage1.bypassed && (
                  <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/20">
                    Bypassed
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white">Deterministic Image Quality Gate</h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs font-mono text-slate-300">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span>{stage1.latency_ms.toFixed(1)} ms</span>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold ${
              stage1.passed 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}>
              {stage1.passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {stage1.passed ? 'PASSED' : 'REJECTED'}
            </span>
          </div>
        </div>

        {/* Diagnostic Metrics Per Document */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(stage1.metrics).map(([role, metric]) => {
            const roleName = role === 'pan' ? 'PAN Card' : role === 'gst' ? 'GST Certificate' : 'Cancelled Cheque';
            return (
              <div 
                key={role} 
                className={`rounded-xl border p-3.5 ${
                  metric.passed 
                    ? 'border-slate-800 bg-slate-950/60' 
                    : 'border-rose-500/30 bg-rose-950/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-white uppercase">{roleName}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    metric.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {metric.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {/* Blur Score */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Blur (Laplacian):</span>
                    <span className={`font-mono font-semibold ${metric.blur_passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {metric.blur_score.toFixed(1)} {metric.blur_passed ? '≥ 100' : '< 100'}
                    </span>
                  </div>

                  {/* Glare Ratio */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Glare / Overexposure:</span>
                    <span className={`font-mono font-semibold ${metric.glare_passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {(metric.glare_ratio * 100).toFixed(1)}% {metric.glare_passed ? '≤ 15%' : '> 15%'}
                    </span>
                  </div>

                  {/* Framing Check */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Border Framing:</span>
                    <span className={`font-semibold ${metric.framing_ok ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {metric.framing_ok ? 'Within Margin' : 'Border Touched'}
                    </span>
                  </div>
                </div>

                {metric.rejection_reasons.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-rose-500/20 text-[11px] text-rose-300">
                    {metric.rejection_reasons.map((r, idx) => (
                      <p key={idx}>• {r}</p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage 2: Multimodal Structured Extraction */}
      <div className={`rounded-2xl border transition-all ${
        !stage2 
          ? 'border-slate-800/60 bg-slate-900/40 opacity-75' 
          : 'border-blue-500/30 bg-slate-900/90'
      } p-5 backdrop-blur-sm`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              !stage2 ? 'bg-slate-800 text-slate-500' : 'bg-blue-500/10 text-blue-400'
            }`}>
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">Stage 2</span>
                <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-0.5 text-[11px] font-semibold text-indigo-400 border border-indigo-500/20">
                  Google Gemini 2.5 Flash
                </span>
                {stage2?.is_mock && (
                  <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                    Fallback Engine
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white">Multimodal Structured Extraction</h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs font-mono text-slate-300">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span>{stage2 ? `${stage2.latency_ms.toFixed(1)} ms` : '0.0 ms (Skipped)'}</span>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold ${
              !stage2 
                ? 'bg-slate-800 text-slate-400' 
                : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
            }`}>
              {!stage2 ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
              {!stage2 ? 'SKIPPED (0 COST)' : 'EXTRACTED'}
            </span>
          </div>
        </div>

        {stage2 ? (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(stage2.documents).map(([role, doc]) => {
              const roleTitle = role === 'pan' ? 'PAN Card Extraction' : role === 'gst' ? 'GSTIN Extraction' : 'Cheque Extraction';
              return (
                <div key={role} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                    <span className="text-xs font-semibold text-slate-200">{roleTitle}</span>
                    <span className="text-[10px] font-mono text-slate-400">{doc.document_type}</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    {/* PAN Field */}
                    {doc.pan_number && (
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">PAN Number:</span>
                          <span className="font-mono font-bold text-rose-400 tracking-wider">{doc.pan_number}</span>
                        </div>
                        {doc.field_confidence['pan_number'] && (
                          <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-slate-400">
                            <span>Confidence:</span>
                            <span className="text-emerald-400 font-semibold font-mono">
                              {(doc.field_confidence['pan_number'] * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* GSTIN Field */}
                    {doc.gstin && (
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">GSTIN:</span>
                          <span className="font-mono font-bold text-sky-400 tracking-wider">{doc.gstin}</span>
                        </div>
                        {doc.field_confidence['gstin'] && (
                          <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-slate-400">
                            <span>Confidence:</span>
                            <span className="text-emerald-400 font-semibold font-mono">
                              {(doc.field_confidence['gstin'] * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Legal / Applicant Name */}
                    {(doc.business_legal_name || doc.full_name) && (
                      <div className="pt-1 border-t border-slate-800/60">
                        <span className="text-slate-400 block mb-0.5">Entity / Name:</span>
                        <span className="font-semibold text-slate-200 block truncate">
                          {doc.business_legal_name || doc.full_name}
                        </span>
                      </div>
                    )}

                    {/* Bank / IFSC */}
                    {doc.bank_account_number && (
                      <div className="pt-1 border-t border-slate-800/60">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Account:</span>
                          <span className="font-mono text-slate-200">{doc.bank_account_number}</span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-slate-400">IFSC:</span>
                          <span className="font-mono font-semibold text-indigo-400">{doc.ifsc_code}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 text-center text-xs text-slate-400">
            Stage 2 AI extraction skipped because image quality gate failed. $0.00 API cost incurred.
          </div>
        )}
      </div>

      {/* Stage 3: Deterministic Compliance & Cross-Match Rules Engine */}
      <div className={`rounded-2xl border transition-all ${
        !stage3 
          ? 'border-slate-800/60 bg-slate-900/40 opacity-75' 
          : stage3.passed 
            ? 'border-emerald-500/30 bg-slate-900/90' 
            : 'border-amber-500/40 bg-slate-900/90 shadow-lg shadow-amber-950/20'
      } p-5 backdrop-blur-sm`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              !stage3 
                ? 'bg-slate-800 text-slate-500' 
                : stage3.passed 
                  ? 'bg-emerald-500/10 text-emerald-400' 
                  : 'bg-amber-500/10 text-amber-400'
            }`}>
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">Stage 3</span>
                <span className="inline-flex items-center rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold text-purple-400 border border-purple-500/20">
                  Compliance & Cross-Match Engine
                </span>
              </div>
              <h3 className="text-base font-bold text-white">Deterministic Rules Verification</h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs font-mono text-slate-300">
              <Clock className="h-3.5 w-3.5 text-blue-400" />
              <span>{stage3 ? `${stage3.latency_ms.toFixed(1)} ms` : '0.0 ms (Skipped)'}</span>
            </div>
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold ${
              !stage3 
                ? 'bg-slate-800 text-slate-400' 
                : stage3.passed 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
            }`}>
              {!stage3 ? <XCircle className="h-3.5 w-3.5" /> : stage3.passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              {!stage3 ? 'SKIPPED' : stage3.passed ? 'PASSED' : 'REJECTED'}
            </span>
          </div>
        </div>

        {stage3 ? (
          <div className="mt-4 space-y-2.5">
            {stage3.rule_checks.map((rule) => (
              <div 
                key={rule.rule_id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border p-3 ${
                  rule.passed 
                    ? 'border-slate-800/80 bg-slate-950/60' 
                    : 'border-rose-500/30 bg-rose-950/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                    rule.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {rule.passed ? <Check className="h-3 w-3 stroke-[3]" /> : <XCircle className="h-3 w-3 stroke-[2.5]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{rule.rule_name}</span>
                      <span className="text-[10px] font-mono text-slate-400">({rule.rule_id})</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{rule.details}</p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end gap-1 text-right pl-8 sm:pl-0">
                  <span className={`text-xs font-mono font-bold ${rule.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {rule.passed ? 'VERIFIED' : 'MISMATCH'}
                  </span>
                  {rule.actual && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {rule.actual}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-slate-800/60 bg-slate-950/40 p-4 text-center text-xs text-slate-400">
            Stage 3 Compliance rules engine skipped due to prior stage rejection.
          </div>
        )}
      </div>
    </div>
  );
};
