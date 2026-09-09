/**
 * WealthLifeCycle Smart Contract & Token Configuration
 * 
 * 1. Contract Address on BSC (BNB Smart Chain)
 * 2. USDT Token Address (BEP-20)
 */

export const CONTRACT_ADDRESS = "0xAE3736ECD23DfB6C49b76Ef8548391C1B6fFf7B9";
export const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
export const CONTRACT_OWNER = "0xD350758257Bee9AdB111944b1737d257620e80CE";

export const BSC_CONFIG = {
  chainId: 56,
  chainIdHex: "0x38",
  chainName: "BNB Smart Chain Mainnet",
  nativeCurrency: {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
  },
  rpcUrls: [
    "https://bsc-dataseed.binance.org/",
    "https://bsc-dataseed1.binance.org/",
    "https://bsc-dataseed2.binance.org/",
    "https://bsc-dataseed3.binance.org/",
    "https://bsc-dataseed1.defibit.io/",
    "https://bsc-dataseed1.ninicoin.io/",
    "https://bscrpc.com",
    "https://rpc.ankr.com/bsc",
    "https://1rpc.io/bnb"
  ],
  blockExplorerUrls: ["https://bscscan.com"],
  contractExplorerUrl: `https://bscscan.com/address/${CONTRACT_ADDRESS}`,
  usdtExplorerUrl: `https://bscscan.com/token/${USDT_ADDRESS}`,
};

