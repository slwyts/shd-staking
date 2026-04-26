import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createPublicClient, createWalletClient, getAddress, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const DEFAULT_HARDHAT_PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

function readArtifact(rootDir, artifactPath) {
  return JSON.parse(readFileSync(resolve(rootDir, artifactPath), "utf8"));
}

function createClients({ rpcUrl, chainId, privateKey }) {
  const chain = {
    id: Number(chainId),
    name: `DOR ${chainId}`,
    nativeCurrency: { name: "DOR", symbol: "DOR", decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
  };
  const account = privateKeyToAccount(privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`);
  const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
  const walletClient = createWalletClient({ account, chain, transport: http(rpcUrl) });

  return { account, publicClient, walletClient };
}

async function deployContract({ publicClient, walletClient, artifact, args }) {
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (!receipt.contractAddress) throw new Error("Deploy transaction did not create a contract");
  return { address: getAddress(receipt.contractAddress), hash };
}

export async function deployLocalDapp({ rootDir, rpcUrl, chainId }) {
  const { account, publicClient, walletClient } = createClients({
    rpcUrl,
    chainId,
    privateKey: DEFAULT_HARDHAT_PRIVATE_KEY,
  });
  const mockArtifact = readArtifact(rootDir, "artifacts/contracts/mocks/MockSHD.sol/MockSHD.json");
  const dappArtifact = readArtifact(rootDir, "artifacts/contracts/SHDStaking.sol/SHDStaking.json");

  console.log(`Deploying local MockSHD from ${account.address}...`);
  const mock = await deployContract({
    publicClient,
    walletClient,
    artifact: mockArtifact,
    args: [account.address, parseEther("200000000")],
  });
  console.log(`MockSHD deployed: ${mock.address}`);

  console.log("Deploying local SHDStaking...");
  const dapp = await deployContract({
    publicClient,
    walletClient,
    artifact: dappArtifact,
    args: [mock.address, account.address],
  });
  console.log(`SHDStaking deployed: ${dapp.address}`);

  const fundHash = await walletClient.writeContract({
    address: mock.address,
    abi: mockArtifact.abi,
    functionName: "transfer",
    args: [dapp.address, parseEther("1000000")],
  });
  await publicClient.waitForTransactionReceipt({ hash: fundHash });
  console.log("Funded local reward pool with 1,000,000 SHD");

  return { dappAddress: dapp.address, shdTokenAddress: mock.address, deployer: account.address };
}

export async function deployProdDapp({ rootDir, rpcUrl, chainId, privateKey, shdTokenAddress, initialOwner }) {
  const { account, publicClient, walletClient } = createClients({ rpcUrl, chainId, privateKey });
  const dappArtifact = readArtifact(rootDir, "artifacts/contracts/SHDStaking.sol/SHDStaking.json");
  const owner = initialOwner ? getAddress(initialOwner) : account.address;
  const shd = getAddress(shdTokenAddress);

  console.log(`Deploying SHDStaking from ${account.address}...`);
  console.log(`SHD token: ${shd}`);
  console.log(`Initial owner: ${owner}`);

  const dapp = await deployContract({
    publicClient,
    walletClient,
    artifact: dappArtifact,
    args: [shd, owner],
  });

  console.log(`SHDStaking deployed: ${dapp.address}`);
  return { dappAddress: dapp.address, shdTokenAddress: shd, deployer: account.address, owner };
}