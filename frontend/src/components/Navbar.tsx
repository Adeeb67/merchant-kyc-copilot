'use client';

import React from 'react';
import { ShieldCheck, Zap, Users, Cpu, Activity } from 'lucide-react';

interface NavbarProps {
  activeTab: 'simulator' | 'ops';
  setActiveTab: (tab: 'simulator' | 'ops') => void;
  mockMode?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, mockMode = true }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 p-2 shadow-lg shadow-blue-500/20">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white text-lg">KycCopilot</span>
              <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400 border border-blue-500/20">
                India FinTech
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Autonomous PAN + GST + Cheque Cross-Verification
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-slate-800 shadow-inner">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'simulator'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>Merchant Simulator</span>
          </button>
          <button
            onClick={() => setActiveTab('ops')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === 'ops'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Ops Command Center</span>
          </button>
        </div>

        {/* System Status Pill */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Cpu className="h-3.5 w-3.5 text-slate-400" />
            <span>OpenCV + Gemini 2.5 Flash</span>
          </div>
        </div>
      </div>
    </header>
  );
};
