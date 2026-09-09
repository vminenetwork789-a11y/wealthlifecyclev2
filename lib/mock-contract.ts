import { MatrixUser, QueueItem, MatrixTransaction, SystemStats, AppNotification, RankLevel, UserDashboardData, SmartContractEventLog, PlacementSearchResult, PlacementCandidate } from './types';
import { CONTRACT_ADDRESS, USDT_ADDRESS, CONTRACT_OWNER } from './contracts-config';

const STORAGE_KEY = 'wealthlifecycle_state_v2';
const BASE_TIMESTAMP = 1740000000000;

// Initial Genesis Seed
const DEFAULT_USERS: MatrixUser[] = [
  {
    id: 1,
    address: '0xD350758257Bee9AdB111944b1737d257620e80CE (Contract Owner / Root)',
    sponsorId: 1,
    isGhost: false,
    registeredAt: BASE_TIMESTAMP - 86400000 * 5,
    rank1Slots: [2, 3, 4, 5],
    rank2QueueIndex: 1,
    rank2SlotsFilled: 4,
    rank3BoardPosition: 1,
    rank3SlotsFilled: 2,
    totalEarnedUSDT: 15.4,
    directBonusUSDT: 2.8,
    rank1EarnedUSDT: 4.8,
    rank2EarnedUSDT: 5.8,
    rank3EarnedUSDT: 2.0,
    pendingRebornUSDT: 0,
    rebornCount: 68,
    cyclesCompleted: 4,
    referralsCount: 21,
  },
  {
    id: 2,
    address: '0xb18DC8037702B173e262FF5c8b99257091bcdbf5 (Alpha Node)',
    sponsorId: 1,
    isGhost: false,
    registeredAt: BASE_TIMESTAMP - 86400000 * 4,
    rank1Slots: [6, 7, 8, 9],
    rank2QueueIndex: 2,
    rank2SlotsFilled: 3,
    rank3BoardPosition: -1,
    rank3SlotsFilled: 0,
    totalEarnedUSDT: 14.4,
    directBonusUSDT: 1.2,
    rank1EarnedUSDT: 2.4,
    rank2EarnedUSDT: 6.0,
    rank3EarnedUSDT: 4.8,
    pendingRebornUSDT: 0,
    rebornCount: 1,
    cyclesCompleted: 2,
    referralsCount: 6,
  },
  {
    id: 3,
    address: '0x99B...E441 (Beta Node)',
    sponsorId: 1,
    isGhost: false,
    registeredAt: BASE_TIMESTAMP - 86400000 * 3,
    rank1Slots: [10, 11, 12, 13],
    rank2QueueIndex: 3,
    rank2SlotsFilled: 2,
    rank3BoardPosition: -1,
    rank3SlotsFilled: 0,
    totalEarnedUSDT: 6.0,
    directBonusUSDT: 0.8,
    rank1EarnedUSDT: 1.2,
    rank2EarnedUSDT: 4.0,
    rank3EarnedUSDT: 0,
    pendingRebornUSDT: 0,
    rebornCount: 0,
    cyclesCompleted: 1,
    referralsCount: 4,
  },
  {
    id: 4,
    address: '0x1F4...C78A (Gamma Node)',
    sponsorId: 1,
    isGhost: false,
    registeredAt: BASE_TIMESTAMP - 86400000 * 2,
    rank1Slots: [14, 15],
    rank2QueueIndex: 4,
    rank2SlotsFilled: 1,
    rank3BoardPosition: -1,
    rank3SlotsFilled: 0,
    totalEarnedUSDT: 3.8,
    directBonusUSDT: 0.6,
    rank1EarnedUSDT: 1.2,
    rank2EarnedUSDT: 2.0,
    rank3EarnedUSDT: 0,
    pendingRebornUSDT: 0,
    rebornCount: 0,
    cyclesCompleted: 0,
    referralsCount: 3,
  },
  {
    id: 5,
    address: '0x88D...331B (Ghost #G1)',
    sponsorId: 1,
    isGhost: true,
    registeredAt: BASE_TIMESTAMP - 86400000 * 2,
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
  },
  {
    id: 6,
    address: '0x62C...99AA (Ghost #G2)',
    sponsorId: 2,
    isGhost: true,
    registeredAt: BASE_TIMESTAMP - 86400000,
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
  },
  {
    id: 7,
    address: '0x73A...1102 (Node #7)',
    sponsorId: 2,
    isGhost: false,
    registeredAt: BASE_TIMESTAMP - 86400000,
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
  },
  {
    id: 8,
    address: '0x84E...59B1 (Node #8)',
    sponsorId: 2,
    isGhost: false,
    registeredAt: BASE_TIMESTAMP - 72000000,
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
  },
  {
    id: 9,
    address: '0x95C...44A3 (Node #9)',
    sponsorId: 2,
    isGhost: false,
    registeredAt: BASE_TIMESTAMP - 64000000,
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
  },
  {
    id: 10,
    address: '0xA1D...9921 (Node #10)',
    sponsorId: 3,
    isGhost: false,
    registeredAt: BASE_TIMESTAMP - 56000000,
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
  },
  {
    id: 11,
    address: '0xB2E...8832 (Node #11)',
    sponsorId: 3,
    isGhost: false,
    registeredAt: BASE_TIMESTAMP - 48000000,
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
  },
  {
    id: 12,
    address: '0xC3F...7743 (Node #12)',
    sponsorId: 3,
    isGhost: false,
    registeredAt: BASE_TIMESTAMP - 40000000,
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
  },
  {
    id: 13,
    address: '0xD4A...6654 (Node #13)',
    sponsorId: 3,
    isGhost: false,
    registeredAt: BASE_TIMESTAMP - 32000000,
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
  },
  {
    id: 14,
    address: '0xE5B...5565 (Node #14)',
    sponsorId: 4,
    isGhost: false,
    registeredAt: BASE_TIMESTAMP - 24000000,
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
  },
  {
    id: 15,
    address: '0xF6C...4476 (Node #15)',
    sponsorId: 4,
    isGhost: false,
    registeredAt: BASE_TIMESTAMP - 16000000,
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
  },
];

export interface ContractState {
  users: MatrixUser[];
  rank2Queue: QueueItem[];
  rank3Queue: QueueItem[];
  transactions: MatrixTransaction[];
  stats: SystemStats;
  notifications: AppNotification[];
}

export class MockMatrixContract {
  private state: ContractState;
  private defaultStateCache: ContractState | null = null;
  private listeners: Set<() => void> = new Set();
  private hasSyncedStorage = false;

  constructor() {
    this.state = this.getDefaultState();
  }

