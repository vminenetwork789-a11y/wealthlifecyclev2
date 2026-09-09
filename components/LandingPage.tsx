'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../lib/wallet-context';
import { getSafeQueryParam } from '../lib/utils';
import { useLaunchCountdown } from '../lib/launch-config';
import { LaunchCountdownWidget } from './LaunchCountdownWidget';
import { fetchAllGlobalQueueLengthsOnChain } from '../lib/web3-service';
import { 
  Flame, 
  Users, 
  Coins, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Ghost, 
  Layers, 
  Zap, 
  Repeat, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  Network, 
  ExternalLink, 
  ChevronRight, 
  UserPlus, 
  Wallet, 
  Loader2, 
  Lock, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Clock, 
  History, 
  RotateCcw, 
  Sparkle,
  Search,
  X,
  UserCheck,
  CheckCircle,
  HelpCircle,
  ListFilter
} from 'lucide-react';
import { sounds } from '../lib/audio';
import type { PlacementSearchResult, PlacementCandidate } from '../lib/types';

interface LandingPageProps {
  onOpenConnectModal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenConnectModal }) => {
  const { 
    lang, 
    t, 
    contractState, 
    lastUserId, 
    onChainContractData,
    setActiveTab, 
    isConnected, 
    activeAccount,
    currentUser,
    walletIds,
    usdtAllowance,
    approveUsdtAllowance,
    registerCurrentAccount,
    checkParentValid,
    findOptimalPlacement,
    getTeamAvailablePlacements,
    refreshWalletBalance,
    isLiveWeb3,
    showToast,
    theme
  } = useWallet();

  const { isLaunched, formattedCountdown, launchDateFormattedTh, launchDateFormattedEn } = useLaunchCountdown();

  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [sponsorInput, setSponsorInput] = useState<string>(() => {
    const ref = getSafeQueryParam('ref');
    if (ref && !isNaN(parseInt(ref, 10))) {
      return ref;
    }
    return '1';
  });
  const [parentInput, setParentInput] = useState<string>('0');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [registeredSuccessId, setRegisteredSuccessId] = useState<number | null>(null);

  // Auto Placement Search & Validation states
  const [isSearchingPlacement, setIsSearchingPlacement] = useState(false);
  const [placementSearchResult, setPlacementSearchResult] = useState<PlacementSearchResult | null>(null);
  const [parentValidation, setParentValidation] = useState<{
    isValidating: boolean;
    checkedId: number;
    isActive: boolean;
    isExpired: boolean;
    downlineCount: number;
    isValid: boolean;
    canAcceptDownline: boolean;
  } | null>(null);

  // Team candidate slots modal
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [teamCandidates, setTeamCandidates] = useState<PlacementCandidate[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);

  // Global Queue Lengths fetched via getAllGlobalQueueLengths()
  const [queueLengths, setQueueLengths] = useState<{ rank2Length: number; rank3Length: number }>(() => ({
    rank2Length: onChainContractData?.rank2QueueLength || contractState.stats.rank2QueueLength || 0,
    rank3Length: onChainContractData?.rank3QueueLength || contractState.stats.rank3QueueLength || 0,
  }));
  const [isFetchingQueues, setIsFetchingQueues] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadQueueLengths = async () => {
      try {
        setIsFetchingQueues(true);
        const data = await fetchAllGlobalQueueLengthsOnChain();
        if (isMounted) {
          if (data && (data.rank2Length > 0 || data.rank3Length > 0)) {
            setQueueLengths(data);
          } else {
            // fallback to onChainContractData or contractState if on-chain returns 0 or offline
            setQueueLengths({
              rank2Length: onChainContractData?.rank2QueueLength || contractState.stats.rank2QueueLength || 0,
              rank3Length: onChainContractData?.rank3QueueLength || contractState.stats.rank3QueueLength || 0,
            });
          }
        }
      } catch {
        // preserve current or fallback
      } finally {
        if (isMounted) setIsFetchingQueues(false);
      }
    };

    loadQueueLengths();
    const interval = setInterval(loadQueueLengths, 15000); // refresh every 15s
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [onChainContractData?.rank2QueueLength, onChainContractData?.rank3QueueLength, contractState.stats.rank2QueueLength, contractState.stats.rank3QueueLength]);

  const handleApprove = async () => {
    setIsApproving(true);
    await approveUsdtAllowance();
    setIsApproving(false);
  };

  // Auto search optimal placement
  const handleAutoSearchPlacement = async (overrideSponsor?: number) => {
    const targetSponsor = overrideSponsor !== undefined ? overrideSponsor : (parseInt(sponsorInput, 10) || 1);
    setIsSearchingPlacement(true);
    try {
      sounds.playClick();
      const result = await findOptimalPlacement(targetSponsor);
      setParentInput(result.parentId.toString());
      setPlacementSearchResult(result);
      sounds.playSuccess();
      showToast(
        lang === 'th' ? '✨ ค้นหาตำแหน่งผู้ต่อสายงานสำเร็จ!' : '✨ Placement ID Found!',
        lang === 'th'
          ? `แนะนำรหัส #${result.parentId}: ${result.messageTh}`
          : `Selected #${result.parentId}: ${result.messageEn}`,
        'success'
      );
    } catch (err) {
      console.warn('Auto search placement failed:', err);
      showToast(
        lang === 'th' ? 'ไม่สามารถค้นหาตำแหน่งได้' : 'Search Error',
        lang === 'th' ? 'กรุณาลองใหม่อีกครั้ง หรือระบุรหัสด้วยตนเอง' : 'Please retry or enter ID manually',
        'info'
      );
    } finally {
      setIsSearchingPlacement(false);
    }
  };

  // Live real-time check of parent ID input
  useEffect(() => {
    const pId = parseInt(parentInput, 10);
    let isMounted = true;
    const timer = setTimeout(async () => {
      if (isNaN(pId) || pId <= 0) {
        if (isMounted) setParentValidation(null);
        return;
      }

      if (isMounted) {
        setParentValidation(prev => ({
          isValidating: true,
          checkedId: pId,
          isActive: prev?.checkedId === pId ? prev.isActive : false,
          isExpired: prev?.checkedId === pId ? prev.isExpired : false,
          downlineCount: prev?.checkedId === pId ? prev.downlineCount : 0,
          isValid: prev?.checkedId === pId ? prev.isValid : false,
          canAcceptDownline: prev?.checkedId === pId ? prev.canAcceptDownline : false,
        }));
      }

      try {
        const res = await checkParentValid(pId);
        if (isMounted) {
          setParentValidation({
            isValidating: false,
            checkedId: pId,
            isActive: res.isActive,
            isExpired: res.isExpired,
            downlineCount: res.downlineCount,
            isValid: res.isValid,
            canAcceptDownline: res.canAcceptDownline,
          });
        }
      } catch {
        if (isMounted) {
          setParentValidation({
            isValidating: false,
            checkedId: pId,
            isActive: false,
            isExpired: false,
            downlineCount: 0,
            isValid: false,
            canAcceptDownline: false,
          });
        }
      }
    }, 350);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [parentInput, checkParentValid]);

  // Open candidate placement browser modal
  const handleOpenCandidateModal = async () => {
    setIsCandidateModalOpen(true);
    setIsLoadingCandidates(true);
    const targetSponsor = parseInt(sponsorInput, 10) || 1;
    try {
      sounds.playClick();
      const candidates = await getTeamAvailablePlacements(targetSponsor);
      setTeamCandidates(candidates);
    } catch {
      setTeamCandidates([]);
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  const handleSelectCandidate = (candidate: PlacementCandidate) => {
    setParentInput(candidate.id.toString());
    setPlacementSearchResult({
      parentId: candidate.id,
      downlineCount: candidate.downlineCount,
      maxSlots: candidate.maxSlots || 2,
      availableSlots: candidate.availableSlots,
      isActive: candidate.isActive,
      isExpired: candidate.isExpired,
      wallet: candidate.wallet,
      source: 'tree_spillover',
      levelFromSponsor: candidate.level,
      messageTh: `เลือกรหัส #${candidate.id} (${candidate.relationshipTh}) จากผังสายงานในทีม`,
      messageEn: `Selected #${candidate.id} (${candidate.relationshipEn}) from team placement tree`,
    });
    setIsCandidateModalOpen(false);
    sounds.playSuccess();
    showToast(
      lang === 'th' ? `เลือกรหัส #${candidate.id} แล้ว` : `Selected #${candidate.id}`,
      lang === 'th' ? `กำหนดเป็นรหัสผู้ต่อสายงาน (Placement Parent)` : `Set as Placement Parent ID`,
      'success'
    );
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLaunched) {
      showToast(
        lang === 'th' ? '⏳ ระบบยังไม่เปิดรับสมัคร' : '⏳ Registration Not Started Yet',
        lang === 'th' ? `ระบบจะเปิดรับสมัครพร้อมกันวันที่ ${launchDateFormattedTh}` : `Official launch will open on ${launchDateFormattedEn}`,
        'info'
      );
      return;
    }
    if (!isConnected) {
      onOpenConnectModal();
      return;
    }
    setIsRegistering(true);
    const targetSponsor = parseInt(sponsorInput, 10) || 1;
    const targetParent = parseInt(parentInput, 10) || 0;
    const success = await registerCurrentAccount(targetSponsor, targetParent);
    setIsRegistering(false);
    if (success) {
      setRegisteredSuccessId(lastUserId || 1);
      setActiveTab('dashboard');
    }
  };

  const scrollToRegister = () => {
    const el = document.getElementById('landing_quick_register_section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-16 pb-20">
      
      {/* Hero Section */}
      <section className="relative pt-8 sm:pt-14 pb-12 overflow-hidden text-center">
        {/* Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-sky-600/20 via-purple-600/20 to-indigo-600/10 blur-[120px] -z-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-sky-500/30 text-sky-300 text-xs font-bold mb-6 shadow-inner backdrop-blur-md">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
            </span>
            <span>{t.heroBadge}</span>
            <span className="text-slate-600">•</span>
            <span className="text-purple-300 font-mono">100% On-Chain</span>
          </div>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.25] mb-4">
            <span className={theme === 'light' ? 'text-slate-900 font-mono' : 'bg-gradient-to-r from-white via-sky-100 to-sky-400 bg-clip-text text-transparent font-mono'}>
              wealthlifecycle:
            </span>{' '}
            <span className={theme === 'light' ? 'bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent' : 'bg-gradient-to-r from-sky-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent'}>
              {lang === 'th' ? 'ระบบ 3 Ranks คิวไม่มีตัน ด้วยพลังแห่ง Ghost Reborn' : '3-Rank Non-Stop Queue Powered by Ghost Reborn'}
            </span>
          </h1>

          {/* Subtitle */}
          <p className={`text-xs sm:text-sm max-w-xl mx-auto leading-relaxed mb-6 ${
            theme === 'light' ? 'text-slate-600' : 'text-slate-300'
          }`}>
            {t.heroSubtitle}
          </p>

          {/* Official Launch Countdown Hero Widget */}
          {!isLaunched && (
            <LaunchCountdownWidget lang={lang} variant="hero" />
          )}

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {/* Primary Action Button: สมัครสมาชิกทันที / นับถอยหลัง */}
            <button
              id="hero_btn_register_prominent"
              onClick={() => {
                if (!isConnected) {
                  onOpenConnectModal();
                } else {
                  scrollToRegister();
                }
              }}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-lg flex items-center gap-1.5 active:scale-95 transition transform hover:-translate-y-0.5 ${
                !isLaunched
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-amber-500/20'
                  : 'bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white shadow-sky-500/20'
              }`}
            >
              {!isLaunched ? (
                <>
                  <Clock className="w-4 h-4 text-slate-950 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>
                    {lang === 'th' ? `⏳ เปิดรับสมัคร 30 ส.ค. 13:09 (${formattedCountdown})` : `⏳ Launch in ${formattedCountdown}`}
                  </span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-emerald-200 animate-pulse" />
                  <span>{lang === 'th' ? 'สมัครสมาชิกทันที (2 USDT)' : 'Register Now (2 USDT)'}</span>
                </>
              )}
            </button>

            {currentUser && (
              <button
                id="hero_btn_dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold shadow-md flex items-center gap-1.5 active:scale-95 transition ${
                  theme === 'light'
                    ? 'bg-white hover:bg-slate-50 border-sky-300 text-sky-700 shadow-sky-100'
                    : 'bg-slate-900/90 hover:bg-slate-800 border-sky-500/40 text-sky-300 shadow-sky-500/10'
                }`}
              >
                <span>{t.btnEnterDashboard}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              id="hero_btn_view_matrix"
              onClick={() => {
                if (!isConnected) onOpenConnectModal();
                else setActiveTab('matrix');
              }}
              className={`px-4 py-2.5 rounded-xl border font-medium text-xs sm:text-sm flex items-center gap-1.5 transition ${
                theme === 'light'
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-sm'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
              <span>{t.btnViewTree}</span>
            </button>

            <button
              id="hero_btn_calc"
              onClick={() => {
                if (!isConnected) onOpenConnectModal();
                else setActiveTab('calculator');
              }}
              className={`px-4 py-2.5 rounded-xl border font-medium text-xs sm:text-sm flex items-center gap-1.5 transition ${
                theme === 'light'
                  ? 'bg-white hover:bg-slate-50 border-purple-200 text-purple-700 shadow-sm'
                  : 'bg-slate-900/90 hover:bg-slate-800 border-purple-500/30 text-purple-300'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
              <span>{t.navCalculator}</span>
            </button>
          </div>

          {/* Quick Metrics Bar (4 Stats including Global Queues Rank 2 & 3) */}
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 text-left max-w-4xl mx-auto">
            {/* 1. Total Registered Members */}
            <div className={`p-3.5 sm:p-4 rounded-xl border backdrop-blur-md relative transition ${
              theme === 'light'
                ? 'bg-white border-slate-200/90 shadow-sm hover:border-sky-400 hover:shadow-md'
                : 'bg-slate-900/70 border-slate-800/80 hover:border-sky-500/40'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-semibold uppercase tracking-wider block truncate ${
                  theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {t.statsTotalUsers}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="flex h-1.5 w-1.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30">
                    ID
                  </span>
                </div>
              </div>
              <span className={`text-lg sm:text-xl font-black font-mono flex items-baseline gap-1 ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>
                #{lastUserId}
              </span>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 dark:text-slate-400 truncate">
                <span className="text-sky-600 dark:text-sky-400 font-bold">
                  {Math.max(1, lastUserId - (onChainContractData?.headRebornIndex ?? contractState.stats.ghostUsersCount ?? 68))} Real
                </span>
                <span>•</span>
                <span className="text-purple-600 dark:text-purple-400 font-bold">
                  {(onChainContractData?.headRebornIndex ?? contractState.stats.ghostUsersCount ?? 68)} Ghosts
                </span>
              </div>
            </div>

            {/* 2. Total Distributed Rewards */}
            <div className={`p-3.5 sm:p-4 rounded-xl border backdrop-blur-md relative transition ${
              theme === 'light'
                ? 'bg-white border-slate-200/90 shadow-sm hover:border-emerald-400 hover:shadow-md'
                : 'bg-slate-900/70 border-slate-800/80 hover:border-emerald-500/40'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-semibold uppercase tracking-wider block truncate ${
                  theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {t.statsTotalDistributed}
                </span>
                <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                  P2P
                </span>
              </div>
              <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                ${(onChainContractData?.lastUserId ? (onChainContractData.lastUserId * 2.0) : contractState.stats.totalDistributedUSDT).toFixed(1)}{' '}
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">USDT</span>
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">100% On-Chain BSC</p>
            </div>

            {/* 3. Global Queue Rank 2 (getAllGlobalQueueLengths - rank2Length) */}
            <div className={`p-3.5 sm:p-4 rounded-xl border backdrop-blur-md relative transition ${
              theme === 'light'
                ? 'bg-white border-slate-200/90 shadow-sm hover:border-sky-400 hover:shadow-md'
                : 'bg-slate-900/70 border-slate-800/80 hover:border-sky-400/40'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-semibold uppercase tracking-wider block truncate ${
                  theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {t.statsRank2Queue || 'คิว Rank 2 (4 USDT)'}
                </span>
                <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30 shrink-0">
                  RANK 2
                </span>
              </div>
              <span className="text-lg sm:text-xl font-black text-sky-600 dark:text-sky-400 font-mono flex items-baseline gap-1.5">
                {queueLengths.rank2Length.toLocaleString()}{' '}
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal font-sans">
                  {lang === 'th' ? 'คิว' : 'queued'}
                </span>
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                <span className="text-sky-600 dark:text-sky-300 font-mono font-bold">FIFO Queue</span>
                <span>• 4 USDT</span>
              </div>
            </div>

            {/* 4. Global Queue Rank 3 (getAllGlobalQueueLengths - rank3Length) */}
            <div className={`p-3.5 sm:p-4 rounded-xl border backdrop-blur-md relative transition ${
              theme === 'light'
                ? 'bg-white border-slate-200/90 shadow-sm hover:border-amber-400 hover:shadow-md'
                : 'bg-slate-900/70 border-slate-800/80 hover:border-amber-400/40'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-[10px] font-semibold uppercase tracking-wider block truncate ${
                  theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {t.statsRank3Queue || 'คิว Rank 3 (8 USDT)'}
                </span>
                <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0">
                  RANK 3
                </span>
              </div>
              <span className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 font-mono flex items-baseline gap-1.5">
                {queueLengths.rank3Length.toLocaleString()}{' '}
                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal font-sans">
                  {lang === 'th' ? 'คิว' : 'queued'}
                </span>
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                <span className="text-amber-600 dark:text-amber-300 font-mono font-bold">Ghost Master</span>
                <span>• 8 USDT</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instant Quick-Register Section (สมัครสมาชิกร่วมผังทันที) */}
      <section id="landing_quick_register_section" className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className={`relative p-6 sm:p-8 rounded-3xl border-2 backdrop-blur-xl shadow-2xl transition-all ${
          theme === 'light'
            ? 'bg-white border-sky-400/80 shadow-sky-100'
            : 'bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 border-sky-500/40 shadow-sky-500/10'
        }`}>
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30 shrink-0">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold mb-1">
                  <Sparkles className="w-3 h-3" />
                  {lang === 'th' ? 'สมัครสมาชิกเข้าร่วมผังทันที' : 'Instant Registration'}
                </div>
                <h2 className={`text-lg sm:text-xl font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {lang === 'th' ? 'สมัครสมาชิกร่วมโครงข่าย wealthlifecycle' : 'Join wealthlifecycle Network'}
                </h2>
              </div>
            </div>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${
              theme === 'light'
                ? 'bg-slate-50 border-slate-200'
                : 'bg-slate-950/80 border-slate-800'
            }`}>
              <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-300'}>{lang === 'th' ? 'ค่าธรรมเนียม' : 'Registration Fee'}:</span>
              <span className={`font-bold text-xs sm:text-sm font-mono ${theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'}`}>2.0 USDT</span>
              <span className={`text-[10px] font-mono ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>BEP-20</span>
            </div>
          </div>

          {/* If already registered info badge */}
          {currentUser && (
            <div className="mt-5 p-4 rounded-2xl bg-sky-950/40 border border-sky-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
                <div>
                  <span className="text-slate-300 font-medium">
                    {lang === 'th' ? 'กระเป๋าปัจจุบันของคุณมีรหัสสมาชิกแล้ว:' : 'Your connected wallet is registered as:'}
                  </span>{' '}
                  <span className="font-bold text-white font-mono text-sm">ID #{currentUser.id}</span>
                  {walletIds.length > 1 && (
                    <span className="text-slate-400 ml-1.5">
                      ({lang === 'th' ? `รวม ${walletIds.length} รหัส` : `${walletIds.length} IDs owned`})
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-4 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95"
              >
                <span>{lang === 'th' ? 'ไปที่แผงควบคุม (Dashboard)' : 'Go to Dashboard'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Success Notification after registration */}
          {registeredSuccessId && (
            <div className="mt-5 p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold text-white text-sm">
                    {lang === 'th' ? `ยินดีด้วย! สมัครสมาชิกรหัส #${registeredSuccessId} สำเร็จ` : `Congratulations! User #${registeredSuccessId} Registered`}
                  </p>
                  <p className="text-slate-300 mt-0.5">
                    {lang === 'th' ? 'รหัสของคุณเข้าสู่ผัง Rank 1 เรียบร้อยแล้ว พร้อมรับรายได้ทันที' : 'Your account is now active in Rank 1 Matrix!'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('matrix')}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs whitespace-nowrap transition"
              >
                {lang === 'th' ? 'ดูผังของฉัน' : 'View My Matrix'}
              </button>
            </div>
          )}

          {/* Official Launch Countdown Card Widget */}
          {!isLaunched && (
            <div className="mt-5">
              <LaunchCountdownWidget lang={lang} variant="card" />
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleRegister} className="mt-6 space-y-5">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Sponsor ID Input */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold flex items-center justify-between ${
                  theme === 'light' ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  <span>{lang === 'th' ? 'รหัสผู้แนะนำ (Sponsor ID)' : 'Sponsor User ID'}</span>
                  <span className={`text-[11px] font-normal ${
                    theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {lang === 'th' ? '(ค่าเริ่มต้นคือ ID #1)' : '(Default: ID #1)'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={sponsorInput}
                    onChange={(e) => setSponsorInput(e.target.value)}
                    placeholder="1"
                    className={`w-full rounded-2xl px-4 py-3 font-mono font-bold text-base focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition ${
                      theme === 'light'
                        ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400'
                        : 'bg-slate-950/80 border border-slate-700/80 text-white placeholder:text-slate-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setSponsorInput('1')}
                    className={`absolute right-2.5 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-[11px] font-mono transition ${
                      theme === 'light'
                        ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    Reset #1
                  </button>
                </div>
                <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {lang === 'th' ? 'โบนัสแนะนำตรง 10% (0.20 USDT) จะโอนตรงเข้ากระเป๋าผู้แนะนำทันที' : '10% Direct Bonus (0.20 USDT) transfers directly to sponsor wallet.'}
                </p>
              </div>

              {/* Placement / Parent ID Input (With Auto Search & Dynamic Validation) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className={`text-xs font-bold flex items-center gap-1.5 ${
                    theme === 'light' ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    <Network className="w-3.5 h-3.5 text-sky-500" />
                    <span>{lang === 'th' ? 'รหัสผู้ต่อสายงาน (Parent / Placement ID)' : 'Placement Parent ID'}</span>
                  </label>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAutoSearchPlacement()}
                      disabled={isSearchingPlacement}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition shadow-sm active:scale-95 disabled:opacity-60 ${
                        theme === 'light'
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/30'
                      }`}
                      title={lang === 'th' ? 'ค้นหารหัสในสายงานที่มีช่องว่างติดตัวอัตโนมัติ' : 'Auto search for available placement node'}
                    >
                      {isSearchingPlacement ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span>{lang === 'th' ? 'ค้นหาอัตโนมัติ' : 'Auto-Find'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenCandidateModal}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium transition ${
                        theme === 'light'
                          ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                      title={lang === 'th' ? 'ดูรายการรหัสที่มีช่องว่างในทีม' : 'Browse available slots in team'}
                    >
                      <ListFilter className="w-3 h-3 text-sky-400" />
                      <span>{lang === 'th' ? 'ดูผังว่าง' : 'Browse'}</span>
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={parentInput}
                    onChange={(e) => {
                      setParentInput(e.target.value);
                      if (placementSearchResult && e.target.value !== placementSearchResult.parentId.toString()) {
                        setPlacementSearchResult(null);
                      }
                    }}
                    placeholder="0"
                    className={`w-full rounded-2xl pl-4 pr-32 py-3 font-mono font-bold text-base focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition ${
                      theme === 'light'
                        ? 'bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400'
                        : 'bg-slate-950/80 border border-slate-700/80 text-white placeholder:text-slate-500'
                    }`}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAutoSearchPlacement()}
                      disabled={isSearchingPlacement}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition disabled:opacity-50 ${
                        theme === 'light'
                          ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {isSearchingPlacement ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Search className="w-3 h-3 text-emerald-500" />
                      )}
                      <span>{lang === 'th' ? 'หาให้' : 'Find'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setParentInput('0');
                        setPlacementSearchResult(null);
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono transition ${
                        theme === 'light'
                          ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      Auto (0)
                    </button>
                  </div>
                </div>

                {/* Dynamic Status / Auto Search Feedback */}
                <div className="space-y-1">
                  {/* Case 1: Auto (0) selected */}
                  {parentInput === '0' && (
                    <div className={`p-2.5 rounded-xl border flex items-start justify-between gap-2 text-xs transition ${
                      theme === 'light'
                        ? 'bg-sky-50 border-sky-200 text-sky-900'
                        : 'bg-sky-950/30 border-sky-500/30 text-sky-200'
                    }`}>
                      <div className="flex items-start gap-2">
                        <Zap className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                        <div>
                          <p className={`font-bold text-[11px] flex items-center gap-1 ${theme === 'light' ? 'text-sky-700' : 'text-sky-300'}`}>
                            <span>{lang === 'th' ? '⚡ โหมด Auto Placement (ค่า 0)' : '⚡ Auto Placement Mode (0)'}</span>
                          </p>
                          <p className={`text-[11px] mt-0.5 leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
                            {lang === 'th' 
                              ? `สัญญาอัจฉริยะจะจัดวางสายงานให้อัตโนมัติ (Spillover) หรือกดปุ่ม "ค้นหาอัตโนมัติ" เพื่อค้นหาจุดว่างในทีมผู้แนะนำ #${sponsorInput}` 
                              : `Contract places automatically (Spillover), or click "Auto-Find" to target the best open node under #${sponsorInput}`}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAutoSearchPlacement()}
                        disabled={isSearchingPlacement}
                        className={`shrink-0 text-[11px] font-bold hover:underline flex items-center gap-0.5 mt-0.5 ${
                          theme === 'light' ? 'text-sky-600' : 'text-sky-300'
                        }`}
                      >
                        <span>{lang === 'th' ? 'ค้นหาเลย' : 'Find Now'}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Case 2: Auto Search Result Banner */}
                  {placementSearchResult && parentInput === placementSearchResult.parentId.toString() && (
                    <div className={`p-2.5 rounded-xl border flex items-start gap-2 text-xs transition animate-in fade-in duration-200 ${
                      theme === 'light'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                        : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                    }`}>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <p className={`font-bold text-[11px] ${theme === 'light' ? 'text-emerald-800' : 'text-emerald-300'}`}>
                            {lang === 'th' 
                              ? `✨ ค้นพบตำแหน่งที่ดีที่สุด: รหัส #${placementSearchResult.parentId}` 
                              : `✨ Optimal Placement Found: ID #${placementSearchResult.parentId}`}
                          </p>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${
                            placementSearchResult.availableSlots === 4
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                              : 'bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-500/30'
                          }`}>
                            {lang === 'th' 
                              ? `ว่าง ${placementSearchResult.availableSlots}/4 ช่อง` 
                              : `${placementSearchResult.availableSlots}/4 Slots Open`}
                          </span>
                        </div>
                        <p className={`text-[11px] mt-0.5 leading-relaxed ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
                          {lang === 'th' ? placementSearchResult.messageTh : placementSearchResult.messageEn}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Case 3: Validation of custom Parent ID */}
                  {parentInput !== '0' && parentValidation && (!placementSearchResult || parentInput !== placementSearchResult.parentId.toString()) && (
                    <div className="pt-0.5">
                      {parentValidation.isValidating ? (
                        <div className={`flex items-center gap-1.5 text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-300'}`}>
                          <Loader2 className="w-3 h-3 animate-spin text-sky-500" />
                          <span>{lang === 'th' ? `กำลังตรวจสอบรหัส #${parentInput} บนบล็อกเชน...` : `Validating Parent #${parentInput}...`}</span>
                        </div>
                      ) : parentValidation.canAcceptDownline ? (
                        <div className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                          theme === 'light'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                        }`}>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            <span>
                              {lang === 'th' 
                                ? `✓ รหัส #${parentInput} พร้อมรับสายงาน (มีลูกทีม ${parentValidation.downlineCount}/4 ช่อง — ยังว่างอีก ${4 - parentValidation.downlineCount} ช่อง)` 
                                : `✓ ID #${parentInput} can accept placement (${parentValidation.downlineCount}/4 filled — ${4 - parentValidation.downlineCount} open)`}
                            </span>
                          </div>
                        </div>
                      ) : parentValidation.downlineCount >= 4 ? (
                        <div className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                          theme === 'light'
                            ? 'bg-amber-50 border-amber-300 text-amber-950'
                            : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                        }`}>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>
                              {lang === 'th' 
                                ? `⚠️ รหัส #${parentInput} มีสายงานเต็มแล้ว (${parentValidation.downlineCount}/4) ไม่สามารถต่อตรงได้` 
                                : `⚠️ ID #${parentInput} is full (${parentValidation.downlineCount}/4) and cannot take direct downlines`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAutoSearchPlacement(parseInt(parentInput, 10))}
                            className={`text-[11px] font-bold hover:underline shrink-0 ${
                              theme === 'light' ? 'text-amber-700' : 'text-amber-300'
                            }`}
                          >
                            {lang === 'th' ? 'หาจุดว่างใต้รหัสนี้' : 'Find under this node'}
                          </button>
                        </div>
                      ) : parentValidation.isExpired ? (
                        <div className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                          theme === 'light'
                            ? 'bg-rose-50 border-rose-300 text-rose-950'
                            : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                        }`}>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>
                              {lang === 'th' 
                                ? `❌ รหัส #${parentInput} หมดอายุ (Expired) — กรุณาต่อกับรหัสที่ยัง Active` 
                                : `❌ ID #${parentInput} is expired — Please pick an active parent`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAutoSearchPlacement()}
                            className={`text-[11px] font-bold hover:underline shrink-0 ${
                              theme === 'light' ? 'text-rose-700' : 'text-rose-300'
                            }`}
                          >
                            {lang === 'th' ? 'ค้นหาอัตโนมัติ' : 'Auto-Find'}
                          </button>
                        </div>
                      ) : (
                        <div className={`p-2 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                          theme === 'light'
                            ? 'bg-rose-50 border-rose-300 text-rose-950'
                            : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                        }`}>
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span>
                              {lang === 'th' 
                                ? `❌ ไม่พบรหัส #${parentInput} ในระบบ หรือรหัสยังไม่ได้ลงทะเบียน` 
                                : `❌ ID #${parentInput} not found or not yet registered`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAutoSearchPlacement()}
                            className={`text-[11px] font-bold hover:underline shrink-0 ${
                              theme === 'light' ? 'text-rose-700' : 'text-rose-300'
                            }`}
                          >
                            {lang === 'th' ? 'ค้นหาอัตโนมัติ' : 'Auto-Find'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Wallet Info Status Box */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold flex items-center justify-between ${
                  theme === 'light' ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  <span>{lang === 'th' ? 'กระเป๋าและยอดเงินคงเหลือ' : 'Active Wallet & Balance'}</span>
                  {isConnected && activeAccount && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      activeAccount.usdtBalance >= 2.0 
                        ? (theme === 'light' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30')
                        : (theme === 'light' ? 'bg-rose-100 text-rose-700 border border-rose-300' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30')
                    }`}>
                      {activeAccount.usdtBalance >= 2.0 ? (lang === 'th' ? '✓ ยอดเงินพร้อมสมัคร' : '✓ Sufficient Balance') : (lang === 'th' ? '⚠ ยอด USDT ไม่พอ (ต้องการ 2.0)' : '⚠ Insufficient USDT')}
                    </span>
                  )}
                </label>
                <div className={`p-3 rounded-2xl border flex flex-col justify-center min-h-[58px] ${
                  theme === 'light'
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-950/90 border-slate-700/80'
                }`}>
                  {isConnected && activeAccount ? (
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className={`text-xs font-mono font-bold truncate ${
                          theme === 'light' ? 'text-slate-800' : 'text-slate-200'
                        }`}>
                          {activeAccount.address.slice(0, 6)}...{activeAccount.address.slice(-4)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[11px] font-sans ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                          {lang === 'th' ? 'ยอดเงิน:' : 'Bal:'}
                        </span>
                        <span className={`font-black font-mono text-sm sm:text-base px-2 py-0.5 rounded-lg border shadow-sm flex items-center gap-1 ${
                          theme === 'light'
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                            : 'bg-emerald-500/15 border-emerald-400/30 text-emerald-400'
                        }`}>
                          {activeAccount.usdtBalance.toFixed(2)} USDT
                        </span>
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsRefreshingBalance(true);
                            await refreshWalletBalance();
                            setIsRefreshingBalance(false);
                            showToast(
                              lang === 'th' ? 'ดึงยอดเงินล่าสุดแล้ว' : 'Balance Updated',
                              lang === 'th' ? 'อัปเดตยอด USDT และ BNB ล่าสุดเรียบร้อย' : 'Updated latest USDT & BNB balance',
                              'info'
                            );
                          }}
                          disabled={isRefreshingBalance}
                          className={`p-1 rounded-md transition disabled:opacity-50 ml-1 ${
                            theme === 'light'
                              ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                          }`}
                          title={lang === 'th' ? 'ดึงยอดเงินจากบล็อกเชนใหม่' : 'Refresh Balance from Blockchain'}
                        >
                          <RefreshCw className={`w-3 h-3 text-emerald-500 ${isRefreshingBalance ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400">
                      <span className="flex items-center gap-1.5 font-bold">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        {lang === 'th' ? 'ยังไม่ได้เชื่อมต่อกระเป๋า' : 'Wallet Not Connected'}
                      </span>
                      <button
                        type="button"
                        onClick={onOpenConnectModal}
                        className="px-3 py-1 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white text-xs font-black shadow-md shadow-sky-500/20 active:scale-95 transition"
                      >
                        {lang === 'th' ? 'เชื่อมต่อกระเป๋า' : 'Connect'}
                      </button>
                    </div>
                  )}
                </div>
                <p className={`text-[11px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {lang === 'th' ? 'สัญญาอัจฉริยะ 100% ไร้ตัวกลาง เงินโอนตรงแบบ P2P' : 'Decentralized P2P distribution on BNB Smart Chain.'}
                </p>
              </div>

            </div>

            {/* Action Button Row */}
            <div className="pt-2">
              {!isConnected ? (
                <button
                  type="button"
                  id="landing_btn_connect_and_register"
                  onClick={onOpenConnectModal}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white font-extrabold text-base shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 active:scale-98 transition"
                >
                  <Wallet className="w-5 h-5" />
                  <span>{lang === 'th' ? 'เชื่อมต่อกระเป๋าเพื่อสมัครสมาชิก' : 'Connect Wallet to Register'}</span>
                </button>
              ) : isLiveWeb3 && usdtAllowance < 2.0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition"
                  >
                    {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                    <span>{lang === 'th' ? '1. อนุมัติ USDT (ครั้งเดียวตลอดชีพ)' : '1. Approve USDT (1-Time)'}</span>
                  </button>

                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-500 font-extrabold text-sm flex items-center justify-center gap-2 cursor-not-allowed"
                  >
                    <span>{lang === 'th' ? '2. ยืนยันการสมัคร (2 USDT)' : '2. Register (2 USDT)'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {!isLaunched && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400 shrink-0 animate-spin" style={{ animationDuration: '8s' }} />
                        <span className="font-medium">
                          {lang === 'th' 
                            ? `ระบบจะเปิดให้กดทำธุรกรรมสมัครสมาชิกพร้อมกันในวันที่ ${launchDateFormattedTh}` 
                            : `Registration transactions will unlock on ${launchDateFormattedEn}`}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-amber-300 shrink-0 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-500/30">
                        {formattedCountdown}
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    id="landing_btn_submit_register"
                    disabled={isRegistering || !isLaunched}
                    className={`w-full py-4 rounded-2xl font-extrabold text-base shadow-xl flex items-center justify-center gap-2 active:scale-98 transition ${
                      !isLaunched
                        ? 'bg-gradient-to-r from-amber-500/80 via-orange-500/80 to-amber-600/80 text-slate-950 border border-amber-400/50 shadow-amber-500/10 cursor-not-allowed opacity-90'
                        : 'bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white shadow-emerald-500/25'
                    }`}
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{lang === 'th' ? 'กำลังดำเนินการสมัครสมาชิก...' : 'Processing Registration...'}</span>
                      </>
                    ) : !isLaunched ? (
                      <>
                        <Lock className="w-5 h-5 text-slate-950" />
                        <span>
                          {lang === 'th' 
                            ? `🔒 เปิดรับสมัคร 30 ส.ค. 13:09 น. (เหลือ ${formattedCountdown})` 
                            : `🔒 Opens Aug 30 13:09 (in ${formattedCountdown})`}
                        </span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 text-amber-300" />
                        <span>
                          {currentUser 
                            ? (lang === 'th' ? 'ยืนยันสมัครเพิ่มอีก 1 รหัส (2.0 USDT)' : 'Register Additional ID (2.0 USDT)')
                            : (lang === 'th' ? 'ยืนยันการสมัครสมาชิก (2.0 USDT)' : 'Confirm Registration (2.0 USDT)')}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

          </form>

        </div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className={`text-xl sm:text-2xl font-bold mb-2 ${
            theme === 'light' ? 'text-slate-900' : 'text-white'
          }`}>
            {t.howItWorksTitle}
          </h2>
          <p className={`text-xs sm:text-sm max-w-xl mx-auto ${
            theme === 'light' ? 'text-slate-600' : 'text-slate-400'
          }`}>
            {t.howItWorksSub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Rank 1 Card */}
          <div className={`relative p-5 sm:p-6 rounded-2xl border transition-all flex flex-col justify-between group ${
            theme === 'light'
              ? 'bg-white border-sky-200 shadow-lg shadow-sky-100 hover:border-sky-400 hover:shadow-xl'
              : 'bg-slate-900/90 border-sky-500/30 shadow-xl shadow-sky-500/5 hover:border-sky-400/60'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <div className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[9px] font-bold tracking-wider uppercase">
                  ⏱️ {lang === 'th' ? 'อายุ 7 วัน' : '7 Days Expiry'}
                </div>
              </div>
              <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-300 text-[10px] font-bold mb-1.5">
                RANK 1 • 2.00 USDT
              </div>
              <h3 className={`text-base sm:text-lg font-bold mb-1.5 ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>
                {t.rank1Title}
              </h3>
              <p className={`text-xs leading-relaxed mb-3 ${
                theme === 'light' ? 'text-slate-600' : 'text-slate-300'
              }`}>
                {t.rank1Desc}
              </p>
            </div>
            <div className={`space-y-1.5 pt-3 border-t text-[11px] font-mono ${
              theme === 'light' ? 'border-slate-200' : 'border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>
                  {lang === 'th' ? 'แนะนำตรง (Direct 10%)' : 'Direct Sponsor (10%)'}
                </span>
                <span className="font-bold text-sky-600 dark:text-sky-400">+0.20 USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>
                  {lang === 'th' ? 'ช่อง 1 & 2 (Matrix 30%)' : 'Slots 1 & 2 (30%)'}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">+0.60 USDT/ช่อง (1.20 USDT)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>
                  {lang === 'th' ? 'ช่อง 3 (พักกระดาน)' : 'Slot 3 (Hold)'}
                </span>
                <span className="font-bold text-slate-500 text-[10px]">{lang === 'th' ? 'พักกระดาน (0.00 USDT)' : 'Hold State'}</span>
              </div>
              <div className={`flex items-center justify-between pt-1 border-t ${
                theme === 'light' ? 'border-slate-100' : 'border-slate-800/50'
              }`}>
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>
                  {lang === 'th' ? 'ช่อง 4 (สะสมทุน 2 USDT)' : 'Slot 4 (2 USDT Reserve)'}
                </span>
                <span className="font-bold text-purple-600 dark:text-purple-400 text-[10px]">{lang === 'th' ? 'Auto-Upgrade ขึ้น Rank 2' : 'Auto-Upgrade to Rank 2'}</span>
              </div>
            </div>
          </div>

          {/* Rank 2 Card */}
          <div className={`relative p-5 sm:p-6 rounded-2xl border transition-all flex flex-col justify-between group ${
            theme === 'light'
              ? 'bg-white border-slate-300 shadow-lg shadow-slate-100 hover:border-slate-400 hover:shadow-xl'
              : 'bg-slate-900/90 border-slate-400/30 shadow-xl shadow-slate-400/5 hover:border-slate-300'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${
                  theme === 'light'
                    ? 'bg-slate-100 border border-slate-300 text-slate-700'
                    : 'bg-slate-400/15 border border-slate-400/30 text-slate-200'
                }`}>
                  <Repeat className="w-5 h-5" />
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${
                  theme === 'light'
                    ? 'bg-slate-100 text-slate-700 border border-slate-300'
                    : 'bg-slate-400/20 text-slate-200 border border-slate-400/30'
                }`}>
                  🌐 {lang === 'th' ? 'คิวระดับโลก (FIFO)' : 'Global Queue'}
                </div>
              </div>
              <div className="inline-flex items-center justify-between w-full mb-1.5">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  theme === 'light'
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-slate-400/20 text-slate-200'
                }`}>
                  RANK 2 • 4.00 USDT
                </span>
                <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                  {lang === 'th' ? `คิวสะสม: ${queueLengths.rank2Length}` : `Queue: ${queueLengths.rank2Length}`}
                </span>
              </div>
              <h3 className={`text-base sm:text-lg font-bold mb-1.5 ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>
                {t.rank2Title}
              </h3>
              <p className={`text-xs leading-relaxed mb-3 ${
                theme === 'light' ? 'text-slate-600' : 'text-slate-300'
              }`}>
                {t.rank2Desc}
              </p>
            </div>
            <div className={`space-y-1.5 pt-3 border-t text-[11px] font-mono ${
              theme === 'light' ? 'border-slate-200' : 'border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>
                  {lang === 'th' ? 'ช่องที่ 1 (50% เงินสด)' : 'Slot 1 (50% Cash)'}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">+2.00 USDT</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>
                  {lang === 'th' ? 'ช่องที่ 2 (50% + เสกผี)' : 'Slot 2 (50% + Ghost)'}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">+2.00 USDT + 1 Ghost R2</span>
              </div>
              <div className={`flex items-center justify-between pt-1 border-t ${
                theme === 'light' ? 'border-slate-100' : 'border-slate-800/50'
              }`}>
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>
                  {lang === 'th' ? 'ช่องที่ 3 & 4 (สะสมทุน)' : 'Slots 3 & 4 (Upgrade)'}
                </span>
                <span className="font-bold text-amber-600 dark:text-amber-400 text-[10px]">{lang === 'th' ? 'Auto-Upgrade ขึ้น Rank 3' : 'Auto-Upgrade to Rank 3'}</span>
              </div>
            </div>
          </div>

          {/* Rank 3 Card */}
          <div className={`relative p-5 sm:p-6 rounded-2xl border transition-all flex flex-col justify-between group ${
            theme === 'light'
              ? 'bg-white border-amber-300 shadow-lg shadow-amber-100 hover:border-amber-400 hover:shadow-xl'
              : 'bg-slate-900/90 border-amber-500/30 shadow-xl shadow-amber-500/5 hover:border-amber-400/60'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                  <Award className="w-5 h-5" />
                </div>
                <div className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[9px] font-bold tracking-wider uppercase">
                  👑 {lang === 'th' ? 'ระดับสูงสุด (Final)' : 'Apex Final Tier'}
                </div>
              </div>
              <div className="inline-flex items-center justify-between w-full mb-1.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                  RANK 3 • 8.00 USDT
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {lang === 'th' ? `คิวสะสม: ${queueLengths.rank3Length}` : `Queue: ${queueLengths.rank3Length}`}
                </span>
              </div>
              <h3 className={`text-base sm:text-lg font-bold mb-1.5 ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>
                {t.rank3Title}
              </h3>
              <p className={`text-xs leading-relaxed mb-3 ${
                theme === 'light' ? 'text-slate-600' : 'text-slate-300'
              }`}>
                {t.rank3Desc}
              </p>
            </div>
            <div className={`space-y-1.5 pt-3 border-t text-[11px] font-mono ${
              theme === 'light' ? 'border-slate-200' : 'border-slate-800/80'
            }`}>
              <div className="flex items-center justify-between">
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>
                  {lang === 'th' ? 'ช่องที่ 1 (Reborn & Ghosts R1)' : 'Slot 1 (Real & Ghosts R1)'}
                </span>
                <span className="font-bold text-purple-600 dark:text-purple-400 text-[10px]">{lang === 'th' ? '1 Real ID ($2) + 4 Ghosts ($8)' : '1 Real ID ($2) + 4 Ghosts ($8)'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>
                  {lang === 'th' ? 'ช่องที่ 2 (รับเงินสด 100%)' : 'Slot 2 (100% Cash)'}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">+8.00 USDT สด</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>
                  {lang === 'th' ? 'ช่องที่ 3 (เสก 2 Ghosts R2)' : 'Slot 3 (2 Ghosts to R2)'}
                </span>
                <span className="font-bold text-purple-600 dark:text-purple-400 text-[10px]">{lang === 'th' ? '2 Ghosts ดันคิว Rank 2 ($8)' : '2 Ghosts to R2 ($8)'}</span>
              </div>
              <div className={`flex items-center justify-between pt-1 border-t ${
                theme === 'light' ? 'border-slate-100' : 'border-slate-800/50'
              }`}>
                <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>
                  {lang === 'th' ? 'ช่องที่ 4 (เสก 2 Ghosts R2 + จบรอบ)' : 'Slot 4 (2 Ghosts to R2 + Cycle)'}
                </span>
                <span className="font-bold text-purple-600 dark:text-purple-400 text-[10px]">{lang === 'th' ? '2 Ghosts ดัน Rank 2 & จบรอบ' : '2 Ghosts to R2 & Completed'}</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Ghost Engine Visual Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className={`p-6 sm:p-8 rounded-2xl border text-center relative overflow-hidden ${
          theme === 'light'
            ? 'bg-gradient-to-r from-purple-50 via-white to-slate-50 border-purple-200 shadow-md shadow-purple-100'
            : 'bg-gradient-to-r from-purple-950/40 via-slate-900/80 to-slate-900/90 border-purple-500/30'
        }`}>
          
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              theme === 'light'
                ? 'bg-purple-100 border border-purple-300 text-purple-700 shadow-purple-200'
                : 'bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-purple-500/20'
            }`}>
              <Ghost className="w-8 h-8 sm:w-10 sm:h-10 animate-bounce" />
            </div>

            <div className="flex-1 text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[11px] font-bold mb-1.5">
                <Sparkles className="w-3 h-3" />
                {lang === 'th' ? 'ระบบหมุนเวียน 100% On-Chain & Ghost Engine' : '100% On-Chain Ghost Reborn & Sustainability'}
              </div>
              <h3 className={`text-lg sm:text-xl font-bold mb-1.5 ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>
                {t.ghostFeatureTitle}
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed mb-3 ${
                theme === 'light' ? 'text-slate-600' : 'text-slate-300'
              }`}>
                {t.ghostFeatureDesc}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                <div className={`p-2.5 rounded-xl border ${
                  theme === 'light'
                    ? 'bg-white border-purple-200 text-slate-700'
                    : 'bg-slate-950/70 border-purple-500/20 text-slate-300'
                }`}>
                  <span className="font-bold text-purple-700 dark:text-purple-300 block mb-0.5">
                    {lang === 'th' ? '1. Ghost Injection 8+1' : '1. Ghost Injection (8+1)'}
                  </span>
                  {lang === 'th' ? 'Rank 3 ปล่อย Ghost รวม 8 ตัว (R1: 4 ตัว, R2: 4 ตัว) + Rank 2 ปล่อย 1 ตัว' : 'Rank 3 spawns 8 Ghosts (4 in R1, 4 in R2) + Rank 2 spawns 1'}
                </div>
                <div className={`p-2.5 rounded-xl border ${
                  theme === 'light'
                    ? 'bg-white border-purple-200 text-slate-700'
                    : 'bg-slate-950/70 border-purple-500/20 text-slate-300'
                }`}>
                  <span className="font-bold text-purple-700 dark:text-purple-300 block mb-0.5">
                    {lang === 'th' ? '2. 7-Day Expiry Engine' : '2. 7-Day Expiry Engine'}
                  </span>
                  {lang === 'th' ? 'คัดกรองไอดีไม่แอคทีฟ และนำยอดคงเหลือที่หมดอายุมาอัดฉีด Ghost ดัน Rank 2' : 'Filters inactive IDs and recirculates expired balances to propel queues'}
                </div>
                <div className={`p-2.5 rounded-xl border ${
                  theme === 'light'
                    ? 'bg-white border-purple-200 text-slate-700'
                    : 'bg-slate-950/70 border-purple-500/20 text-slate-300'
                }`}>
                  <span className="font-bold text-purple-700 dark:text-purple-300 block mb-0.5">
                    {lang === 'th' ? '3. 100% On-Chain Math' : '3. 100% On-Chain Math'}
                  </span>
                  {lang === 'th' ? 'คำนวณลงตัวทุกสล็อต ไร้ตัวกลาง โปร่งใส ตรวจสอบได้แบบเรียลไทม์' : 'Fully balanced mathematical distribution on Binance Smart Chain'}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className={`p-6 sm:p-10 rounded-2xl border text-center relative overflow-hidden backdrop-blur-md ${
          theme === 'light'
            ? 'bg-gradient-to-r from-sky-50 via-indigo-50 to-purple-50 border-sky-300 shadow-md shadow-sky-100'
            : 'bg-gradient-to-r from-sky-600/30 via-indigo-600/30 to-purple-600/30 border-sky-500/40'
        }`}>
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className={`text-xl sm:text-2xl font-bold ${
              theme === 'light' ? 'text-slate-900' : 'text-white'
            }`}>
              {lang === 'th' ? 'พร้อมเริ่มต้นสร้างรายได้กับ WEALTHLIFECYCLE หรือยัง?' : 'Ready to Start Earning with WEALTHLIFECYCLE?'}
            </h3>
            <p className={`text-xs sm:text-sm ${
              theme === 'light' ? 'text-slate-600' : 'text-slate-300'
            }`}>
              {lang === 'th'
                ? 'เข้าร่วมระบบผังเมทริกซ์ 3 ลำดับ ไร้ตัวกลาง 100% บนบล็อกเชน BNB Smart Chain เริ่มต้นเพียง 2 USDT'
                : 'Join the next-generation decentralized matrix protocol on BNB Smart Chain. Starting at only 2 USDT.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (!isConnected) {
                    onOpenConnectModal();
                  } else {
                    scrollToRegister();
                  }
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center gap-2 active:scale-95 transition"
              >
                <UserPlus className="w-4 h-4" />
                <span>{lang === 'th' ? 'สมัครสมาชิกตอนนี้ (2 USDT)' : 'Register Now (2 USDT)'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Transparency Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className={`p-8 rounded-3xl border ${
          theme === 'light'
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-slate-900/60 border-slate-800/80'
        }`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            
            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                theme === 'light' ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`font-bold text-sm mb-1 ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  {lang === 'th' ? 'ไร้ตัวกลาง 100%' : '100% Non-Custodial'}
                </h4>
                <p className={`text-xs leading-relaxed ${
                  theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {lang === 'th' ? 'เงินโอนตรงระหว่างกระเป๋า P2P ผ่าน Smart Contract' : 'Direct wallet-to-wallet decentralized settlements'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                theme === 'light' ? 'bg-sky-100 text-sky-600' : 'bg-sky-500/10 text-sky-400'
              }`}>
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`font-bold text-sm mb-1 ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  {lang === 'th' ? 'BNB Smart Chain' : 'BEP-20 Architecture'}
                </h4>
                <p className={`text-xs leading-relaxed ${
                  theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {lang === 'th' ? 'ค่าธรรมเนียมต่ำ ทำรายการรวดเร็วภายใน 3 วินาที' : 'Ultra low gas fees & lightning fast block confirmations'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                theme === 'light' ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/10 text-purple-400'
              }`}>
                <Ghost className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`font-bold text-sm mb-1 ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  {lang === 'th' ? 'รหัสผีผลักดันคิว' : 'Ghost Queue Engine'}
                </h4>
                <p className={`text-xs leading-relaxed ${
                  theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {lang === 'th' ? 'ระบบ Reborn เกิดใหม่ป้องกันการหยุดชะงักของผัง' : 'Perpetual queue cycling powered by autonomous ghost nodes'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                theme === 'light' ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/10 text-amber-400'
              }`}>
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h4 className={`font-bold text-sm mb-1 ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  {lang === 'th' ? 'เริ่มต้นเพียง 2 USDT' : 'Accessible 2 USDT'}
                </h4>
                <p className={`text-xs leading-relaxed ${
                  theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {lang === 'th' ? 'ทุกคนเข้าถึงได้ง่าย โบนัสตรง 10% และรางวัลคิวรอบ' : 'Low barrier to entry with 10% direct affiliate yields'}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Modal: Team Available Placement Slots Picker */}
      {isCandidateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition ${
            theme === 'light'
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-slate-900 border-slate-700/80 text-white'
          }`}>
            
            {/* Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">
                    {lang === 'th' ? 'เลือกตำแหน่งว่างในทีม' : 'Select Team Placement Slot'}
                  </h3>
                  <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    {lang === 'th' ? `ผังสายงานใต้ผู้แนะนำ #${sponsorInput}` : `Placement nodes under Sponsor #${sponsorInput}`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsCandidateModalOpen(false)}
                className={`p-2 rounded-xl transition ${
                  theme === 'light' ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions & Search Info */}
            <div className={`px-5 py-3 border-b flex items-center justify-between gap-2 text-xs ${
              theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-slate-950/50 border-slate-800'
            }`}>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{lang === 'th' ? 'แสดงรหัสที่ยังมีช่องว่าง (< 4 คน)' : 'Showing nodes with open slots (< 4)'}</span>
              </div>
              
              <button
                type="button"
                onClick={handleOpenCandidateModal}
                disabled={isLoadingCandidates}
                className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingCandidates ? 'animate-spin' : ''}`} />
                <span>{lang === 'th' ? 'รีเฟรช' : 'Refresh'}</span>
              </button>
            </div>

            {/* Candidates List Body */}
            <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
              {isLoadingCandidates ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
                  <p className="text-xs font-medium">
                    {lang === 'th' ? 'กำลังสแกนหาตำแหน่งว่างในสายงานบล็อกเชน...' : 'Scanning blockchain tree for open placement nodes...'}
                  </p>
                </div>
              ) : teamCandidates.length === 0 ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">
                      {lang === 'th' ? 'ไม่พบตำแหน่งว่างในทีมผู้แนะนำนี้' : 'No available slots in this team branch'}
                    </p>
                    <p className={`text-xs mt-1 max-w-sm mx-auto ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                      {lang === 'th' 
                        ? 'แนะนำให้ใช้โหมด Auto (0) เพื่อให้ระบบสัญญาอัจฉริยะจัดวางตามคิวอัตโนมัติ' 
                        : 'Recommend using Auto (0) mode for automatic on-chain queue spillover'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setParentInput('0');
                      setPlacementSearchResult(null);
                      setIsCandidateModalOpen(false);
                    }}
                    className="px-4 py-2 rounded-xl bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 active:scale-95 transition"
                  >
                    {lang === 'th' ? 'ใช้โหมด Auto (0)' : 'Use Auto Placement (0)'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {teamCandidates.map((c) => {
                    const isDirect = c.id === (parseInt(sponsorInput, 10) || 1);
                    return (
                      <div
                        key={c.id}
                        className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                          theme === 'light'
                            ? 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                            : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                            isDirect
                              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                              : (theme === 'light' ? 'bg-sky-100 text-sky-700' : 'bg-sky-500/20 text-sky-300')
                          }`}>
                            #{c.id}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`font-bold text-xs ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                {lang === 'th' ? `รหัสสมาชิก #${c.id}` : `Member #${c.id}`}
                              </span>
                              {isDirect && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                                  {lang === 'th' ? '👑 ผู้แนะนำตรง' : '👑 Sponsor'}
                                </span>
                              )}
                              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                                theme === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-slate-900 text-slate-300'
                              }`}>
                                Level {c.level}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-[11px]">
                              <span className={`font-medium ${
                                c.downlineCount === 0 
                                  ? (theme === 'light' ? 'text-emerald-700' : 'text-emerald-300')
                                  : (theme === 'light' ? 'text-sky-700' : 'text-sky-300')
                              }`}>
                                {c.downlineCount === 0 
                                  ? (lang === 'th' ? '🟢 ว่าง 4 ช่อง (100% ว่าง)' : '🟢 4 Slots Open (Full Open)') 
                                  : (lang === 'th' ? `🟡 มีแล้ว ${c.downlineCount}/4 คน (ว่างอีก ${4 - c.downlineCount} ช่อง)` : `🟡 ${c.downlineCount}/4 Filled (${4 - c.downlineCount} Open Slots)`)}
                              </span>
                              <span className={`font-mono text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                                {c.wallet.slice(0, 6)}...{c.wallet.slice(-4)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectCandidate(c)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap active:scale-95 transition shadow-sm shrink-0 ${
                            isDirect
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                          }`}
                        >
                          {lang === 'th' ? 'เลือกรหัสนี้' : 'Select'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`p-4 border-t flex items-center justify-between gap-3 text-xs ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setParentInput('0');
                  setPlacementSearchResult(null);
                  setIsCandidateModalOpen(false);
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                  theme === 'light' ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                }`}
              >
                {lang === 'th' ? 'รีเซ็ตเป็น Auto (0)' : 'Reset to Auto (0)'}
              </button>

              <button
                type="button"
                onClick={() => setIsCandidateModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition"
              >
                {lang === 'th' ? 'ปิดหน้าต่าง' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
