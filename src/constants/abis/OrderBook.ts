/**
 * @file constants/abis/OrderBook.ts
 * @description Mini 版订单簿合约 ABI（对应 contracts/OrderBook.sol）
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
      { name: "user",     type: "address" },
      { name: "amount",   type: "uint256" },
      { name: "lockDays", type: "uint256" },
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
          { name: "id",        type: "uint256" },
          { name: "amount",    type: "uint256" },
          { name: "lockDays",  type: "uint256" },
          { name: "createdAt", type: "uint256" },
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
    name: "AdminTransferred",
    inputs: [
      { name: "oldAdmin", type: "address", indexed: true },
      { name: "newAdmin", type: "address", indexed: true },
    ],
  },
] as const;
