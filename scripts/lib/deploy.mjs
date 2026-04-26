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

export async function deployLocalDapp({ rootDir, rpcUrl, chainId, initialOwner }) {
  const { account, publicClient, walletClient } = createClients({
    rpcUrl,
    chainId,
    privateKey: DEFAULT_HARDHAT_PRIVATE_KEY,
  });
  const owner = initialOwner ? getAddress(initialOwner) : account.address;
  const mockArtifact = readArtifact(rootDir, "artifacts/contracts/mocks/MockSHD.sol/MockSHD.json");
  const dappArtifact = readArtifact(rootDir, "artifacts/contracts/SHDStaking.sol/SHDStaking.json");
  const localSupply = parseEther("200000000");
  const localShare = localSupply / 2n;

  console.log(`Deploying local MockSHD from ${account.address}...`);
  const mock = await deployContract({
    publicClient,
    walletClient,
    artifact: mockArtifact,
    args: [account.address, localSupply],
  });
  console.log(`MockSHD deployed: ${mock.address}`);

  console.log("Deploying local SHDStaking...");
  console.log(`Initial owner: ${owner}`);
  const dapp = await deployContract({
    publicClient,
    walletClient,
    artifact: dappArtifact,
    args: [mock.address, owner],
  });
  console.log(`SHDStaking deployed: ${dapp.address}`);

  const fundHash = await walletClient.writeContract({
    address: mock.address,
    abi: mockArtifact.abi,
    functionName: "transfer",
    args: [dapp.address, localShare],
  });
  await publicClient.waitForTransactionReceipt({ hash: fundHash });
  console.log("Funded local DApp contract with 100,000,000 SHD");

  if (owner !== account.address) {
    const ownerGasHash = await walletClient.sendTransaction({
      to: owner,
      value: parseEther("100"),
    });
    await publicClient.waitForTransactionReceipt({ hash: ownerGasHash });
    console.log("Funded local owner with 100 native gas token");

    const ownerFundHash = await walletClient.writeContract({
      address: mock.address,
      abi: mockArtifact.abi,
      functionName: "transfer",
      args: [owner, localShare],
    });
    await publicClient.waitForTransactionReceipt({ hash: ownerFundHash });
    console.log("Funded local owner with 100,000,000 SHD");
  } else {
    console.log("Local owner keeps 100,000,000 SHD");
  }

  return { dappAddress: dapp.address, shdTokenAddress: mock.address, deployer: account.address, owner };
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