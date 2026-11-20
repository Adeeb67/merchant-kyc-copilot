'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  ExternalLink, 
  Check, 
  X,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { SubmissionItem, OpsStatsSummary, SubmissionStatus, ApplicantType } from '../types/kyc';
import { fetchSubmissions, fetchOpsStats, submitOverride } from '../lib/api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const OpsDashboard: React.FC = () => {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [stats, setStats] = useState<OpsStatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected submission for slide-over drawer
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  const [overrideNotes, setOverrideNotes] = useState<string>('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [subsData, statsData] = await Promise.all([
        fetchSubmissions(statusFilter, typeFilter, searchQuery),
        fetchOpsStats()
      ]);
      setSubmissions(subsData);
      setStats(statsData);
      if (selectedSub) {
        const updated = subsData.find(s => s.id === selectedSub.id);
        if (updated) setSelectedSub(updated);
      }
    } catch (err) {
      console.error('Failed to load ops data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [statusFilter, typeFilter, searchQuery]);

  const handleOverride = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedSub) return;
    try {
      setIsSubmittingOverride(true);
      const updated = await submitOverride(
        selectedSub.id,
        action,
        overrideNotes || `Manual ${action} by Underwriting Ops Officer.`,
        'Lead_Risk_Officer'
      );
      setSelectedSub(updated);
      await loadData();
    } catch (err) {
      console.error('Failed to submit override:', err);
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Ops Command Center</h1>
            <span className="inline-flex items-center rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
              Risk & Audit Engine
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time KYC verification stream, compliance auditing, and human-in-the-loop exception override.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-blue-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Verifications */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-slate-400 uppercase">Total Submissions</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats?.total_submissions ?? 0}</span>
            <span className="text-xs text-slate-400">runs</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Live verification queue volume</p>
        </div>

        {/* KPI 2: Auto-Approval Rate */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-slate-400 uppercase">Auto-Approval Rate</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">{stats?.auto_approval_rate_pct ?? 0}%</span>
            <span className="text-xs text-slate-400">STP rate</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Straight-through zero-touch approval</p>
        </div>

        {/* KPI 3: Avg Verification Time */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-slate-400 uppercase">Avg Verification Time</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{stats?.avg_total_latency_ms ? stats.avg_total_latency_ms.toFixed(0) : 0}</span>
            <span className="text-xs font-mono text-slate-400">ms</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            OpenCV: {stats?.avg_stage1_ms?.toFixed(0) ?? 0}ms • AI: {stats?.avg_stage2_ms?.toFixed(0) ?? 0}ms
          </p>
        </div>

        {/* KPI 4: Manual Review Hours Saved */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-slate-400 uppercase">Ops Hours Saved</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{stats?.manual_review_hours_saved ?? 0}</span>
            <span className="text-xs text-slate-400">hours</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">~15 mins saved per auto-approved KYC</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3 shadow-md backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono font-semibold text-slate-400 px-2 flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5" /> Filter Status:
          </span>
          {['ALL', 'AUTO_APPROVED', 'USER_RETRY_REQUIRED', 'OPS_MANUAL_REVIEW', 'OVERRIDDEN_APPROVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {st === 'ALL' ? 'All' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search ID, Name, PAN, GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-300 focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="company">Company</option>
            <option value="individual">Individual</option>
          </select>
        </div>
      </div>

      {/* Submissions Audit Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-mono uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3.5">Submission ID</th>
                <th className="px-4 py-3.5">Date & Time</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Merchant / Entity</th>
                <th className="px-4 py-3.5">PAN & GSTIN</th>
                <th className="px-4 py-3.5">Pipeline Stages</th>
                <th className="px-4 py-3.5">Latency</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    No KYC submissions match your query. Run a verification from the simulator to populate this stream.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => {
                  const isApproved = sub.status === 'AUTO_APPROVED' || sub.status === 'OVERRIDDEN_APPROVED';
                  const isRetry = sub.status === 'USER_RETRY_REQUIRED';
                  const isReview = sub.status === 'OPS_MANUAL_REVIEW';

                  return (
                    <tr 
                      key={sub.id} 
                      onClick={() => setSelectedSub(sub)}
                      className="cursor-pointer hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3.5 font-mono font-semibold text-blue-400">
                        {sub.id}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">
                        {sub.created_at ? new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          sub.applicant_type === 'company' 
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>
                          {sub.applicant_type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-white max-w-[180px] truncate">
                        {sub.merchant_name || 'Pending Extraction'}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        <div>PAN: <span className="text-rose-400">{sub.pan_number || '-'}</span></div>
                        <div>GST: <span className="text-sky-400">{sub.gstin || '-'}</span></div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {/* Stage 1 Chip */}
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                            sub.stage1?.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                          }`}>
                            S1:{sub.stage1?.passed ? 'OK' : 'FAIL'}
                          </span>
                          {/* Stage 2 Chip */}
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                            sub.stage2 ? 'bg-blue-500/10 text-blue-400' : 'bg-slate-800 text-slate-500'
                          }`}>
                            S2:{sub.stage2 ? 'OK' : '-'}
                          </span>
                          {/* Stage 3 Chip */}
                          <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                            sub.stage3?.passed ? 'bg-emerald-500/10 text-emerald-400' : sub.stage3 ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-500'
                          }`}>
                            S3:{sub.stage3?.passed ? 'OK' : sub.stage3 ? 'FAIL' : '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-400">
                        {sub.total_latency_ms.toFixed(0)} ms
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          isApproved 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : isRetry 
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {isApproved ? <CheckCircle2 className="h-3 w-3" /> : isRetry ? <XCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSub(sub);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
                        >
                          <span>Audit</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Inspection Drawer */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-950 border-l border-slate-800 p-6 overflow-y-auto shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-blue-400">{selectedSub.id}</span>
                  <span className="text-xs text-slate-500">|</span>
                  <span className="text-xs text-slate-400 uppercase font-mono">{selectedSub.applicant_type}</span>
                </div>
                <h2 className="text-lg font-bold text-white mt-0.5">
                  {selectedSub.merchant_name || 'KYC Audit Inspection'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSub(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Document Image Previews */}
            <div>
              <h4 className="text-xs font-mono font-semibold uppercase text-slate-400 mb-2">Uploaded Document Previews</h4>
              <div className="grid grid-cols-2 gap-3">
                {selectedSub.stage1 && Object.entries(selectedSub.stage1.metrics).map(([role, metric]) => (
                  <div key={role} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center">
                    <span className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
                      {role === 'pan' ? 'PAN Card' : role === 'gst' ? 'GST Certificate' : 'Cheque'}
                    </span>
                    <div className="relative h-28 rounded-lg border border-slate-800 bg-slate-950 overflow-hidden flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`${BASE_URL}/static/sample_docs/${metric.filename}`}
                        alt={metric.filename}
                        onError={(e) => {
                          // Try uploads folder if sample docs fail
                          (e.target as HTMLImageElement).src = `${BASE_URL}/static/uploads/${metric.filename}`;
                        }}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <span className="mt-1 text-[10px] font-mono text-slate-500 block truncate">
                      {metric.filename}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage 1 Diagnostics */}
            {selectedSub.stage1 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-mono font-semibold uppercase text-slate-300">Stage 1 OpenCV Quality Scores</h4>
                  <span className="text-xs font-mono text-blue-400">{selectedSub.stage1.latency_ms} ms</span>
                </div>
                <div className="space-y-2 text-xs">
                  {Object.entries(selectedSub.stage1.metrics).map(([role, m]) => (
                    <div key={role} className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-400 uppercase font-mono">{role}:</span>
                      <span className="text-slate-200">
                        Blur: <strong className={m.blur_passed ? 'text-emerald-400' : 'text-rose-400'}>{m.blur_score}</strong> | 
                        Glare: <strong className={m.glare_passed ? 'text-emerald-400' : 'text-rose-400'}>{(m.glare_ratio * 100).toFixed(1)}%</strong> | 
                        Framing: <strong className={m.framing_ok ? 'text-emerald-400' : 'text-amber-400'}>{m.framing_ok ? 'OK' : 'Warn'}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stage 2 Extracted JSON & Confidence */}
            {selectedSub.stage2 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-mono font-semibold uppercase text-slate-300">Stage 2 AI Extracted Entities</h4>
                  <span className="text-xs font-mono text-blue-400">{selectedSub.stage2.latency_ms} ms</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Extracted PAN:</span>
                    <span className="font-mono font-bold text-rose-400">{selectedSub.stage2.combined_pan || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Extracted GSTIN:</span>
                    <span className="font-mono font-bold text-sky-400">{selectedSub.stage2.combined_gstin || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Legal Entity Name:</span>
                    <span className="font-semibold text-slate-200">{selectedSub.stage2.combined_legal_name || 'None'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Stage 3 Compliance Rules Checks */}
            {selectedSub.stage3 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-mono font-semibold uppercase text-slate-300">Stage 3 Cross-Match Rules</h4>
                  <span className="text-xs font-mono text-blue-400">{selectedSub.stage3.latency_ms} ms</span>
                </div>
                <div className="space-y-2 text-xs">
                  {selectedSub.stage3.rule_checks.map((rule) => (
                    <div key={rule.rule_id} className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                      <span className="text-slate-400">{rule.rule_name}:</span>
                      <span className={`font-mono font-semibold ${rule.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {rule.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Nudge Display if any */}
            {selectedSub.user_nudge && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4">
                <span className="text-xs font-mono font-semibold text-amber-400 uppercase block mb-1">
                  Active User Retry Nudge
                </span>
                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                  {selectedSub.user_nudge}
                </p>
              </div>
            )}

            {/* Human-in-the-Loop Ops Override Action Box */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <ShieldAlert className="h-4 w-4 text-indigo-400" />
                <span>Human-in-the-Loop Ops Override</span>
              </h4>

              {selectedSub.override_status ? (
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3 text-xs">
                  <p className="font-semibold text-indigo-300">
                    Decision: {selectedSub.override_status} (by {selectedSub.override_by})
                  </p>
                  <p className="text-slate-400 mt-1">Notes: {selectedSub.override_notes}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400 block mb-1">
                      Reviewer Audit Notes / Justification:
                    </label>
                    <textarea
                      rows={2}
                      value={overrideNotes}
                      onChange={(e) => setOverrideNotes(e.target.value)}
                      placeholder="e.g., Manually verified partnership deed or exception waiver granted by risk director."
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={isSubmittingOverride}
                      onClick={() => handleOverride('APPROVE')}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      <span>One-Click Approve</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingOverride}
                      onClick={() => handleOverride('REJECT')}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 py-2.5 text-xs font-bold text-white shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      <span>One-Click Reject</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
