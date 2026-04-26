"use client";

import { useEffect, useMemo, useState } from "react";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { keccak256, parseUnits, toBytes } from "viem";
import { HeroBanner } from "@/components/three/HeroBanner";
import { StarBackground } from "@/components/three/StarBackground";
import { Badge } from "@/components/ui/Badge";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ALL_TOKENS } from "@/constants/tokens";
import { DAPP_ABI } from "@/constants/abis/generated";
import { DAPP_CONTRACT_ADDRESS } from "@/constants/contracts";
import { useDappTokenAddress } from "@/hooks/dapp/useDappTokenAddress";
import { useTokenApproval } from "@/hooks/token/useTokenApproval";
import { useWallet } from "@/hooks/common/useWallet";

const PRODUCT_PACKAGES = [
  { amount: 5000, label: "5000 产品包" },
  { amount: 10000, label: "1W 产品包" },
  { amount: 30000, label: "3W 产品包" },
  { amount: 50000, label: "5W 产品包" },
  { amount: 100000, label: "10W 产品包" },
];

type ProductPackage = (typeof PRODUCT_PACKAGES)[number];

type PendingPackageOrder = {
  walletAddress: `0x${string}`;
  phone: string;
  sn: string;
  packageAmount: number;
  orderRef: `0x${string}`;
};

