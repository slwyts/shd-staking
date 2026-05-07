import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";

import { artifacts, network } from "hardhat";
import { createPublicClient, createWalletClient, custom, getContract, parseEther } from "viem";

const BPS = 10_000n;
const DAY = 24n * 60n * 60n;
const ROOT_REFERRER = "0x0000000000000000000000000000000000000001";
const DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";

const LEVEL_COUNTY = 1;
const LEVEL_CITY = 2;
const LEVEL_PROVINCE = 3;
const TEAM_REWARD_OPERATION_CENTER = 4;

const toToken = (value) => parseEther(value);
const sameAddress = (left, right) => left.toLowerCase() === right.toLowerCase();
const hasAddress = (addresses, target) => addresses.some((address) => sameAddress(address, target));

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function expectRevert(action, expectedMessage) {
  let thrown;
  try {
    await action();
  } catch (error) {
    thrown = error;
  }

  assert.ok(thrown, `Expected revert containing: ${expectedMessage}`);
  const message = [thrown.shortMessage, thrown.details, thrown.message, thrown.cause?.message]
    .filter(Boolean)
    .join("\n");
  assert.match(message, new RegExp(escapeRegExp(expectedMessage)));
}

describe("SHDStaking", () => {
  let context;

  beforeEach(async () => {
    context = await deployFixture();
  });

  afterEach(async () => {
    await context.connection.close();
  });

  it("binds inviter trees and rejects user root binding, rebinding, and cycles", async () => {
    const { accounts, staking } = context;
    const { owner, alice, bob, carol } = accounts;

    assert.ok(sameAddress(await staking.read.referrerOf([owner]), ROOT_REFERRER));

    await expectRevert(
      () => send(context, staking, "bindReferrer", [ROOT_REFERRER], alice),
      "SHDStaking: root only owner",
    );

    await send(context, staking, "bindReferrer", [owner], alice);
    assert.ok(sameAddress(await staking.read.referrerOf([alice]), owner));

    let ownerInfo = await staking.read.getTeamInfo([owner]);
    assert.equal(ownerInfo.directCount, 1n);
    assert.ok(hasAddress(await staking.read.getDirectReferrals([owner]), alice));

    await expectRevert(
      () => send(context, staking, "bindReferrer", [bob], alice),
      "SHDStaking: referrer already bound",
    );

    await send(context, staking, "batchSetReferrers", [
      [alice, bob],
      [bob, carol],
    ]);

    assert.ok(sameAddress(await staking.read.referrerOf([bob]), alice));
    assert.ok(sameAddress(await staking.read.referrerOf([carol]), bob));

    await expectRevert(
      () => send(context, staking, "batchSetReferrers", [[carol], [alice]]),
      "SHDStaking: referrer cycle",
    );

    ownerInfo = await staking.read.getTeamInfo([owner]);
    const aliceInfo = await staking.read.getTeamInfo([alice]);
    const bobInfo = await staking.read.getTeamInfo([bob]);
    assert.equal(ownerInfo.directCount, 1n);
    assert.equal(aliceInfo.directCount, 1n);
    assert.equal(bobInfo.directCount, 1n);
  });

  it("imports referrers, regional levels, and operation-center flags with admin controls", async () => {
    const { accounts, staking } = context;
    const { owner, alice, ordinary, county, city, province } = accounts;

    await expectRevert(
      () => send(context, staking, "batchSetUserLevels", [[alice], [LEVEL_COUNTY]], alice),
      "OwnableUnauthorizedAccount",
    );

    await expectRevert(
      () => send(context, staking, "batchSetReferrers", [[owner], [ordinary, county]]),
      "SHDStaking: length mismatch",
    );

    await expectRevert(
      () => send(context, staking, "batchSetUserLevels", [[province], [4]]),
      "SHDStaking: invalid level",
    );

    await send(context, staking, "batchSetReferrers", [
      [owner, province, city, county],
      [province, city, county, ordinary],
    ]);
    await send(context, staking, "batchSetUserLevels", [
      [ordinary, county, city, province],
      [0, LEVEL_COUNTY, LEVEL_CITY, LEVEL_PROVINCE],
    ]);
    await send(context, staking, "batchSetOperationCenters", [
      [ordinary, county, city, province],
      [false, false, true, true],
    ]);

    assert.equal(Number((await staking.read.getTeamInfo([ordinary])).vLevel), 0);
    assert.equal(Number((await staking.read.getTeamInfo([county])).vLevel), LEVEL_COUNTY);
    assert.equal(Number((await staking.read.getTeamInfo([city])).vLevel), LEVEL_CITY);
    assert.equal(Number((await staking.read.getTeamInfo([province])).vLevel), LEVEL_PROVINCE);
    assert.equal((await staking.read.getTeamInfo([city])).operationCenter, true);
    assert.equal((await staking.read.getTeamInfo([province])).operationCenter, true);

    assert.ok(hasAddress(await staking.read.getDirectReferrals([province]), city));
    assert.ok(hasAddress(await staking.read.getDirectReferrals([city]), county));

    await send(context, staking, "batchSetReferrers", [[province], [county]]);

    const provinceReferrals = await staking.read.getDirectReferrals([province]);
    const cityReferrals = await staking.read.getDirectReferrals([city]);
    assert.ok(hasAddress(provinceReferrals, city));
    assert.ok(hasAddress(provinceReferrals, county));
    assert.equal(hasAddress(cityReferrals, county), false);
    assert.equal((await staking.read.getTeamInfo([province])).directCount, 2n);
    assert.equal((await staking.read.getTeamInfo([city])).directCount, 0n);
  });

  it("updates only fixed pool daily rates", async () => {
    const { accounts, staking } = context;
    const { alice } = accounts;

    await send(context, staking, "setPool", [90n, 75n]);
    assert.equal((await staking.read.getPoolInfo([90n])).dailyRate, 75n);

    await expectRevert(
      () => send(context, staking, "setPool", [45n, 75n]),
      "SHDStaking: unsupported period",
    );

    await expectRevert(
      () => send(context, staking, "setPool", [90n, 50n], alice),
      "OwnableUnauthorizedAccount",
    );
  });

  it("lets the owner create positions that generate team grants without token payment", async () => {
    const { accounts, staking, token } = context;
    const { owner, alice, bob, county } = accounts;
    const amount = toToken("2000");
    const directReward = (amount * 500n) / BPS;
    const expectedGrant = (amount * 300n) / BPS;

    await send(context, staking, "batchSetReferrers", [[owner, county], [county, alice]]);
    await send(context, staking, "batchSetUserLevels", [[county], [LEVEL_COUNTY]]);
    await send(context, staking, "batchSetOperationCenters", [[county], [true]]);
    await fundContract(context, amount * 2n);

    const aliceBalanceBefore = await token.read.balanceOf([alice]);
    const countyBalanceBefore = await token.read.balanceOf([county]);

    await send(context, staking, "adminCreatePosition", [alice, amount, 90n]);

    const [position] = await staking.read.getUserPositions([alice]);
    assert.equal(position.amount, amount);
    assert.equal(position.period, 90n);
    assert.equal(position.dailyRate, 50n);
    assert.equal(position.directReferralReward, directReward);
    assert.equal(position.isUnstaked, false);
    assert.equal(await token.read.balanceOf([alice]), aliceBalanceBefore);
    assert.equal(await token.read.balanceOf([county]), countyBalanceBefore + directReward);
    assert.equal((await staking.read.getPoolInfo([90n])).totalStaked, amount);

    const grants = await staking.read.getTeamRewardGrants([county]);
    assert.equal(grants.length, 2);
    assert.deepEqual(grants.map((grant) => Number(grant.rewardType)).sort(), [LEVEL_COUNTY, TEAM_REWARD_OPERATION_CENTER]);
    for (const grant of grants) {
      assert.equal(grant.amount, expectedGrant);
      assert.equal(grant.period, 90n);
      assert.equal(grant.sourcePositionId, position.id);
      assert.ok(sameAddress(grant.source, alice));
    }
    const countyInfo = await staking.read.getTeamInfo([county]);
    assert.equal(countyInfo.referralReward, directReward);
    assert.equal(countyInfo.teamReward, expectedGrant * 2n);

    await increaseTime(context, Number(10n * DAY));
    const countySummaryAfterTenDays = await staking.read.getRewardSummary([county]);
    assert.equal(countySummaryAfterTenDays.teamRewardAllocated, expectedGrant * 2n);
    assert.equal(countySummaryAfterTenDays.teamRewardPending, ((expectedGrant * 10n) / 90n) * 2n);

    await expectRevert(
      () => send(context, staking, "adminCreatePosition", [bob, amount, 90n]),
      "SHDStaking: referrer required",
    );

    await expectRevert(
      () => send(context, staking, "forceClosePosition", [position.id], alice),
      "OwnableUnauthorizedAccount",
    );

    await send(context, staking, "forceClosePosition", [position.id]);

    const [closedPosition] = await staking.read.getUserPositions([alice]);
    assert.equal(closedPosition.isUnstaked, true);
    assert.equal(closedPosition.claimedReward, 0n);
    assert.equal(closedPosition.profitTaxBurned, 0n);
    assert.equal(await token.read.balanceOf([alice]), aliceBalanceBefore);
    assert.equal((await staking.read.getPoolInfo([90n])).totalStaked, 0n);

    await expectRevert(
      () => send(context, staking, "forceClosePosition", [position.id]),
      "SHDStaking: already unstaked",
    );

    const aliceBalanceBeforeEarlySettlement = await token.read.balanceOf([alice]);
    await send(context, staking, "adminCreatePosition", [alice, amount, 90n]);
    const [, earlyPosition] = await staking.read.getUserPositions([alice]);
    assert.equal(earlyPosition.directReferralReward, directReward);
    assert.equal((await staking.read.getTeamInfo([county])).referralReward, directReward * 2n);

    const earlyQuote = await staking.read.getSettlementQuote([earlyPosition.id]);
    assert.equal(earlyQuote.early, true);
    assert.equal(earlyQuote.directReferralRecovery, directReward);
    assert.equal(earlyQuote.payout, amount - directReward);

    await send(context, staking, "unstake", [earlyPosition.id], alice);
    const [, settledEarlyPosition] = await staking.read.getUserPositions([alice]);
    assert.equal(await token.read.balanceOf([alice]), aliceBalanceBeforeEarlySettlement + amount - directReward);
    assert.equal(settledEarlyPosition.isUnstaked, true);
    assert.equal(settledEarlyPosition.directReferralRecovered, directReward);
  });

  it("lets admin-created positions skip direct rewards when contract balance is insufficient", async () => {
    const { accounts, staking, token } = context;
    const { owner, alice } = accounts;
    const amount = toToken("1000");

    await send(context, staking, "batchSetReferrers", [[owner], [alice]]);

    const ownerBalanceBefore = await token.read.balanceOf([owner]);
    await send(context, staking, "adminCreatePosition", [alice, amount, 90n]);

    const [position] = await staking.read.getUserPositions([alice]);
    assert.equal(position.amount, amount);
    assert.equal(position.directReferralReward, 0n);
    assert.equal((await staking.read.getTeamInfo([owner])).referralReward, 0n);
    assert.equal(await token.read.balanceOf([owner]), ownerBalanceBefore);

    await fundContract(context, amount);
    const aliceBalanceBeforeUnstake = await token.read.balanceOf([alice]);
    const quote = await staking.read.getSettlementQuote([position.id]);
    assert.equal(quote.directReferralRecovery, 0n);
    assert.equal(quote.payout, amount);

    await send(context, staking, "unstake", [position.id], alice);
    assert.equal(await token.read.balanceOf([alice]), aliceBalanceBeforeUnstake + amount);
  });

  it("settles mature static rewards with profit tax burn and direct referral reward", async () => {
    const { accounts, staking, token } = context;
    const { owner, alice } = accounts;
    const stakeAmount = toToken("1000");
    const directReward = (stakeAmount * 500n) / BPS;
    const grossReward = (stakeAmount * 50n * 90n) / BPS;
    const userReward = grossReward / 2n;
    const burnAmount = grossReward - userReward;

    await send(context, staking, "batchSetReferrers", [[owner], [alice]]);
    await fundUser(context, alice, toToken("10000"));

    const userBalanceBefore = await token.read.balanceOf([alice]);
    const ownerBalanceBefore = await token.read.balanceOf([owner]);
    const deadBalanceBefore = await token.read.balanceOf([DEAD_ADDRESS]);

    await approveAndStake(context, alice, stakeAmount, 90n);

    assert.equal((await token.read.balanceOf([owner])) - ownerBalanceBefore, directReward);
    assert.equal(await token.read.balanceOf([staking.address]), stakeAmount - directReward);

    const [position] = await staking.read.getUserPositions([alice]);
    assert.equal(position.amount, stakeAmount);
    assert.equal(position.period, 90n);
    assert.equal(position.dailyRate, 50n);
    assert.equal(position.directReferralReward, directReward);
    assert.ok(sameAddress(position.referrer, owner));

    await send(context, staking, "setPool", [90n, 75n]);
    assert.equal((await staking.read.getPoolInfo([90n])).dailyRate, 75n);

    await increaseTime(context, Number(90n * DAY + 1n));

    const quote = await staking.read.getSettlementQuote([position.id]);
    assert.equal(quote.early, false);
    assert.equal(quote.principal, stakeAmount);
    assert.equal(quote.grossReward, grossReward);
    assert.equal(quote.userReward, userReward);
    assert.equal(quote.burnAmount, burnAmount);
    assert.equal(quote.payout, stakeAmount + userReward);

    await fundContract(context, grossReward + directReward);

    await send(context, staking, "unstake", [position.id], alice);

    assert.equal(await token.read.balanceOf([alice]), userBalanceBefore - stakeAmount + stakeAmount + userReward);
    assert.equal((await token.read.balanceOf([DEAD_ADDRESS])) - deadBalanceBefore, burnAmount);

    const summary = await staking.read.getRewardSummary([alice]);
    assert.equal(summary.staticReward, userReward);
    assert.equal(summary.staticRewardBurned, burnAmount);
    assert.equal(summary.totalReward, userReward);
    assert.equal((await staking.read.getPoolInfo([90n])).totalStaked, 0n);
  });

  it("settles early unstake by recovering the direct reward from principal", async () => {
    const { accounts, staking, token } = context;
    const { owner, bob } = accounts;
    const stakeAmount = toToken("1000");
    const directReward = (stakeAmount * 500n) / BPS;

    await send(context, staking, "batchSetReferrers", [[owner], [bob]]);
    await fundUser(context, bob, toToken("10000"));

    const userBalanceBefore = await token.read.balanceOf([bob]);

    await approveAndStake(context, bob, stakeAmount, 180n);
    assert.equal(await token.read.balanceOf([staking.address]), stakeAmount - directReward);

    const [position] = await staking.read.getUserPositions([bob]);
    const quote = await staking.read.getSettlementQuote([position.id]);
    assert.equal(quote.early, true);
    assert.equal(quote.grossReward, 0n);
    assert.equal(quote.directReferralRecovery, directReward);
    assert.equal(quote.payout, stakeAmount - directReward);

    await send(context, staking, "unstake", [position.id], bob);

    const [settledPosition] = await staking.read.getUserPositions([bob]);
    assert.equal(await token.read.balanceOf([bob]), userBalanceBefore - directReward);
    assert.equal(settledPosition.isUnstaked, true);
    assert.equal(settledPosition.directReferralRecovered, directReward);
    assert.equal(settledPosition.profitTaxBurned, 0n);
    assert.equal((await staking.read.getPoolInfo([180n])).totalStaked, 0n);
  });

  it("accepts only fixed product package amounts", async () => {
    const { accounts, staking, token } = context;
    const { alice } = accounts;
    const packageAmount = toToken("5000");
    const orderRef = `0x${"11".repeat(32)}`;
    const unsupportedOrderRef = `0x${"22".repeat(32)}`;

    await fundUser(context, alice, toToken("10000"));
    await send(context, token, "approve", [staking.address, toToken("10000")], alice);

    const balanceBefore = await token.read.balanceOf([alice]);
    await send(context, staking, "purchasePackage", [packageAmount, orderRef], alice);
    assert.equal(await token.read.balanceOf([alice]), balanceBefore - packageAmount);

    await expectRevert(
      () => send(context, staking, "purchasePackage", [packageAmount, orderRef], alice),
      "SHDStaking: order used",
    );
    await expectRevert(
      () => send(context, staking, "purchasePackage", [toToken("6000"), unsupportedOrderRef], alice),
      "SHDStaking: unsupported package",
    );
  });

  it("grants and vests dynamic rewards across ordinary, county, city, province, and operation-center uplines", async () => {
    const { accounts, staking, token } = context;
    const { owner, ordinary, county, city, province, source } = accounts;
    const stakeAmount = toToken("10000");
    const expectedGrant = (stakeAmount * 600n) / BPS;

    await send(context, staking, "batchSetReferrers", [
      [owner, province, city, county, ordinary],
      [province, city, county, ordinary, source],
    ]);
    await send(context, staking, "batchSetUserLevels", [
      [ordinary, county, city, province],
      [0, LEVEL_COUNTY, LEVEL_CITY, LEVEL_PROVINCE],
    ]);
    await send(context, staking, "batchSetOperationCenters", [
      [city, province],
      [true, true],
    ]);
    await fundUser(context, source, toToken("20000"));

    const ordinaryBalanceBefore = await token.read.balanceOf([ordinary]);
    await approveAndStake(context, source, stakeAmount, 360n);

    assert.equal((await token.read.balanceOf([ordinary])) - ordinaryBalanceBefore, (stakeAmount * 500n) / BPS);
    assert.equal((await staking.read.getTeamRewardGrants([ordinary])).length, 0);

    const countyGrants = await staking.read.getTeamRewardGrants([county]);
    const cityGrants = await staking.read.getTeamRewardGrants([city]);
    const provinceGrants = await staking.read.getTeamRewardGrants([province]);

    assert.equal(countyGrants.length, 1);
    assert.equal(cityGrants.length, 2);
    assert.equal(provinceGrants.length, 1);
    assert.deepEqual(countyGrants.map((grant) => Number(grant.rewardType)), [LEVEL_COUNTY]);
    assert.deepEqual(cityGrants.map((grant) => Number(grant.rewardType)).sort(), [LEVEL_CITY, TEAM_REWARD_OPERATION_CENTER]);
    assert.deepEqual(provinceGrants.map((grant) => Number(grant.rewardType)), [LEVEL_PROVINCE]);

    for (const grant of [...countyGrants, ...cityGrants, ...provinceGrants]) {
      assert.equal(grant.amount, expectedGrant);
      assert.equal(grant.period, 360n);
      assert.ok(sameAddress(grant.source, source));
    }

    assert.equal((await staking.read.getTeamInfo([county])).teamReward, expectedGrant);
    assert.equal((await staking.read.getTeamInfo([city])).teamReward, expectedGrant * 2n);
    assert.equal((await staking.read.getTeamInfo([province])).teamReward, expectedGrant);

    const countyGrantId = countyGrants[0].id;
    const halfVestingTimestamp = countyGrants[0].startTime + (360n * DAY) / 2n;
    await setNextBlockTimestamp(context, halfVestingTimestamp);

    const countyBalanceBeforeHalfClaim = await token.read.balanceOf([county]);
    await send(context, staking, "claimTeamRewards", [[countyGrantId]], county);
    assert.equal((await token.read.balanceOf([county])) - countyBalanceBeforeHalfClaim, expectedGrant / 2n);

    let countySummary = await staking.read.getRewardSummary([county]);
    assert.equal(countySummary.teamRewardClaimed, expectedGrant / 2n);
    assert.equal(countySummary.teamRewardPending, 0n);

    await setNextBlockTimestamp(context, countyGrants[0].endTime);
    const countyBalanceBeforeFinalClaim = await token.read.balanceOf([county]);
    await send(context, staking, "claimTeamRewards", [[countyGrantId]], county);
    assert.equal((await token.read.balanceOf([county])) - countyBalanceBeforeFinalClaim, expectedGrant / 2n);

    countySummary = await staking.read.getRewardSummary([county]);
    assert.equal(countySummary.teamRewardClaimed, expectedGrant);
    assert.equal(countySummary.teamRewardPending, 0n);
  });
});

