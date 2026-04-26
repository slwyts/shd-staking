import { resolve } from "node:path";
import { createPublicClient, http } from "viem";
import { readEnvFile } from "./lib/env.mjs";

const hardhatEnv = readEnvFile(resolve(process.cwd(), ".env.hardhat"));
const rpcUrl = process.env.TIME_RPC_URL || process.env.DOR_RPC_URL || hardhatEnv.DOR_RPC_URL || "http://127.0.0.1:8545";
const duration = process.argv[2];

const UNITS = {
  s: 1,
  m: 60,
  h: 60 * 60,
  d: 24 * 60 * 60,
  w: 7 * 24 * 60 * 60,
};

function parseDuration(value) {
  const match = /^(\d+)(s|m|h|d|w)$/.exec(value ?? "");
  if (!match) throw new Error("Usage: pnpm run time <duration>, e.g. 10d, 5h, 30m");
  return Number(match[1]) * UNITS[match[2]];
}

async function main() {
  const seconds = parseDuration(duration);
  const publicClient = createPublicClient({ transport: http(rpcUrl) });

  await publicClient.request({ method: "evm_increaseTime", params: [seconds] });
  await publicClient.request({ method: "evm_mine", params: [] });
  const block = await publicClient.getBlock();

  console.log(`Advanced ${seconds} seconds on ${rpcUrl}`);
  console.log(`Latest block: ${block.number} @ ${new Date(Number(block.timestamp) * 1000).toISOString()}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});