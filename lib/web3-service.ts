/**
 * Web3 Service Layer for WealthLifeCycle Smart Contract on BSC
 * 
 * Interacts with:
 * - WealthLifeCycle Smart Contract: 0xAE3736ECD23DfB6C49b76Ef8548391C1B6fFf7B9
 * - BEP-20 USDT Token: 0x55d398326f99059fF775485246999027B3197955
 * - BSC Mainnet (Chain ID 56)
 */

import { ethers } from 'ethers';
import { 
  CONTRACT_ADDRESS, 
  USDT_ADDRESS, 
  CONTRACT_OWNER,
  CONTRACT_ABI, 
  ERC20_ABI, 
  BSC_CONFIG 
} from './contracts-config';
import type { 
  GlobalQueueItemData, 
  MatrixNodeView, 
  UserDashboardData,
  PlatformPeriodStat,
  PlatformStatsData,
  PlatformAnalyticsData,
  PlacementSearchResult,
  PlacementCandidate
} from './types';
import { matrixContract } from './mock-contract';

export interface OnChainContractData {
  lastUserId: number;
  owner: string;
  paused: boolean;
  isMigrationLocked: boolean;
  globalPool: string;
  activeNodePointer: number;
  headRebornIndex: number;
  tailRebornIndex: number;
  usdtAddress: string;
  contractAddress: string;
  rank1Price: string;
  rank2Price: string;
  rank3Price: string;
  rank1Duration?: number;
  rank2QueueLength?: number;
  rank3QueueLength?: number;
  deployTime?: number;
  platformStats?: PlatformStatsData;
  platformAnalytics?: PlatformAnalyticsData;
  isLive: boolean;
}

/**
 * Resolves the appropriate EIP-1193 provider instance based on detected environment or wallet preference
 */
export function getInjectedProvider(preferredWallet?: string): ethers.Eip1193Provider | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    ethereum?: ethers.Eip1193Provider & {
      isTokenPocket?: boolean;
      isTp?: boolean;
      isMetaMask?: boolean;
      isTrust?: boolean;
      isBinance?: boolean;
      providers?: (ethers.Eip1193Provider & {
        isTokenPocket?: boolean;
        isTp?: boolean;
        isMetaMask?: boolean;
        isTrust?: boolean;
      })[];
    };
    tokenpocket?: { ethereum?: ethers.Eip1193Provider };
    trustwallet?: { ethereum?: ethers.Eip1193Provider };
    binancew3w?: { ethereum?: ethers.Eip1193Provider };
  };

  const walletLower = preferredWallet?.toLowerCase() || '';

  // 1. If TokenPocket is explicitly requested
  if (walletLower.includes('tokenpocket') || walletLower === 'tp') {
    if (win.tokenpocket?.ethereum) return win.tokenpocket.ethereum;
    if (win.ethereum?.isTokenPocket || win.ethereum?.isTp) return win.ethereum;
    if (win.ethereum?.providers && Array.isArray(win.ethereum.providers)) {
      const tpProvider = win.ethereum.providers.find(p => p.isTokenPocket || p.isTp);
      if (tpProvider) return tpProvider;
    }
  }

  // 2. If MetaMask is explicitly requested
  if (walletLower.includes('metamask')) {
    if (win.ethereum?.isMetaMask && !win.ethereum?.isTokenPocket && !win.ethereum?.isTrust) return win.ethereum;
    if (win.ethereum?.providers && Array.isArray(win.ethereum.providers)) {
      const mmProvider = win.ethereum.providers.find(p => p.isMetaMask && !p.isTokenPocket);
      if (mmProvider) return mmProvider;
    }
  }

  // 3. If Trust Wallet is explicitly requested
  if (walletLower.includes('trust')) {
    if (win.trustwallet?.ethereum) return win.trustwallet.ethereum;
    if (win.ethereum?.isTrust) return win.ethereum;
    if (win.ethereum?.providers && Array.isArray(win.ethereum.providers)) {
      const trustProvider = win.ethereum.providers.find(p => p.isTrust);
      if (trustProvider) return trustProvider;
    }
  }

  // 4. Default / Fallback: Standard injected providers
  if (win.tokenpocket?.ethereum && (walletLower.includes('tokenpocket') || !win.ethereum)) {
    return win.tokenpocket.ethereum;
  }
  if (win.ethereum) return win.ethereum;
  if (win.tokenpocket?.ethereum) return win.tokenpocket.ethereum;
  if (win.trustwallet?.ethereum) return win.trustwallet.ethereum;
  if (win.binancew3w?.ethereum) return win.binancew3w.ethereum;

  return null;
}

/**
 * Switch or add Binance Smart Chain to injected Web3 wallet (TokenPocket / MetaMask / Trust / Binance Wallet)
 */
export async function switchOrAddBscNetwork(preferredWallet?: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const provider = getInjectedProvider(preferredWallet);
  if (!provider || typeof provider.request !== 'function') return false;

  try {
    // Attempt switch to BSC Mainnet (Chain ID: 56 / 0x38)
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BSC_CONFIG.chainIdHex }],
    });
    return true;
  } catch (switchError: unknown) {
    const errorObj = switchError as { code?: number };
    // This error code indicates that the chain has not been added to the wallet.
    if (errorObj?.code === 4902 || errorObj?.code === -32603) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: BSC_CONFIG.chainIdHex,
              chainName: BSC_CONFIG.chainName,
              nativeCurrency: BSC_CONFIG.nativeCurrency,
              rpcUrls: BSC_CONFIG.rpcUrls,
              blockExplorerUrls: BSC_CONFIG.blockExplorerUrls,
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Failed to add BSC chain:', addError);
        return false;
      }
    }
    console.error('Failed to switch to BSC chain:', switchError);
    return false;
  }
}

export const switchOrAddBscChain = switchOrAddBscNetwork;

/**
 * Check if browser has injected Web3 wallet (TokenPocket / MetaMask / Trust Wallet / Binance Web3)
 */
export function hasInjectedWallet(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as unknown as {
    ethereum?: unknown;
    tokenpocket?: unknown;
    trustwallet?: unknown;
    binancew3w?: unknown;
  };
  return typeof win.ethereum !== 'undefined' ||
         typeof win.tokenpocket !== 'undefined' ||
         typeof win.trustwallet !== 'undefined' ||
         typeof win.binancew3w !== 'undefined';
}

// RPC Provider cache and endpoint rotation index
let currentRpcIndex = 0;
let cachedRpcProvider: ethers.JsonRpcProvider | null = null;

const BSC_NETWORK = ethers.Network.from(56);

/**
 * Robust timeout wrapper to prevent any RPC call or promise from hanging or throwing unhandled network errors
 */
export function withTimeout<T>(promise: Promise<T>, ms: number = 3500, fallback: T): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))
  ]);
}

/**
 * Returns a resilient BSC JsonRpcProvider with automatic fallback across multiple reliable nodes
 */
export function getBscJsonRpcProvider(): ethers.JsonRpcProvider {
  if (cachedRpcProvider) return cachedRpcProvider;
  
  const rpcUrl = BSC_CONFIG.rpcUrls[currentRpcIndex % BSC_CONFIG.rpcUrls.length];
  cachedRpcProvider = new ethers.JsonRpcProvider(rpcUrl, BSC_NETWORK, {
    staticNetwork: BSC_NETWORK,
  });
  return cachedRpcProvider;
}

/**
 * Rotate to next RPC provider on connection error
 */
export function rotateRpcProvider(): ethers.JsonRpcProvider {
  currentRpcIndex = (currentRpcIndex + 1) % BSC_CONFIG.rpcUrls.length;
  const nextUrl = BSC_CONFIG.rpcUrls[currentRpcIndex];
  cachedRpcProvider = new ethers.JsonRpcProvider(nextUrl, BSC_NETWORK, {
    staticNetwork: BSC_NETWORK,
  });
  return cachedRpcProvider;
}

/**
 * Safe helper to extract values from ethers v6 Result or Objects
 */
function extractValue<T>(source: unknown, key: string, index: number, fallback: T): T {
  if (source === null || source === undefined) return fallback;
  const s = source as Record<string, unknown>;
  if (s[key] !== undefined && s[key] !== null) return s[key] as T;
  if (s[index] !== undefined && s[index] !== null) return s[index] as T;
  return fallback;
}

/**
 * Returns a Browser Provider if TokenPocket / MetaMask / Injected provider is present
 */
export function getBrowserProvider(preferredWallet?: string): ethers.BrowserProvider | null {
  if (typeof window === 'undefined') return null;
  const provider = getInjectedProvider(preferredWallet);
  if (!provider) return null;
  return new ethers.BrowserProvider(provider);
}

/**
 * Returns contract instance for read/write
 */
export function getContractInstance(runner: ethers.ContractRunner): ethers.Contract {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, runner);
}

/**
 * Returns USDT BEP-20 token contract instance
 */
export function getUsdtContractInstance(runner: ethers.ContractRunner): ethers.Contract {
  return new ethers.Contract(USDT_ADDRESS, ERC20_ABI, runner);
}

/**
 * Fetch overall contract state from blockchain
 */