async function deployFixture() {
  const connection = await network.create();
  const provider = connection.provider;
  const chainId = Number(BigInt(await provider.request({ method: "eth_chainId", params: [] })));
  const chain = {
    id: chainId,
    name: "Hardhat",
    nativeCurrency: { decimals: 18, name: "Ether", symbol: "ETH" },
    rpcUrls: { default: { http: [] } },
  };
  const publicClient = createPublicClient({ chain, transport: custom(provider) });
  const rawAccounts = await provider.request({ method: "eth_accounts", params: [] });
  const accounts = {
    owner: rawAccounts[0],
    alice: rawAccounts[1],
    bob: rawAccounts[2],
    carol: rawAccounts[3],
    ordinary: rawAccounts[4],
    county: rawAccounts[5],
    city: rawAccounts[6],
    province: rawAccounts[7],
    source: rawAccounts[8],
  };
  const baseContext = { provider, chain, publicClient };

  const token = await deployContract({
    context: baseContext,
    name: "MockSHD",
    args: [accounts.owner, toToken("1000000000")],
    account: accounts.owner,
  });
  const staking = await deployContract({
    context: baseContext,
    name: "SHDStaking",
    args: [token.address, accounts.owner],
    account: accounts.owner,
  });

  return {
    connection,
    provider,
    chain,
    publicClient,
    accounts,
    token,
    staking,
  };
}

