import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isAddress } from "viem";
import { deployProdDapp } from "./lib/deploy.mjs";
import { readEnvFile, updateEnvValue, writeEnvFile } from "./lib/env.mjs";

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const hardhatEnvPath = resolve(rootDir, ".env.hardhat");
const productionEnvPath = resolve(rootDir, ".env.production");

function run(command, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd: rootDir, stdio: "inherit", shell: false, env: process.env });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolveRun();
      else reject(new Error(`${command} ${args.join(" ")} exited with code ${code}`));
    });
  });
}

async function promptMissing(env) {
  const required = ["DOR_RPC_URL", "DOR_CHAIN_ID", "DEPLOYER_PRIVATE_KEY", "SHD_TOKEN_ADDRESS"];
  const missing = required.filter((key) => !env[key]);
  if (missing.length === 0) return env;

  const rl = createInterface({ input, output });
  const nextEnv = { ...env };
  console.log(`${existsSync(hardhatEnvPath) ? ".env.hardhat 缺少字段" : ".env.hardhat 不存在"}，请按提示填写。`);

  for (const key of missing) {
    nextEnv[key] = (await rl.question(`${key}: `)).trim();
  }
  if (!nextEnv.INITIAL_OWNER_ADDRESS) {
    nextEnv.INITIAL_OWNER_ADDRESS = (await rl.question("INITIAL_OWNER_ADDRESS (可空，默认部署钱包): ")).trim();
  }
  rl.close();

  writeEnvFile(hardhatEnvPath, {
    DOR_RPC_URL: nextEnv.DOR_RPC_URL,
    DOR_CHAIN_ID: nextEnv.DOR_CHAIN_ID,
    DEPLOYER_PRIVATE_KEY: nextEnv.DEPLOYER_PRIVATE_KEY,
    SHD_TOKEN_ADDRESS: nextEnv.SHD_TOKEN_ADDRESS,
    INITIAL_OWNER_ADDRESS: nextEnv.INITIAL_OWNER_ADDRESS ?? "",
  });
  console.log("Wrote .env.hardhat");
  return nextEnv;
}

function validateEnv(env) {
  if (!/^\d+$/.test(env.DOR_CHAIN_ID ?? "")) throw new Error("DOR_CHAIN_ID must be a number");
  if (!env.DOR_RPC_URL?.startsWith("http")) throw new Error("DOR_RPC_URL must be an http(s) URL");
  if (!/^0x[0-9a-fA-F]{64}$/.test(env.DEPLOYER_PRIVATE_KEY ?? "")) {
    throw new Error("DEPLOYER_PRIVATE_KEY must be a 0x-prefixed 32-byte private key");
  }
  if (!isAddress(env.SHD_TOKEN_ADDRESS)) throw new Error("SHD_TOKEN_ADDRESS must be a valid address");
  if (env.INITIAL_OWNER_ADDRESS && !isAddress(env.INITIAL_OWNER_ADDRESS)) {
    throw new Error("INITIAL_OWNER_ADDRESS must be a valid address when set");
  }
}

async function main() {
  let env = readEnvFile(hardhatEnvPath);
  env = await promptMissing(env);
  validateEnv(env);

  console.log("Compiling contracts and syncing ABI...");
  await run("pnpm", ["compile"]);

  const { dappAddress } = await deployProdDapp({
    rootDir,
    rpcUrl: env.DOR_RPC_URL,
    chainId: Number(env.DOR_CHAIN_ID),
    privateKey: env.DEPLOYER_PRIVATE_KEY,
    shdTokenAddress: env.SHD_TOKEN_ADDRESS,
    initialOwner: env.INITIAL_OWNER_ADDRESS || undefined,
  });

  updateEnvValue(productionEnvPath, "NEXT_PUBLIC_DAPP_ADDRESS", dappAddress);
  console.log(`Updated .env.production NEXT_PUBLIC_DAPP_ADDRESS=${dappAddress}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});