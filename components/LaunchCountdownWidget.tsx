'use client';

import React from 'react';
import { useLaunchCountdown } from '../lib/launch-config';
import { Clock, Sparkles, Lock, Unlock, Rocket } from 'lucide-react';

interface LaunchCountdownWidgetProps {
  lang?: 'th' | 'en';
  variant?: 'hero' | 'card' | 'compact' | 'inline';
}

export const LaunchCountdownWidget: React.FC<LaunchCountdownWidgetProps> = ({ 
  lang = 'th', 
  variant = 'card' 
}) => {
  const { 
    days, 
    hours, 
    minutes, 
    seconds, 
    isLaunched, 
    formattedCountdown,
    launchDateFormattedTh,
    launchDateFormattedEn,
  } = useLaunchCountdown();

  // If already reached launch time
  if (isLaunched) {
    if (variant === 'compact' || variant === 'inline') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs">
          <Rocket className="w-3 h-3 text-emerald-400 animate-bounce" />
          <span>{lang === 'th' ? '🚀 เปิดรับสมัครแล้ว!' : '🚀 Registration Open!'}</span>
        </span>
      );
    }

    return (
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-teal-950/80 border border-emerald-500/50 shadow-xl shadow-emerald-500/10 flex items-center justify-between gap-3 animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 shrink-0">
            <Unlock className="w-5 h-5" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold mb-0.5">
              <Sparkles className="w-3 h-3 text-emerald-300" />
              <span>{lang === 'th' ? 'OFFICIAL LAUNCH LIVE' : 'LIVE NOW'}</span>
            </div>
            <p className="text-white font-extrabold text-xs sm:text-sm">
              {lang === 'th' ? 'ระบบเปิดรับสมัครอย่างเป็นทางการแล้ว พร้อมเข้าสู่ผัง Matrix ทันที' : 'Official registration is now LIVE. Join Matrix nodes now!'}
            </p>
          </div>
        </div>
        <div className="shrink-0 hidden sm:block">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs">
            {lang === 'th' ? 'เปิดระบบแล้ว' : 'ACTIVE'}
          </span>
        </div>
      </div>
    );
  }

  // Inline / Compact badge
  if (variant === 'inline') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold">
        <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
        <span>{formattedCountdown}</span>
      </span>
    );
  }

  // Compact variant for headers / buttons
  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-amber-500/40 text-amber-200 shadow-md">
        <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span className="text-[11px] font-bold text-slate-300">
          {lang === 'th' ? 'เปิดรับสมัคร:' : 'Launch:'}
        </span>
        <span className="font-mono font-black text-amber-300 text-xs tracking-wider">
          {formattedCountdown}
        </span>
      </div>
    );
  }

  // Hero variant
  if (variant === 'hero') {
    return (
      <div className="max-w-xl mx-auto mb-6 p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-slate-900/95 via-slate-950/90 to-slate-900/95 border border-amber-500/40 shadow-2xl shadow-amber-500/10 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div className="text-left">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
                <Lock className="w-2.5 h-2.5" />
                {lang === 'th' ? 'นับถอยหลังสู่การเปิดตัว (Official Launch)' : 'Official Launch Countdown'}
              </div>
              <p className="text-xs font-bold text-white mt-0.5">
                {lang === 'th' ? `เปิดรับสมัครพร้อมกัน: ${launchDateFormattedTh}` : `Launch Date: ${launchDateFormattedEn}`}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-slate-950 border border-slate-700 text-slate-400">
            30/08 13:09 ICT
          </span>
        </div>

        {/* Digit Boxes */}
        <div className="grid grid-cols-4 gap-2 pt-3">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-center shadow-inner">
            <span className="block font-mono font-black text-lg sm:text-2xl text-amber-300 leading-none">
              {days.toString().padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mt-1 block">
              {lang === 'th' ? 'วัน' : 'Days'}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-center shadow-inner">
            <span className="block font-mono font-black text-lg sm:text-2xl text-amber-300 leading-none">
              {hours.toString().padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mt-1 block">
              {lang === 'th' ? 'ชั่วโมง' : 'Hours'}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-center shadow-inner">
            <span className="block font-mono font-black text-lg sm:text-2xl text-amber-300 leading-none">
              {minutes.toString().padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mt-1 block">
              {lang === 'th' ? 'นาที' : 'Mins'}
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-950/90 border border-amber-500/30 text-center shadow-inner bg-amber-500/5">
            <span className="block font-mono font-black text-lg sm:text-2xl text-amber-400 leading-none animate-pulse">
              {seconds.toString().padStart(2, '0')}
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold text-amber-400 uppercase mt-1 block">
              {lang === 'th' ? 'วินาที' : 'Secs'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Default 'card' variant for registration sections
  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-amber-950/30 via-slate-950/80 to-slate-950/95 border border-amber-500/40 shadow-xl shadow-amber-500/5 mb-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Clock className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">
                {lang === 'th' ? 'กำหนดการเปิดรับสมัครอย่างเป็นทางการ' : 'Official Launch Schedule'}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold">
                30 ส.ค. 13:09 น.
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {lang === 'th' 
                ? 'ปุ่มสมัครจะเปิดให้ทำธุรกรรมบน Smart Contract เมื่อถึงเวลา 13:09 น.' 
                : 'Smart Contract registration button unlocks automatically at 13:09 (UTC+7)'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 pt-3">
        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
          <span className="block font-mono font-black text-base sm:text-xl text-amber-300 leading-none">
            {days.toString().padStart(2, '0')}
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 block">
            {lang === 'th' ? 'วัน' : 'Days'}
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
          <span className="block font-mono font-black text-base sm:text-xl text-amber-300 leading-none">
            {hours.toString().padStart(2, '0')}
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 block">
            {lang === 'th' ? 'ชม.' : 'Hrs'}
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-center">
          <span className="block font-mono font-black text-base sm:text-xl text-amber-300 leading-none">
            {minutes.toString().padStart(2, '0')}
          </span>
          <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 block">
            {lang === 'th' ? 'นาที' : 'Min'}
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-900/90 border border-amber-500/30 text-center bg-amber-500/5">
          <span className="block font-mono font-black text-base sm:text-xl text-amber-400 leading-none animate-pulse">
            {seconds.toString().padStart(2, '0')}
          </span>
          <span className="text-[9px] text-amber-400 font-bold uppercase mt-1 block">
            {lang === 'th' ? 'วินาที' : 'Sec'}
          </span>
        </div>
      </div>
    </div>
  );
};
