/**
 * @file constants/abis/StakingPool.ts
 * @description 质押池合约 ABI。
 *   TODO: 合约开发完成后替换为完整 ABI。
 */
export const STAKING_POOL_ABI = [
  {
    type: "function",
    name: "stake",
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "period", type: "uint256" },
      { name: "referrer", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unstake",
    inputs: [{ name: "positionId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "claimReward",
    inputs: [{ name: "positionId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getUserPositions",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      {
        type: "tuple[]",
        components: [
          { name: "id", type: "uint256" },
          { name: "amount", type: "uint256" },
          { name: "period", type: "uint256" },
          { name: "startTime", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "claimedReward", type: "uint256" },
          { name: "isUnstaked", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPendingReward",
    inputs: [{ name: "positionId", type: "uint256" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPoolInfo",
    inputs: [{ name: "period", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "totalStaked", type: "uint256" },
          { name: "dailyRate", type: "uint256" },
          { name: "isActive", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTeamInfo",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "directCount", type: "uint256" },
          { name: "totalMembers", type: "uint256" },
          { name: "majorPerformance", type: "uint256" },
          { name: "minorPerformance", type: "uint256" },
          { name: "vLevel", type: "uint256" },
          { name: "referralReward", type: "uint256" },
          { name: "teamReward", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
] as const;
