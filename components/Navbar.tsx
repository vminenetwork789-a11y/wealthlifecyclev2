'use client';

import React, { useState } from 'react';
import { useWallet } from '../lib/wallet-context';
import { matrixContract } from '../lib/mock-contract';
import { CONTRACT_ADDRESS, CONTRACT_OWNER, BSC_CONFIG } from '../lib/contracts-config';
import { useLaunchCountdown } from '../lib/launch-config';
import { 
  ShieldCheck, 
  Wallet, 
  Volume2, 
  VolumeX, 
  Globe, 
  ChevronDown, 
  Check, 
  ExternalLink, 
  LayoutDashboard, 
  Home, 
  Binary, 
  Calculator, 
  FileCode2, 
  Sparkles, 
  Link2, 
  Copy, 
  LogOut, 
  Sun, 
  Moon, 
  UserPlus, 
  RefreshCw, 
  User, 
  ArrowRight, 
  Clock,
  Lock,
  Bell,
  X 
} from 'lucide-react';

interface NavbarProps {
  onOpenConnectModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenConnectModal }) => {
  const { 
    isConnected, 
    activeAccount, 
    currentUser,
    onChainContractData,
    contractState,
    lang, 
    t, 
    theme,
    toggleTheme,
    isMuted, 
    activeTab, 
    isLiveWeb3,
    lastTxHash,
    walletIds,
    walletAllDataMap,
    selectedUserId,
    setSelectedUserId,
    fetchWalletIds,
    setLang, 
    toggleMute, 
    setActiveTab, 
    disconnectWallet,
    connectWallet,
    refreshOnChainData,
    refreshWalletBalance,
    showToast
  } = useWallet();

  const { isLaunched, formattedCountdown } = useLaunchCountdown();

  const [isRefreshingNav, setIsRefreshingNav] = useState(false);
  const [showIdSwitchModal, setShowIdSwitchModal] = useState(false);
  const [directNavIdInput, setDirectNavIdInput] = useState('');
  const [isFetchingNavIds, setIsFetchingNavIds] = useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshingNav(true);
    try {
      await Promise.all([
        refreshWalletBalance(),
        refreshOnChainData(true)
      ]);
      showToast(
        lang === 'th' ? 'อัปเดตข้อมูล On-Chain ล่าสุดแล้ว' : 'On-Chain Data Refreshed',
        lang === 'th' ? 'ดึงสถานะและยอดเงินล่าสุดสำเร็จ' : 'Latest balance and contract state updated',
        'info'
      );
    } catch {
      // Ignore
    } finally {
      setIsRefreshingNav(false);
    }
  };

  // Check if current connected wallet is Wallet #1 / Contract Owner
  const isWallet1 = Boolean(
    activeAccount?.id === 1 ||
    currentUser?.id === 1 ||
    activeAccount?.isOwner === true ||
    (activeAccount?.address && activeAccount.address.toLowerCase() === CONTRACT_OWNER.toLowerCase()) ||
    (onChainContractData?.owner && activeAccount?.address && activeAccount.address.toLowerCase() === onChainContractData.owner.toLowerCase()) ||
    (walletIds && walletIds.includes(1))
  );

  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  return (
    <>
      <header id="wealthlifecycle_navbar" className="sticky top-0 z-40 w-full py-1.5 px-2 sm:px-4 lg:px-6 bg-slate-950/80 dark:bg-slate-950/90 light:bg-white/90 backdrop-blur-xl border-b border-slate-800/80 light:border-slate-200/80 transition-all duration-200 shadow-md shadow-slate-950/25">
      <div className="w-full max-w-[1550px] mx-auto">
        <nav className={`flex items-center justify-between min-h-[50px] px-2.5 sm:px-3.5 py-1 rounded-2xl border transition-all duration-200 shadow-xl gap-1.5 xl:gap-2.5 ${
          theme === 'light'
            ? 'bg-white/95 border-slate-200/90 text-slate-900 shadow-slate-300/40'
            : 'bg-slate-900/95 border-slate-700/80 text-white shadow-2xl shadow-slate-950/70 backdrop-blur-2xl'
        }`}>
          
          {/* Brand Logo */}
          <div 
            id="brand_logo"
            onClick={() => setActiveTab('landing')}
            className="flex items-center gap-2 cursor-pointer group select-none shrink-0"
          >
            <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 bg-gradient-to-br from-emerald-400 via-sky-500 to-indigo-600 rounded-xl flex items-center justify-center font-black text-white text-sm sm:text-base shadow-md group-hover:scale-105 transition-transform duration-200 shrink-0">
              W
            </div>
            {/* ซ่อนชื่อบนมือถือตามความต้องการของผู้ใช้ เพื่อประหยัดพื้นที่ */}
            <div className="hidden sm:block">
              <h1 className={`text-sm sm:text-base font-bold tracking-tight uppercase flex items-center gap-1.5 font-mono leading-none ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                wealth<span className="text-sky-400">lifecycle</span>
                <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded bg-purple-950/80 border border-purple-500/30 text-purple-300">
                  👻 GHOST
                </span>
              </h1>
            </div>
          </div>

          {/* Desktop Navigation Links (Visible only when logged in / connected) */}
          {isConnected && activeAccount && (
            <div className={`hidden lg:flex items-center gap-0.5 xl:gap-1 p-0.5 xl:p-1 rounded-xl border transition-all shrink-0 max-w-full overflow-x-auto scrollbar-none ${
              theme === 'light' ? 'bg-slate-100 border-slate-300' : 'bg-slate-950/90 border-slate-750'
            }`}>
              <button
                id="nav_btn_landing"
                onClick={() => setActiveTab('landing')}
                className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 py-1 xl:py-1.5 rounded-lg text-[11px] xl:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'landing' 
                    ? 'bg-sky-500/30 text-sky-200 border border-sky-400/60 shadow-sm' 
                    : 'text-slate-200 hover:text-white hover:bg-slate-800/90'
                }`}
              >
                <Home className="w-3.5 h-3.5 shrink-0" />
                <span>{t.navLanding}</span>
              </button>

              <button
                id="nav_btn_dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 py-1 xl:py-1.5 rounded-lg text-[11px] xl:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'dashboard' 
                    ? 'bg-sky-500/30 text-sky-200 border border-sky-400/60 shadow-sm' 
                    : 'text-slate-200 hover:text-white hover:bg-slate-800/90'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                <span>{t.navDashboard}</span>
              </button>

              <button
                id="nav_btn_matrix"
                onClick={() => setActiveTab('matrix')}
                className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 py-1 xl:py-1.5 rounded-lg text-[11px] xl:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'matrix' 
                    ? 'bg-sky-500/30 text-sky-200 border border-sky-400/60 shadow-sm' 
                    : 'text-slate-200 hover:text-white hover:bg-slate-800/90'
                }`}
              >
                <Binary className="w-3.5 h-3.5 shrink-0" />
                <span>{t.navMatrix}</span>
              </button>

              <button
                id="nav_btn_calc"
                onClick={() => setActiveTab('calculator')}
                className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 py-1 xl:py-1.5 rounded-lg text-[11px] xl:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'calculator' 
                    ? 'bg-sky-500/30 text-sky-200 border border-sky-400/60 shadow-sm' 
                    : 'text-slate-200 hover:text-white hover:bg-slate-800/90'
                }`}
              >
                <Calculator className="w-3.5 h-3.5 shrink-0" />
                <span>{t.navCalculator}</span>
              </button>

              <button
                id="nav_btn_contract"
                onClick={() => setActiveTab('contract')}
                className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 py-1 xl:py-1.5 rounded-lg text-[11px] xl:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  activeTab === 'contract' 
                    ? 'bg-sky-500/30 text-sky-200 border border-sky-400/60 shadow-sm' 
                    : 'text-slate-200 hover:text-white hover:bg-slate-800/90'
                }`}
              >
                <FileCode2 className="w-3.5 h-3.5 shrink-0" />
                <span>{t.navContract}</span>
              </button>

              {isWallet1 && (
                <button
                  id="nav_btn_admin"
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 py-1 xl:py-1.5 rounded-lg text-[11px] xl:text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    activeTab === 'admin' 
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-400/60 shadow-sm' 
                      : 'text-amber-300 hover:text-amber-200 hover:bg-slate-800/90'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{t.navAdmin}</span>
                </button>
              )}
            </div>
          )}

          {/* Right Bento Statistics Pill & Wallet Control */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            
            {/* Live BSC Contract Link Pill */}
            <a
              href={BSC_CONFIG.contractExplorerUrl}
              target="_blank"
              rel="noreferrer"
              title="View Smart Contract on BscScan"
              className="hidden 2xl:flex items-center gap-1.5 text-xs font-mono bg-slate-950/80 hover:bg-slate-900 px-2.5 py-1.5 rounded-full border border-sky-500/40 transition text-slate-200 hover:text-sky-300 shadow-sm whitespace-nowrap shrink-0"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-sky-400 font-bold">BSC Live</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            {/* Last Tx Hash pill if available */}
            {lastTxHash && (
              <a
                href={`${BSC_CONFIG.blockExplorerUrls[0]}/tx/${lastTxHash}`}
                target="_blank"
                rel="noreferrer"
                title="View Last Transaction on BscScan"
                className="hidden 2xl:flex items-center gap-1 text-[10px] font-mono bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-2 py-1.5 rounded-xl hover:bg-emerald-900/60 transition shadow-sm whitespace-nowrap shrink-0"
              >
                <Link2 className="w-3 h-3" />
                <span>Tx: {lastTxHash.slice(0, 6)}...</span>
              </a>
            )}

            {/* Manual Refresh On-Demand Button */}
            <button
              id="btn_manual_refresh"
              onClick={handleManualRefresh}
              disabled={isRefreshingNav}
              title={lang === 'th' ? 'กดเพื่ออัปเดตข้อมูล Smart Contract ล่าสุด' : 'Click to fetch latest Smart Contract state'}
              className="hidden 2xl:flex p-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-sky-400 transition active:scale-95 disabled:opacity-50 shadow-sm shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingNav ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            {/* Sound Toggle */}
            <button
              id="btn_sound_toggle"
              onClick={toggleMute}
              title={isMuted ? "Unmute sound" : "Mute sound"}
              className="hidden 2xl:flex p-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white transition active:scale-95 shadow-sm shrink-0"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-sky-400" />}
            </button>

            {/* Theme Toggle */}
            <button
              id="btn_theme_toggle"
              onClick={toggleTheme}
              title={theme === 'dark' ? (lang === 'th' ? 'เปลี่ยนเป็นโหมดสว่าง (Light Mode)' : 'Switch to Light Mode') : (lang === 'th' ? 'เปลี่ยนเป็นโหมดมืด (Dark Mode)' : 'Switch to Dark Mode')}
              className={`hidden sm:flex p-1.5 rounded-xl border transition active:scale-95 shadow-sm shrink-0 ${
                theme === 'light' 
                  ? 'bg-amber-100 border-amber-300 text-amber-600 hover:bg-amber-200' 
                  : 'bg-slate-950/80 hover:bg-slate-900 border-slate-700/80 text-amber-300 hover:text-amber-200'
              }`}
            >
              {theme === 'light' ? (
                <Moon className="w-3.5 h-3.5 text-slate-800" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            {/* Language Selector */}
            <div className="relative shrink-0">
              <button
                id="btn_lang_toggle"
                onClick={() => {
                  if (typeof window !== 'undefined' && window.innerWidth < 640) {
                    const newLang = lang === 'th' ? 'en' : 'th';
                    setLang(newLang);
                  } else {
                    setShowLangDropdown(!showLangDropdown);
                  }
                }}
                title={lang === 'th' ? "เปลี่ยนภาษา (Switch to English)" : "Switch language (เปลี่ยนเป็นภาษาไทย)"}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 text-slate-200 hover:text-white text-xs font-bold transition active:scale-95 shadow-sm whitespace-nowrap shrink-0"
              >
                <Globe className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="font-mono text-xs font-bold">{lang === 'th' ? 'TH' : 'EN'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline-block shrink-0" />
              </button>

              {/* Backdrop to close dropdown on click outside */}
              {showLangDropdown && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowLangDropdown(false)} 
                />
              )}

              {showLangDropdown && (
                <div className="absolute right-0 mt-2 w-36 bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl py-1.5 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => { setLang('th'); setShowLangDropdown(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg mx-auto transition ${lang === 'th' ? 'text-sky-400 bg-sky-950/60 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    <span className="flex items-center gap-1.5">🇹🇭 ภาษาไทย</span>
                    {lang === 'th' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                  </button>
                  <button
                    onClick={() => { setLang('en'); setShowLangDropdown(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg mx-auto transition ${lang === 'en' ? 'text-sky-400 bg-sky-950/60 font-bold' : 'text-slate-300 hover:bg-slate-800'}`}
                  >
                    <span className="flex items-center gap-1.5">🇺🇸 English</span>
                    {lang === 'en' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                  </button>
                </div>
              )}
            </div>

            {/* Switch ID Quick Button on Navbar (Visible when connected) */}
            {isConnected && activeAccount && (
              <button
                id="nav_btn_switch_id"
                onClick={() => setShowIdSwitchModal(true)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition active:scale-95 shadow-md shrink-0 ${
                  walletIds && walletIds.length > 0
                    ? 'bg-gradient-to-r from-sky-500/30 to-indigo-500/30 hover:from-sky-500/40 hover:to-indigo-500/40 border-sky-400/60 text-white shadow-sky-500/20'
                    : 'bg-amber-500/25 hover:bg-amber-500/35 border-amber-400/50 text-amber-200 shadow-amber-500/20'
                }`}
                title={lang === 'th' ? 'สลับรหัสเข้าใช้งาน (Switch Active ID)' : 'Switch Active ID'}
              >
                <User className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${walletIds && walletIds.length > 0 ? 'text-sky-300' : 'text-amber-300'}`} />
                <span className="text-xs font-mono font-black">
                  {walletIds && walletIds.length > 0 
                    ? `#${selectedUserId || currentUser?.id || walletIds[0]}`
                    : (lang === 'th' ? 'ไม่มี ID' : 'No ID')}
                </span>
                <ChevronDown className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${walletIds && walletIds.length > 0 ? 'text-sky-300' : 'text-amber-300'}`} />
              </button>
            )}

            {/* Master Wallet & USDT Balance Button */}
            {isConnected && activeAccount ? (
              <div className="relative shrink-0">
                <button
                  id="btn_account_menu"
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full transition shadow-md border bg-gradient-to-r from-emerald-500/20 via-emerald-600/25 to-teal-500/20 hover:from-emerald-500/35 hover:to-teal-500/35 border-emerald-400/60 hover:border-emerald-300 text-white font-black active:scale-95 shadow-emerald-500/15 group shrink-0 whitespace-nowrap"
                  title={lang === 'th' ? 'ข้อมูลกระเป๋า & ยอดเงิน (คลิกเพื่อดูรายละเอียด)' : 'Wallet & Balance (Click for details)'}
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399] shrink-0" />
                  
                  {/* USDT Balance tag */}
                  <span className="text-xs font-mono font-black text-emerald-300 group-hover:text-white whitespace-nowrap">
                    {activeAccount.usdtBalance.toFixed(2)} <span className="text-[10px] text-emerald-400 font-sans font-bold">USDT</span>
                  </span>

                  {/* Short Address visible only on 2xl: screens to prevent any clipping */}
                  <span className="text-emerald-500/50 font-mono text-[11px] hidden 2xl:inline">|</span>
                  <span className="text-xs font-mono text-slate-200 group-hover:text-white truncate hidden 2xl:inline">
                    {activeAccount.address.slice(0, 4)}...{activeAccount.address.slice(-3)}
                  </span>
                  
                  <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-300 shrink-0" />
                </button>

                {/* Account Details Dropdown */}
                {showAccountDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowAccountDropdown(false)} />
                    <div className="absolute right-0 mt-2 w-80 bg-slate-900/95 border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                          <span className="text-xs font-black text-white uppercase tracking-wider">
                            {lang === 'th' ? 'กระเป๋า Web3 ที่เชื่อมต่อ' : 'Connected Web3 Wallet'}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-400/40">
                          BNB Smart Chain
                        </span>
                      </div>

                      {/* Address Box */}
                      <div className="my-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-300 font-mono truncate select-all font-bold">
                          {activeAccount.address}
                        </p>
                        <button
                          onClick={() => {
                            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                              navigator.clipboard.writeText(activeAccount.address);
                              showToast(lang === 'th' ? 'คัดลอกแอดเดรสสำเร็จ' : 'Address Copied', activeAccount.address, 'info');
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition shrink-0 font-bold"
                          title="Copy Address"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Balances */}
                      <div className="flex items-center justify-between mb-1.5 px-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {lang === 'th' ? 'ยอดเงินในกระเป๋า (Wallet Balances)' : 'Wallet Balances'}
                        </span>
                        <button
                          onClick={async () => {
                            setIsRefreshingNav(true);
                            await refreshWalletBalance();
                            setIsRefreshingNav(false);
                            showToast(
                              lang === 'th' ? 'ดึงยอดเงินล่าสุดแล้ว' : 'Balance Updated',
                              lang === 'th' ? 'ยอด USDT และ BNB อัปเดตล่าสุดเรียบร้อย' : 'USDT & BNB balances updated',
                              'info'
                            );
                          }}
                          disabled={isRefreshingNav}
                          className="flex items-center gap-1 text-[10px] font-bold text-sky-400 hover:text-sky-300 transition"
                          title="Refresh Balances"
                        >
                          <RefreshCw className={`w-2.5 h-2.5 ${isRefreshingNav ? 'animate-spin' : ''}`} />
                          <span>{lang === 'th' ? 'ดึงยอดเงิน' : 'Sync'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-750">
                          <span className="text-[11px] text-slate-300 block font-bold">USDT BEP-20</span>
                          <span className="text-base font-mono font-black text-emerald-400">
                            {activeAccount.usdtBalance.toFixed(2)}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-750">
                          <span className="text-[11px] text-slate-300 block font-bold">BNB (Gas)</span>
                          <span className="text-base font-mono font-black text-amber-400">
                            {activeAccount.bnbBalance.toFixed(3)}
                          </span>
                        </div>
                      </div>

                      {/* Quick Settings for Mobile (Theme, Sound, Refresh) */}
                      <div className="grid grid-cols-3 gap-1.5 py-2 border-t border-slate-800 text-center sm:hidden">
                        <button
                          onClick={toggleTheme}
                          className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex flex-col items-center gap-1 transition"
                        >
                          {theme === 'light' ? <Moon className="w-3.5 h-3.5 text-slate-300" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
                          <span className="text-[10px]">{theme === 'light' ? 'Dark' : 'Light'}</span>
                        </button>
                        <button
                          onClick={toggleMute}
                          className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex flex-col items-center gap-1 transition"
                        >
                          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-sky-400" />}
                          <span className="text-[10px]">{isMuted ? 'Muted' : 'Sound'}</span>
                        </button>
                        <button
                          onClick={handleManualRefresh}
                          disabled={isRefreshingNav}
                          className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex flex-col items-center gap-1 transition disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshingNav ? 'animate-spin' : ''}`} />
                          <span className="text-[10px]">{lang === 'th' ? 'รีเฟรช' : 'Refresh'}</span>
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-800">
                        <a
                          href={`${BSC_CONFIG.blockExplorerUrls[0]}/address/${activeAccount.address}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-sky-300 hover:bg-sky-950/40 transition"
                        >
                          <span className="flex items-center gap-2">
                            <ExternalLink className="w-3.5 h-3.5" />
                            {lang === 'th' ? 'ดูประวัติบน BscScan' : 'View on BscScan'}
                          </span>
                        </a>

                        <button
                          onClick={() => {
                            disconnectWallet();
                            setShowAccountDropdown(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-black text-rose-300 hover:bg-rose-950/40 transition"
                        >
                          <span className="flex items-center gap-2">
                            <LogOut className="w-3.5 h-3.5" />
                            {lang === 'th' ? 'ตัดการเชื่อมต่อกระเป๋า' : 'Disconnect Wallet'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav_btn_register"
                  onClick={() => {
                    setActiveTab('landing');
                    setTimeout(() => {
                      const el = document.getElementById('landing_quick_register_section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }, 50);
                  }}
                  className={`hidden xs:flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-black shadow-md active:scale-95 transition whitespace-nowrap ${
                    !isLaunched
                      ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400/50 text-amber-200 hover:text-amber-100 shadow-amber-500/10'
                      : 'bg-emerald-500/25 hover:bg-emerald-500/40 border-emerald-400/60 text-emerald-200 hover:text-white shadow-emerald-500/20'
                  }`}
                >
                  {!isLaunched ? (
                    <>
                      <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                      <span>{lang === 'th' ? `⏳ เปิด 30/08 (${formattedCountdown})` : `⏳ Launch in ${formattedCountdown}`}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5 shrink-0 text-emerald-300" />
                      <span>{lang === 'th' ? 'สมัครสมาชิก' : 'Register'}</span>
                    </>
                  )}
                </button>

                <button
                  id="btn_connect_wallet"
                  onClick={onOpenConnectModal}
                  className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-full bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-sky-500/30 border border-sky-400/40 active:scale-95 transition whitespace-nowrap"
                >
                  <Wallet className="w-4 h-4 shrink-0" />
                  <span>{lang === 'th' ? 'เชื่อมต่อกระเป๋า' : t.connectWallet}</span>
                </button>
              </div>
            )}

          </div>

        </nav>
      </div>

      {/* Mobile Submenu Bar (Visible only when logged in / connected) */}
      {isConnected && activeAccount && (
        <div className={`lg:hidden flex items-center justify-around mt-2 py-2 px-2 rounded-2xl max-w-7xl mx-auto overflow-x-auto border shadow-xl backdrop-blur-2xl transition-all ${
          theme === 'light'
            ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-300/30'
            : 'bg-slate-900/95 border-slate-700/80 text-white shadow-2xl shadow-slate-950/70'
        }`}>
          <button
            onClick={() => setActiveTab('landing')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold py-1.5 px-2 rounded-xl whitespace-nowrap transition ${
              activeTab === 'landing' 
                ? 'text-sky-400 bg-sky-500/20 border border-sky-500/40 shadow-sm' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>{lang === 'th' ? 'หน้าแรก' : 'Home'}</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold py-1.5 px-2 rounded-xl whitespace-nowrap transition ${
              activeTab === 'dashboard' 
                ? 'text-sky-400 bg-sky-500/20 border border-sky-500/40 shadow-sm' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>{lang === 'th' ? 'แดชบอร์ด' : 'Dashboard'}</span>
          </button>

          <button
            onClick={() => setActiveTab('matrix')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold py-1.5 px-2 rounded-xl whitespace-nowrap transition ${
              activeTab === 'matrix' 
                ? 'text-sky-400 bg-sky-500/20 border border-sky-500/40 shadow-sm' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Binary className="w-4 h-4" />
            <span>{lang === 'th' ? 'ผังเมทริกซ์' : 'Matrix'}</span>
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex flex-col items-center gap-0.5 text-[10px] font-bold py-1.5 px-2 rounded-xl whitespace-nowrap transition ${
              activeTab === 'calculator' 
                ? 'text-sky-400 bg-sky-500/20 border border-sky-500/40 shadow-sm' 
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>{lang === 'th' ? 'คำนวณกำไร' : 'Calculator'}</span>
          </button>

          {isWallet1 && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-bold py-1.5 px-2 rounded-xl whitespace-nowrap transition ${
                activeTab === 'admin' 
                  ? 'text-amber-400 bg-amber-500/20 border border-amber-500/40 shadow-sm' 
                  : 'text-amber-400/80 hover:text-amber-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{lang === 'th' ? 'แอดมิน' : 'Admin'}</span>
            </button>
          )}
        </div>
      )}

      </header>

      {/* ========================================================================= */}
      {/* NAVBAR ID SWITCHER POP-UP MODAL (Positioned outside header to avoid backdrop-blur containment) */}
      {/* ========================================================================= */}
      {showIdSwitchModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
            onClick={() => setShowIdSwitchModal(false)}
          />

          {/* Modal Content */}
          <div className={`relative w-full max-w-lg rounded-3xl shadow-2xl p-4 sm:p-6 z-10 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 max-h-[86vh] flex flex-col text-left border my-auto ${
            theme === 'light'
              ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-400/30'
              : 'bg-slate-900/95 border-sky-500/30 text-white shadow-2xl'
          }`}>
            
            {/* Modal Header */}
            <div className={`flex items-start justify-between gap-2.5 pb-3.5 border-b shrink-0 ${
              theme === 'light' ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className={`text-sm sm:text-base font-black tracking-tight whitespace-nowrap ${
                      theme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}>
                      {lang === 'th' ? 'สลับรหัสเข้าใช้งาน' : 'Switch Active ID'}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold border whitespace-nowrap ${
                      walletIds && walletIds.length > 0 
                        ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' 
                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    }`}>
                      {walletIds && walletIds.length > 0 ? `${walletIds.length} ${lang === 'th' ? 'รหัส' : 'IDs'}` : (lang === 'th' ? 'ยังไม่มี ID' : '0 IDs')}
                    </span>
                  </div>
                  <p className={`text-[11px] sm:text-xs mt-0.5 leading-snug truncate ${
                    theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {walletIds && walletIds.length > 0 
                      ? (lang === 'th' ? 'แตะที่รหัสเพื่อสลับเข้าใช้งานทันที' : 'Tap an ID to switch view instantly')
                      : (lang === 'th' ? 'กระเป๋านี้ยังไม่ได้ลงทะเบียน ID ในระบบ' : 'No User IDs registered in this wallet yet')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {activeAccount?.address && (
                  <button
                    onClick={async () => {
                      setIsFetchingNavIds(true);
                      try {
                        const ids = await fetchWalletIds(activeAccount.address, true);
                        showToast(
                          lang === 'th' ? 'ดึงรหัสล่าสุดสำเร็จ' : 'IDs Refreshed',
                          ids.length > 0 
                            ? (lang === 'th' ? `พบ ${ids.length} รหัสที่ผูกกับกระเป๋า` : `Found ${ids.length} User IDs in this wallet`)
                            : (lang === 'th' ? 'ยังไม่มี ID ที่ผูกกับกระเป๋านี้' : 'No User IDs found for this wallet'),
                          'info'
                        );
                      } finally {
                        setIsFetchingNavIds(false);
                      }
                    }}
                    disabled={isFetchingNavIds}
                    title={lang === 'th' ? 'รีเฟรชรหัสจาก Smart Contract' : 'Refresh IDs from smart contract'}
                    className={`p-2 sm:p-2.5 rounded-xl border transition active:scale-95 disabled:opacity-50 shadow-sm ${
                      theme === 'light'
                        ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 ${isFetchingNavIds ? 'animate-spin' : ''}`} />
                  </button>
                )}
                <button
                  onClick={() => setShowIdSwitchModal(false)}
                  className={`p-2 sm:p-2.5 rounded-xl border transition active:scale-95 shadow-sm ${
                    theme === 'light'
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500 hover:text-slate-800'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable ID List */}
            <div className="py-3.5 overflow-y-auto flex-1 space-y-2.5 pr-1 max-h-[55vh]">
              {walletIds && walletIds.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {walletIds.map((id) => {
                    const isActive = (selectedUserId || currentUser?.id) === id;
                    const itemData = walletAllDataMap[id];
                    const userObj = matrixContract.getUser(id);
                    
                    // Determine Rank accurately from live on-chain downlines
                    let rankLabel = 'Rank 1 Matrix';
                    if (itemData?.rank3Downlines && itemData.rank3Downlines.length > 0) {
                      rankLabel = 'Rank 3 Gold';
                    } else if (itemData?.rank2Downlines && itemData.rank2Downlines.length > 0) {
                      rankLabel = 'Rank 2 Silver';
                    } else if (userObj?.rank3BoardPosition && userObj.rank3BoardPosition >= 0) {
                      rankLabel = 'Rank 3 Gold';
                    } else if (userObj?.rank2QueueIndex && userObj.rank2QueueIndex >= 0) {
                      rankLabel = 'Rank 2 Silver';
                    }

                    // Determine Type accurately
                    const isGhost = Boolean(userObj?.isGhost);
                    const isReborn = !isGhost && Boolean(
                      itemData?.isAutoReborn ||
                      (userObj?.rebornCount && userObj.rebornCount > 0)
                    );

                    const totalEarned = itemData?.totalEarned !== undefined
                      ? itemData.totalEarned
                      : (userObj?.totalEarnedUSDT || 0);

                    return (
                      <button
                        key={id}
                        onClick={() => {
                          setSelectedUserId(id);
                          setShowIdSwitchModal(false);
                          showToast(
                            lang === 'th' ? `สลับเข้าใช้งาน ID #${id}` : `Switched to ID #${id}`,
                            lang === 'th' ? 'เปลี่ยนการแสดงผลของ Dashboard และผังสายงานแล้ว' : 'Dashboard & matrix views updated',
                            'info'
                          );
                        }}
                        className={`p-3 sm:p-3.5 rounded-2xl text-left transition-all duration-150 border relative flex items-center justify-between active:scale-95 ${
                          isActive
                            ? 'bg-gradient-to-br from-sky-500/25 via-sky-900/40 to-slate-900/90 border-sky-400 shadow-md shadow-sky-500/20 ring-2 ring-sky-400/40 text-white'
                            : isReborn
                              ? theme === 'light'
                                ? 'bg-sky-50/70 hover:bg-sky-100/80 border-sky-300 hover:border-sky-400 text-slate-900 shadow-sm shadow-sky-500/5'
                                : 'bg-slate-950/90 hover:bg-slate-900 border-sky-500/40 hover:border-sky-400 text-white shadow-sm shadow-sky-500/10'
                              : theme === 'light'
                                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-slate-300 text-slate-900'
                                : 'bg-slate-950/80 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700 text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                            isActive 
                              ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-400/30' 
                              : isReborn
                                ? 'bg-sky-500/20 text-sky-400 border border-sky-400/60 shadow-sm shadow-sky-500/20'
                                : theme === 'light'
                                  ? 'bg-slate-200 text-slate-700 border border-slate-300'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            #{isGhost ? 0 : id}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`font-mono font-black text-sm ${
                                isActive || theme !== 'light' ? 'text-white' : 'text-slate-900'
                              }`}>
                                ID #{isGhost ? 0 : id}
                              </span>
                              {isGhost ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/50 text-purple-400 text-[10px] font-bold shadow-sm">
                                  <span>👻</span>
                                  <span>{lang === 'th' ? 'ผี' : 'Ghost'}</span>
                                </span>
                              ) : isReborn ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/50 text-sky-400 text-[10px] font-bold shadow-sm shadow-sky-500/10">
                                  <span>🔄</span>
                                  <span>{lang === 'th' ? 'เกิดใหม่' : 'Reborn'}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                                  <span>📝</span>
                                  <span>{lang === 'th' ? 'สมัคร' : 'Direct'}</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[10px] font-semibold ${
                                isActive ? 'text-sky-200' : isReborn ? 'text-sky-400' : theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                              }`}>
                                {rankLabel}
                              </span>
                              {totalEarned > 0 && (
                                <span className="text-[10px] font-mono font-bold text-emerald-400">
                                  +{totalEarned.toFixed(2)} USDT
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 shrink-0">
                            {lang === 'th' ? '✓ ใช้งาน' : '✓ Active'}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className={`p-6 rounded-3xl border border-dashed text-center space-y-3.5 my-2 ${
                  theme === 'light'
                    ? 'bg-amber-50/60 border-amber-300'
                    : 'bg-slate-950/70 border-amber-500/30'
                }`}>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <p className={`text-base font-bold ${
                      theme === 'light' ? 'text-amber-700' : 'text-amber-300'
                    }`}>
                      {lang === 'th' ? 'ยังไม่มี ID ที่ผูกกับกระเป๋านี้' : 'No User IDs registered in this wallet'}
                    </p>
                    <p className={`text-xs mt-1 max-w-sm mx-auto leading-relaxed ${
                      theme === 'light' ? 'text-slate-600' : 'text-slate-400'
                    }`}>
                      {lang === 'th' 
                        ? 'กระเป๋านี้ยังไม่เคยลงทะเบียนในระบบ Smart Contract ท่านสามารถสมัครสมาชิกใหม่ด้วย 2 USDT เพื่อรับ ID และเริ่มรับรายได้' 
                        : 'This wallet has not registered any ID on the smart contract yet. Register with 2 USDT to get your ID and start earning.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowIdSwitchModal(false);
                      setActiveTab('landing');
                      setTimeout(() => {
                        const el = document.getElementById('landing_quick_register_section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }, 50);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{lang === 'th' ? 'สมัครสมาชิกลงทะเบียน ID (2 USDT)' : 'Register New ID (2 USDT)'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer: Quick Custom ID Switcher */}
            <div className={`pt-3.5 border-t shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
              theme === 'light' ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <span className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                {lang === 'th' ? 'หรือสลับดูรหัสอื่น:' : 'Or switch to any ID:'}
              </span>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const targetId = parseInt(directNavIdInput, 10);
                  if (targetId && targetId > 0) {
                    setSelectedUserId(targetId);
                    setShowIdSwitchModal(false);
                    setDirectNavIdInput('');
                    showToast(
                      lang === 'th' ? `สลับเข้าดูข้อมูล ID #${targetId}` : `Switched to ID #${targetId}`,
                      lang === 'th' ? 'เปลี่ยนมุมมองเป็นของรหัสนี้แล้ว' : 'Switched active view to ID #' + targetId,
                      'info'
                    );
                  }
                }} 
                className="flex items-center gap-1.5"
              >
                <input
                  type="number"
                  min="1"
                  placeholder="ID # (e.g. 1, 2)"
                  value={directNavIdInput}
                  onChange={(e) => setDirectNavIdInput(e.target.value)}
                  className={`w-28 sm:w-32 rounded-xl px-3 py-1.5 text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-sky-400 text-center border ${
                    theme === 'light'
                      ? 'bg-slate-100 border-slate-300 text-slate-900'
                      : 'bg-slate-950 border-slate-700 text-white'
                  }`}
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 font-bold text-xs transition active:scale-95 flex items-center gap-1 shrink-0"
                >
                  <span>{lang === 'th' ? 'ดู' : 'Go'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
