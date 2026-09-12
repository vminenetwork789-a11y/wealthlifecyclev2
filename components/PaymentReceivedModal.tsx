'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useWallet } from '../lib/wallet-context';
import { PaymentReceivedNotification } from '../lib/types';
import { 
  Bell, 
  X, 
  CheckCheck, 
  Trash2, 
  ExternalLink, 
  Sparkles, 
  Zap, 
  Layers, 
  Crown, 
  ArrowUpRight, 
  Volume2, 
  VolumeX, 
  Coins, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export const PaymentReceivedModal: React.FC = () => {
  const { 
    isPaymentModalOpen, 
    setIsPaymentModalOpen, 
    paymentNotifications, 
    markAllPaymentsAsRead, 
    markPaymentAsRead, 
    clearPaymentNotifications, 
    simulateIncomingPayment, 
    paymentSoundEnabled, 
    setPaymentSoundEnabled,
    lang, 
    theme 
  } = useWallet();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SPONSOR_BONUS' | 'RANK1_PAYOUT' | 'RANK2_PAYOUT' | 'RANK3_PAYOUT' | 'OTHER'>('ALL');
  const [showSimulateMenu, setShowSimulateMenu] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentTime(Date.now());
    }, 0);
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Compute metrics
  const unreadCount = useMemo(() => {
    return paymentNotifications.filter(n => !n.isRead).length;
  }, [paymentNotifications]);

  const totalEarned = useMemo(() => {
    return paymentNotifications.reduce((sum, n) => sum + (n.amountUSDT || 0), 0);
  }, [paymentNotifications]);

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'ALL') return paymentNotifications;
    if (activeFilter === 'OTHER') {
      return paymentNotifications.filter(n => n.category !== 'SPONSOR_BONUS' && n.category !== 'RANK1_PAYOUT' && n.category !== 'RANK2_PAYOUT' && n.category !== 'RANK3_PAYOUT');
    }
    return paymentNotifications.filter(n => n.category === activeFilter);
  }, [paymentNotifications, activeFilter]);

  if (!isPaymentModalOpen) return null;

  const formatTimeAgo = (timestamp: number): string => {
    const baseTime = currentTime || timestamp;
    const diff = Math.max(0, baseTime - timestamp);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return lang === 'th' ? `${days} วันที่แล้ว` : `${days}d ago`;
    if (hours > 0) return lang === 'th' ? `${hours} ชม.ที่แล้ว` : `${hours}h ago`;
    if (mins > 0) return lang === 'th' ? `${mins} นาทีที่แล้ว` : `${mins}m ago`;
    return lang === 'th' ? 'เมื่อสักครู่' : 'just now';
  };

  const getCategoryBadge = (category: PaymentReceivedNotification['category']) => {
    switch (category) {
      case 'SPONSOR_BONUS':
        return {
          icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
          labelTh: 'ค่าแนะนำตรง 10%',
          labelEn: '10% Direct Bonus',
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
        };
      case 'RANK1_PAYOUT':
        return {
          icon: <Layers className="w-3.5 h-3.5 text-sky-400" />,
          labelTh: 'ผัง Rank 1 (0.60 USDT)',
          labelEn: 'Rank 1 Slot (0.60 USDT)',
          bg: 'bg-sky-500/15 border-sky-500/30 text-sky-400',
        };
      case 'RANK2_PAYOUT':
        return {
          icon: <ArrowUpRight className="w-3.5 h-3.5 text-purple-400" />,
          labelTh: 'คิวกลาง Rank 2 (2.00 USDT)',
          labelEn: 'Rank 2 Queue (2.00 USDT)',
          bg: 'bg-purple-500/15 border-purple-500/30 text-purple-400',
        };
      case 'RANK3_PAYOUT':
        return {
          icon: <Crown className="w-3.5 h-3.5 text-emerald-400" />,
          labelTh: 'บอร์ด Rank 3 (8.00 USDT)',
          labelEn: 'Rank 3 Master (8.00 USDT)',
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
        };
      case 'REBORN_PAYOUT':
        return {
          icon: <Sparkles className="w-3.5 h-3.5 text-teal-400" />,
          labelTh: 'Reborn / ผันกลับผัง',
          labelEn: 'Reborn Allocation',
          bg: 'bg-teal-500/15 border-teal-500/30 text-teal-400',
        };
      default:
        return {
          icon: <Coins className="w-3.5 h-3.5 text-emerald-400" />,
          labelTh: 'เงินรางวัลสำเร็จ',
          labelEn: 'Reward Claimed',
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        id="payment_received_modal"
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          theme === 'light' 
            ? 'bg-white border-slate-200 text-slate-900' 
            : 'bg-slate-900/95 border-slate-800 text-white'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between gap-3 ${
          theme === 'light' ? 'border-slate-100 bg-slate-50/70' : 'border-slate-800/80 bg-slate-950/40'
        }`}>
          <div className="flex items-center gap-3">
            <div className="relative p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
              <Coins className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-slate-900 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg tracking-tight">
                  {lang === 'th' ? 'การแจ้งเตือนรายการได้รับเงิน' : 'Payment Received Notifications'}
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    {unreadCount} {lang === 'th' ? 'รายการใหม่' : 'new'}
                  </span>
                )}
              </div>
              <p className={`text-xs mt-0.5 flex items-center gap-1.5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>{lang === 'th' ? 'ระบบตรวจจับเงินเข้า Real-Time บน BNB Smart Chain (BEP-20)' : 'Live Incoming Payout Listener on BSC (BEP-20)'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Sound Toggle */}
            <button
              onClick={() => setPaymentSoundEnabled(!paymentSoundEnabled)}
              title={paymentSoundEnabled ? (lang === 'th' ? 'ปิดเสียงแจ้งเตือนเงินเข้า' : 'Mute payment sound') : (lang === 'th' ? 'เปิดเสียงแจ้งเตือนเงินเข้า' : 'Enable payment sound')}
              className={`p-2 rounded-xl border transition active:scale-95 text-xs ${
                paymentSoundEnabled 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30' 
                  : (theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-slate-800 border-slate-700 text-slate-500')
              }`}
            >
              {paymentSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={() => setIsPaymentModalOpen(false)}
              className={`p-2 rounded-xl border transition active:scale-95 ${
                theme === 'light' 
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600' 
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metrics Summary Strip */}
        <div className={`grid grid-cols-3 gap-2 p-3 sm:p-4 border-b ${
          theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-950/60 border-slate-800/80'
        }`}>
          <div className={`p-2.5 sm:p-3 rounded-2xl border ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className={`text-[10px] font-bold block ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              {lang === 'th' ? 'ยอดเงินที่ได้รับสะสม' : 'Total Received'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base sm:text-lg font-black font-mono text-emerald-400">
                +{totalEarned.toFixed(2)}
              </span>
              <span className="text-[10px] font-mono text-slate-400">USDT</span>
            </div>
          </div>

          <div className={`p-2.5 sm:p-3 rounded-2xl border ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className={`text-[10px] font-bold block ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              {lang === 'th' ? 'จำนวนครั้งที่เงินเข้า' : 'Total Payouts'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`text-base sm:text-lg font-black font-mono ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                {paymentNotifications.length}
              </span>
              <span className="text-[10px] text-slate-400">{lang === 'th' ? 'ครั้ง' : 'txs'}</span>
            </div>
          </div>

          <div className={`p-2.5 sm:p-3 rounded-2xl border ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
          }`}>
            <span className={`text-[10px] font-bold block ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              {lang === 'th' ? 'สถานะแจ้งเตือน' : 'Notification Status'}
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-emerald-400 truncate">
                {lang === 'th' ? 'พร้อมทำงาน 100%' : 'Active 100%'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Bar & Filter Chips */}
        <div className={`p-3 sm:px-4 border-b flex flex-wrap items-center justify-between gap-2.5 ${
          theme === 'light' ? 'border-slate-100' : 'border-slate-800/80'
        }`}>
          {/* Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-full">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeFilter === 'ALL'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : (theme === 'light' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700')
              }`}
            >
              {lang === 'th' ? 'ทั้งหมด' : 'All'} ({paymentNotifications.length})
            </button>
            <button
              onClick={() => setActiveFilter('SPONSOR_BONUS')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeFilter === 'SPONSOR_BONUS'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : (theme === 'light' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700')
              }`}
            >
              ⚡ 10%
            </button>
            <button
              onClick={() => setActiveFilter('RANK1_PAYOUT')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeFilter === 'RANK1_PAYOUT'
                  ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                  : (theme === 'light' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700')
              }`}
            >
              ผัง R1 (0.60)
            </button>
            <button
              onClick={() => setActiveFilter('RANK2_PAYOUT')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeFilter === 'RANK2_PAYOUT'
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                  : (theme === 'light' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700')
              }`}
            >
              คิว R2 (2.00)
            </button>
            <button
              onClick={() => setActiveFilter('RANK3_PAYOUT')}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeFilter === 'RANK3_PAYOUT'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                  : (theme === 'light' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700')
              }`}
            >
              บอร์ด R3 (8.00)
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            {/* Quick Test Menu */}
            <div className="relative">
              <button
                onClick={() => setShowSimulateMenu(!showSimulateMenu)}
                className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{lang === 'th' ? 'ทดสอบรับเงิน' : 'Test Alert'}</span>
              </button>

              {showSimulateMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowSimulateMenu(false)} />
                  <div className={`absolute right-0 top-full mt-1.5 w-56 p-1.5 rounded-2xl border shadow-xl z-40 ${
                    theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}>
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {lang === 'th' ? 'จำลองเงินเข้าเพื่อทดสอบ' : 'Simulate Incoming Payout'}
                    </div>
                    <button
                      onClick={() => {
                        simulateIncomingPayment('SPONSOR_BONUS');
                        setShowSimulateMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                        theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-amber-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" />
                        {lang === 'th' ? 'ค่าแนะนำ 10%' : '10% Direct'}
                      </span>
                      <span className="font-mono text-emerald-400 font-black">+0.20 USDT</span>
                    </button>
                    <button
                      onClick={() => {
                        simulateIncomingPayment('RANK1_PAYOUT');
                        setShowSimulateMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                        theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-sky-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        {lang === 'th' ? 'ผัง Rank 1' : 'Rank 1 Slot'}
                      </span>
                      <span className="font-mono text-emerald-400 font-black">+0.60 USDT</span>
                    </button>
                    <button
                      onClick={() => {
                        simulateIncomingPayment('RANK2_PAYOUT');
                        setShowSimulateMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                        theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-purple-400 flex items-center gap-1.5">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        {lang === 'th' ? 'คิว Rank 2' : 'Rank 2 Queue'}
                      </span>
                      <span className="font-mono text-emerald-400 font-black">+2.00 USDT</span>
                    </button>
                    <button
                      onClick={() => {
                        simulateIncomingPayment('RANK3_PAYOUT');
                        setShowSimulateMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition ${
                        theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-900'
                      }`}
                    >
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5" />
                        {lang === 'th' ? 'บอร์ด Rank 3' : 'Rank 3 Board'}
                      </span>
                      <span className="font-mono text-emerald-400 font-black">+8.00 USDT</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mark All As Read */}
            {unreadCount > 0 && (
              <button
                onClick={markAllPaymentsAsRead}
                title={lang === 'th' ? 'ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว' : 'Mark all as read'}
                className={`p-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition ${
                  theme === 'light' 
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' 
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
              >
                <CheckCheck className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">{lang === 'th' ? 'อ่านทั้งหมด' : 'Read all'}</span>
              </button>
            )}

            {/* Clear history */}
            {paymentNotifications.length > 0 && (
              <button
                onClick={clearPaymentNotifications}
                title={lang === 'th' ? 'ล้างประวัติการแจ้งเตือน' : 'Clear notification history'}
                className={`p-1.5 rounded-xl border text-xs transition ${
                  theme === 'light' 
                    ? 'bg-slate-100 hover:bg-rose-50 border-slate-200 text-slate-600 hover:text-rose-600' 
                    : 'bg-slate-800 hover:bg-rose-950/40 border-slate-700 text-slate-400 hover:text-rose-400'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Notification List Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 divide-y divide-transparent">
          {filteredNotifications.length === 0 ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Coins className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-sm">
                  {lang === 'th' ? 'ยังไม่มีรายการแจ้งเตือนเงินเข้าในหมวดนี้' : 'No incoming payment alerts in this category'}
                </h4>
                <p className={`text-xs mt-1 max-w-sm mx-auto ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {lang === 'th' 
                    ? 'เมื่อมีค่าแนะนำตรง เงินปันผลผัง หรือเงินสดจากคิว Rank 2-3 ระบบจะแจ้งเตือนพร้อมส่งเสียงทันที' 
                    : 'Whenever direct bonuses or matrix payouts occur, real-time alerts and audio chime will trigger.'}
                </p>
              </div>
              <button
                onClick={() => simulateIncomingPayment('SPONSOR_BONUS')}
                className="mt-2 px-4 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>{lang === 'th' ? 'กดทดลองแจ้งเตือนเงินเข้าตัวอย่าง' : 'Test Sample Income Alert'}</span>
              </button>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const badge = getCategoryBadge(notif.category);
              return (
                <div
                  key={notif.id}
                  onClick={() => markPaymentAsRead(notif.id)}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col gap-2 ${
                    !notif.isRead
                      ? (theme === 'light' 
                          ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-300/40' 
                          : 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/30')
                      : (theme === 'light'
                          ? 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
                          : 'bg-slate-950/60 hover:bg-slate-900 border-slate-800')
                  }`}
                >
                  {/* Top line: Category badge, timestamp, and unread dot */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg}`}>
                        {badge.icon}
                        <span>{lang === 'th' ? badge.labelTh : badge.labelEn}</span>
                      </span>

                      {!notif.isRead && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>{lang === 'th' ? 'ใหม่' : 'NEW'}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimeAgo(notif.timestamp)}</span>
                    </div>
                  </div>

                  {/* Main content: Title + Big Amount */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs sm:text-sm font-bold ${
                        !notif.isRead 
                          ? (theme === 'light' ? 'text-slate-900' : 'text-white') 
                          : (theme === 'light' ? 'text-slate-800' : 'text-slate-200')
                      }`}>
                        {lang === 'th' ? notif.titleTh : notif.titleEn}
                      </h4>
                      <p className={`text-[11px] sm:text-xs mt-0.5 leading-relaxed ${
                        theme === 'light' ? 'text-slate-600' : 'text-slate-300'
                      }`}>
                        {lang === 'th' ? notif.detailsTh : notif.detailsEn}
                      </p>
                    </div>

                    {/* Amount Pill */}
                    <div className="shrink-0 text-right">
                      <div className="inline-flex items-baseline gap-1 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-sm">
                        <span className="text-sm sm:text-base font-mono font-black">
                          +{notif.amountUSDT.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-mono font-bold">USDT</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer info: User beneficiary & BscScan link */}
                  <div className={`pt-2 mt-1 border-t flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] font-mono ${
                    theme === 'light' ? 'border-slate-200 text-slate-500' : 'border-slate-800/80 text-slate-400'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span>{lang === 'th' ? 'ผู้รับ:' : 'Recipient:'} <strong className="text-sky-400">#{notif.toUser}</strong></span>
                      <span className="truncate max-w-[120px] sm:max-w-none">
                        ({notif.toAddress ? `${notif.toAddress.slice(0, 6)}...${notif.toAddress.slice(-4)}` : 'On-Chain'})
                      </span>
                    </div>

                    {notif.txHash && (
                      <a
                        href={`https://bscscan.com/tx/${notif.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-sky-400 hover:text-sky-300 hover:underline"
                      >
                        <span>Tx: {notif.txHash.slice(0, 8)}...</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className={`p-3.5 px-5 border-t flex items-center justify-between text-xs ${
          theme === 'light' ? 'bg-slate-50 border-slate-100 text-slate-500' : 'bg-slate-950 border-slate-800 text-slate-400'
        }`}>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{lang === 'th' ? 'อัปเดตอัตโนมัติทุกบล็อกบน BSC BEP-20' : 'Auto-synced with BSC BEP-20 blocks'}</span>
          </div>

          <button
            onClick={() => setIsPaymentModalOpen(false)}
            className={`px-4 py-1.5 rounded-xl font-bold transition active:scale-95 ${
              theme === 'light' 
                ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' 
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            {lang === 'th' ? 'ปิดหน้าต่าง' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
