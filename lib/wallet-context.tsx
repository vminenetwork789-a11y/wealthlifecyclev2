'use client';

import React, { createContext, useContext, useState, useEffect, useSyncExternalStore, useCallback, useRef, useMemo } from 'react';
import { Language, translations } from './translations';
import { matrixContract, ContractState } from './mock-contract';
import { MatrixUser, AppNotification, PaymentReceivedNotification, RegistrationModalState, UserDashboardData, PlatformStatsData, PlatformAnalyticsData, PlacementSearchResult, PlacementCandidate } from './types';
import { sounds } from './audio';
import { ethers } from 'ethers';
import { 
  CONTRACT_ADDRESS, 
  CONTRACT_OWNER, 
  USDT_ADDRESS, 
  BSC_CONFIG,
  CONTRACT_ABI,
  ERC20_ABI
} from './contracts-config';
import { 
  getBrowserProvider, 
  switchOrAddBscChain, 
  fetchLiveContractData, 
  fetchWalletBalancesDirect,
  fetchWalletOnChainDetails,
  fetchWalletAllIdsOnChain,
  fetchIdTotalEarnedOnChain,
  fetchWalletTotalEarnedOnChain,
  fetchWalletAvailableRank1NodesOnChain,
  fetchWalletAllDataOnChain,
  fetchUserFullDetailsOnChain,
  invalidateWalletIdsCache,
  invalidateAllWeb3Caches,
  hasInjectedWallet,
  renewIdOnChain as renewIdService,
  checkIsIdExpiredOnChain,
  fetchWalletExpiredIdsAndTotalEarnedOnChain,
  checkHasReachedRank2OnChain,
  adminSetQueueHeadOnChain as adminSetQueueHeadService,
  batchMigrateGlobalQueuesOnChain as batchMigrateGlobalQueuesService,
  batchMigrateUsersOnChain as batchMigrateUsersService,
  BatchMigrateUsersParams,
  checkParentValidOnChain,
  findOptimalPlacementOnChain,
  getTeamAvailablePlacementsOnChain,
  fetchDeployTimeOnChain,
  fetchPlatformAnalyticsOnChain,
  fetchPlatformStatsOnChain,
  OnChainContractData
} from './web3-service';

export interface WalletAccount {
  id: number;
  label: string;
  address: string;
  usdtBalance: number;
  bnbBalance: number;
  isOwner: boolean;
  isRealWeb3?: boolean;
}

interface WalletContextType {
  isConnected: boolean;
  activeAccount: WalletAccount | null;
  currentUser: MatrixUser | undefined;
  contractState: ContractState;
  onChainContractData: OnChainContractData | null;
  lastUserId: number;
  totalMembers: number;
  walletIds: number[];
  walletAllData: UserDashboardData[];
  walletAllDataMap: Record<number, UserDashboardData>;
  selectedUserId: number | null;
  setSelectedUserId: (id: number | null) => void;
  fetchWalletIds: (address?: string, forceRefresh?: boolean) => Promise<number[]>;
  lang: Language;
  t: typeof translations['th'];
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  isMuted: boolean;
  activeTab: 'landing' | 'dashboard' | 'matrix' | 'admin' | 'calculator' | 'contract';
  systemStatus: 'online' | 'maintenance';
  setSystemStatus: (status: 'online' | 'maintenance') => void;
  toast: AppNotification | null;
  isBotActive: boolean;
  isLiveWeb3: boolean;
  isBscNetwork: boolean;
  txPending: boolean;
  lastTxHash: string | null;
  usdtAllowance: number;
  hasInjected: boolean;
  registrationModal: RegistrationModalState | null;
  closeRegistrationModal: () => void;
  setLang: (lang: Language) => void;
  toggleMute: () => void;
  setActiveTab: (tab: 'landing' | 'dashboard' | 'matrix' | 'admin' | 'calculator' | 'contract') => void;
  connectWallet: (account?: WalletAccount) => void;
  connectInjectedWeb3Wallet: (walletName?: string) => Promise<boolean>;
  disconnectWallet: () => void;
  approveUsdtAllowance: (amount?: number) => Promise<boolean>;
  registerCurrentAccount: (sponsorId?: number, parentId?: number) => Promise<boolean>;
  checkParentValid: (parentId: number) => Promise<{ isActive: boolean; isExpired: boolean; downlineCount: number; isValid: boolean; canAcceptDownline: boolean }>;
  findOptimalPlacement: (sponsorId?: number) => Promise<PlacementSearchResult>;
  getTeamAvailablePlacements: (rootId?: number) => Promise<PlacementCandidate[]>;
  getPlatformStats: () => Promise<PlatformStatsData | null>;
  getPlatformAnalytics: (periodSeconds?: number) => Promise<PlatformAnalyticsData | null>;
  getDeployTime: () => Promise<number>;
  renewIdOnChain: (userId: number) => Promise<boolean>;
  isIdExpiredOnChain: (userId: number) => Promise<boolean>;
  claimRewardsCurrentAccount: () => Promise<boolean>;
  processRebornOnChain: (batchSize?: number) => Promise<boolean>;
  spawnGhostPushesOnChain: (rank: number, amount: number) => Promise<boolean>;
  adminSetQueueHeadOnChain: (rank: number, newHeadIndex: number) => Promise<boolean>;
  setPauseOnChain: (paused: boolean) => Promise<boolean>;
  lockMigrationOnChain: () => Promise<boolean>;
  emergencyWithdrawOnChain: (tokenAddress: string, amount: string | number | bigint) => Promise<boolean>;
  batchMigrateUsersOnChain: (params: BatchMigrateUsersParams) => Promise<boolean>;
  batchMigrateGlobalQueuesOnChain: (migrations: Array<{
    rank: number;
    userId: number;
    isAutoReborn: boolean;
    isGhost: boolean;
    slotsFilled: number;
    downlineUserIds: number[];
  }>) => Promise<boolean>;
  toggleBotTraffic: () => void;
  runSimulationOnce: () => void;
  resetEntireSystem: () => void;
  refreshOnChainData: (forceRefresh?: boolean) => Promise<void>;
  refreshWalletBalance: (forceAddress?: string) => Promise<{ usdtBalance: number; bnbBalance: number; usdtAllowance: number } | null>;
  getIdTotalEarned: (id: number) => Promise<number>;
  getWalletTotalEarned: (walletAddress?: string, forceRefresh?: boolean) => Promise<number>;
  getWalletAvailableRank1Nodes: (walletAddress?: string, forceRefresh?: boolean) => Promise<{ availableIds: number[]; downlineCounts: number[] }>;
  getWalletAllData: (walletAddress?: string, forceRefresh?: boolean) => Promise<UserDashboardData[]>;
  getWalletExpiredIdsAndTotalEarned: (walletAddress?: string) => Promise<{ expiredIds: number[]; earnedAmounts: number[] }>;
  checkHasReachedRank2: (userId: number) => Promise<boolean>;
  isInitialLoading: boolean;
  loadingProgress: number;
  loadingStatusText: string;
  showToast: (title: string, message: string, type?: 'success' | 'info' | 'reward' | 'ghost', amount?: number, txHash?: string) => void;
  paymentNotifications: PaymentReceivedNotification[];
  unreadPaymentCount: number;
  isPaymentModalOpen: boolean;
  setIsPaymentModalOpen: (open: boolean) => void;
  paymentSoundEnabled: boolean;
  setPaymentSoundEnabled: (enabled: boolean) => void;
  markAllPaymentsAsRead: () => void;
  markPaymentAsRead: (id: string) => void;
  clearPaymentNotifications: () => void;
  simulateIncomingPayment: (category?: 'SPONSOR_BONUS' | 'RANK1_PAYOUT' | 'RANK2_PAYOUT' | 'RANK3_PAYOUT') => void;
}

