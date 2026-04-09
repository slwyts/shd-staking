/**
 * @file constants/abis/OrderBook.ts
 * @description 后台订单簿合约 ABI（对应 contracts/OrderBook.sol）
 */
export const ORDER_BOOK_ABI = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "admin",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "addOrder",
    inputs: [
      { name: "user",        type: "address" },
      { name: "principal",   type: "uint256" },
      { name: "totalReward", type: "uint256" },
      { name: "nextRelease", type: "uint256" },
      { name: "duration",    type: "uint256" },
      { name: "status",      type: "uint8"   },
      { name: "remark",      type: "string"  },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateOrder",
    inputs: [
      { name: "user",        type: "address" },
      { name: "index",       type: "uint256" },
      { name: "principal",   type: "uint256" },
      { name: "totalReward", type: "uint256" },
      { name: "claimed",     type: "uint256" },
      { name: "nextRelease", type: "uint256" },
      { name: "duration",    type: "uint256" },
      { name: "status",      type: "uint8"   },
      { name: "remark",      type: "string"  },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getOrders",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "id",          type: "uint256" },
          { name: "principal",   type: "uint256" },
          { name: "totalReward", type: "uint256" },
          { name: "claimed",     type: "uint256" },
          { name: "nextRelease", type: "uint256" },
          { name: "duration",    type: "uint256" },
          { name: "status",      type: "uint8"   },
          { name: "remark",      type: "string"  },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transferAdmin",
    inputs: [{ name: "newAdmin", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "OrderAdded",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "id",   type: "uint256", indexed: true },
    ],
  },
  {
    type: "event",
    name: "OrderUpdated",
    inputs: [
      { name: "user",  type: "address", indexed: true },
      { name: "index", type: "uint256", indexed: true },
    ],
  },
  {
    type: "event",
    name: "AdminTransferred",
    inputs: [
      { name: "oldAdmin", type: "address", indexed: true },
      { name: "newAdmin", type: "address", indexed: true },
    ],
  },
] as const;