async function deployContract({ context, name, args, account }) {
  const artifact = await artifacts.readArtifact(name);
  const walletClient = wallet(context, account);
  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode,
    args,
  });
  const receipt = await context.publicClient.waitForTransactionReceipt({ hash });
  assert.ok(receipt.contractAddress, `${name} deployment did not return a contract address`);
  return contractAt(context, receipt.contractAddress, artifact.abi, account);
}

function contractAt(context, address, abi, account) {
  return getContract({
    address,
    abi,
    client: {
      public: context.publicClient,
      wallet: wallet(context, account),
    },
  });
}

function wallet(context, account) {
  return createWalletClient({
    account,
    chain: context.chain,
    transport: custom(context.provider),
  });
}

function asAccount(context, contract, account) {
  return contractAt(context, contract.address, contract.abi, account);
}

async function send(context, contract, functionName, args = [], account) {
  const target = account === undefined ? contract : asAccount(context, contract, account);
  const hash = await target.write[functionName](args);
  return context.publicClient.waitForTransactionReceipt({ hash });
}

async function fundUser(context, user, amount) {
  await send(context, context.token, "transfer", [user, amount], context.accounts.owner);
}

async function fundContract(context, amount) {
  await send(context, context.token, "approve", [context.staking.address, amount], context.accounts.owner);
  await send(context, context.staking, "fundRewards", [amount], context.accounts.owner);
}

async function approveAndStake(context, user, amount, period) {
  await send(context, context.token, "approve", [context.staking.address, amount], user);
  await send(context, context.staking, "stake", [amount, period], user);
}

async function increaseTime(context, seconds) {
  await context.provider.request({ method: "evm_increaseTime", params: [seconds] });
  await context.provider.request({ method: "evm_mine", params: [] });
}

async function setNextBlockTimestamp(context, timestamp) {
  await context.provider.request({ method: "evm_setNextBlockTimestamp", params: [Number(timestamp)] });
}