export async function fetchLiveContractData(): Promise<OnChainContractData | null> {
  const rpcList = BSC_CONFIG.rpcUrls;
  const attempts = Math.min(rpcList.length, 4);
  for (let i = 0; i < attempts; i++) {
    const rpcUrl = rpcList[(currentRpcIndex + i) % rpcList.length];
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl, BSC_NETWORK, {
        staticNetwork: BSC_NETWORK,
      });
      const contract = getContractInstance(provider);

      const lastUserIdRaw = await withTimeout(contract.lastUserId(), 3000, BigInt(0));
      const lastUserId = Number(lastUserIdRaw);
      if (lastUserId > 0) {
        const [
          ownerRaw,
          pausedRaw,
          isMigrationLockedRaw,
          globalPoolRaw,
          activeNodePointerRaw,
          headRebornRaw,
          tailRebornRaw,
          r1PriceRaw,
          r2PriceRaw,
          r3PriceRaw,
          rank1DurationRaw,
          queueLengthsRaw,
          deployTimeRaw,
          statsRaw,
          analyticsRaw
        ] = await Promise.all([
          withTimeout(contract.owner(), 2500, CONTRACT_OWNER),
          withTimeout(contract.paused(), 2500, false),
          withTimeout(contract.isMigrationLocked(), 2500, false),
          withTimeout(contract.globalPool(), 2500, '0x0000000000000000000000000000000000000000'),
          withTimeout(contract.activeNodePointer(), 2500, BigInt(0)),
          withTimeout(contract.headRebornIndex(), 2500, BigInt(0)),
          withTimeout(contract.tailRebornIndex(), 2500, BigInt(0)),
          withTimeout(contract.rankPrices(1), 2500, ethers.parseUnits('2', 18)),
          withTimeout(contract.rankPrices(2), 2500, ethers.parseUnits('4', 18)),
          withTimeout(contract.rankPrices(3), 2500, ethers.parseUnits('8', 18)),
          withTimeout(contract.RANK1_DURATION(), 2500, BigInt(7 * 86400)),
          withTimeout(contract.getAllGlobalQueueLengths(), 2500, null),
          withTimeout(contract.deployTime(), 2500, BigInt(0)).catch(() => BigInt(0)),
          withTimeout(contract.getPlatformStats(), 2500, null).catch(() => null),
          withTimeout(contract.getPlatformAnalytics(0), 2500, null).catch(() => null),
        ]);

        let rank2QLength = 0;
        let rank3QLength = 0;
        if (queueLengthsRaw) {
          rank2QLength = Number(extractValue(queueLengthsRaw, 'rank2Length', 0, 0));
          rank3QLength = Number(extractValue(queueLengthsRaw, 'rank3Length', 1, 0));
        }

        let parsedStats: PlatformStatsData | undefined = undefined;
        if (statsRaw) {
          try {
            const parsePeriod = (st: unknown): PlatformPeriodStat => ({
              membersCount: Number(extractValue(st, 'membersCount', 0, 0)),
              totalVolume: Number(ethers.formatUnits(extractValue(st, 'totalVolume', 1, BigInt(0)), 18)),
            });
            parsedStats = {
              day1: parsePeriod(extractValue(statsRaw, 'day1', 0, null)),
              week1: parsePeriod(extractValue(statsRaw, 'week1', 1, null)),
              month1: parsePeriod(extractValue(statsRaw, 'month1', 2, null)),
              allTime: parsePeriod(extractValue(statsRaw, 'allTime', 3, null)),
            };
          } catch {
            // Ignored if format differs
          }
        }

        let parsedAnalytics: PlatformAnalyticsData | undefined = undefined;
        if (analyticsRaw) {
          try {
            parsedAnalytics = {
              totalInvestment: Number(ethers.formatUnits(extractValue(analyticsRaw, 'totalInvestment', 0, BigInt(0)), 18)),
              queueWaitingCount: Number(extractValue(analyticsRaw, 'queueWaitingCount', 1, 0)),
              r1Count: Number(extractValue(analyticsRaw, 'r1Count', 2, 0)),
              r2Count: Number(extractValue(analyticsRaw, 'r2Count', 3, 0)),
              r3Count: Number(extractValue(analyticsRaw, 'r3Count', 4, 0)),
              pendingGhosts: Number(extractValue(analyticsRaw, 'pendingGhosts', 5, 0)),
              totalPendingFunds: Number(ethers.formatUnits(extractValue(analyticsRaw, 'totalPendingFunds', 6, BigInt(0)), 18)),
              topInvestmentId: Number(extractValue(analyticsRaw, 'topInvestmentId', 7, 0)),
              topEarnedId: Number(extractValue(analyticsRaw, 'topEarnedId', 8, 0)),
            };
          } catch {
            // Ignored if format differs
          }
        }

        return {
          lastUserId,
          owner: String(ownerRaw || CONTRACT_OWNER),
          paused: Boolean(pausedRaw),
          isMigrationLocked: Boolean(isMigrationLockedRaw),
          globalPool: String(globalPoolRaw),
          activeNodePointer: Number(activeNodePointerRaw),
          headRebornIndex: Number(headRebornRaw),
          tailRebornIndex: Number(tailRebornRaw),
          usdtAddress: USDT_ADDRESS,
          contractAddress: CONTRACT_ADDRESS,
          rank1Price: ethers.formatUnits(r1PriceRaw, 18),
          rank2Price: ethers.formatUnits(r2PriceRaw, 18),
          rank3Price: ethers.formatUnits(r3PriceRaw, 18),
          rank1Duration: Number(rank1DurationRaw),
          rank2QueueLength: rank2QLength,
          rank3QueueLength: rank3QLength,
          deployTime: Number(deployTimeRaw),
          platformStats: parsedStats,
          platformAnalytics: parsedAnalytics,
          isLive: true
        };
      }
      rotateRpcProvider();
    } catch {
      rotateRpcProvider();
    }
  }
  return null;
}

// Multicall3 contract address on BSC Mainnet (Standard canonical contract)
export const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';

// Minimal ABI for Multicall3 aggregate3
const MULTICALL3_ABI = [
  'function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) payable returns (tuple(bool success, bytes returnData)[] returnData)',
  'function getEthBalance(address addr) view returns (uint256 balance)',
  'function getBlockHash(uint256 blockNumber) view returns (bytes32 blockHash)',
  'function getCurrentBlockTimestamp() view returns (uint256 timestamp)'
];

// In-memory single-run caches with TTL
const walletIdsCache = new Map<string, { ids: number[]; timestamp: number }>();
const queueCache = new Map<string, { data: { items: GlobalQueueItemData[]; currentHead: number }; timestamp: number }>();
const inFlightWalletIdRequests = new Map<string, Promise<number[]>>();
const inFlightQueueRequests = new Map<string, Promise<{ items: GlobalQueueItemData[]; currentHead: number }>>();

const userDetailsCache = new Map<number, {
  id: number;
  wallet: string;
  sponsorId: number;
  placementId: number;
  isGhost: boolean;
  isActive: boolean;
  isAutoReborn: boolean;
  expiresAt: number;
  createdAt: number;
  pendingRebornFunds: number;
  totalEarnedUSDT: number;
}>();

/**
 * Clear cached wallet IDs (used after registering or forced user refresh)
 */
export function invalidateWalletIdsCache(walletAddress?: string) {
  if (walletAddress) {
    walletIdsCache.delete(walletAddress.toLowerCase());
  } else {
    walletIdsCache.clear();
  }
}

/**
 * Fetch all User IDs mapped to this wallet using smart contract functions
 * (walletToIds, idToWallet reverse mapping scan, and getWalletAvailableRank1Nodes)
 * Executes with cache and full timeout protection across fallback RPCs
 */
export async function fetchWalletAllIdsOnChain(walletAddress: string, forceRefresh: boolean = false): Promise<number[]> {
  if (!ethers.isAddress(walletAddress)) return [];
  const cleanAddr = walletAddress.toLowerCase();
  const cacheKey = cleanAddr;
  const now = Date.now();

  // Return cached result if already fetched within 10 seconds
  if (!forceRefresh && walletIdsCache.has(cacheKey)) {
    const cached = walletIdsCache.get(cacheKey)!;
    if (now - cached.timestamp < 10000 && cached.ids.length > 0) {
      return cached.ids;
    }
  }

  // Deduplicate concurrent in-flight requests
  if (inFlightWalletIdRequests.has(cacheKey)) {
    return inFlightWalletIdRequests.get(cacheKey)!;
  }

  const queryPromise = (async () => {
    const ids: number[] = [];

    // If owner wallet, always include ID 1
    if (cleanAddr === CONTRACT_OWNER.toLowerCase()) {
      ids.push(1);
    }

    const rpcList = BSC_CONFIG.rpcUrls;
    for (let i = 0; i < Math.min(rpcList.length, 3); i++) {
      const rpcUrl = rpcList[(currentRpcIndex + i) % rpcList.length];
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl, BSC_NETWORK, {
          staticNetwork: BSC_NETWORK,
        });
        const contract = getContractInstance(provider);
        const multicall = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);
        const iface = new ethers.Interface(CONTRACT_ABI);

        // Strategy 0: Direct query getWalletAllData (returns all IDs with full stats in 1 call!)
        try {
          const allData = await withTimeout(contract.getWalletAllData(walletAddress), 3500, null).catch(() => null);
          if (allData && Array.isArray(allData)) {
            const parsed = allData.map((item: unknown) => {
              const id = Number(extractValue(item, 'id', 0, 0));
              const sponsorId = Number(extractValue(item, 'sponsorId', 1, 0));
              const isAutoReborn = Boolean(extractValue(item, 'isAutoReborn', 2, true));
              const totalEarnedRaw = extractValue(item, 'totalEarned', 3, BigInt(0));
              const totalEarned = Number(ethers.formatUnits(totalEarnedRaw, 18));
              
              const rawR1 = extractValue(item, 'rank1Downlines', 4, []);
              const rank1Downlines = Array.from(rawR1 as Iterable<unknown>).map(x => Number(x));
              
              const rawR2 = extractValue(item, 'rank2Downlines', 5, []);
              const rank2Downlines = Array.from(rawR2 as Iterable<unknown>).map(x => Number(x));
              
              const rawR3 = extractValue(item, 'rank3Downlines', 6, []);
              const rank3Downlines = Array.from(rawR3 as Iterable<unknown>).map(x => Number(x));

              if (id > 0 && !ids.includes(id)) {
                ids.push(id);
              }

              return {
                id,
                sponsorId,
                isAutoReborn,
                totalEarned,
                rank1Downlines,
                rank2Downlines,
                rank3Downlines
              };
            }).filter(u => u.id > 0);

            if (parsed.length > 0) {
              walletAllDataCache.set(cacheKey, parsed);
            }
          }
        } catch {
          // Fallback to other strategies
        }

        // Strategy 1: Multicall3 query for walletToIds(addr, 0..39) (expanded for users with many IDs)
        try {
          const indexBatch = Array.from({ length: 40 }, (_, k) => k);
          const calls = indexBatch.map(idx => ({
            target: CONTRACT_ADDRESS,
            allowFailure: true,
            callData: iface.encodeFunctionData('walletToIds', [walletAddress, idx])
          }));

          const multicallPromise = multicall.aggregate3(calls);
          const mcResults = await withTimeout(multicallPromise, 3500, null);

          if (mcResults && Array.isArray(mcResults)) {
            mcResults.forEach((res) => {
              if (res.success && res.returnData && res.returnData !== '0x') {
                try {
                  const decoded = iface.decodeFunctionResult('walletToIds', res.returnData);
                  const idNum = Number(decoded[0]);
                  if (idNum > 0 && !ids.includes(idNum)) {
                    ids.push(idNum);
                  }
                } catch {
                  // Ignore decode error
                }
              }
            });
          }
        } catch {
          // Multicall failover
        }

        // Strategy 2: Direct call for walletToIds index 0 and 1..15 if Multicall was empty
        if (ids.length === 0) {
          try {
            const firstIdRaw = await withTimeout(contract.walletToIds(walletAddress, 0), 2000, BigInt(0)).catch(() => BigInt(0));
            const firstId = Number(firstIdRaw);
            if (firstId > 0 && !ids.includes(firstId)) {
              ids.push(firstId);

              const batchIndices = Array.from({ length: 15 }, (_, k) => k + 1);
              const batchResults = await Promise.allSettled(
                batchIndices.map(idx => withTimeout(contract.walletToIds(walletAddress, idx), 2000, BigInt(0)).catch(() => BigInt(0)))
              );

              batchResults.forEach(res => {
                if (res.status === 'fulfilled') {
                  const idNum = Number(res.value);
                  if (idNum > 0 && !ids.includes(idNum)) {
                    ids.push(idNum);
                  }
                }
              });
            }
          } catch {
            // Ignore
          }
        }

        // Strategy 3: Query getWalletAvailableRank1Nodes
        try {
          const availResult = await withTimeout(contract.getWalletAvailableRank1Nodes(walletAddress), 2500, null).catch(() => null);
          if (availResult) {
            const rawIds = extractValue(availResult, 'availableIds', 0, []);
            const availIds = Array.from(rawIds as Iterable<bigint | number>).map(Number);
            availIds.forEach(idNum => {
              if (idNum > 0 && !ids.includes(idNum)) {
                ids.push(idNum);
              }
            });
          }
        } catch {
          // Ignore
        }

        // Strategy 4: Reverse check idToWallet for recent IDs if contract has lastUserId
        try {
          const lastIdRaw = await withTimeout(contract.lastUserId(), 2000, BigInt(0)).catch(() => BigInt(0));
          const lastId = Number(lastIdRaw);
          if (lastId > 0 && lastId <= 200) {
            // Check IDs 1..lastId
            const checkIds = Array.from({ length: lastId }, (_, k) => k + 1).filter(k => !ids.includes(k));
            if (checkIds.length > 0) {
              const idCalls = checkIds.map(uId => ({
                target: CONTRACT_ADDRESS,
                allowFailure: true,
                callData: iface.encodeFunctionData('idToWallet', [uId])
              }));

              const idRes = await withTimeout(multicall.aggregate3(idCalls), 2500, null).catch(() => null);
              if (idRes && Array.isArray(idRes)) {
                idRes.forEach((res, idx) => {
                  if (res.success && res.returnData && res.returnData !== '0x') {
                    try {
                      const decoded = iface.decodeFunctionResult('idToWallet', res.returnData);
                      const mappedWallet = String(decoded[0]).toLowerCase();
                      if (mappedWallet === cleanAddr && !ids.includes(checkIds[idx])) {
                        ids.push(checkIds[idx]);
                      }
                    } catch {
                      // Ignore
                    }
                  }
                });
              }
            }
          }
        } catch {
          // Ignore
        }

        ids.sort((a, b) => a - b);
        walletIdsCache.set(cacheKey, { ids, timestamp: Date.now() });
        return ids;
      } catch (err) {
        console.warn(`RPC ${rpcUrl} failed in fetchWalletAllIdsOnChain:`, err);
        rotateRpcProvider();
      }
    }
    
    // Cache result with current timestamp
    walletIdsCache.set(cacheKey, { ids, timestamp: Date.now() });
    return ids;
  })();

  inFlightWalletIdRequests.set(cacheKey, queryPromise);
  try {
    const result = await queryPromise;
    return result;
  } finally {
    inFlightWalletIdRequests.delete(cacheKey);
  }
}

