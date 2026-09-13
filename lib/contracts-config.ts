/**
 * WealthLifeCycle Smart Contract & Token Configuration
 * 
 * 1. Contract Address on BSC (BNB Smart Chain)
 * 2. USDT Token Address (BEP-20)
 */

export const CONTRACT_ADDRESS = "0x5c10DD5fE770E68Fa3F033c63624194498975031";
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
    "inputs": [
      {
        "internalType": "address",
        "name": "_usdtAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_genesisWallet",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_globalPool",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "CannotWithdrawMainToken",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IdExpired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAddress",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidId",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidRank",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "IsPaused",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MaxDownlines",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "MigrationLocked",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotOwner",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "OutOfBounds",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "SponsorNotActive",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TransferFailed",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "userId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newRank",
        "type": "uint256"
      }
    ],
    "name": "AutoUpgraded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "userId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newExpiryTime",
        "type": "uint256"
      }
    ],
    "name": "IdRenewed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "userId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "oldPlacementId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newPlacementId",
        "type": "uint256"
      }
    ],
    "name": "PlacementUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "ownerId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "wallet",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "totalIds",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isGhost",
        "type": "bool"
      }
    ],
    "name": "RebornQueued",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "newId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "wallet",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "sponsorId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "placementId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isAutoReborn",
        "type": "bool"
      },
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isGhost",
        "type": "bool"
      }
    ],
    "name": "Registered",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "missedUserId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "wallet",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "reason",
        "type": "string"
      }
    ],
    "name": "RewardForfeited",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "wallet",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "note",
        "type": "string"
      }
    ],
    "name": "RewardPaid",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "userId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "oldSponsorId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newSponsorId",
        "type": "uint256"
      }
    ],
    "name": "SponsorUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "bool",
        "name": "isPaused",
        "type": "bool"
      }
    ],
    "name": "SystemPaused",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "userId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "oldExpiry",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newExpiry",
        "type": "uint256"
      }
    ],
    "name": "UserExpiryUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "userId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "oldWallet",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "newWallet",
        "type": "address"
      }
    ],
    "name": "UserWalletUpdated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "RANK1_DURATION",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "activeNodePointer",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "activeRank1Nodes",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "rank",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "newHeadIndex",
        "type": "uint256"
      }
    ],
    "name": "adminSetQueueHead",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "rank",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "adminSpawnGhostPushes",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "rootId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "adminSpawnGhostRank1",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_userId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_newPlacementId",
        "type": "uint256"
      }
    ],
    "name": "adminUpdatePlacementId",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_userId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_newSponsorId",
        "type": "uint256"
      }
    ],
    "name": "adminUpdateSponsorId",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_userId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_newExpiryTimestamp",
        "type": "uint256"
      }
    ],
    "name": "adminUpdateUserExpiry",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_userId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_newWallet",
        "type": "address"
      }
    ],
    "name": "adminUpdateUserWallet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "rank",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "userId",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isAutoReborn",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "isGhost",
            "type": "bool"
          },
          {
            "internalType": "uint8",
            "name": "slotsFilled",
            "type": "uint8"
          },
          {
            "internalType": "uint256[]",
            "name": "downlineUserIds",
            "type": "uint256[]"
          }
        ],
        "internalType": "struct WealthLifecycle.GlobalMigrationData[]",
        "name": "migrations",
        "type": "tuple[]"
      }
    ],
    "name": "batchMigrateGlobalQueues",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "wallet",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "sponsorId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "placementId",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isGhost",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "isAutoReborn",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "totalEarned",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "expiresAt",
            "type": "uint256"
          },
          {
            "components": [
              {
                "internalType": "uint256",
                "name": "userId",
                "type": "uint256"
              },
              {
                "internalType": "bool",
                "name": "isActive",
                "type": "bool"
              },
              {
                "internalType": "bool",
                "name": "isAutoReborn",
                "type": "bool"
              },
              {
                "internalType": "bool",
                "name": "isGhost",
                "type": "bool"
              }
            ],
            "internalType": "struct WealthLifecycle.DownlineMigrationData[]",
            "name": "downlines",
            "type": "tuple[]"
          }
        ],
        "internalType": "struct WealthLifecycle.UserMigrationData[]",
        "name": "users",
        "type": "tuple[]"
      }
    ],
    "name": "batchMigrateUsers",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "parentId",
        "type": "uint256"
      }
    ],
    "name": "checkParentValid",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isExpired",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "downlineCount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "currentHeads",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "deployTime",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_amount",
        "type": "uint256"
      }
    ],
    "name": "emergencyWithdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllGlobalQueueLengths",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "rank2Length",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "rank3Length",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "rank",
        "type": "uint256"
      }
    ],
    "name": "getGlobalQueueLength",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "rank",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "startIdx",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getGlobalQueuePaginated",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "userIds",
        "type": "uint256[]"
      },
      {
        "internalType": "bool[]",
        "name": "isGhostFlags",
        "type": "bool[]"
      },
      {
        "internalType": "uint8[]",
        "name": "slotsFilled",
        "type": "uint8[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPlatformAnalytics",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "_totalInvestment",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_queueWaitingCount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_r1Count",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_r2Count",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_r3Count",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_pendingGhosts",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_totalPendingFunds",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_topEarnedId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_maxEarnedAmount",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_rootId",
        "type": "uint256"
      }
    ],
    "name": "getTeamTree",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "wallet",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "sponsorId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "placementId",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isGhost",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "isActive",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "isExpired",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "downlineCount",
            "type": "uint256"
          }
        ],
        "internalType": "struct WealthLifecycle.MatrixNodeView[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_wallet",
        "type": "address"
      }
    ],
    "name": "getWalletAllData",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "sponsorId",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isAutoReborn",
            "type": "bool"
          },
          {
            "internalType": "uint256",
            "name": "totalEarned",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "expiresAt",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "isExpired",
            "type": "bool"
          },
          {
            "internalType": "uint256[]",
            "name": "rank1Downlines",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256[]",
            "name": "rank2Downlines",
            "type": "uint256[]"
          },
          {
            "internalType": "uint256[]",
            "name": "rank3Downlines",
            "type": "uint256[]"
          },
          {
            "internalType": "int256",
            "name": "rank2QueueIndex",
            "type": "int256"
          },
          {
            "internalType": "int256",
            "name": "rank3QueueIndex",
            "type": "int256"
          }
        ],
        "internalType": "struct WealthLifecycle.UserDashboardData[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_wallet",
        "type": "address"
      }
    ],
    "name": "getWalletAvailableRank1Nodes",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "availableIds",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "downlineCounts",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_wallet",
        "type": "address"
      }
    ],
    "name": "getWalletExpiredIdsAndTotalEarned",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "expiredIds",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "earnedAmounts",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_wallet",
        "type": "address"
      }
    ],
    "name": "getWalletTotalEarned",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalEarned",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "globalPool",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "globalQueues",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "queueIndex",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "userId",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "isAutoReborn",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isGhost",
        "type": "bool"
      },
      {
        "internalType": "uint8",
        "name": "slotsFilled",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "pendingRebornFunds",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "hasReachedRank2",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "headRebornIndex",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "idToWallet",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "idTotalEarned",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_userId",
        "type": "uint256"
      }
    ],
    "name": "isIdExpired",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isMigrationLocked",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lastUserId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "latestRebornId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lockMigration",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "maxEarnedAmount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "paused",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "pendingGhosts",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "batchSize",
        "type": "uint256"
      }
    ],
    "name": "processRebornQueue",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "queueWaitingCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "r1Count",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "r2Count",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "r3Count",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "rank1Users",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isAutoReborn",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "isGhost",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "sponsorId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "placementId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "pendingRebornFunds",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "expiresAt",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "createdAt",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "rankPrices",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "rebornQueue",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "ownerId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "originalSponsorId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "ownerWallet",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "remainingIds",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "targetRank",
        "type": "uint8"
      },
      {
        "internalType": "bool",
        "name": "isGhost",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "sponsorId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "parentId",
        "type": "uint256"
      }
    ],
    "name": "register",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_userId",
        "type": "uint256"
      }
    ],
    "name": "renewId",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bool",
        "name": "_paused",
        "type": "bool"
      }
    ],
    "name": "setPause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tailRebornIndex",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "topEarnedId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalInvestment",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalPendingFunds",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdtToken",
    "outputs": [
      {
        "internalType": "contract IERC20",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "userRank2Ptr",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "userRank3Ptr",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "walletToIds",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
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