export default function HomePage() {
  const { address, isConnected, connectWallet } = useWallet();
  const { shdTokenAddress } = useDappTokenAddress();
  const [selectedPackage, setSelectedPackage] = useState<ProductPackage | null>(null);
  const [phone, setPhone] = useState("");
  const [sn, setSn] = useState("");
  const [packageMsg, setPackageMsg] = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<PendingPackageOrder | null>(null);
  const [callbackTxHash, setCallbackTxHash] = useState<`0x${string}` | null>(null);
  const [approvalTarget, setApprovalTarget] = useState<bigint>(BigInt(0));
  const [approvedAmount, setApprovedAmount] = useState<bigint>(BigInt(0));

  const {
    approve,
    needsApproval,
    isApproving,
    isConfirming: isApproveConfirming,
    isConfirmed: isApproveConfirmed,
    refetchAllowance,
  } = useTokenApproval(shdTokenAddress, DAPP_CONTRACT_ADDRESS);

  const {
    writeContract,
    data: packageTxHash,
    isPending: isPurchasePending,
    reset: resetPurchase,
  } = useWriteContract();

  const { isLoading: isPurchaseConfirming, isSuccess: isPurchaseConfirmed } =
    useWaitForTransactionReceipt({ hash: packageTxHash });

  const selectedAmount = useMemo(
    () => selectedPackage ? parseUnits(String(selectedPackage.amount), 18) : BigInt(0),
    [selectedPackage]
  );

  const packageNeedsApproval =
    selectedAmount > BigInt(0) && needsApproval(selectedAmount) && approvedAmount < selectedAmount;
  const packageBusy = isApproving || isApproveConfirming || isPurchasePending || isPurchaseConfirming;

  useEffect(() => {
    if (!isApproveConfirmed || approvalTarget <= approvedAmount) return;
    setApprovedAmount(approvalTarget);
    void refetchAllowance();
  }, [approvalTarget, approvedAmount, isApproveConfirmed, refetchAllowance]);

  useEffect(() => {
    if (!isPurchaseConfirmed || !packageTxHash || !pendingOrder || callbackTxHash === packageTxHash) return;

    setCallbackTxHash(packageTxHash);
    setPackageMsg("链上扣款成功，正在同步商城…");

    void fetch("/api/mall/product-package", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...pendingOrder, txHash: packageTxHash }),
    })
      .then(async (response) => {
        const result = await response.json().catch(() => null) as { message?: string; skipped?: boolean } | null;
        if (response.ok && !result?.skipped) {
          setPackageMsg("扣款成功，商城同步已提交");
          return;
        }
        setPackageMsg(result?.message ?? "扣款成功，商城同步待确认");
      })
      .catch(() => setPackageMsg("扣款成功，商城同步请求失败"));
  }, [callbackTxHash, isPurchaseConfirmed, packageTxHash, pendingOrder]);

  const openPackageModal = (pkg: ProductPackage) => {
    setSelectedPackage(pkg);
    setPhone("");
    setSn("");
    setPackageMsg(null);
    setPendingOrder(null);
    setCallbackTxHash(null);
    resetPurchase();
  };

  const handlePackagePurchase = () => {
    if (!selectedPackage) return;
    if (!isConnected) {
      connectWallet();
      return;
    }
    if (!address) {
      setPackageMsg("请先连接钱包");
      return;
    }
    if (!shdTokenAddress) {
      setPackageMsg("正在读取 SHD 合约地址，请稍后再试");
      return;
    }

    const nextPhone = phone.trim();
    const nextSn = sn.trim();
    if (!nextPhone) {
      setPackageMsg("请输入手机号");
      return;
    }
    if (!nextSn) {
      setPackageMsg("请输入 SN 号");
      return;
    }

    if (packageNeedsApproval) {
      setPackageMsg(null);
      setApprovalTarget(selectedAmount);
      approve(String(selectedPackage.amount), 18);
      return;
    }

    const orderRef = keccak256(
      toBytes(`${address}:${nextPhone}:${nextSn}:${selectedPackage.amount}:${Date.now()}`)
    );

    setPackageMsg(null);
    setCallbackTxHash(null);
    setPendingOrder({
      walletAddress: address,
      phone: nextPhone,
      sn: nextSn,
      packageAmount: selectedPackage.amount,
      orderRef,
    });
    resetPurchase();
    writeContract({
      address: DAPP_CONTRACT_ADDRESS,
      abi: DAPP_ABI,
      functionName: "purchasePackage",
      args: [selectedAmount, orderRef],
    });
  };

  return (
    <div className="relative overflow-x-hidden">
      <StarBackground />

      <div className="relative z-10">
        <HeroBanner />

        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* 核心数据资产 */}
          <section className="relative py-5 sm:py-10">
            <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-cyber-blue/8 blur-[120px]" />

            <AnimatedSection direction="up">
              <div className="text-center">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyber-blue sm:text-xs">Core Assets</p>
                <h2 className="mb-1 text-lg font-bold text-text-primary sm:text-xl">核心数据资产</h2>
                <p className="mx-auto mb-5 max-w-md text-[10px] leading-relaxed text-text-muted sm:mb-8 sm:text-sm">三种独立发行的数据资产，构建完整生态体系</p>
              </div>
            </AnimatedSection>

            <div className="grid grid-cols-3 gap-3 sm:gap-10">
              {ALL_TOKENS.map((token, i) => (
                <AnimatedSection key={token.symbol} direction="up" delay={0.08 * (i + 1)}>
                  <div className="group flex flex-col items-center text-center">
                    <div className="relative mb-2 sm:mb-5">
                      <div
                        className="absolute -inset-1 rounded-full opacity-30 blur-md transition-opacity duration-500 group-hover:opacity-60 sm:-inset-2 sm:blur-xl"
                        style={{ backgroundColor: token.color }}
                      />
                      <div
                        className="relative flex h-10 w-10 items-center justify-center rounded-full ring-1 ring-white/10 transition-transform duration-300 group-hover:scale-110 sm:h-14 sm:w-14"
                        style={{
                          background: `linear-gradient(135deg, ${token.color}30, ${token.color}08)`,
                        }}
                      >
                        <span className="text-lg font-black sm:text-2xl" style={{ color: token.color }}>
                          {token.symbol[0]}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-0.5 sm:flex-row sm:gap-2">
                      <h3 className="text-sm font-bold text-text-primary sm:text-lg">{token.symbol}</h3>
                      <Badge variant={token.symbol === "SHD" ? "blue" : token.symbol === "DHC" ? "purple" : "green"}>
                        {token.totalSupplyLabel}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-[10px] leading-snug text-text-secondary sm:mt-1.5 sm:text-sm">{token.name}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </section>

          {/* SHD 报单产品包 */}
          <section className="relative py-5 sm:py-10">
            <div className="pointer-events-none absolute -right-16 bottom-0 h-56 w-56 rounded-full bg-accent-green/8 blur-[110px]" />

            <AnimatedSection direction="up">
              <div className="text-center">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyber-blue sm:text-xs">SHD Order</p>
                <h2 className="mb-1 text-lg font-bold text-text-primary sm:text-xl">SHD 报单产品包</h2>
                {/* <p className="mx-auto mb-4 max-w-2xl text-[10px] leading-relaxed text-text-muted sm:mb-8 sm:text-sm">
                  通过 DAPP 使用 SHD 购买报单产品包，购买数据与用户 UID 同步至商城 APP。
                </p> */}
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.08}>
              <div className="rounded-2xl border border-card-border bg-white/5 p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-5 sm:gap-3">
                  {PRODUCT_PACKAGES.map((pkg) => (
                    <button
                      key={pkg.amount}
                      type="button"
                      onClick={() => openPackageModal(pkg)}
                      className="rounded-xl border border-cyber-blue/20 bg-cyber-blue/5 px-2 py-2 text-[10px] font-semibold text-cyber-blue transition-all hover:border-cyber-blue/45 hover:bg-cyber-blue/10 active:scale-[0.98] sm:py-2.5 sm:text-xs"
                    >
                      {pkg.label}
                    </button>
                  ))}
                </div>

                {/* <div className="mt-4 space-y-2 text-[10px] leading-relaxed text-text-secondary sm:mt-5 sm:space-y-2.5 sm:text-sm">
                  <p>1. 根据 SHD-SCNY 获取 SHD 实时价格，扣除对应数量 SHD。</p>
                  <p>2. 同步 UID 与报单产品包数据接口给 APP，APP 发放对应权益。</p>
                </div> */}
              </div>
            </AnimatedSection>
          </section>

          {/* 动态收益 */}
          <section className="relative py-5 sm:py-10">
            <div className="pointer-events-none absolute -left-16 bottom-0 h-52 w-52 rounded-full bg-amber-orange/6 blur-[100px]" />

            <AnimatedSection direction="up">
              <div className="text-center">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-orange sm:text-xs">Referral</p>
                <h2 className="mb-1 text-lg font-bold text-text-primary sm:text-xl">动态收益</h2>
                <p className="mx-auto mb-4 max-w-md text-[10px] leading-relaxed text-text-muted sm:mb-8 sm:text-sm">通过推荐获取额外收益</p>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="up" delay={0.1}>
              <div className="text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-muted sm:text-xs">直接推荐收益</p>
                <p className="mt-1.5 text-4xl font-black text-cyber-blue sm:mt-3 sm:text-5xl">5%</p>
                <p className="mt-1 text-[10px] leading-relaxed text-text-secondary sm:mt-2 sm:text-sm">直推下级认购金额的 5% 作为奖励</p>
                <div className="mx-auto mt-2.5 h-px w-12 rounded-full bg-amber-orange/30 sm:mt-4 sm:w-16" />
              </div>
            </AnimatedSection>
          </section>
        </div>
      </div>

      <Modal
        open={!!selectedPackage}
        onClose={() => {
          if (!packageBusy) setSelectedPackage(null);
        }}
        title="SHD 报单产品包"
      >
        {selectedPackage && (
          <div className="space-y-4">
            <div className="rounded-lg border border-card-border bg-white/[0.04] p-3">
              <p className="text-xs text-text-muted">产品包</p>
              <p className="mt-1 text-lg font-semibold text-cyber-blue">
                {selectedPackage.label} / {selectedPackage.amount.toLocaleString()} SHD
              </p>
            </div>

            <Input
              label="手机号"
              inputMode="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                setPackageMsg(null);
              }}
            />
            <Input
              label="SN 号"
              placeholder="请输入 SN 号"
              value={sn}
              onChange={(event) => {
                setSn(event.target.value);
                setPackageMsg(null);
              }}
            />

            {packageMsg && <p className="text-xs text-text-secondary">{packageMsg}</p>}

            <Button
              className="w-full"
              loading={packageBusy}
              disabled={!selectedPackage || selectedAmount <= BigInt(0)}
              onClick={handlePackagePurchase}
            >
              {!isConnected
                ? "连接钱包"
                : packageNeedsApproval
                  ? "授权 SHD"
                  : isPurchaseConfirmed
                    ? "扣款成功"
                    : "确认购买"}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
