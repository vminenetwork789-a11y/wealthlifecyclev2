'use client';

import React, { useState, useEffect } from 'react';
import { WalletProvider, useWallet } from '../lib/wallet-context';
import { Navbar } from '../components/Navbar';
import { LandingPage } from '../components/LandingPage';
import { Dashboard } from '../components/Dashboard';
import { MatrixVisualizer } from '../components/MatrixVisualizer';
import { AdminPanel } from '../components/AdminPanel';
import { Calculator } from '../components/Calculator';
import { SmartContractViewer } from '../components/SmartContractViewer';
import { ConnectWalletModal } from '../components/ConnectWalletModal';
import { NotificationToast } from '../components/NotificationToast';
import { RegisterWaitingModal } from '../components/RegisterWaitingModal';
import { AppLoadingScreen } from '../components/AppLoadingScreen';
import { MaintenanceModal } from '../components/MaintenanceModal';
import { PaymentReceivedModal } from '../components/PaymentReceivedModal';
import { Ghost, ShieldCheck, Wrench } from 'lucide-react';

function AppContent() {
  const { activeTab, setActiveTab, isConnected, lang, theme, isInitialLoading, systemStatus } = useWallet();
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isUserDismissedModal, setIsUserDismissedModal] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const isMaintenanceModalOpen = isManualModalOpen || (systemStatus === 'maintenance' && !isUserDismissedModal);

  // Wait until initial on-chain data and state are completely loaded
  if (isInitialLoading) {
    return <AppLoadingScreen />;
  }

  return (
    <div className={`w-full min-h-screen min-h-dvh flex flex-col justify-between selection:bg-sky-500 selection:text-slate-950 transition-colors duration-200 ${
      theme === 'light' ? 'bg-[#f8fafc] text-black' : 'bg-[#020617] text-slate-300'
    }`}>
      
      {/* Top Status & Network Bar */}
      <div className={`w-full py-1.5 text-xs font-medium shadow-sm select-none z-30 border-b transition-colors ${
        theme === 'light'
          ? 'bg-slate-100/90 border-slate-200 text-slate-800'
          : 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-slate-800/80 text-white'
      }`}>
        <div className="w-full max-w-[1550px] mx-auto px-2 sm:px-4 lg:px-6 flex items-center justify-between gap-2.5 min-h-[28px]">
          <div className="flex items-center gap-2 truncate min-w-0">
            <span className="flex h-2 w-2 relative shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className={`font-bold tracking-tight truncate flex items-center gap-1.5 text-xs ${
              theme === 'light' ? 'text-slate-700' : 'text-slate-300'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">
                {lang === 'th' 
                  ? 'WealthLifeCycle Protocol • 100% On-Chain Decentralized Smart Contract บน BNB Smart Chain' 
                  : 'WealthLifeCycle Protocol • 100% On-Chain Decentralized Smart Contract on BNB Smart Chain'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {systemStatus === 'maintenance' ? (
              <button
                onClick={() => {
                  setIsManualModalOpen(true);
                  setIsUserDismissedModal(false);
                }}
                className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-300 hover:text-white px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                title={lang === 'th' ? 'ดูประกาศอัปเกรดระบบ' : 'Maintenance info'}
              >
                <Wrench className="w-3 h-3 text-amber-400 shrink-0" />
                <span>{lang === 'th' ? 'โหมดปรับปรุง' : 'Maintenance'}</span>
              </button>
            ) : (
              <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 font-mono px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 shadow-sm whitespace-nowrap">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span>{lang === 'th' ? '🟢 ได้เปิดระบบให้ทุกท่านใช้งานแล้ว' : '🟢 System Open for Everyone'}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Top Floating Glass Navbar */}
      <Navbar onOpenConnectModal={() => setIsConnectModalOpen(true)} />

      {/* Main Bento Container (100% fluid & responsive) */}
      <main className="flex-1 w-full max-w-7xl 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-10 flex flex-col">
        {(!isConnected || activeTab === 'landing') && <LandingPage onOpenConnectModal={() => setIsConnectModalOpen(true)} />}
        {isConnected && activeTab === 'dashboard' && <Dashboard onOpenConnectModal={() => setIsConnectModalOpen(true)} />}
        {isConnected && activeTab === 'matrix' && <MatrixVisualizer />}
        {isConnected && activeTab === 'admin' && <AdminPanel />}
        {isConnected && activeTab === 'calculator' && <Calculator />}
        {isConnected && activeTab === 'contract' && <SmartContractViewer />}
      </main>

      {/* Footer */}
      <footer className={`w-full border-t py-6 px-4 sm:px-6 lg:px-8 text-center text-xs mt-auto transition-colors duration-200 ${
        theme === 'light'
          ? 'border-slate-200/90 bg-white/90 text-black'
          : 'border-slate-800/80 bg-slate-950/80 text-slate-400'
      }`}>
        <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-emerald-400 via-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
              W
            </div>
            <span className={`font-extrabold ${theme === 'light' ? 'text-black' : 'text-white'}`}>Wealth<span className="text-sky-500">LifeCycle</span></span>
            <span className="text-slate-400">•</span>
            <span className="text-[11px] text-purple-700 dark:text-purple-300 font-mono flex items-center gap-1 font-bold">
              <Ghost className="w-3 h-3 text-purple-600" /> Ghost Reborn 3.0
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className={theme === 'light' ? 'text-black' : 'text-slate-400'}>BNB Smart Chain BEP-20</span>
            <span>•</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Non-Custodial
            </span>
          </div>

          <p className={`text-[11px] ${theme === 'light' ? 'text-black' : 'text-slate-400'}`}>
            {lang === 'th' ? 'ระบบผังเมทริกซ์อัจฉริยะแบบกระจายศูนย์' : 'Decentralized Matrix Smart Contract Protocol'}
          </p>
        </div>
      </footer>

      {/* Connect Wallet Modal */}
      <ConnectWalletModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />

      {/* Registration Processing Modal ("กรุณารอผลสักครู่") */}
      <RegisterWaitingModal />

      {/* System Maintenance Notice Popup */}
      <MaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setIsUserDismissedModal(true);
        }}
      />

      {/* Floating Quick Maintenance Button (only shown in maintenance mode when popup is closed) */}
      {systemStatus === 'maintenance' && !isMaintenanceModalOpen && (
        <button
          onClick={() => {
            setIsManualModalOpen(true);
            setIsUserDismissedModal(false);
          }}
          className="fixed bottom-5 left-5 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/25 border border-amber-300 transition-all hover:scale-105 active:scale-95 cursor-pointer select-none"
          title={lang === 'th' ? 'ดูประกาศการปรับปรุงระบบ' : 'View Maintenance Notice'}
        >
          <Wrench className="w-4 h-4" />
          <span>{lang === 'th' ? 'กำลังปรับปรุงระบบ' : 'Maintenance'}</span>
        </button>
      )}

      {/* Live Toast Notifications */}
      <NotificationToast />

      {/* Payment Received Notifications Modal */}
      <PaymentReceivedModal />

    </div>
  );
}

export default function Page() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}