/**
 * Fast direct query for Wallet USDT & BNB balances and allowance.
 * Uses injected BrowserProvider if available, then fallback JSON-RPC providers.
 */
export async function fetchWalletBalancesDirect(walletAddress: string): Promise<{
  usdtBalance: number;
  bnbBalance: number;
  usdtAllowance: number;
} | null> {
  if (!ethers.isAddress(walletAddress)) return null;

  // 1. Try Browser Provider if available (fastest and directly synced with user's wallet)
  if (typeof window !== 'undefined') {
    const browserProvider = getBrowserProvider();
    if (browserProvider) {
      try {
        const usdt = getUsdtContractInstance(browserProvider);
        const [usdtRaw, bnbRaw, allowRaw] = await Promise.all([
          withTimeout(usdt.balanceOf(walletAddress), 3000, BigInt(0)),
          withTimeout(browserProvider.getBalance(walletAddress), 3000, BigInt(0)),
          withTimeout(usdt.allowance(walletAddress, CONTRACT_ADDRESS), 3000, BigInt(0)),
        ]);
        return {
          usdtBalance: Number(ethers.formatUnits(usdtRaw, 18)),
          bnbBalance: Number(ethers.formatUnits(bnbRaw, 18)),
          usdtAllowance: Number(ethers.formatUnits(allowRaw, 18)),
        };
      } catch (e) {
        console.warn('Browser provider balance fetch failed, falling back to BSC RPC:', e);
      }
    }
  }

  // 2. Fallback: Query via BSC RPC endpoints
  const rpcList = BSC_CONFIG.rpcUrls;
  for (let i = 0; i < Math.min(rpcList.length, 3); i++) {
    const rpcUrl = rpcList[(currentRpcIndex + i) % rpcList.length];
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl, BSC_NETWORK, {
        staticNetwork: BSC_NETWORK,
      });
      const usdt = getUsdtContractInstance(provider);
      const [usdtRaw, bnbRaw, allowRaw] = await Promise.all([
        withTimeout(usdt.balanceOf(walletAddress), 3000, BigInt(0)),
        withTimeout(provider.getBalance(walletAddress), 3000, BigInt(0)),
        withTimeout(usdt.allowance(walletAddress, CONTRACT_ADDRESS), 3000, BigInt(0)),
      ]);
      return {
        usdtBalance: Number(ethers.formatUnits(usdtRaw, 18)),
        bnbBalance: Number(ethers.formatUnits(bnbRaw, 18)),
        usdtAllowance: Number(ethers.formatUnits(allowRaw, 18)),
      };
    } catch (err) {
      console.warn(`RPC ${rpcUrl} balance fetch failed:`, err);
    }
  }

  return null;
}

/**
 * Fetch individual wallet on-chain data (USDT balance, allowance, user ID, total earned)
 */
export async function fetchWalletOnChainDetails(walletAddress: string) {
  if (!ethers.isAddress(walletAddress)) return null;

  const rpcList = BSC_CONFIG.rpcUrls;
  for (let i = 0; i < Math.min(rpcList.length, 3); i++) {
    const rpcUrl = rpcList[(currentRpcIndex + i) % rpcList.length];
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl, BSC_NETWORK, {
        staticNetwork: BSC_NETWORK,
      });
      const contract = getContractInstance(provider);
      const usdt = getUsdtContractInstance(provider);

      const [usdtBalanceRaw, bnbBalanceRaw, allowanceRaw, userIdRaw, walletEarnedRaw] = await Promise.all([
        withTimeout(usdt.balanceOf(walletAddress), 2500, BigInt(0)).catch(() => BigInt(0)),
        withTimeout(provider.getBalance(walletAddress), 2500, BigInt(0)).catch(() => BigInt(0)),
        withTimeout(usdt.allowance(walletAddress, CONTRACT_ADDRESS), 2500, BigInt(0)).catch(() => BigInt(0)),
        withTimeout(contract.walletToIds(walletAddress, 0), 2500, BigInt(0)).catch(() => BigInt(0)),
        withTimeout(contract.getWalletTotalEarned(walletAddress), 2500, BigInt(0)).catch(() => BigInt(0))
      ]);

      let userId = Number(userIdRaw);
      
      // If index 0 was 0, check if wallet has any IDs
      if (userId === 0) {
        const allIds = await fetchWalletAllIdsOnChain(walletAddress);
        if (allIds.length > 0) {
          userId = allIds[0];
        }
      }

      let totalEarnedRaw = walletEarnedRaw;
      let rank1Data: unknown = null;

      if (userId > 0) {
        const [earned, r1] = await Promise.all([
          withTimeout(contract.idTotalEarned(userId), 2000, BigInt(0)).catch(() => BigInt(0)),
          withTimeout(contract.rank1Users(userId), 2000, null).catch(() => null)
        ]);
        if (totalEarnedRaw === BigInt(0)) {
          totalEarnedRaw = earned;
        }
        rank1Data = r1;
      }

      const usdtBalance = Number(ethers.formatUnits(usdtBalanceRaw, 18));
      const bnbBalance = Number(ethers.formatUnits(bnbBalanceRaw, 18));
      const usdtAllowance = Number(ethers.formatUnits(allowanceRaw, 18));
      const totalEarned = Number(ethers.formatUnits(totalEarnedRaw, 18));

      return {
        walletAddress,
        userId,
        usdtBalance,
        bnbBalance,
        usdtAllowance,
        hasApprovedUsdt: usdtAllowance >= 2.0,
        totalEarned,
        rank1Data,
        isRegistered: userId > 0
      };
    } catch (err) {
      console.warn(`RPC ${rpcUrl} failed in fetchWalletOnChainDetails:`, err);
    }
  }
  return null;
}

/**
 * Fetch Full User details on-chain by User ID (idToWallet, rank1Users, idTotalEarned)
 * Caches result in-memory so each user ID is queried only once
 */
export async function fetchUserFullDetailsOnChain(userId: number, forceRefresh: boolean = false): Promise<{
  id: number;
  wallet: string;
  sponsorId: number;
  placementId: number;
  isGhost: boolean;
  isActive: boolean;
  isAutoReborn: boolean;
  expiresAt: number;
  createdAt: number;
  pendingRebornFunds: number;
  totalEarnedUSDT: number;
} | null> {
  if (!userId || userId <= 0) return null;

  if (!forceRefresh && userDetailsCache.has(userId)) {
    return userDetailsCache.get(userId)!;
  }
  
  const rpcList = BSC_CONFIG.rpcUrls;
  for (let i = 0; i < Math.min(rpcList.length, 3); i++) {
    const rpcUrl = rpcList[(currentRpcIndex + i) % rpcList.length];
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl, BSC_NETWORK, {
        staticNetwork: BSC_NETWORK,
      });
      const contract = getContractInstance(provider);

      const [walletRaw, r1Raw, earnedRaw] = await Promise.all([
        withTimeout(contract.idToWallet(userId), 2500, '0x0000000000000000000000000000000000000000').catch(() => '0x0000000000000000000000000000000000000000'),
        withTimeout(contract.rank1Users(userId), 2500, null).catch(() => null),
        withTimeout(contract.idTotalEarned(userId), 2500, BigInt(0)).catch(() => BigInt(0))
      ]);

      const wallet = String(walletRaw);
      const isGhost = Boolean(extractValue(r1Raw, 'isGhost', 2, false));

      if ((!wallet || wallet === '0x0000000000000000000000000000000000000000') && !isGhost) {
        // User not registered on blockchain
        return null;
      }

      const isActive = Boolean(extractValue(r1Raw, 'isActive', 0, true));
      const isAutoReborn = Boolean(extractValue(r1Raw, 'isAutoReborn', 1, true));
      const sponsorId = Number(extractValue(r1Raw, 'sponsorId', 3, 0));
      const placementId = Number(extractValue(r1Raw, 'placementId', 4, 0));
      const pendingFundsRaw = extractValue(r1Raw, 'pendingRebornFunds', 5, 0);
      const pendingRebornFunds = Number(ethers.formatUnits(String(pendingFundsRaw), 18));
      const expiresAt = Number(extractValue(r1Raw, 'expiresAt', 6, 0));
      const createdAt = Number(extractValue(r1Raw, 'createdAt', 7, 0));
      const totalEarnedUSDT = Number(ethers.formatUnits(earnedRaw, 18));

      const userDetails = {
        id: userId,
        wallet,
        sponsorId,
        placementId,
        isGhost,
        isActive,
        isAutoReborn,
        expiresAt,
        createdAt,
        pendingRebornFunds,
        totalEarnedUSDT
      };

      userDetailsCache.set(userId, userDetails);
      return userDetails;
    } catch (error) {
      console.warn(`RPC ${rpcUrl} failed in fetchUserFullDetailsOnChain(${userId}):`, error);
      rotateRpcProvider();
    }
  }
  return null;
}

const idTotalEarnedCache = new Map<number, number>();
const walletTotalEarnedCache = new Map<string, number>();
const walletAvailableRank1Cache = new Map<string, { availableIds: number[]; downlineCounts: number[] }>();
const walletAllDataCache = new Map<string, UserDashboardData[]>();
const teamTreeCache = new Map<number, {
  rawNodes: MatrixNodeView[];
  root: MatrixNodeView | null;
  level1: (MatrixNodeView | { id: number; isGhost: boolean; isSlotEmpty: true })[];
  level2: Record<number, (MatrixNodeView | { id: number; isGhost: boolean; isSlotEmpty: true })[]>;
}>();

/**
 * Clear all in-memory caches (used on manual refresh)
 */
