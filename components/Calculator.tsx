'use client';

import React, { useState } from 'react';
import { useWallet } from '../lib/wallet-context';
import { Calculator as CalcIcon, TrendingUp, DollarSign, Users, Repeat, Award, Ghost, Sparkles } from 'lucide-react';

export const Calculator: React.FC = () => {
  const { lang, t, setActiveTab } = useWallet();

  const [directReferrals, setDirectReferrals] = useState<number>(4);
  const [rank2Cycles, setRank2Cycles] = useState<number>(2);
  const [rank3Cycles, setRank3Cycles] = useState<number>(1);

  // Calculations based on updated 3-Rank Plans
  const directIncome = directReferrals * 0.20; // 10% Direct Bonus
  const rank1Cycles = Math.floor(directReferrals / 4);
  const rank1Income = (rank1Cycles * 1.20) + (directReferrals % 4 >= 1 ? 0.60 : 0) + (directReferrals % 4 >= 2 ? 0.60 : 0); // 30% per slot 1 & 2
  const rank2Income = rank2Cycles * 4.00; // 2 slots x 2.00 USDT (50%) = 4.00 USDT per cycle
  const rank3Income = rank3Cycles * 8.00; // Slot 2 = 100% Cash ($8.00) per cycle
  const totalIncome = directIncome + rank1Income + rank2Income + rank3Income;

  const cost = 2.0; // Initial 2 USDT
  const netProfit = totalIncome - cost;
  const roi = (totalIncome / cost) * 100;
  // Rank 3 spawns 4 to R1 + 4 to R2 (= 8 Ghosts); Rank 2 slot 2 spawns 1 Ghost
  const ghostsSpawned = (rank3Cycles * 8) + (rank2Cycles * 1);
  const realReborns = (rank3Cycles * 1) + (rank1Cycles * 1);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
            <CalcIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              {t.calcTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              {t.calcSub}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sliders & Controls */}
        <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6">
          <h3 className="font-bold text-sm text-white uppercase tracking-wider text-slate-400">
            {lang === 'th' ? 'ปรับแต่งตัวแปรการเติบโต' : 'Adjust Matrix Parameters'}
          </h3>

          {/* Slider 1: Direct Referrals */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                {t.calcDirectReferrals}
              </span>
              <span className="text-sm font-bold font-mono text-sky-400">
                {directReferrals} {lang === 'th' ? 'คน' : 'People'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={directReferrals}
              onChange={(e) => setDirectReferrals(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0</span>
              <span>25</span>
              <span>50</span>
            </div>
          </div>

          {/* Slider 2: Rank 2 Global Cycles */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-slate-300" />
                {lang === 'th' ? 'รอบหมุนคิวโลก Rank 2 (4.00 USDT/รอบ + 1 ผี)' : 'Rank 2 Global Cycles (4.00 USDT/cycle + 1 Ghost)'}
              </span>
              <span className="text-sm font-bold font-mono text-slate-200">
                {rank2Cycles} {lang === 'th' ? 'รอบ' : 'Cycles'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              value={rank2Cycles}
              onChange={(e) => setRank2Cycles(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-slate-300"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0</span>
              <span>10</span>
              <span>20</span>
            </div>
          </div>

          {/* Slider 3: Rank 3 Apex Gold Cycles */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                {lang === 'th' ? 'รอบผู้เสกผี Rank 3 (8.00 USDT/รอบ + 8 ผี + 1 Reborn)' : 'Rank 3 Ghost Master Cycles (8.00 USDT/cycle + 8 Ghosts + 1 Reborn)'}
              </span>
              <span className="text-sm font-bold font-mono text-amber-400">
                {rank3Cycles} {lang === 'th' ? 'รอบ' : 'Cycles'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={rank3Cycles}
              onChange={(e) => setRank3Cycles(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-400">
              <span>{lang === 'th' ? 'แนะนำตรง 10% (0.20 USDT/คน):' : 'Direct Affiliate 10% ($0.20/user):'}</span>
              <span className="text-white">${directIncome.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>{lang === 'th' ? 'ค่าผัง Rank 1 30% (ช่อง 1 & 2):' : 'Rank 1 Matrix 30% (Slots 1 & 2):'}</span>
              <span className="text-white">${rank1Income.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>{lang === 'th' ? `คิวโลก Rank 2 (50% x 2 = 4.0 USDT x ${rank2Cycles} รอบ):` : `Rank 2 Queue (50% x 2 = $4.0 x ${rank2Cycles} cycles):`}</span>
              <span className="text-white">${rank2Income.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>{lang === 'th' ? `ผู้เสกผี Rank 3 (100% สด = 8.0 USDT x ${rank3Cycles} รอบ):` : `Rank 3 Ghost Master (100% Cash = $8.0 x ${rank3Cycles} cycles):`}</span>
              <span className="text-white">${rank3Income.toFixed(2)} USDT</span>
            </div>
          </div>
        </div>

        {/* Projected ROI Results Card */}
        <div className="lg:col-span-5 p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/40 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                {t.calcEstimatedIncome}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold font-mono">
                {roi.toFixed(0)}% ROI
              </span>
            </div>

            <div className="my-6">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-400 font-mono block">
                ${totalIncome.toFixed(2)}{' '}
                <span className="text-base sm:text-lg text-slate-400 font-sans">USDT</span>
              </span>
              <p className="text-xs text-slate-400 mt-2 font-mono">
                {lang === 'th' ? 'กำไรสุทธิหลังหักทุน 2 USDT:' : 'Net Profit (After 2 USDT entry):'}{' '}
                <span className="text-emerald-300 font-bold">+${netProfit.toFixed(2)} USDT</span>
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-800/80 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-purple-500/30">
                <span className="text-purple-300 flex items-center gap-1.5">
                  <Ghost className="w-4 h-4" />
                  {lang === 'th' ? 'รหัสผีช่วยดันคิว (7 R3 + 1 R2)' : 'Ghosts Spawned (7 R3 + 1 R2)'}
                </span>
                <span className="font-bold text-purple-300 font-mono">{ghostsSpawned} Ghosts</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-sky-500/30">
                <span className="text-sky-300 flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  {lang === 'th' ? 'Real ID Reborn เกิดใหม่' : 'Real ID Reborns Spawned'}
                </span>
                <span className="font-bold text-sky-300 font-mono">{realReborns} Reborns</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('dashboard')}
            className="w-full mt-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 active:scale-95 transition"
          >
            {t.btnRegisterNow}
          </button>
        </div>

      </div>

    </div>
  );
};
