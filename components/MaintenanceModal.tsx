'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/wallet-context';
import { BSC_CONFIG } from '../lib/contracts-config';
import { 
  Wrench, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  ExternalLink, 
  CheckCircle2, 
  X, 
  Sparkles, 
  RefreshCw,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';

interface MaintenanceModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  // If controlled externally; otherwise self-manages with sessionStorage/localStorage
}

export const MaintenanceModal: React.FC<MaintenanceModalProps> = ({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose
}) => {
  const { lang, theme, systemStatus } = useWallet();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Only check storage if not controlled from outside and currently in maintenance mode
    if (controlledIsOpen === undefined && systemStatus === 'maintenance') {
      try {
        const isDismissed = sessionStorage.getItem('wealthlifecycle_maintenance_dismissed');
        const dismissedUntil = localStorage.getItem('wealthlifecycle_maintenance_dismissed_until');
        const now = Date.now();
        if (!isDismissed && (!dismissedUntil || now > Number(dismissedUntil))) {
          const timer = setTimeout(() => setInternalIsOpen(true), 100);
          return () => clearTimeout(timer);
        }
      } catch {
        // Ignore
      }
    }
  }, [controlledIsOpen, systemStatus]);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : (systemStatus === 'maintenance' && internalIsOpen);

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('wealthlifecycle_maintenance_dismissed_until', String(Date.now() + 3600000 * 4)); // 4 hours
      } catch {
        // Ignore
      }
    }
    try {
      sessionStorage.setItem('wealthlifecycle_maintenance_dismissed', 'true');
    } catch {
      // Ignore
    }

    if (controlledOnClose) {
      controlledOnClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Background Glow effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[500px] h-96 sm:h-[500px] bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl" />
      </div>

      {/* Modal Dialog Card */}
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="maintenance_title"
        className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all my-auto duration-200 transform scale-100 ${
          theme === 'light'
            ? 'bg-white border-amber-300/80 text-slate-900 shadow-amber-500/10'
            : 'bg-slate-900/95 border-amber-500/40 text-slate-100 shadow-2xl shadow-slate-950/80 backdrop-blur-xl'
        }`}
      >
        {/* Top Decorative Ribbon */}
        <div className={`h-1.5 w-full ${
          systemStatus === 'online' 
            ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400' 
            : 'bg-gradient-to-r from-amber-500 via-orange-400 to-sky-400'
        }`} />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 text-slate-400 hover:text-white transition"
          aria-label="Close maintenance notice"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-5 sm:p-7">
          {/* Top Status & Icon */}
          <div className="flex items-start gap-3.5 mb-4">
            <div className={`relative p-3 rounded-2xl border shadow-lg shrink-0 ${
              systemStatus === 'online'
                ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10'
                : 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400 shadow-amber-500/10'
            }`}>
              {systemStatus === 'online' ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-400 animate-pulse" />
              ) : (
                <Wrench className="w-7 h-7 animate-bounce" style={{ animationDuration: '2.5s' }} />
              )}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  systemStatus === 'online' ? 'bg-emerald-400' : 'bg-amber-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  systemStatus === 'online' ? 'bg-emerald-500' : 'bg-amber-500'
                }`}></span>
              </span>
            </div>

            <div className="pr-6">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold font-mono uppercase tracking-wide mb-1.5 ${
                systemStatus === 'online'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
              }`}>
                {systemStatus === 'online' ? (
                  <>
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>{lang === 'th' ? 'ได้เปิดระบบให้ทุกท่านใช้งานแล้ว' : 'System Is Live'}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} />
                    <span>{lang === 'th' ? 'กำลังปรับปรุงระบบ' : 'System Maintenance'}</span>
                  </>
                )}
              </div>
              <h2 id="maintenance_title" className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                {systemStatus === 'online'
                  ? (lang === 'th' ? 'ได้เปิดระบบให้ทุกท่านใช้งานแล้ว' : 'System Is Live For Everyone')
                  : (lang === 'th' ? 'แจ้งดำเนินการปรับปรุงระบบ' : 'Temporary Maintenance Notice')}
              </h2>
            </div>
          </div>

          {/* Description */}
          <div className={`rounded-2xl border p-3.5 mb-4 ${
            systemStatus === 'online'
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : 'bg-amber-500/10 border-amber-500/20'
          }`}>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {systemStatus === 'online' ? (
                <>
                  <strong className="text-emerald-300 font-bold block mb-1">
                    {lang === 'th' ? '🎉 ยินดีต้อนรับสมาชิกทุกท่าน — เปิดให้บริการสมบูรณ์แล้ว' : '🎉 Welcome Everyone — Fully Operational'}
                  </strong>
                  {lang === 'th'
                    ? 'ขณะนี้ระบบได้ดำเนินการอัปเดตและปรับปรุงเสร็จสิ้นสมบูรณ์แล้ว ได้เปิดระบบให้ทุกท่านเข้าใช้งานได้ตามปกติ สมาชิกสามารถเชื่อมต่อกระเป๋า สมัครสมาชิก ผูกสายงาน ดูผังเมทริกซ์ และทำธุรกรรมบน Smart Contract ได้ 100%'
                    : 'System maintenance and upgrades are fully complete. The platform is now open for everyone to connect wallets, register, manage matrices, and execute smart contract transactions without restriction.'}
                </>
              ) : (
                <>
                  <strong className="text-amber-300 font-bold block mb-1">
                    {lang === 'th' ? 'ขออภัยในความไม่สะดวก' : 'We apologize for any inconvenience'}
                  </strong>
                  {lang === 'th'
                    ? 'ขณะนี้ทีมงานกำลังดำเนินการอัปเดตและปรับปรุงประสิทธิภาพระบบ Smart Contract, เครือข่ายเชื่อมต่อโหนด และระบบแสดงผล DApp เพื่อเพิ่มความเร็ว ความเสถียร และความปลอดภัยสูงสุด'
                    : 'Our engineering team is currently performing scheduled system maintenance and network node optimization to enhance transaction speed, stability, and platform reliability.'}
                </>
              )}
            </p>
          </div>

          {/* Upgrade Highlights */}
          <div className="space-y-2.5 mb-5 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-200 block">
                  {lang === 'th' ? '1. อัปเกรดความเร็ว BSC RPC Node' : '1. BSC RPC Node Optimization'}
                </span>
                <span className="text-[11px] text-slate-400 leading-normal">
                  {lang === 'th' 
                    ? 'ปรับปรุงช่องทางการรับส่งข้อมูลกับเครือข่าย BNB Smart Chain ให้รวดเร็วและแม่นยำยิ่งขึ้น' 
                    : 'Upgrading connectivity with BNB Smart Chain for instant on-chain transaction indexing.'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
              <Layers className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-200 block">
                  {lang === 'th' ? '2. ปรับจูนระบบผังเมทริกซ์และ Ghost Reborn' : '2. Matrix Tree & Ghost Reborn Engine'}
                </span>
                <span className="text-[11px] text-slate-400 leading-normal">
                  {lang === 'th' 
                    ? 'เสริมความลื่นไหลในการแสดงผลผัง Rank 1-3 และคิวสากล FIFO ให้ตอบสนองทันที' 
                    : 'Optimizing real-time visualizers for Rank 1-3 structures and automated FIFO queues.'}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-300 block">
                  {lang === 'th' ? '3. สินทรัพย์และบัญชียังคงปลอดภัย 100%' : '3. 100% Funds & Assets Security'}
                </span>
                <span className="text-[11px] text-emerald-200/80 leading-normal">
                  {lang === 'th' 
                    ? 'สัญญา Smart Contract ทำงานแบบ Non-Custodial ข้อมูลและเงินปันผลทั้งหมดยังคงอยู่ครบถ้วนและปลอดภัย' 
                    : 'All funds, user balances, and contract states are decentralized, safe, and immutable.'}
                </span>
              </div>
            </div>
          </div>

          {/* Status Note */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono py-2 px-3 rounded-xl bg-slate-950/40 border border-slate-800/60 mb-5">
            {systemStatus === 'online' ? (
              <>
                <div className="flex items-center gap-1.5 text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{lang === 'th' ? 'สถานะ: ได้เปิดระบบให้ทุกท่านใช้งานแล้ว (ONLINE)' : 'Status: Online (Active)'}</span>
                </div>
                <span className="text-emerald-400 font-bold">
                  {lang === 'th' ? 'เปิดใช้งานตามปกติ 100%' : '100% Operational'}
                </span>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'th' ? 'สถานะ: กำลังดำเนินการ (In Progress)' : 'Status: In Progress'}</span>
                </div>
                <span className="text-emerald-400 font-bold">
                  {lang === 'th' ? 'เสร็จสิ้นในเร็วๆ นี้' : 'Resuming Soon'}
                </span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <button
              onClick={handleClose}
              className={`w-full sm:flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm tracking-wide shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                systemStatus === 'online'
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/20 hover:shadow-emerald-500/40'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-amber-500/20 hover:shadow-amber-500/40'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{lang === 'th' ? 'เข้าสู่เว็บไซต์ทันที' : 'Enter Application'}</span>
            </button>

            <a
              href={BSC_CONFIG.contractExplorerUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs transition border border-slate-700 flex items-center justify-center gap-1.5"
            >
              <span>{lang === 'th' ? 'ตรวจสอบสัญญา BscScan' : 'Verify BscScan'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Checkbox: Don't show again */}
          <div className="mt-3.5 flex items-center justify-center gap-2">
            <label className="flex items-center gap-2 text-[11px] text-slate-400 hover:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <span>{lang === 'th' ? 'ไม่ต้องแสดงป๊อปอัปนี้อีกในเซสชันนี้' : 'Do not show again for this session'}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