export function invalidateAllWeb3Caches() {
  walletIdsCache.clear();
  userDetailsCache.clear();
  idTotalEarnedCache.clear();
  walletTotalEarnedCache.clear();
  walletAvailableRank1Cache.clear();
  walletAllDataCache.clear();
  teamTreeCache.clear();
}

/**
 * Fetch Total Earned USDT directly from Smart Contract using idTotalEarned(uint256 id)
 * Caches in-memory so each ID is queried only ONCE
 */
export async function fetchIdTotalEarnedOnChain(userId: number, forceRefresh: boolean = false): Promise<number> {
  if (!userId || userId <= 0) return 0;
  
  if (!forceRefresh && idTotalEarnedCache.has(userId)) {
    return idTotalEarnedCache.get(userId)!;
  }

  const rpcList = BSC_CONFIG.rpcUrls;
  for (let i = 0; i < Math.min(rpcList.length, 3); i++) {
    const rpcUrl = rpcList[(currentRpcIndex + i) % rpcList.length];
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl, BSC_NETWORK, {
        staticNetwork: BSC_NETWORK,
      });
      const contract = getContractInstance(provider);
      const earnedRaw = await withTimeout(contract.idTotalEarned(userId), 2500, BigInt(0));
      const val = Number(ethers.formatUnits(earnedRaw, 18));
      idTotalEarnedCache.set(userId, val);
      return val;
    } catch {
      rotateRpcProvider();
    }
  }
  return 0;
}

/**
 * Fetch Total Earned USDT for a wallet address directly from Smart Contract using getWalletTotalEarned(address _wallet)
 * Caches in-memory so each wallet is queried efficiently
 */
export async function fetchWalletTotalEarnedOnChain(walletAddress: string, forceRefresh: boolean = false): Promise<number> {
  if (!ethers.isAddress(walletAddress)) return 0;
  const cacheKey = walletAddress.toLowerCase();

  if (!forceRefresh && walletTotalEarnedCache.has(cacheKey)) {
    return walletTotalEarnedCache.get(cacheKey)!;
  }

  const rpcList = BSC_CONFIG.rpcUrls;
  for (let i = 0; i < Math.min(rpcList.length, 3); i++) {
    const rpcUrl = rpcList[(currentRpcIndex + i) % rpcList.length];
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl, BSC_NETWORK, {
        staticNetwork: BSC_NETWORK,
      });
      const contract = getContractInstance(provider);
      const earnedRaw = await withTimeout(contract.getWalletTotalEarned(walletAddress), 2500, BigInt(0));
      const val = Number(ethers.formatUnits(earnedRaw, 18));
      walletTotalEarnedCache.set(cacheKey, val);
      return val;
    } catch (err) {
      console.warn(`RPC ${rpcUrl} failed in fetchWalletTotalEarnedOnChain:`, err);
      rotateRpcProvider();
    }
  }
  return 0;
}

/**
 * Fetch Available Rank 1 Nodes for a wallet address from Smart Contract using getWalletAvailableRank1Nodes(address _wallet)
 * Returns array of IDs and their current downlineCounts (< 4)
 */
export async function fetchWalletAvailableRank1NodesOnChain(
  walletAddress: string,
  forceRefresh: boolean = false
): Promise<{ availableIds: number[]; downlineCounts: number[] }> {
  if (!ethers.isAddress(walletAddress)) return { availableIds: [], downlineCounts: [] };
  const cacheKey = walletAddress.toLowerCase();

  if (!forceRefresh && walletAvailableRank1Cache.has(cacheKey)) {
    return walletAvailableRank1Cache.get(cacheKey)!;
  }

  const rpcList = BSC_CONFIG.rpcUrls;
  for (let i = 0; i < Math.min(rpcList.length, 3); i++) {
    const rpcUrl = rpcList[(currentRpcIndex + i) % rpcList.length];
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl, BSC_NETWORK, {
        staticNetwork: BSC_NETWORK,
      });
      const contract = getContractInstance(provider);
      const res = await withTimeout(contract.getWalletAvailableRank1Nodes(walletAddress), 2500, null);
      if (res) {
        const rawIds = extractValue(res, 'availableIds', 0, []);
        const rawCounts = extractValue(res, 'downlineCounts', 1, []);

        const availableIds = Array.from(rawIds as Iterable<unknown>).map((x: unknown) => Number(x));
        const downlineCounts = Array.from(rawCounts as Iterable<unknown>).map((x: unknown) => Number(x));

        const result = { availableIds, downlineCounts };
        walletAvailableRank1Cache.set(cacheKey, result);
        return result;
      }
    } catch (err) {
      console.warn(`RPC ${rpcUrl} failed in fetchWalletAvailableRank1NodesOnChain:`, err);
      rotateRpcProvider();
    }
  }
  return { availableIds: [], downlineCounts: [] };
}

/**
 * Fetch expired IDs and their earnings for a wallet from Smart Contract using getWalletExpiredIdsAndTotalEarned(address _wallet)
 */
export async function fetchWalletExpiredIdsAndTotalEarnedOnChain(
  walletAddress: string
): Promise<{ expiredIds: number[]; earnedAmounts: number[] }> {
  if (!ethers.isAddress(walletAddress)) return { expiredIds: [], earnedAmounts: [] };

  const rpcList = BSC_CONFIG.rpcUrls;
  for (let i = 0; i < Math.min(rpcList.length, 3); i++) {
    const rpcUrl = rpcList[(currentRpcIndex + i) % rpcList.length];
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl, BSC_NETWORK, {
        staticNetwork: BSC_NETWORK,
      });
      const contract = getContractInstance(provider);
      const res = await withTimeout(contract.getWalletExpiredIdsAndTotalEarned(walletAddress), 3000, null);
      if (res) {
        const rawIds = extractValue(res, 'expiredIds', 0, []);
        const rawEarned = extractValue(res, 'earnedAmounts', 1, []);

        const expiredIds = Array.from(rawIds as Iterable<unknown>).map((x: unknown) => Number(x));
        const earnedAmounts = Array.from(rawEarned as Iterable<unknown>).map((x: unknown) => 
          Number(ethers.formatUnits(BigInt(String(x || 0)), 18))
        );

        return { expiredIds, earnedAmounts };
      }
    } catch (err) {
      console.warn(`RPC ${rpcUrl} failed in fetchWalletExpiredIdsAndTotalEarnedOnChain:`, err);
      rotateRpcProvider();
    }
  }
  return { expiredIds: [], earnedAmounts: [] };
}

/**
 * Check if a user ID has reached Rank 2: hasReachedRank2(uint256)
 */
export async function checkHasReachedRank2OnChain(userId: number): Promise<boolean> {
  if (userId <= 0) return false;
  try {
    const provider = getBscJsonRpcProvider();
    const contract = getContractInstance(provider);
    return await contract.hasReachedRank2(userId);
  } catch {
    return false;
  }
}

/**
 * Fetch total queue lengths for rank 2 and rank 3: getAllGlobalQueueLengths()
 */
export async function fetchAllGlobalQueueLengthsOnChain(): Promise<{ rank2Length: number; rank3Length: number }> {
  try {
    const provider = getBscJsonRpcProvider();
    const contract = getContractInstance(provider);
    const res = await contract.getAllGlobalQueueLengths();
    const rank2Length = Number(extractValue(res, 'rank2Length', 0, 0));
    const rank3Length = Number(extractValue(res, 'rank3Length', 1, 0));
    return { rank2Length, rank3Length };
  } catch {
    return { rank2Length: 0, rank3Length: 0 };
  }
}

/**
 * Fetch single queue length for specified rank: getGlobalQueueLength(uint256 rank)
 */
export async function fetchGlobalQueueLengthOnChain(rank: number): Promise<number> {
  try {
    const provider = getBscJsonRpcProvider();
    const contract = getContractInstance(provider);
    const res = await contract.getGlobalQueueLength(rank);
    return Number(res);
  } catch {
    return 0;
  }
}

/**
 * Fetch RANK1_DURATION constant from Smart Contract
 */
export async function fetchRank1DurationOnChain(): Promise<number> {
  try {
    const provider = getBscJsonRpcProvider();
    const contract = getContractInstance(provider);
    const res = await contract.RANK1_DURATION();
    return Number(res);
  } catch {
    return 7 * 86400;
  }
}

/**
 * Fetch complete dashboard data for all IDs owned by a wallet from Smart Contract using getWalletAllData(address _wallet)
 * Returns array of UserDashboardData structs containing ID, sponsorId, isAutoReborn, totalEarned, and downlines across 3 ranks
 */
export async function fetchWalletAllDataOnChain(
  walletAddress: string,
  forceRefresh: boolean = false
): Promise<UserDashboardData[]> {
  if (!ethers.isAddress(walletAddress)) return [];
  const cacheKey = walletAddress.toLowerCase();

  if (!forceRefresh && walletAllDataCache.has(cacheKey)) {
    return walletAllDataCache.get(cacheKey)!;
  }

  const rpcList = BSC_CONFIG.rpcUrls;
  for (let i = 0; i < Math.min(rpcList.length, 3); i++) {
    const rpcUrl = rpcList[(currentRpcIndex + i) % rpcList.length];
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl, BSC_NETWORK, {
        staticNetwork: BSC_NETWORK,
      });
      const contract = getContractInstance(provider);
      const rawData = await withTimeout(contract.getWalletAllData(walletAddress), 3500, null);
      
      if (rawData && Array.isArray(rawData)) {
        const parsed: UserDashboardData[] = rawData.map((item: unknown) => {
          const id = Number(extractValue(item, 'id', 0, 0));
          const sponsorId = Number(extractValue(item, 'sponsorId', 1, 0));
          const isAutoReborn = Boolean(extractValue(item, 'isAutoReborn', 2, true));
          const totalEarnedRaw = extractValue(item, 'totalEarned', 3, BigInt(0));
          const totalEarned = Number(ethers.formatUnits(totalEarnedRaw, 18));
          const expiresAt = Number(extractValue(item, 'expiresAt', 4, 0));
          const isExpired = Boolean(extractValue(item, 'isExpired', 5, false));
          
          const rawR1 = extractValue(item, 'rank1Downlines', 6, []);
          const rank1Downlines = Array.from(rawR1 as Iterable<unknown>).map(x => Number(x));
          
          const rawR2 = extractValue(item, 'rank2Downlines', 7, []);
          const rank2Downlines = Array.from(rawR2 as Iterable<unknown>).map(x => Number(x));
          
          const rawR3 = extractValue(item, 'rank3Downlines', 8, []);
          const rank3Downlines = Array.from(rawR3 as Iterable<unknown>).map(x => Number(x));

          const rank2QueueIndexRaw = extractValue(item, 'rank2QueueIndex', 9, -1);
          const rank2QueueIndex = Number(rank2QueueIndexRaw);

          const rank3QueueIndexRaw = extractValue(item, 'rank3QueueIndex', 10, -1);
          const rank3QueueIndex = Number(rank3QueueIndexRaw);

          return {
            id,
            sponsorId,
            isAutoReborn,
            totalEarned,
            expiresAt,
            isExpired,
            rank1Downlines,
            rank2Downlines,
            rank3Downlines,
            rank2QueueIndex,
            rank3QueueIndex
          };
        }).filter(u => u.id > 0);

        walletAllDataCache.set(cacheKey, parsed);
        return parsed;
      }
    } catch (err) {
      console.warn(`RPC ${rpcUrl} failed in fetchWalletAllDataOnChain:`, err);
      rotateRpcProvider();
    }
  }
  return [];
}

