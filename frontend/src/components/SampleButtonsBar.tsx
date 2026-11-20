'use client';

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, AlertOctagon, UserCheck, Loader2 } from 'lucide-react';
import { fetchSampleFile } from '../lib/api';
import { ApplicantType } from '../types/kyc';

interface SampleButtonsBarProps {
  onLoadSample: (
    pan: File,
    gst: File,
    cheque: File | null,
    applicantType: ApplicantType,
    sampleName: string
  ) => void;
  isLoading: boolean;
}

export const SampleButtonsBar: React.FC<SampleButtonsBarProps> = ({ onLoadSample, isLoading }) => {
  const [loadingSample, setLoadingSample] = useState<string | null>(null);

  const handleSelectSample = async (sampleType: 'valid' | 'blurry' | 'mismatch' | 'individual' | 'glare') => {
    try {
      setLoadingSample(sampleType);
      if (sampleType === 'valid') {
        const pan = await fetchSampleFile('valid_company_pan.png');
        const gst = await fetchSampleFile('valid_company_gst.png');
        const cheque = await fetchSampleFile('valid_cancelled_cheque.png');
        onLoadSample(pan, gst, cheque, 'company', 'Valid Corporate Sample');
      } else if (sampleType === 'blurry') {
        const pan = await fetchSampleFile('blurry_pan_sample.png');
        const gst = await fetchSampleFile('valid_company_gst.png');
        onLoadSample(pan, gst, null, 'company', 'Blurry PAN Sample');
      } else if (sampleType === 'mismatch') {
        const pan = await fetchSampleFile('valid_company_pan.png');
        const gst = await fetchSampleFile('mismatch_gst_sample.png');
        onLoadSample(pan, gst, null, 'company', 'PAN-GST Mismatch Sample');
      } else if (sampleType === 'individual') {
        const pan = await fetchSampleFile('valid_individual_pan.png');
        const gst = await fetchSampleFile('valid_individual_gst.png');
        onLoadSample(pan, gst, null, 'individual', 'Valid Individual Sample');
      } else if (sampleType === 'glare') {
        const pan = await fetchSampleFile('glare_pan_sample.png');
        const gst = await fetchSampleFile('valid_company_gst.png');
        onLoadSample(pan, gst, null, 'company', 'Overexposed Glare Sample');
      }
    } catch (err) {
      console.error('Error loading sample preset:', err);
    } finally {
      setLoadingSample(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-white">1-Click Live Test Presets</span>
          <span className="text-xs text-slate-400 hidden md:inline">
            (No real KYC IDs needed — instant synthetic test cases)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Preset 1: Valid Sample */}
        <button
          type="button"
          onClick={() => handleSelectSample('valid')}
          disabled={isLoading || loadingSample !== null}
          className="group relative flex flex-col items-start rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 text-left transition-all hover:bg-emerald-950/40 hover:border-emerald-500/60 disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Load Valid Sample
            </span>
            {loadingSample === 'valid' && <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />}
          </div>
          <p className="mt-1 text-[11px] text-slate-300">
            Matching Company PAN & GSTIN (Auto-Approved)
          </p>
        </button>

        {/* Preset 2: Blurry PAN */}
        <button
          type="button"
          onClick={() => handleSelectSample('blurry')}
          disabled={isLoading || loadingSample !== null}
          className="group relative flex flex-col items-start rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-left transition-all hover:bg-amber-950/40 hover:border-amber-500/60 disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              Load Blurry PAN Sample
            </span>
            {loadingSample === 'blurry' && <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />}
          </div>
          <p className="mt-1 text-[11px] text-slate-300">
            Fails Stage 1 OpenCV Blur (&lt; 100.0, Zero AI Cost)
          </p>
        </button>

        {/* Preset 3: PAN-GST Mismatch */}
        <button
          type="button"
          onClick={() => handleSelectSample('mismatch')}
          disabled={isLoading || loadingSample !== null}
          className="group relative flex flex-col items-start rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-left transition-all hover:bg-rose-950/40 hover:border-rose-500/60 disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
              <AlertOctagon className="h-3.5 w-3.5" />
              Load PAN-GST Mismatch
            </span>
            {loadingSample === 'mismatch' && <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-400" />}
          </div>
          <p className="mt-1 text-[11px] text-slate-300">
            Passes Stage 1 & 2; Fails Stage 3 Cross-Check
          </p>
        </button>

        {/* Preset 4: Individual KYC */}
        <button
          type="button"
          onClick={() => handleSelectSample('individual')}
          disabled={isLoading || loadingSample !== null}
          className="group relative flex flex-col items-start rounded-xl border border-sky-500/30 bg-sky-950/20 p-3 text-left transition-all hover:bg-sky-950/40 hover:border-sky-500/60 disabled:opacity-50"
        >
          <div className="flex items-center justify-between w-full">
            <span className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
              <UserCheck className="h-3.5 w-3.5" />
              Load Individual Flow
            </span>
            {loadingSample === 'individual' && <Loader2 className="h-3.5 w-3.5 animate-spin text-sky-400" />}
          </div>
          <p className="mt-1 text-[11px] text-slate-300">
            Proprietor PAN (4th char &apos;P&apos;) + Match GSTIN
          </p>
        </button>
      </div>
    </div>
  );
};
