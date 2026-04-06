/**
 * @file app/swap/page.tsx
 * @description 兑换页面 — SHD/SCNY 代币兑换，显示滑点税明细。
 */
"use client";

import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { NetworkGuard } from "@/components/web3/NetworkGuard";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useWallet } from "@/hooks/common/useWallet";
import { useSwap } from "@/hooks/swap/useSwap";
import { useSwapQuote } from "@/hooks/swap/useSwapQuote";
import { useTokenBalance } from "@/hooks/token/useTokenBalance";
import { SHD_TOKEN_ADDRESS, SCNY_TOKEN_ADDRESS } from "@/constants/contracts";
import { formatTokenAmount } from "@/utils/format";

type Direction = "buy" | "sell";

export default function SwapPage() {
  const { isConnected, connectWallet } = useWallet();
  const { swap, isSending, isConfirmed, reset } = useSwap();
  const { balance: shdBalance } = useTokenBalance(SHD_TOKEN_ADDRESS);
  const { balance: scnyBalance } = useTokenBalance(SCNY_TOKEN_ADDRESS);

  const [direction, setDirection] = useState<Direction>("buy");
  const [amount, setAmount] = useState("");

  const numericAmount = parseFloat(amount) || 0;
  const quote = useSwapQuote(numericAmount, direction);

  // 买入: SCNY -> SHD，卖出: SHD -> SCNY
  const fromSymbol = direction === "buy" ? "SCNY" : "SHD";
  const toSymbol = direction === "buy" ? "SHD" : "SCNY";
  const fromBalance = direction === "buy" ? scnyBalance : shdBalance;

  /** 切换买卖方向 */
  const toggleDirection = () => {
    setDirection((d) => (d === "buy" ? "sell" : "buy"));
    setAmount("");
    reset();
  };

  /** 执行兑换 */
  const handleSwap = () => {
    if (numericAmount <= 0) return;
    const fromAddr = direction === "buy" ? SCNY_TOKEN_ADDRESS : SHD_TOKEN_ADDRESS;
    const toAddr = direction === "buy" ? SHD_TOKEN_ADDRESS : SCNY_TOKEN_ADDRESS;
    swap(fromAddr, toAddr, BigInt(Math.floor(numericAmount * 1e18)));
  };

  return (
    <NetworkGuard>
      <PageContainer className="pt-8">
        <h1 className="mb-2 text-3xl font-bold text-text-primary">代币兑换</h1>
        <p className="mb-8 text-text-secondary">SHD / SCNY 交易对兑换</p>

        <div className="mx-auto max-w-md space-y-6">
          {/* 兑换卡片 */}
          <Card>
            {/* 方向选择 */}
            <div className="mb-4 flex items-center justify-between">
              <Badge variant={direction === "buy" ? "green" : "orange"}>
                {direction === "buy" ? "买入 SHD" : "卖出 SHD"}
              </Badge>
              <button
                onClick={toggleDirection}
                className="cut-corners border border-card-border p-2 text-text-secondary transition-colors hover:bg-white/5 hover:text-text-primary"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4-4 4 4M4 10l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {/* 输入金额 */}
            <Input
              label={`支付 (${fromSymbol})`}
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); reset(); }}
              suffix={
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (fromBalance) setAmount(formatTokenAmount(fromBalance, 18, 18));
                    }}
                    className="text-xs text-cyber-blue"
                  >
                    MAX
                  </button>
                  <span className="text-sm font-medium">{fromSymbol}</span>
                </div>
              }
            />
            {fromBalance !== undefined && (
              <p className="mt-1 text-xs text-text-muted">
                可用: {formatTokenAmount(fromBalance)} {fromSymbol}
              </p>
            )}

            {/* 箭头分隔 */}
            <div className="my-4 flex justify-center">
              <div className="cut-corners border border-card-border bg-white/5 p-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M5 10l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyber-blue" />
                </svg>
              </div>
            </div>

            {/* 输出预估 */}
            <div className="cut-corners border border-card-border bg-white/5 px-4 py-3">
              <p className="mb-1 text-xs text-text-muted">获得 ({toSymbol})</p>
              <p className="text-2xl font-bold text-text-primary">
                {quote.outputAmount > 0
                  ? quote.outputAmount.toFixed(4)
                  : "0.0"}
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="mt-6">
              {!isConnected ? (
                <Button onClick={connectWallet} className="w-full">
                  连接钱包
                </Button>
              ) : (
                <Button
                  onClick={handleSwap}
                  loading={isSending}
                  disabled={numericAmount <= 0}
                  className="w-full"
                >
                  {isConfirmed ? "兑换成功!" : "确认兑换"}
                </Button>
              )}
            </div>
          </Card>

          {/* 滑点明细 */}
          {numericAmount > 0 && (
            <Card>
              <h3 className="mb-3 text-sm font-medium text-text-secondary">
                交易税 (滑点 {quote.slippageRate}%)
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">滑点扣税总额</span>
                  <span className="text-amber-orange">
                    -{quote.slippageTotal.toFixed(4)} {fromSymbol}
                  </span>
                </div>

                {quote.details && (
                  <>
                    <hr className="border-card-border" />
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted">LP 分红 (1.5%)</span>
                      <span className="text-text-secondary">
                        {quote.details.lpDividend.toFixed(4)}
                      </span>
                    </div>

                    {direction === "buy" && "burn" in quote.details && (
                      <div className="flex justify-between text-xs">
                        <span className="text-text-muted">直接销毁 (2.0%)</span>
                        <span className="text-text-secondary">
                          {(quote.details as { burn: number }).burn.toFixed(4)}
                        </span>
                      </div>
                    )}

                    {direction === "sell" && "marketing" in quote.details && (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="text-text-muted">营销补贴 (1.5%)</span>
                          <span className="text-text-secondary">
                            {(quote.details as { marketing: number }).marketing.toFixed(4)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-text-muted">回流底池 (0.5%)</span>
                          <span className="text-text-secondary">
                            {(quote.details as { poolReturn: number }).poolReturn.toFixed(4)}
                          </span>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </Card>
          )}
        </div>
      </PageContainer>
    </NetworkGuard>
  );
}