/**
 * Fetch Team Tree from Smart Contract using getTeamTree(uint256 _rootId)
 * Caches in-memory so each ID matrix is queried only ONCE
 */
export async function fetchTeamTreeOnChain(rootId: number = 1, forceRefresh: boolean = false): Promise<{
  rawNodes: MatrixNodeView[];
  root: MatrixNodeView | null;
  level1: (MatrixNodeView | { id: number; isGhost: boolean; isSlotEmpty: true })[];
  level2: Record<number, (MatrixNodeView | { id: number; isGhost: boolean; isSlotEmpty: true })[]>;
} | null> {
  if (!forceRefresh && teamTreeCache.has(rootId)) {
    return teamTreeCache.get(rootId)!;
  }

  const rpcList = BSC_CONFIG.rpcUrls;
  for (let rpcAttempt = 0; rpcAttempt < Math.min(rpcList.length, 3); rpcAttempt++) {
    const rpcUrl = rpcList[(currentRpcIndex + rpcAttempt) % rpcList.length];
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl, BSC_NETWORK, {
        staticNetwork: BSC_NETWORK,
      });
      const contract = getContractInstance(provider);
      const rawTree = await withTimeout(contract.getTeamTree(rootId), 3000, null);
      
      if (!rawTree || rawTree.length === 0) continue;

      const rawArray = Array.from(rawTree as Iterable<unknown>);

      const parsedNodes: MatrixNodeView[] = rawArray.map((node: unknown) => {
        const id = Number(extractValue(node, 'id', 0, 0));
        const wallet = String(extractValue(node, 'wallet', 1, '0x0000000000000000000000000000000000000000'));
        const sponsorId = Number(extractValue(node, 'sponsorId', 2, 0));
        const placementId = Number(extractValue(node, 'placementId', 3, 0));
        const isGhost = Boolean(extractValue(node, 'isGhost', 4, false));
        const isActive = Boolean(extractValue(node, 'isActive', 5, true));
        const isExpired = Boolean(extractValue(node, 'isExpired', 6, false));
        const downlineCount = Number(extractValue(node, 'downlineCount', 7, 0));

        return {
          id,
          wallet,
          sponsorId,
          placementId,
          isGhost,
          isActive,
          isExpired,
          downlineCount
        };
      });

      const root = parsedNodes.find(n => n.id === rootId) || parsedNodes[0] || null;
      if (!root) return null;

      // In WealthLifeCycle contract getTeamTree returns 21 nodes:
      // index 0: root
      // indices 1..4: Level 1 (4 slots under root)
      // indices 5..8: Level 2 under Level 1 slot 1
      // indices 9..12: Level 2 under Level 1 slot 2
      // indices 13..16: Level 2 under Level 1 slot 3
      // indices 17..20: Level 2 under Level 1 slot 4

      const level1: (MatrixNodeView | { id: number; isGhost: boolean; isSlotEmpty: true })[] = [];
      for (let i = 0; i < 4; i++) {
        const nodeAtIndex = parsedNodes[1 + i];
        if (nodeAtIndex && (nodeAtIndex.id > 0 || nodeAtIndex.isGhost)) {
          level1.push(nodeAtIndex);
        } else {
          // Check placement fallback
          const directPlaced = parsedNodes.slice(1).find(n => n.placementId === root.id && !level1.some(l => !('isSlotEmpty' in l) && l.id === n.id) && (n.id > 0 || n.isGhost));
          if (directPlaced) {
            level1.push(directPlaced);
          } else {
            level1.push({ id: -(i + 1), isGhost: false, isSlotEmpty: true });
          }
        }
      }

      // Level 2 (16 sub-slots: 4 under each level 1 parent)
      const level2: Record<number, (MatrixNodeView | { id: number; isGhost: boolean; isSlotEmpty: true })[]> = {};
      level1.forEach((parent, i) => {
        if (!('isSlotEmpty' in parent) && parent.id > 0) {
          const subList: (MatrixNodeView | { id: number; isGhost: boolean; isSlotEmpty: true })[] = [];
          for (let j = 0; j < 4; j++) {
            const subIndex = 5 + (i * 4) + j;
            const subNode = parsedNodes[subIndex];
            if (subNode && (subNode.id > 0 || subNode.isGhost)) {
              subList.push(subNode);
            } else {
              // Placement fallback
              const subPlaced = parsedNodes.slice(5).find(n => n.placementId === parent.id && !subList.some(s => !('isSlotEmpty' in s) && s.id === n.id) && (n.id > 0 || n.isGhost));
              if (subPlaced) {
                subList.push(subPlaced);
              } else {
                subList.push({ id: -(100 + i * 4 + j), isGhost: false, isSlotEmpty: true });
              }
            }
          }
          level2[parent.id] = subList;
        }
      });

      const treeResult = {
        rawNodes: parsedNodes,
        root,
        level1,
        level2
      };

      teamTreeCache.set(rootId, treeResult);
      return treeResult;
    } catch {
      rotateRpcProvider();
    }
  }
  return null;
}

/**
 * Fetch Single Global Queue Item using globalQueues(uint256 rank, uint256 index)
 */
export async function fetchGlobalQueueItemOnChain(rank: number, index: number): Promise<GlobalQueueItemData | null> {
  try {
    const provider = getBscJsonRpcProvider();
    const contract = getContractInstance(provider);
    const result = await contract.globalQueues(rank, index);
    
    if (!result) return null;

    const queueIndex = Number(extractValue(result, 'queueIndex', 0, index));
    const userId = Number(extractValue(result, 'userId', 1, 0));
    
    if (userId === 0 && queueIndex === 0 && index > 0) return null;

    const isAutoReborn = Boolean(extractValue(result, 'isAutoReborn', 2, true));
    const isGhost = Boolean(extractValue(result, 'isGhost', 3, false));
    const slotsFilled = Number(extractValue(result, 'slotsFilled', 4, 0));
    const pendingFundsRaw = extractValue(result, 'pendingRebornFunds', 5, 0);
    const pendingRebornFunds = Number(ethers.formatUnits(String(pendingFundsRaw), 18));

    let walletAddress = '0x0000000000000000000000000000000000000000';
    if (userId > 0) {
      try {
        walletAddress = await contract.idToWallet(userId);
      } catch {
        // Fallback
      }
    }

    return {
      queueIndex,
      userId,
      walletAddress,
      isAutoReborn,
      isGhost,
      slotsFilled,
      pendingRebornFunds
    };
  } catch {
    // Reverted when index is out of bounds
    return null;
  }
}

/**
 * Fetch Current Head of Global Queue for a rank using currentHeads(uint256 rank)
 */
export async function fetchCurrentHeadOnChain(rank: number = 2): Promise<number> {
  try {
    const provider = getBscJsonRpcProvider();
    const contract = getContractInstance(provider);
    const headRaw = await contract.currentHeads(rank).catch(() => BigInt(0));
    return Number(headRaw);
  } catch (err) {
    console.warn(`Error querying currentHeads(${rank}) on-chain:`, err);
    return 0;
  }
}

/**
 * Fetch Global Queue items with Multicall3 Atomic Batching and SWR Cache
 * Queries currentHeads(rank), getGlobalQueuePaginated(rank, head, limit), and idToWallet in single RPC roundtrip!
 */
export async function fetchGlobalQueuePaginatedOnChain(
  rank: number = 2, 
  startIdx?: number, 
  limit: number = 5,
  forceRefresh: boolean = false
): Promise<{ items: GlobalQueueItemData[]; currentHead: number }> {
  const cacheKey = `queue_${rank}_${startIdx ?? 'auto'}_${limit}`;
  const now = Date.now();

  // Return SWR memory cache if valid within 4 seconds
  if (!forceRefresh && queueCache.has(cacheKey)) {
    const cached = queueCache.get(cacheKey)!;
    if (now - cached.timestamp < 4000) {
      return cached.data;
    }
  }

  // Deduplicate in-flight requests
  if (inFlightQueueRequests.has(cacheKey)) {
    return inFlightQueueRequests.get(cacheKey)!;
  }

  const queryPromise = (async () => {
    const rpcList = BSC_CONFIG.rpcUrls;
    for (let i = 0; i < Math.min(rpcList.length, 3); i++) {
      const rpcUrl = rpcList[(currentRpcIndex + i) % rpcList.length];
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl, BSC_NETWORK, {
          staticNetwork: BSC_NETWORK,
        });
        const contract = getContractInstance(provider);
        const iface = new ethers.Interface(CONTRACT_ABI);
        const multicall = new ethers.Contract(MULTICALL3_ADDRESS, MULTICALL3_ABI, provider);

        // Step 1: Query currentHeads(rank)
        let effectiveStartIdx = startIdx;
        let head = 0;
        try {
          const headRaw = await withTimeout(contract.currentHeads(rank), 2500, BigInt(0)).catch(() => BigInt(0));
          head = Number(headRaw);
          if (effectiveStartIdx === undefined) {
            effectiveStartIdx = head;
          }
        } catch {
          effectiveStartIdx = effectiveStartIdx ?? 0;
        }

        const items: GlobalQueueItemData[] = [];

        // Step 2: Query getGlobalQueuePaginated(rank, startIdx, limit)
        try {
          const paginated = await withTimeout(contract.getGlobalQueuePaginated(rank, effectiveStartIdx, limit), 3000, null);
          if (paginated) {
            const rawUserIds = extractValue(paginated, 'userIds', 0, []);
            const userIds = Array.from(rawUserIds as Iterable<bigint | number>);
            const rawGhosts = extractValue(paginated, 'isGhostFlags', 1, []);
            const isGhostFlags = Array.from(rawGhosts as Iterable<boolean>);
            const rawSlots = extractValue(paginated, 'slotsFilled', 2, []);
            const slotsFilled = Array.from(rawSlots as Iterable<number | bigint>);

            // Batch resolve wallet addresses via Multicall3 if userIds exist
            let walletAddresses: string[] = [];
            const validUserIds = userIds.map(u => Number(u));

            if (validUserIds.some(id => id > 0)) {
              try {
                const mcCalls = validUserIds.map(uId => ({
                  target: CONTRACT_ADDRESS,
                  allowFailure: true,
                  callData: uId > 0 ? iface.encodeFunctionData('idToWallet', [uId]) : '0x'
                }));
                const mcRes = await withTimeout(multicall.aggregate3(mcCalls), 2500, null);
                if (mcRes && Array.isArray(mcRes)) {
                  walletAddresses = mcRes.map((res, idx) => {
                    if (res.success && res.returnData && res.returnData !== '0x' && validUserIds[idx] > 0) {
                      try {
                        const decoded = iface.decodeFunctionResult('idToWallet', res.returnData);
                        return String(decoded[0]);
                      } catch {
                        return '0x0000000000000000000000000000000000000000';
                      }
                    }
                    return '0x0000000000000000000000000000000000000000';
                  });
                }
              } catch {
                // Multicall failover to direct promises
              }
            }

            // Fallback for wallet addresses if Multicall was empty
            if (walletAddresses.length === 0) {
              const walletAddressPromises = validUserIds.map(async (uId) => {
                if (uId <= 0) return '0x0000000000000000000000000000000000000000';
                try {
                  return await withTimeout(contract.idToWallet(uId), 2000, '0x0000000000000000000000000000000000000000');
                } catch {
                  return '0x0000000000000000000000000000000000000000';
                }
              });
              walletAddresses = await Promise.all(walletAddressPromises);
            }

            for (let i = 0; i < userIds.length; i++) {
              const uId = Number(userIds[i]);
              if (uId > 0) {
                items.push({
                  queueIndex: effectiveStartIdx + i,
                  userId: uId,
                  walletAddress: walletAddresses[i] || '0x0000000000000000000000000000000000000000',
                  isAutoReborn: true,
                  isGhost: Boolean(isGhostFlags[i]),
                  slotsFilled: Number(slotsFilled[i] || 0),
                  pendingRebornFunds: 0
                });
              }
            }
          }
        } catch (paginatedError) {
          console.warn(`getGlobalQueuePaginated(${rank}, ${effectiveStartIdx}, ${limit}) error:`, paginatedError);
        }

        if (items.length > 0) {
          const result = { items, currentHead: head };
          queueCache.set(cacheKey, { data: result, timestamp: Date.now() });
          return result;
        }

        // Fallback: Query single globalQueues
        for (let i = 0; i < Math.min(limit, 10); i++) {
          const idx = effectiveStartIdx + i;
          const singleItem = await fetchGlobalQueueItemOnChain(rank, idx);
          if (singleItem && singleItem.userId > 0) {
            items.push(singleItem);
          }
        }

        const finalResult = { items, currentHead: head };
        queueCache.set(cacheKey, { data: finalResult, timestamp: Date.now() });
        return finalResult;
      } catch (err) {
        console.warn(`RPC ${rpcUrl} failed in fetchGlobalQueuePaginatedOnChain:`, err);
        rotateRpcProvider();
      }
    }
    return { items: [], currentHead: 0 };
  })();

  inFlightQueueRequests.set(cacheKey, queryPromise);
  try {
    const result = await queryPromise;
    return result;
  } finally {
    inFlightQueueRequests.delete(cacheKey);
  }
}

