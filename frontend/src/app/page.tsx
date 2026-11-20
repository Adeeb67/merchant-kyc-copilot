'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Zap, 
  RotateCcw,
  Sliders,
  Check
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { Dropzone } from '../components/Dropzone';
import { SampleButtonsBar } from '../components/SampleButtonsBar';
import { PipelineTracker } from '../components/PipelineTracker';
import { UserNudgeCard } from '../components/UserNudgeCard';
import { VerdictBanner } from '../components/VerdictBanner';
import { OpsDashboard } from '../components/OpsDashboard';
import { submitKYCVerification } from '../lib/api';
import { ApplicantType, VerificationResponse } from '../types/kyc';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'ops'>('simulator');
  const [applicantType, setApplicantType] = useState<ApplicantType>('company');
  
  // File uploads state
  const [panFile, setPanFile] = useState<File | null>(null);
  const [gstFile, setGstFile] = useState<File | null>(null);
  const [chequeFile, setChequeFile] = useState<File | null>(null);
  const [bypassQualityGate, setBypassQualityGate] = useState<boolean>(false);
  const [selectedSampleName, setSelectedSampleName] = useState<string | null>(null);

  // Pipeline execution state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoadSample = (
    pan: File,
    gst: File,
    cheque: File | null,
    type: ApplicantType,
    sampleName: string
  ) => {
    setPanFile(pan);
    setGstFile(gst);
    setChequeFile(cheque);
    setApplicantType(type);
    setSelectedSampleName(sampleName);
    setVerificationResult(null);
    setErrorMessage(null);
  };

  const handleVerify = async () => {
    if (!panFile || !gstFile) {
      setErrorMessage('Please upload both mandatory documents: PAN Card and GST Registration Certificate.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const res = await submitKYCVerification(
        panFile,
        gstFile,
        chequeFile,
        applicantType,
        bypassQualityGate
      );
      setVerificationResult(res);
    } catch (err: any) {
      console.error('Verification failed:', err);
      setErrorMessage(err.message || 'Verification pipeline encountered a network error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setPanFile(null);
    setGstFile(null);
    setChequeFile(null);
    setSelectedSampleName(null);
    setVerificationResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100 flex flex-col font-sans">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'simulator' ? (
          <div className="space-y-8 animate-fade-in">
            {/* Header & Subtitle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-blue-400">
                    Merchant Onboarding Simulator
                  </span>
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  Autonomous Indian KYC Copilot
                </h1>
                <p className="mt-1 text-sm text-slate-400 max-w-2xl">
                  Cross-verify PAN Card, GSTIN Registration Certificate, and Bank Cheque with OpenCV deterministic quality gates and Gemini 2.5 Flash structured multimodal intelligence.
                </p>
              </div>

              {/* Applicant Type Selector */}
              <div className="flex items-center rounded-2xl bg-slate-900 border border-slate-800 p-1.5 shadow-inner">
                <button
                  type="button"
                  onClick={() => setApplicantType('company')}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    applicantType === 'company'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span>Company / Corporate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setApplicantType('individual')}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    applicantType === 'individual'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Individual / Proprietor</span>
                </button>
              </div>
            </div>

            {/* 1-Click Sample Buttons Bar */}
            <SampleButtonsBar onLoadSample={handleLoadSample} isLoading={isSubmitting} />

            {selectedSampleName && (
              <div className="flex items-center justify-between rounded-xl bg-blue-500/10 border border-blue-500/30 px-4 py-2.5 text-xs text-blue-300">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-400" />
                  <span>Active Preset: <strong>{selectedSampleName}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="font-medium text-slate-400 hover:text-white underline underline-offset-2"
                >
                  Clear Selection
                </button>
              </div>
            )}

            {/* Upload Dropzones */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* PAN Dropzone */}
              <Dropzone
                label="PAN Card Image"
                sublabel="Govt. of India Permanent Account Number card"
                required={true}
                file={panFile}
                onFileSelect={(f) => {
                  setPanFile(f);
                  setVerificationResult(null);
                }}
                documentRole="pan"
              />

              {/* GSTIN Dropzone */}
              <Dropzone
                label="GST Certificate"
                sublabel="Form GST REG-06 Registration Certificate"
                required={true}
                file={gstFile}
                onFileSelect={(f) => {
                  setGstFile(f);
                  setVerificationResult(null);
                }}
                documentRole="gst"
              />

              {/* Cheque Dropzone */}
              <Dropzone
                label="Cancelled Cheque"
                sublabel="Bank account & IFSC verification leaf"
                required={false}
                file={chequeFile}
                onFileSelect={(f) => {
                  setChequeFile(f);
                  setVerificationResult(null);
                }}
                documentRole="cheque"
              />
            </div>

            {/* Action Bar & Bypass Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={bypassQualityGate}
                    onChange={(e) => setBypassQualityGate(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Bypass OpenCV Quality Gate</span>
                  <span className="text-[11px] text-slate-500 block">For test benchmarking blurry or glare edge cases downstream</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {(panFile || gstFile || chequeFile) && (
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-900 transition-all"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isSubmitting || !panFile || !gstFile}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:from-blue-500 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Running Pipeline...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      <span>Verify Merchant KYC</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Verification Results Display */}
            {verificationResult && (
              <div className="space-y-6 pt-4 border-t border-slate-800/80 animate-fade-in">
                {/* 1. Verdict Banner */}
                <VerdictBanner
                  status={verificationResult.status}
                  submissionId={verificationResult.submission_id}
                  latencies={verificationResult.latencies}
                  applicantType={verificationResult.applicant_type}
                  onViewInOps={() => setActiveTab('ops')}
                />

                {/* 2. User Retry Nudge Card if rejected */}
                {verificationResult.user_nudge && (
                  <UserNudgeCard 
                    nudge={verificationResult.user_nudge} 
                    onRetryClick={handleReset}
                  />
                )}

                {/* 3. Real-Time Multi-Stage Pipeline Tracker */}
                <PipelineTracker result={verificationResult} />
              </div>
            )}
          </div>
        ) : (
          <div className="animate-fade-in">
            <OpsDashboard />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <p>
          Merchant KYC & Document Verification Copilot • Built for Indian FinTech Onboarding (PAN + GSTIN + Cheque)
        </p>
      </footer>
    </div>
  );
}