export const CONTRACT_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_usdtAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_genesisWallet",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_globalPool",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "name": "CannotWithdrawMainToken",
    "type": "error",
    "inputs": []
  },
  {
    "name": "IdExpired",
    "type": "error",
    "inputs": []
  },
  {
    "name": "InvalidAddress",
    "type": "error",
    "inputs": []
  },
  {
    "name": "InvalidId",
    "type": "error",
    "inputs": []
  },
  {
    "name": "InvalidRank",
    "type": "error",
    "inputs": []
  },
  {
    "name": "IsPaused",
    "type": "error",
    "inputs": []
  },
  {
    "name": "MigrationLocked",
    "type": "error",
    "inputs": []
  },
  {
    "name": "NotOwner",
    "type": "error",
    "inputs": []
  },
  {
    "name": "OutOfBounds",
    "type": "error",
    "inputs": []
  },
  {
    "name": "SponsorNotActive",
    "type": "error",
    "inputs": []
  },
  {
    "name": "TransferFailed",
    "type": "error",
    "inputs": []
  },
  {
    "name": "AutoUpgraded",
    "type": "event",
    "inputs": [
      {
        "name": "userId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "newRank",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "IdRenewed",
    "type": "event",
    "inputs": [
      {
        "name": "userId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "newExpiryTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "name": "RebornQueued",
    "type": "event",
    "inputs": [
      {
        "name": "ownerId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "wallet",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "totalIds",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "isGhost",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "name": "Registered",
    "type": "event",
    "inputs": [
      {
        "name": "newId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "wallet",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "sponsorId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "placementId",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "isAutoReborn",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      },
      {
        "name": "isGhost",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "name": "RewardForfeited",
    "type": "event",
    "inputs": [
      {
        "name": "missedUserId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "wallet",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "reason",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "name": "RewardPaid",
    "type": "event",
    "inputs": [
      {
        "name": "wallet",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "note",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "name": "SystemPaused",
    "type": "event",
    "inputs": [
      {
        "name": "isPaused",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "name": "RANK1_DURATION",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "activeNodePointer",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "activeRank1Nodes",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "adminSetQueueHead",
    "type": "function",
    "inputs": [
      {
        "name": "rank",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "newHeadIndex",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "adminSpawnGhostPushes",
    "type": "function",
    "inputs": [
      {
        "name": "rank",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "batchMigrateGlobalQueues",
    "type": "function",
    "inputs": [
      {
        "name": "migrations",
        "type": "tuple[]",
        "components": [
          {
            "name": "rank",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "userId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "isAutoReborn",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "isGhost",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "slotsFilled",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "downlineUserIds",
            "type": "uint256[]",
            "internalType": "uint256[]"
          }
        ],
        "internalType": "struct WealthLifecycle.GlobalMigrationData[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "batchMigrateUsers",
    "type": "function",
    "inputs": [
      {
        "name": "users",
        "type": "tuple[]",
        "components": [
          {
            "name": "id",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "wallet",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "sponsorId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "placementId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "isGhost",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "isAutoReborn",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "totalEarned",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "expiresAt",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "downlines",
            "type": "tuple[]",
            "components": [
              {
                "name": "userId",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "isActive",
                "type": "bool",
                "internalType": "bool"
              },
              {
                "name": "isAutoReborn",
                "type": "bool",
                "internalType": "bool"
              },
              {
                "name": "isGhost",
                "type": "bool",
                "internalType": "bool"
              }
            ],
            "internalType": "struct WealthLifecycle.DownlineMigrationData[]"
          }
        ],
        "internalType": "struct WealthLifecycle.UserMigrationData[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "checkParentValid",
    "type": "function",
    "inputs": [
      {
        "name": "parentId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "isActive",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "isExpired",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "downlineCount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "currentHeads",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "deployTime",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "emergencyWithdraw",
    "type": "function",
    "inputs": [
      {
        "name": "_token",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "getAllGlobalQueueLengths",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "rank2Length",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "rank3Length",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getGlobalQueueLength",
    "type": "function",
    "inputs": [
      {
        "name": "rank",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getGlobalQueuePaginated",
    "type": "function",
    "inputs": [
      {
        "name": "rank",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "startIdx",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "limit",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "userIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "isGhostFlags",
        "type": "bool[]",
        "internalType": "bool[]"
      },
      {
        "name": "slotsFilled",
        "type": "uint8[]",
        "internalType": "uint8[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getPlatformAnalytics",
    "type": "function",
    "inputs": [
      {
        "name": "periodSeconds",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "totalInvestment",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "queueWaitingCount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "r1Count",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "r2Count",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "r3Count",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "pendingGhosts",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "totalPendingFunds",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "topInvestmentId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "topEarnedId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getPlatformStats",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "day1",
        "type": "tuple",
        "components": [
          {
            "name": "membersCount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "totalVolume",
            "type": "uint256",
            "internalType": "uint256"
          }
        ],
        "internalType": "struct WealthLifecycle.PlatformStat"
      },
      {
        "name": "week1",
        "type": "tuple",
        "components": [
          {
            "name": "membersCount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "totalVolume",
            "type": "uint256",
            "internalType": "uint256"
          }
        ],
        "internalType": "struct WealthLifecycle.PlatformStat"
      },
      {
        "name": "month1",
        "type": "tuple",
        "components": [
          {
            "name": "membersCount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "totalVolume",
            "type": "uint256",
            "internalType": "uint256"
          }
        ],
        "internalType": "struct WealthLifecycle.PlatformStat"
      },
      {
        "name": "allTime",
        "type": "tuple",
        "components": [
          {
            "name": "membersCount",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "totalVolume",
            "type": "uint256",
            "internalType": "uint256"
          }
        ],
        "internalType": "struct WealthLifecycle.PlatformStat"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getTeamTree",
    "type": "function",
    "inputs": [
      {
        "name": "_rootId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "components": [
          {
            "name": "id",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "wallet",
            "type": "address",
            "internalType": "address"
          },
          {
            "name": "sponsorId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "placementId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "isGhost",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "isActive",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "isExpired",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "downlineCount",
            "type": "uint256",
            "internalType": "uint256"
          }
        ],
        "internalType": "struct WealthLifecycle.MatrixNodeView[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getWalletAllData",
    "type": "function",
    "inputs": [
      {
        "name": "_wallet",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple[]",
        "components": [
          {
            "name": "id",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "sponsorId",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "isAutoReborn",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "totalEarned",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "expiresAt",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "isExpired",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "rank1Downlines",
            "type": "uint256[]",
            "internalType": "uint256[]"
          },
          {
            "name": "rank2Downlines",
            "type": "uint256[]",
            "internalType": "uint256[]"
          },
          {
            "name": "rank3Downlines",
            "type": "uint256[]",
            "internalType": "uint256[]"
          },
          {
            "name": "rank2QueueIndex",
            "type": "int256",
            "internalType": "int256"
          },
          {
            "name": "rank3QueueIndex",
            "type": "int256",
            "internalType": "int256"
          }
        ],
        "internalType": "struct WealthLifecycle.UserDashboardData[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getWalletAvailableRank1Nodes",
    "type": "function",
    "inputs": [
      {
        "name": "_wallet",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "availableIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "downlineCounts",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getWalletExpiredIdsAndTotalEarned",
    "type": "function",
    "inputs": [
      {
        "name": "_wallet",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "expiredIds",
        "type": "uint256[]",
        "internalType": "uint256[]"
      },
      {
        "name": "earnedAmounts",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "getWalletTotalEarned",
    "type": "function",
    "inputs": [
      {
        "name": "_wallet",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "totalEarned",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "globalPool",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "globalQueues",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "queueIndex",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "userId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "isAutoReborn",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "isGhost",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "slotsFilled",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "pendingRebornFunds",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "hasReachedRank2",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "headRebornIndex",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "idToWallet",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "idTotalEarned",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "isIdExpired",
    "type": "function",
    "inputs": [
      {
        "name": "_userId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "isMigrationLocked",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "lastUserId",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "lockMigration",
    "type": "function",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "owner",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "paused",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "processRebornQueue",
    "type": "function",
    "inputs": [
      {
        "name": "batchSize",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "rank1Users",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "isActive",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "isAutoReborn",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "isGhost",
        "type": "bool",
        "internalType": "bool"
      },
      {
        "name": "sponsorId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "placementId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "pendingRebornFunds",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "expiresAt",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "createdAt",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "rankPrices",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "rebornQueue",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "sponsorId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "ownerWallet",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "remainingIds",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "targetRank",
        "type": "uint8",
        "internalType": "uint8"
      },
      {
        "name": "isGhost",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "register",
    "type": "function",
    "inputs": [
      {
        "name": "sponsorId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "parentId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "renewId",
    "type": "function",
    "inputs": [
      {
        "name": "_userId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "setPause",
    "type": "function",
    "inputs": [
      {
        "name": "_paused",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "tailRebornIndex",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "usdtToken",
    "type": "function",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract IERC20"
      }
    ],
    "stateMutability": "view"
  },
  {
    "name": "walletToIds",
    "type": "function",
    "inputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  }
] as const;

export const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 value) returns (bool)",
  "function transfer(address to, uint256 value) returns (bool)",
  "function transferFrom(address from, address to, uint256 value) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];