/**
 * Fetch Global Queue items using globalQueues(uint256 rank, uint256 index) in batch
 */
export async function fetchGlobalQueuesOnChain(rank: number = 2, maxCount: number = 20): Promise<GlobalQueueItemData[]> {
  const result = await fetchGlobalQueuePaginatedOnChain(rank, undefined, maxCount);
  return result.items;
}

/**
 * Fetch rank prices for ranks 1, 2, 3 using rankPrices(uint256)
 */
export async function fetchRankPricesOnChain(): Promise<{ rank1: number; rank2: number; rank3: number }> {
  try {
    const provider = getBscJsonRpcProvider();
    const contract = getContractInstance(provider);
    const [p1, p2, p3] = await Promise.all([
      withTimeout(contract.rankPrices(1), 2500, ethers.parseUnits('2', 18)).catch(() => ethers.parseUnits('2', 18)),
      withTimeout(contract.rankPrices(2), 2500, ethers.parseUnits('4', 18)).catch(() => ethers.parseUnits('4', 18)),
      withTimeout(contract.rankPrices(3), 2500, ethers.parseUnits('8', 18)).catch(() => ethers.parseUnits('8', 18)),
    ]);
    return {
      rank1: Number(ethers.formatUnits(p1, 18)),
      rank2: Number(ethers.formatUnits(p2, 18)),
      rank3: Number(ethers.formatUnits(p3, 18)),
    };
  } catch (e) {
    console.warn('fetchRankPricesOnChain failed:', e);
    return { rank1: 2, rank2: 4, rank3: 8 };
  }
}

/**
 * Check if migration is locked using isMigrationLocked()
 */
export async function fetchIsMigrationLockedOnChain(): Promise<boolean> {
  try {
    const provider = getBscJsonRpcProvider();
    const contract = getContractInstance(provider);
    const isLocked = await withTimeout(contract.isMigrationLocked(), 2500, false);
    return Boolean(isLocked);
  } catch {
    return false;
  }
}

/**
 * Fetch active rank 1 node at index using activeRank1Nodes(uint256)
 */
export async function fetchActiveRank1NodeOnChain(index: number): Promise<number> {
  try {
    const provider = getBscJsonRpcProvider();
    const contract = getContractInstance(provider);
    const nodeId = await withTimeout(contract.activeRank1Nodes(index), 2500, BigInt(0));
    return Number(nodeId);
  } catch {
    return 0;
  }
}

/**
 * Fetch reborn queue element using rebornQueue(uint256 index)
 */
export async function fetchRebornQueueItemOnChain(index: number): Promise<{
  sponsorId: number;
  ownerWallet: string;
  remainingIds: number;
  targetRank: number;
  isGhost: boolean;
} | null> {
  try {
    const provider = getBscJsonRpcProvider();
    const contract = getContractInstance(provider);
    const item = await withTimeout(contract.rebornQueue(index), 2500, null);
    if (!item) return null;
    return {
      sponsorId: Number(extractValue(item, 'sponsorId', 0, 0)),
      ownerWallet: String(extractValue(item, 'ownerWallet', 1, '0x0000000000000000000000000000000000000000')),
      remainingIds: Number(extractValue(item, 'remainingIds', 2, 0)),
      targetRank: Number(extractValue(item, 'targetRank', 3, 1)),
      isGhost: Boolean(extractValue(item, 'isGhost', 4, false)),
    };
  } catch {
    return null;
  }
}

/**
 * Register user under sponsor ID and parent/placement ID: register(uint256 sponsorId, uint256 parentId)
 */
export async function registerUserOnChain(
  sponsorId: number,
  parentId: number | ethers.ContractRunner = 0,
  signer?: ethers.ContractRunner
): Promise<ethers.ContractTransactionResponse> {
  // Support flexible argument order for backwards compatibility
  let effectiveParentId = typeof parentId === 'number' ? parentId : 0;
  let effectiveSigner = signer;
  if (typeof parentId === 'object' && parentId !== null && 'sendTransaction' in (parentId as unknown as Record<string, unknown>)) {
    effectiveSigner = parentId as unknown as ethers.ContractRunner;
    effectiveParentId = 0;
  }
  if (!effectiveSigner) {
    throw new Error('Signer is required to execute register transaction');
  }
  const contract = getContractInstance(effectiveSigner);
  return await contract.register(sponsorId, effectiveParentId || 0);
}

/**
 * Check if Parent/Placement ID is valid for downline registration:
 * checkParentValid(uint256 parentId) -> (bool isActive, bool isExpired, uint256 downlineCount)
 */
export async function checkParentValidOnChain(parentId: number): Promise<{
  isActive: boolean;
  isExpired: boolean;
  downlineCount: number;
  isValid: boolean;
  canAcceptDownline: boolean;
}> {
  if (parentId <= 0) {
    return { isActive: false, isExpired: false, downlineCount: 0, isValid: false, canAcceptDownline: false };
  }
  try {
    const provider = getBscJsonRpcProvider();
    const contract = getContractInstance(provider);
    const result = await withTimeout(contract.checkParentValid(parentId), 2500, null);
    if (!result) {
      // Fallback to mock contract if on-chain RPC is unavailable
      const mockResult = matrixContract.checkParentValid(parentId);
      return mockResult;
    }
    const isActive = Boolean(extractValue(result, 'isActive', 0, false));
    const isExpired = Boolean(extractValue(result, 'isExpired', 1, false));
    const downlineCount = Number(extractValue(result, 'downlineCount', 2, 0));
    const isValid = isActive && !isExpired;
    const canAcceptDownline = isValid && downlineCount < 4;
    return {
      isActive,
      isExpired,
      downlineCount,
      isValid,
      canAcceptDownline
    };
  } catch (err) {
    console.warn(`checkParentValid(${parentId}) failed:`, err);
    // Fallback to mock contract
    return matrixContract.checkParentValid(parentId);
  }
}

/**
 * Automatically search and determine the optimal Parent / Placement ID under a given Sponsor
 * Uses Breadth-First Search (BFS) in the downline tree to find the shallowest node with < 4 downlines:
 * 1. Checks if Sponsor node can accept downline (< 4 slots filled)
 * 2. If full, traverses the Sponsor's team tree (Level 1, Level 2, ...) for active nodes with open slots (< 4)
 * 3. If team tree is full, checks Smart Contract activeNodePointer
 * 4. Fallback to Root ID 1
 */
export async function findOptimalPlacementOnChain(sponsorId: number = 1): Promise<PlacementSearchResult> {
  const targetSponsorId = Math.max(1, sponsorId || 1);

  try {
    // 1. Check direct sponsor node (< 4 downlines)
    const sponsorCheck = await checkParentValidOnChain(targetSponsorId);
    if (sponsorCheck.canAcceptDownline) {
      return {
        parentId: targetSponsorId,
        downlineCount: sponsorCheck.downlineCount,
        maxSlots: 4,
        availableSlots: Math.max(0, 4 - sponsorCheck.downlineCount),
        isActive: sponsorCheck.isActive,
        isExpired: sponsorCheck.isExpired,
        source: 'direct_sponsor',
        levelFromSponsor: 0,
        messageTh: `ต่อตรงติดตัวผู้แนะนำ #${targetSponsorId} ทันที (ว่าง ${4 - sponsorCheck.downlineCount}/4 ช่อง)`,
        messageEn: `Direct Placement Under Sponsor #${targetSponsorId} (${4 - sponsorCheck.downlineCount}/4 open)`,
      };
    }

    // 2. Sponsor has 4/4 slots filled. Traverse team tree using BFS (Level 1, then Level 2)
    const tree = await fetchTeamTreeOnChain(targetSponsorId);
    if (tree && tree.rawNodes && tree.rawNodes.length > 0) {
      // Level 1 nodes first:
      for (const node of tree.level1) {
        if (node.id > 0 && !('isSlotEmpty' in node)) {
          const check = await checkParentValidOnChain(node.id);
          if (check.canAcceptDownline) {
            return {
              parentId: node.id,
              downlineCount: check.downlineCount,
              maxSlots: 4,
              availableSlots: Math.max(0, 4 - check.downlineCount),
              isActive: check.isActive,
              isExpired: check.isExpired,
              wallet: 'wallet' in node ? (node as any).wallet : undefined,
              source: 'tree_spillover',
              levelFromSponsor: 1,
              messageTh: `Spillover ชั้นที่ 1 ใต้โหนด #${node.id} (ว่าง ${4 - check.downlineCount}/4 ช่อง)`,
              messageEn: `Level 1 Spillover Under Node #${node.id} (${4 - check.downlineCount}/4 open)`,
            };
          }
        }
      }

      // Level 2 nodes next:
      if (tree.level2) {
        for (const children of Object.values(tree.level2)) {
          for (const subNode of (children as any[])) {
            if (subNode && subNode.id > 0 && !('isSlotEmpty' in subNode)) {
              const check = await checkParentValidOnChain(subNode.id);
              if (check.canAcceptDownline) {
                return {
                  parentId: subNode.id,
                  downlineCount: check.downlineCount,
                  maxSlots: 4,
                  availableSlots: Math.max(0, 4 - check.downlineCount),
                  isActive: check.isActive,
                  isExpired: check.isExpired,
                  wallet: 'wallet' in subNode ? subNode.wallet : undefined,
                  source: 'tree_spillover',
                  levelFromSponsor: 2,
                  messageTh: `Spillover ชั้นที่ 2 ใต้โหนด #${subNode.id} (ว่าง ${4 - check.downlineCount}/4 ช่อง)`,
                  messageEn: `Level 2 Spillover Under Node #${subNode.id} (${4 - check.downlineCount}/4 open)`,
                };
              }
            }
          }
        }
      }
    }

    // 3. Check Smart Contract activeNodePointer if available
    try {
      const provider = getBscJsonRpcProvider();
      const contract = getContractInstance(provider);
      const pointer = await withTimeout(contract.activeNodePointer(), 2000, null);
      if (pointer !== null && Number(pointer) > 0) {
        const activeNodeId = await withTimeout(contract.activeRank1Nodes(pointer), 2000, null);
        if (activeNodeId !== null && Number(activeNodeId) > 0) {
          const pointerCheck = await checkParentValidOnChain(Number(activeNodeId));
          if (pointerCheck.canAcceptDownline) {
            return {
              parentId: Number(activeNodeId),
              downlineCount: pointerCheck.downlineCount,
              maxSlots: 4,
              availableSlots: Math.max(0, 4 - pointerCheck.downlineCount),
              isActive: pointerCheck.isActive,
              isExpired: pointerCheck.isExpired,
              source: 'global_queue',
              levelFromSponsor: 99,
              messageTh: `คิวระบบ Active Pointer แนะนำโหนด #${activeNodeId} (ว่าง ${4 - pointerCheck.downlineCount}/4 ช่อง)`,
              messageEn: `System Active Pointer Suggests Node #${activeNodeId} (${4 - pointerCheck.downlineCount}/4 open)`,
            };
          }
        }
      }
    } catch {
      // ignore
    }

    // 4. Fallback: check Root ID 1
    const rootCheck = await checkParentValidOnChain(1);
    if (rootCheck.canAcceptDownline) {
      return {
        parentId: 1,
        downlineCount: rootCheck.downlineCount,
        maxSlots: 4,
        availableSlots: Math.max(0, 4 - rootCheck.downlineCount),
        isActive: rootCheck.isActive,
        isExpired: rootCheck.isExpired,
        source: 'root_fallback',
        levelFromSponsor: 0,
        messageTh: `ต่อตรงรหัสปฐมบท (Root ID #1) (ว่าง ${4 - rootCheck.downlineCount}/4 ช่อง)`,
        messageEn: `Direct Root Placement (ID #1) (${4 - rootCheck.downlineCount}/4 open)`,
      };
    }

    // 5. Fallback to mock contract BFS calculation
    return matrixContract.findOptimalPlacement(targetSponsorId);
  } catch (err) {
    console.warn(`findOptimalPlacementOnChain(${sponsorId}) failed:`, err);
    return matrixContract.findOptimalPlacement(targetSponsorId);
  }
}

