'use client';

import React from 'react';
import { useWallet } from '../lib/wallet-context';
import { ShieldCheck, Ghost, Zap, Loader2, CheckCircle2, Lock } from 'lucide-react';
import { CONTRACT_ADDRESS } from '../lib/contracts-config';

export const AppLoadingScreen: React.FC = () => {
  const { lang, theme, loadingProgress, loadingStatusText } = useWallet();

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 transition-colors duration-300 ${
      theme === 'light' ? 'bg-[#f8fafc] text-slate-900' : 'bg-[#020617] text-white'
    }`}>
      {/* Background glowing effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/60 dark:bg-slate-900/80 border border-slate-700/40 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
        
        {/* Brand Icon with Pulsing Halo */}
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 via-sky-500 to-indigo-600 flex items-center justify-center font-black text-white text-2xl shadow-lg shadow-sky-500/25 animate-bounce" style={{ animationDuration: '2s' }}>
            W
          </div>
          <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-indigo-600 opacity-40 blur-md animate-pulse" />
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white mb-1">
          Wealth<span className="text-sky-400">LifeCycle</span>
        </h2>
        <p className="text-xs font-medium text-slate-400 mb-6 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          {lang === 'th' ? 'ระบบผังเมทริกซ์ 100% On-Chain บน BSC' : '100% On-Chain Matrix Protocol on BSC'}
        </p>

        {/* Progress Bar Container */}
        <div className="w-full space-y-2 mb-6">
          <div className="w-full h-2.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div 
              className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-sm shadow-sky-400/50"
              style={{ width: `${Math.min(100, Math.max(10, loadingProgress))}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-sky-400">
              <Loader2 className="w-3 h-3 animate-spin text-sky-400" />
              {loadingStatusText || (lang === 'th' ? 'กำลังโหลดข้อมูล...' : 'Loading Data...')}
            </span>
            <span className="font-bold text-slate-300">{Math.round(loadingProgress)}%</span>
          </div>
        </div>

        {/* Status Checklist / Steps */}
        <div className="w-full space-y-2 text-left text-xs bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 font-mono">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              {loadingProgress >= 30 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
              )}
              {lang === 'th' ? 'เชื่อมต่อ Binance Smart Chain' : 'BNB Smart Chain Node'}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Mainnet (56)
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              {loadingProgress >= 70 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
              )}
              {lang === 'th' ? 'ดึงสถานะ Smart Contract' : 'Smart Contract Read'}
            </span>
            <span className="text-[10px] text-slate-400">
              {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 flex items-center gap-1.5">
              {loadingProgress >= 95 ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
              )}
              {lang === 'th' ? 'เตรียมพร้อมระบบ Matrix & Ghost' : 'Matrix & Ghost Protocol'}
            </span>
            <span className="text-[10px] text-purple-400 flex items-center gap-1">
              <Ghost className="w-3 h-3" /> Ready
            </span>
          </div>
        </div>

        {/* Security Footer Note */}
        <p className="mt-5 text-[10px] text-slate-400 flex items-center gap-1">
          <Lock className="w-3 h-3 text-slate-400" />
          {lang === 'th' ? 'กำลังโหลดข้อมูลที่ปลอดภัยและเป็นปัจจุบันที่สุด' : 'Loading verified live on-chain state'}
        </p>

      </div>
    </div>
  );
};
