'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../lib/wallet-context';
import { matrixContract } from '../lib/mock-contract';
import { CONTRACT_ADDRESS, USDT_ADDRESS, BSC_CONFIG } from '../lib/contracts-config';
import { fetchTeamTreeOnChain } from '../lib/web3-service';
import { MatrixNodeView, MatrixUser, UserDashboardData } from '../lib/types';
import { getSafeReferralUrl, getSafeQueryParam, copyToClipboardSafe } from '../lib/utils';
import { useLaunchCountdown } from '../lib/launch-config';
import { LaunchCountdownWidget } from './LaunchCountdownWidget';
import { 
  User, 
  Copy, 
  Check, 
  ExternalLink, 
  DollarSign, 
  Zap, 
  ShieldCheck, 
  Clock, 
  Ghost, 
  Sparkles, 
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  RefreshCw,
  Coins,
  Layers,
  Search,
  X,
  ChevronDown,
  Link2,
  UserPlus,
  LayoutGrid,
  CheckCircle2,
  TrendingUp,
  Award,
  Flame,
  ArrowUpDown,
  Table as TableIcon,
  List,
  Filter,
  SlidersHorizontal,
  Bell
} from 'lucide-react';

interface DashboardProps {
  onOpenConnectModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenConnectModal }) => {
  const { 
    isConnected, 
    activeAccount, 
    currentUser, 
    contractState, 
    onChainContractData,
    lastUserId,
    totalMembers,
    walletIds,
    walletAllDataMap,
    selectedUserId,
    setSelectedUserId,
    fetchWalletIds,
    theme,
    lang, 
    t, 
    isLiveWeb3,
    txPending,
    lastTxHash,
    usdtAllowance,
    approveUsdtAllowance,
    registerCurrentAccount, 
    claimRewardsCurrentAccount,
    refreshOnChainData,
    refreshWalletBalance,
    getIdTotalEarned,
    getWalletTotalEarned,
    getWalletAvailableRank1Nodes,
    getWalletAllData,
    renewIdOnChain,
    isIdExpiredOnChain,
    getWalletExpiredIdsAndTotalEarned,
    checkHasReachedRank2,
    setActiveTab,
    showToast,
    setIsPaymentModalOpen,
    unreadPaymentCount,
  } = useWallet();

  const { isLaunched, formattedCountdown, launchDateFormattedTh, launchDateFormattedEn } = useLaunchCountdown();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
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
  const [isClaiming, setIsClaiming] = useState(false);
  const [isSpawningQuickGhost, setIsSpawningQuickGhost] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingWalletIds, setIsFetchingWalletIds] = useState(false);
  const [directSwitchIdInput, setDirectSwitchIdInput] = useState('');
  const [isIdModalOpen, setIsIdModalOpen] = useState(false);

  // Transactions Section state
  const [txFilterType, setTxFilterType] = useState<'ALL' | 'REGISTER' | 'SPONSOR_BONUS' | 'MATRIX' | 'REBORN_GHOST'>('ALL');
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txLimit, setTxLimit] = useState(8);

  // Available Rank 1 Nodes state (getWalletAvailableRank1Nodes)
  const [isRank1ModalOpen, setIsRank1ModalOpen] = useState(false);
  const [availableRank1Data, setAvailableRank1Data] = useState<{ availableIds: number[]; downlineCounts: number[] }>({ availableIds: [], downlineCounts: [] });
  const [isFetchingRank1, setIsFetchingRank1] = useState(false);
  const [rank1SortOrder, setRank1SortOrder] = useState<'leastEmpty' | 'mostEmpty' | 'idAsc' | 'idDesc'>('leastEmpty');
  const [rank1SearchQuery, setRank1SearchQuery] = useState<string>('');
  const [rank1SlotFilter, setRank1SlotFilter] = useState<'all' | number>('all');

  // Compute stats for available slots (1, 2, 3, 4 empty slots)
  const rank1SlotStats = React.useMemo(() => {
    const stats = { total: 0, s1: 0, s2: 0, s3: 0, s4: 0 };
    if (!availableRank1Data.availableIds) return stats;
    availableRank1Data.availableIds.forEach((_, idx) => {
      const filled = availableRank1Data.downlineCounts[idx] ?? 0;
      const rem = Math.max(0, 4 - filled);
      stats.total++;
      if (rem === 1) stats.s1++;
      else if (rem === 2) stats.s2++;
      else if (rem === 3) stats.s3++;
      else if (rem === 4) stats.s4++;
    });
    return stats;
  }, [availableRank1Data]);

  // Processed and sorted Rank 1 Nodes (Default: Least empty slots on top)
  const sortedRank1AvailableNodes = React.useMemo(() => {
    if (!availableRank1Data.availableIds || availableRank1Data.availableIds.length === 0) return [];

    const rawList = availableRank1Data.availableIds.map((id, index) => {
      const filledCount = availableRank1Data.downlineCounts[index] ?? 0;
      const remainingSlots = Math.max(0, 4 - filledCount);
      const userObj = matrixContract.getUser(id);
      return {
        id,
        filledCount,
        remainingSlots,
        userObj
      };
    });

    let list = rawList;

    // Filter by search ID
    if (rank1SearchQuery.trim()) {
      const q = rank1SearchQuery.trim().toLowerCase();
      list = list.filter(item => item.id.toString().includes(q));
    }

    // Filter by remaining empty slots
    if (rank1SlotFilter !== 'all') {
      list = list.filter(item => item.remainingSlots === rank1SlotFilter);
    }

    // Sort nodes
    return list.sort((a, b) => {
      if (rank1SortOrder === 'leastEmpty') {
        // เรียงจำนวนช่องว่างน้อยสุดอยู่บน (ว่าง 1 ช่อง -> ว่าง 2 ช่อง -> ว่าง 3 ช่อง -> ว่าง 4 ช่อง)
        if (a.remainingSlots !== b.remainingSlots) {
          return a.remainingSlots - b.remainingSlots;
        }
        return a.id - b.id;
      } else if (rank1SortOrder === 'mostEmpty') {
        // เรียงจำนวนช่องว่างมากสุดอยู่บน (ว่าง 4 ช่อง -> ว่าง 3 ช่อง -> ว่าง 2 ช่อง -> ว่าง 1 ช่อง)
        if (a.remainingSlots !== b.remainingSlots) {
          return b.remainingSlots - a.remainingSlots;
        }
        return a.id - b.id;
      } else if (rank1SortOrder === 'idAsc') {
        return a.id - b.id;
      } else if (rank1SortOrder === 'idDesc') {
        return b.id - a.id;
      }
      return 0;
    });
  }, [availableRank1Data, rank1SortOrder, rank1SearchQuery, rank1SlotFilter]);

  // Complete Wallet All Data state (getWalletAllData)
  const [isWalletAllDataModalOpen, setIsWalletAllDataModalOpen] = useState(false);
  const [walletAllDataList, setWalletAllDataList] = useState<UserDashboardData[]>([]);
  const [isFetchingWalletAllData, setIsFetchingWalletAllData] = useState(false);
  const [walletAllDataSearchAddr, setWalletAllDataSearchAddr] = useState('');
  const [walletAllDataSortOrder, setWalletAllDataSortOrder] = useState<'idAsc' | 'idDesc' | 'earnedDesc' | 'earnedAsc' | 'r1Desc'>('earnedDesc');
  const [walletAllDataIdFilter, setWalletAllDataIdFilter] = useState<string>('');
  const [walletAllDataRankFilter, setWalletAllDataRankFilter] = useState<'all' | 'hasR1' | 'hasR2' | 'hasR3'>('all');
  const [walletAllDataViewMode, setWalletAllDataViewMode] = useState<'grid' | 'table'>('table');

  // Live Total Earned from Smart Contract function idTotalEarned(uint256 id)
  const [liveTotalEarned, setLiveTotalEarned] = useState<number>(() => currentUser?.totalEarnedUSDT || 0);
  const [isQueryingEarned, setIsQueryingEarned] = useState<boolean>(false);
  const [customQueryId, setCustomQueryId] = useState<string>('');
  const [customQueryResult, setCustomQueryResult] = useState<{ id: number; earned: number } | null>(null);
  const [isCustomQuerying, setIsCustomQuerying] = useState<boolean>(false);

  // Per-ID Earnings and Details cache
  const [idEarningsMap, setIdEarningsMap] = useState<Record<number, number>>({});

  // ID Renewal & Expiration states
  const [renewingId, setRenewingId] = useState<number | null>(null);
  const [isExpiredIdsModalOpen, setIsExpiredIdsModalOpen] = useState<boolean>(false);
  const [expiredIdsData, setExpiredIdsData] = useState<{ expiredIds: number[]; earnedAmounts: number[] } | null>(null);
  const [isFetchingExpiredData, setIsFetchingExpiredData] = useState<boolean>(false);

  // Function to renew an ID
  const handleRenewId = async (id: number) => {
    if (id <= 0) return;
    setRenewingId(id);
    try {
      await renewIdOnChain(id);
      const target = activeAccount?.address || currentUser?.address;
      if (target) {
        await handleFetchWalletAllData(true, target);
      }
    } finally {
      setRenewingId(null);
    }
  };

  // Function to query all expired IDs for the wallet
  const handleFetchExpiredIds = async () => {
    const target = activeAccount?.address || currentUser?.address;
    if (!target) return;
    setIsFetchingExpiredData(true);
    try {
      const res = await getWalletExpiredIdsAndTotalEarned(target);
      setExpiredIdsData(res);
      setIsExpiredIdsModalOpen(true);
    } catch {
      showToast('Error', 'Failed to fetch expired IDs', 'info');
    } finally {
      setIsFetchingExpiredData(false);
    }
  };

  // =========================================================================
  // getTeamTree(ID) state for Dashboard Rank 1 Visualizer
  // =========================================================================
  const [customTreeRootId, setCustomTreeRootId] = useState<number | null>(null);
  const dashboardTreeRootId = customTreeRootId !== null ? customTreeRootId : (selectedUserId || currentUser?.id || 1);
  const [dashboardTreeInputId, setDashboardTreeInputId] = useState<string>('');
  const [dashboardTree, setDashboardTree] = useState<{
    root: MatrixNodeView | MatrixUser | null;
    level1: (MatrixNodeView | MatrixUser | { id: number; isGhost: boolean; isSlotEmpty: true })[];
    level2: Record<number, (MatrixNodeView | MatrixUser | { id: number; isGhost: boolean; isSlotEmpty: true })[]>;
  } | null>(null);
  const [isFetchingTree, setIsFetchingTree] = useState<boolean>(false);
  const [lastTreeQueryTime, setLastTreeQueryTime] = useState<string>('');

  // Function to manually reload getTeamTree(rootId)
  const loadDashboardTree = useCallback(async (rootId: number) => {
    if (!rootId || rootId <= 0) return;
    setIsFetchingTree(true);
    try {
      if (isLiveWeb3) {
        const onChainTree = await fetchTeamTreeOnChain(rootId);
        if (onChainTree && onChainTree.root) {
          setDashboardTree(onChainTree);
          setLastTreeQueryTime(new Date().toLocaleTimeString());
          return;
        }
      }

      // Local Engine / Fallback
      const localTree = matrixContract.getTeamTree(rootId);
      if (localTree) {
        setDashboardTree(localTree);
      } else {
        setDashboardTree(null);
      }
      setLastTreeQueryTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn(`Error querying getTeamTree(${rootId}):`, err);
      const localTree = matrixContract.getTeamTree(rootId);
      if (localTree) {
        setDashboardTree(localTree);
      }
    } finally {
      setIsFetchingTree(false);
    }
  }, [isLiveWeb3]);

  // Keep dashboardTree synced when dashboardTreeRootId or isLiveWeb3 changes
  useEffect(() => {
    let isCancelled = false;

    const executeLoad = async () => {
      try {
        if (isLiveWeb3) {
          const onChainTree = await fetchTeamTreeOnChain(dashboardTreeRootId);
          if (!isCancelled && onChainTree && onChainTree.root) {
            setDashboardTree(onChainTree);
            setLastTreeQueryTime(new Date().toLocaleTimeString());
            return;
          }
        }

        const localTree = matrixContract.getTeamTree(dashboardTreeRootId);
        if (!isCancelled) {
          if (localTree) {
            setDashboardTree(localTree);
          } else {
            setDashboardTree(null);
          }
          setLastTreeQueryTime(new Date().toLocaleTimeString());
        }
      } catch (err) {
        console.warn('Dashboard tree query error:', err);
        const localTree = matrixContract.getTeamTree(dashboardTreeRootId);
        if (!isCancelled && localTree) {
          setDashboardTree(localTree);
        }
      }
    };

    executeLoad();
    return () => {
      isCancelled = true;
    };
  }, [dashboardTreeRootId, isLiveWeb3]);

  const walletIdsKey = walletIds.join(',');

  // Fetch IDs associated with this wallet when activeAccount connects or changes
  useEffect(() => {
    if (activeAccount?.address) {
      fetchWalletIds(activeAccount.address);
    }
  }, [activeAccount?.address, fetchWalletIds]);

  // Load idTotalEarned for each ID in walletIds
  useEffect(() => {
    if (!walletIdsKey) return;
    const targetIds = walletIdsKey.split(',').map(Number).filter(n => n > 0);
    if (targetIds.length === 0) return;
    let isCancelled = false;

    const loadBatchEarned = async () => {
      const results: Record<number, number> = {};
      for (const id of targetIds) {
        try {
          const earned = await getIdTotalEarned(id);
          if (!isCancelled) {
            results[id] = earned;
          }
        } catch {
          const user = matrixContract.getUser(id);
          if (!isCancelled && user) {
            results[id] = user.totalEarnedUSDT;
          }
        }
      }
      if (!isCancelled) {
        setIdEarningsMap(prev => ({ ...prev, ...results }));
      }
    };

    loadBatchEarned();
    return () => {
      isCancelled = true;
    };
  }, [walletIdsKey, getIdTotalEarned]);

  // Manual Trigger to refresh walletToIds from blockchain
  const handleRefreshWalletToIds = async () => {
    if (!activeAccount?.address) return;
    setIsFetchingWalletIds(true);
    try {
      const ids = await fetchWalletIds(activeAccount.address, true);
      showToast(
        lang === 'th' ? 'ค้นหา ID ด้วย walletToIds สำเร็จ' : 'walletToIds Query Complete',
        lang === 'th' ? `พบ ${ids.length} รหัสที่ผูกกับกระเป๋านี้` : `Found ${ids.length} User IDs mapped to this address`,
        'success'
      );
    } catch {
      showToast('walletToIds Error', 'Failed to retrieve IDs from contract', 'info');
    } finally {
      setIsFetchingWalletIds(false);
    }
  };

  // Switch Active User ID
  const handleSelectUserId = (id: number) => {
    setSelectedUserId(id);
    showToast(
      lang === 'th' ? `สลับเข้าใช้งานรหัส #${id}` : `Switched to Account #${id}`,
      lang === 'th' ? `กำลังแสดงข้อมูลและผังของรหัส #${id}` : `Now viewing dashboard and matrix for User #${id}`,
      'reward'
    );
  };

  // Direct switch to custom ID
  const handleDirectSwitchIdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = parseInt(directSwitchIdInput.trim(), 10);
    if (isNaN(idNum) || idNum <= 0) {
      showToast(lang === 'th' ? 'กรุณาระบุ ID ที่ถูกต้อง' : 'Please enter a valid User ID', '', 'info');
      return;
    }
    handleSelectUserId(idNum);
    setDirectSwitchIdInput('');
  };

  // Auto-fetch getWalletAllData and derive Total Earnings when activeAccount or currentUser changes
  useEffect(() => {
    let isCancelled = false;
    const targetAddr = activeAccount?.address || currentUser?.address;
    const currentUserId = currentUser?.id;
    const fallbackUSDT = currentUser?.totalEarnedUSDT;

    const loadEarned = async () => {
      if (targetAddr) {
        setIsQueryingEarned(true);
        try {
          // 1. Primary authoritative source: getWalletAllData(address _wallet)
          const allData = await getWalletAllData(targetAddr, false);
          if (!isCancelled) {
            setWalletAllDataList(allData);
            if (allData && allData.length > 0) {
              const sumEarned = allData.reduce((acc, curr) => acc + (Number(curr.totalEarned) || 0), 0);
              setLiveTotalEarned(sumEarned);

              const map: Record<number, number> = {};
              allData.forEach(d => {
                map[d.id] = Number(d.totalEarned) || 0;
              });
              setIdEarningsMap(prev => ({ ...prev, ...map }));
            } else {
              const earned = await getWalletTotalEarned(targetAddr);
              setLiveTotalEarned(earned);
            }
          }
        } catch {
          if (!isCancelled) {
            if (currentUserId) {
              try {
                const idEarned = await getIdTotalEarned(currentUserId);
                setLiveTotalEarned(idEarned);
              } catch {
                if (fallbackUSDT !== undefined) setLiveTotalEarned(fallbackUSDT);
              }
            } else if (fallbackUSDT !== undefined) {
              setLiveTotalEarned(fallbackUSDT);
            }
          }
        } finally {
          if (!isCancelled) {
            setIsQueryingEarned(false);
          }
        }
      } else {
        if (!isCancelled) {
          setLiveTotalEarned(0);
        }
      }
    };

    loadEarned();
    return () => {
      isCancelled = true;
    };
  }, [activeAccount?.address, currentUser?.address, currentUser?.id, currentUser?.totalEarnedUSDT, getWalletAllData, getWalletTotalEarned, getIdTotalEarned]);

  const handleRefreshMyEarned = async () => {
    const targetAddr = activeAccount?.address || currentUser?.address;
    if (!targetAddr) return;
    setIsQueryingEarned(true);
    try {
      // Direct on-chain force-refresh via getWalletAllData(address _wallet)
      const allData = await getWalletAllData(targetAddr, true);
      setWalletAllDataList(allData);

      let earned = 0;
      if (allData && allData.length > 0) {
        earned = allData.reduce((acc, curr) => acc + (Number(curr.totalEarned) || 0), 0);
        const map: Record<number, number> = {};
        allData.forEach(d => {
          map[d.id] = Number(d.totalEarned) || 0;
        });
        setIdEarningsMap(prev => ({ ...prev, ...map }));
      } else {
        earned = await getWalletTotalEarned(targetAddr, true);
      }

      setLiveTotalEarned(earned);
      const shortAddr = `${targetAddr.slice(0, 6)}...${targetAddr.slice(-4)}`;
      showToast(
        lang === 'th' ? 'อัปเดตรายได้รวม (getWalletAllData)' : 'Total Earnings Updated',
        lang === 'th' ? `รายได้รวมกระเป๋า (${shortAddr}) = ${earned.toFixed(2)} USDT (คำนวณจาก ${allData.length} รหัส)` : `Wallet Total (${shortAddr}) = ${earned.toFixed(2)} USDT (${allData.length} IDs)`,
        'reward'
      );
    } catch {
      showToast('Query Error', 'Unable to fetch total earnings', 'info');
    } finally {
      setIsQueryingEarned(false);
    }
  };

  // Fetch Available Rank 1 Nodes using getWalletAvailableRank1Nodes(address _wallet)
  const handleFetchRank1AvailableNodes = useCallback(async (forceRefresh: boolean = false) => {
    const targetAddr = activeAccount?.address || currentUser?.address;
    if (!targetAddr) return;
    setIsFetchingRank1(true);
    try {
      const res = await getWalletAvailableRank1Nodes(targetAddr, forceRefresh);
      setAvailableRank1Data(res);
      if (forceRefresh) {
        const shortAddr = `${targetAddr.slice(0, 6)}...${targetAddr.slice(-4)}`;
        showToast(
          lang === 'th' ? 'อ่านข้อมูล ID Rank 1 ที่ยังไม่เต็ม' : 'Rank 1 Available Nodes',
          lang === 'th' ? `กระเป๋า ${shortAddr}: พบ ${res.availableIds.length} รหัสที่ยังไม่เต็ม` : `Wallet ${shortAddr}: ${res.availableIds.length} open IDs found`,
          'success'
        );
      }
    } catch {
      showToast('Query Error', 'Unable to fetch available Rank 1 nodes', 'info');
    } finally {
      setIsFetchingRank1(false);
    }
  }, [activeAccount?.address, currentUser?.address, getWalletAvailableRank1Nodes, lang, showToast]);

  // Load Rank 1 Available Nodes whenever active address changes
  useEffect(() => {
    let isCancelled = false;
    const targetAddr = activeAccount?.address || currentUser?.address;

    const loadRank1Nodes = async () => {
      if (!targetAddr) {
        if (!isCancelled) {
          setAvailableRank1Data({ availableIds: [], downlineCounts: [] });
        }
        return;
      }
      try {
        const res = await getWalletAvailableRank1Nodes(targetAddr, true);
        if (!isCancelled) {
          setAvailableRank1Data(res);
        }
      } catch (err) {
        console.warn('Failed to load initial Rank1 available nodes:', err);
      }
    };

    loadRank1Nodes();
    return () => {
      isCancelled = true;
    };
  }, [activeAccount?.address, currentUser?.address, getWalletAvailableRank1Nodes]);

  // Fetch All Wallet Nodes Data using getWalletAllData(address _wallet)
  const handleFetchWalletAllData = useCallback(async (forceRefresh: boolean = false, customAddr?: string) => {
    const targetAddr = (customAddr !== undefined ? customAddr : walletAllDataSearchAddr) || activeAccount?.address || currentUser?.address;
    if (!targetAddr) {
      showToast(lang === 'th' ? 'ต้องเชื่อมต่อกระเป๋า' : 'Wallet Required', lang === 'th' ? 'กรุณาเชื่อมต่อกระเป๋าหรือระบุแอดเดรส' : 'Please connect a wallet or enter an address', 'info');
      return;
    }
    setIsFetchingWalletAllData(true);
    try {
      const data = await getWalletAllData(targetAddr, forceRefresh);
      setWalletAllDataList(data);
      if (forceRefresh || customAddr) {
        const shortAddr = `${targetAddr.slice(0, 6)}...${targetAddr.slice(-4)}`;
        showToast(
          lang === 'th' ? 'ข้อมูลภาพรวมทุก ID' : 'All IDs Overview',
          lang === 'th' ? `พบ ${data.length} รหัสสำหรับกระเป๋า ${shortAddr}` : `Found ${data.length} ID Nodes for ${shortAddr}`,
          data.length > 0 ? 'success' : 'info'
        );
      }
    } catch {
      showToast('Query Error', 'Unable to fetch wallet data from smart contract', 'info');
    } finally {
      setIsFetchingWalletAllData(false);
    }
  }, [activeAccount?.address, currentUser?.address, getWalletAllData, lang, showToast, walletAllDataSearchAddr]);

  const handleQueryCustomIdEarned = async (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = parseInt(customQueryId.trim(), 10);
    if (isNaN(idNum) || idNum <= 0) {
      showToast(lang === 'th' ? 'กรุณาระบุ ID ที่ถูกต้อง' : 'Please enter a valid User ID', '', 'info');
      return;
    }
    setIsCustomQuerying(true);
    try {
      const earned = await getIdTotalEarned(idNum);
      setCustomQueryResult({ id: idNum, earned });
      showToast(
        lang === 'th' ? `รายได้ของ ID #${idNum}` : `Earnings for ID #${idNum}`,
        `${earned.toFixed(2)} USDT`,
        'success'
      );
    } catch (err) {
      console.warn(err);
      showToast('Query Error', `Could not read earnings for ID #${idNum}`, 'info');
    } finally {
      setIsCustomQuerying(false);
    }
  };

  // Generate Referral Link
  const displayRefLink = currentUser 
    ? `wealthlifecycle.io/ref/${currentUser.id}` 
    : `wealthlifecycle.io/ref/1`;

  const handleCopyLink = async () => {
    const fullLink = getSafeReferralUrl(currentUser?.id || 1);
    await copyToClipboardSafe(fullLink);
    setCopiedLink(true);
    showToast(lang === 'th' ? 'คัดลอกลิงก์สำเร็จ!' : 'Link Copied!', fullLink, 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyAddress = async () => {
    if (!activeAccount) return;
    await copyToClipboardSafe(activeAccount.address);
    setCopiedAddress(true);
    showToast(lang === 'th' ? 'คัดลอกแอดเดรสสำเร็จ!' : 'Address Copied!', activeAccount.address, 'success');
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleApprove = async () => {
    setIsApproving(true);
    await approveUsdtAllowance();
    setIsApproving(false);
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
    await registerCurrentAccount(targetSponsor, targetParent);
    setIsRegistering(false);
  };

  const handleClaim = async () => {
    setIsClaiming(true);
    await claimRewardsCurrentAccount();
    setIsClaiming(false);
  };

  const handleQuickSpawn = async () => {
    setIsSpawningQuickGhost(true);
    await new Promise(r => setTimeout(r, 600));
    matrixContract.spawnGhosts(1, 2, 'Quick Spawner Action');
    setIsSpawningQuickGhost(false);
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshOnChainData();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* ========================================================================= */}
      {/* POP-UP MODAL: USER IDs SWITCHER */}
      {/* ========================================================================= */}
      {isIdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Dark Blur Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsIdModalOpen(false)}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-xl bg-slate-900/95 border border-sky-500/30 rounded-3xl shadow-2xl p-3.5 sm:p-6 z-10 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 max-h-[88vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-2.5 pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className="text-sm sm:text-base font-black text-white tracking-tight whitespace-nowrap">
                      {lang === 'th' ? 'สลับรหัสเข้าใช้งาน' : 'Switch Active ID'}
                    </h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold border whitespace-nowrap ${
                      walletIds.length > 0 
                        ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' 
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {walletIds.length > 0 ? `${walletIds.length} ${lang === 'th' ? 'รหัส' : 'IDs'}` : (lang === 'th' ? 'ยังไม่มี ID' : '0 IDs')}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 leading-snug truncate">
                    {walletIds.length > 0 
                      ? (lang === 'th' ? 'แตะที่รหัสเพื่อสลับเข้าใช้งานหน้านั้นทันที' : 'Tap an ID to switch view instantly')
                      : (lang === 'th' ? 'กระเป๋านี้ยังไม่ได้ลงทะเบียน ID ในระบบ' : 'No User IDs registered in this wallet yet')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <button
                  onClick={handleFetchExpiredIds}
                  disabled={isFetchingExpiredData || !activeAccount}
                  title={lang === 'th' ? 'ตรวจหารหัสที่หมดอายุ' : 'Check expired IDs'}
                  className="px-2.5 py-2 sm:py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition active:scale-95 flex items-center gap-1.5"
                >
                  <Clock className={`w-3.5 h-3.5 text-amber-400 ${isFetchingExpiredData ? 'animate-spin' : ''}`} />
                  <span className="hidden xs:inline">{lang === 'th' ? 'รหัสหมดอายุ' : 'Expired IDs'}</span>
                </button>
                <button
                  onClick={handleRefreshWalletToIds}
                  disabled={isFetchingWalletIds || !activeAccount}
                  title={lang === 'th' ? 'รีเฟรชดึงรหัสล่าสุดจากบล็อกเชน' : 'Refresh IDs from smart contract'}
                  className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition active:scale-95 disabled:opacity-50 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-400 ${isFetchingWalletIds ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setIsIdModalOpen(false)}
                  className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition active:scale-95 shadow-sm"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable ID List */}
            <div className="py-4 overflow-y-auto flex-1 space-y-3 pr-1">
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

                    const earned = itemData?.totalEarned !== undefined 
                      ? itemData.totalEarned 
                      : (idEarningsMap[id] !== undefined ? idEarningsMap[id] : (userObj?.totalEarnedUSDT || 0));

                    return (
                      <button
                        key={id}
                        onClick={() => {
                          handleSelectUserId(id);
                          setIsIdModalOpen(false);
                        }}
                        className={`p-3.5 rounded-2xl text-left transition-all duration-150 border relative flex flex-col justify-between active:scale-95 group ${
                          isActive
                            ? 'bg-gradient-to-br from-sky-500/30 via-sky-900/50 to-slate-900/95 border-sky-400 shadow-lg shadow-sky-500/25 ring-2 ring-sky-400/50'
                            : isReborn
                              ? 'bg-slate-950/90 hover:bg-slate-900 border-sky-500/40 hover:border-sky-400 shadow-sm shadow-sky-500/10'
                              : 'bg-slate-950/90 hover:bg-slate-800/90 border-slate-800 hover:border-slate-600 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs ${
                              isActive 
                                ? 'bg-sky-400 text-slate-950 shadow-md shadow-sky-400/40' 
                                : isReborn
                                  ? 'bg-sky-500/20 text-sky-400 border border-sky-400/60 shadow-sm shadow-sky-500/20'
                                  : 'bg-slate-800 text-slate-200 border border-slate-700'
                            }`}>
                              #{isGhost ? 0 : id}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-black text-sm text-white">
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
                                <span className={`text-[11px] font-semibold ${isReborn ? 'text-sky-300' : 'text-slate-300'}`}>
                                  {rankLabel}
                                </span>
                                {earned > 0 && (
                                  <span className="text-[11px] font-mono font-bold text-emerald-400">
                                    +{earned.toFixed(2)} USDT
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {isActive && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-300 text-[11px] font-black border border-emerald-400/40 shadow-sm">
                              {lang === 'th' ? '✓ ใช้งาน' : '✓ Active'}
                            </span>
                          )}
                        </div>

                        {/* Expiration status & Renew ID */}
                        <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-slate-800/80">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            itemData?.isExpired
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          }`}>
                            {itemData?.isExpired ? (lang === 'th' ? '🔴 หมดอายุ' : '🔴 Expired') : (lang === 'th' ? '🟢 ปกติ (7 วัน)' : '🟢 Active (7d)')}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRenewId(id);
                            }}
                            disabled={renewingId === id || txPending}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold transition flex items-center gap-1 active:scale-95 disabled:opacity-50"
                            title={lang === 'th' ? 'ต่ออายุ 7 วัน' : 'Renew for 7 days'}
                          >
                            {renewingId === id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                            <span>{lang === 'th' ? 'ต่ออายุ' : 'Renew'}</span>
                          </button>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 rounded-3xl bg-slate-950/70 border border-dashed border-amber-500/30 text-center space-y-3.5 my-2">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-amber-300">
                      {lang === 'th' ? 'ยังไม่มี ID ที่ผูกกับกระเป๋านี้' : 'No User IDs mapped to this wallet'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      {lang === 'th' 
                        ? 'กระเป๋านี้ยังไม่เคยลงทะเบียนในระบบ Smart Contract ท่านสามารถสมัครสมาชิกใหม่ด้วย 2 USDT เพื่อรับ ID และเริ่มสร้างสายงาน' 
                        : 'This wallet has not registered any ID on the smart contract yet. Register with 2 USDT to create your ID.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsIdModalOpen(false);
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

            {/* Modal Footer: Direct Switch to Custom ID */}
            <div className="pt-3.5 border-t border-slate-800 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>{lang === 'th' ? 'หรือสลับดูรหัสอื่นในระบบ:' : 'Or switch to any Member ID:'}</span>
              </div>

              <form 
                onSubmit={(e) => {
                  handleDirectSwitchIdSubmit(e);
                  setIsIdModalOpen(false);
                }} 
                className="flex items-center gap-1.5"
              >
                <input
                  type="number"
                  min="1"
                  placeholder="ID # (e.g. 1, 2, 3)"
                  value={directSwitchIdInput}
                  onChange={(e) => setDirectSwitchIdInput(e.target.value)}
                  className="w-28 sm:w-32 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-sky-400 text-center"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/30 font-medium text-xs transition active:scale-95 flex items-center gap-1 shrink-0"
                >
                  <span>{lang === 'th' ? 'ดู' : 'Go'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </form>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POP-UP MODAL: RANK 1 AVAILABLE NODES (getWalletAvailableRank1Nodes) */}
      {/* ========================================================================= */}
      {isRank1ModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto">
          {/* Dark Blur Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsRank1ModalOpen(false)}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-2xl bg-slate-900/95 border border-amber-500/30 rounded-3xl shadow-2xl p-3.5 sm:p-6 z-10 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-2.5 pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-amber-500/30 to-emerald-500/30 border border-amber-400/50 flex items-center justify-center text-amber-300 shadow-lg shadow-amber-500/20 shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className="text-sm sm:text-lg font-black text-white tracking-tight whitespace-nowrap">
                      {lang === 'th' ? 'ID Rank 1 ที่ยังไม่เต็ม' : 'ID Rank 1 (Open Slots)'}
                    </h3>
                    <span className="text-[10px] sm:text-xs font-bold text-amber-300 font-sans px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 whitespace-nowrap">
                      {lang === 'th' ? 'สล็อต < 4' : 'Slots < 4'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-black border shadow-sm whitespace-nowrap ${
                      availableRank1Data.availableIds.length > 0 
                        ? 'bg-amber-400 text-slate-950 border-amber-300' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {availableRank1Data.availableIds.length > 0 
                        ? `${availableRank1Data.availableIds.length} ${lang === 'th' ? 'รหัสพร้อมรับผัง' : 'IDs Open'}`
                        : (lang === 'th' ? 'ไม่มี ID ว่าง' : '0 Open IDs')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] sm:text-[11px] text-emerald-300 font-mono font-bold bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30 truncate max-w-[190px] xs:max-w-[260px] sm:max-w-md block">
                      {activeAccount?.address ? `${activeAccount.address.slice(0, 6)}...${activeAccount.address.slice(-4)}` : (currentUser?.address ? `${currentUser.address.slice(0, 6)}...${currentUser.address.slice(-4)}` : '0x...')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <button
                  onClick={() => handleFetchRank1AvailableNodes(true)}
                  disabled={isFetchingRank1 || (!activeAccount && !currentUser)}
                  title={lang === 'th' ? 'รีเฟรชข้อมูลจาก Smart Contract' : 'Refresh from smart contract'}
                  className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition active:scale-95 disabled:opacity-50 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 ${isFetchingRank1 ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={() => setIsRank1ModalOpen(false)}
                  className="p-2 sm:p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition active:scale-95 shadow-sm"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Available Rank 1 Nodes List */}
            <div className="py-3 sm:py-4 overflow-y-auto flex-1 space-y-3 sm:space-y-3.5 pr-1">
              {isFetchingRank1 ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                  <p className="text-xs font-mono text-slate-400">
                    {lang === 'th' ? 'กำลังอ่านข้อมูล ID Rank 1 จาก Smart Contract...' : 'Querying Rank 1 Nodes from Smart Contract...'}
                  </p>
                </div>
              ) : availableRank1Data.availableIds.length > 0 ? (
                <>
                  {/* Top Notice & Sort Controls */}
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-slate-900/90 to-emerald-500/10 border border-amber-500/30 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs leading-relaxed">
                      <div className="flex items-center gap-2 text-amber-300 font-bold">
                        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          {lang === 'th' 
                            ? `พบ ${availableRank1Data.availableIds.length} รหัสที่ผัง Rank 1 ยังไม่เต็ม (เรียงช่องว่างน้อยสุดอยู่บนสุด)` 
                            : `${availableRank1Data.availableIds.length} Rank 1 nodes open (Sorted by least empty slots first)`}
                        </span>
                      </div>

                      {/* Active Sorting indicator */}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-mono font-bold bg-amber-400 text-slate-950 shadow-sm self-start sm:self-auto">
                        <Flame className="w-3 h-3 text-red-600 fill-red-600 animate-pulse" />
                        {rank1SortOrder === 'leastEmpty' 
                          ? (lang === 'th' ? 'เรียง: ช่องว่างน้อยสุด ➔ มากสุด' : 'Sorted: Least Empty First')
                          : rank1SortOrder === 'mostEmpty'
                            ? (lang === 'th' ? 'เรียง: ช่องว่างมากสุด ➔ น้อยสุด' : 'Sorted: Most Empty First')
                            : rank1SortOrder === 'idAsc'
                              ? (lang === 'th' ? 'เรียง: ตามหมายเลข ID (น้อย ➔ มาก)' : 'Sorted: ID Ascending')
                              : (lang === 'th' ? 'เรียง: ตามหมายเลข ID (มาก ➔ น้อย)' : 'Sorted: ID Descending')}
                      </span>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="flex flex-col md:flex-row gap-2 pt-1 border-t border-slate-800/80">
                      {/* Search ID */}
                      <div className="relative flex-1 min-w-[140px]">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={rank1SearchQuery}
                          onChange={(e) => setRank1SearchQuery(e.target.value)}
                          placeholder={lang === 'th' ? 'ค้นหาหมายเลข ID...' : 'Search ID number...'}
                          className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs font-mono focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                        />
                        {rank1SearchQuery && (
                          <button
                            onClick={() => setRank1SearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Sort Selector Buttons */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0">
                        <button
                          onClick={() => setRank1SortOrder('leastEmpty')}
                          title={lang === 'th' ? 'เรียงรหัสที่มีช่องว่างน้อยสุด (3/4 เต็ม) ไว้บนสุด' : 'Sort least empty slots on top'}
                          className={`px-2.5 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition active:scale-95 flex items-center gap-1 whitespace-nowrap ${
                            rank1SortOrder === 'leastEmpty'
                              ? 'bg-amber-400 text-slate-950 shadow-md font-black ring-1 ring-amber-300'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }`}
                        >
                          <Flame className={`w-3 h-3 ${rank1SortOrder === 'leastEmpty' ? 'text-red-600 fill-red-600' : 'text-amber-400'}`} />
                          <span>{lang === 'th' ? 'ว่างน้อยสุด (บน)' : 'Least Empty'}</span>
                        </button>

                        <button
                          onClick={() => setRank1SortOrder('mostEmpty')}
                          title={lang === 'th' ? 'เรียงรหัสที่มีช่องว่างมากสุด (0/4 เต็ม) ไว้บนสุด' : 'Sort most empty slots on top'}
                          className={`px-2.5 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition active:scale-95 flex items-center gap-1 whitespace-nowrap ${
                            rank1SortOrder === 'mostEmpty'
                              ? 'bg-amber-400 text-slate-950 shadow-md font-black ring-1 ring-amber-300'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }`}
                        >
                          <Zap className="w-3 h-3" />
                          <span>{lang === 'th' ? 'ว่างมากสุด' : 'Most Empty'}</span>
                        </button>

                        <button
                          onClick={() => setRank1SortOrder(rank1SortOrder === 'idAsc' ? 'idDesc' : 'idAsc')}
                          title={lang === 'th' ? 'เรียงตามหมายเลข ID' : 'Sort by ID number'}
                          className={`px-2 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-bold transition active:scale-95 flex items-center gap-1 whitespace-nowrap ${
                            rank1SortOrder === 'idAsc' || rank1SortOrder === 'idDesc'
                              ? 'bg-amber-400 text-slate-950 shadow-md font-black ring-1 ring-amber-300'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }`}
                        >
                          <ArrowUpDown className="w-3 h-3" />
                          <span>{rank1SortOrder === 'idDesc' ? 'ID (9➔1)' : 'ID (1➔9)'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Slot Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pt-0.5 no-scrollbar text-[10px] sm:text-[11px]">
                      <button
                        onClick={() => setRank1SlotFilter('all')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                          rank1SlotFilter === 'all'
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'bg-slate-950/80 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {lang === 'th' ? `ทั้งหมด (${rank1SlotStats.total})` : `All (${rank1SlotStats.total})`}
                      </button>

                      <button
                        onClick={() => setRank1SlotFilter(1)}
                        className={`px-2 py-1 rounded-lg font-bold transition flex items-center gap-1 whitespace-nowrap ${
                          rank1SlotFilter === 1
                            ? 'bg-red-500 text-white font-black shadow-md shadow-red-500/30'
                            : 'bg-slate-950/80 text-amber-300 hover:text-white border border-amber-500/30'
                        }`}
                      >
                        <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                        <span>{lang === 'th' ? `ว่าง 1 ช่อง (${rank1SlotStats.s1})` : `1 Empty (${rank1SlotStats.s1})`}</span>
                      </button>

                      <button
                        onClick={() => setRank1SlotFilter(2)}
                        className={`px-2 py-1 rounded-lg font-bold transition flex items-center gap-1 whitespace-nowrap ${
                          rank1SlotFilter === 2
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800'
                        }`}
                      >
                        <span>{lang === 'th' ? `ว่าง 2 ช่อง (${rank1SlotStats.s2})` : `2 Empty (${rank1SlotStats.s2})`}</span>
                      </button>

                      <button
                        onClick={() => setRank1SlotFilter(3)}
                        className={`px-2 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                          rank1SlotFilter === 3
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800'
                        }`}
                      >
                        {lang === 'th' ? `ว่าง 3 ช่อง (${rank1SlotStats.s3})` : `3 Empty (${rank1SlotStats.s3})`}
                      </button>

                      <button
                        onClick={() => setRank1SlotFilter(4)}
                        className={`px-2 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                          rank1SlotFilter === 4
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                            : 'bg-slate-950/80 text-slate-300 hover:text-white border border-slate-800'
                        }`}
                      >
                        {lang === 'th' ? `ว่าง 4 ช่อง (${rank1SlotStats.s4})` : `4 Empty (${rank1SlotStats.s4})`}
                      </button>
                    </div>
                  </div>

                  {/* Nodes Grid (Sorted and Filtered) */}
                  {sortedRank1AvailableNodes.length === 0 ? (
                    <div className="py-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                      <Search className="w-6 h-6 text-slate-500 mx-auto" />
                      <p className="text-xs text-slate-400">
                        {lang === 'th' ? 'ไม่พบ ID ที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรอง' : 'No IDs match current search or filter'}
                      </p>
                      <button
                        onClick={() => {
                          setRank1SearchQuery('');
                          setRank1SlotFilter('all');
                        }}
                        className="text-[11px] font-bold text-amber-400 hover:underline"
                      >
                        {lang === 'th' ? 'ล้างตัวกรองทั้งหมด' : 'Clear filters'}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                      {sortedRank1AvailableNodes.map(({ id, filledCount, remainingSlots, userObj }) => {
                        const isActive = (selectedUserId || currentUser?.id) === id;
                        const isNearFull = remainingSlots === 1; // 3/4 slots filled

                        return (
                          <div
                            key={id}
                            className={`p-3 sm:p-4 rounded-2xl transition-all duration-150 border relative flex flex-col justify-between ${
                              isActive 
                                ? 'bg-gradient-to-br from-amber-500/15 via-slate-900/90 to-slate-950 border-amber-400/80 ring-2 ring-amber-400/30 shadow-lg shadow-amber-500/10'
                                : isNearFull
                                  ? 'bg-gradient-to-br from-amber-500/10 via-slate-950/95 to-slate-900 border-amber-500/50 shadow-md hover:border-amber-400'
                                  : 'bg-slate-950/80 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div>
                              {/* Top Row: ID Badge & Slots Status */}
                              <div className="flex items-start justify-between gap-2 mb-2.5 sm:mb-3">
                                <div className="flex items-center gap-2 sm:gap-2.5">
                                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-mono font-bold text-xs sm:text-sm ${
                                    isActive 
                                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30' 
                                      : isNearFull 
                                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 shadow-md font-black' 
                                        : 'bg-slate-800 text-amber-300'
                                  }`}>
                                    #{id}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono font-bold text-sm sm:text-base text-white">
                                        ID #{id}
                                      </span>
                                      {userObj?.isGhost && <span className="text-xs" title="Ghost">👻</span>}
                                      {isActive && (
                                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold border border-emerald-500/30">
                                          {lang === 'th' ? 'ใช้งานอยู่' : 'Active'}
                                        </span>
                                      )}
                                      {isNearFull && (
                                        <span className="px-1.5 py-0.2 rounded-full bg-red-500/20 text-amber-300 text-[9px] font-bold border border-red-500/30 flex items-center gap-0.5">
                                          <Flame className="w-2.5 h-2.5 text-amber-400 fill-amber-400 animate-pulse" />
                                          <span>{lang === 'th' ? 'ใกล้เต็ม' : 'Near Full'}</span>
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono">
                                      Rank 1 Matrix
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-mono font-bold border ${
                                    isNearFull
                                      ? 'bg-gradient-to-r from-red-500/20 to-amber-500/20 text-amber-300 border-amber-400/50'
                                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  }`}>
                                    {filledCount}/4 Slots
                                  </span>
                                  <p className={`text-[10px] font-bold mt-0.5 ${
                                    isNearFull ? 'text-amber-300 animate-pulse' : 'text-emerald-400'
                                  }`}>
                                    {remainingSlots === 1 
                                      ? (lang === 'th' ? '🔥 ว่างอีก 1 สล็อต (สุดท้าย)' : '🔥 1 open slot left!')
                                      : (lang === 'th' ? `ว่างอีก ${remainingSlots} สล็อต` : `${remainingSlots} open slots`)}
                                  </p>
                                </div>
                              </div>

                              {/* 4 Visual Slots Display */}
                              <div className="bg-slate-900/80 p-2 sm:p-2.5 rounded-xl border border-slate-800 mb-2.5 sm:mb-3">
                                <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 mb-1.5">
                                  <span>{lang === 'th' ? 'สถานะ 4 สล็อต Rank 1:' : '4 Rank 1 Slots:'}</span>
                                  <span className="font-mono text-[9px] sm:text-[10px] text-slate-500">Node Capacity (4 max)</span>
                                </div>
                                <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
                                  {[0, 1, 2, 3].map((slotIdx) => {
                                    const isOccupied = slotIdx < filledCount;
                                    return (
                                      <div
                                        key={slotIdx}
                                        className={`py-1.5 px-0.5 sm:px-1 rounded-lg text-center font-mono text-[9px] sm:text-[10px] font-bold border transition ${
                                          isOccupied
                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                            : slotIdx === filledCount && isNearFull
                                              ? 'bg-amber-500/25 text-amber-300 border-amber-400 ring-1 ring-amber-400 animate-pulse'
                                              : 'bg-amber-500/10 text-amber-300 border-dashed border-amber-500/40'
                                        }`}
                                      >
                                        {isOccupied ? (
                                          <span className="flex items-center justify-center gap-0.5">
                                            <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                            <span>#{slotIdx + 1}</span>
                                          </span>
                                        ) : (
                                          <span className="flex items-center justify-center gap-0.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                                            <span>ว่าง</span>
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pt-2 sm:pt-2.5 border-t border-slate-800/90">
                              <button
                                onClick={() => {
                                  handleSelectUserId(id);
                                  setIsRank1ModalOpen(false);
                                }}
                                title={lang === 'th' ? 'สลับเข้าใช้งาน ID นี้' : 'Switch to this ID'}
                                className={`py-2 px-1 sm:px-2 rounded-xl text-[11px] sm:text-xs font-black transition active:scale-95 flex items-center justify-center gap-1 shadow-sm ${
                                  isActive
                                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600'
                                }`}
                              >
                                <User className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                                <span className="truncate">{lang === 'th' ? 'สลับ ID' : 'Use ID'}</span>
                              </button>

                              <button
                                onClick={() => {
                                  handleSelectUserId(id);
                                  setIsRank1ModalOpen(false);
                                  setActiveTab('matrix');
                                }}
                                title={lang === 'th' ? 'เปิดดูผัง Matrix ของ ID นี้' : 'View matrix tree'}
                                className="py-2 px-1 sm:px-2 rounded-xl bg-sky-600/40 hover:bg-sky-500/60 text-sky-200 hover:text-white border border-sky-400/40 hover:border-sky-400 text-[11px] sm:text-xs font-black transition active:scale-95 flex items-center justify-center gap-1 shadow-sm shadow-sky-950/40"
                              >
                                <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-sky-300" />
                                <span className="truncate">{lang === 'th' ? 'ดูผัง' : 'Tree'}</span>
                              </button>

                              <button
                                onClick={async () => {
                                  setIsRank1ModalOpen(false);
                                  if (!isConnected) {
                                    onOpenConnectModal();
                                    return;
                                  }
                                  await registerCurrentAccount(id);
                                }}
                                title={lang === 'th' ? `สมัครสมาชิกใหม่โดยให้ ID #${id} เป็นผู้แนะนำ` : `Register new ID under Sponsor #${id}`}
                                className="py-2 px-1 sm:px-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 hover:text-black font-black border border-emerald-300/40 text-[11px] sm:text-xs transition active:scale-95 flex items-center justify-center gap-1 shadow-md shadow-emerald-500/30"
                              >
                                <UserPlus className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 text-slate-950 font-black" />
                                <span className="truncate">{lang === 'th' ? 'สมัคร' : 'Register'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-950/70 border border-dashed border-slate-700 text-center space-y-3.5 my-2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                    <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  <div>
                    <p className="text-sm sm:text-base font-bold text-white">
                      {lang === 'th' ? 'ไม่มี ID ที่ Slot ว่างในขณะนี้' : 'No Open Rank 1 Slots'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                      {lang === 'th' 
                        ? 'ทุก ID ของกระเป๋านี้มีสล็อต Rank 1 เต็มครบ 4/4 ช่องแล้ว หรือกระเป๋านี้ยังไม่ได้ลงทะเบียน ID ในระบบ' 
                        : 'All registered IDs under this wallet have already completed all 4 slots, or no IDs are registered yet.'}
                    </p>
                  </div>
                  <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => {
                        setIsRank1ModalOpen(false);
                        setIsIdModalOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition active:scale-95"
                    >
                      {lang === 'th' ? 'ดู ID ทั้งหมดในกระเป๋า' : 'View All Wallet IDs'}
                    </button>
                    <button
                      onClick={() => {
                        setIsRank1ModalOpen(false);
                        setActiveTab('landing');
                        setTimeout(() => {
                          const el = document.getElementById('landing_quick_register_section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }, 50);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition"
                    >
                      {lang === 'th' ? 'สมัครเปิด ID ใหม่ (2 USDT)' : 'Register New ID'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer: Smart Contract Info */}
            <div className="pt-2.5 sm:pt-3 border-t border-slate-800 shrink-0 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-mono">
              <span className="truncate max-w-[200px] xs:max-w-[260px] sm:max-w-none">
                {lang === 'th' ? 'ตรวจสอบสล็อตว่าง Rank 1 Real-time' : 'Rank 1 Open Slots Real-time'}
              </span>
              <span className="text-emerald-400 shrink-0 font-bold ml-2">
                {isLiveWeb3 ? 'Live On-Chain' : 'Synced'}
              </span>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* getWalletAllData MODAL WINDOW */}
      {/* ========================================================================= */}
      {isWalletAllDataModalOpen && (
        <div 
          id="modal_get_wallet_all_data"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
        >
          <div className="glass max-w-4xl w-full rounded-3xl p-5 sm:p-7 border border-sky-500/40 shadow-2xl relative flex flex-col max-h-[92vh] bg-slate-900/95 overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500/30 to-indigo-600/30 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-md shrink-0">
                  <LayoutGrid className="w-5 h-5 text-sky-300" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-xl font-black text-white truncate">
                      {lang === 'th' ? 'ข้อมูลรหัสสมาชิกทั้งหมดในกระเป๋า' : 'All Member ID Nodes in Wallet'}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-black bg-sky-500/20 text-sky-300 border border-sky-400/40">
                      {walletAllDataList.length} Node IDs
                    </span>
                    <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold text-sky-300 bg-sky-950/60 border border-sky-800/60">
                      {lang === 'th' ? 'รวมทุกรหัส' : 'All Nodes Overview'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">
                    {walletAllDataSearchAddr || activeAccount?.address || currentUser?.address || '0x...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="btn_refresh_wallet_all_data_modal"
                  onClick={() => handleFetchWalletAllData(true)}
                  disabled={isFetchingWalletAllData}
                  title={lang === 'th' ? 'รีเฟรชข้อมูลจาก Smart Contract' : 'Refresh on-chain data'}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white border border-slate-700 hover:border-sky-500/50 transition active:scale-95 disabled:opacity-50 flex items-center gap-1 text-xs font-bold"
                >
                  <RefreshCw className={`w-4 h-4 ${isFetchingWalletAllData ? 'animate-spin text-sky-400' : ''}`} />
                  <span className="hidden sm:inline">{lang === 'th' ? 'รีเฟรช' : 'Refresh'}</span>
                </button>
                <button
                  id="btn_close_wallet_all_data_modal"
                  onClick={() => setIsWalletAllDataModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition active:scale-95"
                  title="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Address Search / Query Bar */}
            <div className="my-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleFetchWalletAllData(true, walletAllDataSearchAddr.trim());
                }}
                className="w-full sm:w-auto flex-1 flex gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="input_wallet_all_data_search"
                    type="text"
                    placeholder={lang === 'th' ? 'ค้นหาด้วย Wallet Address (0x...)' : 'Search by Wallet Address (0x...)'}
                    value={walletAllDataSearchAddr}
                    onChange={(e) => setWalletAllDataSearchAddr(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 font-mono outline-none"
                  />
                </div>
                <button
                  id="btn_submit_search_wallet_all_data"
                  type="submit"
                  disabled={isFetchingWalletAllData}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition disabled:opacity-50 active:scale-95 shrink-0"
                >
                  {lang === 'th' ? 'ค้นหา' : 'Query'}
                </button>
                {walletAllDataSearchAddr && (
                  <button
                    type="button"
                    onClick={() => {
                      setWalletAllDataSearchAddr('');
                      handleFetchWalletAllData(false, activeAccount?.address || currentUser?.address || '');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition shrink-0"
                    title="Reset to connected address"
                  >
                    Reset
                  </button>
                )}
              </form>

              {/* Aggregated Totals Summary & View Mode */}
              <div className="flex flex-wrap items-center gap-2 shrink-0 text-xs font-mono">
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-300">{lang === 'th' ? 'รวมรายได้ทุก ID:' : 'Total:'}</span>
                  <span className="text-emerald-300 font-black">
                    {walletAllDataList.reduce((acc, curr) => acc + (curr.totalEarned || 0), 0).toFixed(2)} USDT
                  </span>
                </div>
                
                {/* View Mode Toggle (Table / Grid) */}
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                  <button
                    onClick={() => setWalletAllDataViewMode('table')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      walletAllDataViewMode === 'table'
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={lang === 'th' ? 'มุมมองตาราง (Table View)' : 'Table View'}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">{lang === 'th' ? 'ตาราง' : 'Table'}</span>
                  </button>
                  <button
                    onClick={() => setWalletAllDataViewMode('grid')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                      walletAllDataViewMode === 'grid'
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={lang === 'th' ? 'มุมมองการ์ด (Grid View)' : 'Grid View'}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">{lang === 'th' ? 'การ์ด' : 'Cards'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter & Sort Controls for Nodes */}
            <div className="mb-3 px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                {/* Search ID filter */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder={lang === 'th' ? 'กรองรหัส ID...' : 'Filter ID...'}
                    value={walletAllDataIdFilter}
                    onChange={(e) => setWalletAllDataIdFilter(e.target.value)}
                    className="w-28 sm:w-32 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 font-mono outline-none focus:border-sky-500"
                  />
                  {walletAllDataIdFilter && (
                    <button
                      onClick={() => setWalletAllDataIdFilter('')}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-[10px]"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Rank Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setWalletAllDataRankFilter('all')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition ${
                      walletAllDataRankFilter === 'all'
                        ? 'bg-sky-500 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lang === 'th' ? 'ทั้งหมด' : 'All'}
                  </button>
                  <button
                    onClick={() => setWalletAllDataRankFilter('hasR1')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition ${
                      walletAllDataRankFilter === 'hasR1'
                        ? 'bg-sky-500 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Rank 1
                  </button>
                  <button
                    onClick={() => setWalletAllDataRankFilter('hasR2')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition ${
                      walletAllDataRankFilter === 'hasR2'
                        ? 'bg-sky-500 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Rank 2
                  </button>
                  <button
                    onClick={() => setWalletAllDataRankFilter('hasR3')}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition ${
                      walletAllDataRankFilter === 'hasR3'
                        ? 'bg-sky-500 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Rank 3
                  </button>
                </div>
              </div>

              {/* Sort Order Selector */}
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-[11px] text-slate-400 font-medium">
                  {lang === 'th' ? 'เรียงตาม:' : 'Sort:'}
                </span>
                <select
                  value={walletAllDataSortOrder}
                  onChange={(e) => setWalletAllDataSortOrder(e.target.value as typeof walletAllDataSortOrder)}
                  aria-label={lang === 'th' ? 'เรียงตาม' : 'Sort by'}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-sky-300 font-medium outline-none focus:border-sky-500"
                >
                  <option value="earnedDesc">{lang === 'th' ? '💰 รายได้สูงสุด' : '💰 Highest Earned'}</option>
                  <option value="earnedAsc">{lang === 'th' ? 'รายได้น้อยสุด' : 'Lowest Earned'}</option>
                  <option value="idAsc">{lang === 'th' ? '🔢 รหัส ID (น้อย->มาก)' : '🔢 ID (Ascending)'}</option>
                  <option value="idDesc">{lang === 'th' ? '🔢 รหัส ID (มาก->น้อย)' : '🔢 ID (Descending)'}</option>
                  <option value="r1Desc">{lang === 'th' ? '👥 สายงาน Rank 1 มากสุด' : '👥 Most Rank 1'}</option>
                </select>
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto pr-1 py-1 space-y-3.5 custom-scrollbar">
              {isFetchingWalletAllData ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-9 h-9 text-sky-400 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-300 font-semibold">
                    {lang === 'th' ? 'กำลังดึงข้อมูล getWalletAllData จาก Smart Contract...' : 'Calling getWalletAllData on Smart Contract...'}
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    Smart Contract (BNB Chain)
                  </p>
                </div>
              ) : walletAllDataList.length > 0 ? (
                (() => {
                  const filteredList = walletAllDataList
                    .filter((item) => {
                      if (walletAllDataIdFilter) {
                        const q = walletAllDataIdFilter.trim().replace('#', '');
                        if (!String(item.id).includes(q) && !String(item.sponsorId).includes(q)) {
                          return false;
                        }
                      }
                      if (walletAllDataRankFilter === 'hasR1') {
                        return item.rank1Downlines && item.rank1Downlines.length > 0;
                      }
                      if (walletAllDataRankFilter === 'hasR2') {
                        return item.rank2Downlines && item.rank2Downlines.length > 0;
                      }
                      if (walletAllDataRankFilter === 'hasR3') {
                        return item.rank3Downlines && item.rank3Downlines.length > 0;
                      }
                      return true;
                    })
                    .sort((a, b) => {
                      if (walletAllDataSortOrder === 'earnedDesc') {
                        return (b.totalEarned || 0) - (a.totalEarned || 0);
                      } else if (walletAllDataSortOrder === 'earnedAsc') {
                        return (a.totalEarned || 0) - (b.totalEarned || 0);
                      } else if (walletAllDataSortOrder === 'idAsc') {
                        return a.id - b.id;
                      } else if (walletAllDataSortOrder === 'idDesc') {
                        return b.id - a.id;
                      } else if (walletAllDataSortOrder === 'r1Desc') {
                        return (b.rank1Downlines?.length || 0) - (a.rank1Downlines?.length || 0);
                      }
                      return 0;
                    });

                  if (filteredList.length === 0) {
                    return (
                      <div className="py-10 text-center text-slate-400 text-xs">
                        {lang === 'th' ? 'ไม่พบรหัสที่ตรงกับเงื่อนไขการค้นหา/กรอง' : 'No ID nodes match your filter criteria'}
                      </div>
                    );
                  }

                  {/* TABLE VIEW */}
                  if (walletAllDataViewMode === 'table') {
                    return (
                      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/70 shadow-lg">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-900/90 text-slate-300 font-semibold border-b border-slate-800">
                              <th className="py-3 px-3.5 font-mono">ID</th>
                              <th className="py-3 px-3">Sponsor</th>
                              <th className="py-3 px-3">Type</th>
                              <th className="py-3 px-3">AutoReborn</th>
                              <th className="py-3 px-3 text-right font-mono">Total Earned</th>
                              <th className="py-3 px-3 text-center">Rank 1</th>
                              <th className="py-3 px-3 text-center">Rank 2</th>
                              <th className="py-3 px-3 text-center">Rank 3</th>
                              <th className="py-3 px-3.5 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {filteredList.map((item, index) => {
                              const isCurrentSelected = (selectedUserId || currentUser?.id) === item.id;
                              const isFirstNode = index === 0 && walletAllDataSortOrder === 'idAsc';
                              const isGhostNode = !isFirstNode && item.sponsorId === 0;

                              return (
                                <tr
                                  key={item.id}
                                  className={`transition-colors hover:bg-slate-850/60 ${
                                    isCurrentSelected ? 'bg-sky-950/40 border-l-4 border-l-sky-400' : ''
                                  }`}
                                >
                                  {/* ID */}
                                  <td className="py-3 px-3.5 font-mono">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-300 font-bold flex items-center justify-center text-xs border border-sky-400/30">
                                        #{item.id}
                                      </span>
                                      {isCurrentSelected && (
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-sky-500/20 text-sky-300 border border-sky-400/40">
                                          Active
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Sponsor */}
                                  <td className="py-3 px-3 font-mono text-amber-300 font-bold">
                                    #{item.sponsorId}
                                  </td>

                                  {/* Type */}
                                  <td className="py-3 px-3">
                                    {isGhostNode ? (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/40 inline-flex items-center gap-1">
                                        <span>👻</span> {lang === 'th' ? 'เกิดใหม่' : 'Reborn'}
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                                        <span>📝</span> {lang === 'th' ? 'สมัครตรง' : 'Direct'}
                                      </span>
                                    )}
                                  </td>

                                  {/* AutoReborn */}
                                  <td className="py-3 px-3">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                      item.isAutoReborn
                                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                        : 'bg-slate-800 text-slate-400 border-slate-700'
                                    }`}>
                                      {item.isAutoReborn ? 'ON' : 'OFF'}
                                    </span>
                                  </td>

                                  {/* Total Earned */}
                                  <td className="py-3 px-3 text-right font-mono font-black text-emerald-300">
                                    {(item.totalEarned || 0).toFixed(2)} <span className="text-[10px] font-sans text-emerald-400">USDT</span>
                                  </td>

                                  {/* Rank 1 Downlines */}
                                  <td className="py-3 px-3 text-center">
                                    <div className="inline-flex flex-col items-center">
                                      <span className="font-mono font-bold text-sky-400">
                                        {item.rank1Downlines ? item.rank1Downlines.length : 0}/4
                                      </span>
                                      {item.rank1Downlines && item.rank1Downlines.length > 0 && (
                                        <span className="text-[9px] text-slate-400 font-mono">
                                          {item.rank1Downlines.map(id => `#${id}`).join(', ')}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Rank 2 Downlines */}
                                  <td className="py-3 px-3 text-center">
                                    <div className="inline-flex flex-col items-center">
                                      <span className="font-mono font-bold text-slate-300">
                                        {item.rank2Downlines ? item.rank2Downlines.length : 0}/4
                                      </span>
                                      {item.rank2QueueIndex !== undefined && item.rank2QueueIndex >= 0 && (
                                        <span className="text-[9px] text-sky-400 font-mono font-semibold">
                                          Q#{item.rank2QueueIndex}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Rank 3 Downlines */}
                                  <td className="py-3 px-3 text-center">
                                    <div className="inline-flex flex-col items-center">
                                      <span className="font-mono font-bold text-amber-400">
                                        {item.rank3Downlines ? item.rank3Downlines.length : 0}/4
                                      </span>
                                      {item.rank3QueueIndex !== undefined && item.rank3QueueIndex >= 0 && (
                                        <span className="text-[9px] text-amber-300 font-mono font-semibold">
                                          Pos#{item.rank3QueueIndex}
                                        </span>
                                      )}
                                    </div>
                                  </td>

                                  {/* Actions */}
                                  <td className="py-3 px-3.5 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      <button
                                        onClick={() => {
                                          handleSelectUserId(item.id);
                                          setIsWalletAllDataModalOpen(false);
                                        }}
                                        className="p-1.5 rounded-lg bg-sky-600/80 hover:bg-sky-500 text-white transition active:scale-95 text-[10px] font-bold"
                                        title={lang === 'th' ? 'สลับเข้าใช้งาน ID นี้' : 'Switch ID'}
                                      >
                                        <User className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleSelectUserId(item.id);
                                          setIsWalletAllDataModalOpen(false);
                                          setActiveTab('matrix');
                                        }}
                                        className="p-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white transition active:scale-95 text-[10px] font-bold"
                                        title={lang === 'th' ? 'ดูผัง Matrix' : 'Matrix Tree'}
                                      >
                                        <Layers className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={async () => {
                                          const link = getSafeReferralUrl(item.id);
                                          await copyToClipboardSafe(link);
                                          showToast(
                                            lang === 'th' ? `คัดลอกลิงก์ ID #${item.id}` : `Copied Link #${item.id}`,
                                            link,
                                            'reward'
                                          );
                                        }}
                                        className="p-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 text-white transition active:scale-95 text-[10px] font-bold"
                                        title={lang === 'th' ? 'คัดลอกลิงก์แนะนำ' : 'Copy Ref'}
                                      >
                                        <Copy className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => handleRenewId(item.id)}
                                        disabled={renewingId === item.id || txPending}
                                        className={`p-1.5 rounded-lg text-white transition active:scale-95 text-[10px] font-bold ${
                                          item.isExpired 
                                            ? 'bg-rose-600 hover:bg-rose-500 animate-pulse' 
                                            : 'bg-emerald-700/80 hover:bg-emerald-600'
                                        }`}
                                        title={lang === 'th' ? 'ต่ออายุ 7 วัน' : 'Renew ID (+7 Days)'}
                                      >
                                        {renewingId === item.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  {/* GRID VIEW */}
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {filteredList.map((item, index) => {
                        const isCurrentSelected = (selectedUserId || currentUser?.id) === item.id;
                        const isFirstNode = index === 0 && walletAllDataSortOrder === 'idAsc';
                        const isGhostNode = !isFirstNode && item.sponsorId === 0;
                    
                    return (
                      <div 
                        key={item.id}
                        id={`card_wallet_all_data_node_${item.id}`}
                        className={`p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                          isCurrentSelected
                            ? 'bg-gradient-to-br from-sky-950/80 via-slate-900 to-slate-950 border-sky-400 shadow-lg shadow-sky-500/15 ring-1 ring-sky-400/40'
                            : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700 shadow-md'
                        }`}
                      >
                        {/* Card Top */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-400/40 flex items-center justify-center font-black text-sky-300 text-sm font-mono shadow-sm">
                                #{item.id}
                              </span>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-black text-white">
                                    Member #{item.id}
                                  </span>
                                  {isCurrentSelected && (
                                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-400/40">
                                      {lang === 'th' ? 'กำลังใช้งาน' : 'Active'}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                  <span>Sponsor:</span>
                                  <span className="text-amber-300 font-bold">#{item.sponsorId}</span>
                                </span>
                              </div>
                            </div>

                            {/* Status Badges */}
                            <div className="flex flex-col items-end gap-1">
                              {isGhostNode ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/40 flex items-center gap-1 shadow-sm">
                                  <span>👻</span>
                                  <span>{lang === 'th' ? 'เกิดใหม่' : 'Reborn'}</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                  <span>📝</span>
                                  <span>{lang === 'th' ? 'สมัครตรง' : 'Direct'}</span>
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                item.isAutoReborn
                                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>
                                AutoReborn: {item.isAutoReborn ? 'ON' : 'OFF'}
                              </span>
                            </div>
                          </div>

                          {/* Earnings Summary Row */}
                          <div className="my-2.5 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-400 text-[11px] flex items-center gap-1">
                              <Coins className="w-3.5 h-3.5 text-emerald-400" />
                              <span>{lang === 'th' ? 'รายได้รวม (totalEarned):' : 'Total Earned:'}</span>
                            </span>
                            <span className="text-emerald-300 font-black text-sm">
                              {(item.totalEarned || 0).toFixed(2)} <span className="text-[10px] font-sans text-emerald-400">USDT</span>
                            </span>
                          </div>

                          {/* Matrix Downlines Breakdown (Ranks 1, 2, 3) */}
                          <div className="grid grid-cols-3 gap-2 my-2.5 text-center text-xs">
                            {/* Rank 1 */}
                            <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800/80">
                              <span className="text-[10px] text-sky-400 font-bold block uppercase">Rank 1 (Real)</span>
                              <span className="text-xs font-mono font-bold text-white mt-0.5 block">
                                {item.rank1Downlines ? item.rank1Downlines.length : 0} / 4
                              </span>
                              <div className="text-[9px] text-slate-400 font-mono truncate mt-0.5" title={item.rank1Downlines && item.rank1Downlines.length > 0 ? item.rank1Downlines.map(id => `#${id}`).join(', ') : 'None'}>
                                {item.rank1Downlines && item.rank1Downlines.length > 0 ? item.rank1Downlines.map(id => `#${id}`).join(', ') : '-'}
                              </div>
                            </div>

                            {/* Rank 2 */}
                            <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800/80">
                              <span className="text-[10px] text-slate-300 font-bold block uppercase">Rank 2 (Silver)</span>
                              <span className="text-xs font-mono font-bold text-white mt-0.5 block">
                                {item.rank2Downlines ? item.rank2Downlines.length : 0} / 4
                              </span>
                              <div className="text-[9px] text-slate-400 font-mono truncate mt-0.5" title={item.rank2Downlines && item.rank2Downlines.length > 0 ? item.rank2Downlines.map(id => `#${id}`).join(', ') : 'None'}>
                                {item.rank2Downlines && item.rank2Downlines.length > 0 ? item.rank2Downlines.map(id => `#${id}`).join(', ') : '-'}
                              </div>
                              {item.rank2QueueIndex !== undefined && item.rank2QueueIndex >= 0 && (
                                <div className="mt-1">
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                                    Q#{item.rank2QueueIndex}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Rank 3 */}
                            <div className="p-2 rounded-xl bg-slate-950/50 border border-slate-800/80">
                              <span className="text-[10px] text-amber-400 font-bold block uppercase">Rank 3 (Gold)</span>
                              <span className="text-xs font-mono font-bold text-white mt-0.5 block">
                                {item.rank3Downlines ? item.rank3Downlines.length : 0} / 4
                              </span>
                              <div className="text-[9px] text-slate-400 font-mono truncate mt-0.5" title={item.rank3Downlines && item.rank3Downlines.length > 0 ? item.rank3Downlines.map(id => `#${id}`).join(', ') : 'None'}>
                                {item.rank3Downlines && item.rank3Downlines.length > 0 ? item.rank3Downlines.map(id => `#${id}`).join(', ') : '-'}
                              </div>
                              {item.rank3QueueIndex !== undefined && item.rank3QueueIndex >= 0 && (
                                <div className="mt-1">
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                                    Pos#{item.rank3QueueIndex}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Action Buttons (4 buttons including Renew) */}
                        <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800/80 mt-1">
                          <button
                            onClick={() => {
                              handleSelectUserId(item.id);
                              setIsWalletAllDataModalOpen(false);
                            }}
                            className={`py-1.5 px-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95 ${
                              isCurrentSelected
                                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                                : 'bg-slate-800 hover:bg-slate-700 text-sky-200 hover:text-white'
                            }`}
                            title={lang === 'th' ? 'สลับเข้าใช้งาน ID นี้' : 'Switch to this ID'}
                          >
                            <User className="w-3 h-3" />
                            <span className="hidden xs:inline">{isCurrentSelected ? (lang === 'th' ? 'ใช้งาน' : 'Active') : (lang === 'th' ? 'สลับ' : 'Select')}</span>
                          </button>

                          <button
                            onClick={() => {
                              handleSelectUserId(item.id);
                              setIsWalletAllDataModalOpen(false);
                              setActiveTab('matrix');
                            }}
                            className="py-1.5 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center justify-center gap-1 active:scale-95"
                            title={lang === 'th' ? 'ดูผัง Matrix ของ ID นี้' : 'View Matrix Tree'}
                          >
                            <Layers className="w-3 h-3 text-indigo-400" />
                            <span className="hidden xs:inline">{lang === 'th' ? 'ดูผัง' : 'Matrix'}</span>
                          </button>

                          <button
                            onClick={async () => {
                              const link = getSafeReferralUrl(item.id);
                              await copyToClipboardSafe(link);
                              showToast(
                                lang === 'th' ? `คัดลอกลิงก์ ID #${item.id}` : `Copied Link #${item.id}`,
                                link,
                                'reward'
                              );
                            }}
                            className="py-1.5 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center justify-center gap-1 active:scale-95"
                            title={lang === 'th' ? 'คัดลอกลิงก์แนะนำของ ID นี้' : 'Copy Referral Link'}
                          >
                            <Copy className="w-3 h-3 text-emerald-400" />
                            <span className="hidden xs:inline">{lang === 'th' ? 'ลิงก์' : 'Ref'}</span>
                          </button>

                          <button
                            onClick={() => handleRenewId(item.id)}
                            disabled={renewingId === item.id || txPending}
                            className={`py-1.5 px-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 active:scale-95 ${
                              item.isExpired
                                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                                : 'bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300'
                            }`}
                            title={lang === 'th' ? 'ต่ออายุ 7 วัน' : 'Renew for 7 days'}
                          >
                            {renewingId === item.id ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />}
                            <span>{lang === 'th' ? 'ต่ออายุ' : 'Renew'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          ) : (
                <div className="py-12 px-4 rounded-2xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-400 mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      {lang === 'th' ? 'ไม่พบข้อมูล ID ภายใต้แอดเดรสนี้' : 'No ID records found for this address'}
                    </p>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                      {lang === 'th' 
                        ? 'กระเป๋านี้ยังไม่เคยสมัครสมาชิก หรือยังไม่มี ID ใน Smart Contract' 
                        : 'This wallet has not registered any node IDs on the Smart Contract yet.'}
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setIsWalletAllDataModalOpen(false);
                        setActiveTab('landing');
                        setTimeout(() => {
                          const el = document.getElementById('landing_quick_register_section');
                          if (el) el.scrollIntoView({ behavior: 'smooth' });
                        }, 50);
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition"
                    >
                      {lang === 'th' ? 'สมัครเปิด ID ใหม่ (2 USDT)' : 'Register New ID (2 USDT)'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-800 shrink-0 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-mono">
              <span className="truncate max-w-[220px] xs:max-w-[320px] sm:max-w-none">
                {lang === 'th' ? 'ข้อมูลภาพรวมผังและรายได้ทุกรหัส' : 'Complete Matrix & Earnings Data'}
              </span>
              <span className="text-emerald-400 shrink-0 font-bold ml-2">
                {isLiveWeb3 ? 'Live On-Chain (BSC)' : 'Synced'}
              </span>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POP-UP MODAL: EXPIRED USER IDs & EARNINGS (NEW SMART CONTRACT FUNCTION) */}
      {/* ========================================================================= */}
      {isExpiredIdsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
            onClick={() => setIsExpiredIdsModalOpen(false)}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-lg bg-slate-900/95 border border-amber-500/40 rounded-3xl shadow-2xl p-4 sm:p-6 z-10 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    {lang === 'th' ? 'รายการรหัสที่หมดอายุ' : 'Expired IDs & Earnings'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'th' ? 'ดึงจาก getWalletExpiredIdsAndTotalEarned()' : 'On-Chain Expiration & Earnings Data'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsExpiredIdsModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="py-4 overflow-y-auto flex-1 space-y-3">
              {expiredIdsData && expiredIdsData.expiredIds && expiredIdsData.expiredIds.length > 0 ? (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>
                      {lang === 'th'
                        ? `พบ ${expiredIdsData.expiredIds.length} รหัสที่หมดอายุ กรุณากดต่ออายุเพื่อรักษาสิทธิ์รับปันผลต่อเนื่อง`
                        : `Found ${expiredIdsData.expiredIds.length} expired IDs. Renew each ID to continue receiving system payouts.`}
                    </span>
                  </div>

                  {expiredIdsData.expiredIds.map((eid, idx) => {
                    const earned = (expiredIdsData.earnedAmounts && expiredIdsData.earnedAmounts[idx]) || 0;
                    return (
                      <div
                        key={eid}
                        className="p-3.5 rounded-2xl bg-slate-950/80 border border-rose-500/30 flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center font-mono font-bold text-xs">
                            #{eid}
                          </div>
                          <div>
                            <span className="font-mono font-bold text-sm text-white block">
                              ID #{eid}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              Total Earned:{' '}
                              <strong className="text-emerald-400 font-black">{earned.toFixed(2)} USDT</strong>
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRenewId(eid)}
                          disabled={renewingId === eid || txPending}
                          className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-md shadow-emerald-950/40 disabled:opacity-50"
                        >
                          {renewingId === eid ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Clock className="w-3.5 h-3.5" />}
                          <span>{lang === 'th' ? 'ต่ออายุ (+7 วัน)' : 'Renew (+7d)'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">
                      {lang === 'th' ? 'ไม่มีรหัสที่หมดอายุ' : 'No Expired IDs Found'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      {lang === 'th'
                        ? 'ทุกรหัสในกระเป๋าของคุณยังคงอยู่ในสถานะปกติและมีอายุการใช้งาน 7 วัน'
                        : 'All IDs registered in this wallet are currently active with full lifespan.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-800 shrink-0 flex items-center justify-between text-xs text-slate-400">
              <span>{lang === 'th' ? 'ระยะเวลาต่ออายุ: 7 วัน' : 'Renewal Duration: 7 Days'}</span>
              <button
                onClick={handleFetchExpiredIds}
                disabled={isFetchingExpiredData}
                className="text-amber-400 hover:text-amber-300 font-bold text-xs flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isFetchingExpiredData ? 'animate-spin' : ''}`} />
                <span>{lang === 'th' ? 'ตรวจซ้ำ' : 'Re-check'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRIMARY BENTO GRID (Tiles 1, 2, 3) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Bento Tile 1: Account Profile (Col 4) */}
        <div className="md:col-span-4 glass rounded-3xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-white text-xs uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>{t.profileTitle}</span>
              </h3>
              <span className={`text-[11px] font-black px-3 py-0.5 rounded-full shadow-sm ${
                currentUser 
                  ? 'bg-sky-500/25 text-sky-200 border border-sky-400/50' 
                  : 'bg-amber-500/25 text-amber-200 border border-amber-400/50'
              }`}>
                {currentUser ? `RANK ${currentUser.rank3BoardPosition > 0 ? '3 GOLD' : currentUser.rank2QueueIndex > 0 ? '2 SILVER' : '1 REAL'}` : 'GUEST'}
              </span>
            </div>

            <div className="flex items-center gap-3.5 my-3">
              <div 
                onClick={() => {
                  setIsWalletAllDataModalOpen(true);
                  handleFetchWalletAllData(false);
                }}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 flex items-center justify-center text-xl sm:text-2xl font-black text-white shadow-xl font-mono cursor-pointer hover:scale-105 active:scale-95 transition shrink-0 ${
                  currentUser
                    ? 'bg-gradient-to-tr from-sky-600 to-indigo-600 border-sky-300 shadow-sky-500/30'
                    : 'bg-slate-800 border-amber-400 text-amber-300 shadow-amber-500/20'
                }`}
                title={lang === 'th' ? 'คลิกเพื่อดูข้อมูลภาพรวมทุก ID ในกระเป๋า' : 'Click to view all IDs in this wallet'}
              >
                {currentUser ? `#${currentUser.id}` : (walletIds.length > 0 ? `#${walletIds[0]}` : (lang === 'th' ? 'ไม่มี ID' : 'No ID'))}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-base sm:text-lg font-black text-white truncate">
                    {currentUser 
                      ? `Member #${currentUser.id}` 
                      : (walletIds.length > 0 ? `Member #${walletIds[0]}` : (lang === 'th' ? 'ยังไม่มี ID' : 'No ID Linked'))}
                  </p>
                  {(currentUser || walletIds.length > 0) && (
                    Boolean(
                      (walletIds.length > 0 && currentUser?.id && walletIds[0] !== currentUser.id) ||
                      currentUser?.isGhost ||
                      (currentUser?.address && (currentUser.address.toLowerCase().includes('ghost') || currentUser.address.toLowerCase().includes('reborn')))
                    ) ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-400 border border-sky-400/50 shadow-sm shadow-sky-500/10 flex items-center gap-1">
                        <span>👻</span>
                        <span>{lang === 'th' ? 'เกิดใหม่' : 'Reborn'}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span>📝</span>
                        <span>{lang === 'th' ? 'สมัคร' : 'Direct'}</span>
                      </span>
                    )
                  )}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border shadow-sm ${
                    currentUser || walletIds.length > 0
                      ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/40'
                      : 'bg-amber-500/25 text-amber-300 border-amber-400/40'
                  }`}>
                    {currentUser || walletIds.length > 0 ? (lang === 'th' ? '✓ ใช้งาน' : '✓ Active') : (lang === 'th' ? 'ยังไม่มี ID' : 'No ID')}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-xs font-mono text-slate-300">
                  <span className="truncate">
                    {activeAccount ? `${activeAccount.address.slice(0, 10)}...${activeAccount.address.slice(-6)}` : 'Not Connected'}
                  </span>
                </div>
              </div>
            </div>

            {/* Connected Wallet On-Chain Balance Bar */}
            {activeAccount && (
              <div className="my-2.5 p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-2 text-xs shadow-inner">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Coins className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-slate-300 text-[11px] font-semibold">{lang === 'th' ? 'ยอดเงินในกระเป๋า:' : 'Wallet Bal:'}</span>
                </div>
                <div className="flex items-center gap-2 font-mono shrink-0">
                  <span className="text-emerald-400 font-black text-xs sm:text-sm bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-400/20">
                    {activeAccount.usdtBalance.toFixed(2)} <span className="text-[10px] text-emerald-300 font-sans">USDT</span>
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-amber-400 font-bold text-xs">
                    {activeAccount.bnbBalance.toFixed(3)} <span className="text-[10px] text-amber-300 font-sans">BNB</span>
                  </span>
                  <button
                    onClick={async () => {
                      setIsRefreshing(true);
                      await refreshWalletBalance();
                      setIsRefreshing(false);
                      showToast(
                        lang === 'th' ? 'ดึงยอดเงินล่าสุดแล้ว' : 'Balance Updated',
                        lang === 'th' ? 'อัปเดตยอด USDT และ BNB ล่าสุดเรียบร้อย' : 'Updated USDT & BNB balances',
                        'info'
                      );
                    }}
                    disabled={isRefreshing}
                    className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition disabled:opacity-50 ml-1"
                    title={lang === 'th' ? 'ดึงยอดเงินจากบล็อกเชนใหม่' : 'Sync Wallet Balances'}
                  >
                    <RefreshCw className={`w-3 h-3 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons: Id Rank1 (Available Nodes) */}
            <div className="mt-3">
              {/* Id Rank1 Button */}
              <button
                id="btn_id_rank1_nodes"
                onClick={() => {
                  setIsRank1ModalOpen(true);
                  handleFetchRank1AvailableNodes(false);
                }}
                className="w-full py-2.5 px-3.5 rounded-xl border text-xs sm:text-sm font-black transition flex items-center justify-between active:scale-95 shadow-lg bg-gradient-to-r from-amber-500/30 via-amber-600/35 to-emerald-500/30 hover:from-amber-500/40 hover:to-emerald-500/40 border-amber-400/80 hover:border-amber-300 text-amber-100 hover:text-white group shadow-amber-950/40"
                title={lang === 'th' ? 'แสดงหน้าต่าง ID ที่ Slot ไม่เต็ม 4' : 'View IDs with available Rank 1 slots (< 4)'}
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform" />
                  <span className="truncate">{lang === 'th' ? 'Id Rank1 ที่ยังไม่เต็ม' : 'Id Rank1 (Open Slots)'}</span>
                </div>
                {availableRank1Data.availableIds.length > 0 && (
                  <span className="px-2 py-0.5 text-[11px] rounded-full bg-amber-400 text-slate-950 font-mono font-black shadow-md">
                    {availableRank1Data.availableIds.length}
                  </span>
                )}
              </button>
            </div>

            {/* Prominent Button: ข้อมูลภาพรวมทุก ID */}
            <button
              id="btn_open_wallet_all_data_modal"
              onClick={() => {
                setIsWalletAllDataModalOpen(true);
                handleFetchWalletAllData(false);
              }}
              className="w-full mt-2 py-2.5 px-3.5 rounded-xl border text-xs sm:text-sm font-black transition flex items-center justify-between active:scale-95 shadow-lg bg-gradient-to-r from-sky-500/25 via-indigo-500/30 to-purple-500/25 hover:from-sky-500/35 hover:via-indigo-500/40 hover:to-purple-500/35 border-sky-400/60 hover:border-sky-300 text-sky-100 hover:text-white group shadow-indigo-950/50"
              title={lang === 'th' ? 'แสดงหน้าต่าง ข้อมูลทุก ID ในกระเป๋า' : 'View all IDs in this wallet'}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-lg bg-sky-500/30 border border-sky-400/40 flex items-center justify-center text-sky-300 group-hover:scale-110 transition-transform shrink-0 shadow-sm">
                  <LayoutGrid className="w-3.5 h-3.5 text-sky-300" />
                </div>
                <div className="text-left truncate">
                  <span className="font-black block truncate">
                    {lang === 'th' ? 'ข้อมูลภาพรวมทุก ID' : 'All IDs Overview'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="px-2 py-0.5 text-[10px] font-mono font-black rounded-full bg-sky-400 text-slate-950 shadow-md">
                  {walletIds.length > 0 ? `${walletIds.length} IDs` : 'View'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-sky-300 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Quick Button: ตรวจสอบและต่ออายุรหัสที่หมดอายุ */}
            <button
              id="btn_open_expired_ids_modal"
              onClick={handleFetchExpiredIds}
              disabled={isFetchingExpiredData || !activeAccount}
              className="w-full mt-2 py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-between active:scale-95 bg-slate-900/90 hover:bg-slate-800/90 border-amber-500/40 hover:border-amber-400 text-amber-200 hover:text-white"
              title={lang === 'th' ? 'ตรวจหารหัสที่หมดอายุและต่ออายุ (+7 วัน)' : 'Check expired IDs and renew'}
            >
              <div className="flex items-center gap-2">
                <Clock className={`w-3.5 h-3.5 text-amber-400 ${isFetchingExpiredData ? 'animate-spin' : ''}`} />
                <span>{lang === 'th' ? 'สถานะอายุรหัส & ต่ออายุ (7 วัน)' : 'ID Lifespan & Renewal (7d)'}</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                {lang === 'th' ? 'ตรวจเช็ค' : 'Check'}
              </span>
            </button>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs sm:text-sm font-black text-sky-300 flex items-center gap-1.5">
                <Link2 className="w-4 h-4 text-sky-400" />
                <span>{lang === 'th' ? 'ลิงก์แนะนำเพื่อน' : 'Personal Referral Link'}</span>
              </span>
              <span className="text-xs font-black text-emerald-300 font-mono bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 rounded-full shadow-sm">
                10% Direct
              </span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-900/90 border border-sky-500/40 focus-within:border-sky-400 rounded-xl px-3 py-2 text-xs font-mono font-semibold overflow-hidden whitespace-nowrap text-sky-100 select-all shadow-inner">
                {currentUser ? displayRefLink : 'wealthlifecycle.io/ref/1'}
              </div>
              <button 
                id="btn_copy_ref_link"
                onClick={handleCopyLink}
                disabled={!currentUser}
                title={lang === 'th' ? 'คัดลอกลิงก์แนะนำ' : 'Copy referral link'}
                className="bg-sky-500 hover:bg-sky-400 active:bg-sky-600 px-4 rounded-xl text-white font-bold transition-all flex items-center justify-center disabled:opacity-40 disabled:hover:bg-slate-700 shadow-lg shadow-sky-500/30 active:scale-95"
              >
                {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* Bento Tile 2: Total Earnings (Col 4) */}
        <div className="md:col-span-4 glass rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-white text-xs uppercase tracking-wider font-extrabold flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.totalEarned}</span>
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[11px] text-emerald-300 font-mono font-bold bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-400/40 truncate max-w-[200px]" title={activeAccount?.address || currentUser?.address || '0x...'}>
                    {activeAccount?.address ? `${activeAccount.address.slice(0, 6)}...${activeAccount.address.slice(-4)}` : (currentUser?.address ? `${currentUser.address.slice(0, 6)}...${currentUser.address.slice(-4)}` : '0x...')}
                  </span>
                </div>
              </div>

              <button
                onClick={handleRefreshMyEarned}
                disabled={isQueryingEarned}
                title={lang === 'th' ? 'รีเฟรชรายได้รวมจาก Smart Contract' : 'Refresh total earnings from Smart Contract'}
                className="p-2.5 rounded-xl bg-slate-850 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-500/50 transition flex items-center gap-1 text-xs font-mono font-bold shadow-sm active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isQueryingEarned ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            <div className="mt-4 flex items-baseline">
              <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight drop-shadow-sm">
                {liveTotalEarned.toFixed(2)}
              </span>
              <span className="text-lg text-emerald-400 font-black ml-2">USDT</span>
            </div>
            
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {lang === 'th' ? 'รายได้รวมสะสมทุก ID ในกระเป๋า' : 'Aggregated earnings across all wallet IDs'}
            </p>

            {/* Quick trigger to open wallet all data */}
            <button
              id="btn_earnings_open_wallet_all_data"
              onClick={() => {
                setIsWalletAllDataModalOpen(true);
                handleFetchWalletAllData(false);
              }}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/40 text-xs font-bold text-slate-300 hover:text-white transition flex items-center justify-between group shadow-sm active:scale-95"
              title={lang === 'th' ? 'ดูข้อมูลแยกตาม ID' : 'View per-ID breakdown'}
            >
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>{lang === 'th' ? 'ดูรายละเอียดแยกตาม ID' : 'View Details by ID'}</span>
              </span>
              <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 group-hover:text-emerald-400 transition" />
            </button>

            {/* Payment Received Notifications button */}
            <button
              id="btn_open_payment_received_modal_dashboard"
              onClick={() => setIsPaymentModalOpen(true)}
              className="mt-2 w-full py-2 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-400 text-xs font-bold text-emerald-300 hover:text-white transition flex items-center justify-between group shadow-sm active:scale-95"
              title={lang === 'th' ? 'ดูรายการแจ้งเตือนการได้รับเงิน' : 'View payment received notifications'}
            >
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                <Bell className="w-3.5 h-3.5" />
                <span>{lang === 'th' ? 'รายการได้รับเงิน & แจ้งเตือน' : 'Payment Notifications'}</span>
              </span>
              <div className="flex items-center gap-1.5">
                {unreadPaymentCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-black bg-emerald-500 text-slate-950 rounded-full animate-pulse">
                    {unreadPaymentCount}
                  </span>
                )}
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 group-hover:text-emerald-400 transition" />
              </div>
            </button>
          </div>

          <div className="relative z-10 mt-6 flex items-center justify-between pt-4 border-t border-slate-700/50">
            <span className="text-xs font-bold text-slate-300">
              {lang === 'th' ? 'สถานะ Smart Contract' : 'Contract Status'}
            </span>
            <span className="text-xs font-mono font-black text-emerald-300 flex items-center gap-1.5 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {lang === 'th' ? 'เชื่อมต่อ On-Chain' : 'Live On-Chain'}
            </span>
          </div>

          <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
        </div>

        {/* Bento Tile 3: Global Queue Progress (Col 4) */}
        <div className="md:col-span-4 glass rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-white text-xs uppercase tracking-wider font-extrabold flex items-center gap-1.5 mb-4">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>{lang === 'th' ? 'ความคืบหน้าคิวระดับโลก' : 'Global Queue Progress'}</span>
            </h3>

            <div className="space-y-3">
              {/* Rank 2 Card */}
              <div className="bg-slate-900/85 p-4 rounded-2xl border border-sky-500/30 shadow-md shadow-sky-950/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black neon-silver tracking-wide">RANK 2 SILVER QUEUE</span>
                  <span className="text-[11px] text-sky-300 font-mono font-bold bg-sky-500/20 px-2 py-0.5 rounded border border-sky-400/30">
                    {currentUser?.rank2QueueIndex && currentUser.rank2QueueIndex > 0 ? `Pos #${currentUser.rank2QueueIndex}` : 'Active'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${((currentUser?.rank2SlotsFilled || 3) / 4) * 100}%` }}
                    className="bg-sky-400 h-full shadow-[0_0_12px_#38bdf8] transition-all duration-500" 
                  />
                </div>
                <p className="text-[11px] text-slate-300 mt-2 font-medium">
                  {currentUser?.rank2SlotsFilled || 3}/4 Slots filled. Waiting for next Reborn spawn.
                </p>
              </div>

              {/* Rank 3 Card */}
              <div className="bg-slate-900/85 p-4 rounded-2xl border border-amber-500/30 shadow-md shadow-amber-950/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-black neon-gold tracking-wide">RANK 3 APEX GOLD</span>
                  <span className="text-[11px] text-amber-300 font-mono font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30">
                    {currentUser?.rank3BoardPosition && currentUser.rank3BoardPosition > 0 ? 'Active Board' : 'Accumulating'}
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${((currentUser?.rank3SlotsFilled || 1) / 4) * 100}%` }}
                    className="bg-amber-400 h-full shadow-[0_0_12px_#fbbf24] transition-all duration-500" 
                  />
                </div>
                <p className="text-[11px] text-slate-300 mt-2 font-medium">
                  {lang === 'th' ? 'รับ 2.00 USDT/คิว (รวม 8.00 USDT) + เสกผี 8 ตัว (4 เข้า R1, 4 เข้า R2)' : 'Harvests 8.00 USDT ($2.00/queue) + spawns 8 Ghosts (4 to R1, 4 to R2).'}
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('matrix')}
            className="w-full mt-4 py-3.5 bg-gradient-to-r from-sky-500 via-indigo-600 to-purple-600 hover:from-sky-400 hover:to-purple-500 rounded-2xl font-black text-xs sm:text-sm text-white uppercase tracking-wider shadow-xl shadow-sky-900/50 hover:scale-[1.02] active:scale-95 transition"
          >
            {lang === 'th' ? 'ดูผังเมทริกซ์เต็มหน้าจอ' : 'EXPAND MATRIX VISUALIZER'}
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* SECONDARY BENTO GRID (Matrix Tree Spotlight & Registration / Actions) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Matrix Tree Preview Bento (Col 8) - Powered by Smart Contract getTeamTree(ID) */}
        <div className="md:col-span-8 glass rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[11px] font-mono font-black px-2.5 py-0.5 rounded-full bg-sky-500/25 text-sky-200 border border-sky-400/40 flex items-center gap-1.5 shadow-sm">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  getTeamTree({dashboardTreeRootId})
                </span>
                <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-sm">
                  {isLiveWeb3 ? 'Live On-Chain' : 'Engine Synced'}
                </span>
                {lastTreeQueryTime && (
                  <span className="text-[10px] text-slate-400 font-mono font-bold">
                    {lastTreeQueryTime}
                  </span>
                )}
              </div>
              <h3 className="text-white text-lg sm:text-xl font-black tracking-tight">
                {t.rank1Title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                {lang === 'th' ? 'แสดงโครงข่าย 1 แตก 4 และรหัสผี Ghost IDs' : 'Visualizing your 1:4 spillover network and Ghost IDs'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Quick Root ID Switcher for getTeamTree */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const targetId = parseInt(dashboardTreeInputId.trim(), 10);
                  if (!isNaN(targetId) && targetId > 0) {
                    setCustomTreeRootId(targetId);
                    setDashboardTreeInputId('');
                  }
                }}
                className="flex items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-xl border border-slate-700/90 shadow-sm"
              >
                <input
                  type="number"
                  min="1"
                  placeholder={`ID #${dashboardTreeRootId}`}
                  value={dashboardTreeInputId}
                  onChange={(e) => setDashboardTreeInputId(e.target.value)}
                  className="w-20 sm:w-24 bg-transparent border-none px-2 py-1 text-xs text-white font-mono font-bold placeholder:text-slate-500 focus:outline-none text-center"
                />
                <button
                  type="submit"
                  disabled={isFetchingTree}
                  title="Query getTeamTree(ID)"
                  className="px-3 py-1.5 rounded-lg bg-sky-500/30 hover:bg-sky-500/50 text-sky-200 hover:text-white text-xs font-mono font-black border border-sky-400/40 transition flex items-center gap-1 active:scale-95 shadow-sm"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Tree</span>
                </button>
              </form>

              <button
                type="button"
                onClick={() => loadDashboardTree(dashboardTreeRootId)}
                disabled={isFetchingTree}
                title="Refresh getTeamTree on Smart Contract"
                className="p-2.5 rounded-xl bg-slate-900/95 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition active:scale-95 disabled:opacity-50 shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 text-sky-400 ${isFetchingTree ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Legends Bar */}
          <div className="flex items-center justify-between gap-3 text-xs mb-4 pb-3 border-b border-slate-800/60">
            <span className="text-xs text-slate-300 font-mono font-semibold">
              Root: <strong className="text-white font-black text-sm">#{dashboardTree?.root?.id ?? dashboardTreeRootId}</strong>
              {dashboardTree?.root && (
                <span className="ml-2 text-slate-400 font-medium">
                  (Downlines: {'downlineCount' in dashboardTree.root ? dashboardTree.root.downlineCount : (dashboardTree.root.referralsCount || 0)})
                </span>
              )}
            </span>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full node-active shadow-[0_0_10px_#38bdf8]"></div>
                <span className="text-[11px] sm:text-xs text-slate-200 font-bold">
                  {lang === 'th' ? '👤 รหัสผู้เล่นจริง (REAL USER)' : '👤 REAL USER'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full node-ghost border border-dashed border-purple-400 shadow-[0_0_10px_#c084fc]"></div>
                <span className="text-[11px] sm:text-xs text-purple-200 font-bold">
                  {lang === 'th' ? '👻 รหัสผี (GHOST REBORN)' : '👻 GHOST REBORN'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-full node-empty border border-dashed border-slate-600"></div>
                <span className="text-[11px] sm:text-xs text-slate-400 font-bold">
                  {lang === 'th' ? '➕ สล็อตว่าง (AVAILABLE SLOT)' : '➕ AVAILABLE SLOT'}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Tree Layout fetched via getTeamTree */}
          <div className="flex-1 flex flex-col items-center justify-center py-6 relative min-h-[220px]">
            {isFetchingTree && (
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-2 rounded-2xl">
                <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
                <span className="text-xs font-mono text-sky-300">Calling getTeamTree({dashboardTreeRootId})...</span>
              </div>
            )}

            {/* Center Root Node */}
            <div className="flex flex-col items-center z-10">
              <button
                type="button"
                onClick={() => {
                  const root = dashboardTree?.root;
                  if (root) {
                    const walletStr = 'wallet' in root ? root.wallet : root.address;
                    const downlines = 'downlineCount' in root ? root.downlineCount : (root.referralsCount || 0);
                    showToast(
                      `User #${root.id} Details`,
                      `Wallet: ${walletStr.slice(0, 8)}... | Downlines: ${downlines} | Sponsor: #${root.sponsorId}`,
                      'success'
                    );
                  }
                }}
                className={`w-16 h-16 rounded-full border-4 border-slate-900 flex flex-col items-center justify-center font-bold font-mono shadow-xl transition-transform hover:scale-105 active:scale-95 ${
                  dashboardTree?.root?.isGhost
                    ? 'node-ghost text-sky-200 shadow-sky-500/50'
                    : 'node-active text-white shadow-sky-500/40'
                }`}
              >
                {dashboardTree?.root?.isGhost ? (
                  <span className="text-lg">👻</span>
                ) : (
                  <span className="text-sm sm:text-base">#{dashboardTree?.root?.id ?? dashboardTreeRootId}</span>
                )}
              </button>
              <span className="text-[10px] text-sky-300 font-mono font-bold mt-1">
                {dashboardTree?.root?.id === currentUser?.id ? 'YOU (ROOT)' : `ROOT #${dashboardTree?.root?.id ?? dashboardTreeRootId}`}
              </span>
            </div>
            
            {/* Connecting Vertical Line */}
            <div className="w-0.5 h-8 bg-slate-700/70"></div>
            
            {/* 4 Children Slots from getTeamTree */}
            <div className="flex gap-3 sm:gap-10 relative w-full justify-center">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[76%] h-px bg-slate-700/70"></div>

              {[0, 1, 2, 3].map((slotIdx) => {
                const child = dashboardTree?.level1?.[slotIdx];
                const isEmpty = !child || ('isSlotEmpty' in child && child.isSlotEmpty) || child.id < 0;
                const isGhost = child && !isEmpty && Boolean(child.isGhost);
                const isReal = child && !isEmpty && !isGhost;

                return (
                  <div key={slotIdx} className="flex flex-col items-center pt-3 relative">
                    <div className="w-0.5 h-3.5 bg-slate-700/70 absolute top-0"></div>
                    
                    {isEmpty ? (
                      // Empty Vacant Slot
                      <button
                        type="button"
                        onClick={() => setActiveTab('matrix')}
                        title={`Slot #${slotIdx + 1} is vacant. Click to view full matrix.`}
                        className="w-12 h-12 rounded-full node-empty flex items-center justify-center text-slate-500 hover:border-sky-400 hover:text-sky-300 cursor-pointer transition-all hover:scale-105 active:scale-95 text-base font-bold"
                      >
                        +
                      </button>
                    ) : isGhost ? (
                      // Ghost Child Node (Sky Blue ลูกเทพ/เกิดใหม่)
                      <button
                        type="button"
                        onClick={() => {
                          setCustomTreeRootId(child.id);
                        }}
                        title={`Ghost ID #${child.id}${('sponsorId' in child && child.sponsorId) ? ` (Sponsor: #${child.sponsorId})` : ''}. Click to drill down.`}
                        className="w-12 h-12 rounded-full node-ghost border-4 border-slate-900 flex items-center justify-center text-lg animate-bounce transition-transform hover:scale-110 active:scale-95 shadow-md shadow-sky-500/40 text-sky-200"
                      >
                        👻
                      </button>
                    ) : (
                      // Real User Child Node
                      <button
                        type="button"
                        onClick={() => {
                          setCustomTreeRootId(child.id);
                        }}
                        title={`Real User #${child.id} (Downlines: ${'downlineCount' in child ? child.downlineCount : ('referralsCount' in child ? child.referralsCount : 0)}). Click to drill down.`}
                        className="w-12 h-12 rounded-full node-active border-4 border-slate-900 flex items-center justify-center text-xs font-mono font-bold text-white transition-transform hover:scale-110 active:scale-95 shadow-md shadow-sky-500/30"
                      >
                        #{child.id}
                      </button>
                    )}

                    {/* Slot Label */}
                    <div className="mt-1 text-center font-mono">
                      {isEmpty ? (
                        <span className="text-[9px] text-slate-500 uppercase font-semibold">VACANT</span>
                      ) : isGhost ? (
                        <span className="text-[9px] text-sky-400 font-bold block">G#0</span>
                      ) : (
                        <span className="text-[9px] text-sky-400 font-bold block">REAL</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Status Badge */}
            <div className="mt-8 text-center">
              <div className="inline-flex items-center gap-3 bg-slate-900/90 px-4 sm:px-5 py-2.5 rounded-2xl border border-slate-700/80 text-xs">
                <div className="flex -space-x-2">
                  <div className="w-5 h-5 rounded-full bg-sky-600 border border-slate-900"></div>
                  <div className="w-5 h-5 rounded-full bg-purple-600 border border-slate-900"></div>
                  <div className="w-5 h-5 rounded-full bg-slate-700 border border-slate-900 flex items-center justify-center text-[8px] font-bold text-white font-mono">
                    +{dashboardTree?.root ? ('downlineCount' in dashboardTree.root ? dashboardTree.root.downlineCount : dashboardTree.root.referralsCount) : contractState.users.length}
                  </div>
                </div>
                <p className="text-slate-300 text-[11px] sm:text-xs">
                  {lang === 'th' ? 'เครือข่ายเติบโตอย่างต่อเนื่องด้วยระบบ Ghost Reborn' : 'Spillover network continuously fueled by Ghost Reborn'}
                </p>
                {customTreeRootId !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomTreeRootId(null);
                    }}
                    className="ml-1 text-[10px] text-sky-400 hover:underline font-mono"
                  >
                    (Reset to #{selectedUserId || currentUser?.id || 1})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Column (Col 4) */}
        <div className="md:col-span-4 flex flex-col gap-5">
          
          {/* Smart Contract Registration Form */}
          {!currentUser ? (
            <div className="glass rounded-3xl p-6 border-sky-400/40 shadow-xl shadow-sky-500/10">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-sky-400" />
                  <h4 className="font-black text-white text-base tracking-tight">
                    {lang === 'th' ? 'สมัครสมาชิก (Register)' : 'Smart Contract Registration'}
                  </h4>
                </div>
                <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-sm">
                  2.00 USDT
                </span>
              </div>
              <p className="text-xs text-slate-200 font-medium mb-4 leading-relaxed">
                {lang === 'th' 
                  ? 'เรียกใช้ฟังก์ชัน register(sponsorId) บน Smart Contract BNB Smart Chain เพื่อเปิดรหัสและเข้าสู่ผัง Matrix ทันที' 
                  : 'Calls register(sponsorId) directly on BSC Smart Contract to activate your node in Rank 1.'}
              </p>

              {/* Wallet and USDT Balance Status */}
              <div className="mb-4 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">
                  {lang === 'th' ? 'ยอดเงินในกระเป๋า:' : 'Wallet Balance:'}
                </span>
                {activeAccount ? (
                  <span className="font-mono font-black text-emerald-400 text-sm bg-emerald-500/15 border border-emerald-400/30 px-2 py-0.5 rounded-lg shadow-sm">
                    {activeAccount.usdtBalance.toFixed(2)} USDT
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold">
                    {lang === 'th' ? 'ยังไม่ได้เชื่อมต่อ' : 'Not Connected'}
                  </span>
                )}
              </div>

              {/* Official Launch Countdown Card if not launched */}
              {!isLaunched && (
                <div className="mb-4">
                  <LaunchCountdownWidget lang={lang} variant="card" />
                </div>
              )}

              {/* Step 1: USDT Allowance if required on-chain */}
              {isLiveWeb3 && usdtAllowance < 2.0 && (
                <div className="mb-4 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-400/50 shadow-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-amber-200 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-amber-400" />
                      {lang === 'th' ? 'ขั้นตอนที่ 1: ปลดล็อก USDT (ครั้งเดียวตลอดชีพ)' : 'Step 1: Approve USDT (1-Time Only)'}
                    </span>
                    <span className="text-[11px] text-amber-300 font-mono font-bold">1-Time Only</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={isApproving || txPending}
                    className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-98 shadow-lg shadow-amber-500/30"
                  >
                    {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4 text-slate-950" />}
                    <span>{isApproving ? 'Approving on BSC...' : (lang === 'th' ? 'อนุมัติ USDT (กดครั้งเดียวตลอดชีพ)' : 'Approve USDT (1-Time Only)')}</span>
                  </button>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs text-slate-200 font-black block">
                      {lang === 'th' ? 'รหัสผู้แนะนำ (Sponsor ID)' : 'Sponsor ID (uint256)'}
                    </label>
                    <span className="text-xs font-mono font-bold text-sky-300">
                      Function: register({sponsorInput || '1'})
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    placeholder={t.inputSponsor}
                    value={sponsorInput}
                    onChange={(e) => setSponsorInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono font-bold text-white text-center focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/50 shadow-inner"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRegistering || txPending || !isLaunched}
                  className={`w-full py-3.5 rounded-xl font-black text-xs sm:text-sm transition shadow-xl flex items-center justify-center gap-2 active:scale-98 disabled:opacity-75 ${
                    !isLaunched
                      ? 'bg-gradient-to-r from-amber-500/80 via-orange-500/80 to-amber-600/80 text-slate-950 border border-amber-400/50 shadow-amber-500/10 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-slate-950 hover:text-black shadow-emerald-500/25'
                  }`}
                >
                  {isRegistering || txPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span className="font-black">{t.processingTx}</span>
                    </>
                  ) : !isLaunched ? (
                    <>
                      <Lock className="w-4 h-4 text-slate-950" />
                      <span className="font-black">
                        {lang === 'th' 
                          ? `🔒 เปิดสมัคร 30 ส.ค. 13:09 (${formattedCountdown})` 
                          : `🔒 Launch in ${formattedCountdown}`}
                      </span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-slate-950 fill-current" />
                      <span className="font-black">
                        {lang === 'th' 
                          ? `ยืนยันสมัครสมาชิก • register(${sponsorInput || '1'})` 
                          : `Confirm Register • register(${sponsorInput || '1'})`}
                      </span>
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="glass rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-black text-slate-200 uppercase tracking-wider block mb-3">
                  {lang === 'th' ? 'สถิติทีมของคุณ' : 'Your Team Stats'}
                </span>
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm py-2 border-b border-slate-800">
                    <span className="text-slate-300 font-semibold">{t.statsRealUsers}</span>
                    <span className="font-mono font-black text-white">{currentUser.referralsCount} People</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm py-2 border-b border-slate-800">
                    <span className="text-slate-300 font-semibold">{t.cyclesCompleted}</span>
                    <span className="font-mono font-black text-emerald-400">{currentUser.cyclesCompleted} Cycles</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm py-2">
                    <span className="text-slate-300 font-semibold">{lang === 'th' ? 'รหัสผีที่สร้างแล้ว' : 'Ghosts Generated'}</span>
                    <span className="font-mono font-black text-purple-300">{currentUser.rebornCount} Ghosts</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Ghost Spawner Bar */}
          <div className="glass rounded-3xl p-5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-500/25 border border-purple-400/40 flex items-center justify-center text-purple-200 text-2xl shadow-inner">
                👻
              </div>
              <div>
                <p className="text-xs sm:text-sm font-black text-white">Ghost Spawner</p>
                <p className="text-[11px] text-slate-300 font-medium">Pushing Global Queues...</p>
              </div>
            </div>
            <button
              onClick={handleQuickSpawn}
              disabled={isSpawningQuickGhost}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-black rounded-xl border border-purple-400/40 text-white shadow-lg shadow-purple-900/40 transition active:scale-95 disabled:opacity-50"
            >
              {isSpawningQuickGhost ? 'Spawning...' : 'SPAWN 2 GHOSTS'}
            </button>
          </div>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* REVENUE BREAKDOWN & TRANSACTIONS TABLE */}
      {/* ========================================================================= */}
      <div className="glass rounded-3xl p-5 sm:p-7 space-y-4">
        {/* Header and Total count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-white tracking-tight flex items-center gap-2">
                {lang === 'th' ? 'รายการธุรกรรมล่าสุดบน Smart Contract' : 'Recent Smart Contract Activity'}
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live BSC
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {lang === 'th' 
                  ? 'ตรวจสอบความโปร่งใสของธุรกรรม สมัครสมาชิก โบนัสแนะนำ และการจ่ายผลตอบแทนเมทริกซ์' 
                  : 'Transparent on-chain history of registrations, direct bonuses, matrix payouts & reborn queues'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300 font-mono font-bold bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-700/80 shadow-sm">
              <strong className="text-sky-400 font-black">{contractState.transactions.length}</strong> {lang === 'th' ? 'ธุรกรรมทั้งหมด' : 'Total TXs'}
            </span>
          </div>
        </div>

        {/* Filter and Search Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 pt-1">
          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', labelTh: 'ทั้งหมด', labelEn: 'All', count: contractState.transactions.length },
              { id: 'REGISTER', labelTh: 'สมัครสมาชิก (2 USDT)', labelEn: 'Registers', count: contractState.transactions.filter(t => t.type === 'REGISTER').length },
              { id: 'SPONSOR_BONUS', labelTh: 'โบนัสแนะนำ 10%', labelEn: 'Direct 10%', count: contractState.transactions.filter(t => t.type === 'SPONSOR_BONUS').length },
              { id: 'MATRIX', labelTh: 'ผังเมทริกซ์ (Rank 1-3)', labelEn: 'Matrix Payouts', count: contractState.transactions.filter(t => t.type.includes('PAYOUT') || t.type.includes('CYCLE')).length },
              { id: 'REBORN_GHOST', labelTh: 'Reborn / Ghost', labelEn: 'Reborn & Ghosts', count: contractState.transactions.filter(t => t.type === 'GHOST_SPAWN' || t.type === 'PROCESS_REBORN').length },
            ].map((chip) => {
              const active = txFilterType === chip.id;
              return (
                <button
                  key={chip.id}
                  onClick={() => setTxFilterType(chip.id as typeof txFilterType)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-sans transition flex items-center gap-1.5 ${
                    active
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-950/40 border border-sky-400/40'
                      : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-white'
                  }`}
                >
                  <span>{lang === 'th' ? chip.labelTh : chip.labelEn}</span>
                  {chip.count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                      active ? 'bg-sky-800 text-sky-200' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {chip.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={txSearchQuery}
              onChange={(e) => setTxSearchQuery(e.target.value)}
              placeholder={lang === 'th' ? 'ค้นหา รหัส, Wallet, TX...' : 'Search ID, Wallet, TX...'}
              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
            />
            {txSearchQuery && (
              <button
                onClick={() => setTxSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Responsive Table Container with Horizontal Scroll Protection */}
        <div className="overflow-x-auto custom-scrollbar rounded-2xl border border-slate-800/80 bg-slate-950/70 shadow-inner">
          <table className="w-full min-w-[780px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-300 uppercase tracking-wider font-black text-[11px]">
                <th className="py-3 px-4 whitespace-nowrap">{lang === 'th' ? 'ประเภทธุรกรรม' : 'Type'}</th>
                <th className="py-3 px-4 whitespace-nowrap">TX Hash</th>
                <th className="py-3 px-4 whitespace-nowrap">{lang === 'th' ? 'ผู้ทำรายการ / รหัส' : 'Participant & ID'}</th>
                <th className="py-3 px-4 whitespace-nowrap">{lang === 'th' ? 'จำนวนเงิน (USDT)' : 'Amount'}</th>
                <th className="py-3 px-4 whitespace-nowrap">{lang === 'th' ? 'รายละเอียด' : 'Details'}</th>
                <th className="py-3 px-4 whitespace-nowrap">{lang === 'th' ? 'เวลา' : 'Time'}</th>
                <th className="py-3 px-4 whitespace-nowrap">{lang === 'th' ? 'สถานะ' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {(() => {
                let list = contractState.transactions || [];
                if (txFilterType === 'REGISTER') {
                  list = list.filter(t => t.type === 'REGISTER');
                } else if (txFilterType === 'SPONSOR_BONUS') {
                  list = list.filter(t => t.type === 'SPONSOR_BONUS');
                } else if (txFilterType === 'MATRIX') {
                  list = list.filter(t => t.type.includes('PAYOUT') || t.type.includes('CYCLE'));
                } else if (txFilterType === 'REBORN_GHOST') {
                  list = list.filter(t => t.type === 'GHOST_SPAWN' || t.type === 'PROCESS_REBORN');
                }
                if (txSearchQuery.trim()) {
                  const q = txSearchQuery.trim().toLowerCase();
                  list = list.filter(t => 
                    String(t.userId).includes(q) ||
                    (t.txHash && t.txHash.toLowerCase().includes(q)) ||
                    (t.userAddress && t.userAddress.toLowerCase().includes(q)) ||
                    (t.details && t.details.toLowerCase().includes(q)) ||
                    (t.type && t.type.toLowerCase().includes(q))
                  );
                }

                if (list.length === 0) {
                  return (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-slate-400 font-sans">
                        <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-500" />
                        <p className="font-bold">{lang === 'th' ? 'ไม่พบรายการธุรกรรมที่ค้นหา' : 'No transactions found'}</p>
                        <button
                          onClick={() => {
                            setTxFilterType('ALL');
                            setTxSearchQuery('');
                          }}
                          className="mt-2 text-xs text-sky-400 hover:underline"
                        >
                          {lang === 'th' ? 'รีเซ็ตตัวกรอง' : 'Reset filters'}
                        </button>
                      </td>
                    </tr>
                  );
                }

                return list.slice(0, txLimit).map((tx) => {
                  const isRegister = tx.type === 'REGISTER';
                  const isBonus = tx.type === 'SPONSOR_BONUS';
                  const isGhost = tx.type === 'GHOST_SPAWN';
                  const isReborn = tx.type === 'PROCESS_REBORN';
                  const isRank1 = tx.type === 'RANK1_PAYOUT';
                  const isRank2 = tx.type === 'RANK2_PAYOUT' || tx.type === 'RANK2_CYCLE';
                  const isRank3 = tx.type === 'RANK3_PAYOUT' || tx.type === 'RANK3_CYCLE';
                  const isClaim = tx.type === 'CLAIM_REWARD';

                  // Format time cleanly
                  const txDate = new Date(tx.timestamp || 0);
                  const timeStr = tx.timestamp 
                    ? `${txDate.toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit' })}`
                    : (lang === 'th' ? 'เมื่อสักครู่' : 'Just now');

                  return (
                    <tr key={tx.id} className="hover:bg-slate-900/60 transition">
                      {/* Column 1: Type Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wide border ${
                          isRegister ? 'bg-sky-500/20 text-sky-300 border-sky-500/40' :
                          isBonus ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                          isRank1 ? 'bg-teal-500/20 text-teal-300 border-teal-500/40' :
                          isRank2 ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                          isRank3 ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' :
                          isGhost ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' :
                          isReborn ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
                          isClaim ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {isBonus && <Award className="w-3 h-3" />}
                          {isGhost && <Ghost className="w-3 h-3" />}
                          {isRegister && <UserPlus className="w-3 h-3" />}
                          {isReborn && <Sparkles className="w-3 h-3" />}
                          <span>
                            {isRegister ? (lang === 'th' ? 'REGISTER (สมัคร)' : 'REGISTER') :
                             isBonus ? (lang === 'th' ? 'DIRECT (แนะนำ 10%)' : 'DIRECT 10%') :
                             isRank1 ? (lang === 'th' ? 'RANK 1 (30%)' : 'RANK 1 (30%)') :
                             isRank2 ? (lang === 'th' ? 'RANK 2 (50%)' : 'RANK 2 (50%)') :
                             isRank3 ? (lang === 'th' ? 'RANK 3 (100%)' : 'RANK 3 (100%)') :
                             isGhost ? (lang === 'th' ? 'GHOST NODE' : 'GHOST NODE') :
                             isReborn ? (lang === 'th' ? 'REBORN (7 IDs)' : 'REBORN (7 IDs)') :
                             isClaim ? (lang === 'th' ? 'CLAIM REWARD' : 'CLAIM REWARD') :
                             tx.type}
                          </span>
                        </span>
                      </td>

                      {/* Column 2: TX Hash with Link & Copy */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`${BSC_CONFIG.blockExplorerUrls[0]}/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-sky-400 hover:text-sky-300 hover:border-sky-500/60 font-bold transition shadow-sm"
                            title={tx.txHash}
                          >
                            <span>{tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}</span>
                            <ExternalLink className="w-3 h-3 text-sky-400 shrink-0" />
                          </a>
                          <button
                            onClick={() => {
                              copyToClipboardSafe(tx.txHash);
                              showToast(lang === 'th' ? 'คัดลอก TX Hash แล้ว' : 'Copied TX Hash', tx.txHash, 'success');
                            }}
                            className="p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
                            title={lang === 'th' ? 'คัดลอก TX Hash' : 'Copy Hash'}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Column 3: Participant ID & Wallet */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            {isGhost ? (
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/25 border border-purple-500/40 text-purple-300 font-bold text-[11px]">
                                Ghost #{tx.userId}
                              </span>
                            ) : tx.userId ? (
                              <span className="px-2 py-0.5 rounded-md bg-sky-500/25 border border-sky-500/40 text-sky-200 font-bold text-[11px]">
                                ID #{tx.userId}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px]">
                                Smart Contract
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono" title={tx.userAddress}>
                            {tx.userAddress && tx.userAddress.length > 10
                              ? `${tx.userAddress.slice(0, 6)}...${tx.userAddress.slice(-4)}`
                              : (tx.userAddress || '0x0000...0000')}
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Amount USDT */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`font-mono font-black text-sm ${
                            isRegister ? 'text-sky-300' :
                            isBonus ? 'text-emerald-400 font-extrabold' :
                            isRank1 || isRank2 || isRank3 ? 'text-teal-300 font-extrabold' :
                            isClaim ? 'text-cyan-300' : 'text-slate-200'
                          }`}>
                            {isRegister ? '2.00 USDT' :
                             isBonus ? `+${tx.amountUSDT.toFixed(2)} USDT` :
                             isRank1 || isRank2 || isRank3 ? `+${tx.amountUSDT.toFixed(2)} USDT` :
                             isGhost ? '2.00 USDT' :
                             isReborn ? '7 Nodes' :
                             `${tx.amountUSDT.toFixed(2)} USDT`}
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans">
                            {isRegister ? (lang === 'th' ? 'ค่าแพ็กเกจแรกเข้า' : 'Entry Fee') :
                             isBonus ? (lang === 'th' ? 'โบนัสแนะนำตรง 10%' : '10% Direct Bonus') :
                             isRank1 ? (lang === 'th' ? 'ปันผลผัง Rank 1 (30%)' : 'Rank 1 Payout') :
                             isRank2 ? (lang === 'th' ? 'ปันผลผัง Rank 2 (50%)' : 'Rank 2 Payout') :
                             isRank3 ? (lang === 'th' ? 'ปันผลผัง Rank 3 (100%)' : 'Rank 3 Payout') :
                             isGhost ? (lang === 'th' ? 'ดึงจากกองทุน Reborn' : 'From Reborn Pool') :
                             isReborn ? (lang === 'th' ? 'ส่งเข้าระบบเกิดใหม่' : 'Reborn Cycle') :
                             (lang === 'th' ? 'สัญญาอัจฉริยะ' : 'Smart Contract')}
                          </span>
                        </div>
                      </td>

                      {/* Column 5: Details / Memo */}
                      <td className="py-3 px-4 text-slate-200 font-sans text-xs max-w-xs font-normal">
                        <p className="line-clamp-2 leading-relaxed">
                          {tx.details}
                        </p>
                      </td>

                      {/* Column 6: Time */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px] font-sans">
                        {timeStr}
                      </td>

                      {/* Column 7: Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold font-sans bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{lang === 'th' ? 'สำเร็จ' : 'Confirmed'}</span>
                        </span>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>

        {/* Footer / Load More Button */}
        {contractState.transactions.length > 8 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400 font-mono">
              {lang === 'th' ? 'แสดงรายการที่ 1 ถึง' : 'Showing 1 to'}{' '}
              <strong className="text-white">{Math.min(txLimit, contractState.transactions.length)}</strong>{' '}
              {lang === 'th' ? `จากทั้งหมด ${contractState.transactions.length} รายการ` : `of ${contractState.transactions.length} items`}
            </span>
            <div className="flex items-center gap-2">
              {txLimit < contractState.transactions.length ? (
                <button
                  onClick={() => setTxLimit(prev => Math.min(prev + 10, contractState.transactions.length))}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-sky-400 hover:text-sky-300 border border-slate-700 text-xs font-bold font-sans transition"
                >
                  {lang === 'th' ? 'ดูเพิ่มเติม (+10 รายการ)' : 'Show more (+10)'}
                </button>
              ) : (
                <button
                  onClick={() => setTxLimit(8)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 text-xs font-bold font-sans transition"
                >
                  {lang === 'th' ? 'ย่อรายการ' : 'Show less'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

