/**
 * @file constants/contracts.ts
 * @description DApp 合约地址配置。前端只需要知道入口合约地址。
 */
import { getAddress, isAddress } from "viem";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function readRequiredAddress(name: string, value: string | undefined) {
  if (!value || !isAddress(value) || getAddress(value) === ZERO_ADDRESS) {
    throw new Error(`${name} must be set to a deployed contract address`);
  }

  return getAddress(value) as `0x${string}`;
}

/** DApp 入口合约地址（SHDStaking） */
export const DAPP_CONTRACT_ADDRESS = readRequiredAddress(
  "NEXT_PUBLIC_DAPP_ADDRESS",
  process.env.NEXT_PUBLIC_DAPP_ADDRESS
);
