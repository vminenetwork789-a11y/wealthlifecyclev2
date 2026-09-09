'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../lib/wallet-context';
import { matrixContract } from '../lib/mock-contract';
import { MatrixUser, MatrixNodeView, GlobalQueueItemData } from '../lib/types';
import { fetchTeamTreeOnChain, fetchGlobalQueuePaginatedOnChain, fetchCurrentHeadOnChain, fetchUserFullDetailsOnChain } from '../lib/web3-service';
import { BSC_CONFIG } from '../lib/contracts-config';
import { 
  Users, 
  Ghost, 
  Plus, 
  Repeat, 
  Award, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Info, 
  ArrowDown, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2,
  Share2,
  X,
  RefreshCw,
  Search,
  Code2,
  ExternalLink,
  Layers,
  Cpu
} from 'lucide-react';

export const MatrixVisualizer: React.FC = () => {
  const { lang, t, currentUser, selectedUserId, walletIds, walletAllDataMap, contractState, lastUserId, isLiveWeb3, getIdTotalEarned, showToast } = useWallet();

  const [activeRankTab, setActiveRankTab] = useState<1 | 2 | 3>(1);
  const [customRootId, setCustomRootId] = useState<number | null>(null);
  const selectedRootId = customRootId ?? (selectedUserId || (walletIds.length > 0 ? walletIds[0] : (currentUser?.id || 1)));

  const [searchInputId, setSearchInputId] = useState<string>('');
  const [selectedNode, setSelectedNode] = useState<MatrixUser | MatrixNodeView | null>(null);
  const [selectedNodeEarned, setSelectedNodeEarned] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [lastQueryTime, setLastQueryTime] = useState<string>('');

  const selectedNodeId = selectedNode && selectedNode.id > 0 ? selectedNode.id : null;

  // Fetch idTotalEarned when selectedNode changes
  useEffect(() => {
    let isCancelled = false;
    if (selectedNodeId) {
      getIdTotalEarned(selectedNodeId).then((val) => {
        if (!isCancelled) {
          setSelectedNodeEarned(val);
        }
      });
    }

    return () => {
      isCancelled = true;
    };
  }, [selectedNodeId, getIdTotalEarned]);

  // Live on-chain fetched states
  const [liveTreeData, setLiveTreeData] = useState<{
    root: MatrixNodeView | MatrixUser | null;
    level1: (MatrixNodeView | MatrixUser | { id: number; isGhost: boolean; isSlotEmpty: true })[];
    level2: Record<number, (MatrixNodeView | MatrixUser | { id: number; isGhost: boolean; isSlotEmpty: true })[]>;
  } | null>(null);

  const [liveRank2Queue, setLiveRank2Queue] = useState<GlobalQueueItemData[]>([]);
  const [liveRank3Queue, setLiveRank3Queue] = useState<GlobalQueueItemData[]>([]);
  const [rank2CurrentHead, setRank2CurrentHead] = useState<number>(0);
  const [rank3CurrentHead, setRank3CurrentHead] = useState<number>(0);

  // Function to query getTeamTree(uint256 _rootId) or fallback to local engine
  const loadRank1Tree = useCallback(async (rootId: number) => {
    setIsQuerying(true);
    try {
      if (isLiveWeb3) {
        const onChainTree = await fetchTeamTreeOnChain(rootId);
        if (onChainTree && onChainTree.root) {
          setLiveTreeData({
            root: onChainTree.root,
            level1: onChainTree.level1,
            level2: onChainTree.level2
          });
          setLastQueryTime(new Date().toLocaleTimeString());
          setIsQuerying(false);
          return;
        }
      }

      // Local / Engine Simulation Mode
      const tree = matrixContract.getTeamTree(rootId);
      if (tree) {
        setLiveTreeData({
          root: tree.root,
          level1: tree.level1,
          level2: tree.level2
        });
      } else {
        setLiveTreeData(null);
      }
    } catch (err) {
      console.warn('Error loading team tree:', err);
      const tree = matrixContract.getTeamTree(rootId);
      if (tree) {
        setLiveTreeData({
          root: tree.root,
          level1: tree.level1,
          level2: tree.level2
        });
      }
    } finally {
      setIsQuerying(false);
      setLastQueryTime(new Date().toLocaleTimeString());
    }
  }, [isLiveWeb3]);

  // Function to query getGlobalQueuePaginated(rank, currentHeads(rank), 5) for Rank 2 & 3
  const loadGlobalQueues = useCallback(async (rank: 2 | 3) => {
    setIsQuerying(true);
    try {
      if (isLiveWeb3) {
        // Step 1: Query currentHeads(rank)
        const head = await fetchCurrentHeadOnChain(rank);
        if (rank === 2) setRank2CurrentHead(head);
        else setRank3CurrentHead(head);

        // Step 2: Query getGlobalQueuePaginated(rank, currentHeads(rank), 5)
        const result = await fetchGlobalQueuePaginatedOnChain(rank, head, 5);
        if (result && result.items && result.items.length > 0) {
          if (rank === 2) {
            setLiveRank2Queue(result.items);
            setRank2CurrentHead(result.currentHead);
          } else {
            setLiveRank3Queue(result.items);
            setRank3CurrentHead(result.currentHead);
          }
          setIsQuerying(false);
          setLastQueryTime(new Date().toLocaleTimeString());
          return;
        }
      }

      // Local / Engine Simulation Mode: query getGlobalQueuePaginated(rank, currentHeads(rank), 5)
      const head = matrixContract.currentHeads(rank);
      if (rank === 2) setRank2CurrentHead(head);
      else setRank3CurrentHead(head);

      const queueItems = matrixContract.getGlobalQueuePaginatedData(rank, head, 5);

      if (rank === 2) setLiveRank2Queue(queueItems);
      else setLiveRank3Queue(queueItems);
    } catch (err) {
      console.warn('Error loading global queue:', err);
    } finally {
      setIsQuerying(false);
      setLastQueryTime(new Date().toLocaleTimeString());
    }
  }, [isLiveWeb3]);

  // Auto load when tab or selectedRootId changes
  useEffect(() => {
    let isCancelled = false;

    const executeLoad = async () => {
      setIsQuerying(true);
      try {
        if (activeRankTab === 1) {
          if (isLiveWeb3) {
            const onChainTree = await fetchTeamTreeOnChain(selectedRootId);
            if (!isCancelled && onChainTree && onChainTree.root) {
              setLiveTreeData({
                root: onChainTree.root,
                level1: onChainTree.level1,
                level2: onChainTree.level2
              });
              setLastQueryTime(new Date().toLocaleTimeString());
              setIsQuerying(false);
              return;
            }
          }

          const tree = matrixContract.getTeamTree(selectedRootId);
          if (!isCancelled) {
            if (tree) {
              setLiveTreeData({
                root: tree.root,
                level1: tree.level1,
                level2: tree.level2
              });
            } else {
              setLiveTreeData(null);
            }
          }
        } else {
          const rank = activeRankTab;
          if (isLiveWeb3) {
            const head = await fetchCurrentHeadOnChain(rank);
            const result = await fetchGlobalQueuePaginatedOnChain(rank, head, 5);
            if (!isCancelled) {
              if (rank === 2) {
                setLiveRank2Queue(result.items);
                setRank2CurrentHead(result.currentHead);
              } else {
                setLiveRank3Queue(result.items);
                setRank3CurrentHead(result.currentHead);
              }
              setLastQueryTime(new Date().toLocaleTimeString());
              setIsQuerying(false);
              return;
            }
          }

          const head = matrixContract.currentHeads(rank);
          const queueItems = matrixContract.getGlobalQueuePaginatedData(rank, head, 5);

          if (!isCancelled) {
            if (rank === 2) {
              setLiveRank2Queue(queueItems);
              setRank2CurrentHead(head);
            } else {
              setLiveRank3Queue(queueItems);
              setRank3CurrentHead(head);
            }
          }
        }
      } catch (err) {
        console.warn('Error loading rank data:', err);
      } finally {
        if (!isCancelled) {
          setIsQuerying(false);
          setLastQueryTime(new Date().toLocaleTimeString());
        }
      }
    };

    executeLoad();

    return () => {
      isCancelled = true;
    };
  }, [activeRankTab, selectedRootId, isLiveWeb3, contractState.rank2Queue, contractState.rank3Queue]);

  const handleNodeClick = async (node: MatrixUser | MatrixNodeView | { id: number; isGhost: boolean; isSlotEmpty?: boolean }) => {
    if ('isSlotEmpty' in node && node.isSlotEmpty) {
      showToast(
        lang === 'th' ? 'สล็อตว่าง' : 'Empty Slot',
        lang === 'th' ? 'แชร์ลิงก์ของคุณเพื่อเชิญสมาชิกใหม่มาเติมตำแหน่งนี้ หรือรอ Spillover' : 'Share your invite link to fill this matrix slot',
        'info'
      );
      return;
    }

    const fullUser = matrixContract.getUser(node.id);
    if (fullUser) {
      setSelectedNode(fullUser);
    } else if ('wallet' in node) {
      setSelectedNode(node as MatrixNodeView);
    } else {
      setSelectedNode({
        id: node.id,
        address: '0x0000000000000000000000000000000000000000',
        sponsorId: 1,
        isGhost: Boolean(node.isGhost),
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
      });
    }

    // Query on-chain user details and idTotalEarned directly
    if (isLiveWeb3 && node.id > 0) {
      try {
        const [onChainDetails, earned] = await Promise.all([
          fetchUserFullDetailsOnChain(node.id),
          getIdTotalEarned(node.id)
        ]);
        setSelectedNodeEarned(earned);
        if (onChainDetails) {
          setSelectedNode(prev => prev ? ({
            ...prev,
            id: onChainDetails.id,
            address: onChainDetails.wallet,
            sponsorId: onChainDetails.sponsorId,
            isGhost: onChainDetails.isGhost,
            totalEarnedUSDT: onChainDetails.totalEarnedUSDT || earned,
          } as MatrixUser) : null);
        }
      } catch {
        // Fallback
      }
    }
  };

  const handleSearchRoot = (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = parseInt(searchInputId.trim(), 10);
    if (!isNaN(idNum) && idNum > 0) {
      setCustomRootId(idNum);
      showToast(
        lang === 'th' ? '🔍 ค้นหาผังสำเร็จ' : '🔍 Root Switched',
        `getTeamTree(${idNum})`,
        'info'
      );
      setSearchInputId('');
    }
  };

  const resetToMe = () => {
    setCustomRootId(null);
    const targetId = selectedUserId || (walletIds.length > 0 ? walletIds[0] : (currentUser?.id || 1));
    setZoomLevel(1);
    showToast(
      lang === 'th' ? `กลับสู่รหัส ID #${targetId}` : `Reset to My Node #${targetId}`,
      `getTeamTree(${targetId})`,
      'info'
    );
  };

  const handleRefresh = () => {
    if (activeRankTab === 1) {
      loadRank1Tree(selectedRootId);
    } else {
      loadGlobalQueues(activeRankTab);
    }
    showToast(
      lang === 'th' ? '🔄 รีเฟรชข้อมูลสำเร็จ' : '🔄 Data Refreshed',
      activeRankTab === 1 
        ? `getTeamTree(${selectedRootId})` 
        : activeRankTab === 2 
        ? `getGlobalQueuePaginated(2, currentHeads(2) [#${rank2CurrentHead}], 5)`
        : `getGlobalQueuePaginated(3, currentHeads(3) [#${rank3CurrentHead}], 5)`,
      'reward'
    );
  };

  return (
    <div className="matrix-visualizer w-full h-full space-y-4 sm:space-y-6 pb-12">
      
      {/* Header & Rank Switcher */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md shadow-lg">
        <div className="w-full md:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-2 mb-1">
            <h1 className="text-base sm:text-lg md:text-xl font-extrabold text-white tracking-tight">
              {t.matrixPageTitle}
            </h1>
            <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/30 text-sky-200 border border-sky-400/50 text-xs sm:text-sm font-mono font-black whitespace-nowrap shrink-0">
              lastUserId: #{lastUserId}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 font-medium">
            {t.matrixPageSub}
          </p>
        </div>

        {/* Tab Buttons (100% width on mobile, 3-column grid) */}
        <div className="w-full md:w-auto grid grid-cols-3 sm:flex items-center gap-1 sm:gap-2 bg-slate-950 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-slate-700 shadow-xl">
          <button
            id="tab_rank_1"
            onClick={() => setActiveRankTab(1)}
            className={`px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black transition-all active:scale-95 flex items-center justify-center gap-1 sm:gap-1.5 ${
              activeRankTab === 1 
                ? 'bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-slate-950 shadow-md shadow-sky-500/30 border border-cyan-200' 
                : 'text-sky-200 hover:text-white hover:bg-sky-500/20 border border-transparent'
            }`}
          >
            <Users className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeRankTab === 1 ? 'text-slate-950 stroke-[2.5]' : 'text-sky-300'}`} />
            <span className="whitespace-nowrap">
              Rank 1<span className="hidden sm:inline text-xs font-bold opacity-90"> (Tree)</span>
            </span>
          </button>

          <button
            id="tab_rank_2"
            onClick={() => setActiveRankTab(2)}
            className={`px-1.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black transition-all active:scale-95 flex items-center justify-center gap-1 sm:gap-1.5 ${
              activeRankTab === 2 
                ? 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-indigo-500 text-white shadow-md shadow-purple-500/30 border border-purple-200' 
                : 'text-purple-200 hover:text-white hover:bg-purple-500/20 border border-transparent'
            }`}
          >
            <Repeat className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeRankTab === 2 ? 'text-white stroke-[2.5]' : 'text-purple-300'}`} />
            <span className="whitespace-nowrap">
              Rank 2<span className="hidden sm:inline text-xs font-bold opacity-90"> (Queue)</span>
            </span>
          </button>

          <button
            id="tab_rank_3"
            onClick={() => setActiveRankTab(3)}
            className={`px-1.5 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-black transition-all active:scale-95 flex items-center justify-center gap-1 sm:gap-1.5 ${
              activeRankTab === 3 
                ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400 text-slate-950 shadow-md shadow-amber-500/30 border border-yellow-200' 
                : 'text-amber-200 hover:text-white hover:bg-amber-500/20 border border-transparent'
            }`}
          >
            <Award className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeRankTab === 3 ? 'text-slate-950 stroke-[2.5]' : 'text-amber-300'}`} />
            <span className="whitespace-nowrap">
              Rank 3<span className="hidden sm:inline text-xs font-bold opacity-90"> (Apex)</span>
            </span>
          </button>
        </div>
      </div>

      {/* Smart Contract Function Call Status Banner */}
      <div className="w-full p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-sky-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500/20 border border-sky-400/50 flex items-center justify-center text-sky-300 shrink-0 mt-0.5 sm:mt-0 shadow-sm">
            <Code2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-mono font-bold text-sky-200 break-all">
                {activeRankTab === 1 
                  ? `getTeamTree(${selectedRootId})`
                  : activeRankTab === 2
                  ? `getGlobalQueuePaginated(2, currentHeads(2) [#${rank2CurrentHead}], 5)`
                  : `getGlobalQueuePaginated(3, currentHeads(3) [#${rank3CurrentHead}], 5)`
                }
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 text-[9px] sm:text-[10px] font-mono font-black whitespace-nowrap">
                view returns
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-100 font-medium mt-1">
              {activeRankTab === 1 
                ? (lang === 'th' ? 'โครงสร้างผังทีม recursive (MatrixNodeView[] memory)' : 'Fetches recursive team matrix structure')
                : activeRankTab === 2
                ? (lang === 'th' ? `คิวสากลแบบแบ่งหน้า Rank 2 เริ่มต้นจาก Head #${rank2CurrentHead} จำนวน 5 รายการ` : `Paginated Rank 2 Global FIFO queue starting at Head #${rank2CurrentHead} (limit: 5)`)
                : (lang === 'th' ? `กระดานทองคำ Rank 3 เริ่มต้นจาก Head #${rank3CurrentHead} จำนวน 5 รายการ` : `Paginated Rank 3 Apex Gold Queue starting at Head #${rank3CurrentHead} (limit: 5)`)
              }
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 pt-1.5 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          {lastQueryTime && (
            <span className="text-xs font-mono font-semibold text-slate-200 whitespace-nowrap">
              Synced: {lastQueryTime}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isQuerying}
            className="px-3 py-2 rounded-xl bg-sky-500/25 hover:bg-sky-500/35 border border-sky-400/60 text-sky-100 text-xs sm:text-sm font-bold flex items-center gap-1.5 transition disabled:opacity-50 active:scale-95 whitespace-nowrap shadow-sm"
            title="Query Smart Contract"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isQuerying ? 'animate-spin' : ''}`} />
            <span>{isQuerying ? (lang === 'th' ? 'กำลังเรียก...' : 'Calling...') : (lang === 'th' ? 'เรียกฟังก์ชัน' : 'Call Function')}</span>
          </button>
        </div>
      </div>

      {/* Legend & Controls Bar */}
      <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[10px] sm:text-xs shadow-sm">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-500 border border-sky-300" />
            <span className="text-slate-200 font-semibold">{t.legendReal}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-sky-400/90 border border-sky-300 shadow-sm shadow-sky-400/50" />
            <span className="text-sky-200 font-bold">{t.legendGhost}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border border-dashed border-slate-400" />
            <span className="text-slate-300 font-semibold">{t.legendEmpty}</span>
          </div>
        </div>

        <div className="w-full sm:w-auto flex flex-wrap items-center justify-between sm:justify-end gap-1.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          {/* Search Node ID */}
          <form onSubmit={handleSearchRoot} className="flex items-center gap-1">
            <input
              type="number"
              min="1"
              placeholder={lang === 'th' ? 'ระบุ ID (เช่น 1)' : 'Root ID (1)'}
              value={searchInputId}
              onChange={(e) => setSearchInputId(e.target.value)}
              className="w-24 sm:w-28 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-[10px] sm:text-[11px] font-mono font-medium focus:outline-none focus:border-sky-500"
            />
            <button
              type="submit"
              className="p-1 sm:p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 transition"
              title="Search Node ID"
            >
              <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </form>

          <div className="hidden sm:block h-3.5 w-px bg-slate-800 mx-0.5" />

          <div className="flex items-center gap-1">
            <button
              onClick={() => setZoomLevel(Math.max(0.7, zoomLevel - 0.1))}
              className="p-1 sm:p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="font-mono text-[10px] font-bold text-slate-200 w-8 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(1.4, zoomLevel + 0.1))}
              className="p-1 sm:p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={resetToMe}
            className="px-2 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 font-bold text-[10px] flex items-center gap-1 transition"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>{lang === 'th' ? 'รหัสฉัน' : 'Mine'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RANK 1: getTeamTree(uint256 _rootId) (1 -> 4 -> 16 RECURSIVE NODE VIEW) */}
      {/* ========================================================================= */}
      {activeRankTab === 1 && (
        <div className="w-full h-full min-h-[440px] p-3 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 overflow-x-auto overflow-y-auto flex flex-col items-center justify-start relative">
          
          {liveTreeData && liveTreeData.root ? (
            <div 
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
              className="transition-transform duration-200 flex flex-col items-center gap-6 sm:gap-8 py-2 w-full max-w-5xl"
            >
              
              {/* ROOT NODE (LEVEL 0) */}
              <div className="flex flex-col items-center w-full max-w-sm sm:max-w-md">
                <div 
                  onClick={() => handleNodeClick(liveTreeData.root!)}
                  className={`w-full cursor-pointer p-3.5 sm:p-4 rounded-xl border-2 transition-all hover:scale-102 shadow-lg ${
                    liveTreeData.root.isGhost 
                      ? 'bg-sky-950/80 border-sky-400 text-sky-100 shadow-sky-500/30 ring-1 ring-sky-400/50' 
                      : 'bg-gradient-to-b from-sky-900/70 to-slate-900 border-sky-400 text-white shadow-sky-500/25'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {liveTreeData.root.isGhost ? (
                      <div className="w-7 h-7 rounded-full bg-sky-500/30 border border-sky-400 text-sky-200 flex items-center justify-center font-black text-xs">
                        #0
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center font-black text-xs shadow-sm">
                        #{liveTreeData.root.id}
                      </div>
                    )}
                    <div>
                      <p className="font-extrabold text-sm sm:text-base flex items-center gap-1.5 text-white">
                        {liveTreeData.root.isGhost ? `Ghost #0` : `Member #${liveTreeData.root.id}`}
                        <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-sky-500/30 text-sky-100 font-mono font-bold border border-sky-400/40">
                          Rank 1 Root
                        </span>
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-200 font-mono font-medium">
                        {('address' in liveTreeData.root ? liveTreeData.root.address : (liveTreeData.root as MatrixNodeView).wallet).slice(0, 12)}...
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700 flex items-center justify-between gap-2 text-[10px] sm:text-xs font-mono">
                    <span className="text-emerald-300 font-black">
                      {'totalEarnedUSDT' in liveTreeData.root 
                        ? `$${liveTreeData.root.totalEarnedUSDT.toFixed(1)} USDT`
                        : `Downlines: ${(liveTreeData.root as MatrixNodeView).downlineCount}`
                      }
                    </span>
                    <span className="text-sky-200 font-bold">
                      {'rank1Slots' in liveTreeData.root 
                        ? `${liveTreeData.root.rank1Slots.length}/4 Slots`
                        : `Sponsor #${(liveTreeData.root as MatrixNodeView).sponsorId}`
                      }
                    </span>
                  </div>
                </div>

                {/* Tree Branch Line */}
                <div className="w-0.5 h-6 bg-sky-500/50 my-0.5" />
                <div className="w-[85%] max-w-xl h-0.5 bg-sky-500/40" />
              </div>

              {/* LEVEL 1: 4 DIRECT SLOTS */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-4 w-full">
                {liveTreeData.level1.map((node, idx) => {
                  const isEmpty = 'isSlotEmpty' in node && node.isSlotEmpty;
                  const isGhost = node.isGhost;
                  const isMatrixNodeView = 'wallet' in node;
                  const user = !isEmpty ? (node as MatrixUser | MatrixNodeView) : null;
                  const walletAddr = user ? ('address' in user ? user.address : (user as MatrixNodeView).wallet) : '';

                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <div className="w-0.5 h-3 bg-sky-500/40 mb-1" />

                      <div
                        onClick={() => handleNodeClick(node)}
                        className={`w-full p-2 sm:p-3 rounded-xl border transition-all cursor-pointer text-center ${
                          isEmpty
                            ? 'bg-slate-950/70 border-dashed border-slate-700 hover:border-sky-500/60 text-slate-400 hover:text-slate-200'
                            : isGhost
                            ? 'bg-sky-950/70 border-sky-400 text-sky-100 shadow-sm shadow-sky-500/20 hover:scale-102 ring-1 ring-sky-400/40'
                            : 'bg-slate-900 border-sky-500/60 text-white shadow-sm shadow-sky-500/15 hover:scale-102'
                        }`}
                      >
                        {isEmpty ? (
                          <div className="py-1.5 sm:py-2">
                            <Plus className="w-3.5 h-3.5 mx-auto mb-0.5 text-slate-400" />
                            <span className="text-[10px] sm:text-[11px] font-bold block text-slate-200">Slot {idx + 1}</span>
                            <span className="text-[9px] text-slate-400">Available</span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-center gap-1 mb-0.5">
                              {isGhost ? (
                                <span className="w-4 h-4 rounded-full bg-sky-500/30 text-sky-200 flex items-center justify-center text-[9px] font-bold shrink-0">
                                  #0
                                </span>
                              ) : (
                                <span className="w-4 h-4 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-[9px] font-black shrink-0">
                                  #{user?.id}
                                </span>
                              )}
                              <span className="font-extrabold text-[10px] sm:text-xs truncate text-white">
                                {isGhost ? `G#0` : `#${user?.id}`}
                              </span>
                            </div>
                            <p className="text-[9px] text-slate-300 font-mono truncate hidden sm:block">
                              {walletAddr.slice(0, 8)}...
                            </p>
                            <div className="mt-1 pt-0.5 border-t border-slate-700 text-[9px] sm:text-[10px] text-emerald-300 font-mono font-black">
                              {user && 'totalEarnedUSDT' in user 
                                ? `$${(user as MatrixUser).totalEarnedUSDT.toFixed(1)}`
                                : isGhost ? `Ghost Reborn` : `Placed`
                              }
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sub Tree Branch Line */}
                      <div className="w-0.5 h-3 bg-slate-700 my-0.5" />
                    </div>
                  );
                })}
              </div>

              {/* LEVEL 2: 16 SUB-SLOTS VISUALIZER (COMPACT MATRIX) */}
              <div className="w-full pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-200 uppercase tracking-wider">
                    {t.subTeam} (Level 2)
                  </span>
                  <span className="text-xs text-sky-300 font-mono font-bold">16 Sub-Slots</span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 sm:gap-3 w-full">
                  {liveTreeData.level1.map((parentNode, pIdx) => {
                    const parentId = parentNode.id;
                    const children = liveTreeData.level2[parentId] || [];

                    return (
                      <div key={pIdx} className="p-1.5 sm:p-2 rounded-xl bg-slate-950/80 border border-slate-700">
                        <div className="text-[9px] sm:text-[10px] font-bold text-slate-200 mb-1 text-center truncate">
                          {('isSlotEmpty' in parentNode && parentNode.isSlotEmpty)
                            ? `Slot ${pIdx + 1}`
                            : `Branch #${parentId}`}
                        </div>

                        <div className="grid grid-cols-2 gap-1">
                          {children.length > 0 ? (
                            children.map((subNode, sIdx) => {
                              const isSubEmpty = 'isSlotEmpty' in subNode && subNode.isSlotEmpty;
                              const isSubGhost = subNode.isGhost;
                              const subUser = !isSubEmpty ? (subNode as MatrixUser | MatrixNodeView) : null;

                              return (
                                <div
                                  key={sIdx}
                                  onClick={() => handleNodeClick(subNode)}
                                  className={`p-1 rounded-lg border text-center cursor-pointer transition ${
                                    isSubEmpty
                                      ? 'border-dashed border-slate-700 text-slate-500 hover:border-slate-500'
                                      : isSubGhost
                                      ? 'bg-sky-950/70 border-sky-400 text-sky-100 ring-1 ring-sky-400/30'
                                      : 'bg-slate-900 border-sky-500/40 text-white font-bold'
                                  }`}
                                >
                                  {isSubEmpty ? (
                                    <span className="text-[9px] text-slate-400 font-bold">+</span>
                                  ) : (
                                    <div className="text-[9px] font-mono font-extrabold truncate text-white">
                                      {isSubGhost ? `👻#0` : `#${subUser?.id}`}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <div className="col-span-2 text-center text-[8px] text-slate-600 py-0.5">
                              -
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 text-xs">
              Tree data not available for ID #{selectedRootId}.
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* RANK 2: 1x4 MATRIX TREE BOARD + GLOBAL FIFO QUEUE CONVEYER */}
      {/* ========================================================================= */}
      {activeRankTab === 2 && (() => {
        const itemData = walletAllDataMap[selectedRootId];
        const userObj = matrixContract.getUser(selectedRootId);
        const queueItem = (liveRank2Queue.length > 0 ? liveRank2Queue : contractState.rank2Queue).find(q => q.userId === selectedRootId);
        
        const slotsFilled = queueItem?.slotsFilled ?? itemData?.rank2Downlines?.length ?? userObj?.rank2SlotsFilled ?? 0;
        const downlineIds = itemData?.rank2Downlines || [];
        const isGhost = Boolean(queueItem?.isGhost ?? userObj?.isGhost);
        const wallet = queueItem ? ('walletAddress' in queueItem ? queueItem.walletAddress : queueItem.address) : (userObj?.address || currentUser?.address || '0x...');

        const r2Slots = [1, 2, 3, 4].map((slotNumber, idx) => {
          const downlineId = downlineIds[idx] || (slotsFilled >= slotNumber ? (queueItem?.userId ? selectedRootId + slotNumber : (130 + slotNumber)) : null);
          const isFilled = slotsFilled >= slotNumber || Boolean(downlineId);
          const downlineUser = downlineId ? matrixContract.getUser(downlineId) : null;
          const isSlotGhost = Boolean(downlineUser?.isGhost || (downlineId && downlineId > 500 && downlineId % 2 === 0));

          return {
            slotNumber,
            isFilled,
            downlineId: isSlotGhost ? 0 : downlineId,
            isGhost: isSlotGhost,
            title: slotNumber <= 2 ? (lang === 'th' ? 'สล็อต 50% กระเป๋าตรง' : '50% Direct P2P') : slotNumber === 3 ? (lang === 'th' ? 'สล็อตเสกบอทผี' : 'Spawn 1 Ghost') : (lang === 'th' ? 'สล็อตเลื่อนสู่ Rank 3' : 'Advance to Rank 3'),
            reward: slotNumber <= 2 ? '+$2.00 USDT' : slotNumber === 3 ? '1 Ghost R2' : 'Apex Gold 👑',
          };
        });

        return (
          <div className="w-full space-y-4">
            
            {/* Rank 2 Visual Matrix Board Tree (1x4) */}
            <div className="w-full p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-purple-500/40 shadow-xl overflow-x-auto flex flex-col items-center">
              <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-slate-700/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/25 border border-purple-400/50 text-purple-200 flex items-center justify-center font-bold text-base shadow-sm">
                    🥈
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-black text-white">
                        {lang === 'th' ? 'ผังเมทริกซ์ 1x4 ประจำ Rank 2 (Silver)' : 'Rank 2 Silver Matrix Board (1x4)'}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-100 border border-purple-400/50 text-xs font-mono font-black">
                        ID #{selectedRootId}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-100 font-medium mt-0.5">
                      {lang === 'th' ? 'รับเงินเข้ากระเป๋า 2 สล็อตแรก (4 USDT) + สล็อต 3 เสกผี 1 ตัว + สล็อต 4 ยกระดับสู่ Rank 3' : '1x4 Matrix: 2 slots pay 4 USDT + 1 Ghost pushed + 1 Upgrade to Rank 3'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-purple-500/40 text-right shadow-sm">
                    <span className="text-[10px] sm:text-xs text-slate-200 font-semibold block">{lang === 'th' ? 'สล็อตบรรจุ' : 'Slots Filled'}</span>
                    <span className="text-sm sm:text-base font-mono font-black text-purple-200">{slotsFilled} / 4</span>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-emerald-500/40 text-right shadow-sm">
                    <span className="text-[10px] sm:text-xs text-slate-200 font-semibold block">{lang === 'th' ? 'รายได้รอบนี้' : 'Cycle Earned'}</span>
                    <span className="text-sm sm:text-base font-mono font-black text-emerald-300">+{(slotsFilled >= 2 ? 4.0 : slotsFilled * 2.0).toFixed(2)} USDT</span>
                  </div>
                </div>
              </div>

              {/* Visual Interactive Tree Graphic */}
              <div 
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                className="transition-transform duration-200 flex flex-col items-center gap-4 sm:gap-6 py-2 w-full max-w-4xl"
              >
                {/* ROOT NODE */}
                <div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm">
                  <div 
                    onClick={() => handleNodeClick({ id: selectedRootId, isGhost, address: wallet } as unknown as MatrixUser)}
                    className={`w-full cursor-pointer p-3.5 sm:p-4 rounded-2xl border-2 transition-all hover:scale-102 shadow-xl ${
                      isGhost
                        ? 'bg-purple-950/80 border-purple-400 text-purple-100 shadow-purple-500/30 ring-1 ring-purple-400/50'
                        : 'bg-gradient-to-b from-purple-900/60 via-slate-900 to-slate-950 border-purple-400 text-white shadow-purple-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        {isGhost ? (
                          <div className="w-8 h-8 rounded-xl bg-purple-500/30 border border-purple-400 text-purple-200 flex items-center justify-center font-black text-xs">
                            #0
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-purple-500 text-white flex items-center justify-center font-black text-xs shadow-sm">
                            #{selectedRootId}
                          </div>
                        )}
                        <div>
                          <p className="font-extrabold text-sm sm:text-base text-white flex items-center gap-1.5">
                            {isGhost ? `Ghost #0` : `Member #${selectedRootId}`}
                            <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-100 font-mono font-bold border border-purple-400/50">
                              Rank 2 Head
                            </span>
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-200 font-mono font-medium truncate max-w-[170px]">{wallet}</p>
                        </div>
                      </div>

                      <span className="text-xs sm:text-sm font-mono font-black text-emerald-300">
                        +{(slotsFilled >= 2 ? 4.0 : slotsFilled * 2.0).toFixed(2)} USDT
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between text-[10px] sm:text-xs font-mono">
                      <span className="text-slate-200 font-bold">Progress:</span>
                      <span className="text-purple-200 font-black">{slotsFilled}/4 Slots ({Math.round((slotsFilled / 4) * 100)}%)</span>
                    </div>
                  </div>

                  {/* Branch Line */}
                  <div className="w-0.5 h-6 bg-purple-500/60 my-0.5" />
                  <div className="w-[85%] max-w-md h-0.5 bg-purple-500/50" />
                </div>

                {/* 4 DOWNLINE MATRIX SLOTS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full">
                  {r2Slots.map((slot, sIdx) => {
                    return (
                      <div key={sIdx} className="flex flex-col items-center">
                        <div className="w-0.5 h-3 bg-purple-500/50 mb-1" />

                        <div 
                          onClick={() => {
                            if (slot.isFilled && slot.downlineId) {
                              handleNodeClick({ id: slot.downlineId, isGhost: slot.isGhost, address: wallet } as unknown as MatrixUser);
                            } else {
                              showToast(
                                lang === 'th' ? `สล็อตที่ ${slot.slotNumber} (ว่าง)` : `Slot ${slot.slotNumber} (Empty)`,
                                slot.title,
                                'info'
                              );
                            }
                          }}
                          className={`w-full p-3.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                            slot.isFilled
                              ? slot.isGhost
                                ? 'bg-purple-950/80 border-purple-400 text-purple-100 shadow-md shadow-purple-500/20 hover:scale-102 ring-1 ring-purple-400/50'
                                : 'bg-slate-900/95 border-purple-400 text-white shadow-md shadow-purple-500/20 hover:scale-102'
                              : 'bg-slate-950/70 border-dashed border-slate-700 text-slate-400 hover:border-purple-400/60 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-slate-200 mb-1.5">
                            <span>Slot {slot.slotNumber}</span>
                            <span className="text-emerald-300 font-mono font-black">{slot.reward}</span>
                          </div>

                          {slot.isFilled ? (
                            <div className="py-1">
                              <div className="flex items-center justify-center gap-1.5 mb-1">
                                {slot.isGhost ? (
                                  <span className="w-5 h-5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/50 flex items-center justify-center text-[10px] font-bold">
                                    #0
                                  </span>
                                ) : (
                                  <span className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                                    #{slot.downlineId}
                                  </span>
                                )}
                                <span className="font-extrabold text-xs sm:text-sm text-white">
                                  {slot.isGhost ? 'ID #0' : `ID #${slot.downlineId}`}
                                </span>
                              </div>
                              <span className="text-[10px] sm:text-[11px] text-purple-200 block font-bold truncate">{slot.title}</span>
                            </div>
                          ) : (
                            <div className="py-2">
                              <Plus className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                              <span className="text-[10px] sm:text-xs font-bold text-slate-200 block">{lang === 'th' ? 'รอคิวโลกเติม' : 'Waiting Queue'}</span>
                              <span className="text-[9px] text-slate-400">{slot.title}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rank 2 Global FIFO Queue Details */}
            <div className="w-full p-4 sm:p-6 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-100 border border-slate-600 text-xs font-bold inline-block font-mono">
                      getGlobalQueuePaginated(2, currentHeads(2), 5)
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/25 text-sky-200 border border-sky-400/50 text-xs font-bold inline-block font-mono">
                      currentHeads(2) = #{rank2CurrentHead}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-white">
                    {t.rank2Title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-100 font-medium mt-1 max-w-xl">
                    {t.rank2Desc}
                  </p>
                </div>

                <div className="text-right p-3.5 rounded-xl bg-slate-950 border border-slate-700/80 shrink-0 shadow-sm">
                  <span className="text-xs text-slate-200 font-semibold block">{lang === 'th' ? 'จำนวนในคิวที่แสดง (สูงสุด 5)' : 'Displaying Queue Nodes'}</span>
                  <span className="text-2xl font-black text-white font-mono">{liveRank2Queue.length || contractState.rank2Queue.length} / 5</span>
                  <span className="text-xs text-emerald-300 font-bold block mt-0.5">+4.00 USDT (50% x 2) / Cycle</span>
                </div>
              </div>

              {/* Queue Conveyer Belt Visualization */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-slate-200 uppercase tracking-wider block">
                    {t.waitingQueueList} (Rank 2 Head: #{rank2CurrentHead})
                  </span>
                  <span className="text-xs font-mono font-bold text-sky-200">
                    Calling: getGlobalQueuePaginated(2, {rank2CurrentHead}, 5)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(liveRank2Queue.length > 0 ? liveRank2Queue : contractState.rank2Queue).map((item, idx) => {
                    const isMe = (currentUser?.id === item.userId) || (selectedRootId === item.userId);
                    const walletStr = 'walletAddress' in item ? item.walletAddress : (item as { address: string }).address;
                    const slots = item.slotsFilled;

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setCustomRootId(item.userId);
                          showToast(
                            lang === 'th' ? `เลือกดูผังบอร์ด ID #${item.userId}` : `Selected Matrix ID #${item.userId}`,
                            `Rank 2 Matrix Board #${item.userId}`,
                            'info'
                          );
                        }}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                          item.userId === selectedRootId
                            ? 'bg-purple-950/80 border-purple-400 ring-2 ring-purple-400/50 shadow-lg shadow-purple-500/25'
                            : idx === 0
                            ? 'bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border-slate-400 shadow-md'
                            : isMe
                            ? 'bg-sky-950/60 border-sky-400 shadow-sm shadow-sky-500/25'
                            : 'bg-slate-950 border-slate-700/80 hover:border-purple-400/60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                              idx === 0 ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-800 text-slate-100'
                            }`}>
                              #{item.queueIndex !== undefined ? item.queueIndex + 1 : idx + 1}
                            </span>
                            <div>
                              <p className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                                {item.isGhost ? (
                                  <span className="text-purple-200 flex items-center gap-1">
                                    <Ghost className="w-3.5 h-3.5 text-purple-300" /> Ghost #0
                                  </span>
                                ) : (
                                  <span>Member #{item.userId}</span>
                                )}
                                {item.userId === selectedRootId && (
                                  <span className="px-1.5 py-0.2 rounded bg-purple-500 text-white text-[9px] font-black">
                                    BOARD
                                  </span>
                                )}
                              </p>
                              <p className="text-[10px] sm:text-xs text-slate-200 font-mono font-medium truncate max-w-[140px]">
                                {walletStr}
                              </p>
                            </div>
                          </div>

                          <span className="text-xs sm:text-sm font-black text-emerald-300 font-mono">
                            +$4.00 USDT
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between text-xs text-slate-200 mb-1 font-mono">
                            <span className="font-bold text-slate-200">{lang === 'th' ? 'บรรจุสล็อต' : 'Slots Filled'}</span>
                            <span className="font-black text-white">{slots}/4 Slots</span>
                          </div>
                          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                            <div
                              style={{ width: `${(slots / 4) * 100}%` }}
                              className={`h-full transition-all duration-500 ${
                                idx === 0 ? 'bg-purple-400' : 'bg-purple-500'
                              }`}
                            />
                          </div>
                        </div>

                        {idx === 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-700/80 flex items-center justify-between text-[10px] sm:text-[11px]">
                            <span className="flex items-center gap-1 text-purple-200 font-bold">
                              <Sparkles className="w-3 h-3 text-purple-300" /> Slot 3: Spawn 1 Ghost
                            </span>
                            <span className="font-mono text-emerald-300 font-bold">Advances to Rank 3</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* RANK 3: 1x4 APEX GOLD MATRIX BOARD + GLOBAL QUEUE */}
      {/* ========================================================================= */}
      {activeRankTab === 3 && (() => {
        const itemData = walletAllDataMap[selectedRootId];
        const userObj = matrixContract.getUser(selectedRootId);
        const queueItem = (liveRank3Queue.length > 0 ? liveRank3Queue : contractState.rank3Queue).find(q => q.userId === selectedRootId);
        
        const slotsFilled = queueItem?.slotsFilled ?? itemData?.rank3Downlines?.length ?? userObj?.rank3SlotsFilled ?? 0;
        const downlineIds = itemData?.rank3Downlines || [];
        const isGhost = Boolean(queueItem?.isGhost ?? userObj?.isGhost);
        const wallet = queueItem ? ('walletAddress' in queueItem ? queueItem.walletAddress : queueItem.address) : (userObj?.address || currentUser?.address || '0x...');

        const r3Slots = [1, 2, 3, 4].map((slotNumber, idx) => {
          const downlineId = downlineIds[idx] || (slotsFilled >= slotNumber ? (queueItem?.userId ? selectedRootId + slotNumber : (140 + slotNumber)) : null);
          const isFilled = slotsFilled >= slotNumber || Boolean(downlineId);
          const downlineUser = downlineId ? matrixContract.getUser(downlineId) : null;
          const isSlotGhost = Boolean(downlineUser?.isGhost);

          return {
            slotNumber,
            isFilled,
            downlineId: isSlotGhost ? 0 : downlineId,
            isGhost: isSlotGhost,
            title: slotNumber === 4 ? (lang === 'th' ? 'เสกผี 8 ตัว (4 R1 + 4 R2)' : 'Spawn 8 Ghosts (4 R1 + 4 R2)') : (lang === 'th' ? 'โบนัสทองคำ' : 'Apex Gold Bonus'),
            reward: '+$2.00 USDT',
          };
        });

        return (
          <div className="w-full space-y-4">
            
            {/* Rank 3 Apex Gold Matrix Board Tree (1x4) */}
            <div className="w-full p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/50 shadow-2xl overflow-x-auto flex flex-col items-center">
              <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 border-b border-amber-500/30 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 flex items-center justify-center font-bold text-base shadow-sm shadow-amber-500/20">
                    👑
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-bold text-white">
                        {lang === 'th' ? 'ผังเมทริกซ์ทองคำ 1x4 ประจำ Rank 3 (Apex Gold)' : 'Rank 3 Apex Gold Matrix Board (1x4)'}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                        ID #{selectedRootId}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      {lang === 'th' ? 'รับโบนัสสะสม 8.00 USDT (2 USDT x 4) + จบรอบเสกผี 8 ตัวลงสู่ Rank 1 & Rank 2' : 'Apex Matrix: 4 slots pay $8 USDT + Auto-Spawns 8 Ghosts (4 to R1 + 4 to R2)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-amber-500/40 text-right">
                    <span className="text-[9px] text-amber-300 block">{lang === 'th' ? 'สล็อตบรรจุ' : 'Slots Filled'}</span>
                    <span className="text-xs sm:text-sm font-mono font-bold text-amber-400">{slotsFilled} / 4</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-right">
                    <span className="text-[9px] text-slate-400 block">{lang === 'th' ? 'รายได้รอบทอง' : 'Apex Earned'}</span>
                    <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400">+{(slotsFilled * 2.0).toFixed(2)} USDT</span>
                  </div>
                </div>
              </div>

              {/* Visual Interactive Gold Tree Graphic */}
              <div 
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                className="transition-transform duration-200 flex flex-col items-center gap-4 sm:gap-6 py-2 w-full max-w-4xl"
              >
                {/* APEX ROOT GOLDEN NODE */}
                <div className="flex flex-col items-center w-full max-w-xs sm:max-w-sm">
                  <div 
                    onClick={() => handleNodeClick({ id: selectedRootId, isGhost, address: wallet } as unknown as MatrixUser)}
                    className={`w-full cursor-pointer p-3 sm:p-4 rounded-2xl border-2 transition-all hover:scale-102 shadow-xl ${
                      isGhost
                        ? 'bg-amber-950/70 border-amber-400 text-amber-200 shadow-amber-500/30 ring-1 ring-amber-400/40'
                        : 'bg-gradient-to-b from-amber-900/60 via-slate-900 to-slate-950 border-amber-400 text-white shadow-amber-500/30 ring-1 ring-amber-400/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
                          👑
                        </div>
                        <div>
                          <p className="font-extrabold text-sm sm:text-base flex items-center gap-1.5 text-white">
                            {isGhost ? `Ghost #0` : `Member #${selectedRootId}`}
                            <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-100 font-mono border border-amber-400/50 font-bold">
                              Apex Gold
                            </span>
                          </p>
                          <p className="text-[10px] sm:text-xs text-slate-200 font-mono font-medium truncate max-w-[170px]">{wallet}</p>
                        </div>
                      </div>

                      <span className="text-xs sm:text-sm font-mono font-black text-amber-300">
                        +{(slotsFilled * 2.0).toFixed(2)} USDT
                      </span>
                    </div>

                    <div className="pt-2 border-t border-amber-500/30 flex items-center justify-between text-[10px] sm:text-xs font-mono">
                      <span className="text-slate-200 font-bold">Apex Progress:</span>
                      <span className="text-amber-200 font-black">{slotsFilled}/4 Slots ({Math.round((slotsFilled / 4) * 100)}%)</span>
                    </div>
                  </div>

                  {/* Gold Branch Line */}
                  <div className="w-0.5 h-6 bg-amber-500/60 my-0.5" />
                  <div className="w-[85%] max-w-md h-0.5 bg-amber-500/50" />
                </div>

                {/* 4 GOLDEN DOWNLINE MATRIX SLOTS */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 w-full">
                  {r3Slots.map((slot, sIdx) => {
                    return (
                      <div key={sIdx} className="flex flex-col items-center">
                        <div className="w-0.5 h-3 bg-amber-500/50 mb-1" />

                        <div 
                          onClick={() => {
                            if (slot.isFilled && slot.downlineId) {
                              handleNodeClick({ id: slot.downlineId, isGhost: slot.isGhost, address: wallet } as unknown as MatrixUser);
                            } else {
                              showToast(
                                lang === 'th' ? `สล็อตทองคำที่ ${slot.slotNumber} (ว่าง)` : `Golden Slot ${slot.slotNumber} (Empty)`,
                                slot.title,
                                'info'
                              );
                            }
                          }}
                          className={`w-full p-3.5 rounded-xl border-2 text-center transition-all cursor-pointer ${
                            slot.isFilled
                              ? slot.isGhost
                                ? 'bg-amber-950/80 border-amber-400 text-amber-100 shadow-md shadow-amber-500/25 hover:scale-102 ring-1 ring-amber-400/50'
                                : 'bg-slate-900/95 border-amber-400 text-white shadow-md shadow-amber-500/25 hover:scale-102'
                              : 'bg-slate-950/70 border-dashed border-slate-700 text-slate-400 hover:border-amber-400/60 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] sm:text-xs font-bold text-slate-200 mb-1.5">
                            <span>Slot {slot.slotNumber}</span>
                            <span className="text-amber-300 font-mono font-black">{slot.reward}</span>
                          </div>

                          {slot.isFilled ? (
                            <div className="py-1">
                              <div className="flex items-center justify-center gap-1.5 mb-1">
                                {slot.isGhost ? (
                                  <span className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-400/50 flex items-center justify-center text-[10px] font-bold">
                                    #0
                                  </span>
                                ) : (
                                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black shadow-sm">
                                    #{slot.downlineId}
                                  </span>
                                )}
                                <span className="font-extrabold text-xs sm:text-sm text-white">
                                  {slot.isGhost ? 'ID #0' : `ID #${slot.downlineId}`}
                                </span>
                              </div>
                              <span className="text-[10px] sm:text-[11px] text-amber-200 block font-bold truncate">{slot.title}</span>
                            </div>
                          ) : (
                            <div className="py-2">
                              <Plus className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                              <span className="text-[10px] sm:text-xs font-bold block text-slate-200">{lang === 'th' ? 'รอสมาชิกเลื่อนขั้น' : 'Waiting Node'}</span>
                              <span className="text-[9px] text-slate-400">{slot.title}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rank 3 Global Queue Details */}
            <div className="w-full p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/50 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/25 text-amber-200 border border-amber-400/50 text-xs font-bold mb-2 inline-block">
                    👑 APEX GOLD MATRIX (RANK 3) • globalQueues(3, index)
                  </span>
                  <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-white">
                    {t.rank3Title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-100 font-medium mt-1 max-w-xl">
                    {t.rank3Desc}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-right shrink-0 shadow-sm">
                  <span className="text-xs text-amber-200 font-semibold block">{lang === 'th' ? 'ผู้เสกผี (25%/คิว)' : 'Ghost Master (25%/queue)'}</span>
                  <span className="text-2xl font-black text-amber-300 font-mono">8.00 USDT</span>
                  <span className="text-xs text-purple-200 font-bold block mt-0.5">+ 4 Ghosts R1 + 4 Ghosts R2</span>
                </div>
              </div>

              {/* Active Gold Board Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-black text-amber-200 uppercase tracking-wider block">
                    {lang === 'th' ? 'กระดานทองคำผู้เสกผี (Rank 3 Queue)' : 'Active Gold Board Queue'}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-300">
                    Read: globalQueues(3, index)
                  </span>
                </div>

                {(liveRank3Queue.length > 0 ? liveRank3Queue : contractState.rank3Queue).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                    {(liveRank3Queue.length > 0 ? liveRank3Queue : contractState.rank3Queue).map((item, idx) => {
                      const walletStr = 'walletAddress' in item ? item.walletAddress : (item as { address: string }).address;
                      const slots = item.slotsFilled;

                      return (
                        <div 
                          key={idx}
                          onClick={() => {
                            setCustomRootId(item.userId);
                            showToast(
                              lang === 'th' ? `เลือกดูผังบอร์ดทองคำ ID #${item.userId}` : `Selected Gold Board #${item.userId}`,
                              `Rank 3 Apex Gold #${item.userId}`,
                              'reward'
                            );
                          }}
                          className={`p-3.5 rounded-xl transition-all cursor-pointer ${
                            item.userId === selectedRootId
                              ? 'bg-amber-950/80 border-2 border-amber-400 ring-2 ring-amber-400/40 shadow-xl shadow-amber-500/25'
                              : 'bg-slate-950/90 border-2 border-amber-500/60 shadow-md shadow-amber-500/10 hover:border-amber-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-amber-500/25 border border-amber-400/50 text-amber-200 flex items-center justify-center font-bold text-sm shadow-sm">
                                👑
                              </div>
                              <div>
                                <h4 className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1.5">
                                  {item.isGhost ? `Ghost #0` : `Member #${item.userId}`}
                                  {item.userId === selectedRootId && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 text-[9px] font-black">
                                      GOLD BOARD
                                    </span>
                                  )}
                                </h4>
                                <p className="text-[10px] sm:text-xs text-slate-200 font-mono font-medium truncate max-w-[150px]">{walletStr}</p>
                              </div>
                            </div>

                            <span className="text-xs sm:text-sm font-black text-amber-300 font-mono">
                              +$8.00 USDT
                            </span>
                          </div>

                          {/* 4 Golden Slots Graphic */}
                          <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                            {[1, 2, 3, 4].map((slotIdx) => {
                              const isFilled = slotIdx <= slots;
                              return (
                                <div
                                  key={slotIdx}
                                  className={`p-2 rounded-lg border text-center transition-all ${
                                    isFilled
                                      ? 'bg-amber-500/30 border-amber-400 text-amber-100 shadow-sm shadow-amber-500/20 font-bold'
                                      : 'bg-slate-900 border-dashed border-slate-700 text-slate-400'
                                  }`}
                                >
                                  <span className="text-[10px] font-bold block">Slot {slotIdx}</span>
                                  <span className="text-[9px] block mt-0.5 font-mono">
                                    {isFilled ? '+2 USDT' : 'WAIT'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          <div className="p-2 rounded-lg bg-purple-950/40 border border-purple-500/30 flex items-center justify-between text-[10px] sm:text-xs">
                            <span className="text-purple-300 flex items-center gap-1">
                              <Ghost className="w-3 h-3 text-purple-400 animate-bounce" />
                              {lang === 'th' ? 'จบผัง: เสกผี 8 ตัว' : 'Spawns 8 Ghosts'}
                            </span>
                            <span className="text-slate-400 font-mono text-[9px] sm:text-[10px]">
                              4 to R1 + 4 to R2
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center text-slate-500 text-xs bg-slate-950/60 rounded-xl border border-slate-800">
                    {lang === 'th' ? 'ยังไม่มีผู้เล่นอยู่ในกระดาน Rank 3 (เติม Rank 1 & 2 เพื่อก้าวขึ้นมา!)' : 'No nodes currently in Rank 3. Complete Rank 1 & 2 to advance here!'}
                  </div>
                )}
              </div>

            </div>

          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* NODE INSPECTOR MODAL */}
      {/* ========================================================================= */}
      {selectedNode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${
                selectedNode.isGhost 
                  ? 'bg-sky-500/20 border border-sky-400 text-sky-300 shadow-sm shadow-sky-500/20' 
                  : 'bg-sky-500/20 border border-sky-500/40 text-sky-400'
              }`}>
                {selectedNode.isGhost ? (
                  <span className="font-mono text-lg font-bold text-sky-300">#0</span>
                ) : (
                  `#${selectedNode.id}`
                )}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">
                  {selectedNode.isGhost ? `Ghost Reborn #0` : `Member ID #${selectedNode.id}`}
                </h3>
                <p className="text-xs text-slate-200 font-mono font-medium truncate max-w-[200px]">
                  {'address' in selectedNode ? selectedNode.address : (selectedNode as MatrixNodeView).wallet}
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs mb-6">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-700">
                <span className="text-slate-200 font-semibold">{t.sponsorId}</span>
                <span className="font-mono font-black text-white">#{selectedNode.sponsorId}</span>
              </div>
              {'placementId' in selectedNode && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-700">
                  <span className="text-slate-200 font-semibold">Placement ID</span>
                  <span className="font-mono font-black text-sky-300">#{(selectedNode as MatrixNodeView).placementId}</span>
                </div>
              )}
              {'downlineCount' in selectedNode && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-700">
                  <span className="text-slate-200 font-semibold">Downline Nodes</span>
                  <span className="font-mono font-black text-emerald-300">{(selectedNode as MatrixNodeView).downlineCount}</span>
                </div>
              )}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-emerald-500/40">
                <span className="text-slate-200 font-semibold flex items-center gap-1">
                  <span>{t.totalEarned}</span>
                  <span className="text-[9px] font-mono text-emerald-300 font-bold">(idTotalEarned)</span>
                </span>
                <span className="font-mono font-black text-emerald-300 text-sm">
                  ${(selectedNodeEarned !== null 
                      ? selectedNodeEarned 
                      : ('totalEarnedUSDT' in selectedNode ? (selectedNode as MatrixUser).totalEarnedUSDT : 0)
                    ).toFixed(2)} USDT
                </span>
              </div>
              {'rank1EarnedUSDT' in selectedNode && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-700">
                  <span className="text-slate-200 font-semibold">{t.rank1Bonus}</span>
                  <span className="font-mono font-black text-sky-300">${(selectedNode as MatrixUser).rank1EarnedUSDT.toFixed(2)} USDT</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setCustomRootId(selectedNode.id);
                  setSelectedNode(null);
                  setActiveRankTab(1);
                  showToast(
                    lang === 'th' ? 'เปลี่ยนจุดเริ่มผัง' : 'Root Switched',
                    `getTeamTree(${selectedNode.id})`,
                    'info'
                  );
                }}
                className="flex-1 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition shadow-sm"
              >
                {lang === 'th' ? 'ดูผังสายงานของรหัสนี้ (getTeamTree)' : 'View Tree (getTeamTree)'}
              </button>
              <button
                onClick={() => setSelectedNode(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

