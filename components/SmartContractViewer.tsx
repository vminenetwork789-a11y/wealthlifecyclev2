'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../lib/wallet-context';
import { CONTRACT_ADDRESS, USDT_ADDRESS, BSC_CONFIG, CONTRACT_OWNER } from '../lib/contracts-config';
import {
  fetchWalletAllIdsOnChain,
  fetchUserFullDetailsOnChain,
  fetchWalletAllDataOnChain,
  fetchWalletAvailableRank1NodesOnChain,
  fetchWalletTotalEarnedOnChain,
  fetchIdTotalEarnedOnChain,
  fetchLiveContractData,
  fetchContractEvents,
  fetchPlatformStatsOnChain,
  fetchPlatformAnalyticsOnChain,
  checkParentValidOnChain,
  fetchDeployTimeOnChain,
  fetchWalletExpiredIdsAndTotalEarnedOnChain,
  checkIsIdExpiredOnChain,
  fetchLatestRebornIdOnChain,
  fetchUserRank2PtrOnChain,
  fetchUserRank3PtrOnChain,
  fetchAllGlobalQueueLengthsOnChain,
  checkHasReachedRank2OnChain,
  type SmartContractEventLog
} from '../lib/web3-service';
import { matrixContract } from '../lib/mock-contract';
import type { UserDashboardData, PlatformStatsData, PlatformAnalyticsData } from '../lib/types';
import {
  FileCode2,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Terminal,
  Coins,
  ArrowUpRight,
  CheckCircle2,
  Search,
  UserCheck,
  LayoutGrid,
  Sparkles,
  Users,
  Activity,
  Layers,
  Database,
  Lock,
  PauseCircle,
  PlayCircle,
  TrendingUp,
  Radio,
  Zap,
  Bell,
  History,
  RefreshCw,
  Download,
  Server,
  HardDrive,
  Table,
  FileSpreadsheet,
  CheckCheck,
  X,
  ShieldCheck,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { 
  downloadMysqlDumpFile, 
  generateMysqlDumpSql, 
  MYSQL_SCHEMA_DDL 
} from '../lib/mysql-export';
import {
  runContractAuditSuite,
  type AuditSuiteReport,
  type AuditTestResult
} from '../lib/contract-audit';

const SOLIDITY_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WealthLifeCycle - 3-Rank Non-Stop Matrix Protocol with Ghost Reborn Engine
 * @dev 100% On-Chain Decentralized Matrix on BNB Smart Chain (BEP-20)
 * 
 * Contract Address: 0x5c10DD5fE770E68Fa3F033c63624194498975031
 * USDT Token (BSC): 0x55d398326f99059fF775485246999027B3197955
 * 
 * Compensation Architecture:
 * - Rank 1 (2 USDT): 10% Direct Bonus ($0.20), 30% Matrix Bonus ($0.60 x 2 slots). Slot 3 Hold. Slot 4 -> Auto-Upgrade Rank 2 + Reborn. (7-day Active Lifespan).
 * - Rank 2 (4 USDT): Slots 1 & 2: 50% Payout ($2.00 x 2 = $4.00) + Slot 2 spawns 1 Ghost in R2. Slots 3 & 4 -> Auto-Upgrade to Rank 3.
 * - Rank 3 (8 USDT): Slot 1: 1 Real ID Reborn ($2) + 4 Ghosts in R1 ($8). Slot 2: 100% Cash ($8.00). Slot 3: 2 Ghosts in R2 ($8). Slot 4: 2 Ghosts in R2 ($8) & Complete Cycle.
 */
interface IERC20 {
    function transfer(address to, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract WealthLifeCycle {
    struct User {
        uint256 id;
        address wallet;
        uint256 sponsorId;
        bool isGhost;
        uint256 totalEarned;
        uint256 directBonus;
        uint256 rank1SlotsCount;
        uint256 cyclesCompleted;
    }

    struct QueueNode {
        uint256 userId;
        address wallet;
        bool isGhost;
        uint8 slotsFilled;
    }

    IERC20 public immutable usdtToken;
    address public owner;
    bool public paused;
    uint256 public lastUserId = 1;
    uint256 public constant ENTRY_FEE = 2 * 10**18; // 2 USDT

    mapping(uint256 => User) public users;
    mapping(address => uint256) public addressToId;
    mapping(uint256 => uint256[]) public userRank1Children;

    QueueNode[] public rank2Queue;
    QueueNode[] public rank3Queue;

    // =========================================================================
    // EVENTS (100% Verified Matching On-Chain ABI)
    // =========================================================================
    event Registered(uint256 indexed newId, address indexed wallet, uint256 sponsorId, uint256 placementId, bool isAutoReborn, bool isGhost);
    event AutoUpgraded(uint256 indexed userId, uint256 newRank);
    event RebornQueued(uint256 indexed ownerId, address indexed wallet, uint256 totalIds, bool isGhost);
    event RewardPaid(address indexed wallet, uint256 amount, string note);
    event SystemPaused(bool isPaused);

    constructor(address _usdt) {
        owner = msg.sender;
        usdtToken = IERC20(_usdt);

        // Seed Genesis Root Node #1
        users[1] = User(1, msg.sender, 1, false, 0, 0, 0, 0);
        addressToId[msg.sender] = 1;
    }

    /**
     * @notice Register for 2 USDT and enter Rank 1
     */
    function register(uint256 sponsorId) external {
        require(!paused, "System paused");
        require(addressToId[msg.sender] == 0, "Already registered");
        require(sponsorId > 0 && sponsorId <= lastUserId, "Invalid sponsor");

        usdtToken.transferFrom(msg.sender, address(this), ENTRY_FEE);

        lastUserId++;
        users[lastUserId] = User(lastUserId, msg.sender, sponsorId, false, 0, 0, 0, 0);
        addressToId[msg.sender] = lastUserId;

        // 1. Direct Bonus: 10% (0.20 USDT)
        uint256 directBonus = 0.2 * 10**18;
        usdtToken.transfer(users[sponsorId].wallet, directBonus);
        users[sponsorId].directBonus += directBonus;
        users[sponsorId].totalEarned += directBonus;
        emit RewardPaid(users[sponsorId].wallet, directBonus, "Direct Sponsor Bonus (10%)");

        // 2. Place in Rank 1 (30% for slots 1 & 2, slots 3 & 4 upgrade)
        _placeRank1(sponsorId, lastUserId);

        emit Registered(lastUserId, msg.sender, sponsorId, sponsorId, true, false);
    }

    function _placeRank1(uint256 parentId, uint256 childId) internal {
        userRank1Children[parentId].push(childId);
        users[parentId].rank1SlotsCount++;
        uint256 slotIndex = userRank1Children[parentId].length;

        if (slotIndex == 1 || slotIndex == 2) {
            // Matrix Bonus: 30% (0.60 USDT)
            uint256 matrixBonus = 0.6 * 10**18;
            if (users[parentId].wallet != address(0)) {
                usdtToken.transfer(users[parentId].wallet, matrixBonus);
            }
            users[parentId].totalEarned += matrixBonus;
            emit RewardPaid(users[parentId].wallet, matrixBonus, "Rank 1 Matrix Slot Bonus (30%)");
        } else if (slotIndex == 4) {
            // Auto-Upgrade Rank 2 + Reborn Real ID back into Rank 1
            emit AutoUpgraded(parentId, 2);
            _enqueueRank2(parentId);
            _spawnRebornRealId(parentId);
        }
    }

    function _enqueueRank2(uint256 userId) internal {
        rank2Queue.push(QueueNode(userId, users[userId].wallet, users[userId].isGhost, 0));
        _stepRank2();
    }

    function _stepRank2() internal {
        if (rank2Queue.length == 0) return;
        QueueNode storage head = rank2Queue[0];
        head.slotsFilled++;

        if (head.slotsFilled == 1 || head.slotsFilled == 2) {
            // 50% (2.00 USDT) Payout
            uint256 reward = 2.0 * 10**18;
            if (head.wallet != address(0)) {
                usdtToken.transfer(head.wallet, reward);
                users[head.userId].totalEarned += reward;
                emit RewardPaid(head.wallet, reward, "Rank 2 Matrix Payout (50%)");
            }

            // Slot 2 ALSO spawns 1 Ghost in Rank 2
            if (head.slotsFilled == 2) {
                _spawnGhost(2);
            }
        } else if (head.slotsFilled == 4) {
            // Slot 4 -> Auto-Upgrade Rank 3
            emit AutoUpgraded(head.userId, 3);
            _popRank2Head();
            _enqueueRank3(head.userId);
        }
    }

    function _enqueueRank3(uint256 userId) internal {
        rank3Queue.push(QueueNode(userId, users[userId].wallet, users[userId].isGhost, 0));
        _stepRank3();
    }

    function _stepRank3() internal {
        if (rank3Queue.length == 0) return;
        QueueNode storage head = rank3Queue[0];
        head.slotsFilled++;

        if (head.slotsFilled == 1) {
            // Slot 1: 1 Real ID Reborn ($2) + 4 Ghosts to Rank 1 ($8)
            _spawnRebornRealId(head.userId);
            for (uint256 i = 0; i < 4; i++) {
                _spawnGhost(1);
            }
        } else if (head.slotsFilled == 2) {
            // Slot 2: 100% Cash ($8.00 USDT) directly to wallet
            uint256 reward = 8.0 * 10**18;
            if (head.wallet != address(0)) {
                usdtToken.transfer(head.wallet, reward);
                users[head.userId].totalEarned += reward;
                emit RewardPaid(head.wallet, reward, "Rank 3 Matrix Payout (100%)");
            }
        } else if (head.slotsFilled == 3) {
            // Slot 3: 2 Ghosts to Rank 2 ($8 value)
            _spawnGhost(2);
            _spawnGhost(2);
        } else if (head.slotsFilled == 4) {
            // Slot 4: 2 Ghosts to Rank 2 ($8 value) & Complete Cycle
            _spawnGhost(2);
            _spawnGhost(2);
            emit RebornQueued(head.userId, head.wallet, 7, false);
            _popRank3Head();
        }
    }

    function _spawnGhost(uint8 rankTarget) internal {
        lastUserId++;
        users[lastUserId] = User(lastUserId, address(0), 1, true, 0, 0, 0, 0);
        if (rankTarget == 1) {
            _placeRank1(1, lastUserId);
        } else if (rankTarget == 2) {
            rank2Queue.push(QueueNode(lastUserId, address(0), true, 0));
        }
        emit Registered(lastUserId, address(0), 1, 1, false, true);
    }

    function _spawnRebornRealId(uint256 originalUserId) internal {
        lastUserId++;
        address ownerWallet = users[originalUserId].wallet;
        users[lastUserId] = User(lastUserId, ownerWallet, originalUserId, false, 0, 0, 0, 0);
        _placeRank1(1, lastUserId);
        emit Registered(lastUserId, ownerWallet, originalUserId, 1, true, false);
    }

    function _popRank2Head() internal {
        for (uint256 i = 0; i < rank2Queue.length - 1; i++) {
            rank2Queue[i] = rank2Queue[i + 1];
        }
        rank2Queue.pop();
    }

    function _popRank3Head() internal {
        for (uint256 i = 0; i < rank3Queue.length - 1; i++) {
            rank3Queue[i] = rank3Queue[i + 1];
        }
        rank3Queue.pop();
    }

    function setPaused(bool _paused) external {
        require(msg.sender == owner, "Not owner");
        paused = _paused;
        emit SystemPaused(_paused);
    }

    /**
     * @notice Emergency token withdrawal for owner (USDT and BEP-20 tokens)
     * @param _token Token address to withdraw (e.g. USDT BEP-20)
     * @param _amount Token amount (in 18 decimals)
     */
    function emergencyWithdraw(address _token, uint256 _amount) external {
        require(msg.sender == owner, "Not owner");
        require(_amount > 0, "Invalid amount");
        IERC20(_token).transfer(owner, _amount);
    }
}`;

export const SmartContractViewer: React.FC = () => {
  const { 
    lang, 
    t, 
    lastUserId, 
    getIdTotalEarned, 
    showToast, 
    activeAccount, 
    currentUser, 
    selectedUserId,
    renewIdOnChain,
    processRebornOnChain,
    spawnGhostRank1OnChain,
    spawnGhostPushesOnChain,
    adminUpdateUserExpiryOnChain,
    adminUpdateUserWalletOnChain,
    adminUpdatePlacementIdOnChain,
    adminUpdateSponsorIdOnChain,
    adminSetQueueHeadOnChain,
    lockMigrationOnChain,
    emergencyWithdrawOnChain,
    setPauseOnChain,
    isLiveWeb3
  } = useWallet();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [copiedUsdt, setCopiedUsdt] = useState(false);
  const [activeCategory, setActiveCategory] = useState<'all' | 'read' | 'write' | 'user' | 'system' | 'events' | 'code' | 'audit'>('all');

  // Contract Audit State
  const [auditReport, setAuditReport] = useState<AuditSuiteReport | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [selectedAuditTestId, setSelectedAuditTestId] = useState<string | null>(null);
  const [auditFilter, setAuditFilter] = useState<string>('all');

  const defaultId = selectedUserId || currentUser?.id || 1;
  const defaultWallet = activeAccount?.address || CONTRACT_OWNER;

  // Interactive query for idTotalEarned
  const [queryId, setQueryId] = useState<string>(() => String(defaultId));
  const [queryResult, setQueryResult] = useState<{ id: number; earned: number } | null>(null);
  const [isQuerying, setIsQuerying] = useState<boolean>(false);

  // Interactive query for walletToIds
  const [queryWalletAddr, setQueryWalletAddr] = useState<string>(() => defaultWallet);
  const [walletIdsResult, setWalletIdsResult] = useState<{ wallet: string; ids: number[] } | null>(null);
  const [isQueryingWallet, setIsQueryingWallet] = useState<boolean>(false);

  // Interactive query for idToWallet
  const [queryIdToWalletInput, setQueryIdToWalletInput] = useState<string>(() => String(defaultId));
  const [idToWalletResult, setIdToWalletResult] = useState<{ id: number; wallet: string; isGhost: boolean } | null>(null);
  const [isQueryingIdToWallet, setIsQueryingIdToWallet] = useState<boolean>(false);

  // Interactive query for rank1Users(uint256 id)
  const [queryRank1UserInput, setQueryRank1UserInput] = useState<string>(() => String(defaultId));
  const [rank1UserResult, setRank1UserResult] = useState<{
    id: number;
    wallet: string;
    sponsorId: number;
    placementId: number;
    isGhost: boolean;
    isActive: boolean;
    pendingRebornFunds: number;
    totalEarned: number;
  } | null>(null);
  const [isQueryingRank1User, setIsQueryingRank1User] = useState<boolean>(false);

  // Interactive query for getWalletTotalEarned(address)
  const [queryWalletTotalEarnedAddr, setQueryWalletTotalEarnedAddr] = useState<string>(() => defaultWallet);
  const [walletTotalEarnedResult, setWalletTotalEarnedResult] = useState<{ wallet: string; totalEarned: number } | null>(null);
  const [isQueryingWalletTotalEarned, setIsQueryingWalletTotalEarned] = useState<boolean>(false);

  // Interactive query for getWalletAvailableRank1Nodes(address)
  const [queryAvailableNodesAddr, setQueryAvailableNodesAddr] = useState<string>(() => defaultWallet);
  const [availableNodesResult, setAvailableNodesResult] = useState<{ wallet: string; availableIds: number[]; downlineCounts: number[] } | null>(null);
  const [isQueryingAvailableNodes, setIsQueryingAvailableNodes] = useState<boolean>(false);

  // Interactive query for getWalletAllData
  const [queryWalletAllDataAddr, setQueryWalletAllDataAddr] = useState<string>(() => defaultWallet);
  const [walletAllDataResult, setWalletAllDataResult] = useState<{ wallet: string; data: UserDashboardData[] } | null>(null);
  const [isQueryingWalletAllData, setIsQueryingWalletAllData] = useState<boolean>(false);

  // Events Live Query State
  const [selectedEventName, setSelectedEventName] = useState<string>('ALL');
  const [eventLogs, setEventLogs] = useState<SmartContractEventLog[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [eventBlockRange, setEventBlockRange] = useState<number>(5000);
  const [eventSearchKeyword, setEventSearchKeyword] = useState<string>('');

  // MySQL Database Sync & Export State
  const [isSyncingMysql, setIsSyncingMysql] = useState<boolean>(false);
  const [copiedMysqlSql, setCopiedMysqlSql] = useState<boolean>(false);
  const [showMysqlSchemaModal, setShowMysqlSchemaModal] = useState<boolean>(false);
  const [mysqlSyncStatus, setMysqlSyncStatus] = useState<{ message: string; mode: string } | null>(null);

  // Interactive query for checkParentValid(parentId)
  const [queryParentIdInput, setQueryParentIdInput] = useState<string>('1');
  const [parentValidResult, setParentValidResult] = useState<{
    parentId: number;
    isActive: boolean;
    isExpired: boolean;
    downlineCount: number;
    isValid: boolean;
    canAcceptDownline: boolean;
  } | null>(null);
  const [isQueryingParent, setIsQueryingParent] = useState<boolean>(false);

  // Interactive query for getPlatformStats()
  const [platformStatsResult, setPlatformStatsResult] = useState<PlatformStatsData | null>(null);
  const [isQueryingPlatformStats, setIsQueryingPlatformStats] = useState<boolean>(false);

  // Interactive query for getPlatformAnalytics(periodSeconds)
  const [queryAnalyticsPeriod, setQueryAnalyticsPeriod] = useState<number>(0);
  const [platformAnalyticsResult, setPlatformAnalyticsResult] = useState<PlatformAnalyticsData | null>(null);
  const [isQueryingAnalytics, setIsQueryingAnalytics] = useState<boolean>(false);

  // Interactive query for isIdExpired(userId)
  const [queryIsExpiredId, setQueryIsExpiredId] = useState<string>(() => String(defaultId));
  const [isExpiredResult, setIsExpiredResult] = useState<{ userId: number; isExpired: boolean } | null>(null);
  const [isQueryingIsExpired, setIsQueryingIsExpired] = useState<boolean>(false);

  // Interactive query for getWalletExpiredIdsAndTotalEarned(wallet)
  const [queryExpiredWalletAddr, setQueryExpiredWalletAddr] = useState<string>(() => defaultWallet);
  const [walletExpiredResult, setWalletExpiredResult] = useState<{ wallet: string; expiredIds: number[]; earnedAmounts: number[] } | null>(null);
  const [isQueryingWalletExpired, setIsQueryingWalletExpired] = useState<boolean>(false);

  // Write Functions Execution State
  const [writeRenewIdInput, setWriteRenewIdInput] = useState<string>(() => String(defaultId));
  const [isWritingRenew, setIsWritingRenew] = useState<boolean>(false);

  const [writeProcessRebornBatch, setWriteProcessRebornBatch] = useState<string>('5');
  const [isWritingProcessReborn, setIsWritingProcessReborn] = useState<boolean>(false);

  const [writeSpawnRank1RootId, setWriteSpawnRank1RootId] = useState<string>('1');
  const [writeSpawnRank1Amount, setWriteSpawnRank1Amount] = useState<string>('4');
  const [isWritingSpawnRank1, setIsWritingSpawnRank1] = useState<boolean>(false);

  const [writeSpawnPushRank, setWriteSpawnPushRank] = useState<2 | 3>(2);
  const [writeSpawnPushAmount, setWriteSpawnPushAmount] = useState<string>('2');
  const [isWritingSpawnPushes, setIsWritingSpawnPushes] = useState<boolean>(false);

  const [writeUpdateExpiryUserId, setWriteUpdateExpiryUserId] = useState<string>(() => String(defaultId));
  const [writeUpdateExpiryDays, setWriteUpdateExpiryDays] = useState<string>('7');
  const [isWritingUpdateExpiry, setIsWritingUpdateExpiry] = useState<boolean>(false);

  const [writeUpdateWalletUserId, setWriteUpdateWalletUserId] = useState<string>(() => String(defaultId));
  const [writeUpdateWalletAddress, setWriteUpdateWalletAddress] = useState<string>('');
  const [isWritingUpdateWallet, setIsWritingUpdateWallet] = useState<boolean>(false);

  const [writeUpdatePlacementUserId, setWriteUpdatePlacementUserId] = useState<string>(() => String(defaultId));
  const [writeUpdatePlacementNewId, setWriteUpdatePlacementNewId] = useState<string>('1');
  const [isWritingUpdatePlacement, setIsWritingUpdatePlacement] = useState<boolean>(false);

  const [writeUpdateSponsorUserId, setWriteUpdateSponsorUserId] = useState<string>(() => String(defaultId));
  const [writeUpdateSponsorNewId, setWriteUpdateSponsorNewId] = useState<string>('1');
  const [isWritingUpdateSponsor, setIsWritingUpdateSponsor] = useState<boolean>(false);

  const [writeQueueHeadRank, setWriteQueueHeadRank] = useState<2 | 3>(2);
  const [writeQueueHeadIndex, setWriteQueueHeadIndex] = useState<string>('0');
  const [isWritingQueueHead, setIsWritingQueueHead] = useState<boolean>(false);

  const [isWritingPause, setIsWritingPause] = useState<boolean>(false);
  const [isWritingLockMigration, setIsWritingLockMigration] = useState<boolean>(false);

  const [writeEmergencyToken, setWriteEmergencyToken] = useState<string>(USDT_ADDRESS);
  const [writeEmergencyAmount, setWriteEmergencyAmount] = useState<string>('');
  const [isWritingEmergencyWithdraw, setIsWritingEmergencyWithdraw] = useState<boolean>(false);

  // Interactive query for hasReachedRank2(userId)
  const [queryHasReachedRank2Id, setQueryHasReachedRank2Id] = useState<string>(() => String(defaultId));
  const [hasReachedRank2Result, setHasReachedRank2Result] = useState<{ userId: number; reached: boolean } | null>(null);
  const [isQueryingHasReachedRank2, setIsQueryingHasReachedRank2] = useState<boolean>(false);

  // Interactive query for latestRebornId(userId)
  const [queryLatestRebornIdInput, setQueryLatestRebornIdInput] = useState<string>(() => String(defaultId));
  const [latestRebornIdResult, setLatestRebornIdResult] = useState<{ originalId: number; latestId: number } | null>(null);
  const [isQueryingLatestRebornId, setIsQueryingLatestRebornId] = useState<boolean>(false);

  // Interactive query for userRank2Ptr & userRank3Ptr
  const [queryUserRankPtrId, setQueryUserRankPtrId] = useState<string>(() => String(defaultId));
  const [userRankPtrResult, setUserRankPtrResult] = useState<{ userId: number; rank2Ptr: number; rank3Ptr: number } | null>(null);
  const [isQueryingUserRankPtr, setIsQueryingUserRankPtr] = useState<boolean>(false);

  // Contract system state snapshot
  const [contractLiveStats, setContractLiveStats] = useState<{
    owner: string;
    paused: boolean;
    globalPool: string;
    activeNodePointer: number;
    headRebornIndex: number;
    tailRebornIndex: number;
    lastUserId: number;
    deployTime?: number;
    platformStats?: PlatformStatsData | null;
    platformAnalytics?: PlatformAnalyticsData | null;
    isLive: boolean;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(false);

  // Load contract system stats on mount
  useEffect(() => {
    let isMounted = true;
    async function loadStats() {
      setIsLoadingStats(true);
      try {
        const data = await fetchLiveContractData();
        if (data && isMounted) {
          setContractLiveStats({
            owner: data.owner,
            paused: data.paused,
            globalPool: data.globalPool,
            activeNodePointer: data.activeNodePointer,
            headRebornIndex: data.headRebornIndex,
            tailRebornIndex: data.tailRebornIndex,
            lastUserId: data.lastUserId,
            deployTime: data.deployTime,
            platformStats: data.platformStats,
            platformAnalytics: data.platformAnalytics,
            isLive: data.isLive
          });
          if (data.platformStats) {
            setPlatformStatsResult(data.platformStats);
          }
          if (data.platformAnalytics) {
            setPlatformAnalyticsResult(data.platformAnalytics);
          }
        }
      } catch {
        // Fallback
      } finally {
        if (isMounted) setIsLoadingStats(false);
      }
    }
    loadStats();
    return () => { isMounted = false; };
  }, []);

  const handleFetchEvents = useCallback(async (eventName?: string, customRange?: number) => {
    setIsLoadingEvents(true);
    try {
      const range = customRange || eventBlockRange;
      const filterName = eventName && eventName !== 'ALL' ? eventName : undefined;
      const logs = await fetchContractEvents(filterName, range);
      setEventLogs(logs);
      showToast(
        lang === 'th' ? 'ดึง Events จาก BSC สำเร็จ' : 'Events Fetched',
        lang === 'th' ? `พบ ${logs.length} เหตุการณ์ล่าสุด` : `Found ${logs.length} recent events`,
        'success'
      );
    } catch {
      showToast('Events Query', 'Unable to fetch events from RPC node', 'info');
    } finally {
      setIsLoadingEvents(false);
    }
  }, [eventBlockRange, lang, showToast]);

  // Load events when switching to events tab if empty
  useEffect(() => {
    let isMounted = true;
    if (activeCategory === 'events' && eventLogs.length === 0) {
      (async () => {
        setIsLoadingEvents(true);
        try {
          const logs = await fetchContractEvents(undefined, eventBlockRange);
          if (isMounted) setEventLogs(logs);
        } catch {
          // ignore
        } finally {
          if (isMounted) setIsLoadingEvents(false);
        }
      })();
    }
    return () => { isMounted = false; };
  }, [activeCategory, eventBlockRange, eventLogs.length]);

  const handleExportMysqlFile = () => {
    try {
      const logsToExport = eventLogs.length > 0 ? eventLogs : matrixContract.getContractEvents();
      downloadMysqlDumpFile(logsToExport, `wealthlifecycle_events_${Date.now()}.sql`);
      showToast(
        lang === 'th' ? 'ดาวน์โหลดไฟล์ SQL สำเร็จ' : 'MySQL Dump Exported',
        lang === 'th' ? `บันทึกข้อมูลเหตุการณ์ ${logsToExport.length} รายการเป็นไฟล์ .sql แล้ว` : `Saved ${logsToExport.length} events as .sql file`,
        'success'
      );
    } catch {
      showToast('Export Error', 'Failed to generate MySQL dump file', 'info');
    }
  };

  const handleCopyMysqlSql = () => {
    try {
      const logsToExport = eventLogs.length > 0 ? eventLogs : matrixContract.getContractEvents();
      const sql = generateMysqlDumpSql(logsToExport);
      navigator.clipboard.writeText(sql);
      setCopiedMysqlSql(true);
      setTimeout(() => setCopiedMysqlSql(false), 2500);
      showToast(
        lang === 'th' ? 'คัดลอก SQL สำเร็จ' : 'SQL Copied',
        lang === 'th' ? 'พร้อมนำไปรันบน phpMyAdmin หรือ MySQL Workbench ได้ทันที' : 'Ready to execute on phpMyAdmin or MySQL Workbench',
        'success'
      );
    } catch {
      showToast('Copy Error', 'Failed to copy SQL script', 'info');
    }
  };

  const handleSyncMysqlApi = async () => {
    setIsSyncingMysql(true);
    setMysqlSyncStatus(null);
    try {
      const logsToExport = eventLogs.length > 0 ? eventLogs : matrixContract.getContractEvents();
      const res = await fetch('/api/events/mysql-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: logsToExport })
      });
      const data = await res.json();
      if (data.success) {
        setMysqlSyncStatus({ message: data.message, mode: data.mode });
        showToast(
          lang === 'th' ? 'ซิงค์ข้อมูล Events เข้า MySQL แล้ว' : 'MySQL Events Synced',
          data.message,
          'success'
        );
      } else {
        showToast('MySQL Sync Error', data.error || 'Failed to sync with MySQL', 'info');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      showToast('MySQL Sync', msg, 'info');
    } finally {
      setIsSyncingMysql(false);
    }
  };

  const handleRunAudit = useCallback(async () => {
    setIsAuditing(true);
    try {
      const report = await runContractAuditSuite();
      setAuditReport(report);
      showToast(
        lang === 'th' ? 'ตรวจสอบสัญญาสำเร็จ' : 'Audit Complete',
        lang === 'th' ? `คะแนนความถูกต้อง: ${report.complianceScore}% (${report.passed}/${report.totalTests} ผ่าน)` : `Compliance Score: ${report.complianceScore}% (${report.passed}/${report.totalTests} passed)`,
        report.failed === 0 ? 'success' : 'info'
      );
    } catch {
      showToast('Audit Error', 'Failed to run test suite', 'info');
    } finally {
      setIsAuditing(false);
    }
  }, [lang, showToast]);

  const handleExportAuditJson = () => {
    if (!auditReport) return;
    const blob = new Blob([JSON.stringify(auditReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract_audit_report_${CONTRACT_ADDRESS.slice(0, 10)}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(
      lang === 'th' ? 'ดาวน์โหลดรายงานการตรวจสอบแล้ว' : 'Audit Report Downloaded',
      'contract_audit_report.json',
      'success'
    );
  };

  const handleSelectCategory = (tabId: 'all' | 'read' | 'write' | 'user' | 'system' | 'events' | 'code' | 'audit') => {
    setActiveCategory(tabId);
    if (tabId === 'audit' && !auditReport && !isAuditing) {
      handleRunAudit();
    }
  };

  const handleQueryEarned = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(queryId.trim(), 10);
    if (isNaN(id) || id <= 0) {
      showToast('Invalid ID', 'Please enter a positive user ID', 'info');
      return;
    }
    setIsQuerying(true);
    try {
      let earned = await fetchIdTotalEarnedOnChain(id, true);
      if (earned === 0) {
        earned = await getIdTotalEarned(id);
      }
      setQueryResult({ id, earned });
      showToast(
        `idTotalEarned(${id})`,
        `${earned.toFixed(2)} USDT`,
        'success'
      );
    } catch {
      showToast('Query Failed', `Could not read idTotalEarned(${id})`, 'info');
    } finally {
      setIsQuerying(false);
    }
  };

  const handleQueryWalletToIds = async (e: React.FormEvent) => {
    e.preventDefault();
    const addr = queryWalletAddr.trim();
    if (!addr) {
      showToast('Invalid Address', 'Please enter a valid wallet address', 'info');
      return;
    }
    setIsQueryingWallet(true);
    try {
      let ids = await fetchWalletAllIdsOnChain(addr);
      if (!ids || ids.length === 0) {
        ids = matrixContract.getUserIdsByWallet(addr);
      }
      setWalletIdsResult({ wallet: addr, ids });
      showToast(
        `walletToIds(${addr.slice(0, 6)}...)`,
        ids.length > 0 ? `Found ${ids.length} User ID(s): [${ids.join(', ')}]` : 'No IDs found',
        ids.length > 0 ? 'success' : 'info'
      );
    } catch {
      showToast('Query Failed', `Could not read walletToIds for ${addr.slice(0, 6)}...`, 'info');
    } finally {
      setIsQueryingWallet(false);
    }
  };

  const handleQueryIdToWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(queryIdToWalletInput.trim(), 10);
    if (isNaN(id) || id <= 0) {
      showToast('Invalid ID', 'Please enter a valid positive ID', 'info');
      return;
    }
    setIsQueryingIdToWallet(true);
    try {
      const user = await fetchUserFullDetailsOnChain(id);
      if (user && user.wallet) {
        setIdToWalletResult({ id, wallet: user.wallet, isGhost: user.isGhost });
        showToast(
          `idToWallet(${id})`,
          `${user.isGhost ? '[Ghost] ' : ''}${user.wallet.slice(0, 6)}...${user.wallet.slice(-4)}`,
          'success'
        );
      } else {
        const localUser = matrixContract.getUser(id);
        if (localUser) {
          setIdToWalletResult({ id, wallet: localUser.address, isGhost: localUser.isGhost });
          showToast(`idToWallet(${id})`, `${localUser.address.slice(0, 6)}...`, 'success');
        } else {
          showToast('Not Found', `User ID #${id} is not registered`, 'info');
        }
      }
    } catch {
      showToast('Query Failed', `Could not find wallet for ID #${id}`, 'info');
    } finally {
      setIsQueryingIdToWallet(false);
    }
  };

  const handleQueryRank1User = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(queryRank1UserInput.trim(), 10);
    if (isNaN(id) || id <= 0) {
      showToast('Invalid ID', 'Please enter a valid positive ID', 'info');
      return;
    }
    setIsQueryingRank1User(true);
    try {
      const user = await fetchUserFullDetailsOnChain(id);
      if (user) {
        setRank1UserResult({
          id: user.id,
          wallet: user.wallet,
          sponsorId: user.sponsorId,
          placementId: user.placementId,
          isGhost: user.isGhost,
          isActive: user.isActive,
          pendingRebornFunds: user.pendingRebornFunds,
          totalEarned: user.totalEarnedUSDT
        });
        showToast(
          `rank1Users(${id})`,
          `Sponsor #${user.sponsorId}, Placement #${user.placementId}, Active: ${user.isActive}`,
          'success'
        );
      } else {
        showToast('Not Found', `Rank 1 struct for ID #${id} not found`, 'info');
      }
    } catch {
      showToast('Query Failed', `Could not inspect Rank 1 struct for ID #${id}`, 'info');
    } finally {
      setIsQueryingRank1User(false);
    }
  };

  const handleQueryWalletTotalEarned = async (e: React.FormEvent) => {
    e.preventDefault();
    const addr = queryWalletTotalEarnedAddr.trim();
    if (!addr) {
      showToast('Invalid Address', 'Please enter a valid wallet address', 'info');
      return;
    }
    setIsQueryingWalletTotalEarned(true);
    try {
      let totalEarned = await fetchWalletTotalEarnedOnChain(addr);
      if (totalEarned === 0) {
        const ids = matrixContract.getUserIdsByWallet(addr);
        totalEarned = ids.reduce((sum, id) => {
          const u = matrixContract.getUser(id);
          return sum + (u?.totalEarnedUSDT || 0);
        }, 0);
      }
      setWalletTotalEarnedResult({ wallet: addr, totalEarned });
      showToast(
        `getWalletTotalEarned(${addr.slice(0, 6)}...)`,
        `${totalEarned.toFixed(2)} USDT`,
        'success'
      );
    } catch {
      showToast('Query Failed', `Could not sum earnings for wallet ${addr.slice(0, 6)}...`, 'info');
    } finally {
      setIsQueryingWalletTotalEarned(false);
    }
  };

  const handleQueryAvailableNodes = async (e: React.FormEvent) => {
    e.preventDefault();
    const addr = queryAvailableNodesAddr.trim();
    if (!addr) {
      showToast('Invalid Address', 'Please enter a valid wallet address', 'info');
      return;
    }
    setIsQueryingAvailableNodes(true);
    try {
      const res = await fetchWalletAvailableRank1NodesOnChain(addr);
      setAvailableNodesResult({ wallet: addr, availableIds: res.availableIds, downlineCounts: res.downlineCounts });
      showToast(
        `getWalletAvailableRank1Nodes(${addr.slice(0, 6)}...)`,
        `Found ${res.availableIds.length} open slot(s)`,
        res.availableIds.length > 0 ? 'success' : 'info'
      );
    } catch {
      showToast('Query Failed', `Could not fetch available nodes for ${addr.slice(0, 6)}...`, 'info');
    } finally {
      setIsQueryingAvailableNodes(false);
    }
  };

  const handleQueryWalletAllData = async (e: React.FormEvent) => {
    e.preventDefault();
    const addr = queryWalletAllDataAddr.trim();
    if (!addr) {
      showToast('Invalid Address', 'Please enter a valid wallet address', 'info');
      return;
    }
    setIsQueryingWalletAllData(true);
    try {
      const res = await fetchWalletAllDataOnChain(addr);
      setWalletAllDataResult({ wallet: addr, data: res });
      showToast(
        `getWalletAllData(${addr.slice(0, 6)}...)`,
        `Retrieved profile for ${res.length} Node ID(s)`,
        res.length > 0 ? 'success' : 'info'
      );
    } catch {
      showToast('Query Failed', `Could not load full profile for ${addr.slice(0, 6)}...`, 'info');
    } finally {
      setIsQueryingWalletAllData(false);
    }
  };

  const handleQueryParentValid = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(queryParentIdInput.trim(), 10);
    if (isNaN(id) || id <= 0) {
      showToast('Invalid ID', 'Please enter a positive parent ID', 'info');
      return;
    }
    setIsQueryingParent(true);
    try {
      const res = await checkParentValidOnChain(id);
      setParentValidResult({ parentId: id, ...res });
      showToast(
        `checkParentValid(${id})`,
        res.isValid ? `Valid: ${res.downlineCount}/2 children` : `Invalid: ${res.isActive ? 'Tree Full' : 'Inactive/Expired'}`,
        res.isValid ? 'success' : 'info'
      );
    } catch {
      showToast('Query Failed', `Could not check parent valid for ID #${id}`, 'info');
    } finally {
      setIsQueryingParent(false);
    }
  };

  const handleQueryPlatformStats = async () => {
    setIsQueryingPlatformStats(true);
    try {
      const stats = await fetchPlatformStatsOnChain();
      setPlatformStatsResult(stats);
      showToast('Platform Stats', 'Fetched 1D, 1W, 1M, All-Time stats', 'success');
    } catch {
      showToast('Query Failed', 'Could not fetch platform stats', 'info');
    } finally {
      setIsQueryingPlatformStats(false);
    }
  };

  const handleQueryPlatformAnalytics = async (period?: number) => {
    const p = period !== undefined ? period : queryAnalyticsPeriod;
    setIsQueryingAnalytics(true);
    try {
      const analytics = await fetchPlatformAnalyticsOnChain(p);
      setPlatformAnalyticsResult(analytics);
      showToast('Platform Analytics', `Fetched analytics for period ${p}s`, 'success');
    } catch {
      showToast('Query Failed', 'Could not fetch platform analytics', 'info');
    } finally {
      setIsQueryingAnalytics(false);
    }
  };

  const handleQueryIsExpired = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(queryIsExpiredId.trim(), 10);
    if (isNaN(id) || id <= 0) {
      showToast('Invalid ID', 'Please enter a valid user ID', 'info');
      return;
    }
    setIsQueryingIsExpired(true);
    try {
      const isExp = await checkIsIdExpiredOnChain(id);
      setIsExpiredResult({ userId: id, isExpired: isExp });
      showToast(
        `isIdExpired(${id})`,
        isExp ? (lang === 'th' ? `รหัส #${id} หมดอายุแล้ว (Expired)` : `ID #${id} is expired`) : (lang === 'th' ? `รหัส #${id} ยังใช้งานได้ปกติ (Active)` : `ID #${id} is active`),
        isExp ? 'info' : 'success'
      );
    } catch {
      showToast('Query Failed', `Could not check expiry for ID #${id}`, 'info');
    } finally {
      setIsQueryingIsExpired(false);
    }
  };

  const handleQueryWalletExpired = async (e: React.FormEvent) => {
    e.preventDefault();
    const addr = queryExpiredWalletAddr.trim();
    if (!addr) {
      showToast('Invalid Address', 'Please enter a valid wallet address', 'info');
      return;
    }
    setIsQueryingWalletExpired(true);
    try {
      const res = await fetchWalletExpiredIdsAndTotalEarnedOnChain(addr);
      setWalletExpiredResult({ wallet: addr, expiredIds: res.expiredIds, earnedAmounts: res.earnedAmounts });
      showToast(
        `getWalletExpiredIdsAndTotalEarned(${addr.slice(0, 6)}...)`,
        res.expiredIds.length > 0 ? `Found ${res.expiredIds.length} expired IDs` : 'No expired IDs found',
        'success'
      );
    } catch {
      showToast('Query Failed', `Could not fetch expired IDs for ${addr.slice(0, 6)}...`, 'info');
    } finally {
      setIsQueryingWalletExpired(false);
    }
  };

  const handleWriteRenewId = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(writeRenewIdInput.trim(), 10);
    if (isNaN(id) || id <= 0) {
      showToast('Invalid ID', 'Please enter a valid user ID', 'info');
      return;
    }
    setIsWritingRenew(true);
    await renewIdOnChain(id);
    setIsWritingRenew(false);
  };

  const handleWriteProcessReborn = async (e: React.FormEvent) => {
    e.preventDefault();
    const batch = parseInt(writeProcessRebornBatch.trim(), 10) || 5;
    setIsWritingProcessReborn(true);
    await processRebornOnChain(batch);
    setIsWritingProcessReborn(false);
  };

  const handleWriteSpawnRank1 = async (e: React.FormEvent) => {
    e.preventDefault();
    const root = parseInt(writeSpawnRank1RootId.trim(), 10) || 1;
    const count = parseInt(writeSpawnRank1Amount.trim(), 10) || 4;
    setIsWritingSpawnRank1(true);
    await spawnGhostRank1OnChain(root, count);
    setIsWritingSpawnRank1(false);
  };

  const handleWriteSpawnPushes = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(writeSpawnPushAmount.trim(), 10) || 2;
    setIsWritingSpawnPushes(true);
    await spawnGhostPushesOnChain(writeSpawnPushRank, count);
    setIsWritingSpawnPushes(false);
  };

  const handleWriteUpdateExpiry = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(writeUpdateExpiryUserId.trim(), 10);
    const days = parseFloat(writeUpdateExpiryDays.trim());
    if (isNaN(id) || id <= 0 || isNaN(days) || days <= 0) {
      showToast('Invalid Input', 'Please enter valid user ID and days', 'info');
      return;
    }
    const newTimestamp = Math.floor(Date.now() / 1000) + Math.floor(days * 86400);
    setIsWritingUpdateExpiry(true);
    await adminUpdateUserExpiryOnChain(id, newTimestamp);
    setIsWritingUpdateExpiry(false);
  };

  const handleWriteUpdateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(writeUpdateWalletUserId.trim(), 10);
    const w = writeUpdateWalletAddress.trim();
    if (isNaN(id) || id <= 0 || !w) {
      showToast('Invalid Input', 'Please enter valid user ID and new address', 'info');
      return;
    }
    setIsWritingUpdateWallet(true);
    await adminUpdateUserWalletOnChain(id, w);
    setIsWritingUpdateWallet(false);
  };

  const handleWriteUpdatePlacement = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(writeUpdatePlacementUserId.trim(), 10);
    const newPid = parseInt(writeUpdatePlacementNewId.trim(), 10);
    if (isNaN(id) || id <= 0 || isNaN(newPid) || newPid <= 0) {
      showToast('Invalid Input', 'Please enter valid User ID and Placement ID', 'info');
      return;
    }
    setIsWritingUpdatePlacement(true);
    await adminUpdatePlacementIdOnChain(id, newPid);
    setIsWritingUpdatePlacement(false);
  };

  const handleWriteUpdateSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(writeUpdateSponsorUserId.trim(), 10);
    const newSid = parseInt(writeUpdateSponsorNewId.trim(), 10);
    if (isNaN(id) || id <= 0 || isNaN(newSid) || newSid <= 0) {
      showToast('Invalid Input', 'Please enter valid User ID and Sponsor ID', 'info');
      return;
    }
    setIsWritingUpdateSponsor(true);
    await adminUpdateSponsorIdOnChain(id, newSid);
    setIsWritingUpdateSponsor(false);
  };

  const handleWriteQueueHead = async (e: React.FormEvent) => {
    e.preventDefault();
    const idx = parseInt(writeQueueHeadIndex.trim(), 10);
    if (isNaN(idx) || idx < 0) {
      showToast('Invalid Index', 'Please enter a valid head index >= 0', 'info');
      return;
    }
    setIsWritingQueueHead(true);
    await adminSetQueueHeadOnChain(writeQueueHeadRank, idx);
    setIsWritingQueueHead(false);
  };

  const handleWriteTogglePause = async (newPauseState: boolean) => {
    setIsWritingPause(true);
    await setPauseOnChain(newPauseState);
    setIsWritingPause(false);
  };

  const handleWriteLockMigration = async () => {
    setIsWritingLockMigration(true);
    await lockMigrationOnChain();
    setIsWritingLockMigration(false);
  };

  const handleWriteEmergencyWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = writeEmergencyToken.trim();
    const amountStr = writeEmergencyAmount.trim();
    if (!token || !amountStr || parseFloat(amountStr) <= 0) {
      showToast('Invalid Input', 'Please enter valid token address and amount', 'info');
      return;
    }
    setIsWritingEmergencyWithdraw(true);
    await emergencyWithdrawOnChain(token, amountStr);
    setIsWritingEmergencyWithdraw(false);
  };

  const handleQueryHasReachedRank2 = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(queryHasReachedRank2Id.trim(), 10);
    if (isNaN(id) || id <= 0) {
      showToast('Invalid ID', 'Please enter valid user ID', 'info');
      return;
    }
    setIsQueryingHasReachedRank2(true);
    try {
      const reached = await checkHasReachedRank2OnChain(id);
      setHasReachedRank2Result({ userId: id, reached });
    } catch {
      showToast('Query Failed', `Could not check Rank 2 status for #${id}`, 'info');
    } finally {
      setIsQueryingHasReachedRank2(false);
    }
  };

  const handleQueryLatestRebornId = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(queryLatestRebornIdInput.trim(), 10);
    if (isNaN(id) || id <= 0) {
      showToast('Invalid ID', 'Please enter valid user ID', 'info');
      return;
    }
    setIsQueryingLatestRebornId(true);
    try {
      const latestId = await fetchLatestRebornIdOnChain(id);
      setLatestRebornIdResult({ originalId: id, latestId });
    } catch {
      showToast('Query Failed', `Could not fetch latest reborn ID for #${id}`, 'info');
    } finally {
      setIsQueryingLatestRebornId(false);
    }
  };

  const handleQueryUserRankPtr = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(queryUserRankPtrId.trim(), 10);
    if (isNaN(id) || id <= 0) {
      showToast('Invalid ID', 'Please enter valid user ID', 'info');
      return;
    }
    setIsQueryingUserRankPtr(true);
    try {
      const [r2Ptr, r3Ptr] = await Promise.all([
        fetchUserRank2PtrOnChain(id),
        fetchUserRank3PtrOnChain(id)
      ]);
      setUserRankPtrResult({ userId: id, rank2Ptr: r2Ptr, rank3Ptr: r3Ptr });
    } catch {
      showToast('Query Failed', `Could not fetch rank queue pointers for #${id}`, 'info');
    } finally {
      setIsQueryingUserRankPtr(false);
    }
  };

  const handleCopyCode = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(SOLIDITY_CODE);
      }
    } catch {
      // Fallback
    }
    setCopiedCode(true);
    showToast(lang === 'th' ? 'คัดลอกโค้ด Solidity แล้ว' : 'Solidity Code Copied', '100% On-chain contract code copied', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyAddr = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(CONTRACT_ADDRESS);
      }
    } catch {
      // Fallback
    }
    setCopiedAddr(true);
    showToast(lang === 'th' ? 'คัดลอกแอดเดรสคอนแทรกต์แล้ว' : 'Contract Address Copied', CONTRACT_ADDRESS, 'success');
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const handleCopyUsdt = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(USDT_ADDRESS);
      }
    } catch {
      // Fallback
    }
    setCopiedUsdt(true);
    showToast(lang === 'th' ? 'คัดลอกแอดเดรส USDT แล้ว' : 'USDT Token Address Copied', USDT_ADDRESS, 'success');
    setTimeout(() => setCopiedUsdt(false), 2000);
  };

  const CONTRACT_EVENTS_METADATA = [
    {
      name: 'Registered',
      signature: 'Registered(uint256 indexed newId, address indexed wallet, uint256 sponsorId, uint256 placementId, bool isAutoReborn, bool isGhost)',
      descTh: 'ส่งสัญญาณเมื่อมีสมาชิกใหม่ลงทะเบียน หรือมีการสร้าง Ghost / Reborn ID ลงในผัง Rank 1',
      descEn: 'Emitted when a new member registers or a clone/ghost is placed into Rank 1 matrix.',
      color: 'sky'
    },
    {
      name: 'RewardPaid',
      signature: 'RewardPaid(address indexed wallet, uint256 amount, string note)',
      descTh: 'ส่งสัญญาณเมื่อมีการโอนจ่ายรางวัล USDT (Direct Bonus 10%, Rank 1 Matrix 30%, Rank 2 Matrix 50%, Rank 3 Matrix 100%)',
      descEn: 'Emitted whenever any USDT reward is transferred to a member wallet with an audit note.',
      color: 'emerald'
    },
    {
      name: 'RewardForfeited',
      signature: 'RewardForfeited(uint256 indexed userId, uint256 amount, string reason)',
      descTh: 'ส่งสัญญาณเมื่อรางวัลถูกระงับ/สละสิทธิ์ เนื่องจากรหัสหมดอายุ (Expired) หรือเกินเงื่อนไข',
      descEn: 'Emitted when a reward is forfeited due to node expiration or policy constraints.',
      color: 'rose'
    },
    {
      name: 'AutoUpgraded',
      signature: 'AutoUpgraded(uint256 indexed userId, uint256 newRank)',
      descTh: 'ส่งสัญญาณเมื่อสมาชิกสะสมช่องครบ 4 ช่อง และได้รับการเลื่อนขั้นอัตโนมัติไปยัง Rank 2 หรือ Rank 3',
      descEn: 'Emitted when a member completes 4 downlines and automatically upgrades to Rank 2 or 3.',
      color: 'purple'
    },
    {
      name: 'RebornQueued',
      signature: 'RebornQueued(uint256 indexed ownerId, address indexed wallet, uint256 totalIds, bool isGhost)',
      descTh: 'ส่งสัญญาณเมื่อรหัสจบวัฏจักร Rank 3 และส่ง 7 รหัส Reborn เข้าสู่คิวสากลอัตโนมัติ',
      descEn: 'Emitted when a node completes Rank 3 and queues 7 Reborn IDs into the automated FIFO queue.',
      color: 'amber'
    },
    {
      name: 'PlacementUpdated',
      signature: 'PlacementUpdated(uint256 indexed userId, uint256 oldPlacementId, uint256 newPlacementId)',
      descTh: 'ส่งสัญญาณเมื่อแอดมินอัปเดตหรือย้ายตำแหน่ง Placement ID ของรหัสสมาชิกในผัง',
      descEn: 'Emitted when the admin updates a user placement node ID in the matrix tree.',
      color: 'cyan'
    },
    {
      name: 'SponsorUpdated',
      signature: 'SponsorUpdated(uint256 indexed userId, uint256 oldSponsorId, uint256 newSponsorId)',
      descTh: 'ส่งสัญญาณเมื่อแอดมินอัปเดตหรือย้ายผู้แนะนำ Sponsor ID ของรหัสสมาชิก',
      descEn: 'Emitted when the admin updates a user direct sponsor ID.',
      color: 'indigo'
    },
    {
      name: 'SystemPaused',
      signature: 'SystemPaused(bool isPaused)',
      descTh: 'ส่งสัญญาณเมื่อสถานะการระงับระบบชั่วคราวถูกปรับเปลี่ยนโดย Owner',
      descEn: 'Emitted when the contract pause state is toggled by the owner.',
      color: 'rose'
    }
  ];

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header */}
      <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <FileCode2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  {t.contractTitle}
                </h1>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  VERIFIED 100%
                </span>
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold">
                  BSC MAINNET
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">
                {t.contractSub}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={BSC_CONFIG.contractExplorerUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>BscScan Explorer</span>
            </a>

            <button
              id="btn_copy_sol_code"
              onClick={handleCopyCode}
              className="px-4 py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-bold text-xs flex items-center justify-center gap-2 transition"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? t.copied : (lang === 'th' ? 'คัดลอกโค้ด Solidity' : 'Copy Solidity Code')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Contract & Token Addresses Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* lastUserId Live Stat Card */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-sky-500/50 relative overflow-hidden shadow-lg shadow-sky-950/30">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-sky-400 font-bold uppercase tracking-wider">
              {lang === 'th' ? 'จำนวนสมาชิก (lastUserId)' : 'Total Members (lastUserId)'}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[9px] font-mono font-bold">
              uint256 public
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="text-lg font-mono font-black text-white">
              #{lastUserId}
            </span>
            <span className="text-[10px] text-sky-300/80 font-mono">
              lastUserId() view
            </span>
          </div>
        </div>

        {/* WealthLifeCycle Contract */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-sky-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-sky-400 font-bold uppercase tracking-wider">
              {lang === 'th' ? 'ที่อยู่ Smart Contract (DApp)' : 'Smart Contract Address'}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> LIVE
            </span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="text-xs font-mono font-bold text-white truncate">
              {CONTRACT_ADDRESS}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={handleCopyAddr} 
                title="Copy Address"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                {copiedAddr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={BSC_CONFIG.contractExplorerUrl}
                target="_blank"
                rel="noreferrer"
                title="View on BscScan"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* USDT Token (BEP-20) */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-500/30 relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
              {lang === 'th' ? 'ที่อยู่เหรียญ USDT (BEP-20)' : 'USDT Token (BEP-20)'}
            </span>
            <span className="text-[9px] text-slate-400 font-mono">18 Decimals</span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="text-xs font-mono font-bold text-emerald-300 truncate">
              {USDT_ADDRESS}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={handleCopyUsdt} 
                title="Copy USDT Address"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                {copiedUsdt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={BSC_CONFIG.usdtExplorerUrl}
                target="_blank"
                rel="noreferrer"
                title="View USDT on BscScan"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Network */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">EVM Blockchain</span>
          <span className="text-xs font-mono font-bold text-sky-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
            BNB Smart Chain (56)
          </span>
          <span className="text-[10px] text-slate-500 font-mono block mt-1">0x38 (Mainnet)</span>
        </div>

        {/* Compiler */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] text-slate-400 block mb-1">Compiler & Standards</span>
          <span className="text-xs font-mono font-bold text-emerald-400">
            Solidity v0.8.20
          </span>
          <span className="text-[10px] text-slate-500 font-mono block mt-1">BEP-20 Matrix Queue</span>
        </div>
      </div>

      {/* Filter Tabs for Contract Methods */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-1 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white">
            {lang === 'th' ? 'ฟังก์ชัน & เหตุการณ์ของ Smart Contract (Interactive Hub)' : 'All Smart Contract Methods & Events'}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800 flex-wrap">
          {[
            { id: 'all', label: lang === 'th' ? 'ทั้งหมด (All)' : 'All Methods' },
            { id: 'audit', label: lang === 'th' ? 'ตรวจสอบสัญญา (Audit)' : 'Contract Audit' },
            { id: 'write', label: lang === 'th' ? 'ธุรกรรม/เขียนสัญญา (Write)' : 'Write Transactions' },
            { id: 'read', label: lang === 'th' ? 'อ่านข้อมูล (Read)' : 'Read Queries' },
            { id: 'user', label: lang === 'th' ? 'ผู้ใช้ & กระเป๋า (User)' : 'User & Wallet' },
            { id: 'system', label: lang === 'th' ? 'ระบบ & สถานะ (System)' : 'System State' },
            { id: 'events', label: lang === 'th' ? 'เหตุการณ์ (Events)' : 'Events & Logs' },
            { id: 'code', label: lang === 'th' ? 'โค้ดสัญญา (Source)' : 'Solidity Source' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSelectCategory(tab.id as 'all' | 'read' | 'write' | 'user' | 'system' | 'events' | 'code' | 'audit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeCategory === tab.id
                  ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tab.id === 'audit' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
              {tab.id === 'write' && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
              {tab.id === 'events' && <Radio className="w-3.5 h-3.5 text-amber-400" />}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contract Logic Verification & Audit Suite */}
      {(activeCategory === 'all' || activeCategory === 'audit') && (
        <div className="p-6 rounded-3xl bg-slate-900/95 border border-emerald-900/40 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  {lang === 'th' ? 'ชุดตรวจสอบความถูกต้องของระบบ Smart Contract (Logic Audit Suite)' : 'Smart Contract Logic Verification & Audit Suite'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  BSC Mainnet
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {lang === 'th' 
                  ? 'ตรวจสอบความถูกต้องของการกระจายผลประโยชน์ 3 ระดับ (3-Rank Matrix), กลไกการเกิดใหม่ของ Ghost, และคิวสากล FIFO ตาม ABI'
                  : 'Audits 3-rank matrix distribution, ghost re-entry triggers, and global FIFO queue prioritization against smart contract ABI.'}
              </p>
              <div className="text-[11px] font-mono text-slate-400 pt-0.5">
                Target: <span className="text-sky-300 font-semibold">{CONTRACT_ADDRESS}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {auditReport && (
                <button
                  onClick={handleExportAuditJson}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 transition flex items-center gap-1.5"
                  title="Export audit report as JSON file"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>{lang === 'th' ? 'ส่งออกรายงาน JSON' : 'Export JSON'}</span>
                </button>
              )}
              <button
                onClick={handleRunAudit}
                disabled={isAuditing}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                <span>
                  {isAuditing 
                    ? (lang === 'th' ? 'กำลังตรวจสอบ...' : 'Running Audit...') 
                    : (lang === 'th' ? 'เริ่มตรวจสอบสัญญา (Run Audit)' : 'Run Contract Audit')}
                </span>
              </button>
            </div>
          </div>

          {/* Audit Metrics Banner */}
          {auditReport ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-900/30">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                    {lang === 'th' ? 'คะแนนความถูกต้อง' : 'Compliance Score'}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {auditReport.complianceScore}%
                    </span>
                    <span className="text-[10px] text-emerald-500 font-medium">Verified</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                    {lang === 'th' ? 'การทดสอบทั้งหมด' : 'Total Test Cases'}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black text-white font-mono">
                      {auditReport.totalTests}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">cases</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-900/30">
                  <span className="text-[10px] text-emerald-400/80 block uppercase tracking-wider font-semibold">
                    {lang === 'th' ? 'ผ่านเกณฑ์ (Passed)' : 'Passed Tests'}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {auditReport.passed}
                    </span>
                    <span className="text-[10px] text-emerald-500/70 font-medium">/{auditReport.totalTests}</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
                    {lang === 'th' ? 'เวลาในการทดสอบ' : 'Execution Time'}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-black text-sky-400 font-mono">
                      {auditReport.durationMs}
                    </span>
                    <span className="text-[10px] text-sky-500 font-medium">ms</span>
                  </div>
                </div>
              </div>

              {/* Category Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 text-xs">
                {[
                  { id: 'all', label: lang === 'th' ? 'ทั้งหมด' : 'All', count: auditReport.totalTests },
                  { id: 'abi_specification', label: 'ABI Specs', count: auditReport.categorySummaries.abi_specification.total },
                  { id: 'matrix_distribution', label: '3-Rank Matrix', count: auditReport.categorySummaries.matrix_distribution.total },
                  { id: 'ghost_reentry_triggers', label: 'Ghost Engine', count: auditReport.categorySummaries.ghost_reentry_triggers.total },
                  { id: 'global_queue_prioritization', label: 'Queue FIFO', count: auditReport.categorySummaries.global_queue_prioritization.total },
                  { id: 'conservation_of_funds', label: 'Conservation Math', count: auditReport.categorySummaries.conservation_of_funds.total },
                  { id: 'expiry_and_forfeiture', label: '7-Day Expiry', count: auditReport.categorySummaries.expiry_and_forfeiture.total },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setAuditFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                      auditFilter === tab.id
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Test Cases Accordion List */}
              <div className="space-y-2.5">
                {auditReport.results
                  .filter((test) => auditFilter === 'all' || test.category === auditFilter)
                  .map((test) => {
                    const isExpanded = selectedAuditTestId === test.id;
                    return (
                      <div
                        key={test.id}
                        className="rounded-2xl bg-slate-950/90 border border-slate-800/90 overflow-hidden transition"
                      >
                        <div
                          onClick={() => setSelectedAuditTestId(isExpanded ? null : test.id)}
                          className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/30 transition"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              test.status === 'passed' ? 'bg-emerald-400' : 'bg-rose-400'
                            }`} />
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700/60 flex-shrink-0">
                              {test.id}
                            </span>
                            <span className="text-xs font-bold text-white truncate">
                              {test.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] font-mono text-slate-500">
                              {test.durationMs}ms
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              test.status === 'passed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            }`}>
                              {test.status === 'passed' ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>
                        </div>

                        {/* Expanded details */}
                        {isExpanded && (
                          <div className="p-4 pt-2 border-t border-slate-800/80 space-y-3 bg-slate-950/60 text-xs">
                            <p className="text-slate-300 leading-relaxed">
                              {test.details}
                            </p>

                            {/* Assertions */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                                {lang === 'th' ? 'การทดสอบความถูกต้อง (Assertions)' : 'Verification Assertions'}
                              </span>
                              <div className="space-y-1">
                                {test.assertionResults.map((asst, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 flex items-start justify-between gap-2"
                                  >
                                    <div className="flex items-start gap-2">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                      <span className="text-slate-200 text-[11px] leading-tight">
                                        {asst.assertion}
                                      </span>
                                    </div>
                                    <div className="text-[10px] font-mono text-right flex-shrink-0">
                                      <span className="text-slate-400">Exp: </span>
                                      <span className="text-slate-300">{asst.expected}</span>
                                      <span className="text-slate-500"> | </span>
                                      <span className="text-emerald-400 font-semibold">{asst.actual}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Execution Logs */}
                            {test.logs.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                                  {lang === 'th' ? 'บันทึกการประมวลผล (Audit Logs)' : 'Audit Execution Logs'}
                                </span>
                                <div className="p-2.5 rounded-xl bg-slate-900 font-mono text-[10px] text-slate-300 space-y-0.5 overflow-x-auto border border-slate-800">
                                  {test.logs.map((log, lIdx) => (
                                    <div key={lIdx} className="text-slate-400 hover:text-slate-200">
                                      {log}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
              <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">
                  {lang === 'th' ? 'พร้อมทำการตรวจสอบ Smart Contract' : 'Ready to Run Contract Audit'}
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {lang === 'th'
                    ? 'คลิกปุ่มด้านล่างเพื่อเริ่มการทดสอบตรรกะ 3-Rank, Ghost Re-entry, FIFO Queue, และความถูกต้องตาม Solidity ABI'
                    : 'Click below to verify 3-rank matrix math, ghost re-entry rules, FIFO queue sequencing, and ABI compliance.'}
                </p>
              </div>
              <button
                onClick={handleRunAudit}
                disabled={isAuditing}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                <span>{lang === 'th' ? 'เริ่มตรวจสอบสัญญาเดี๋ยวนี้' : 'Run Verification Audit Now'}</span>
              </button>
            </div>
          )}
        </div>
      )}
      {(activeCategory === 'all' || activeCategory === 'system') && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <span className="text-sm font-bold text-white">
                {lang === 'th' ? 'สถานะตัวแปรระบบบน Smart Contract (On-Chain System State)' : 'On-Chain System State Variables'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {isLoadingStats ? 'Syncing with BSC Mainnet...' : 'Synchronized with BSC Mainnet (Live)'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-mono">owner()</span>
              <span className="text-xs font-mono font-bold text-sky-300 truncate block mt-0.5" title={contractLiveStats?.owner || CONTRACT_OWNER}>
                {(contractLiveStats?.owner || CONTRACT_OWNER).slice(0, 6)}...{(contractLiveStats?.owner || CONTRACT_OWNER).slice(-4)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-mono">paused()</span>
              <span className={`text-xs font-mono font-bold flex items-center gap-1 mt-0.5 ${contractLiveStats?.paused ? 'text-rose-400' : 'text-emerald-400'}`}>
                {contractLiveStats?.paused ? <PauseCircle className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
                {contractLiveStats?.paused ? 'PAUSED' : 'ACTIVE (UNPAUSED)'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-mono">activeNodePointer()</span>
              <span className="text-xs font-mono font-bold text-amber-300 block mt-0.5">
                Index #{contractLiveStats?.activeNodePointer ?? 1}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-mono">headRebornIndex()</span>
              <span className="text-xs font-mono font-bold text-purple-300 block mt-0.5">
                Head #{contractLiveStats?.headRebornIndex ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-mono">tailRebornIndex()</span>
              <span className="text-xs font-mono font-bold text-indigo-300 block mt-0.5">
                Tail #{contractLiveStats?.tailRebornIndex ?? 0}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block font-mono">globalPool()</span>
              <span className="text-xs font-mono font-bold text-emerald-300 truncate block mt-0.5" title={contractLiveStats?.globalPool || '0x0000000000000000000000000000000000000000'}>
                {(contractLiveStats?.globalPool || '0x0000...0000').slice(0, 6)}...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Events Hub Section */}
      {(activeCategory === 'all' || activeCategory === 'events') && (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-amber-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white">
                  {lang === 'th' ? 'เหตุการณ์ Smart Contract (On-Chain Contract Events)' : 'On-Chain Contract Event Definitions'}
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[11px] font-mono font-bold">
                5 Verified Events
              </span>
            </div>

            {/* Events Specification Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {CONTRACT_EVENTS_METADATA.map((ev) => (
                <div key={ev.name} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-amber-300 flex items-center gap-1.5">
                      <Zap className="w-3 h-3 text-amber-400" />
                      event {ev.name}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono text-[9px]">
                      indexed
                    </span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-900 font-mono text-[10px] text-slate-300 select-all overflow-x-auto">
                    {ev.signature}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {lang === 'th' ? ev.descTh : ev.descEn}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* MySQL Database Integration & Events Export Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950/40 to-slate-900 border border-emerald-500/40 shadow-xl space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    {lang === 'th' ? 'ระบบนำข้อมูล Events ไปลงฐานข้อมูล MySQL' : 'MySQL Events Database & Sync Hub'}
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                      MySQL 8.0+ Ready
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {lang === 'th' 
                      ? 'โครงสร้างตารางมาตรฐาน 6 ตาราง รองรับ Master Log, สมาชิก, รางวัล, การอัปเกรด, Reborn และสถานะระบบ พร้อม Indexing'
                      : 'Normalized 6-table schema with indexed master logs, registration, payouts, upgrades, reborn queue & pauses'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                  {lang === 'th' ? 'จำนวนเหตุการณ์พร้อมซิงค์:' : 'Events Ready:'}{' '}
                  <strong className="text-emerald-400">{eventLogs.length > 0 ? eventLogs.length : matrixContract.getContractEvents().length}</strong>
                </span>
              </div>
            </div>

            {/* Action buttons toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* 1. Download .SQL File */}
              <button
                onClick={handleExportMysqlFile}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono transition shadow-lg shadow-emerald-950/40"
              >
                <Download className="w-4 h-4" />
                <span>{lang === 'th' ? 'ดาวน์โหลดไฟล์ .SQL Dump' : 'Export .SQL Dump'}</span>
              </button>

              {/* 2. Copy SQL Script */}
              <button
                onClick={handleCopyMysqlSql}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs font-mono transition"
              >
                {copiedMysqlSql ? (
                  <>
                    <CheckCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">{lang === 'th' ? 'คัดลอก SQL แล้ว!' : 'SQL Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-sky-400" />
                    <span>{lang === 'th' ? 'คัดลอกคำสั่ง MySQL (SQL)' : 'Copy SQL Queries'}</span>
                  </>
                )}
              </button>

              {/* 3. Sync to API Route */}
              <button
                onClick={handleSyncMysqlApi}
                disabled={isSyncingMysql}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs font-mono transition shadow-lg shadow-sky-950/40 disabled:opacity-50"
              >
                <Server className={`w-4 h-4 ${isSyncingMysql ? 'animate-spin' : ''}`} />
                <span>{isSyncingMysql ? 'Syncing...' : (lang === 'th' ? 'ซิงค์เข้า MySQL (API)' : 'Sync to MySQL API')}</span>
              </button>

              {/* 4. View Schema DDL */}
              <button
                onClick={() => setShowMysqlSchemaModal(true)}
                className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs font-mono transition"
              >
                <Table className="w-4 h-4 text-amber-400" />
                <span>{lang === 'th' ? 'ดูโครงสร้างตาราง (DDL)' : 'View MySQL Schema'}</span>
              </button>
            </div>

            {/* Sync Feedback Message */}
            {mysqlSyncStatus && (
              <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold">{mysqlSyncStatus.message}</div>
                  <div className="text-[11px] text-slate-400">
                    {lang === 'th'
                      ? 'คุณสามารถใช้ไฟล์ SQL หรือเรียกใช้งาน Endpoint /api/events/mysql-sync เพื่อรับข้อมูลแบบ Real-time ได้ตลอดเวลา'
                      : 'You can use the exported SQL script or call /api/events/mysql-sync to receive live structured events.'}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal: MySQL Schema & Table Structure */}
          {showMysqlSchemaModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl bg-slate-900 border border-sky-500/50 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {lang === 'th' ? 'โครงสร้างฐานข้อมูล MySQL (wealthlifecycle_db DDL Schema)' : 'MySQL DDL Schema (wealthlifecycle_db)'}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {lang === 'th' ? 'สร้างตาราง 6 ตารางพร้อม Indexes และ Foreign Relationships' : '6 normalized relational tables with indexing'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(MYSQL_SCHEMA_DDL);
                        showToast('Schema Copied', 'MySQL Schema copied to clipboard', 'success');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-mono text-white flex items-center gap-1.5 transition"
                    >
                      <Copy className="w-3.5 h-3.5 text-sky-400" />
                      <span>{lang === 'th' ? 'คัดลอก DDL' : 'Copy DDL'}</span>
                    </button>
                    <button
                      onClick={() => setShowMysqlSchemaModal(false)}
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="font-bold text-sky-400">1. contract_events_master</div>
                      <div className="text-slate-400 text-[10px]">บันทึกทุก Event, Raw JSON, Block, Hash</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="font-bold text-emerald-400">2. events_registered</div>
                      <div className="text-slate-400 text-[10px]">ตารางสมาชิก, Sponsor, Reborn, Ghost</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="font-bold text-amber-400">3. events_reward_paid</div>
                      <div className="text-slate-400 text-[10px]">ตารางโบนัส USDT, Wei, ประเภทรางวัล</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="font-bold text-purple-400">4. events_auto_upgraded</div>
                      <div className="text-slate-400 text-[10px]">ตารางการอัปเกรด Rank 2 / Rank 3</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="font-bold text-pink-400">5. events_reborn_queued</div>
                      <div className="text-slate-400 text-[10px]">ตารางวัฏจักร 7 รหัส Reborn เข้าคิว</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="font-bold text-red-400">6. events_system_paused</div>
                      <div className="text-slate-400 text-[10px]">ตารางสถานะเปิด/หยุดระบบฉุกเฉิน</div>
                    </div>
                  </div>

                  <div className="relative">
                    <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-[11px] leading-relaxed overflow-x-auto select-all">
                      {MYSQL_SCHEMA_DDL}
                    </pre>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Charset: utf8mb4_unicode_ci | Engine: InnoDB
                  </span>
                  <button
                    onClick={() => setShowMysqlSchemaModal(false)}
                    className="px-4 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs font-mono transition"
                  >
                    {lang === 'th' ? 'ปิดหน้าต่าง' : 'Close'}
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* Interactive Live BSC Events Explorer */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-sky-500/40 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold text-white">
                  {lang === 'th' ? 'เครื่องมือค้นหาและตรวจดู Live Events บน BSC Mainnet' : 'Live BSC Event Explorer'}
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Block range selector */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-mono">
                  <span className="text-slate-400 px-1.5 text-[10px]">Range:</span>
                  {[
                    { label: '5K (~4h)', value: 5000 },
                    { label: '20K (~16h)', value: 20000 },
                    { label: '50K (~40h)', value: 50000 },
                    { label: '100K (~3.5d)', value: 100000 }
                  ].map((r) => (
                    <button
                      key={r.value}
                      onClick={() => {
                        setEventBlockRange(r.value);
                        handleFetchEvents(selectedEventName, r.value);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                        eventBlockRange === r.value
                          ? 'bg-sky-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handleFetchEvents(selectedEventName)}
                  disabled={isLoadingEvents}
                  className="px-3 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingEvents ? 'animate-spin' : ''}`} />
                  <span>{isLoadingEvents ? 'Fetching...' : (lang === 'th' ? 'ค้นหา Events' : 'Refresh Events')}</span>
                </button>
              </div>
            </div>

            {/* Filter pills and Search input */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                {['ALL', 'Registered', 'RewardPaid', 'RewardForfeited', 'AutoUpgraded', 'RebornQueued', 'SystemPaused'].map((name) => (
                  <button
                    key={name}
                    onClick={() => {
                      setSelectedEventName(name);
                      handleFetchEvents(name);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition ${
                      selectedEventName === name
                        ? 'bg-sky-500 text-slate-950 shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {name === 'ALL' ? 'All Events' : name}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-60">
                <input
                  type="text"
                  value={eventSearchKeyword}
                  onChange={(e) => setEventSearchKeyword(e.target.value)}
                  placeholder={lang === 'th' ? 'กรองด้วย Address / ID / Note...' : 'Filter Address / ID / Note...'}
                  className="w-full px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                {eventSearchKeyword && (
                  <button
                    onClick={() => setEventSearchKeyword('')}
                    className="absolute right-2 top-1.5 text-slate-500 hover:text-slate-300 text-[10px]"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Event Logs List */}
            <div className="space-y-2 mt-2">
              {isLoadingEvents ? (
                <div className="p-6 text-center bg-slate-950 rounded-xl border border-slate-800">
                  <RefreshCw className="w-5 h-5 animate-spin text-sky-400 mx-auto mb-2" />
                  <span className="text-[11px] text-slate-400 font-mono">
                    {lang === 'th' ? `กำลังดึง Event Logs จาก BSC Mainnet (${eventBlockRange.toLocaleString()} blocks ล่าสุด)...` : `Querying on-chain event logs from BSC Mainnet (last ${eventBlockRange.toLocaleString()} blocks)...`}
                  </span>
                </div>
              ) : (() => {
                const filtered = eventLogs.filter((log) => {
                  if (!eventSearchKeyword.trim()) return true;
                  const kw = eventSearchKeyword.toLowerCase().trim();
                  if (log.eventName.toLowerCase().includes(kw)) return true;
                  if (log.txHash.toLowerCase().includes(kw)) return true;
                  if (String(log.blockNumber).includes(kw)) return true;
                  if (log.formattedSummary && log.formattedSummary.toLowerCase().includes(kw)) return true;
                  return Object.values(log.args).some((v) => String(v).toLowerCase().includes(kw));
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-6 text-center bg-slate-950 rounded-xl border border-slate-800">
                      <Bell className="w-5 h-5 text-slate-600 mx-auto mb-2" />
                      <p className="text-[11px] text-slate-400">
                        {eventSearchKeyword 
                          ? (lang === 'th' ? 'ไม่พบเหตุการณ์ที่ตรงกับคำค้นหา' : 'No events matching search filter')
                          : (lang === 'th' 
                              ? `ไม่พบรายการเหตุการณ์ในช่วง ${eventBlockRange.toLocaleString()} บล็อกล่าสุด สามารถเลือก Range กว้างขึ้นหรือกด Refresh` 
                              : `No event logs in the last ${eventBlockRange.toLocaleString()} blocks. Select a larger range or click Refresh.`)}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="divide-y divide-slate-800 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden font-mono text-[11px]">
                    <div className="px-3 py-1.5 bg-slate-900/80 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>{lang === 'th' ? `แสดง ${filtered.length} รายการเหตุการณ์` : `Displaying ${filtered.length} event(s)`}</span>
                      <span>BSC Contract: {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}</span>
                    </div>
                    {filtered.map((log, idx) => (
                      <div key={`${log.txHash}-${idx}`} className="p-3 hover:bg-slate-900/60 transition space-y-1.5">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.eventName === 'Registered' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                              log.eventName === 'RewardPaid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              log.eventName === 'AutoUpgraded' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                              log.eventName === 'RebornQueued' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {log.eventName}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              Block #{log.blockNumber}
                            </span>
                          </div>

                          <a
                            href={`${BSC_CONFIG.blockExplorerUrls[0]}/tx/${log.txHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 text-[10px]"
                          >
                            TX: {log.txHash.slice(0, 8)}...{log.txHash.slice(-6)}
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>

                        {log.formattedSummary && (
                          <div className="text-emerald-300/90 font-sans text-xs">
                            {log.formattedSummary}
                          </div>
                        )}

                        {/* Args display */}
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-[10px] text-slate-300 space-y-0.5">
                          {Object.entries(log.args).map(([k, v]) => (
                            <div key={k} className="flex items-center gap-1.5">
                              <span className="text-slate-500">{k}:</span>
                              <span className="text-sky-200 font-bold truncate">{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Read Functions Grid */}
      {(activeCategory === 'all' || activeCategory === 'read' || activeCategory === 'user') && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. walletToIds(address, idx) */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-sky-500/30 hover:border-sky-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-sky-400">
                  walletToIds(address, idx)
                </span>
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold">
                  view returns (uint256)
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'ดึงรายชื่อ User ID ทั้งหมดที่ผูกกับ Wallet Address นี้ (รองรับ Multicall)'
                  : 'Fetches all registered User IDs owned by this wallet address.'}
              </p>

              <form onSubmit={handleQueryWalletToIds} className="flex gap-2">
                <input
                  type="text"
                  placeholder="0x... Wallet Address"
                  value={queryWalletAddr}
                  onChange={(e) => setQueryWalletAddr(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-[11px] text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={isQueryingWallet}
                  className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-1.5 shrink-0"
                >
                  {isQueryingWallet ? <Coins className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Fetch</span>
                </button>
              </form>

              {walletIdsResult && (
                <div className="mt-3 p-3 rounded-xl bg-sky-950/40 border border-sky-500/40 font-mono text-xs">
                  <div className="text-slate-400 text-[11px] mb-1">Results for {walletIdsResult.wallet.slice(0, 8)}...:</div>
                  {walletIdsResult.ids.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {walletIdsResult.ids.map(id => (
                        <span key={id} className="px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-300 font-bold text-xs">
                          ID #{id}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-amber-400 text-xs font-semibold">No IDs registered for this wallet</span>
                  )}
                </div>
              )}
            </div>

            {/* 2. idToWallet(uint256 id) */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 hover:border-indigo-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-indigo-400">
                  idToWallet(uint256 id)
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                  view returns (address)
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'ค้นหากระเป๋า Wallet Address ที่เป็นเจ้าของ User ID หรือ Node นั้น'
                  : 'Returns the owner wallet address assigned to a specific User ID.'}
              </p>

              <form onSubmit={handleQueryIdToWallet} className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="User ID (e.g. 1)"
                  value={queryIdToWalletInput}
                  onChange={(e) => setQueryIdToWalletInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isQueryingIdToWallet}
                  className="px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs font-mono transition flex items-center gap-1.5 shrink-0"
                >
                  {isQueryingIdToWallet ? <Coins className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  <span>Find</span>
                </button>
              </form>

              {idToWalletResult && (
                <div className="mt-3 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/40 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Owner of ID #{idToWalletResult.id}:</span>
                    {idToWalletResult.isGhost && (
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px]">Ghost</span>
                    )}
                  </div>
                  <div className="text-indigo-300 font-bold text-xs mt-1 truncate select-all">
                    {idToWalletResult.wallet}
                  </div>
                </div>
              )}
            </div>

            {/* 3. idTotalEarned(uint256 id) */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-emerald-400">
                  idTotalEarned(uint256 id)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  view returns (uint256)
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'เรียกอ่านรายได้สะสมทั้งหมด (USDT) ของผู้ใช้ตาม Member ID โดยตรงจาก Smart Contract'
                  : 'Returns total accumulated USDT earnings for a given member ID directly from the contract.'}
              </p>

              <form onSubmit={handleQueryEarned} className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Enter User ID (e.g. 1)"
                  value={queryId}
                  onChange={(e) => setQueryId(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isQuerying}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-1.5 shrink-0"
                >
                  {isQuerying ? <Coins className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                  <span>Query</span>
                </button>
              </form>

              {queryResult && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-300">idTotalEarned(#{queryResult.id}):</span>
                  <span className="text-emerald-400 font-black text-sm">
                    {queryResult.earned.toFixed(2)} USDT
                  </span>
                </div>
              )}
            </div>

            {/* 4. rank1Users(uint256 id) */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-cyan-400">
                  rank1Users(uint256 id)
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
                  view returns (struct)
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'เรียกอ่านข้อมูลโครงสร้าง Node ใน Rank 1 (isActive, sponsorId, placementId, pendingRebornFunds)'
                  : 'Reads struct info of a Rank 1 node: sponsor, placement, ghost status, and reborn funds.'}
              </p>

              <form onSubmit={handleQueryRank1User} className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="User ID (e.g. 1)"
                  value={queryRank1UserInput}
                  onChange={(e) => setQueryRank1UserInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={isQueryingRank1User}
                  className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-1.5 shrink-0"
                >
                  {isQueryingRank1User ? <Coins className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Inspect</span>
                </button>
              </form>

              {rank1UserResult && (
                <div className="mt-3 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 font-mono text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">ID #{rank1UserResult.id}:</span>
                    <span className={rank1UserResult.isActive ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                      {rank1UserResult.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sponsor ID:</span>
                    <span className="text-sky-300 font-bold">#{rank1UserResult.sponsorId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Placement ID:</span>
                    <span className="text-amber-300 font-bold">#{rank1UserResult.placementId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Reborn Funds:</span>
                    <span className="text-purple-300 font-bold">{rank1UserResult.pendingRebornFunds.toFixed(2)} USDT</span>
                  </div>
                </div>
              )}
            </div>

            {/* 5. getWalletTotalEarned(address _wallet) */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-teal-500/30 hover:border-teal-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-teal-400">
                  getWalletTotalEarned(address)
                </span>
                <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] font-mono font-bold">
                  view returns (uint256)
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'เรียกอ่านรายได้สะสมรวมทั้งหมดของทุก ID ภายใต้กระเป๋าเดียวโดยอัตโนมัติ'
                  : 'Calculates total accumulated earnings across all IDs owned by a wallet.'}
              </p>

              <form onSubmit={handleQueryWalletTotalEarned} className="flex gap-2">
                <input
                  type="text"
                  placeholder="0x... Wallet Address"
                  value={queryWalletTotalEarnedAddr}
                  onChange={(e) => setQueryWalletTotalEarnedAddr(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-[11px] text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  disabled={isQueryingWalletTotalEarned}
                  className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-1.5 shrink-0"
                >
                  {isQueryingWalletTotalEarned ? <Coins className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                  <span>Sum</span>
                </button>
              </form>

              {walletTotalEarnedResult && (
                <div className="mt-3 p-3 rounded-xl bg-teal-950/40 border border-teal-500/40 flex items-center justify-between font-mono text-xs">
                  <span className="text-slate-300">Total Wallet Income:</span>
                  <span className="text-teal-300 font-black text-sm">
                    {walletTotalEarnedResult.totalEarned.toFixed(2)} USDT
                  </span>
                </div>
              )}
            </div>

            {/* 6. getWalletAvailableRank1Nodes(address) */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-pink-500/30 hover:border-pink-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-pink-400">
                  getWalletAvailableRank1Nodes(address)
                </span>
                <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 text-[10px] font-mono font-bold">
                  view returns (uint256[], uint256[])
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'ดึง Node ID ที่ยังมีช่องว่างใน Rank 1 (< 4 คน) พร้อมจำนวน Downline ปัจจุบัน'
                  : 'Returns list of available Rank 1 nodes with unfilled slots along with downline counts.'}
              </p>

              <form onSubmit={handleQueryAvailableNodes} className="flex gap-2">
                <input
                  type="text"
                  placeholder="0x... Wallet Address"
                  value={queryAvailableNodesAddr}
                  onChange={(e) => setQueryAvailableNodesAddr(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-[11px] text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                />
                <button
                  type="submit"
                  disabled={isQueryingAvailableNodes}
                  className="px-3.5 py-2 rounded-xl bg-pink-500 hover:bg-pink-400 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-1.5 shrink-0"
                >
                  {isQueryingAvailableNodes ? <Coins className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Check</span>
                </button>
              </form>

              {availableNodesResult && (
                <div className="mt-3 p-3 rounded-xl bg-pink-950/40 border border-pink-500/40 font-mono text-xs">
                  {availableNodesResult.availableIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {availableNodesResult.availableIds.map((id, idx) => (
                        <span key={id} className="px-2 py-0.5 rounded bg-pink-500/20 border border-pink-400/30 text-pink-300 text-[11px] font-bold">
                          ID #{id} ({availableNodesResult.downlineCounts[idx] || 0}/4)
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-xs">No open nodes found</span>
                  )}
                </div>
              )}
            </div>

            {/* 7. getGlobalQueuePaginated Card */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-purple-400">
                  getGlobalQueuePaginated(rank, start, limit)
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
                  view returns
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'ดึงข้อมูลคิวสากล Rank 2 และ Rank 3 แบบแบ่งหน้า เริ่มต้นจาก Head ปัจจุบัน'
                  : 'Fetches paginated Rank 2 and Rank 3 Global FIFO queue starting from current head.'}
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Status:</span>
                <span className="text-purple-300 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Integrated in Live Matrix Tab
                </span>
              </div>
            </div>

            {/* 8. getTeamTree Info Card */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-cyan-400">
                  getTeamTree(uint256 _rootId)
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
                  view returns (MatrixNodeView[])
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'ดึงข้อมูลผังเมทริกซ์ 2 ระดับ (Root + 4 Direct + 16 Sub-nodes) สำหรับแสดงผลแผนผังองค์กร'
                  : 'Retrieves complete 2-level team tree hierarchy including placement IDs and ghost flags.'}
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Status:</span>
                <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Integrated in Live Matrix Tab
                </span>
              </div>
            </div>

            {/* 9. rankPrices(uint256) Info Card */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-emerald-400">
                  rankPrices(uint256 rank)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  view returns (uint256)
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'ราคาค่าธรรมเนียมการเข้าแต่ละระดับ: Rank 1 = 2 USDT, Rank 2 = 4 USDT, Rank 3 = 8 USDT'
                  : 'Entry prices for ranks: Rank 1 (2 USDT), Rank 2 (4 USDT), Rank 3 (8 USDT).'}
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Prices:</span>
                <span className="text-emerald-300 font-bold">R1: 2$ | R2: 4$ | R3: 8$</span>
              </div>
            </div>

            {/* 10. checkParentValid(uint256 parentId) */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-violet-500/30 hover:border-violet-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-violet-400">
                  checkParentValid(uint256 parentId)
                </span>
                <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 text-[10px] font-mono font-bold">
                  view returns (bool, bool, uint256)
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'ตรวจสอบความถูกต้องของ Parent ID (Active, ยังไม่หมดอายุ, และมี Downline < 4 ในผังสายงาน)'
                  : 'Validates parent node: checks active status, expiration, and ensures downline count < 4.'}
              </p>

              <form onSubmit={handleQueryParentValid} className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Parent User ID (e.g. 1)"
                  value={queryParentIdInput}
                  onChange={(e) => setQueryParentIdInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
                />
                <button
                  type="submit"
                  disabled={isQueryingParent}
                  className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs font-mono transition flex items-center gap-1.5 shrink-0"
                >
                  {isQueryingParent ? <Coins className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Check</span>
                </button>
              </form>

              {parentValidResult && (
                <div className="mt-3 p-3 rounded-xl bg-violet-950/40 border border-violet-500/40 font-mono text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Parent #{parentValidResult.parentId}:</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      parentValidResult.isValid
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {parentValidResult.isValid ? '✓ Valid for Placement' : '✗ Cannot Accept Downlines'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-1 text-[11px]">
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Active:</span>
                      <span className={parentValidResult.isActive ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                        {parentValidResult.isActive ? 'YES' : 'NO'}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Expired:</span>
                      <span className={parentValidResult.isExpired ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {parentValidResult.isExpired ? 'EXPIRED' : 'ACTIVE'}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Downlines:</span>
                      <span className="text-violet-300 font-bold">
                        {parentValidResult.downlineCount}/4
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* isIdExpired(uint256 userId) */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-red-500/30 hover:border-red-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-red-400">
                  isIdExpired(uint256)
                </span>
                <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-mono font-bold">
                  view returns (bool)
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'ตรวจสอบว่ารหัส User ID นี้หมดอายุ (เกิน 7 วันนับจากรอบล่าสุด) หรือไม่'
                  : 'Checks whether this User ID is currently expired according to the 7-day rule.'}
              </p>

              <form onSubmit={handleQueryIsExpired} className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="User ID (e.g. 1)"
                  value={queryIsExpiredId}
                  onChange={(e) => setQueryIsExpiredId(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  disabled={isQueryingIsExpired}
                  className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs font-mono transition flex items-center gap-1.5 shrink-0"
                >
                  {isQueryingIsExpired ? <Coins className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Check</span>
                </button>
              </form>

              {isExpiredResult && (
                <div className={`mt-3 p-3 rounded-xl border font-mono text-xs flex items-center justify-between ${
                  isExpiredResult.isExpired
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                    : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                }`}>
                  <span className="text-slate-300">ID #{isExpiredResult.userId} Status:</span>
                  <span className="font-bold flex items-center gap-1">
                    {isExpiredResult.isExpired ? (
                      <>
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>EXPIRED (หมดอายุ)</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ACTIVE (ปกติ)</span>
                      </>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* getWalletExpiredIdsAndTotalEarned(address wallet) */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-orange-500/30 hover:border-orange-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-orange-400">
                  getWalletExpiredIdsAndTotalEarned(address)
                </span>
                <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 text-[10px] font-mono font-bold">
                  view returns (uint256[], uint256[])
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'ดึงรายการรหัสที่หมดอายุทั้งหมดของกระเป๋า พร้อมยอดรายได้สะสมของแต่ละรหัส'
                  : 'Returns all expired User IDs and their earned amounts for a given wallet address.'}
              </p>

              <form onSubmit={handleQueryWalletExpired} className="flex gap-2">
                <input
                  type="text"
                  placeholder="0x... Wallet Address"
                  value={queryExpiredWalletAddr}
                  onChange={(e) => setQueryExpiredWalletAddr(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-[11px] text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  disabled={isQueryingWalletExpired}
                  className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-1.5 shrink-0"
                >
                  {isQueryingWalletExpired ? <Coins className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Scan</span>
                </button>
              </form>

              {walletExpiredResult && (
                <div className="mt-3 p-3 rounded-xl bg-orange-950/40 border border-orange-500/40 font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Expired Count:</span>
                    <span className="text-orange-300 font-bold">{walletExpiredResult.expiredIds.length} IDs</span>
                  </div>
                  {walletExpiredResult.expiredIds.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {walletExpiredResult.expiredIds.map((id, idx) => (
                        <span key={id} className="px-2 py-0.5 rounded bg-orange-500/20 border border-orange-400/30 text-orange-300 text-[11px]">
                          #{id} ({walletExpiredResult.earnedAmounts[idx]?.toFixed(1) || 0} USDT)
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[11px] block">No expired IDs for this wallet</span>
                  )}
                </div>
              )}
            </div>

            {/* 11. deployTime() Info Card */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-blue-500/30">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-blue-400">
                  deployTime()
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold">
                  view returns (uint256)
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'เวลา Unix Timestamp ที่สัญญา Smart Contract ถูก Deploy และเริ่มต้นทำงานบน BSC Mainnet'
                  : 'Contract deployment Unix timestamp on Binance Smart Chain Mainnet.'}
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Deployed:</span>
                <span className="text-blue-300 font-bold">
                  {contractLiveStats?.deployTime && contractLiveStats.deployTime > 0
                    ? new Date(contractLiveStats.deployTime * 1000).toLocaleString()
                    : 'BSC Mainnet Verified'}
                </span>
              </div>
            </div>

            {/* 12. getPlatformStats() Platform Period Stats Card */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span className="font-mono text-xs font-bold text-amber-400">
                    getPlatformStats()
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleQueryPlatformStats}
                    disabled={isQueryingPlatformStats}
                    className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold font-mono transition flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isQueryingPlatformStats ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                    view returns (PeriodStat[4])
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'สถิติภาพรวมแพลตฟอร์มแบบแบ่งตามช่วงเวลา (24 ชั่วโมง, 7 วัน, 30 วัน, และสะสมทั้งหมด)'
                  : 'Aggregated platform statistics across periods: 24h (Day), 7d (Week), 30d (Month), and All-Time.'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                {[
                  { label: '24 Hours (Day)', data: platformStatsResult?.day1, color: 'text-sky-400' },
                  { label: '7 Days (Week)', data: platformStatsResult?.week1, color: 'text-indigo-400' },
                  { label: '30 Days (Month)', data: platformStatsResult?.month1, color: 'text-purple-400' },
                  { label: 'All-Time Total', data: platformStatsResult?.allTime, color: 'text-emerald-400' }
                ].map((col, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 block">{col.label}</span>
                    <div className="text-xs font-bold text-white">
                      Members: <span className={col.color}>{col.data?.membersCount ?? 0}</span>
                    </div>
                    <div className="text-[11px] text-slate-300">
                      Volume: <span className="text-emerald-400 font-bold">{(col.data?.totalVolume ?? 0).toFixed(2)} $</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 13. getPlatformAnalytics(uint256 periodSeconds) */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 md:col-span-2">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono text-xs font-bold text-cyan-400">
                    getPlatformAnalytics(uint256 periodSeconds)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: 'All-Time', value: 0 },
                    { label: '24h', value: 86400 },
                    { label: '7d', value: 604800 },
                    { label: '30d', value: 2592000 }
                  ].map((p) => (
                    <button
                      key={p.value}
                      onClick={() => {
                        setQueryAnalyticsPeriod(p.value);
                        handleQueryPlatformAnalytics(p.value);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition ${
                        queryAnalyticsPeriod === p.value
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                  <button
                    onClick={() => handleQueryPlatformAnalytics()}
                    disabled={isQueryingAnalytics}
                    className="px-2.5 py-0.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[10px] font-bold font-mono transition flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isQueryingAnalytics ? 'animate-spin' : ''}`} />
                    <span>Query</span>
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'ข้อมูลวิเคราะห์เชิงลึก: ยอดลงทุนสะสม, จำนวนสมาชิกในคิว, การกระจายตัวใน Rank 1-3, Ghost ที่รอเสก, และผู้มียอดสูงสุด'
                  : 'Deep analytics: total investment volume, queue waiting count, member counts across Ranks 1-3, pending ghost pushes, and top performers.'}
              </p>

              {platformAnalyticsResult && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Total Investment</span>
                    <span className="text-cyan-300 font-bold text-sm">
                      {platformAnalyticsResult.totalInvestment.toFixed(2)} USDT
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Queue Waiting</span>
                    <span className="text-amber-300 font-bold text-sm">
                      {platformAnalyticsResult.queueWaitingCount} Nodes
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">R1 / R2 / R3 Distribution</span>
                    <span className="text-emerald-300 font-bold text-xs">
                      {platformAnalyticsResult.r1Count} / {platformAnalyticsResult.r2Count} / {platformAnalyticsResult.r3Count}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block">Pending Ghosts / Funds</span>
                    <span className="text-purple-300 font-bold text-xs">
                      {platformAnalyticsResult.pendingGhosts} ({platformAnalyticsResult.totalPendingFunds.toFixed(2)} $)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 14. hasReachedRank2(uint256 userId) Card */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/30 hover:border-indigo-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-indigo-400">
                  hasReachedRank2(userId)
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                  view returns (bool)
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'ตรวจสอบว่ารหัส User ID นี้เคยเลื่อนขั้นเข้าสู่ Rank 2 แล้วหรือไม่'
                  : 'Checks if the user has previously reached Rank 2.'}
              </p>
              <form onSubmit={handleQueryHasReachedRank2} className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="User ID"
                  value={queryHasReachedRank2Id}
                  onChange={(e) => setQueryHasReachedRank2Id(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isQueryingHasReachedRank2}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs font-mono transition flex items-center gap-1.5 shrink-0"
                >
                  {isQueryingHasReachedRank2 ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Check</span>
                </button>
              </form>
              {hasReachedRank2Result && (
                <div className={`mt-3 p-3 rounded-xl border font-mono text-xs flex items-center justify-between ${
                  hasReachedRank2Result.reached
                    ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}>
                  <span className="text-slate-400">ID #{hasReachedRank2Result.userId}:</span>
                  <span className="font-bold flex items-center gap-1">
                    {hasReachedRank2Result.reached ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Reached Rank 2</span>
                      </>
                    ) : (
                      <span>Not Reached Rank 2</span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* 15. latestRebornId(uint256 userId) Card */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-teal-500/30 hover:border-teal-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-teal-400">
                  latestRebornId(userId)
                </span>
                <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] font-mono font-bold">
                  view returns (uint256)
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'ดึง User ID ล่าสุดที่เกิดจากการ Reborn ต่อเนื่องของรหัสตั้งต้นนี้'
                  : 'Retrieves the newest reborn ID linked to the original user ID.'}
              </p>
              <form onSubmit={handleQueryLatestRebornId} className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Original User ID"
                  value={queryLatestRebornIdInput}
                  onChange={(e) => setQueryLatestRebornIdInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  disabled={isQueryingLatestRebornId}
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs font-mono transition flex items-center gap-1.5 shrink-0"
                >
                  {isQueryingLatestRebornId ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Check</span>
                </button>
              </form>
              {latestRebornIdResult && (
                <div className="mt-3 p-3 rounded-xl bg-teal-950/40 border border-teal-500/40 font-mono text-xs flex items-center justify-between text-teal-300">
                  <span className="text-slate-400">Original ID #{latestRebornIdResult.originalId}:</span>
                  <span className="font-bold text-emerald-300">
                    Latest ID: #{latestRebornIdResult.latestId}
                  </span>
                </div>
              )}
            </div>

            {/* 16. userRank2Ptr & userRank3Ptr Card */}
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-fuchsia-500/30 hover:border-fuchsia-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-fuchsia-400">
                  userRank2Ptr / userRank3Ptr(id)
                </span>
                <span className="px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 text-[10px] font-mono font-bold">
                  view returns (uint256)
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'ตรวจสอบตำแหน่ง Queue Pointer ของรหัสในคิวสากล Rank 2 และ Rank 3'
                  : 'Queries queue index pointer in global Rank 2 and Rank 3 queues.'}
              </p>
              <form onSubmit={handleQueryUserRankPtr} className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="User ID"
                  value={queryUserRankPtrId}
                  onChange={(e) => setQueryUserRankPtrId(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-fuchsia-500"
                />
                <button
                  type="submit"
                  disabled={isQueryingUserRankPtr}
                  className="px-3.5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs font-mono transition flex items-center gap-1.5 shrink-0"
                >
                  {isQueryingUserRankPtr ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Check</span>
                </button>
              </form>
              {userRankPtrResult && (
                <div className="mt-3 p-3 rounded-xl bg-fuchsia-950/40 border border-fuchsia-500/40 font-mono text-xs flex items-center justify-between text-fuchsia-300">
                  <span className="text-slate-400">ID #{userRankPtrResult.userId}:</span>
                  <div className="flex gap-2 text-xs font-bold">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      R2 Ptr: {userRankPtrResult.rank2Ptr}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                      R3 Ptr: {userRankPtrResult.rank3Ptr}
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* 10. getWalletAllData(address _wallet) Full Dashboard Struct Card */}
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-amber-500/40 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-amber-400" />
                <span className="font-mono text-sm font-bold text-amber-400">
                  getWalletAllData(address _wallet)
                </span>
              </div>
              <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-mono font-bold">
                view returns (UserDashboardData[])
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {lang === 'th'
                ? 'เรียกอ่านข้อมูลแดชบอร์ดครบวงจรของทุก Node ID ภายใต้กระเป๋านี้ (ID, Sponsor ID, AutoReborn, Total Earned USDT, และ Downlines ของ Rank 1, 2, 3)'
                : 'Retrieves comprehensive on-chain dashboard profile for all IDs owned by a wallet address including sponsor, earnings, and downlines across 3 ranks.'}
            </p>

            <form onSubmit={handleQueryWalletAllData} className="flex gap-2">
              <input
                type="text"
                placeholder="0x... Wallet Address"
                value={queryWalletAllDataAddr}
                onChange={(e) => setQueryWalletAllDataAddr(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                disabled={isQueryingWalletAllData}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-2 shrink-0"
              >
                {isQueryingWalletAllData ? <Coins className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                <span>Fetch getWalletAllData</span>
              </button>
            </form>

            {walletAllDataResult && (
              <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-amber-500/30 font-mono text-xs space-y-3">
                <div className="flex items-center justify-between text-slate-300 text-[11px] pb-2 border-b border-slate-800">
                  <span>Wallet: <span className="text-amber-300 font-bold">{walletAllDataResult.wallet}</span></span>
                  <span className="px-2.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">
                    {walletAllDataResult.data.length} Node(s) Found
                  </span>
                </div>

                {walletAllDataResult.data.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {walletAllDataResult.data.map((item) => (
                      <div key={item.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 font-bold text-xs">
                            ID #{item.id}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Sponsor: <span className="text-sky-300 font-bold">#{item.sponsorId}</span>
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-slate-400">Total Earned:</span>
                          <span className="text-emerald-400 font-black text-xs">
                            {item.totalEarned.toFixed(2)} USDT
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Auto Reborn:</span>
                          <span className={item.isAutoReborn ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                            {item.isAutoReborn ? 'ENABLED (ON)' : 'OFF'}
                          </span>
                        </div>

                        <div className="space-y-1 pt-1.5 text-[10px] border-t border-slate-800">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Rank 1 Downlines:</span>
                            <span className="text-sky-300 font-mono font-bold">
                              {item.rank1Downlines.length > 0 ? `[${item.rank1Downlines.join(', ')}]` : 'None (0/4)'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Rank 2 Downlines:</span>
                            <span className="text-purple-300 font-mono font-bold">
                              {item.rank2Downlines.length > 0 ? `[${item.rank2Downlines.join(', ')}]` : 'None (0/4)'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Rank 3 Downlines:</span>
                            <span className="text-amber-300 font-mono font-bold">
                              {item.rank3Downlines.length > 0 ? `[${item.rank3Downlines.join(', ')}]` : 'None (0/4)'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-slate-400 text-xs">
                    No active node IDs registered under this wallet address on-chain.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Write / State-Modifying Functions Section */}
      {(activeCategory === 'all' || activeCategory === 'write') && (
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-purple-500/30 shadow-2xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  {lang === 'th' ? 'ธุรกรรมเขียนสัญญา (State-Modifying & Admin Transactions)' : 'Write & Admin Methods'}
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-mono font-bold">
                    {isLiveWeb3 ? 'Live Web3 Connected' : 'Simulated Sandbox'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {lang === 'th'
                    ? 'เรียกทำธุรกรรมส่งคำสั่งไปยัง Smart Contract บน BSC Mainnet (ต่อ MetaMask/Bitget/Trust หรือจำลองในระบบ)'
                    : 'Execute on-chain transactions directly against WealthLifeCycle Smart Contract.'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400">
                Gas: <span className="text-emerald-400 font-bold">BEP-20 / BNB</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. renewId(uint256 _userId) */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 hover:border-emerald-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-emerald-400">
                  renewId(uint256 _userId)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  write (external)
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'ต่ออายุรหัสที่หมดอายุ 7 วันด้วยค่าธรรมเนียม 30 USDT (ใช้ยอด pending หรือ USDT ในกระเป๋า)'
                  : 'Renews an expired node for another 7-day cycle with 30 USDT fee.'}
              </p>
              <form onSubmit={handleWriteRenewId} className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="User ID"
                  value={writeRenewIdInput}
                  onChange={(e) => setWriteRenewIdInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isWritingRenew}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {isWritingRenew ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Renew</span>
                </button>
              </form>
            </div>

            {/* 2. processRebornQueue(uint256 batchSize) */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-purple-500/30 hover:border-purple-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-purple-400">
                  processRebornQueue(uint256 batchSize)
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono font-bold">
                  write (external)
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'ประมวลผลคิว Reborn อัตโนมัติ (เสก 7 รหัส Ghost เข้าสู่ผัง Rank 1 ต่อรอบ)'
                  : 'Processes pending reborn items from FIFO queue to spawn 7 ghost clones in Rank 1.'}
              </p>
              <form onSubmit={handleWriteProcessReborn} className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="Batch (1-10)"
                  value={writeProcessRebornBatch}
                  onChange={(e) => setWriteProcessRebornBatch(e.target.value)}
                  className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={isWritingProcessReborn}
                  className="flex-1 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono transition flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {isWritingProcessReborn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
                  <span>Process Queue</span>
                </button>
              </form>
            </div>

            {/* 3. adminSpawnGhostRank1(uint256 rootId, uint256 amount) */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-pink-500/30 hover:border-pink-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-pink-400">
                  adminSpawnGhostRank1(rootId, amount)
                </span>
                <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 text-[10px] font-mono font-bold">
                  admin only
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'แอดมินเสก Ghost ลงในผัง Rank 1 ใต้ Root ID ที่กำหนด เพื่อเติมเต็มสายงาน'
                  : 'Admin triggers ghost placements directly into Rank 1 matrix under a target root.'}
              </p>
              <form onSubmit={handleWriteSpawnRank1} className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  placeholder="Root ID"
                  value={writeSpawnRank1RootId}
                  onChange={(e) => setWriteSpawnRank1RootId(e.target.value)}
                  className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                />
                <input
                  type="number"
                  min="1"
                  max="20"
                  placeholder="Qty"
                  value={writeSpawnRank1Amount}
                  onChange={(e) => setWriteSpawnRank1Amount(e.target.value)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                />
                <button
                  type="submit"
                  disabled={isWritingSpawnRank1}
                  className="flex-1 px-3 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs font-mono transition flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {isWritingSpawnRank1 ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Spawn R1</span>
                </button>
              </form>
            </div>

            {/* 4. adminSpawnGhostPushes(uint256 rank, uint256 amount) */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-sky-500/30 hover:border-sky-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-sky-400">
                  adminSpawnGhostPushes(rank, amount)
                </span>
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold">
                  admin only
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'แอดมินเสก Ghost Slot เข้าสู่คิวสากล Rank 2 หรือ Rank 3 เพื่อเร่งรอบหมุน'
                  : 'Pushes ghost slots into Rank 2 or Rank 3 global FIFO queue to accelerate payout rotations.'}
              </p>
              <form onSubmit={handleWriteSpawnPushes} className="flex gap-2">
                <select
                  value={writeSpawnPushRank}
                  onChange={(e) => setWriteSpawnPushRank(Number(e.target.value) as 2 | 3)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-500"
                >
                  <option value={2}>Rank 2</option>
                  <option value={3}>Rank 3</option>
                </select>
                <input
                  type="number"
                  min="1"
                  max="20"
                  placeholder="Qty"
                  value={writeSpawnPushAmount}
                  onChange={(e) => setWriteSpawnPushAmount(e.target.value)}
                  className="w-16 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={isWritingSpawnPushes}
                  className="flex-1 px-3 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs font-mono transition flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {isWritingSpawnPushes ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                  <span>Push Queue</span>
                </button>
              </form>
            </div>

            {/* 5. adminUpdateUserExpiry(uint256 _userId, uint256 _newExpiryTimestamp) */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/30 hover:border-amber-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-amber-400">
                  adminUpdateUserExpiry(userId, timestamp)
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                  admin only
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'แอดมินปรับเปลี่ยนวันหมดอายุของ User ID โดยระบุจำนวนวันเพิ่มจากเวลาปัจจุบัน'
                  : 'Updates user expiry timestamp on-chain with quick day presets.'}
              </p>
              <form onSubmit={handleWriteUpdateExpiry} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="User ID"
                    value={writeUpdateExpiryUserId}
                    onChange={(e) => setWriteUpdateExpiryUserId(e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="number"
                    min="0.1"
                    step="0.5"
                    placeholder="Days"
                    value={writeUpdateExpiryDays}
                    onChange={(e) => setWriteUpdateExpiryDays(e.target.value)}
                    className="w-20 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={isWritingUpdateExpiry}
                    className="flex-1 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    {isWritingUpdateExpiry ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Update</span>
                  </button>
                </div>
                <div className="flex items-center gap-1 pt-0.5 text-[10px] font-mono">
                  <span className="text-slate-500">Presets:</span>
                  {[3, 7, 14, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setWriteUpdateExpiryDays(String(d))}
                      className={`px-2 py-0.5 rounded transition ${
                        writeUpdateExpiryDays === String(d)
                          ? 'bg-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      +{d}d
                    </button>
                  ))}
                </div>
              </form>
            </div>

            {/* 6. adminUpdateUserWallet(uint256 _userId, address _newWallet) */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/30 hover:border-cyan-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-cyan-400">
                  adminUpdateUserWallet(userId, newWallet)
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold">
                  admin only
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'แอดมินย้ายโอนสิทธิ์ความเป็นเจ้าของ User ID ไปยังกระเป๋าใหม่ (ID Migration)'
                  : 'Updates the registered recipient wallet for a given User ID.'}
              </p>
              <form onSubmit={handleWriteUpdateWallet} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="User ID"
                    value={writeUpdateWalletUserId}
                    onChange={(e) => setWriteUpdateWalletUserId(e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="text"
                    placeholder="0x... New Address"
                    value={writeUpdateWalletAddress}
                    onChange={(e) => setWriteUpdateWalletAddress(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isWritingUpdateWallet}
                  className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs font-mono transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isWritingUpdateWallet ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  <span>Migrate Wallet</span>
                </button>
              </form>
            </div>

            {/* 6b. adminUpdatePlacementId(uint256 _userId, uint256 _newPlacementId) */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-teal-500/30 hover:border-teal-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-teal-400">
                  adminUpdatePlacementId(userId, newPlacementId)
                </span>
                <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] font-mono font-bold">
                  admin only
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'แอดมินอัปเดตหรือย้ายตำแหน่ง Placement ID ของรหัสสมาชิกในผังเมทริกซ์'
                  : 'Updates the placement node ID for a given User ID in the matrix tree.'}
              </p>
              <form onSubmit={handleWriteUpdatePlacement} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="User ID"
                    value={writeUpdatePlacementUserId}
                    onChange={(e) => setWriteUpdatePlacementUserId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="New Placement ID"
                    value={writeUpdatePlacementNewId}
                    onChange={(e) => setWriteUpdatePlacementNewId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isWritingUpdatePlacement}
                  className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs font-mono transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isWritingUpdatePlacement ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Update Placement</span>
                </button>
              </form>
            </div>

            {/* 6c. adminUpdateSponsorId(uint256 _userId, uint256 _newSponsorId) */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-sky-500/30 hover:border-sky-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-sky-400">
                  adminUpdateSponsorId(userId, newSponsorId)
                </span>
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-mono font-bold">
                  admin only
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'แอดมินอัปเดตหรือย้ายผู้แนะนำ Sponsor ID ให้กับรหัสสมาชิก'
                  : 'Updates the direct sponsor ID for a given User ID.'}
              </p>
              <form onSubmit={handleWriteUpdateSponsor} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="User ID"
                    value={writeUpdateSponsorUserId}
                    onChange={(e) => setWriteUpdateSponsorUserId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="New Sponsor ID"
                    value={writeUpdateSponsorNewId}
                    onChange={(e) => setWriteUpdateSponsorNewId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isWritingUpdateSponsor}
                  className="w-full py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs font-mono transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isWritingUpdateSponsor ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Update Sponsor</span>
                </button>
              </form>
            </div>

            {/* 7. adminSetQueueHead(uint256 rank, uint256 newHeadIndex) */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-indigo-500/30 hover:border-indigo-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-indigo-400">
                  adminSetQueueHead(rank, index)
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold">
                  admin only
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'ปรับตำแหน่ง Head Pointer ของคิวสากล Rank 2 หรือ Rank 3 โดยตรง'
                  : 'Manually adjusts the head queue pointer for Rank 2 or 3.'}
              </p>
              <form onSubmit={handleWriteQueueHead} className="flex gap-2">
                <select
                  value={writeQueueHeadRank}
                  onChange={(e) => setWriteQueueHeadRank(Number(e.target.value) as 2 | 3)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                >
                  <option value={2}>Rank 2</option>
                  <option value={3}>Rank 3</option>
                </select>
                <input
                  type="number"
                  min="0"
                  placeholder="Head Index"
                  value={writeQueueHeadIndex}
                  onChange={(e) => setWriteQueueHeadIndex(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isWritingQueueHead}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs font-mono transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {isWritingQueueHead ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Set Head</span>
                </button>
              </form>
            </div>

            {/* 8. setPause(bool _paused) */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-rose-500/30 hover:border-rose-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-rose-400">
                  setPause(bool _paused)
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">
                  admin only
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'สวิตช์ฉุกเฉินเปิดหรือระงับการทำงานของสัญญา Smart Contract ชั่วคราว'
                  : 'Emergency pause / unpause toggle controlling all non-view contract actions.'}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleWriteTogglePause(true)}
                  disabled={isWritingPause || Boolean(contractLiveStats?.paused)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-bold text-xs font-mono transition flex items-center justify-center gap-1.5"
                >
                  <PauseCircle className="w-4 h-4" />
                  <span>Pause</span>
                </button>
                <button
                  onClick={() => handleWriteTogglePause(false)}
                  disabled={isWritingPause || Boolean(!contractLiveStats?.paused)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs font-mono transition flex items-center justify-center gap-1.5"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Unpause</span>
                </button>
              </div>
            </div>

            {/* 9. emergencyWithdraw(address _token, uint256 _amount) */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-emerald-500/30 hover:border-emerald-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-emerald-400">
                  emergencyWithdraw(token, amount)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                  owner only
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'ถอนเหรียญฉุกเฉิน (BEP-20 / USDT) ออกจากสัญญา Smart Contract ไปยังกระเป๋า Contract Owner'
                  : 'Emergency withdrawal of BEP-20 tokens or USDT held by the contract back to owner.'}
              </p>
              <form onSubmit={handleWriteEmergencyWithdraw} className="space-y-2">
                <input
                  type="text"
                  placeholder="Token Address (0x...)"
                  value={writeEmergencyToken}
                  onChange={(e) => setWriteEmergencyToken(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Amount (e.g. 10.0)"
                    value={writeEmergencyAmount}
                    onChange={(e) => setWriteEmergencyAmount(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-mono placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isWritingEmergencyWithdraw}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono transition flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    {isWritingEmergencyWithdraw ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                    <span>Withdraw</span>
                  </button>
                </div>
              </form>
            </div>

            {/* 10. lockMigration() */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-amber-500/30 hover:border-amber-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-amber-400">
                  lockMigration()
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">
                  owner only • permanent
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                {lang === 'th'
                  ? 'ปิดระบบย้ายข้อมูล Migration ถาวร เมื่อล็อคแล้วจะไม่สามารถเรียกฟังก์ชัน batchMigrate ได้อีกตลอดไป'
                  : 'Permanently locks the contract migration feature. Cannot be undone once executed.'}
              </p>
              <button
                onClick={handleWriteLockMigration}
                disabled={isWritingLockMigration}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs font-mono transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isWritingLockMigration ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Permanently Lock Migration</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Code Viewer Section */}
      {(activeCategory === 'all' || activeCategory === 'code') && (
        <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 font-mono text-xs overflow-x-auto shadow-2xl">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 text-slate-400">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-slate-200">contracts/WealthLifeCycle.sol</span>
            </div>
            <span className="text-[11px] text-slate-500">110 Lines • 100% Verified Source</span>
          </div>

          <pre className="text-slate-300 leading-relaxed overflow-x-auto select-all">
            <code>{SOLIDITY_CODE}</code>
          </pre>
        </div>
      )}

    </div>
  );
};