const INITIAL_PAYMENT_NOTIFICATIONS: PaymentReceivedNotification[] = [
  {
    id: 'pay_init_1',
    txHash: '0x43b2a88190c1fef39281a4b92138cd9183478cb90',
    timestamp: Date.now() - 1000 * 60 * 12,
    amountUSDT: 0.20,
    category: 'SPONSOR_BONUS',
    titleTh: '⚡ ได้รับโบนัสค่าแนะนำตรง 10%',
    titleEn: '⚡ 10% Direct Sponsor Bonus Received',
    detailsTh: 'ได้รับค่าแนะนำ 10% (0.20 USDT) จากสมาชิกสายงานตรง #4 ลงทะเบียน 2.0 USDT',
    detailsEn: 'Earned 10% direct bonus (0.20 USDT) from member #4 registering 2.0 USDT',
    fromUser: 4,
    toUser: 1,
    toAddress: '0x992B0852d7e108d43E388d2239d5Fec92455c408',
    isRead: false,
  },
  {
    id: 'pay_init_2',
    txHash: '0x88ea3091bbcd2194a0293881bce89201fa882941b',
    timestamp: Date.now() - 1000 * 60 * 45,
    amountUSDT: 2.00,
    category: 'RANK2_PAYOUT',
    titleTh: '🚀 ได้รับเงินสดจากคิวกลาง Rank 2 (สล็อต 1/2)',
    titleEn: '🚀 Rank 2 Global Queue Payout (Slot 1/2)',
    detailsTh: 'ได้รับเงินสด 50% (2.00 USDT) โอนตรงเข้ากระเป๋า เมื่อคิวรันมาถึงและมีรหัสมาเติม',
    detailsEn: 'Received 50% cash payout (2.00 USDT) directly to wallet from Rank 2 FIFO Queue',
    toUser: 1,
    toAddress: '0x992B0852d7e108d43E388d2239d5Fec92455c408',
    isRead: false,
  },
  {
    id: 'pay_init_3',
    txHash: '0x12c99a8183bcda89104fa289190abf8910948921a',
    timestamp: Date.now() - 1000 * 60 * 120,
    amountUSDT: 0.60,
    category: 'RANK1_PAYOUT',
    titleTh: '💎 ได้รับเงินปันผลผัง Rank 1 (สล็อตเต็ม)',
    titleEn: '💎 Rank 1 Matrix Slot Payout',
    detailsTh: 'มีรหัสสมาชิกใหม่/Spillover ตกลงมาในผัง 4 ช่อง Rank 1 รับเงิน 0.60 USDT',
    detailsEn: 'A downline member fell into your Rank 1 4-slot matrix. Earned 0.60 USDT',
    toUser: 1,
    toAddress: '0x992B0852d7e108d43E388d2239d5Fec92455c408',
    isRead: true,
  },
  {
    id: 'pay_init_4',
    txHash: '0x99fa41098231cd89a198d890bfa182049102488aa',
    timestamp: Date.now() - 1000 * 60 * 240,
    amountUSDT: 8.00,
    category: 'RANK3_PAYOUT',
    titleTh: '👑 ได้รับเงินสดจบกระดาน Rank 3 Master',
    titleEn: '👑 Rank 3 Master Board Completed Payout',
    detailsTh: 'กระดาน Rank 3 ครบ 4 ช่อง รับเงินสด 8.00 USDT และระบบเสกผี 4 ตัวช่วยดันโครงข่าย',
    detailsEn: 'Completed Rank 3 board. Received 8.00 USDT in cash and spawned 4 catalysts',
    toUser: 1,
    toAddress: '0x992B0852d7e108d43E388d2239d5Fec92455c408',
    isRead: true,
  },
];

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(15);
  const [loadingStatusText, setLoadingStatusText] = useState<string>('กำลังเชื่อมต่อ Binance Smart Chain...');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeAccount, setActiveAccount] = useState<WalletAccount | null>(null);
  const [lang, setLang] = useState<Language>('th');
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'landing' | 'dashboard' | 'matrix' | 'admin' | 'calculator' | 'contract'>('landing');
  const [systemStatus, setSystemStatusState] = useState<'online' | 'maintenance'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('wealthlifecycle_system_status');
        if (saved === 'online') {
          return 'online';
        }
        // User requested: change maintenance status to "opened system for everyone"
        localStorage.setItem('wealthlifecycle_system_status', 'online');
        sessionStorage.setItem('wealthlifecycle_maintenance_dismissed', 'true');
        return 'online';
      } catch {
        // Ignore
      }
    }
    return 'online';
  });

  const setSystemStatus = useCallback((status: 'online' | 'maintenance') => {
    setSystemStatusState(status);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('wealthlifecycle_system_status', status);
        if (status === 'online') {
          sessionStorage.setItem('wealthlifecycle_maintenance_dismissed', 'true');
        } else {
          sessionStorage.removeItem('wealthlifecycle_maintenance_dismissed');
          localStorage.removeItem('wealthlifecycle_maintenance_dismissed_until');
        }
      } catch {
        // Ignore
      }
    }
  }, []);

  const [registrationModal, setRegistrationModal] = useState<RegistrationModalState | null>(null);

  const closeRegistrationModal = useCallback(() => {
    setRegistrationModal(null);
  }, []);

  const [hasInjected, setHasInjected] = useState<boolean>(false);
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setHasInjected(hasInjectedWallet());
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  // Synchronize DOM classes whenever theme changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const effectiveTheme = theme;
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(effectiveTheme);
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: 'dark' | 'light') => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zenith_theme', newTheme);
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(newTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('zenith_theme', next);
        document.documentElement.classList.remove('dark', 'light');
        document.documentElement.classList.add(next);
      }
      return next;
    });
  }, []);
  
  // Wallet IDs and Selected User ID (for walletToIds account switcher)
  const [walletIds, setWalletIds] = useState<number[]>([]);
  const [walletAllData, setWalletAllData] = useState<UserDashboardData[]>([]);
  const [walletAllDataMap, setWalletAllDataMap] = useState<Record<number, UserDashboardData>>({});
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Real Web3 States
  const [isLiveWeb3, setIsLiveWeb3] = useState<boolean>(true);
  const [isBscNetwork, setIsBscNetwork] = useState<boolean>(true);
  const [txPending, setTxPending] = useState<boolean>(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [usdtAllowance, setUsdtAllowance] = useState<number>(0);
  const [onChainContractData, setOnChainContractData] = useState<OnChainContractData | null>(null);
  const [onChainUserCache, setOnChainUserCache] = useState<Record<number, MatrixUser>>({});

  // Store Sync
  const contractState = useSyncExternalStore(
    matrixContract.subscribe,
    matrixContract.getSnapshot,
    matrixContract.getServerSnapshot
  );

  const [toast, setToast] = useState<AppNotification | null>(null);
  const [isBotActive, setIsBotActive] = useState<boolean>(false);

  // Incoming Payment Received Notifications State
  const [paymentNotifications, setPaymentNotifications] = useState<PaymentReceivedNotification[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('wealthlifecycle_payment_notifications');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return INITIAL_PAYMENT_NOTIFICATIONS;
  });

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentSoundEnabled, setPaymentSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('wealthlifecycle_payment_sound');
        if (saved !== null) return saved === 'true';
      } catch {}
    }
    return true;
  });

  // Save sound setting
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('wealthlifecycle_payment_sound', paymentSoundEnabled.toString());
      } catch {}
    }
  }, [paymentSoundEnabled]);

  // Save notifications to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('wealthlifecycle_payment_notifications', JSON.stringify(paymentNotifications.slice(0, 100)));
      } catch {}
    }
  }, [paymentNotifications]);

  // Refs for stabilizing callbacks without triggering re-fetch cascades
  const walletIdsRef = useRef<number[]>([]);
  const selectedUserIdRef = useRef<number | null>(null);
  const activeAccountRef = useRef<WalletAccount | null>(null);
  const isLiveWeb3Ref = useRef<boolean>(true);
  const contractUsersRef = useRef<MatrixUser[]>([]);
  const hasInitialFetchedRef = useRef<boolean>(false);
  const lastRefreshTimestampRef = useRef<number>(0);

  useEffect(() => {
    walletIdsRef.current = walletIds;
  }, [walletIds]);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  useEffect(() => {
    activeAccountRef.current = activeAccount;
  }, [activeAccount]);

  useEffect(() => {
    isLiveWeb3Ref.current = isLiveWeb3;
  }, [isLiveWeb3]);

  useEffect(() => {
    contractUsersRef.current = contractState.users;
  }, [contractState.users]);

  /**
   * Fetch all User IDs mapped to a wallet address using smart contract walletToIds(address, index)
   * Runs ONCE per wallet address and reuses cache unless forceRefresh is true
   */
  const fetchWalletIds = useCallback(async (targetAddress?: string, forceRefresh: boolean = false): Promise<number[]> => {
    const addr = targetAddress || activeAccountRef.current?.address;
    if (!addr) return [];

    let retrievedIds: number[] = [];

    // 1. Try on-chain walletToIds(address, index) query (single run + cache)
    if (isLiveWeb3Ref.current && ethers.isAddress(addr)) {
      try {
        const onChainIds = await fetchWalletAllIdsOnChain(addr, forceRefresh);
        if (onChainIds && onChainIds.length > 0) {
          retrievedIds = onChainIds;
        }
        // Also sync getWalletAllData
        const allData = await fetchWalletAllDataOnChain(addr, forceRefresh);
        if (allData && allData.length > 0) {
          setWalletAllData(allData);
          const map: Record<number, UserDashboardData> = {};
          allData.forEach(d => { map[d.id] = d; });
          setWalletAllDataMap(map);
        }
      } catch (err) {
        console.warn('fetchWalletIds on-chain error:', err);
      }
    }

    // 2. Fallback to mock / stored users with matching address
    if (retrievedIds.length === 0) {
      const clean = addr.toLowerCase();
      const contractIds = matrixContract.getWalletIds(clean);
      if (contractIds.length > 0) {
        retrievedIds = contractIds;
      } else {
        const localMatches = matrixContract.getState().users
          .filter(u => u.address.toLowerCase().includes(clean) || clean.includes(u.address.toLowerCase()))
          .map(u => u.id);
        
        if (localMatches.length > 0) {
          retrievedIds = localMatches;
        } else if (activeAccountRef.current?.id && activeAccountRef.current.id > 0 && activeAccountRef.current.id !== 999) {
          retrievedIds = [activeAccountRef.current.id];
        }
      }
    }

    // Ensure list has unique positive IDs
    const uniqueIds = Array.from(new Set(retrievedIds.filter(id => id > 0)));
    
    // Stabilize: Only set if actually changed
    setWalletIds(prev => {
      if (prev.length === uniqueIds.length && prev.every((v, i) => v === uniqueIds[i])) {
        return prev;
      }
      return uniqueIds;
    });

    // Default to the wallet's first ID if none selected or if previously selected ID does not belong to this wallet
    if (uniqueIds.length > 0) {
      setSelectedUserId(prev => {
        if (prev !== null && prev !== undefined && prev > 0 && uniqueIds.includes(prev)) return prev;
        return uniqueIds[0];
      });

      // Pre-fetch details for all retrieved IDs into cache once
      if (isLiveWeb3Ref.current) {
        uniqueIds.forEach(id => {
          fetchUserFullDetailsOnChain(id, forceRefresh).then(user => {
            if (user) {
              setOnChainUserCache(prev => {
                const existing = prev[id];
                if (
                  existing &&
                  existing.totalEarnedUSDT === user.totalEarnedUSDT &&
                  existing.pendingRebornUSDT === user.pendingRebornFunds &&
                  existing.sponsorId === user.sponsorId &&
                  existing.isGhost === user.isGhost
                ) {
                  return prev;
                }
                return {
                  ...prev,
                  [id]: {
                    id: user.id,
                    address: user.wallet,
                    sponsorId: user.sponsorId,
                    isGhost: user.isGhost,
                    registeredAt: 1700000000000,
                    rank1Slots: [],
                    rank2QueueIndex: -1,
                    rank2SlotsFilled: 0,
                    rank3BoardPosition: -1,
                    rank3SlotsFilled: 0,
                    totalEarnedUSDT: user.totalEarnedUSDT,
                    directBonusUSDT: 0,
                    rank1EarnedUSDT: 0,
                    rank2EarnedUSDT: 0,
                    rank3EarnedUSDT: 0,
                    pendingRebornUSDT: user.pendingRebornFunds,
                    rebornCount: 0,
                    cyclesCompleted: 0,
                    referralsCount: 0,
                  }
                };
              });
            }
          }).catch(() => {});
        });
      }
    } else {
      // If wallet has no registered IDs yet
      setSelectedUserId(null);
    }

    return uniqueIds;
  }, []);

  // Fast direct fetch for USDT & BNB balances for currently connected / specified wallet
  const refreshWalletBalance = useCallback(async (forceAddress?: string) => {
    const targetAddr = forceAddress || activeAccountRef.current?.address;
    if (!targetAddr || !ethers.isAddress(targetAddr)) return null;

    try {
      const balances = await fetchWalletBalancesDirect(targetAddr);
      if (balances) {
        setUsdtAllowance(balances.usdtAllowance);
        setActiveAccount(prev => {
          if (!prev) return null;
          if (prev.address.toLowerCase() !== targetAddr.toLowerCase()) return prev;
          if (prev.usdtBalance === balances.usdtBalance && prev.bnbBalance === balances.bnbBalance) return prev;
          return {
            ...prev,
            usdtBalance: balances.usdtBalance,
            bnbBalance: balances.bnbBalance
          };
        });
        return balances;
      }
    } catch (err) {
      console.warn('Error in refreshWalletBalance:', err);
    }
    return null;
  }, []);

  // Fetch live BSC contract data on demand (Throttled Single Execution)
  const refreshOnChainData = useCallback(async (forceRefresh: boolean = false) => {
    const now = Date.now();
    if (!forceRefresh && now - lastRefreshTimestampRef.current < 4000) {
      return; // Throttled to avoid rapid hammering
    }
    lastRefreshTimestampRef.current = now;

    try {
      if (forceRefresh) {
        invalidateAllWeb3Caches();
      }
      const liveData = await fetchLiveContractData();
      if (liveData) {
        setOnChainContractData(liveData);
      }

      const curAddr = activeAccountRef.current?.address;
      if (curAddr) {
        const details = await fetchWalletOnChainDetails(curAddr);
        if (details) {
          setUsdtAllowance(details.usdtAllowance);
          if (activeAccountRef.current?.isRealWeb3) {
            setActiveAccount(prev => {
              if (!prev) return null;
              if (prev.usdtBalance === details.usdtBalance && prev.bnbBalance === details.bnbBalance) return prev;
              return {
                ...prev,
                usdtBalance: details.usdtBalance,
                bnbBalance: details.bnbBalance
              };
            });
          }
        }
        await fetchWalletIds(curAddr, forceRefresh);
      }

      // Fetch on-chain user data for current active/selected ID
      const targetId = selectedUserIdRef.current || (walletIdsRef.current.length > 0 ? walletIdsRef.current[0] : 1);
      if (targetId && targetId > 0 && isLiveWeb3Ref.current) {
        const onChainUser = await fetchUserFullDetailsOnChain(targetId, forceRefresh);
        if (onChainUser) {
          setOnChainUserCache(prev => {
            const existing = prev[targetId];
            if (
              existing &&
              existing.totalEarnedUSDT === onChainUser.totalEarnedUSDT &&
              existing.pendingRebornUSDT === onChainUser.pendingRebornFunds &&
              existing.sponsorId === onChainUser.sponsorId
            ) {
              return prev;
            }
            return {
              ...prev,
              [targetId]: {
                id: onChainUser.id,
                address: onChainUser.wallet,
                sponsorId: onChainUser.sponsorId,
                isGhost: onChainUser.isGhost,
                registeredAt: 1700000000000,
                rank1Slots: [],
                rank2QueueIndex: -1,
                rank2SlotsFilled: 0,
                rank3BoardPosition: -1,
                rank3SlotsFilled: 0,
                totalEarnedUSDT: onChainUser.totalEarnedUSDT,
                directBonusUSDT: 0,
                rank1EarnedUSDT: 0,
                rank2EarnedUSDT: 0,
                rank3EarnedUSDT: 0,
                pendingRebornUSDT: onChainUser.pendingRebornFunds,
                rebornCount: 0,
                cyclesCompleted: 0,
                referralsCount: 0,
              }
            };
          });
        }
      }
    } catch {
      // Ignore background sync errors
    }
  }, [fetchWalletIds]);

  // Load full on-chain user data when selectedUserId changes
  useEffect(() => {
    if (!isLiveWeb3) return;
    const targetId = selectedUserId || (walletIds.length > 0 ? walletIds[0] : (activeAccount?.id && activeAccount.id !== 999 ? activeAccount.id : 1));
    if (!targetId || targetId <= 0) return;

    let isCancelled = false;
    const loadUser = async () => {
      try {
        const user = await fetchUserFullDetailsOnChain(targetId);
        if (!isCancelled && user) {
          setOnChainUserCache(prev => ({
            ...prev,
            [targetId]: {
              id: user.id,
              address: user.wallet,
              sponsorId: user.sponsorId,
              isGhost: user.isGhost,
              registeredAt: 1700000000000,
              rank1Slots: [],
              rank2QueueIndex: -1,
              rank2SlotsFilled: 0,
              rank3BoardPosition: -1,
              rank3SlotsFilled: 0,
              totalEarnedUSDT: user.totalEarnedUSDT,
              directBonusUSDT: 0,
              rank1EarnedUSDT: 0,
              rank2EarnedUSDT: 0,
              rank3EarnedUSDT: 0,
              pendingRebornUSDT: user.pendingRebornFunds,
              rebornCount: 0,
              cyclesCompleted: 0,
              referralsCount: 0,
            }
          }));
        }
      } catch (err) {
        console.warn(`Error loading on-chain user details for ID ${targetId}:`, err);
      }
    };

    loadUser();
    return () => {
      isCancelled = true;
    };
  }, [selectedUserId, walletIds, activeAccount?.id, isLiveWeb3]);

  // Initial fetch ONCE on mount with progressive loading
  useEffect(() => {
    if (hasInitialFetchedRef.current) return;
    hasInitialFetchedRef.current = true;

    let isMounted = true;
    const initializeData = async () => {
      try {
        setLoadingProgress(25);
        setLoadingStatusText('กำลังดึงข้อมูล Smart Contract จาก BSC...');
        await refreshOnChainData(true);

        if (!isMounted) return;
        setLoadingProgress(65);
        setLoadingStatusText('กำลังตรวจสอบโครงสร้าง Matrix และผังสายงาน...');

        const provider = getBrowserProvider();
        if (provider) {
          const accounts = await provider.send('eth_accounts', []).catch(() => []);
          if (accounts && accounts.length > 0) {
            setLoadingProgress(85);
            setLoadingStatusText('กำลังโหลดบัญชีกระเป๋าและยอดคงเหลือ...');
            await fetchWalletIds(accounts[0], true);
          }
        }

        if (!isMounted) return;
        setLoadingProgress(100);
        setLoadingStatusText('โหลดข้อมูลสำเร็จ');
        setTimeout(() => {
          if (isMounted) setIsInitialLoading(false);
        }, 400);
      } catch (err) {
        console.warn('Initial data load error:', err);
        if (isMounted) {
          setLoadingProgress(100);
          setTimeout(() => {
            if (isMounted) setIsInitialLoading(false);
          }, 300);
        }
      }
    };

    void initializeData();

    // Fallback safety timeout (1.8s max) to guarantee UI displays even on offline/slow RPC
    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setLoadingProgress(100);
        setIsInitialLoading(false);
      }
    }, 1800);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, [refreshOnChainData, fetchWalletIds]);

  // Listen to Web3 account / chain changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ethereum = (window as unknown as { ethereum?: { on?: (event: string, cb: (...args: unknown[]) => void) => void; removeListener?: (event: string, cb: (...args: unknown[]) => void) => void } }).ethereum;
    if (!ethereum?.on) return;

    const handleAccountsChanged = async (accounts: unknown) => {
      const accList = accounts as string[];
      if (accList && accList.length > 0) {
        const addr = accList[0];
        const [balances, details] = await Promise.all([
          fetchWalletBalancesDirect(addr),
          fetchWalletOnChainDetails(addr)
        ]);

        setActiveAccount({
          id: details?.userId || 999,
          label: `🦊 Web3 Wallet (${addr.slice(0, 6)}...${addr.slice(-4)})`,
          address: addr,
          usdtBalance: balances?.usdtBalance ?? details?.usdtBalance ?? 0,
          bnbBalance: balances?.bnbBalance ?? details?.bnbBalance ?? 0,
          isOwner: Boolean(
            addr.toLowerCase() === CONTRACT_OWNER.toLowerCase() ||
            (onChainContractData?.owner && addr.toLowerCase() === onChainContractData.owner.toLowerCase())
          ),
          isRealWeb3: true
        });
        setIsConnected(true);
        setIsLiveWeb3(true);
        if (balances) {
          setUsdtAllowance(balances.usdtAllowance);
        }
        await fetchWalletIds(addr, true);
        refreshOnChainData(true);
      } else {
        setIsConnected(false);
        setIsLiveWeb3(false);
        setActiveAccount(null);
      }
    };

    const handleChainChanged = (chainIdHex: unknown) => {
      const chainIdNum = parseInt(String(chainIdHex), 16);
      setIsBscNetwork(chainIdNum === 56);
      refreshWalletBalance();
      refreshOnChainData(true);
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (ethereum?.removeListener) {
        ethereum.removeListener('accountsChanged', handleAccountsChanged);
        ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [refreshOnChainData, refreshWalletBalance, fetchWalletIds, onChainContractData?.owner]);

  const handleSetActiveTab = useCallback((tab: 'landing' | 'dashboard' | 'matrix' | 'admin' | 'calculator' | 'contract') => {
    setActiveTab(tab);
    void (async () => {
      try {
        await refreshOnChainData(true);
        const addr = activeAccountRef.current?.address;
        if (addr) {
          await refreshWalletBalance(addr);
          await fetchWalletIds(addr, true);
        }
      } catch {
        // Safe background sync
      }
    })();
  }, [refreshOnChainData, refreshWalletBalance, fetchWalletIds]);

  // Automatically refresh smart contract data and wallet balances on EVERY tab/page change
  useEffect(() => {
    let isCancelled = false;
    const syncContractData = async () => {
      try {
        await refreshOnChainData(true);
        if (!isCancelled && isConnected && activeAccount?.address) {
          await refreshWalletBalance();
          await fetchWalletIds(activeAccount.address, true);
        }
      } catch {
        // Safe background sync
      }
    };

    void syncContractData();

    return () => {
      isCancelled = true;
    };
  }, [activeTab, isConnected, activeAccount?.address, refreshOnChainData, refreshWalletBalance, fetchWalletIds]);

  // Real-time synchronization: Keep on-chain data & wallet balance continuously in sync
  useEffect(() => {
    let isCancelled = false;

    const syncRealTime = async (force: boolean = false) => {
      if (isCancelled) return;
      try {
        await refreshOnChainData(force);
        if (!isCancelled && isConnected && activeAccount?.address) {
          await refreshWalletBalance();
          await fetchWalletIds(activeAccount.address, force);
        }
      } catch {
        // Silently handle transient network hiccup
      }
    };

    const handleFocus = () => {
      void syncRealTime(true);
    };

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void syncRealTime(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Continuous Real-Time polling interval (every 4.5 seconds)
    const realTimeInterval = setInterval(() => {
      void syncRealTime(false);
    }, 4500);

    return () => {
      isCancelled = true;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(realTimeInterval);
    };
  }, [isConnected, activeAccount?.address, refreshOnChainData, refreshWalletBalance, fetchWalletIds]);

  const showToast = useCallback((
    title: string, 
    message: string, 
    type: 'success' | 'info' | 'reward' | 'ghost' = 'info', 
    amount?: number,
    txHash?: string
  ) => {
    const newToast: AppNotification = {
      id: `toast_${Date.now()}`,
      title,
      message,
      type,
      timestamp: Date.now(),
      amount,
    };
    setToast(newToast);

    if (txHash) {
      setLastTxHash(txHash);
    }

    if (type === 'reward' || type === 'success') {
      if (typeof window !== 'undefined') {
        import('canvas-confetti')
          .then((mod) => {
            const confettiFn = mod.default || mod;
            if (typeof confettiFn === 'function') {
              confettiFn({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.8 },
                colors: ['#38bdf8', '#facc15', '#22c55e', '#c084fc'],
              });
            }
          })
          .catch(() => {});
      }
      sounds.playSuccess();
    } else if (type === 'ghost') {
      sounds.playGhost();
    } else {
      sounds.playClick();
    }

    setTimeout(() => {
      setToast(null);
    }, 6000);
  }, []);

  // Track unread payment count
  const unreadPaymentCount = useMemo(() => {
    return paymentNotifications.filter(n => !n.isRead).length;
  }, [paymentNotifications]);

  // Mark all incoming payment notifications as read
  const markAllPaymentsAsRead = useCallback(() => {
    setPaymentNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  // Mark single incoming payment as read
  const markPaymentAsRead = useCallback((id: string) => {
    setPaymentNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  // Clear payment notifications history
  const clearPaymentNotifications = useCallback(() => {
    setPaymentNotifications([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('wealthlifecycle_payment_notifications');
      } catch {}
    }
  }, []);

  // Simulate Incoming Payment (for testing, live demo, or verifying sound/toast)
  const simulateIncomingPayment = useCallback((cat: 'SPONSOR_BONUS' | 'RANK1_PAYOUT' | 'RANK2_PAYOUT' | 'RANK3_PAYOUT' = 'SPONSOR_BONUS') => {
    let amountUSDT = 0.20;
    let titleTh = '⚡ ได้รับโบนัสค่าแนะนำตรง 10%';
    let titleEn = '⚡ 10% Direct Sponsor Bonus';
    let detailsTh = 'มีสมาชิกใหม่สมัครผ่านลิงก์แนะนำของคุณ รับ 10% (0.20 USDT) โอนตรงเข้ากระเป๋า';
    let detailsEn = 'A new member joined via your direct link. Earned 10% (0.20 USDT) directly to wallet';

    if (cat === 'RANK1_PAYOUT') {
      amountUSDT = 0.60;
      titleTh = '💎 ได้รับเงินปันผลผัง Rank 1';
      titleEn = '💎 Rank 1 Matrix Slot Payout';
      detailsTh = 'มีรหัสสมาชิกใหม่/Spillover ตกลงมาในผัง 4 ช่อง Rank 1 รับเงินปันผล 0.60 USDT';
      detailsEn = 'A member node filled your Rank 1 4-slot matrix. Earned 0.60 USDT';
    } else if (cat === 'RANK2_PAYOUT') {
      amountUSDT = 2.00;
      titleTh = '🚀 ได้รับเงินสดจากคิวกลาง Rank 2';
      titleEn = '🚀 Rank 2 Global Queue Payout';
      detailsTh = 'คิวกลาง Rank 2 รันมาถึงรอบจ่ายเงิน รับเงินสด 50% (2.00 USDT) โอนตรงเข้ากระเป๋า';
      detailsEn = 'Rank 2 FIFO queue reached payout slot. Received 50% cash (2.00 USDT)';
    } else if (cat === 'RANK3_PAYOUT') {
      amountUSDT = 8.00;
      titleTh = '👑 ได้รับเงินสดบอร์ด Rank 3 Master';
      titleEn = '👑 Rank 3 Master Board Payout';
      detailsTh = 'กระดาน Rank 3 ครบ 4 ช่อง รับเงินสด 8.00 USDT เต็มจำนวน พร้อมเสกผี 4 ตัวช่วยดันโครงข่าย';
      detailsEn = 'Rank 3 board completed all 4 slots. Received full 8.00 USDT cash payout';
    }

    const randHex = Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const txHash = `0x${randHex}`;
    const targetUserId = selectedUserId || walletIds[0] || 1;
    const targetAddr = activeAccount?.address || '0x992B0852d7e108d43E388d2239d5Fec92455c408';

    const newPayment: PaymentReceivedNotification = {
      id: `pay_sim_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      txHash,
      timestamp: Date.now(),
      amountUSDT,
      category: cat,
      titleTh,
      titleEn,
      detailsTh,
      detailsEn,
      toUser: targetUserId,
      toAddress: targetAddr,
      isRead: false,
    };

    setPaymentNotifications(prev => [newPayment, ...prev]);

    if (paymentSoundEnabled && !isMuted) {
      if (cat === 'RANK3_PAYOUT') {
        sounds.playUpgrade();
      } else {
        sounds.playCoin();
      }
    }

    showToast(
      lang === 'th' ? titleTh : titleEn,
      lang === 'th' ? detailsTh : detailsEn,
      'reward',
      amountUSDT,
      txHash
    );
  }, [selectedUserId, walletIds, activeAccount?.address, paymentSoundEnabled, isMuted, lang, showToast]);

  // Real-time detection of new incoming payment transactions
  const knownTxIdsRef = useRef<Set<string>>(new Set());
  const hasPopulatedKnownTxsRef = useRef<boolean>(false);

  // Monitor for newly incoming payment transactions during session
  useEffect(() => {
    if (!contractState?.transactions || contractState.transactions.length === 0) return;

    if (!hasPopulatedKnownTxsRef.current) {
      hasPopulatedKnownTxsRef.current = true;
      contractState.transactions.forEach(t => knownTxIdsRef.current.add(t.id));
      return;
    }

    const newPaymentTxs = contractState.transactions.filter(tx => {
      if (knownTxIdsRef.current.has(tx.id)) return false;
      knownTxIdsRef.current.add(tx.id);
      return (
        tx.amountUSDT > 0 &&
        tx.status === 'SUCCESS' &&
        (
          tx.type === 'SPONSOR_BONUS' || 
          tx.type === 'RANK1_PAYOUT' || 
          tx.type === 'RANK2_PAYOUT' || 
          tx.type === 'RANK3_PAYOUT' || 
          tx.type === 'RANK2_CYCLE' || 
          tx.type === 'RANK3_CYCLE' ||
          tx.type === 'CLAIM_REWARD' ||
          tx.type === 'PROCESS_REBORN'
        )
      );
    });

    if (newPaymentTxs.length > 0) {
      const generatedNotifs: PaymentReceivedNotification[] = newPaymentTxs.map(tx => {
        let category: PaymentReceivedNotification['category'] = 'SPONSOR_BONUS';
        let titleTh = '⚡ ได้รับโบนัสค่าแนะนำตรง 10%';
        let titleEn = '⚡ 10% Direct Sponsor Bonus Received';
        let detailsTh = `ได้รับเงินโอนเข้ากระเป๋า +${tx.amountUSDT.toFixed(2)} USDT`;
        let detailsEn = `Received payout +${tx.amountUSDT.toFixed(2)} USDT directly to wallet`;

        if (tx.type === 'RANK1_PAYOUT') {
          category = 'RANK1_PAYOUT';
          titleTh = '💎 ได้รับเงินปันผลผัง Rank 1';
          titleEn = '💎 Rank 1 Matrix Slot Payout';
          detailsTh = `มีรหัสตกลงมาในผัง 4 ช่อง Rank 1 ของคุณ ได้รับ +${tx.amountUSDT.toFixed(2)} USDT`;
          detailsEn = `A member node filled your Rank 1 slot. Received +${tx.amountUSDT.toFixed(2)} USDT`;
        } else if (tx.type === 'RANK2_PAYOUT' || tx.type === 'RANK2_CYCLE') {
          category = 'RANK2_PAYOUT';
          titleTh = '🚀 ได้รับเงินสดจากคิวกลาง Rank 2';
          titleEn = '🚀 Rank 2 Global Queue Payout';
          detailsTh = `คิวกลาง Rank 2 รันมาถึง ได้รับเงินสด 50% +${tx.amountUSDT.toFixed(2)} USDT เข้ากระเป๋า`;
          detailsEn = `Rank 2 FIFO queue reached payout slot. Received +${tx.amountUSDT.toFixed(2)} USDT in cash`;
        } else if (tx.type === 'RANK3_PAYOUT' || tx.type === 'RANK3_CYCLE') {
          category = 'RANK3_PAYOUT';
          titleTh = '👑 ได้รับเงินสดบอร์ด Rank 3 Master';
          titleEn = '👑 Rank 3 Master Board Payout';
          detailsTh = `จบกระดาน Rank 3 ได้รับเงินสด +${tx.amountUSDT.toFixed(2)} USDT`;
          detailsEn = `Rank 3 board completed. Received +${tx.amountUSDT.toFixed(2)} USDT in cash`;
        } else if (tx.type === 'PROCESS_REBORN') {
          category = 'REBORN_PAYOUT';
          titleTh = '✨ รับเงินสนับสนุน Reborn';
          titleEn = '✨ Reborn Payout Allocation';
        } else if (tx.type === 'CLAIM_REWARD') {
          category = 'CLAIM_REWARD';
          titleTh = '🎁 เคลมเงินรางวัลสำเร็จ';
          titleEn = '🎁 Claimed Reward Payout';
        }

        return {
          id: `pay_${Date.now()}_${tx.id}`,
          txHash: tx.txHash,
          timestamp: tx.timestamp || Date.now(),
          amountUSDT: tx.amountUSDT,
          category,
          titleTh,
          titleEn,
          detailsTh,
          detailsEn,
          toUser: tx.userId,
          toAddress: tx.userAddress,
          isRead: false,
        };
      });

      setPaymentNotifications(prev => [...generatedNotifs, ...prev]);

      const top = generatedNotifs[0];
      if (paymentSoundEnabled && !isMuted) {
        sounds.playCoin();
      }
      showToast(
        lang === 'th' ? top.titleTh : top.titleEn,
        lang === 'th' ? top.detailsTh : top.detailsEn,
        'reward',
        top.amountUSDT,
        top.txHash
      );
    }
  }, [contractState?.transactions, paymentSoundEnabled, isMuted, lang, showToast]);

  // Run Simulation Once (On-Demand Single Step Execution)
  const runSimulationOnce = useCallback(() => {
    const randomAction = Math.random();
    if (randomAction < 0.6) {
      // Register random simulated user
      const randHex = Math.random().toString(16).slice(2, 6);
      const randomAddress = `0xSim_${randHex}...${Math.random().toString(16).slice(2, 6)}`;
      const randomSponsor = Math.floor(Math.random() * Math.min(6, Math.max(1, contractState.users.length))) + 1;
      const res = matrixContract.registerUser(randomAddress, randomSponsor);
      if (res.success) {
        sounds.playCoin();
        showToast(
          lang === 'th' ? '⚡ จำลองลงทะเบียน 1 รายการ สำเร็จ' : '⚡ Single Simulation Registered',
          lang === 'th' ? `จำลองผู้ใช้ใหม่ #${res.user?.id || ''} เข้าร่วมสายงาน #${randomSponsor}` : `Simulated User #${res.user?.id || ''} joined sponsor #${randomSponsor}`,
          'success'
        );
      }
    } else if (randomAction < 0.85) {
      // Process Reborn or spawn ghost
      const res = matrixContract.spawnGhosts(1, 1, 'Single Step Sim');
      if (res.success) {
        sounds.playGhost();
        showToast(
          lang === 'th' ? '👻 เสกผีดันผัง Rank 1 สำเร็จ (1 ครั้ง)' : '👻 Ghost Spawned into Rank 1 (1 Step)',
          lang === 'th' ? 'ดันสมาชิกในผังขึ้น 1 ตำแหน่ง' : 'Advanced matrix slot by 1',
          'ghost'
        );
      }
    } else {
      // Advance queue
      const res = matrixContract.spawnGhosts(2, 1, 'Single Queue Push');
      if (res.success) {
        showToast(
          lang === 'th' ? '🚀 ดันคิว Rank 2 สำเร็จ (1 ครั้ง)' : '🚀 Advanced Rank 2 Queue (1 Step)',
          lang === 'th' ? 'ส่งรหัสผีดันคิวกลาง 1 รายการ' : 'Injected 1 ghost into global queue',
          'reward'
        );
      }
    }
  }, [contractState.users.length, lang, showToast]);

  /**
   * Connect Real Injected Web3 Wallet (TokenPocket / MetaMask / Trust Wallet / Binance Web3)
   */
  const connectInjectedWeb3Wallet = async (walletName?: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    const provider = getBrowserProvider(walletName);
    if (!provider) {
      showToast(
        lang === 'th' ? 'ไม่พบ Web3 Wallet' : 'No Web3 Wallet Detected',
        lang === 'th' ? 'กรุณาติดตั้ง TokenPocket, MetaMask, Trust Wallet หรือเปิดใน DApp Browser' : 'Please install TokenPocket, MetaMask, or Trust Wallet to connect directly on-chain.',
        'info'
      );
      return false;
    }

    try {
      setTxPending(true);
      // Request accounts
      const accounts = await provider.send('eth_requestAccounts', []);
      if (!accounts || accounts.length === 0) {
        setTxPending(false);
        return false;
      }

      // Check / switch chain to BSC
      await switchOrAddBscChain(walletName);

      const signer = await provider.getSigner();
      const userAddr = await signer.getAddress();
      const network = await provider.getNetwork();
      const isBsc = Number(network.chainId) === 56;
      setIsBscNetwork(isBsc);

      // Fetch direct live balances and on-chain details in parallel
      const [balances, details] = await Promise.all([
        fetchWalletBalancesDirect(userAddr),
        fetchWalletOnChainDetails(userAddr)
      ]);

      // Resolve friendly wallet prefix
      let walletIcon = '👛';
      let cleanWalletName = walletName || 'Web3 Wallet';
      if (cleanWalletName.toLowerCase().includes('tokenpocket') || cleanWalletName.toLowerCase() === 'tp') {
        walletIcon = '👛';
        cleanWalletName = 'TokenPocket';
      } else if (cleanWalletName.toLowerCase().includes('metamask')) {
        walletIcon = '🦊';
        cleanWalletName = 'MetaMask';
      } else if (cleanWalletName.toLowerCase().includes('trust')) {
        walletIcon = '🛡️';
        cleanWalletName = 'Trust Wallet';
      } else if (cleanWalletName.toLowerCase().includes('binance')) {
        walletIcon = '🟡';
        cleanWalletName = 'Binance Web3';
      } else if (cleanWalletName.toLowerCase().includes('okx')) {
        walletIcon = '🌐';
        cleanWalletName = 'OKX Wallet';
      }

      const realAcc: WalletAccount = {
        id: details?.userId || 999,
        label: `${walletIcon} ${cleanWalletName} (${userAddr.slice(0, 6)}...${userAddr.slice(-4)})`,
        address: userAddr,
        usdtBalance: balances?.usdtBalance ?? details?.usdtBalance ?? 0,
        bnbBalance: balances?.bnbBalance ?? details?.bnbBalance ?? 0,
        isOwner: Boolean(
          userAddr.toLowerCase() === CONTRACT_OWNER.toLowerCase() ||
          (onChainContractData?.owner && userAddr.toLowerCase() === onChainContractData.owner.toLowerCase())
        ),
        isRealWeb3: true
      };

      setActiveAccount(realAcc);
      setIsConnected(true);
      setIsLiveWeb3(true);
      setActiveTab('dashboard');
      if (balances) {
        setUsdtAllowance(balances.usdtAllowance);
      } else if (details) {
        setUsdtAllowance(details.usdtAllowance);
      }
      setTxPending(false);

      // Immediately fetch all IDs mapped to this wallet
      await fetchWalletIds(userAddr, true);

      sounds.playSuccess();
      showToast(
        lang === 'th' ? `${walletIcon} เชื่อมต่อ ${cleanWalletName} สำเร็จ!` : `${walletIcon} ${cleanWalletName} Connected!`,
        `${userAddr.slice(0, 8)}...${userAddr.slice(-6)} on ${isBsc ? 'BNB Smart Chain' : 'Chain ' + network.chainId}`,
        'success'
      );
      return true;
    } catch (err: unknown) {
      setTxPending(false);
      const message = (err as { message?: string })?.message || 'Connection rejected';
      showToast(
        lang === 'th' ? 'การเชื่อมต่อถูกยกเลิก' : 'Connection Cancelled',
        message.slice(0, 80),
        'info'
      );
      return false;
    }
  };

  // Auto check on-chain connection on mount if provider already authorized
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const provider = getBrowserProvider();
    if (!provider) return;

    provider.send('eth_accounts', []).then(async (accounts: string[]) => {
      if (accounts && accounts.length > 0) {
        const userAddr = accounts[0];
        const network = await provider.getNetwork().catch(() => ({ chainId: 56 }));
        setIsBscNetwork(Number(network.chainId) === 56);
        const [balances, details] = await Promise.all([
          fetchWalletBalancesDirect(userAddr),
          fetchWalletOnChainDetails(userAddr)
        ]);
        let detectedIcon = '🌐';
        let detectedName = 'Web3 Wallet';
        const win = window as unknown as {
          tokenpocket?: unknown;
          trustwallet?: unknown;
          binancew3w?: unknown;
          ethereum?: { isTokenPocket?: boolean; isTp?: boolean; isTrust?: boolean; isMetaMask?: boolean; isBinance?: boolean };
        };
        if (win.tokenpocket || win.ethereum?.isTokenPocket || win.ethereum?.isTp) {
          detectedIcon = '👛';
          detectedName = 'TokenPocket';
        } else if (win.trustwallet || win.ethereum?.isTrust) {
          detectedIcon = '🛡️';
          detectedName = 'Trust Wallet';
        } else if (win.ethereum?.isMetaMask) {
          detectedIcon = '🦊';
          detectedName = 'MetaMask';
        } else if (win.binancew3w || win.ethereum?.isBinance) {
          detectedIcon = '🟡';
          detectedName = 'Binance Web3';
        }

        const realAcc: WalletAccount = {
          id: details?.userId || 0,
          label: `${detectedIcon} ${detectedName} (${userAddr.slice(0, 6)}...${userAddr.slice(-4)})`,
          address: userAddr,
          usdtBalance: balances?.usdtBalance ?? details?.usdtBalance ?? 0,
          bnbBalance: balances?.bnbBalance ?? details?.bnbBalance ?? 0,
          isOwner: userAddr.toLowerCase() === CONTRACT_OWNER.toLowerCase(),
          isRealWeb3: true
        };
        setActiveAccount(realAcc);
        setIsConnected(true);
        setIsLiveWeb3(true);
        // Keep initial view on landing page (หน้าแรก)
        if (balances) {
          setUsdtAllowance(balances.usdtAllowance);
        } else if (details) {
          setUsdtAllowance(details.usdtAllowance);
        }
      }
    }).catch(() => {
      // User has not connected yet
    });
  }, []);

  /**
   * Connect Web3 Account
   */
  const connectWallet = (account?: WalletAccount) => {
    if (!account) {
      connectInjectedWeb3Wallet();
      return;
    }
    setActiveAccount(account);
    setIsConnected(true);
    setIsLiveWeb3(account.isRealWeb3 || false);
    if (account.id && account.id > 0 && account.id !== 999) {
      setSelectedUserId(account.id);
    }
    setActiveTab('dashboard');
    sounds.playSuccess();
    if (account.address && ethers.isAddress(account.address)) {
      refreshWalletBalance(account.address);
      fetchWalletIds(account.address);
    }
    showToast(
      lang === 'th' ? 'เชื่อมต่อกระเป๋าสำเร็จ' : 'Wallet Connected',
      `${account.label} (${account.address.slice(0, 6)}...${account.address.slice(-4)})`,
      'success'
    );
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setActiveAccount(null);
    setSelectedUserId(null);
    setWalletIds([]);
    setIsLiveWeb3(false);
    setActiveTab('landing');
    sounds.playClick();
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    sounds.setMuted(next);
  };

  /**
   * Approve USDT Token Allowance for WealthLifeCycle Contract (One-time Unlimited Approval)
   */
  const approveUsdtAllowance = async (amount?: number): Promise<boolean> => {
    if (!activeAccount) return false;

    // If real Web3 is connected
    if (activeAccount.isRealWeb3 && typeof window !== 'undefined') {
      const provider = getBrowserProvider();
      if (!provider) return false;

      try {
        setTxPending(true);
        const signer = await provider.getSigner();
        const userAddress = await signer.getAddress();
        const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);

        // Check if already approved
        const currentAllowanceRaw = await usdtContract.allowance(userAddress, CONTRACT_ADDRESS).catch(() => BigInt(0));
        const currentAllowance = Number(ethers.formatUnits(currentAllowanceRaw, 18));

        if (currentAllowance >= 2.0) {
          setTxPending(false);
          setUsdtAllowance(currentAllowance > 100000 ? 999999999 : currentAllowance);
          showToast(
            lang === 'th' ? '✅ อนุมัติ USDT เรียบร้อยแล้ว' : '✅ USDT Already Approved',
            lang === 'th' ? 'กระเป๋าของคุณได้รับอนุมัติวงเงินแล้ว ไม่จำเป็นต้องกดอนุมัติซ้ำ' : 'Your wallet already has sufficient USDT allowance.',
            'success'
          );
          return true;
        }
        
        // Use MaxUint256 (Unlimited Allowance) so users ONLY need to approve once in their wallet's lifetime!
        const parseAmt = amount ? ethers.parseUnits(amount.toString(), 18) : ethers.MaxUint256;
        showToast(
          lang === 'th' ? 'กำลังทำรายการ Approve USDT (ครั้งเดียว)...' : 'Approving USDT Allowance (1-Time)...',
          lang === 'th' ? 'กรุณากดยืนยันในกระเป๋า (อนุมัติเพียงครั้งเดียวตลอดชีพ)' : 'Please confirm in wallet (One-time approval).',
          'info'
        );

        const tx = await usdtContract.approve(CONTRACT_ADDRESS, parseAmt);
        setLastTxHash(tx.hash);
        showToast(
          lang === 'th' ? 'ส่งคำสั่ง Approve แล้ว' : 'Approval Submitted',
          `Tx: ${tx.hash.slice(0, 10)}... รอคอนเฟิร์มบนบล็อกเชน`,
          'info',
          undefined,
          tx.hash
        );

        await tx.wait();
        setTxPending(false);
        setUsdtAllowance(999999999);
        sounds.playSuccess();

        showToast(
          lang === 'th' ? '✅ อนุมัติ USDT สำเร็จ (ครั้งเดียวตลอดชีพ)!' : '✅ USDT Approved (Permanent)!',
          lang === 'th' ? 'อนุมัติวงเงินสำเร็จแล้ว สามารถกดสมัครสมาชิกได้ทันที' : 'Approved successfully. You can now register immediately.',
          'success',
          undefined,
          tx.hash
        );
        return true;
      } catch (err: unknown) {
        setTxPending(false);
        const msg = (err as { message?: string })?.message || 'Approve transaction failed';
        showToast('Approve Error', msg.slice(0, 90), 'info');
        return false;
      }
    }

    // Preset / Simulated Account
    setUsdtAllowance(999999999);
    showToast(
      lang === 'th' ? '✅ อนุมัติ USDT สำเร็จ (Simulated)' : '✅ USDT Approved (Simulated)',
      'อนุมัติวงเงินพร้อมสำหรับการลงทะเบียนแล้ว',
      'success'
    );
    return true;
  };

  /**
   * Register on WealthLifeCycle Smart Contract: register(sponsorId, parentId)
   */
  const registerCurrentAccount = async (rawSponsorId: number = 1, rawParentId: number = 0): Promise<boolean> => {
    const sponsorId = Math.max(1, Math.floor(Number(rawSponsorId) || 1));
    const parentId = Math.max(0, Math.floor(Number(rawParentId) || 0));

    if (!activeAccount) {
      showToast(
        lang === 'th' ? 'กรุณาเชื่อมต่อกระเป๋า' : 'Wallet Required',
        lang === 'th' ? 'กรุณาเชื่อมต่อกระเป๋า Web3 ก่อนทำการสมัครสมาชิก' : 'Please connect your Web3 wallet first',
        'info'
      );
      return false;
    }

    // Modal initial popup: "กรุณารอผลสักครู่"
    setRegistrationModal({
      isOpen: true,
      status: 'preparing',
      title: lang === 'th' ? 'กรุณารอผลสักครู่' : 'Please wait a moment...',
      stepText: lang === 'th' ? 'กำลังตรวจสอบเครือข่าย BSC และยอดเงิน USDT...' : 'Checking BSC network and USDT balance...',
      sponsorId
    });

    if (typeof window === 'undefined') return false;
    const provider = getBrowserProvider();
    
    // Fallback for simulated testing
    if (!activeAccount.isRealWeb3 || !provider) {
      try {
        setTxPending(true);
        setRegistrationModal({
          isOpen: true,
          status: 'submitting',
          title: lang === 'th' ? 'กรุณารอผลสักครู่' : 'Please wait a moment...',
          stepText: lang === 'th' ? `กำลังบันทึกข้อมูลและบรรจุลงผังเมทริกซ์ (ผู้แนะนำ #${sponsorId})...` : `Processing registration under Sponsor #${sponsorId}...`,
          sponsorId
        });
        await new Promise(r => setTimeout(r, 1500));

        const regResult = matrixContract.registerUser(activeAccount.address, sponsorId);
        const assignedId = regResult.user?.id || (contractState.users.length + 1);

        setTxPending(false);
        sounds.playSuccess();

        setRegistrationModal({
          isOpen: true,
          status: 'success',
          title: lang === 'th' ? '🎉 สมัครสมาชิกสำเร็จ!' : '🎉 Registration Completed!',
          stepText: lang === 'th' ? `ยินดีต้อนรับสู่ WealthLifeCycle รหัสของคุณคือ #${assignedId}` : `Welcome! Your assigned ID is #${assignedId}`,
          sponsorId,
          newUserId: assignedId
        });

        await refreshOnChainData(true);
        if (assignedId) {
          setSelectedUserId(assignedId);
        }

        showToast(
          lang === 'th' ? '🎉 สมัครสมาชิกสำเร็จ!' : '🎉 Registration Successful!',
          lang === 'th' ? `สมัครสำเร็จได้รหัส #${assignedId} (ผู้แนะนำ #${sponsorId})` : `Registered ID #${assignedId} under Sponsor #${sponsorId}`,
          'reward',
          2.0
        );
        return true;
      } catch {
        setTxPending(false);
        setRegistrationModal({
          isOpen: true,
          status: 'error',
          title: lang === 'th' ? 'การสมัครสมาชิกล้มเหลว' : 'Registration Failed',
          stepText: lang === 'th' ? 'ไม่สามารถลงทะเบียนได้ กรุณาลองใหม่อีกครั้ง' : 'Failed to register. Please try again.',
          errorMessage: 'Simulation registration error',
          sponsorId
        });
        return false;
      }
    }

    try {
      setTxPending(true);

      // Check & ensure BSC Network (Chain ID 56)
      const network = await provider.getNetwork().catch(() => ({ chainId: 56 }));
      if (Number(network.chainId) !== 56) {
        setRegistrationModal({
          isOpen: true,
          status: 'preparing',
          title: lang === 'th' ? 'กรุณารอผลสักครู่' : 'Please wait a moment...',
          stepText: lang === 'th' ? 'กำลังสลับไปยัง BNB Smart Chain (Chain ID: 56)...' : 'Switching to BSC Mainnet...',
          sponsorId
        });
        const switched = await switchOrAddBscChain();
        if (!switched) {
          setTxPending(false);
          setRegistrationModal({
            isOpen: true,
            status: 'error',
            title: lang === 'th' ? 'เครือข่ายไม่ถูกต้อง' : 'Wrong Network',
            stepText: lang === 'th' ? 'กรุณาสลับไปยัง BNB Smart Chain เพื่อทำรายการ' : 'Please switch to BNB Smart Chain',
            errorMessage: 'User did not switch to BSC Mainnet',
            sponsorId
          });
          return false;
        }
      }

      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Check USDT BEP-20 Balance
      const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, signer);
      const usdtBalanceRaw = await usdtContract.balanceOf(userAddress).catch(() => BigInt(0));
      const usdtBalance = Number(ethers.formatUnits(usdtBalanceRaw, 18));

      if (usdtBalance < 2.0) {
        setTxPending(false);
        const errMsg = lang === 'th' 
          ? `ยอดเงิน USDT ในกระเป๋าไม่พอ (มี ${usdtBalance.toFixed(2)} USDT, ต้องการ 2.00 USDT BEP-20 สำหรับค่าสมัคร)` 
          : `Insufficient USDT balance (Have ${usdtBalance.toFixed(2)} USDT, need 2.00 USDT BEP-20)`;
        setRegistrationModal({
          isOpen: true,
          status: 'error',
          title: lang === 'th' ? 'ยอดเงิน USDT ไม่เพียงพอ' : 'Insufficient USDT Balance',
          stepText: errMsg,
          errorMessage: errMsg,
          sponsorId
        });
        return false;
      }

      // Step 1: Check USDT Allowance and Approve once if needed
      const currentAllowanceRaw = await usdtContract.allowance(userAddress, CONTRACT_ADDRESS).catch(() => BigInt(0));
      const currentAllowance = Number(ethers.formatUnits(currentAllowanceRaw, 18));

      if (currentAllowance < 2.0) {
        setRegistrationModal({
          isOpen: true,
          status: 'approving',
          title: lang === 'th' ? 'กรุณารอผลสักครู่' : 'Please wait a moment...',
          stepText: lang === 'th' ? 'กรุณากดยืนยันการอนุมัติ USDT (ครั้งเดียวตลอดชีพ) ในกระเป๋าเงินของคุณ...' : 'Please confirm one-time USDT approval in your wallet...',
          sponsorId
        });

        // Approve unlimited MaxUint256 so subsequent actions NEVER ask for Approve again
        const appTx = await usdtContract.approve(CONTRACT_ADDRESS, ethers.MaxUint256);
        setLastTxHash(appTx.hash);
        
        setRegistrationModal({
          isOpen: true,
          status: 'approving',
          title: lang === 'th' ? 'กรุณารอผลสักครู่' : 'Please wait a moment...',
          stepText: lang === 'th' ? 'ส่งคำสั่งอนุมัติแล้ว กำลังรอบันทึกบล็อก USDT Allowance บน BSC...' : 'Approval broadcasted. Waiting for blockchain confirmation...',
          txHash: appTx.hash,
          sponsorId
        });

        await appTx.wait();
        setUsdtAllowance(999999999);
      } else {
        setUsdtAllowance(currentAllowance > 100000 ? 999999999 : currentAllowance);
      }

      // Step 2: Call Smart Contract register(sponsorId, parentId)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setRegistrationModal({
        isOpen: true,
        status: 'submitting',
        title: lang === 'th' ? 'กรุณารอผลสักครู่' : 'Please wait a moment...',
        stepText: lang === 'th' 
          ? `กรุณากดยืนยันคำสั่ง register(${sponsorId}, ${parentId}) ในกระเป๋าของคุณ (ค่าสมัคร 2 USDT)...` 
          : `Please confirm register(${sponsorId}, ${parentId}) transaction in your wallet...`,
        sponsorId
      });

      // Execute register(sponsorId, parentId)
      const tx = await contract.register(sponsorId, parentId);
      setLastTxHash(tx.hash);
      sounds.playUpgrade();

      setRegistrationModal({
        isOpen: true,
        status: 'waiting_block',
        title: lang === 'th' ? 'กรุณารอผลสักครู่' : 'Please wait a moment...',
        stepText: lang === 'th' ? 'ส่งคำสั่งสมัครแล้ว กำลังยืนยันบล็อกและจัดวางตำแหน่งลงในผังเมทริกซ์...' : 'Transaction sent. Waiting for block confirmation & matrix placement...',
        txHash: tx.hash,
        sponsorId
      });

      const receipt = await tx.wait();
      setTxPending(false);
      sounds.playSuccess();

      // Parse Registered event from receipt logs to obtain exact on-chain newId and placementId
      let onChainNewId: number | undefined = undefined;
      let onChainPlacementId: number | undefined = undefined;
      try {
        const iface = new ethers.Interface(CONTRACT_ABI);
        for (const log of receipt.logs || []) {
          try {
            const parsed = iface.parseLog(log);
            if (parsed && parsed.name === 'Registered') {
              onChainNewId = Number(parsed.args.newId || parsed.args[0]);
              onChainPlacementId = Number(parsed.args.placementId || parsed.args[3]);
              break;
            }
          } catch {
            // non-contract log
          }
        }
      } catch (parseError) {
        console.warn('Failed to parse Registered event:', parseError);
      }

      // Update local mock contract state with the exact on-chain ID
      const regResult = matrixContract.registerUser(userAddress, sponsorId, onChainNewId, onChainPlacementId);
      const assignedId = onChainNewId || regResult.user?.id;

      invalidateWalletIdsCache(userAddress);
      await refreshOnChainData(true);
      await fetchWalletIds(userAddress, true);

      if (assignedId) {
        setSelectedUserId(assignedId);
      }

      // Show Success in the Waiting Modal with assigned member ID!
      setRegistrationModal({
        isOpen: true,
        status: 'success',
        title: lang === 'th' ? '🎉 สมัครสมาชิกสำเร็จ!' : '🎉 Registration Completed!',
        stepText: lang === 'th' 
          ? `สมัครสำเร็จได้รหัส #${assignedId || '?'} (ผู้แนะนำ #${sponsorId}) บันทึกลงบล็อกเชนเรียบร้อยแล้ว` 
          : `Registered successfully as ID #${assignedId || '?'} under Sponsor #${sponsorId} on BSC!`,
        txHash: tx.hash,
        sponsorId,
        newUserId: assignedId
      });

      showToast(
        lang === 'th' ? '🎉 สมัครสมาชิกบนบล็อกเชนสำเร็จ!' : '🎉 Registration Confirmed on Chain!',
        lang === 'th' 
          ? `สมัครสำเร็จได้รหัส #${assignedId || '?'} (ผู้แนะนำ #${sponsorId}) เข้าสู่แดชบอร์ดแล้ว` 
          : `Registered successfully as ID #${assignedId || '?'} under Sponsor #${sponsorId}. Entering dashboard...`,
        'reward',
        2.0,
        tx.hash
      );
      return true;
    } catch (err: unknown) {
      setTxPending(false);
      const errorObj = err as { code?: string | number; message?: string; shortMessage?: string; reason?: string };
      const errorMessage = errorObj.shortMessage || errorObj.reason || errorObj.message || 'Transaction failed';
      
      let userFriendlyMsg = errorMessage;
      if (errorMessage.includes('user rejected') || errorMessage.includes('ACTION_REJECTED')) {
        userFriendlyMsg = lang === 'th' ? 'คุณยกเลิกการทำธุรกรรมในกระเป๋า' : 'Transaction rejected by user';
      } else if (errorMessage.includes('insufficient funds') || errorMessage.includes('gas')) {
        userFriendlyMsg = lang === 'th' ? 'BNB ไม่พอจ่ายค่า Gas บน BSC' : 'Insufficient BNB for gas fee';
      } else if (errorMessage.includes('SponsorNotActive')) {
        userFriendlyMsg = lang === 'th' ? `รหัสผู้แนะนำ #${sponsorId} ยังไม่ได้เปิดใช้งานในระบบ` : `Sponsor ID #${sponsorId} is not active`;
      }

      setRegistrationModal({
        isOpen: true,
        status: 'error',
        title: lang === 'th' ? 'การสมัครสมาชิกล้มเหลว' : 'Registration Failed',
        stepText: userFriendlyMsg,
        errorMessage: userFriendlyMsg,
        sponsorId
      });

      showToast(
        lang === 'th' ? 'การสมัครสมาชิกล้มเหลว' : 'Registration Error',
        userFriendlyMsg.slice(0, 100),
        'info'
      );
      return false;
    }
  };

  /**
   * Renew ID lifespan on Smart Contract: renewId(uint256 _userId)
   */
  const renewIdOnChain = async (userId: number): Promise<boolean> => {
    if (userId <= 0) return false;
    if (activeAccount?.isRealWeb3 && typeof window !== 'undefined') {
      const provider = getBrowserProvider();
      if (!provider) return false;
      try {
        setTxPending(true);
        const signer = await provider.getSigner();
        const tx = await renewIdService(userId, signer);
        setLastTxHash(tx.hash);
        showToast(
          lang === 'th' ? '⏳ ส่งคำสั่งต่ออายุแล้ว' : '⏳ Renewal Tx Broadcasted',
          `Tx: ${tx.hash.slice(0, 10)}... (ID #${userId})`,
          'info',
          undefined,
          tx.hash
        );
        await tx.wait();
        setTxPending(false);
        await refreshOnChainData(true);
        await refreshWalletBalance();
        showToast(
          lang === 'th' ? '🎉 ต่ออายุ ID สำเร็จ!' : '🎉 ID Renewed Successfully!',
          lang === 'th' ? `ID #${userId} ได้รับการต่ออายุ +7 วันเรียบร้อยแล้ว` : `ID #${userId} active lifespan renewed for 7 days`,
          'success',
          undefined,
          tx.hash
        );
        return true;
      } catch (err: unknown) {
        setTxPending(false);
        const msg = (err as { reason?: string; message?: string })?.reason || (err as { message?: string })?.message || 'Error';
        showToast(
          lang === 'th' ? '❌ ต่ออายุไม่สำเร็จ' : '❌ Renewal Failed',
          msg.includes('user rejected') ? (lang === 'th' ? 'ผู้ใช้ยกเลิกการทำรายการ' : 'Transaction rejected') : msg.slice(0, 90),
          'info'
        );
        return false;
      }
    }

    // Simulation Mode
    const simRes = matrixContract.renewId(userId);
    if (simRes.success) {
      await refreshWalletBalance();
      showToast(
        lang === 'th' ? '🎉 ต่ออายุ ID สำเร็จ (Sim)!' : '🎉 ID Renewed (Sim)!',
        lang === 'th' ? `ID #${userId} ได้รับการต่ออายุ +7 วันเรียบร้อยแล้ว` : `ID #${userId} renewed for 7 days`,
        'success'
      );
      return true;
    }
    return false;
  };

  /**
   * Check if an ID has expired: isIdExpired(uint256 _userId)
   */
  const isIdExpiredOnChain = async (userId: number): Promise<boolean> => {
    if (userId <= 0) return false;
    if (isLiveWeb3Ref.current) {
      return await checkIsIdExpiredOnChain(userId);
    }
    return matrixContract.isIdExpired(userId);
  };

  /**
   * Process Reborn Queue on Smart Contract
   */
  const processRebornOnChain = async (batchSize: number = 2): Promise<boolean> => {
    if (activeAccount?.isRealWeb3 && typeof window !== 'undefined') {
      const provider = getBrowserProvider();
      if (!provider) return false;
      try {
        setTxPending(true);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const tx = await contract.processRebornQueue(batchSize);
        setLastTxHash(tx.hash);
        showToast(
          lang === 'th' ? 'ส่งคำสั่ง Process Reborn แล้ว' : 'Process Reborn Tx Sent',
          `Tx: ${tx.hash.slice(0, 10)}...`,
          'ghost',
          undefined,
          tx.hash
        );
        await tx.wait();
        setTxPending(false);
        matrixContract.processReborn(batchSize);
        await refreshOnChainData();
        showToast(
          lang === 'th' ? '⚡ ประมวลผล Reborn บนบล็อกเชนสำเร็จ!' : '⚡ Reborn Processed on Chain!',
          'ดันคิวและเกิดรหัสผีสำเร็จ',
          'ghost',
          undefined,
          tx.hash
        );
        return true;
      } catch (err: unknown) {
        setTxPending(false);
        const msg = (err as { message?: string })?.message || 'Error';
        showToast('Reborn Tx Error', msg.slice(0, 80), 'info');
        return false;
      }
    }

    // Simulation
    const result = matrixContract.processReborn(batchSize);
    if (result.success) {
      showToast(
        lang === 'th' ? '⚡ ประมวลผล Reborn สำเร็จ!' : '⚡ Reborn Processed!',
        lang === 'th' ? `สร้างรหัสผี ${result.ghostsCreated} รหัส ดันคิวผู้เล่นขึ้นสำเร็จ` : `Spawned ${result.ghostsCreated} Ghost accounts from Reborn Reserve`,
        'ghost'
      );
      return true;
    }
    return false;
  };

  /**
   * Admin Spawn Ghost Pushes on Smart Contract
   */
  const spawnGhostPushesOnChain = async (rank: number, amount: number): Promise<boolean> => {
    if (activeAccount?.isRealWeb3 && typeof window !== 'undefined') {
      const provider = getBrowserProvider();
      if (!provider) return false;
      try {
        setTxPending(true);
        const signer = await provider.getSigner();
        const signerAddress = await signer.getAddress();
        const isSignerOwner = signerAddress.toLowerCase() === CONTRACT_OWNER.toLowerCase();

        if (!isSignerOwner) {
          setTxPending(false);
          showToast(
            lang === 'th' ? '⚠️ ต้องใช้กระเป๋า Owner' : '⚠️ Owner Wallet Required',
            lang === 'th' 
              ? `เฉพาะกระเป๋า Owner (${CONTRACT_OWNER.slice(0, 6)}...${CONTRACT_OWNER.slice(-4)}) เท่านั้นที่ส่งคำสั่ง BSC ได้ (จำลองผลในระบบให้แทน)`
              : `Only contract owner can execute on BSC (Ran in simulation mode instead)`,
            'info'
          );
          // Fallback to local simulation
          const result = matrixContract.spawnGhosts(rank as 1 | 2 | 3, amount, 'Admin Manual Injection');
          if (result.success) {
            showToast(
              lang === 'th' ? '👻 เสกผีเข้าสู่ระบบสำเร็จ!' : '👻 Ghosts Injected!',
              lang === 'th' ? `ฉีด ${result.spawnedCount} รหัสผีเข้าสู่ Rank ${rank} เรียบร้อยแล้ว` : `Injected ${result.spawnedCount} Ghost accounts into Rank ${rank}`,
              'ghost'
            );
            return true;
          }
          return false;
        }

        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        // Note: On BSC Smart Contract, adminSpawnGhostPushes supports Rank 2 (Silver Queue) and Rank 3 (Gold Board).
        // If Rank 1 is selected on-chain, route to processRebornQueue
        let tx;
        if (rank === 1) {
          tx = await contract.processRebornQueue(amount);
        } else {
          tx = await contract.adminSpawnGhostPushes(rank, amount);
        }

        setLastTxHash(tx.hash);
        showToast(
          lang === 'th' ? 'ส่งคำสั่งเสกผีไปยัง BSC แล้ว' : 'Admin Ghost Push Broadcasted',
          `Tx: ${tx.hash.slice(0, 10)}...`,
          'ghost',
          undefined,
          tx.hash
        );
        await tx.wait();
        setTxPending(false);
        matrixContract.spawnGhosts(rank as 1 | 2 | 3, amount, 'Admin On-Chain Push');
        await refreshOnChainData();
        showToast(
          lang === 'th' ? '👻 เสกผีบน Smart Contract สำเร็จ!' : '👻 Ghosts Spawned on Chain!',
          `ฉีด ${amount} รหัสผีเข้าสู่ Rank ${rank} เรียบร้อย`,
          'ghost',
          undefined,
          tx.hash
        );
        return true;
      } catch (err: unknown) {
        setTxPending(false);
        const msg = (err as { reason?: string; message?: string })?.reason || (err as { message?: string })?.message || 'Error';
        showToast(
          lang === 'th' ? 'เกิดข้อผิดพลาดในการส่งคำสั่ง' : 'Admin Ghost Error',
          msg.includes('user rejected') || msg.includes('ACTION_REJECTED')
            ? (lang === 'th' ? 'ผู้ใช้ยกเลิกการทำรายการในกระเป๋า' : 'Transaction rejected in wallet')
            : msg.slice(0, 90),
          'info'
        );
        return false;
      }
    }

    // Simulation
    const result = matrixContract.spawnGhosts(rank as 1 | 2 | 3, amount, 'Admin Manual Injection');
    if (result.success) {
      showToast(
        lang === 'th' ? '👻 เสกผีเข้าสู่ระบบสำเร็จ!' : '👻 Ghosts Injected!',
        lang === 'th' ? `ฉีด ${result.spawnedCount} รหัสผีเข้าสู่ Rank ${rank} เรียบร้อยแล้ว` : `Injected ${result.spawnedCount} Ghost accounts into Rank ${rank}`,
        'ghost'
      );
      return true;
    }
    return false;
  };

  /**
   * Admin set Queue Head on Smart Contract: adminSetQueueHead(uint256 rank, uint256 newHeadIndex)
   */
  const adminSetQueueHeadOnChain = async (rank: number, newHeadIndex: number): Promise<boolean> => {
    if (activeAccount?.isRealWeb3 && typeof window !== 'undefined') {
      const provider = getBrowserProvider();
      if (!provider) return false;
      try {
        setTxPending(true);
        const signer = await provider.getSigner();
        const tx = await adminSetQueueHeadService(rank, newHeadIndex, signer);
        setLastTxHash(tx.hash);
        showToast(
          lang === 'th' ? 'ส่งคำสั่งตั้งค่า Queue Head แล้ว' : 'Set Queue Head Tx Broadcasted',
          `Tx: ${tx.hash.slice(0, 10)}... (Rank ${rank} -> Head ${newHeadIndex})`,
          'info',
          undefined,
          tx.hash
        );
        await tx.wait();
        setTxPending(false);
        await refreshOnChainData(true);
        showToast(
          lang === 'th' ? '✅ อัปเดต Queue Head สำเร็จ!' : '✅ Queue Head Updated!',
          `Rank ${rank} queue head pointer updated to ${newHeadIndex}`,
          'success',
          undefined,
          tx.hash
        );
        return true;
      } catch (err: unknown) {
        setTxPending(false);
        const msg = (err as { reason?: string; message?: string })?.reason || (err as { message?: string })?.message || 'Error';
        showToast(
          lang === 'th' ? 'เกิดข้อผิดพลาดในการตั้งค่า Head' : 'Set Queue Head Error',
          msg.includes('user rejected') ? (lang === 'th' ? 'ผู้ใช้ยกเลิกการทำรายการ' : 'Transaction rejected') : msg.slice(0, 90),
          'info'
        );
        return false;
      }
    }

    // Simulation Mode
    matrixContract.adminSetQueueHead(rank, newHeadIndex);
    showToast(
      lang === 'th' ? '✅ อัปเดต Queue Head สำเร็จ (Sim)' : '✅ Queue Head Updated (Sim)',
      `Rank ${rank} queue head set to index ${newHeadIndex}`,
      'success'
    );
    return true;
  };

  /**
   * Set Pause on Smart Contract
   */
  const setPauseOnChain = async (paused: boolean): Promise<boolean> => {
    if (activeAccount?.isRealWeb3 && typeof window !== 'undefined') {
      const provider = getBrowserProvider();
      if (!provider) return false;
      try {
        setTxPending(true);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const tx = await contract.setPause(paused);
        setLastTxHash(tx.hash);
        await tx.wait();
        setTxPending(false);
        await refreshOnChainData();
        showToast(
          paused ? '⏸️ Contract Paused' : '▶️ Contract Resumed',
          `Status updated on BSC`,
          'info',
          undefined,
          tx.hash
        );
        return true;
      } catch (err: unknown) {
        setTxPending(false);
        const msg = (err as { message?: string })?.message || 'Error';
        showToast('Pause Error', msg.slice(0, 80), 'info');
        return false;
      }
    }
    showToast(paused ? '⏸️ Paused (Sim)' : '▶️ Resumed (Sim)', 'Simulation state updated', 'info');
    return true;
  };

  /**
   * Lock Migration Permanently on Smart Contract
   */
  const lockMigrationOnChain = async (): Promise<boolean> => {
    if (activeAccount?.isRealWeb3 && typeof window !== 'undefined') {
      const provider = getBrowserProvider();
      if (!provider) return false;
      try {
        setTxPending(true);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const tx = await contract.lockMigration();
        setLastTxHash(tx.hash);
        await tx.wait();
        setTxPending(false);
        await refreshOnChainData();
        showToast('🔒 Migration Locked', 'Migration locked permanently on BSC', 'info', undefined, tx.hash);
        return true;
      } catch (err: unknown) {
        setTxPending(false);
        const msg = (err as { message?: string })?.message || 'Error';
        showToast('Lock Migration Error', msg.slice(0, 80), 'info');
        return false;
      }
    }
    showToast('🔒 Migration Locked (Sim)', 'Simulation migration locked', 'info');
    return true;
  };

  /**
   * Emergency Withdraw Tokens on Smart Contract (USDT & BEP-20)
   */
  const emergencyWithdrawOnChain = async (tokenAddress: string, amount: string | number | bigint): Promise<boolean> => {
    const targetToken = tokenAddress && tokenAddress.trim() !== '' ? tokenAddress.trim() : USDT_ADDRESS;
    const isUsdt = targetToken.toLowerCase() === USDT_ADDRESS.toLowerCase();
    const numAmount = typeof amount === 'number' ? amount : Number(amount) || 0;

    if (activeAccount?.isRealWeb3 && typeof window !== 'undefined') {
      const provider = getBrowserProvider();
      if (!provider) return false;
      try {
        setTxPending(true);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const formattedAmount = typeof amount === 'bigint' ? amount : ethers.parseUnits(String(amount), 18);
        const tx = await contract.emergencyWithdraw(targetToken, formattedAmount);
        setLastTxHash(tx.hash);
        showToast(
          lang === 'th' ? 'ส่งคำสั่งถอนเหรียญฉุกเฉินแล้ว' : 'Emergency Withdraw Tx Sent',
          `Tx: ${tx.hash.slice(0, 10)}...`,
          'info',
          undefined,
          tx.hash
        );
        await tx.wait();
        setTxPending(false);
        await refreshOnChainData();
        await refreshWalletBalance();
        showToast(
          lang === 'th' ? '💸 ถอนเหรียญฉุกเฉินสำเร็จ!' : '💸 Emergency Withdraw Successful!',
          lang === 'th' 
            ? `ถอน ${numAmount} ${isUsdt ? 'USDT' : 'Tokens'} เข้ากระเป๋า Owner เรียบร้อยแล้ว` 
            : `Withdrew ${numAmount} ${isUsdt ? 'USDT' : 'Tokens'} to Owner wallet`,
          'success',
          isUsdt ? numAmount : undefined,
          tx.hash
        );
        return true;
      } catch (err: unknown) {
        setTxPending(false);
        const msg = (err as { message?: string })?.message || 'Error';
        showToast(
          lang === 'th' ? 'การถอนเหรียญล้มเหลว' : 'Withdraw Error', 
          msg.slice(0, 100), 
          'info'
        );
        return false;
      }
    }

    // Simulation Mode
    const simResult = matrixContract.emergencyWithdraw(targetToken, numAmount, activeAccount?.address || CONTRACT_OWNER);
    if (simResult.success) {
      await refreshWalletBalance();
      showToast(
        lang === 'th' ? '💸 ถอนเหรียญฉุกเฉินสำเร็จ (จำลอง)!' : '💸 Emergency Withdraw Successful (Sim)!',
        lang === 'th' 
          ? `ถอน ${numAmount} ${isUsdt ? 'USDT' : 'Tokens'} เข้ากระเป๋าเรียบร้อยแล้ว` 
          : `Withdrew ${numAmount} ${isUsdt ? 'USDT' : 'Tokens'} to Owner wallet (Simulation)`,
        'success',
        isUsdt ? numAmount : undefined,
        simResult.txHash
      );
      return true;
    }
    return false;
  };

  /**
   * Batch Migrate Users on Smart Contract (UserMigrationData[] matching new contract)
   */
  const batchMigrateUsersOnChain = async (params: BatchMigrateUsersParams): Promise<boolean> => {
    const userCount = Array.isArray(params) ? params.length : params.ids.length;
    if (activeAccount?.isRealWeb3 && typeof window !== 'undefined') {
      const provider = getBrowserProvider();
      if (!provider) return false;
      try {
        setTxPending(true);
        const signer = await provider.getSigner();
        const tx = await batchMigrateUsersService(params, signer);
        setLastTxHash(tx.hash);
        await tx.wait();
        setTxPending(false);
        await refreshOnChainData();
        showToast(
          lang === 'th' ? '✅ ย้ายข้อมูลสมาชิกสำเร็จ' : '✅ Migration Successful',
          `Migrated ${userCount} users on BSC`,
          'success',
          undefined,
          tx.hash
        );
        return true;
      } catch (err: unknown) {
        setTxPending(false);
        const msg = (err as { message?: string })?.message || 'Error';
        showToast('Migration Error', msg.slice(0, 80), 'info');
        return false;
      }
    }
    showToast('✅ Migration Simulated', `Migrated ${userCount} users in simulation`, 'success');
    return true;
  };

  /**
   * Batch Migrate Global Queues on Smart Contract
   */
  const batchMigrateGlobalQueuesOnChain = async (
    migrations: Array<{
      rank: number;
      userId: number;
      isAutoReborn: boolean;
      isGhost: boolean;
      slotsFilled: number;
      downlineUserIds: number[];
    }>
  ): Promise<boolean> => {
    if (activeAccount?.isRealWeb3 && typeof window !== 'undefined') {
      const provider = getBrowserProvider();
      if (!provider) return false;
      try {
        setTxPending(true);
        const signer = await provider.getSigner();
        const tx = await batchMigrateGlobalQueuesService(migrations, signer);
        setLastTxHash(tx.hash);
        await tx.wait();
        setTxPending(false);
        await refreshOnChainData(true);
        showToast(
          lang === 'th' ? '✅ ย้ายข้อมูล Global Queues สำเร็จ' : '✅ Global Queues Migrated',
          `Migrated ${migrations.length} queue entries on BSC`,
          'success',
          undefined,
          tx.hash
        );
        return true;
      } catch (err: unknown) {
        setTxPending(false);
        const msg = (err as { message?: string })?.message || 'Error';
        showToast('Queue Migration Error', msg.slice(0, 80), 'info');
        return false;
      }
    }
    showToast('✅ Queue Migration Simulated', `Migrated ${migrations.length} entries in simulation`, 'success');
    return true;
  };

  // Resolve current user from state (prioritizing on-chain live data when in Live Web3 mode)
  let currentUser: MatrixUser | undefined = undefined;
  const effectiveUserId = (selectedUserId && selectedUserId > 0)
    ? selectedUserId
    : (walletIds.length > 0 ? walletIds[0] : (activeAccount?.id && activeAccount.id !== 999 ? activeAccount.id : 1));

  const cachedOnChainUser = effectiveUserId ? onChainUserCache[effectiveUserId] : undefined;
  const mockUser = effectiveUserId ? matrixContract.getUser(effectiveUserId) : (activeAccount ? matrixContract.getUser(activeAccount.address) : undefined);

  if (isLiveWeb3 && cachedOnChainUser) {
    currentUser = {
      ...(mockUser || {}),
      ...cachedOnChainUser,
      id: effectiveUserId,
      address: cachedOnChainUser.address || activeAccount?.address || '0x0000000000000000000000000000000000000000',
      sponsorId: cachedOnChainUser.sponsorId || mockUser?.sponsorId || 1,
      totalEarnedUSDT: cachedOnChainUser.totalEarnedUSDT !== undefined ? cachedOnChainUser.totalEarnedUSDT : (mockUser?.totalEarnedUSDT || 0),
      isGhost: cachedOnChainUser.isGhost ?? false,
      registeredAt: mockUser?.registeredAt || 1700000000000,
      rank1Slots: mockUser?.rank1Slots || [],
      rank2QueueIndex: mockUser?.rank2QueueIndex || -1,
      rank2SlotsFilled: mockUser?.rank2SlotsFilled || 0,
      rank3BoardPosition: mockUser?.rank3BoardPosition || -1,
      rank3SlotsFilled: mockUser?.rank3SlotsFilled || 0,
      directBonusUSDT: mockUser?.directBonusUSDT || 0,
      rank1EarnedUSDT: mockUser?.rank1EarnedUSDT || 0,
      rank2EarnedUSDT: mockUser?.rank2EarnedUSDT || 0,
      rank3EarnedUSDT: mockUser?.rank3EarnedUSDT || 0,
      pendingRebornUSDT: cachedOnChainUser.pendingRebornUSDT !== undefined ? cachedOnChainUser.pendingRebornUSDT : (mockUser?.pendingRebornUSDT || 0),
      rebornCount: mockUser?.rebornCount || 0,
      cyclesCompleted: mockUser?.cyclesCompleted || 0,
      referralsCount: mockUser?.referralsCount || 0,
    };
  } else if (mockUser) {
    currentUser = mockUser;
  } else if (effectiveUserId) {
    currentUser = {
      id: effectiveUserId,
      address: activeAccount?.address || '0x0000000000000000000000000000000000000000',
      sponsorId: 1,
      isGhost: false,
      registeredAt: 1700000000000,
      rank1Slots: [],
      rank2QueueIndex: -1,
      rank2SlotsFilled: 0,
      rank3BoardPosition: -1,
      rank3SlotsFilled: 0,
      totalEarnedUSDT: 0,
      directBonusUSDT: 0,
      rank1EarnedUSDT: 0,
      rank2EarnedUSDT: 0,
      rank3EarnedUSDT: 0,
      pendingRebornUSDT: 0,
      rebornCount: 0,
      cyclesCompleted: 0,
      referralsCount: 0,
    };
  }

  const claimRewardsCurrentAccount = async (): Promise<boolean> => {
    if (!activeAccount) return false;
    const user = currentUser;
    if (!user || user.totalEarnedUSDT <= 0) {
      showToast(
        lang === 'th' ? 'ไม่มียอดค้างรับ' : 'No Claimable Balance',
        lang === 'th' ? 'คุณยังไม่มียอดเงินรางวัลที่ถอนได้ในขณะนี้' : 'No rewards to claim right now',
        'info'
      );
      return false;
    }

    await new Promise(r => setTimeout(r, 1000));
    const result = matrixContract.claimRewards(user.id);
    if (result.success) {
      setActiveAccount((prev) => prev ? { ...prev, usdtBalance: prev.usdtBalance + result.amount } : null);
      showToast(
        lang === 'th' ? '💎 ถอนรายได้เข้ากระเป๋าสำเร็จ!' : '💎 Claimed to Wallet Successfully!',
        lang === 'th'
          ? `โอน ${result.amount.toFixed(2)} USDT เข้ากระเป๋าของคุณแล้ว`
          : `Transferred ${result.amount.toFixed(2)} USDT to your wallet balance`,
        'reward',
        result.amount
      );
      return true;
    }
    return false;
  };

  const toggleBotTraffic = () => {
    const next = !isBotActive;
    setIsBotActive(next);
    showToast(
      next
        ? (lang === 'th' ? '🤖 เปิดบอทจำลองทราฟฟิกเรียลไทม์' : '🤖 Live Bot Traffic Simulation ON')
        : (lang === 'th' ? '⏹️ ปิดบอทจำลองทราฟฟิก' : '⏹️ Live Bot Traffic Simulation OFF'),
      next
        ? (lang === 'th' ? 'ระบบจะจำลองผู้เล่นใหม่และเสกผีดันคิวทุก 4.5 วินาที' : 'Generating simulated participants & ghost pushes every 4.5s')
        : (lang === 'th' ? 'หยุดการทำงานของบอทจำลอง' : 'Simulation stopped'),
      'info'
    );
  };

  const resetEntireSystem = () => {
    matrixContract.resetToGenesis();
    setIsBotActive(false);
    showToast(
      lang === 'th' ? '🔄 รีเซ็ตระบบสำเร็จ!' : '🔄 System Reset to Genesis!',
      lang === 'th'
        ? 'คืนค่าผัง Matrix, คิวระดับโลก, และสถิติทั้งหมดกลับสู่สถานะเริ่มต้น Genesis State เรียบร้อยแล้ว'
        : 'All matrix trees, queues, and balances have been restored to initial Genesis state.',
      'reward'
    );
  };

  // Exact Smart Contract caller: idTotalEarned(uint256 id)
  const getIdTotalEarned = useCallback(async (id: number): Promise<number> => {
    if (!id || id <= 0) return 0;
    if (isLiveWeb3Ref.current) {
      try {
        const onChainEarned = await fetchIdTotalEarnedOnChain(id);
        if (onChainEarned > 0) return onChainEarned;
      } catch {
        // Fallback
      }
    }
    return matrixContract.idTotalEarned(id);
  }, []);

  // Exact Smart Contract caller: getWalletAllData(address _wallet)
  const getWalletAllData = useCallback(async (
    walletAddress?: string,
    forceRefresh: boolean = false
  ): Promise<UserDashboardData[]> => {
    const targetAddr = walletAddress || activeAccountRef.current?.address;
    if (!targetAddr) return [];
    if (isLiveWeb3Ref.current && ethers.isAddress(targetAddr)) {
      try {
        const res = await fetchWalletAllDataOnChain(targetAddr, forceRefresh);
        if (res && res.length > 0) {
          return res;
        }
      } catch {
        // Fallback
      }
    }
    return matrixContract.getWalletAllData(targetAddr);
  }, []);

  // Exact Smart Contract caller: getWalletTotalEarned(address _wallet) - calculated primarily from getWalletAllData
  const getWalletTotalEarned = useCallback(async (
    walletAddress?: string,
    forceRefresh: boolean = false
  ): Promise<number> => {
    const targetAddr = walletAddress || activeAccountRef.current?.address;
    if (!targetAddr) return 0;

    // 1. Primary source: calculate sum of totalEarned from getWalletAllData(walletAddress)
    try {
      const allData = await getWalletAllData(targetAddr, forceRefresh);
      if (allData && allData.length > 0) {
        const sum = allData.reduce((acc, curr) => acc + (Number(curr.totalEarned) || 0), 0);
        return sum;
      }
    } catch {
      // Continue to on-chain fallback
    }

    if (isLiveWeb3Ref.current && ethers.isAddress(targetAddr)) {
      try {
        const onChainEarned = await fetchWalletTotalEarnedOnChain(targetAddr, forceRefresh);
        return onChainEarned;
      } catch {
        // Fallback
      }
    }
    return matrixContract.getWalletTotalEarned(targetAddr);
  }, [getWalletAllData]);

  // Exact Smart Contract caller: getWalletAvailableRank1Nodes(address _wallet)
  const getWalletAvailableRank1Nodes = useCallback(async (
    walletAddress?: string,
    forceRefresh: boolean = false
  ): Promise<{ availableIds: number[]; downlineCounts: number[] }> => {
    const targetAddr = walletAddress || activeAccountRef.current?.address;
    if (!targetAddr) return { availableIds: [], downlineCounts: [] };
    if (isLiveWeb3Ref.current && ethers.isAddress(targetAddr)) {
      try {
        const res = await fetchWalletAvailableRank1NodesOnChain(targetAddr, forceRefresh);
        return res;
      } catch {
        // Fallback
      }
    }
    return matrixContract.getWalletAvailableRank1Nodes(targetAddr);
  }, []);

  // Exact Smart Contract caller: getWalletExpiredIdsAndTotalEarned(address _wallet)
  const getWalletExpiredIdsAndTotalEarned = useCallback(async (
    walletAddress?: string
  ): Promise<{ expiredIds: number[]; earnedAmounts: number[] }> => {
    const targetAddr = walletAddress || activeAccountRef.current?.address;
    if (!targetAddr) return { expiredIds: [], earnedAmounts: [] };
    if (isLiveWeb3Ref.current && ethers.isAddress(targetAddr)) {
      try {
        return await fetchWalletExpiredIdsAndTotalEarnedOnChain(targetAddr);
      } catch {
        // Fallback
      }
    }
    return matrixContract.getWalletExpiredIdsAndTotalEarned(targetAddr);
  }, []);

  // Exact Smart Contract caller: hasReachedRank2(uint256)
  const checkHasReachedRank2 = useCallback(async (userId: number): Promise<boolean> => {
    if (userId <= 0) return false;
    if (isLiveWeb3Ref.current) {
      return await checkHasReachedRank2OnChain(userId);
    }
    const u = matrixContract.getUser(userId);
    return Boolean(u && (u.rank2QueueIndex > 0 || u.rank3BoardPosition > 0));
  }, []);

  const t = translations[lang];

  // Derive total members count directly from Smart Contract lastUserId
  const lastUserId = onChainContractData?.lastUserId && onChainContractData.lastUserId > 0
    ? onChainContractData.lastUserId
    : (contractState.stats.lastUserId || contractState.stats.totalUsers || contractState.users.length);

  const totalMembers = lastUserId;

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        activeAccount,
        currentUser,
        contractState,
        onChainContractData,
        lastUserId,
        totalMembers,
        walletIds,
        walletAllData,
        walletAllDataMap,
        selectedUserId,
        setSelectedUserId,
        fetchWalletIds,
        lang,
        t,
        theme,
        setTheme,
        toggleTheme,
        isMuted,
        activeTab,
        systemStatus,
        setSystemStatus,
        toast,
        isBotActive,
        isLiveWeb3,
        isBscNetwork,
        txPending,
        lastTxHash,
        usdtAllowance,
        hasInjected,
        registrationModal,
        closeRegistrationModal,
        setLang,
        toggleMute,
        setActiveTab: handleSetActiveTab,
        connectWallet,
        connectInjectedWeb3Wallet,
        disconnectWallet,
        approveUsdtAllowance,
        registerCurrentAccount,
        checkParentValid: checkParentValidOnChain,
        findOptimalPlacement: findOptimalPlacementOnChain,
        getTeamAvailablePlacements: getTeamAvailablePlacementsOnChain,
        getPlatformStats: fetchPlatformStatsOnChain,
        getPlatformAnalytics: fetchPlatformAnalyticsOnChain,
        getDeployTime: fetchDeployTimeOnChain,
        renewIdOnChain,
        isIdExpiredOnChain,
        claimRewardsCurrentAccount,
        processRebornOnChain,
        spawnGhostPushesOnChain,
        adminSetQueueHeadOnChain,
        setPauseOnChain,
        lockMigrationOnChain,
        emergencyWithdrawOnChain,
        batchMigrateUsersOnChain,
        batchMigrateGlobalQueuesOnChain,
        toggleBotTraffic,
        runSimulationOnce,
        resetEntireSystem,
        refreshOnChainData,
        refreshWalletBalance,
        getIdTotalEarned,
        getWalletTotalEarned,
        getWalletAvailableRank1Nodes,
        getWalletAllData,
        getWalletExpiredIdsAndTotalEarned,
        checkHasReachedRank2,
        isInitialLoading,
        loadingProgress,
        loadingStatusText,
        showToast,
        paymentNotifications,
        unreadPaymentCount,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        paymentSoundEnabled,
        setPaymentSoundEnabled,
        markAllPaymentsAsRead,
        markPaymentAsRead,
        clearPaymentNotifications,
        simulateIncomingPayment,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