/**
 * Get all available placement candidate nodes under a given root/sponsor (< 4 downlines)
 */
export async function getTeamAvailablePlacementsOnChain(rootId: number = 1): Promise<PlacementCandidate[]> {
  const targetId = Math.max(1, rootId || 1);
  try {
    const candidates: PlacementCandidate[] = [];
    // Check root node itself
    const rootCheck = await checkParentValidOnChain(targetId);
    if (rootCheck.canAcceptDownline) {
      candidates.push({
        id: targetId,
        wallet: '',
        downlineCount: rootCheck.downlineCount,
        maxSlots: 4,
        availableSlots: Math.max(0, 4 - rootCheck.downlineCount),
        level: 0,
        isGhost: false,
        isActive: rootCheck.isActive,
        isExpired: rootCheck.isExpired,
        relationshipTh: 'ผู้แนะนำตรง (Direct Sponsor)',
        relationshipEn: 'Direct Sponsor',
      });
    }

    // Fetch team tree
    const tree = await fetchTeamTreeOnChain(targetId);
    if (tree && tree.level1) {
      for (const node of tree.level1) {
        if (node.id > 0 && !('isSlotEmpty' in node)) {
          const check = await checkParentValidOnChain(node.id);
          if (check.canAcceptDownline && !candidates.some(c => c.id === node.id)) {
            candidates.push({
              id: node.id,
              wallet: 'wallet' in node ? (node as any).wallet : '',
              downlineCount: check.downlineCount,
              maxSlots: 4,
              availableSlots: Math.max(0, 4 - check.downlineCount),
              level: 1,
              isGhost: Boolean((node as any).isGhost),
              isActive: check.isActive,
              isExpired: check.isExpired,
              relationshipTh: 'สายงานชั้นที่ 1 (Level 1)',
              relationshipEn: 'Level 1 Downline',
            });
          }
        }
      }
    }

    if (tree && tree.level2) {
      for (const children of Object.values(tree.level2)) {
        for (const subNode of (children as any[])) {
          if (subNode && subNode.id > 0 && !('isSlotEmpty' in subNode)) {
            const check = await checkParentValidOnChain(subNode.id);
            if (check.canAcceptDownline && !candidates.some(c => c.id === subNode.id)) {
              candidates.push({
                id: subNode.id,
                wallet: 'wallet' in subNode ? subNode.wallet : '',
                downlineCount: check.downlineCount,
                maxSlots: 4,
                availableSlots: Math.max(0, 4 - check.downlineCount),
                level: 2,
                isGhost: Boolean(subNode.isGhost),
                isActive: check.isActive,
                isExpired: check.isExpired,
                relationshipTh: 'สายงานชั้นที่ 2 (Level 2)',
                relationshipEn: 'Level 2 Downline',
              });
            }
          }
        }
      }
    }

    if (candidates.length > 0) {
      return candidates;
    }
    return matrixContract.getTeamAvailablePlacements(targetId);
  } catch {
    return matrixContract.getTeamAvailablePlacements(targetId);
  }
}


/**
 * Fetch contract deployment timestamp: deployTime() -> uint256
 */
export async function fetchDeployTimeOnChain(): Promise<number> {
  try {
    const provider = getBscJsonRpcProvider();
    const contract = getContractInstance(provider);
    const timeRaw = await withTimeout(contract.deployTime(), 2500, BigInt(0));
    return Number(timeRaw);
  } catch {
    return 0;
  }
}

/**
 * Fetch Platform Analytics from smart contract:
 * getPlatformAnalytics(uint256 periodSeconds) -> 
 * (totalInvestment, queueWaitingCount, r1Count, r2Count, r3Count, pendingGhosts, totalPendingFunds, topInvestmentId, topEarnedId)
 */
export async function fetchPlatformAnalyticsOnChain(periodSeconds: number = 0): Promise<PlatformAnalyticsData | null> {
  try {
    const provider = getBscJsonRpcProvider();
    const contract = getContractInstance(provider);
    const res = await withTimeout(contract.getPlatformAnalytics(periodSeconds), 3000, null);
    if (!res) return null;
    return {
      totalInvestment: Number(ethers.formatUnits(extractValue(res, 'totalInvestment', 0, BigInt(0)), 18)),
      queueWaitingCount: Number(extractValue(res, 'queueWaitingCount', 1, 0)),
      r1Count: Number(extractValue(res, 'r1Count', 2, 0)),
      r2Count: Number(extractValue(res, 'r2Count', 3, 0)),
      r3Count: Number(extractValue(res, 'r3Count', 4, 0)),
      pendingGhosts: Number(extractValue(res, 'pendingGhosts', 5, 0)),
      totalPendingFunds: Number(ethers.formatUnits(extractValue(res, 'totalPendingFunds', 6, BigInt(0)), 18)),
      topInvestmentId: Number(extractValue(res, 'topInvestmentId', 7, 0)),
      topEarnedId: Number(extractValue(res, 'topEarnedId', 8, 0)),
    };
  } catch (err) {
    console.warn('fetchPlatformAnalyticsOnChain failed:', err);
    return null;
  }
}

/**
 * Fetch Platform Stats from smart contract:
 * getPlatformStats() -> (PlatformStat day1, PlatformStat week1, PlatformStat month1, PlatformStat allTime)
 */
export async function fetchPlatformStatsOnChain(): Promise<PlatformStatsData | null> {
  try {
    const provider = getBscJsonRpcProvider();
    const contract = getContractInstance(provider);
    const res = await withTimeout(contract.getPlatformStats(), 3000, null);
    if (!res) return null;

    const parseStat = (statItem: unknown): PlatformPeriodStat => {
      if (!statItem) return { membersCount: 0, totalVolume: 0 };
      const members = Number(extractValue(statItem, 'membersCount', 0, 0));
      const volumeRaw = extractValue(statItem, 'totalVolume', 1, BigInt(0));
      const totalVolume = Number(ethers.formatUnits(volumeRaw, 18));
      return { membersCount: members, totalVolume };
    };

    return {
      day1: parseStat(extractValue(res, 'day1', 0, null)),
      week1: parseStat(extractValue(res, 'week1', 1, null)),
      month1: parseStat(extractValue(res, 'month1', 2, null)),
      allTime: parseStat(extractValue(res, 'allTime', 3, null)),
    };
  } catch (err) {
    console.warn('fetchPlatformStatsOnChain failed:', err);
    return null;
  }
}

/**
 * Renew ID when expired: renewId(uint256 _userId)
 */
export async function renewIdOnChain(
  userId: number,
  signer: ethers.ContractRunner
): Promise<ethers.ContractTransactionResponse> {
  const contract = getContractInstance(signer);
  return await contract.renewId(userId);
}

/**
 * Check if ID is expired: isIdExpired(uint256 _userId)
 */
export async function checkIsIdExpiredOnChain(userId: number): Promise<boolean> {
  try {
    const provider = getBscJsonRpcProvider();
    const contract = getContractInstance(provider);
    return await contract.isIdExpired(userId);
  } catch {
    return false;
  }
}

/**
 * Process Reborn Queue: processRebornQueue(uint256 batchSize)
 */
export async function processRebornQueueOnChain(
  batchSize: number,
  signer: ethers.ContractRunner
): Promise<ethers.ContractTransactionResponse> {
  const contract = getContractInstance(signer);
  return await contract.processRebornQueue(batchSize);
}

/**
 * Admin set queue head index: adminSetQueueHead(uint256 rank, uint256 newHeadIndex)
 */
export async function adminSetQueueHeadOnChain(
  rank: number,
  newHeadIndex: number,
  signer: ethers.ContractRunner
): Promise<ethers.ContractTransactionResponse> {
  const contract = getContractInstance(signer);
  return await contract.adminSetQueueHead(rank, newHeadIndex);
}

/**
 * Admin spawn ghosts: adminSpawnGhostPushes(uint256 rank, uint256 amount)
 */
export async function adminSpawnGhostPushesOnChain(
  rank: number,
  amount: number,
  signer: ethers.ContractRunner
): Promise<ethers.ContractTransactionResponse> {
  const contract = getContractInstance(signer);
  return await contract.adminSpawnGhostPushes(rank, amount);
}

/**
 * Toggle pause: setPause(bool _paused)
 */
export async function setPauseOnChain(
  paused: boolean,
  signer: ethers.ContractRunner
): Promise<ethers.ContractTransactionResponse> {
  const contract = getContractInstance(signer);
  return await contract.setPause(paused);
}

/**
 * Lock migration permanently: lockMigration()
 */
export async function lockMigrationOnChain(
  signer: ethers.ContractRunner
): Promise<ethers.ContractTransactionResponse> {
  const contract = getContractInstance(signer);
  return await contract.lockMigration();
}

