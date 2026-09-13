export type RankLevel = 1 | 2 | 3;

export interface MatrixUser {
  id: number;
  address: string;
  sponsorId: number;
  isGhost: boolean;
  registeredAt: number;
  rank1Slots: number[]; // IDs of children in Rank 1 (max 4 direct)
  rank2QueueIndex: number; // Position in Rank 2 queue (-1 if completed/inactive)
  rank2SlotsFilled: number; // 0..4
  rank3BoardPosition: number; // Position on current active Rank 3 board (-1 if none)
  rank3SlotsFilled: number; // 0..4
  totalEarnedUSDT: number;
  directBonusUSDT: number;
  rank1EarnedUSDT: number;
  rank2EarnedUSDT: number;
  rank3EarnedUSDT: number;
  pendingRebornUSDT: number;
  rebornCount: number;
  cyclesCompleted: number;
  referralsCount: number;
  expiresAt?: number;
  isExpired?: boolean;
  isAutoReborn?: boolean;
}

export interface QueueItem {
  queueIndex?: number;
  userId: number;
  address: string;
  isGhost: boolean;
  joinedQueueAt: number;
  slotsFilled: number; // 0 to 4
  requiredSlots: number; // 4
  rank: RankLevel;
  payoutPending: number;
}

export interface MatrixTransaction {
  id: string;
  txHash: string;
  timestamp: number;
  type: 'REGISTER' | 'SPONSOR_BONUS' | 'RANK1_PAYOUT' | 'RANK2_PAYOUT' | 'RANK3_PAYOUT' | 'RANK2_CYCLE' | 'RANK3_CYCLE' | 'GHOST_SPAWN' | 'PROCESS_REBORN' | 'CLAIM_REWARD' | 'EMERGENCY_WITHDRAW';
  userId: number;
  userAddress: string;
  amountUSDT: number;
  details: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

export interface SystemStats {
  lastUserId: number;
  totalUsers: number;
  realUsersCount: number;
  ghostUsersCount: number;
  totalDistributedUSDT: number;
  globalPoolUSDT: number;
  rebornPoolUSDT: number;
  rank2QueueLength: number;
  rank3QueueLength: number;
  rank2QueueHead?: number;
  rank3QueueHead?: number;
  totalCyclesCompleted: number;
  contractAddress: string;
  network: string;
  usdtTokenAddress: string;
}

export interface MatrixNodeView {
  id: number;
  wallet: string;
  sponsorId: number;
  placementId: number;
  isGhost: boolean;
  isActive: boolean;
  isExpired?: boolean;
  downlineCount: number;
}

export interface UserDashboardData {
  id: number;
  sponsorId: number;
  isAutoReborn: boolean;
  totalEarned: number;
  expiresAt?: number;
  isExpired?: boolean;
  rank1Downlines: number[];
  rank2Downlines: number[];
  rank3Downlines: number[];
  rank2QueueIndex?: number;
  rank3QueueIndex?: number;
}

export interface GlobalQueueItemData {
  queueIndex: number;
  userId: number;
  walletAddress: string;
  isAutoReborn: boolean;
  isGhost: boolean;
  slotsFilled: number;
  pendingRebornFunds: number;
}

export interface PaymentReceivedNotification {
  id: string;
  txHash: string;
  timestamp: number;
  amountUSDT: number;
  category: 'SPONSOR_BONUS' | 'RANK1_PAYOUT' | 'RANK2_PAYOUT' | 'RANK3_PAYOUT' | 'REBORN_PAYOUT' | 'CLAIM_REWARD';
  titleTh: string;
  titleEn: string;
  detailsTh: string;
  detailsEn: string;
  fromUser?: number;
  toUser: number;
  toAddress: string;
  isRead: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'reward' | 'ghost';
  timestamp: number;
  amount?: number;
  txHash?: string;
  category?: string;
  read?: boolean;
}

export interface RegistrationModalState {
  isOpen: boolean;
  status: 'idle' | 'preparing' | 'approving' | 'submitting' | 'waiting_block' | 'success' | 'error';
  title?: string;
  stepText?: string;
  txHash?: string | null;
  sponsorId?: number;
  newUserId?: number;
  errorMessage?: string;
}

export interface SmartContractEventLog {
  eventName: string;
  txHash: string;
  blockNumber: number;
  args: Record<string, unknown>;
  formattedSummary?: string;
  timestamp?: number;
}

export interface PlatformPeriodStat {
  membersCount: number;
  totalVolume: number;
}

export interface PlatformStatsData {
  day1: PlatformPeriodStat;
  week1: PlatformPeriodStat;
  month1: PlatformPeriodStat;
  allTime: PlatformPeriodStat;
}

export interface PlatformAnalyticsData {
  totalInvestment: number;
  queueWaitingCount: number;
  r1Count: number;
  r2Count: number;
  r3Count: number;
  pendingGhosts: number;
  totalPendingFunds: number;
  topInvestmentId: number;
  topEarnedId: number;
  maxEarnedAmount?: number;
}

export interface PlacementSearchResult {
  parentId: number;
  downlineCount: number;
  maxSlots: number;
  availableSlots: number;
  isActive: boolean;
  isExpired: boolean;
  wallet?: string;
  source: 'direct_sponsor' | 'tree_spillover' | 'global_queue' | 'root_fallback';
  levelFromSponsor: number;
  messageTh: string;
  messageEn: string;
}

export interface PlacementCandidate {
  id: number;
  wallet: string;
  downlineCount: number;
  maxSlots: number;
  availableSlots: number;
  level: number;
  isGhost: boolean;
  isActive: boolean;
  isExpired: boolean;
  relationshipTh: string;
  relationshipEn: string;
}
