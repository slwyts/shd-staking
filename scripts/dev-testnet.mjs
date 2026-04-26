import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deployLocalDapp } from "./lib/deploy.mjs";
import { readEnvFile, updateEnvValue } from "./lib/env.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const developmentEnvPath = resolve(rootDir, ".env.development");
const rpcUrl = "http://127.0.0.1:8545";

function run(command, args, options = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: options.stdio ?? "inherit",
      shell: false,
      env: process.env,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolveRun();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function rpc(method, params = []) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!response.ok) throw new Error(`RPC ${method} failed with HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error.message ?? `RPC ${method} failed`);
  return payload.result;
}

async function isRpcReady() {
  try {
    await rpc("eth_chainId");
    return true;
  } catch {
    return false;
  }
}

async function waitForRpc(child) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    if (child.exitCode !== null) throw new Error("Hardhat node exited before RPC became ready");
    if (await isRpcReady()) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  throw new Error("Timed out waiting for Hardhat node RPC");
}

function startHardhatNode() {
  return spawn("pnpm", ["exec", "hardhat", "node"], {
    cwd: rootDir,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });
}

function startNextDev() {
  const developmentEnv = readEnvFile(developmentEnvPath);

  return spawn("pnpm", ["exec", "next", "dev"], {
    cwd: rootDir,
    stdio: "inherit",
    shell: false,
    env: { ...process.env, ...developmentEnv },
  });
}

async function main() {
  console.log("Compiling contracts and syncing ABI...");
  await run("pnpm", ["compile"]);

  let hardhatNode = null;
  if (await isRpcReady()) {
    console.log(`Using existing Hardhat RPC at ${rpcUrl}`);
  } else {
    console.log("Starting Hardhat node...");
    hardhatNode = startHardhatNode();
    await waitForRpc(hardhatNode);
  }

  const chainIdHex = await rpc("eth_chainId");
  const chainId = Number.parseInt(chainIdHex, 16);
  const { dappAddress, shdTokenAddress } = await deployLocalDapp({ rootDir, rpcUrl, chainId });

  updateEnvValue(developmentEnvPath, "NEXT_PUBLIC_APP_MODE", "development");
  updateEnvValue(developmentEnvPath, "NEXT_PUBLIC_DAPP_ADDRESS", dappAddress);
  console.log("Updated .env.development NEXT_PUBLIC_APP_MODE=development");
  console.log(`Updated .env.development NEXT_PUBLIC_DAPP_ADDRESS=${dappAddress}`);
  console.log(`Local SHD token: ${shdTokenAddress}`);

  console.log("Starting Next.js dev server...");
  const nextDev = startNextDev();

  const shutdown = () => {
    nextDev.kill("SIGTERM");
    if (hardhatNode) hardhatNode.kill("SIGTERM");
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  nextDev.on("exit", (code) => {
    if (hardhatNode) hardhatNode.kill("SIGTERM");
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});