  public syncClientStorage(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.state = JSON.parse(stored);
        this.notify();
        return true;
      }
    } catch {
      // Fallback
    }
    return false;
  }

  public subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public getSnapshot = (): ContractState => {
    if (!this.hasSyncedStorage && typeof window !== 'undefined') {
      this.hasSyncedStorage = true;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.state = JSON.parse(stored);
        }
      } catch {
        // Fallback
      }
    }
    return this.state;
  };

  public getServerSnapshot = (): ContractState => {
    if (!this.defaultStateCache) {
      this.defaultStateCache = this.getDefaultState();
    }
    return this.defaultStateCache;
  };

  public getDefaultState(): ContractState {
    const users = [...DEFAULT_USERS];
    const rank2Queue: QueueItem[] = [
      {
        userId: 1,
        address: users[0].address,
        isGhost: false,
        joinedQueueAt: BASE_TIMESTAMP - 86400000 * 3,
        slotsFilled: 4,
        requiredSlots: 4,
        rank: 2,
        payoutPending: 4.0,
      },
      {
        userId: 2,
        address: users[1].address,
        isGhost: false,
        joinedQueueAt: BASE_TIMESTAMP - 86400000 * 2,
        slotsFilled: 3,
        requiredSlots: 4,
        rank: 2,
        payoutPending: 4.0,
      },
      {
        userId: 3,
        address: users[2].address,
        isGhost: false,
        joinedQueueAt: BASE_TIMESTAMP - 86400000,
        slotsFilled: 2,
        requiredSlots: 4,
        rank: 2,
        payoutPending: 4.0,
      },
      {
        userId: 4,
        address: users[3].address,
        isGhost: false,
        joinedQueueAt: BASE_TIMESTAMP - 3600000 * 4,
        slotsFilled: 1,
        requiredSlots: 4,
        rank: 2,
        payoutPending: 4.0,
      },
      {
        userId: 5,
        address: '0x88D...331B (Ghost #G1)',
        isGhost: true,
        joinedQueueAt: BASE_TIMESTAMP - 3600000,
        slotsFilled: 0,
        requiredSlots: 4,
        rank: 2,
        payoutPending: 4.0,
      }
    ];

    const rank3Queue: QueueItem[] = [
      {
        userId: 1,
        address: users[0].address,
        isGhost: false,
        joinedQueueAt: BASE_TIMESTAMP - 86400000 * 2,
        slotsFilled: 2,
        requiredSlots: 4,
        rank: 3,
        payoutPending: 8.0,
      }
    ];

    const transactions: MatrixTransaction[] = [
      {
        id: 'tx_init_1',
        txHash: '0x8a92f03b91a78912c98d781b4d081cf87431f981e4b',
        timestamp: BASE_TIMESTAMP - 3600000 * 12,
        type: 'REGISTER',
        userId: 4,
        userAddress: users[3].address,
        amountUSDT: 2.0,
        details: 'User #4 registered under Sponsor #1',
        status: 'SUCCESS',
      },
      {
        id: 'tx_init_2',
        txHash: '0x43b2a88190c1fef39281a4b92138cd9183478cb90',
        timestamp: BASE_TIMESTAMP - 3600000 * 8,
        type: 'SPONSOR_BONUS',
        userId: 1,
        userAddress: users[0].address,
        amountUSDT: 0.2,
        details: '10% Direct Sponsor Bonus from User #4',
        status: 'SUCCESS',
      },
      {
        id: 'tx_init_3',
        txHash: '0x99fa41098231cd89a198d890bfa182049102488aa',
        timestamp: BASE_TIMESTAMP - 3600000 * 4,
        type: 'GHOST_SPAWN',
        userId: 5,
        userAddress: users[4].address,
        amountUSDT: 2.0,
        details: 'Ghost ID #5 spawned into Rank 1 from Reborn Pool',
        status: 'SUCCESS',
      },
      {
        id: 'tx_init_4',
        txHash: '0x12c99a8183bcda89104fa289190abf8910948921a',
        timestamp: BASE_TIMESTAMP - 3600000 * 2,
        type: 'RANK2_CYCLE',
        userId: 1,
        userAddress: users[0].address,
        amountUSDT: 1.6,
        details: 'Rank 2 FIFO cycle completed (1.6 USDT paid)',
        status: 'SUCCESS',
      }
    ];

    const stats: SystemStats = {
      lastUserId: 119,
      totalUsers: 119,
      realUsersCount: 51,
      ghostUsersCount: 68,
      totalDistributedUSDT: 238.0,
      globalPoolUSDT: 14.8,
      rebornPoolUSDT: 0,
      rank2QueueLength: rank2Queue.length,
      rank3QueueLength: rank3Queue.length,
      totalCyclesCompleted: 34,
      contractAddress: CONTRACT_ADDRESS,
      network: 'BNB Smart Chain (BEP-20)',
      usdtTokenAddress: USDT_ADDRESS,
    };

    const notifications: AppNotification[] = [
      {
        id: 'notif_1',
        title: 'ระบบเปิดตัวอย่างเป็นทางการ',
        message: 'wealthlifecycle Matrix DApp พร้อมฟังก์ชัน Ghost Reborn ออนไลน์บน BSC!',
        type: 'info',
        timestamp: BASE_TIMESTAMP - 86400000 * 3,
      }
    ];

    return { users, rank2Queue, rank3Queue, transactions, stats, notifications };
  }

  private loadState(): ContractState {
    return this.getDefaultState();
  }

  private saveState() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch {
        // Ignore
      }
    }
    this.notify();
  }

  private notify() {
    this.state = { ...this.state };
    this.listeners.forEach(l => l());
  }

  public getState(): ContractState {
    return this.state;
  }

  public resetState() {
    this.state = this.getDefaultState();
    this.saveState();
  }

  // Find user by ID or address
  public getUser(identifier: number | string): MatrixUser | undefined {
    if (typeof identifier === 'number') {
      if (identifier <= 0) return undefined;
      const found = this.state.users.find(u => u.id === identifier);
      if (found) return found;
      
      // Fallback synthetic user for any valid positive ID
      return {
        id: identifier,
        address: `0x${identifier.toString(16).padStart(8, '0')}...BEP20`,
        sponsorId: identifier === 1 ? 0 : Math.max(1, Math.floor((identifier - 2) / 4) + 1),
        isGhost: false,
        registeredAt: Date.now() - identifier * 60000,
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
    const clean = identifier.toLowerCase();
    return this.state.users.find(u => u.address.toLowerCase().includes(clean) || clean.includes(u.address.toLowerCase()));
  }

  // Get all user IDs associated with a given wallet address
  public getUserIdsByWallet(walletAddress: string): number[] {
    if (!walletAddress) return [];
    const clean = walletAddress.toLowerCase().trim();
    return this.state.users
      .filter(u => u.address.toLowerCase().includes(clean) || clean.includes(u.address.toLowerCase()))
      .map(u => u.id);
  }

  // Get full team tree for a user (Rank 1: 1 -> 4 -> 16)
  public getTeamTree(userId: number) {
    const rootUser = this.getUser(userId);
    if (!rootUser) return null;

    const level1Nodes: (MatrixUser | { id: number; isGhost: boolean; isSlotEmpty: true })[] = [];
    const directSlotIds = rootUser.rank1Slots || [];

    for (let i = 0; i < 4; i++) {
      if (i < directSlotIds.length) {
        const child = this.getUser(directSlotIds[i]);
        if (child) {
          level1Nodes.push(child);
        } else {
          level1Nodes.push({ id: -(i + 1), isGhost: false, isSlotEmpty: true });
        }
      } else {
        level1Nodes.push({ id: -(i + 1), isGhost: false, isSlotEmpty: true });
      }
    }

    // Level 2
    const level2Map: Record<number, (MatrixUser | { id: number; isGhost: boolean; isSlotEmpty: true })[]> = {};
    level1Nodes.forEach(node => {
      if (!('isSlotEmpty' in node)) {
        const slots = (node as MatrixUser).rank1Slots || [];
        const children: (MatrixUser | { id: number; isGhost: boolean; isSlotEmpty: true })[] = [];
        for (let j = 0; j < 4; j++) {
          if (j < slots.length) {
            const subChild = this.getUser(slots[j]);
            if (subChild) children.push(subChild);
            else children.push({ id: -(100 + j), isGhost: false, isSlotEmpty: true });
          } else {
            children.push({ id: -(100 + j), isGhost: false, isSlotEmpty: true });
          }
        }
        level2Map[node.id] = children;
      }
    });

    return {
      root: rootUser,
      level1: level1Nodes,
      level2: level2Map,
    };
  }

  // Exact Smart Contract getter: currentHeads(uint256 rank)
  public currentHeads(rank: number = 2): number {
    const queue = rank === 2 ? this.state.rank2Queue : rank === 3 ? this.state.rank3Queue : [];
    if (queue.length === 0) return 0;
    return 0;
  }

  // Exact Smart Contract getter: getGlobalQueuePaginated(uint256 rank, uint256 startIdx, uint256 limit)
  public getGlobalQueuePaginated(rank: number = 2, startIdx: number = 0, limit: number = 5): {
    userIds: number[];
    isGhostFlags: boolean[];
    slotsFilled: number[];
  } {
    const queue = rank === 2 ? this.state.rank2Queue : rank === 3 ? this.state.rank3Queue : [];
    const sliced = queue.slice(startIdx, startIdx + limit);
    return {
      userIds: sliced.map(item => item.userId),
      isGhostFlags: sliced.map(item => item.isGhost),
      slotsFilled: sliced.map(item => item.slotsFilled),
    };
  }

  // Get full structured GlobalQueueItemData using getGlobalQueuePaginated
  public getGlobalQueuePaginatedData(rank: number = 2, startIdx: number = 0, limit: number = 5) {
    const queue = rank === 2 ? this.state.rank2Queue : rank === 3 ? this.state.rank3Queue : [];
    const sliced = queue.slice(startIdx, startIdx + limit);
    return sliced.map((item, idx) => {
      const user = this.getUser(item.userId);
      return {
        queueIndex: startIdx + idx,
        userId: item.userId,
        walletAddress: user?.address || item.address || '0x0000000000000000000000000000000000000000',
        isAutoReborn: true,
        isGhost: item.isGhost,
        slotsFilled: item.slotsFilled,
        pendingRebornFunds: 0
      };
    });
  }

  // Exact Smart Contract getter: globalQueues(uint256 rank, uint256 index)
  public globalQueues(rank: number, index: number) {
    const queue = rank === 2 ? this.state.rank2Queue : rank === 3 ? this.state.rank3Queue : [];
    if (index < 0 || index >= queue.length) return null;
    const item = queue[index];
    const user = this.getUser(item.userId);
    return {
      queueIndex: index,
      userId: item.userId,
      walletAddress: user?.address || item.address || '0x0000000000000000000000000000000000000000',
      isAutoReborn: true,
      isGhost: item.isGhost,
      slotsFilled: item.slotsFilled,
      pendingRebornFunds: 0
    };
  }

  // Exact Smart Contract getter: idTotalEarned(uint256 id)
  public idTotalEarned(id: number): number {
    if (!id || id <= 0) return 0;
    const user = this.getUser(id);
    return user ? user.totalEarnedUSDT : 0;
  }

  // Exact Smart Contract getter: getWalletTotalEarned(address _wallet)
  public getWalletTotalEarned(walletAddress: string): number {
    if (!walletAddress) return 0;
    const clean = walletAddress.toLowerCase();
    const matchingUsers = this.state.users.filter(u => u.address.toLowerCase().includes(clean) || clean.includes(u.address.toLowerCase()));
    if (matchingUsers.length === 0) return 0;
    return matchingUsers.reduce((sum, u) => sum + (u.totalEarnedUSDT || 0), 0);
  }

  // Exact Smart Contract getter: walletToIds(address, uint256 index)
  public walletToIds(walletAddress: string, index: number = 0): number {
    const ids = this.getWalletIds(walletAddress);
    return ids[index] || 0;
  }

  // Get all user IDs mapped to a wallet address
  public getWalletIds(walletAddress: string): number[] {
    if (!walletAddress) return [];
    const clean = walletAddress.toLowerCase();
    const matchingUsers = this.state.users.filter(u => 
      u.address.toLowerCase().includes(clean) || clean.includes(u.address.toLowerCase())
    );
    const ids = matchingUsers.map(u => u.id).filter(id => id > 0);
    return Array.from(new Set(ids)).sort((a, b) => a - b);
  }

  // Exact Smart Contract getter: checkParentValid(uint256 parentId)
  public checkParentValid(parentId: number): {
    isActive: boolean;
    isExpired: boolean;
    downlineCount: number;
    isValid: boolean;
    canAcceptDownline: boolean;
  } {
    if (parentId <= 0) {
      return { isActive: false, isExpired: false, downlineCount: 0, isValid: false, canAcceptDownline: false };
    }
    const user = this.getUser(parentId);
    if (!user) {
      return { isActive: false, isExpired: false, downlineCount: 0, isValid: false, canAcceptDownline: false };
    }
    const downlineCount = (user.rank1Slots || []).length;
    const isExpired = Boolean(user.isExpired);
    const isActive = !isExpired;
    const canAcceptDownline = isActive && downlineCount < 4;

    return {
      isActive,
      isExpired,
      downlineCount,
      isValid: isActive && !isExpired,
      canAcceptDownline
    };
  }

  // Automatic Parent / Placement ID search: Finds the optimal available node under a sponsor
  // Uses Breadth-First Search (BFS) in sponsor's team tree to find the shallowest node with < 4 downlines
  public findOptimalPlacement(sponsorId: number = 1): PlacementSearchResult {
    const targetSponsorId = Math.max(1, sponsorId || 1);
    const sponsor = this.getUser(targetSponsorId) || this.getUser(1);

    if (!sponsor) {
      return {
        parentId: 1,
        downlineCount: 0,
        maxSlots: 4,
        availableSlots: 4,
        isActive: true,
        isExpired: false,
        source: 'root_fallback',
        levelFromSponsor: 0,
        messageTh: 'ต่อตรงรหัสปฐมบท (Root ID #1)',
        messageEn: 'Direct Root Placement (ID #1)',
      };
    }

    // 1. Check if Sponsor itself can accept downlines (< 4 downlines)
    const sponsorSlots = (sponsor.rank1Slots || []).length;
    if (sponsorSlots < 4) {
      return {
        parentId: sponsor.id,
        downlineCount: sponsorSlots,
        maxSlots: 4,
        availableSlots: Math.max(0, 4 - sponsorSlots),
        isActive: true,
        isExpired: false,
        wallet: sponsor.address,
        source: 'direct_sponsor',
        levelFromSponsor: 0,
        messageTh: `ต่อตรงติดตัวผู้แนะนำ #${sponsor.id} ทันที (ว่าง ${4 - sponsorSlots}/4 ช่อง)`,
        messageEn: `Direct Placement Under Sponsor #${sponsor.id} (${4 - sponsorSlots}/4 open)`,
      };
    }

    // 2. Breadth-First Search (BFS) to find first available downline node with < 4 slots
    const queue: { id: number; level: number }[] = (sponsor.rank1Slots || []).map(id => ({ id, level: 1 }));
    const visited = new Set<number>([sponsor.id]);

    while (queue.length > 0) {
      const { id: currentId, level } = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const current = this.getUser(currentId);
      if (!current) continue;

      const currentSlots = (current.rank1Slots || []).length;
      if (currentSlots < 4) {
        return {
          parentId: current.id,
          downlineCount: currentSlots,
          maxSlots: 4,
          availableSlots: Math.max(0, 4 - currentSlots),
          isActive: true,
          isExpired: false,
          wallet: current.address,
          source: 'tree_spillover',
          levelFromSponsor: level,
          messageTh: `Spillover ชั้นที่ ${level} ใต้โหนด #${current.id} (ว่าง ${4 - currentSlots}/4 ช่อง)`,
          messageEn: `Spillover Level ${level} Under Node #${current.id} (${4 - currentSlots}/4 open)`,
        };
      }

      for (const childId of current.rank1Slots || []) {
        if (!visited.has(childId)) {
          queue.push({ id: childId, level: level + 1 });
        }
      }
    }

    // 3. Fallback: Search from root (ID 1)
    if (targetSponsorId !== 1) {
      const rootPlacement = this.findOptimalPlacement(1);
      return {
        ...rootPlacement,
        source: 'root_fallback',
        messageTh: `สายงาน #${targetSponsorId} เต็ม - จัดวางอัตโนมัติต่อจากรหัส #${rootPlacement.parentId}`,
        messageEn: `Sponsor #${targetSponsorId} Tree Full - Placed under #${rootPlacement.parentId}`,
      };
    }

    const rootUser = this.getUser(1);
    const rootSlots = rootUser ? (rootUser.rank1Slots || []).length : 0;
    return {
      parentId: 1,
      downlineCount: rootSlots,
      maxSlots: 4,
      availableSlots: Math.max(0, 4 - rootSlots),
      isActive: true,
      isExpired: false,
      source: 'root_fallback',
      levelFromSponsor: 0,
      messageTh: 'จัดวางใต้รหัสหลักระบบ (Root ID #1)',
      messageEn: 'Placed under System Root (ID #1)',
    };
  }

  // Get all candidate nodes under a root/sponsor that have open placement slots (< 4)
  public getTeamAvailablePlacements(rootId: number = 1): PlacementCandidate[] {
    const targetRootId = Math.max(1, rootId || 1);
    const root = this.getUser(targetRootId);
    if (!root) return [];

    const candidates: PlacementCandidate[] = [];
    const queue: { id: number; level: number }[] = [{ id: root.id, level: 0 }];
    const visited = new Set<number>();

    while (queue.length > 0 && candidates.length < 50) {
      const { id: currentId, level } = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const node = this.getUser(currentId);
      if (!node) continue;

      const downlines = (node.rank1Slots || []).length;
      if (downlines < 4) {
        candidates.push({
          id: node.id,
          wallet: node.address,
          downlineCount: downlines,
          maxSlots: 4,
          availableSlots: Math.max(0, 4 - downlines),
          level,
          isGhost: Boolean(node.isGhost),
          isActive: true,
          isExpired: Boolean(node.isExpired),
          relationshipTh: level === 0 ? 'ผู้แนะนำตรง (Direct)' : `สายงานชั้นที่ ${level}`,
          relationshipEn: level === 0 ? 'Direct Sponsor' : `Level ${level} Downline`,
        });
      }

      for (const childId of node.rank1Slots || []) {
        if (!visited.has(childId)) {
          queue.push({ id: childId, level: level + 1 });
        }
      }
    }

    return candidates;
  }

  // Exact Smart Contract getter: getWalletAvailableRank1Nodes(address _wallet)
  public getWalletAvailableRank1Nodes(walletAddress: string): { availableIds: number[]; downlineCounts: number[] } {
    if (!walletAddress) return { availableIds: [], downlineCounts: [] };
    const clean = walletAddress.toLowerCase();
    const matchingUsers = this.state.users.filter(u => 
      !u.isGhost && (u.address.toLowerCase().includes(clean) || clean.includes(u.address.toLowerCase()))
    );

    const availableIds: number[] = [];
    const downlineCounts: number[] = [];

    matchingUsers.forEach(u => {
      const filled = (u.rank1Slots || []).length;
      if (filled < 4) {
        availableIds.push(u.id);
        downlineCounts.push(filled);
      }
    });

    return { availableIds, downlineCounts };
  }

  // Exact Smart Contract getter: getWalletAllData(address _wallet)
  public getWalletAllData(walletAddress: string): UserDashboardData[] {
    if (!walletAddress) return [];
    const clean = walletAddress.toLowerCase();
    const matchingUsers = this.state.users.filter(u => 
      !u.isGhost && (u.address.toLowerCase().includes(clean) || clean.includes(u.address.toLowerCase()))
    );

    return matchingUsers.map(u => {
      // Rank 1 downlines (direct placement slots)
      const rank1Downlines = (u.rank1Slots || []).slice(0, 4);

      // Rank 2 downlines (slots currently contributing to their Rank 2 queue position)
      const rank2Downlines: number[] = [];
      const rank2Count = Math.min(u.rank2SlotsFilled || 0, 4);
      for (let i = 0; i < rank2Count; i++) {
        rank2Downlines.push(i + 1);
      }

      // Rank 3 downlines (slots currently contributing to their Rank 3 board)
      const rank3Downlines: number[] = [];
      const rank3Count = Math.min(u.rank3SlotsFilled || 0, 4);
      for (let i = 0; i < rank3Count; i++) {
        rank3Downlines.push(i + 1);
      }

      const nowSec = Math.floor(Date.now() / 1000);
      const expiresAt = u.expiresAt || (u.registeredAt ? Math.floor(u.registeredAt / 1000) + 7 * 86400 : nowSec + 7 * 86400);
      const isExpired = u.isExpired !== undefined ? u.isExpired : nowSec > expiresAt;

      return {
        id: u.id,
        sponsorId: u.sponsorId || 1,
        isAutoReborn: true,
        totalEarned: u.totalEarnedUSDT || 0,
        expiresAt,
        isExpired,
        rank1Downlines,
        rank2Downlines,
        rank3Downlines,
        rank2QueueIndex: u.rank2QueueIndex ?? -1,
        rank3QueueIndex: u.rank3BoardPosition ?? -1
      };
    });
  }

  // Exact Smart Contract function: isIdExpired(uint256 _userId)
  public isIdExpired(userId: number): boolean {
    const u = this.getUser(userId);
    if (!u) return true;
    if (u.isExpired !== undefined) return u.isExpired;
    const nowSec = Math.floor(Date.now() / 1000);
    const expiresAt = u.expiresAt || (u.registeredAt ? Math.floor(u.registeredAt / 1000) + 7 * 86400 : 0);
    return expiresAt > 0 ? nowSec > expiresAt : false;
  }

  // Exact Smart Contract function: renewId(uint256 _userId)
  public renewId(userId: number): { success: boolean; txHash: string; newExpiresAt: number } {
    const u = this.getUser(userId);
    if (!u) return { success: false, txHash: '', newExpiresAt: 0 };

    const nowSec = Math.floor(Date.now() / 1000);
    const newExpiresAt = nowSec + 7 * 86400;
    u.expiresAt = newExpiresAt;
    u.isExpired = false;

    const txHash = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    this.state.transactions.unshift({
      id: `tx_${Date.now()}_renew_${userId}`,
      txHash,
      timestamp: Date.now(),
      type: 'UPGRADE_RANK' as unknown as MatrixTransaction['type'],
      userId: u.id,
      userAddress: u.address,
      amountUSDT: 0,
      details: `Renewed ID #${userId} (+7 days active lifespan)`,
      status: 'SUCCESS'
    });

    this.saveState();
    return { success: true, txHash, newExpiresAt };
  }

  // Exact Smart Contract function: getWalletExpiredIdsAndTotalEarned(address _wallet)
  public getWalletExpiredIdsAndTotalEarned(walletAddress: string): { expiredIds: number[]; earnedAmounts: number[] } {
    if (!walletAddress) return { expiredIds: [], earnedAmounts: [] };
    const clean = walletAddress.toLowerCase();
    const matchingUsers = this.state.users.filter(u => 
      !u.isGhost && (u.address.toLowerCase().includes(clean) || clean.includes(u.address.toLowerCase()))
    );

    const expiredIds: number[] = [];
    const earnedAmounts: number[] = [];

    for (const u of matchingUsers) {
      if (this.isIdExpired(u.id)) {
        expiredIds.push(u.id);
        earnedAmounts.push(u.totalEarnedUSDT || 0);
      }
    }

    return { expiredIds, earnedAmounts };
  }

  // Exact Smart Contract function: adminSetQueueHead(uint256 rank, uint256 newHeadIndex)
  public adminSetQueueHead(rank: number, newHeadIndex: number): void {
    if (rank === 2) {
      this.state.stats.rank2QueueHead = newHeadIndex;
    } else if (rank === 3) {
      this.state.stats.rank3QueueHead = newHeadIndex;
    }
    this.saveState();
  }

  // Unique ID generator to strictly prevent collision
  public generateNextUserId(preferredId?: number): number {
    if (preferredId && preferredId > 0 && !this.state.users.some(u => u.id === preferredId)) {
      return preferredId;
    }
    const maxExisting = this.state.users.reduce((max, u) => Math.max(max, u.id), 0);
    const maxStat = this.state.stats.lastUserId || 0;
    let nextId = Math.max(maxExisting, maxStat, this.state.users.length) + 1;
    while (this.state.users.some(u => u.id === nextId)) {
      nextId++;
    }
    return nextId;
  }

  // Register a new user with 2 USDT (supports multiple IDs per wallet and explicit on-chain ID sync)
  public registerUser(
    address: string, 
    sponsorId: number = 1, 
    explicitId?: number, 
    explicitPlacementId?: number
  ): { success: boolean; user?: MatrixUser; error?: string } {
    let sponsor = this.getUser(sponsorId);
    if (!sponsor || sponsor.isGhost) {
      sponsor = this.getUser(1)!; // Fallback to Root
    }

    const newId = this.generateNextUserId(explicitId);
    const newUser: MatrixUser = {
      id: newId,
      address,
      sponsorId: sponsor.id,
      isGhost: false,
      registeredAt: Date.now(),
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

    this.state.users.push(newUser);

    // Update sponsor
    sponsor.referralsCount = (sponsor.referralsCount || 0) + 1;
    const directBonus = 0.2; // 10% of 2 USDT
    sponsor.directBonusUSDT += directBonus;
    sponsor.totalEarnedUSDT += directBonus;

    // Place into explicitPlacementId or sponsor's Rank 1 tree with full BFS spillover
    this.placeInRank1(explicitPlacementId || sponsor.id, newId);

    // Global funds distribution
    this.state.stats.lastUserId = Math.max(this.state.stats.lastUserId, newId);
    this.state.stats.totalUsers = this.state.users.length;
    this.state.stats.realUsersCount = this.state.users.filter(u => !u.isGhost).length;
    this.state.stats.ghostUsersCount = this.state.users.filter(u => u.isGhost).length;
    this.state.stats.totalDistributedUSDT += directBonus;
    this.state.stats.globalPoolUSDT += 0.8; // 40%
    this.state.stats.rebornPoolUSDT += 0.4; // 20%
    // Rank 1 pool gets 0.6 USDT

    // Add transactions
    const regTx: MatrixTransaction = {
      id: `tx_${Date.now()}_reg_${newId}`,
      txHash: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      timestamp: Date.now(),
      type: 'REGISTER',
      userId: newId,
      userAddress: address,
      amountUSDT: 2.0,
      details: `Member #${newId} joined under Sponsor #${sponsor.id}`,
      status: 'SUCCESS',
    };

    const bonusTx: MatrixTransaction = {
      id: `tx_${Date.now()}_bonus_${newId}`,
      txHash: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      timestamp: Date.now(),
      type: 'SPONSOR_BONUS',
      userId: sponsor.id,
      userAddress: sponsor.address,
      amountUSDT: 0.2,
      details: `10% Direct Bonus from Member #${newId}`,
      status: 'SUCCESS',
    };

    this.state.transactions.unshift(regTx, bonusTx);

    // Push Notification
    this.state.notifications.unshift({
      id: `notif_${Date.now()}_${newId}`,
      title: 'สมาชิกใหม่เข้าร่วมสำเร็จ!',
      message: `รหัส #${newId} (${address.slice(0, 6)}...${address.slice(-4)}) เข้าร่วมโครงข่าย 2 USDT`,
      type: 'success',
      timestamp: Date.now(),
      amount: 2.0,
    });

    this.saveState();
    return { success: true, user: newUser };
  }

  // Internal: Place node in Rank 1 matrix tree with complete BFS spillover
  private placeInRank1(startId: number, targetId: number) {
    const startNode = this.getUser(startId);
    if (!startNode) {
      const root = this.getUser(1);
      if (root && root.id !== targetId) {
        this.placeInRank1(1, targetId);
      }
      return;
    }

    // Breadth-First Search (BFS) to find first available node with < 4 slots
    const queue: number[] = [startId];
    const visited = new Set<number>();
    let placed = false;

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const current = this.getUser(currentId);
      if (!current || current.id === targetId) continue;

      if (!current.rank1Slots) current.rank1Slots = [];

      // Avoid duplicate slot insertion
      if (current.rank1Slots.includes(targetId)) {
        placed = true;
        break;
      }

      if (current.rank1Slots.length < 4) {
        const slotIndex = current.rank1Slots.length; // 0, 1, 2, 3
        current.rank1Slots.push(targetId);

        // Slots 1 & 2 (index 0 & 1): Matrix Bonus 30% = 0.60 USDT
        if (slotIndex === 0 || slotIndex === 1) {
          const slotReward = 0.60;
          current.rank1EarnedUSDT += slotReward;
          current.totalEarnedUSDT += slotReward;
          this.state.stats.totalDistributedUSDT += slotReward;

          this.state.transactions.unshift({
            id: `tx_${Date.now()}_r1_slot_${slotIndex + 1}_${targetId}`,
            txHash: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
            timestamp: Date.now(),
            type: 'RANK1_PAYOUT',
            userId: current.id,
            userAddress: current.address,
            amountUSDT: slotReward,
            details: `Rank 1 Matrix Bonus 30% (0.60 USDT) from Slot #${slotIndex + 1} (User #${targetId})`,
            status: 'SUCCESS',
          });
        }

        // Check if Rank 1 complete
        if (current.rank1Slots.length === 4) {
          this.completeRank1(current);
        }
        placed = true;
        break;
      } else {
        // Queue child nodes for spillover
        for (const childId of current.rank1Slots) {
          if (!visited.has(childId) && childId !== targetId) {
            queue.push(childId);
          }
        }
      }
    }

    // Fallback: If not placed under startId subtree, BFS from Root (ID 1)
    if (!placed && startId !== 1) {
      this.placeInRank1(1, targetId);
    }
  }

  // Complete Rank 1 -> Auto-Upgrade Rank 2 (4 USDT) + Reborn Real ID into Rank 1
  private completeRank1(user: MatrixUser) {
    user.cyclesCompleted += 1;
    user.rebornCount += 1;

    this.state.transactions.unshift({
      id: `tx_${Date.now()}_r1_complete`,
      txHash: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      timestamp: Date.now(),
      type: 'PROCESS_REBORN',
      userId: user.id,
      userAddress: user.address,
      amountUSDT: 4.0,
      details: `Rank 1 Complete! Auto-Upgrade to Rank 2 (4 USDT) + Reborn Real ID back to Rank 1`,
      status: 'SUCCESS',
    });

    this.state.notifications.unshift({
      id: `notif_${Date.now()}_r1_complete`,
      title: '🎉 ผัง Rank 1 เต็ม 4 สล็อต!',
      message: `สมาชิก #${user.id} ได้รับ Auto-Upgrade เข้า Rank 2 (4 USDT) และระบบ Reborn เกิดใหม่ ID จริงใน Rank 1 เรียบร้อย!`,
      type: 'success',
      timestamp: Date.now(),
    });

    // Check if already in Rank 2 queue
    const inQueue = this.state.rank2Queue.some(q => q.userId === user.id);
    if (!inQueue) {
      this.enqueueRank2(user);
    }
  }

  // Push user into Rank 2 FIFO Queue (4 USDT)
  private enqueueRank2(user: MatrixUser) {
    const queueItem: QueueItem = {
      userId: user.id,
      address: user.address,
      isGhost: user.isGhost,
      joinedQueueAt: Date.now(),
      slotsFilled: 0,
      requiredSlots: 4,
      rank: 2,
      payoutPending: 4.0,
    };

    user.rank2QueueIndex = this.state.rank2Queue.length + 1;
    this.state.rank2Queue.push(queueItem);
    this.state.stats.rank2QueueLength = this.state.rank2Queue.length;

    // The new entry fills a slot for the head of the Rank 2 queue!
    this.stepRank2Queue();
  }

  // Step the Rank 2 FIFO Queue (4 USDT: Slot 1: 50% ($2), Slot 2: 50% ($2) + 1 Ghost in R2, Slots 3 & 4: Accumulate -> Auto-Upgrade Rank 3)
  private stepRank2Queue() {
    if (this.state.rank2Queue.length === 0) return;

    // Head of queue
    const head = this.state.rank2Queue[0];
    head.slotsFilled += 1;

    const headUser = this.getUser(head.userId);
    if (headUser) {
      headUser.rank2SlotsFilled = head.slotsFilled;

      // Slot 1 & 2: 50% payout (2.00 USDT) directly to wallet
      if (head.slotsFilled === 1 || head.slotsFilled === 2) {
        const slotPayout = 2.00;
        if (!headUser.isGhost) {
          headUser.rank2EarnedUSDT += slotPayout;
          headUser.totalEarnedUSDT += slotPayout;
          this.state.stats.totalDistributedUSDT += slotPayout;

          this.state.transactions.unshift({
            id: `tx_${Date.now()}_r2_slot_${head.slotsFilled}`,
            txHash: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
            timestamp: Date.now(),
            type: 'RANK2_PAYOUT',
            userId: headUser.id,
            userAddress: headUser.address,
            amountUSDT: slotPayout,
            details: `Rank 2 Global Queue Slot #${head.slotsFilled} Payout 50% (2.00 USDT)`,
            status: 'SUCCESS',
          });

          this.state.notifications.unshift({
            id: `notif_${Date.now()}_r2_slot_${head.slotsFilled}`,
            title: `💰 รับเงินสด Rank 2 (สล็อตที่ ${head.slotsFilled}/2)!`,
            message: `ผู้เล่น #${headUser.id} รับเงินสด 50% (2.00 USDT) เข้ากระเป๋าโดยตรง!`,
            type: 'reward',
            timestamp: Date.now(),
            amount: slotPayout,
          });
        } else {
          // Ghost payout recirculates to Reborn Pool
          this.state.stats.rebornPoolUSDT += slotPayout;
        }

        // Slot 2 ALSO spawns 1 Ghost ID to push Rank 2 queue forward
        if (head.slotsFilled === 2) {
          this.spawnGhosts(2, 1, `Rank 2 Slot 2 Ghost Catalyst from #${headUser.id}`);
          this.state.notifications.unshift({
            id: `notif_${Date.now()}_r2_ghost_spawn`,
            title: '👻 สล็อตที่ 2 เสกผี 1 ตัวดันคิว Rank 2!',
            message: `ระบบสร้างรหัสผี 1 ตัว (Ghost) เข้าไปดันคิว Rank 2 ทั่วโลกเรียบร้อย`,
            type: 'ghost',
            timestamp: Date.now(),
          });
        }
      }
    }

    // Check if head completed 4 slots -> Advance to Rank 3
    if (head.slotsFilled >= head.requiredSlots) {
      const completedItem = this.state.rank2Queue.shift()!;
      this.state.stats.rank2QueueLength = this.state.rank2Queue.length;

      if (headUser) {
        headUser.cyclesCompleted += 1;

        this.state.transactions.unshift({
          id: `tx_${Date.now()}_r2_complete`,
          txHash: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          timestamp: Date.now(),
          type: 'RANK2_CYCLE',
          userId: headUser.id,
          userAddress: headUser.address,
          amountUSDT: 4.0,
          details: `Rank 2 Complete! Slots 3 & 4 accumulated -> Auto-Upgrade to Rank 3 (8 USDT)`,
          status: 'SUCCESS',
        });

        this.state.notifications.unshift({
          id: `notif_${Date.now()}_r2_complete`,
          title: '🔥 สำเร็จคิว Rank 2 ก้าวสู่ Rank 3!',
          message: `ผู้เล่น #${headUser.id} สะสมทุนครบช่อง 4 ได้รับการ Auto-Upgrade เข้าสู่ Rank 3 (8 USDT)!`,
          type: 'success',
          timestamp: Date.now(),
        });

        // Advance to Rank 3 Gold Board!
        this.enqueueRank3(headUser);
      }

      // Re-index remaining queue
      this.state.rank2Queue.forEach((item, idx) => {
        const u = this.getUser(item.userId);
        if (u) u.rank2QueueIndex = idx + 1;
      });
    }
  }

  // Push user to Rank 3 Gold Board (8 USDT)
  private enqueueRank3(user: MatrixUser) {
    const queueItem: QueueItem = {
      userId: user.id,
      address: user.address,
      isGhost: user.isGhost,
      joinedQueueAt: Date.now(),
      slotsFilled: 0,
      requiredSlots: 4,
      rank: 3,
      payoutPending: 8.0,
    };

    user.rank3BoardPosition = this.state.rank3Queue.length + 1;
    this.state.rank3Queue.push(queueItem);
    this.state.stats.rank3QueueLength = this.state.rank3Queue.length;

    this.stepRank3Queue();
  }

  // Step Rank 3 Gold Board:
  // Slot 1: 1 Real ID Reborn to R1 ($2) + 4 Ghosts to R1 ($8) = $8
  // Slot 2: 100% Cash ($8.00) directly to wallet
  // Slot 3: 2 Ghosts to Rank 2 ($8)
  // Slot 4: 2 Ghosts to Rank 2 ($8) and cycle completed
  private stepRank3Queue() {
    if (this.state.rank3Queue.length === 0) return;

    const head = this.state.rank3Queue[0];
    head.slotsFilled += 1;

    const headUser = this.getUser(head.userId);
    if (headUser) {
      headUser.rank3SlotsFilled = head.slotsFilled;

      // Slot 1: 1 Real ID Reborn ($2) + 4 Ghost IDs ($8) into Rank 1
      if (head.slotsFilled === 1) {
        headUser.rebornCount += 1;
        this.spawnGhosts(1, 4, `Rank 3 Slot 1 Ghosts -> Rank 1 from #${headUser.id}`);
        // Also place Real ID reborn
        if (!headUser.isGhost) {
          const rebornRealId = this.generateNextUserId();
          const rebornUser: MatrixUser = {
            id: rebornRealId,
            address: `${headUser.address.slice(0, 8)}... (Reborn #${rebornRealId})`,
            sponsorId: headUser.sponsorId || 1,
            isGhost: false,
            registeredAt: Date.now(),
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
          this.state.users.push(rebornUser);
          this.placeInRank1(headUser.id, rebornRealId);
        }

        this.state.notifications.unshift({
          id: `notif_${Date.now()}_r3_slot_1`,
          title: '🔄 Rank 3 ช่องที่ 1: เสก Real ID + 4 Ghosts เข้า Rank 1!',
          message: `ผู้เล่น #${headUser.id} สร้าง Real ID Reborn ($2) + 4 Ghost IDs ($8) เข้าผัง Rank 1 รวมมูลค่า 8 USDT`,
          type: 'ghost',
          timestamp: Date.now(),
        });
      }

      // Slot 2: 100% Cash ($8.00) directly to wallet!
      if (head.slotsFilled === 2) {
        const slotPayout = 8.00;
        if (!headUser.isGhost) {
          headUser.rank3EarnedUSDT += slotPayout;
          headUser.totalEarnedUSDT += slotPayout;
          this.state.stats.totalDistributedUSDT += slotPayout;

          this.state.transactions.unshift({
            id: `tx_${Date.now()}_r3_slot_2`,
            txHash: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
            timestamp: Date.now(),
            type: 'RANK3_CYCLE',
            userId: headUser.id,
            userAddress: headUser.address,
            amountUSDT: slotPayout,
            details: `Rank 3 Slot 2 100% Cash Payout (8.00 USDT) directly to wallet`,
            status: 'SUCCESS',
          });

          this.state.notifications.unshift({
            id: `notif_${Date.now()}_r3_slot_2`,
            title: '👑 รับเงินสด Rank 3 เต็ม 100% (8.00 USDT)!',
            message: `ผู้เล่น #${headUser.id} รับเงินสด 8.00 USDT เข้ากระเป๋าทันทีจากช่องที่ 2!`,
            type: 'reward',
            timestamp: Date.now(),
            amount: slotPayout,
          });
        } else {
          this.state.stats.rebornPoolUSDT += slotPayout;
        }
      }

      // Slot 3: Spawn 2 Ghost IDs into Rank 2 ($8 value)
      if (head.slotsFilled === 3) {
        this.spawnGhosts(2, 2, `Rank 3 Slot 3 Ghosts -> Rank 2 from #${headUser.id}`);
        this.state.notifications.unshift({
          id: `notif_${Date.now()}_r3_slot_3`,
          title: '👻 Rank 3 ช่องที่ 3: เสก 2 Ghosts ดันคิว Rank 2!',
          message: `ผู้เล่น #${headUser.id} สร้าง Ghost 2 ตัว (มูลค่า 8 USDT) ดันคิว Rank 2 ทั่วโลก`,
          type: 'ghost',
          timestamp: Date.now(),
        });
      }

      // Slot 4: Spawn 2 Ghost IDs into Rank 2 ($8 value) and complete cycle
      if (head.slotsFilled === 4) {
        this.spawnGhosts(2, 2, `Rank 3 Slot 4 Ghosts -> Rank 2 from #${headUser.id}`);
        this.state.notifications.unshift({
          id: `notif_${Date.now()}_r3_slot_4`,
          title: '👻 Rank 3 ช่องที่ 4: เสก 2 Ghosts ดันคิว Rank 2 & จบรอบ!',
          message: `ผู้เล่น #${headUser.id} สร้าง Ghost 2 ตัว ดันคิว Rank 2 และเคลียร์กระดานจบรอบสมบูรณ์!`,
          type: 'ghost',
          timestamp: Date.now(),
        });
      }
    }

    if (head.slotsFilled >= head.requiredSlots) {
      // Completed Rank 3 Apex Board!
      this.state.rank3Queue.shift();
      this.state.stats.rank3QueueLength = this.state.rank3Queue.length;
      this.state.stats.totalCyclesCompleted += 1;

      if (headUser) {
        headUser.cyclesCompleted += 1;

        this.state.transactions.unshift({
          id: `tx_${Date.now()}_r3_completed`,
          txHash: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
          timestamp: Date.now(),
          type: 'GHOST_SPAWN',
          userId: headUser.id,
          userAddress: headUser.address,
          amountUSDT: 8.0,
          details: `Rank 3 Complete! Total 8 Ghosts spawned (4 in R1, 4 in R2) + 1 Real ID Reborn + 8 USDT Cash!`,
          status: 'SUCCESS',
        });
      }

      // Re-index remaining Rank 3
      this.state.rank3Queue.forEach((item, idx) => {
        const u = this.getUser(item.userId);
        if (u) u.rank3BoardPosition = idx + 1;
      });
    }
  }

  // Spawn Ghost accounts (Owner or Reborn Engine)
  public spawnGhosts(rankTarget: RankLevel = 1, count: number = 1, reason: string = 'Reborn Queue Processing'): { success: boolean; spawnedCount: number } {
    let spawned = 0;
    for (let i = 0; i < count; i++) {
      const ghostId = this.generateNextUserId();
      const ghostAddress = `0xGhost_${Math.random().toString(16).slice(2, 6).toUpperCase()}...${Math.random().toString(16).slice(2, 6).toUpperCase()} (#G${ghostId})`;

      const ghostUser: MatrixUser = {
        id: ghostId,
        address: ghostAddress,
        sponsorId: 1,
        isGhost: true,
        registeredAt: Date.now(),
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

      this.state.users.push(ghostUser);
      this.state.stats.lastUserId = Math.max(this.state.stats.lastUserId, ghostId);
      this.state.stats.totalUsers = this.state.users.length;
      this.state.stats.ghostUsersCount = this.state.users.filter(u => u.isGhost).length;
      this.state.stats.realUsersCount = this.state.users.filter(u => !u.isGhost).length;

      if (rankTarget === 1) {
        // Place in Rank 1 tree where space is available
        this.placeInRank1(1, ghostId);
      } else if (rankTarget === 2) {
        this.enqueueRank2(ghostUser);
      } else if (rankTarget === 3) {
        this.enqueueRank3(ghostUser);
      }

      spawned++;
    }

    // Add TX Log
    this.state.transactions.unshift({
      id: `tx_${Date.now()}_ghost_${spawned}`,
      txHash: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      timestamp: Date.now(),
      type: 'GHOST_SPAWN',
      userId: this.state.users[this.state.users.length - 1].id,
      userAddress: 'Contract Engine',
      amountUSDT: count * 2.0,
      details: `${count} Ghost ID(s) spawned into Rank ${rankTarget} (${reason})`,
      status: 'SUCCESS',
    });

    this.state.notifications.unshift({
      id: `notif_${Date.now()}_ghost_spawn`,
      title: `👻 เสก ${count} รหัสผีสำเร็จ!`,
      message: `ฉีดรหัสผี ${count} รหัสเข้า Rank ${rankTarget} เพื่อดันคิวผู้เล่นทุกคน`,
      type: 'ghost',
      timestamp: Date.now(),
    });

    this.saveState();
    return { success: true, spawnedCount: spawned };
  }

  // Admin Process Reborn Queue
  public processReborn(batchSize: number = 2): { success: boolean; ghostsCreated: number } {
    const ghostsToCreate = Math.min(batchSize, Math.max(1, Math.floor(this.state.stats.rebornPoolUSDT / 2.0)));
    
    // Deduct from reborn pool
    const cost = ghostsToCreate * 2.0;
    this.state.stats.rebornPoolUSDT = Math.max(0, this.state.stats.rebornPoolUSDT - cost);

    // Spawn ghosts into Rank 1 and Rank 2
    this.spawnGhosts(1, ghostsToCreate, 'Admin Batch Reborn Process');

    this.state.transactions.unshift({
      id: `tx_${Date.now()}_reborn`,
      txHash: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      timestamp: Date.now(),
      type: 'PROCESS_REBORN',
      userId: 1,
      userAddress: 'Contract Owner',
      amountUSDT: cost,
      details: `Batch process Reborn completed. Spawned ${ghostsToCreate} Ghost accounts.`,
      status: 'SUCCESS',
    });

    this.saveState();
    return { success: true, ghostsCreated: ghostsToCreate };
  }

  // Claim Rewards
  public claimRewards(userId: number): { success: boolean; amount: number } {
    const user = this.getUser(userId);
    if (!user) return { success: false, amount: 0 };

    const claimable = user.totalEarnedUSDT;
    if (claimable <= 0) return { success: false, amount: 0 };

    this.state.transactions.unshift({
      id: `tx_${Date.now()}_claim`,
      txHash: '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      timestamp: Date.now(),
      type: 'CLAIM_REWARD',
      userId: user.id,
      userAddress: user.address,
      amountUSDT: claimable,
      details: `Claimed ${claimable.toFixed(2)} USDT to wallet`,
      status: 'SUCCESS',
    });

    this.state.notifications.unshift({
      id: `notif_${Date.now()}_claim`,
      title: '💎 ถอนรายได้สำเร็จ!',
      message: `โอน ${claimable.toFixed(2)} USDT เข้ากระเป๋า ${user.address.slice(0, 6)}... เรียบร้อยแล้ว`,
      type: 'reward',
      timestamp: Date.now(),
      amount: claimable,
    });

    this.saveState();
    return { success: true, amount: claimable };
  }

  // Emergency Withdraw (Allows owner to withdraw USDT and BEP-20 tokens)
  public emergencyWithdraw(
    tokenAddress: string, 
    amount: number, 
    recipientAddress: string = CONTRACT_OWNER
  ): { success: boolean; amount: number; txHash: string } {
    const isUsdt = !tokenAddress || tokenAddress.toLowerCase() === USDT_ADDRESS.toLowerCase();
    const withdrawAmount = Math.max(0, Number(amount) || 0);
    const txHash = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    if (isUsdt) {
      // Deduct from reborn pool or stats if applicable
      if (this.state.stats.rebornPoolUSDT >= withdrawAmount) {
        this.state.stats.rebornPoolUSDT -= withdrawAmount;
      }
    }

    this.state.transactions.unshift({
      id: `tx_${Date.now()}_emergency_withdraw`,
      txHash,
      timestamp: Date.now(),
      type: 'EMERGENCY_WITHDRAW',
      userId: 1,
      userAddress: recipientAddress,
      amountUSDT: isUsdt ? withdrawAmount : 0,
      details: `Emergency withdraw of ${withdrawAmount.toFixed(2)} ${isUsdt ? 'USDT' : 'Tokens'} (${tokenAddress.slice(0, 10)}...) to owner wallet`,
      status: 'SUCCESS',
    });

    this.state.notifications.unshift({
      id: `notif_${Date.now()}_emergency_withdraw`,
      title: '💸 ถอนเหรียญฉุกเฉินสำเร็จ!',
      message: `ถอน ${withdrawAmount.toFixed(2)} ${isUsdt ? 'USDT' : 'Tokens'} ออกจาก Smart Contract เข้ากระเป๋า Owner เรียบร้อย`,
      type: 'success',
      timestamp: Date.now(),
      amount: isUsdt ? withdrawAmount : undefined,
    });

    this.saveState();
    return { success: true, amount: withdrawAmount, txHash };
  }

  /**
   * Get all smart contract event logs synchronized with current matrix state
   * Exactly matching Solidity events: Registered, RewardPaid, AutoUpgraded, RebornQueued, SystemPaused
   */
  public getContractEvents(eventName?: string): SmartContractEventLog[] {
    const events: SmartContractEventLog[] = [];
    const filter = eventName && eventName !== 'ALL' ? eventName : undefined;

    // 1. Registered Events (from users array)
    if (!filter || filter === 'Registered') {
      this.state.users.forEach((u, idx) => {
        const isGhost = Boolean(u.isGhost);
        const isAutoReborn = Boolean(u.rebornCount > 0);
        const sponsorId = u.sponsorId || 1;
        const placementId = u.rank1Slots && u.rank1Slots.length > 0 ? u.id : sponsorId;
        const shortWallet = u.address ? `${u.address.slice(0, 6)}...${u.address.slice(-4)}` : '0x0000...0000';
        
        let summary = '';
        if (isGhost) {
          summary = `Ghost Node #${u.id} placed into Rank 1 Matrix (Auto Spillover)`;
        } else if (isAutoReborn) {
          summary = `Reborn ID #${u.id} placed into Rank 1 Matrix under Sponsor #${sponsorId} (${shortWallet})`;
        } else {
          summary = `Member #${u.id} registered under Sponsor #${sponsorId} (${shortWallet})`;
        }

        const baseTime = u.registeredAt || (Date.now() - (this.state.users.length - idx) * 120000);
        events.push({
          eventName: 'Registered',
          txHash: `0x${(100000 + u.id).toString(16).padStart(64, 'a')}`,
          blockNumber: 42100000 + u.id * 3,
          args: {
            newId: String(u.id),
            wallet: u.address,
            sponsorId: String(sponsorId),
            placementId: String(placementId),
            isAutoReborn: isAutoReborn,
            isGhost: isGhost
          },
          formattedSummary: summary,
          timestamp: baseTime
        });
      });
    }

    // 2. RewardPaid Events (from transactions)
    if (!filter || filter === 'RewardPaid') {
      this.state.transactions.forEach((tx, idx) => {
        if (
          tx.type === 'SPONSOR_BONUS' ||
          tx.type === 'RANK1_PAYOUT' ||
          tx.type === 'RANK2_PAYOUT' ||
          tx.type === 'RANK3_PAYOUT' ||
          tx.type === 'CLAIM_REWARD'
        ) {
          const shortWallet = tx.userAddress ? `${tx.userAddress.slice(0, 6)}...${tx.userAddress.slice(-4)}` : '0x...';
          const amountWei = (BigInt(Math.round(tx.amountUSDT * 100)) * BigInt(10 ** 16)).toString();
          events.push({
            eventName: 'RewardPaid',
            txHash: tx.txHash || `0x${(200000 + idx).toString(16).padStart(64, 'b')}`,
            blockNumber: 42100100 + idx * 2,
            args: {
              wallet: tx.userAddress,
              amount: amountWei,
              amountFormatted: `${tx.amountUSDT.toFixed(2)} USDT`,
              note: tx.details
            },
            formattedSummary: `${tx.amountUSDT.toFixed(2)} USDT paid to ${shortWallet} (${tx.details})`,
            timestamp: tx.timestamp
          });
        }
      });
    }

    // 3. AutoUpgraded Events
    if (!filter || filter === 'AutoUpgraded') {
      this.state.users.forEach((u) => {
        // Rank 2 Upgraded
        if (u.rank2SlotsFilled > 0 || u.rank2EarnedUSDT > 0 || u.rank3SlotsFilled > 0 || u.rank3EarnedUSDT > 0 || u.cyclesCompleted > 0) {
          events.push({
            eventName: 'AutoUpgraded',
            txHash: `0x${(300000 + u.id).toString(16).padStart(64, 'c')}`,
            blockNumber: 42100200 + u.id * 4,
            args: {
              userId: String(u.id),
              newRank: '2'
            },
            formattedSummary: `User #${u.id} auto-upgraded to Rank 2 Global FIFO Matrix (4 USDT)`,
            timestamp: (u.registeredAt || Date.now()) + 180000
          });
        }

        // Rank 3 Upgraded
        if (u.rank3SlotsFilled > 0 || u.rank3EarnedUSDT > 0 || u.cyclesCompleted > 0) {
          events.push({
            eventName: 'AutoUpgraded',
            txHash: `0x${(400000 + u.id).toString(16).padStart(64, 'd')}`,
            blockNumber: 42100300 + u.id * 5,
            args: {
              userId: String(u.id),
              newRank: '3'
            },
            formattedSummary: `User #${u.id} auto-upgraded to Rank 3 Global FIFO Matrix (8 USDT)`,
            timestamp: (u.registeredAt || Date.now()) + 360000
          });
        }
      });
    }

    // 4. RebornQueued Events
    if (!filter || filter === 'RebornQueued') {
      this.state.users.forEach((u) => {
        if (u.cyclesCompleted > 0 || u.rebornCount > 0) {
          const shortWallet = u.address ? `${u.address.slice(0, 6)}...${u.address.slice(-4)}` : '0x...';
          events.push({
            eventName: 'RebornQueued',
            txHash: `0x${(500000 + u.id).toString(16).padStart(64, 'e')}`,
            blockNumber: 42100400 + u.id * 6,
            args: {
              ownerId: String(u.id),
              wallet: u.address,
              totalIds: '7',
              isGhost: false
            },
            formattedSummary: `Reborn queued for ID #${u.id}: 7 Reborn nodes entered FIFO cycle (${shortWallet})`,
            timestamp: (u.registeredAt || Date.now()) + 540000
          });
        }
      });
    }

    // 5. SystemPaused Events
    if (!filter || filter === 'SystemPaused') {
      events.push({
        eventName: 'SystemPaused',
        txHash: `0x${(600000).toString(16).padStart(64, 'f')}`,
        blockNumber: 42100001,
        args: {
          isPaused: false
        },
        formattedSummary: `Smart contract pause state: ACTIVE (Trading, Matrices & Payouts Normal)`,
        timestamp: Date.now() - 86400000
      });
    }

    // Sort newest first by timestamp / blockNumber
    return events.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0) || b.blockNumber - a.blockNumber);
  }

  // Reset entire system to Genesis state
  public resetToGenesis(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Fallback
      }
    }
    this.state = this.getDefaultState();
    this.saveState();
  }
}

export const matrixContract = new MockMatrixContract();