/**
 * Emergency token withdrawal: emergencyWithdraw(address _token, uint256 _amount)
 * Supports withdrawing USDT (BEP-20) or any other BEP-20 tokens
 */
export async function emergencyWithdrawOnChain(
  tokenAddress: string,
  amount: bigint | string | number,
  signer: ethers.ContractRunner
): Promise<ethers.ContractTransactionResponse> {
  const contract = getContractInstance(signer);
  const targetToken = tokenAddress && tokenAddress.trim() !== '' ? tokenAddress.trim() : USDT_ADDRESS;
  const formattedAmount = typeof amount === 'bigint' ? amount : ethers.parseUnits(String(amount), 18);
  return await contract.emergencyWithdraw(targetToken, formattedAmount);
}

/**
 * Fetch the contract's actual USDT balance held on-chain
 */
export async function fetchContractUsdtBalance(): Promise<number> {
  const rpcList = BSC_CONFIG.rpcUrls;
  for (let i = 0; i < Math.min(rpcList.length, 3); i++) {
    const rpcUrl = rpcList[(currentRpcIndex + i) % rpcList.length];
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl, BSC_NETWORK, {
        staticNetwork: BSC_NETWORK,
      });
      const usdt = getUsdtContractInstance(provider);
      const balanceRaw = await withTimeout(usdt.balanceOf(CONTRACT_ADDRESS), 3000, BigInt(0));
      return Number(ethers.formatUnits(balanceRaw, 18));
    } catch {
      rotateRpcProvider();
    }
  }
  return 0;
}

export interface UserMigrationItem {
  id: number;
  wallet: string;
  sponsorId: number;
  placementId: number;
  isGhost: boolean;
  isAutoReborn: boolean;
  totalEarned: number | bigint | string;
  expiresAt?: number | bigint | string;
  downlines?: Array<{
    userId: number;
    isActive: boolean;
    isAutoReborn: boolean;
    isGhost: boolean;
  }>;
}

export type BatchMigrateUsersParams = {
  ids: number[];
  wallets: string[];
  sponsorIds: number[];
  placementIds: number[];
  isGhosts: boolean[];
  isAutoReborns: boolean[];
  totalEarneds: (number | bigint | string)[];
  expiresAts?: (number | bigint | string)[];
} | UserMigrationItem[];

/**
 * Batch migrate existing users: batchMigrateUsers(UserMigrationData[] users)
 * Transforms user inputs into the struct array required by the new contract ABI
 */
export async function batchMigrateUsersOnChain(
  params: BatchMigrateUsersParams,
  signer: ethers.ContractRunner
): Promise<ethers.ContractTransactionResponse> {
  const contract = getContractInstance(signer);
  
  let formattedUsers: Array<{
    id: bigint;
    wallet: string;
    sponsorId: bigint;
    placementId: bigint;
    isGhost: boolean;
    isAutoReborn: boolean;
    totalEarned: bigint;
    expiresAt: bigint;
    downlines: Array<{
      userId: bigint;
      isActive: boolean;
      isAutoReborn: boolean;
      isGhost: boolean;
    }>;
  }> = [];

  if (Array.isArray(params)) {
    formattedUsers = params.map(u => ({
      id: BigInt(u.id),
      wallet: u.wallet,
      sponsorId: BigInt(u.sponsorId || 1),
      placementId: BigInt(u.placementId || 0),
      isGhost: Boolean(u.isGhost),
      isAutoReborn: Boolean(u.isAutoReborn ?? true),
      totalEarned: typeof u.totalEarned === 'bigint' ? u.totalEarned : ethers.parseUnits(String(u.totalEarned || 0), 18),
      expiresAt: BigInt(u.expiresAt ? Math.floor(Number(u.expiresAt)) : 0),
      downlines: (u.downlines || []).map(d => ({
        userId: BigInt(d.userId),
        isActive: Boolean(d.isActive),
        isAutoReborn: Boolean(d.isAutoReborn),
        isGhost: Boolean(d.isGhost)
      }))
    }));
  } else {
    formattedUsers = params.ids.map((id, idx) => ({
      id: BigInt(id),
      wallet: params.wallets[idx] || '0x0000000000000000000000000000000000000000',
      sponsorId: BigInt(params.sponsorIds[idx] || 1),
      placementId: BigInt(params.placementIds[idx] || 0),
      isGhost: Boolean(params.isGhosts[idx]),
      isAutoReborn: Boolean(params.isAutoReborns[idx] ?? true),
      totalEarned: typeof params.totalEarneds[idx] === 'bigint' 
        ? params.totalEarneds[idx] as bigint 
        : ethers.parseUnits(String(params.totalEarneds[idx] || 0), 18),
      expiresAt: BigInt(params.expiresAts?.[idx] ? Math.floor(Number(params.expiresAts[idx])) : 0),
      downlines: []
    }));
  }

  return await contract.batchMigrateUsers(formattedUsers);
}

/**
 * Batch migrate global queues: batchMigrateGlobalQueues(GlobalMigrationData[] migrations)
 */
export async function batchMigrateGlobalQueuesOnChain(
  migrations: Array<{
    rank: number;
    userId: number;
    isAutoReborn: boolean;
    isGhost: boolean;
    slotsFilled: number;
    downlineUserIds: number[];
  }>,
  signer: ethers.ContractRunner
): Promise<ethers.ContractTransactionResponse> {
  const contract = getContractInstance(signer);
  return await contract.batchMigrateGlobalQueues(migrations);
}

export interface SmartContractEventLog {
  eventName: string;
  txHash: string;
  blockNumber: number;
  args: Record<string, unknown>;
  formattedSummary?: string;
  timestamp?: number;
}

/**
 * Fetch past events emitted by the WealthLifeCycle smart contract on BSC
 * Supports RPC fallback, block chunking, and detailed argument decoding.
 */
export async function fetchContractEvents(
  eventName?: string,
  blockRange = 5000
): Promise<SmartContractEventLog[]> {
  const rpcList = BSC_CONFIG.rpcUrls;
  const iface = new ethers.Interface(CONTRACT_ABI);

  for (let attempt = 0; attempt < Math.min(rpcList.length, 3); attempt++) {
    try {
      const rpcUrl = rpcList[(currentRpcIndex + attempt) % rpcList.length];
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const currentBlock = await withTimeout(provider.getBlockNumber(), 3500, 0);
      if (!currentBlock) continue;

      const fromBlock = Math.max(1, currentBlock - blockRange);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      // Determine topic filter
      let topics: (string | null)[] | undefined = undefined;
      if (eventName && eventName !== 'ALL') {
        const fragment = iface.getEvent(eventName);
        if (fragment) {
          topics = [fragment.topicHash];
        }
      }

      // Query logs with chunking if range > 5000 to prevent RPC rate limits
      const maxChunk = 4500;
      const allLogs: ethers.Log[] = [];

      let start = fromBlock;
      while (start <= currentBlock) {
        const end = Math.min(start + maxChunk - 1, currentBlock);
        const chunkLogs = await withTimeout(
          provider.getLogs({
            address: CONTRACT_ADDRESS,
            topics: topics || undefined,
            fromBlock: start,
            toBlock: end
          }),
          4000,
          []
        );
        allLogs.push(...chunkLogs);
        start = end + 1;
      }

      const parsedLogs: SmartContractEventLog[] = [];
      for (const log of allLogs) {
        try {
          const parsed = iface.parseLog({
            topics: log.topics as string[],
            data: log.data
          });
          if (!parsed) continue;
          if (eventName && eventName !== 'ALL' && parsed.name !== eventName) continue;

          const argsObj: Record<string, unknown> = {};
          if (parsed.fragment && parsed.fragment.inputs) {
            parsed.fragment.inputs.forEach((input, index) => {
              const val = parsed.args[index];
              if (typeof val === 'bigint') {
                argsObj[input.name || `arg${index}`] = val.toString();
              } else {
                argsObj[input.name || `arg${index}`] = val;
              }
            });
          }

          let summary = '';
          if (parsed.name === 'Registered') {
            const newId = argsObj.newId || '1';
            const wallet = argsObj.wallet ? String(argsObj.wallet).slice(0, 8) + '...' : '';
            const sp = argsObj.sponsorId || '1';
            const pl = argsObj.placementId || sp;
            const isGhost = argsObj.isGhost === true || argsObj.isGhost === 'true';
            const isAutoReborn = argsObj.isAutoReborn === true || argsObj.isAutoReborn === 'true';
            if (isGhost) {
              summary = `Ghost Node #${newId} placed into Rank 1 Matrix (Placement #${pl})`;
            } else if (isAutoReborn) {
              summary = `Reborn ID #${newId} placed into Rank 1 under Sponsor #${sp} (${wallet})`;
            } else {
              summary = `Member #${newId} registered under Sponsor #${sp} (${wallet})`;
            }
          } else if (parsed.name === 'RewardPaid') {
            const amountRaw = parsed.args.amount ? BigInt(parsed.args.amount) : (parsed.args[1] ? BigInt(parsed.args[1]) : BigInt(0));
            const amtFormatted = Number(ethers.formatUnits(amountRaw, 18)).toFixed(2);
            const note = argsObj.note || 'Matrix Reward';
            const w = argsObj.wallet ? String(argsObj.wallet).slice(0, 8) + '...' : '';
            summary = `${amtFormatted} USDT paid to ${w} (${note})`;
            argsObj['amountFormatted'] = `${amtFormatted} USDT`;
          } else if (parsed.name === 'AutoUpgraded') {
            summary = `User #${argsObj.userId} auto-upgraded to Rank ${argsObj.newRank}`;
          } else if (parsed.name === 'RebornQueued') {
            const w = argsObj.wallet ? String(argsObj.wallet).slice(0, 8) + '...' : '';
            summary = `Reborn queued for ID #${argsObj.ownerId} (7 New IDs generated) (${w})`;
          } else if (parsed.name === 'IdRenewed') {
            const expiryDate = argsObj.newExpiryTime ? new Date(Number(argsObj.newExpiryTime) * 1000).toLocaleString() : '';
            summary = `ID #${argsObj.userId} renewed successfully. New Expiry: ${expiryDate}`;
          } else if (parsed.name === 'RewardForfeited') {
            const amountRaw = parsed.args.amount ? BigInt(parsed.args.amount) : (parsed.args[1] ? BigInt(parsed.args[1]) : BigInt(0));
            const amtFormatted = Number(ethers.formatUnits(amountRaw, 18)).toFixed(2);
            const reason = argsObj.reason || 'Expired / Inactive';
            summary = `Reward of ${amtFormatted} USDT forfeited for ID #${argsObj.missedUserId} (${reason})`;
            argsObj['amountFormatted'] = `${amtFormatted} USDT`;
          } else if (parsed.name === 'SystemPaused') {
            summary = `System paused state changed to: ${argsObj.isPaused ? 'PAUSED' : 'ACTIVE'}`;
          }

          parsedLogs.push({
            eventName: parsed.name,
            txHash: log.transactionHash,
            blockNumber: log.blockNumber,
            args: argsObj,
            formattedSummary: summary
          });
        } catch {
          // Skip unparsed log
        }
      }

      if (parsedLogs.length > 0) {
        return parsedLogs.reverse();
      }
    } catch (err) {
      console.warn(`RPC attempt ${attempt} failed in fetchContractEvents:`, err);
    }
  }

  // Fallback to synchronized contract state events if on-chain returns 0 logs in the range
  return matrixContract.getContractEvents(eventName);
}




