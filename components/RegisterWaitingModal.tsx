'use client';

import React, { useEffect, useState } from 'react';
import { useWallet } from '../lib/wallet-context';
import { BSC_CONFIG } from '../lib/contracts-config';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Coins, 
  Layers, 
  Lock, 
  X, 
  Check,
  Copy,
  Clock
} from 'lucide-react';

export const RegisterWaitingModal: React.FC = () => {
  const { 
    registrationModal, 
    closeRegistrationModal, 
    lang, 
    theme, 
    setActiveTab 
  } = useWallet();

  const [copiedTx, setCopiedTx] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Auto-countdown to close on success
  useEffect(() => {
    if (!registrationModal?.isOpen || registrationModal.status !== 'success') {
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          closeRegistrationModal();
          setActiveTab('dashboard');
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [registrationModal?.isOpen, registrationModal?.status, closeRegistrationModal, setActiveTab]);

  if (!registrationModal || !registrationModal.isOpen) return null;

  const { status, title, stepText, txHash, sponsorId, newUserId, errorMessage } = registrationModal;

  const handleCopyTx = () => {
    if (!txHash) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(txHash);
        setCopiedTx(true);
        setTimeout(() => setCopiedTx(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const handleGoToDashboard = () => {
    closeRegistrationModal();
    setActiveTab('dashboard');
  };

  // Determine current active step (1..4)
  let currentStep = 1;
  if (status === 'approving') currentStep = 2;
  else if (status === 'submitting' || status === 'waiting_block') currentStep = 3;
  else if (status === 'success') currentStep = 4;

  const steps = [
    {
      num: 1,
      titleTh: 'ตรวจสอบข้อมูล',
      titleEn: 'Check Info',
      descTh: 'ตรวจสอบเครือข่าย BSC & ยอดเงิน USDT',
      descEn: 'Verifying BSC chain & USDT balance'
    },
    {
      num: 2,
      titleTh: 'อนุมัติ USDT (ครั้งเดียว)',
      titleEn: 'USDT Allowance',
      descTh: 'อนุญาต Smart Contract ใช้งาน USDT',
      descEn: 'Approve USDT contract allowance'
    },
    {
      num: 3,
      titleTh: 'บันทึกบนบล็อกเชน',
      titleEn: 'Blockchain Mint',
      descTh: 'ยืนยันธุรกรรมและบันทึกลงบล็อกเชน',
      descEn: 'Confirming transaction on BNB Chain'
    },
    {
      num: 4,
      titleTh: 'จัดผังและเปิดรหัส',
      titleEn: 'Matrix Placed',
      descTh: 'สร้างรหัสสมาชิกและรับโบนัสเข้าผัง',
      descEn: 'Assigned User ID & placed in Matrix'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all transform animate-scale-up ${
          theme === 'light' 
            ? 'bg-white border-slate-200 text-slate-900 shadow-sky-500/10' 
            : 'bg-slate-900/95 border-slate-800 text-white shadow-sky-500/20'
        }`}
      >
        {/* Ambient Top Glow Bar */}
        <div className={`h-2 w-full ${
          status === 'error' 
            ? 'bg-rose-500' 
            : status === 'success'
              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500'
              : 'bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 animate-pulse'
        }`} />

        {/* Close button for Error or Success */}
        {(status === 'error' || status === 'success') && (
          <button
            onClick={closeRegistrationModal}
            className={`absolute top-4 right-4 p-2 rounded-xl border transition ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Header Section with Animated Icon */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              {status === 'success' ? (
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20 animate-bounce">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
              ) : status === 'error' ? (
                <div className="w-20 h-20 rounded-3xl bg-rose-500/20 border-2 border-rose-500/40 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/20">
                  <AlertCircle className="w-10 h-10 text-rose-400" />
                </div>
              ) : (
                <div className="relative w-20 h-20 rounded-3xl bg-sky-500/20 border-2 border-sky-500/40 flex items-center justify-center text-sky-400 shadow-xl shadow-sky-500/20">
                  <div className="absolute inset-0 rounded-3xl border border-sky-400/30 animate-ping" />
                  <Loader2 className="w-10 h-10 text-sky-400 animate-spin" />
                </div>
              )}
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold mb-2 bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                {status === 'success' 
                  ? (lang === 'th' ? 'สมัครสมาชิกสำเร็จ' : 'Registration Completed') 
                  : status === 'error'
                    ? (lang === 'th' ? 'เกิดข้อผิดพลาด' : 'Registration Failed')
                    : (lang === 'th' ? 'ระบบกำลังดำเนินการ' : 'Processing On-Chain')}
              </div>
              
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                {title || (lang === 'th' ? 'กรุณารอผลสักครู่' : 'Please wait a moment...')}
              </h3>
              
              <p className={`text-sm mt-1 max-w-sm mx-auto leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
                {stepText || (lang === 'th' 
                  ? 'กำลังส่งข้อมูลและบันทึกลง Smart Contract บน BSC...' 
                  : 'Submitting transaction to BNB Smart Chain Smart Contract...')}
              </p>
            </div>
          </div>

          {/* New ID Banner (When Success) */}
          {status === 'success' && newUserId && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-500/40 text-center space-y-1">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                {lang === 'th' ? '✨ รหัสสมาชิกของคุณคือ' : '✨ Your New Member ID'}
              </div>
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">
                #{newUserId}
              </div>
              <div className="text-xs text-emerald-300/80">
                {lang === 'th' ? `ผู้แนะนำ: #${sponsorId || 1} • บรรจุลงผัง Rank 1 อัตโนมัติ` : `Sponsor: #${sponsorId || 1} • Placed in Rank 1 Matrix`}
              </div>
            </div>
          )}

          {/* Progress Tracker Steps (When Pending) */}
          {status !== 'error' && (
            <div className={`p-4 rounded-2xl border space-y-3 ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                <span>{lang === 'th' ? 'ขั้นตอนการสมัครสมาชิก' : 'Registration Steps'}</span>
                <span className="font-mono text-sky-400">{Math.min(currentStep, 4)} / 4</span>
              </div>

              <div className="space-y-2.5">
                {steps.map((s) => {
                  const isDone = currentStep > s.num || status === 'success';
                  const isCurrent = currentStep === s.num && status !== 'success';
                  
                  return (
                    <div 
                      key={s.num}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                        isDone 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : isCurrent
                            ? 'bg-sky-500/10 border-sky-500/40 text-sky-300 ring-1 ring-sky-500/30'
                            : 'bg-slate-900/20 border-transparent text-slate-500 opacity-60'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black font-mono shrink-0 ${
                        isDone 
                          ? 'bg-emerald-500 text-slate-950'
                          : isCurrent
                            ? 'bg-sky-500 text-slate-950 animate-pulse'
                            : 'bg-slate-800 text-slate-400'
                      }`}>
                        {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : isCurrent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : s.num}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold truncate">
                          {lang === 'th' ? s.titleTh : s.titleEn}
                        </div>
                        <div className="text-[11px] opacity-80 truncate">
                          {lang === 'th' ? s.descTh : s.descEn}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Message Box */}
          {status === 'error' && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2 text-xs">
              <div className="font-bold flex items-center gap-1.5 text-rose-400">
                <AlertCircle className="w-4 h-4" />
                <span>{lang === 'th' ? 'รายละเอียดข้อผิดพลาด' : 'Error Details'}</span>
              </div>
              <p className="leading-relaxed font-mono break-words bg-slate-950/40 p-2.5 rounded-xl border border-rose-500/20">
                {errorMessage || (lang === 'th' ? 'การทำธุรกรรมถูกยกเลิกหรือไม่สำเร็จ' : 'Transaction was rejected or failed.')}
              </p>
            </div>
          )}

          {/* Tx Hash on BSCScan */}
          {txHash && (
            <div className={`p-3 rounded-2xl border flex items-center justify-between gap-2 text-xs ${
              theme === 'light' ? 'bg-slate-100 border-slate-300' : 'bg-slate-800/80 border-slate-700'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="truncate">
                  <span className="text-slate-400 font-mono text-[10px] block">BSC Tx Hash</span>
                  <span className="font-mono text-sky-400 font-bold truncate">{txHash.slice(0, 14)}...{txHash.slice(-8)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleCopyTx}
                  className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition"
                  title="Copy Tx Hash"
                >
                  {copiedTx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <a
                  href={`${BSC_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[11px] flex items-center gap-1 transition font-bold"
                >
                  <span>BscScan</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2">
            {status === 'success' ? (
              <button
                onClick={handleGoToDashboard}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-98 transition cursor-pointer"
              >
                <span>{lang === 'th' ? `เข้าสู่แดชบอร์ดทันที (${countdown}s)` : `Go to Dashboard (${countdown}s)`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : status === 'error' ? (
              <button
                onClick={closeRegistrationModal}
                className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
              >
                <span>{lang === 'th' ? 'ปิดหน้าต่าง' : 'Close'}</span>
              </button>
            ) : (
              <div className="text-center py-1">
                <div className="inline-flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <span>{lang === 'th' ? 'กรุณาอย่าปิดหน้านี้ ระบบกำลังทำงานอัตโนมัติ' : 'Please do not close this window while processing'}</span>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
