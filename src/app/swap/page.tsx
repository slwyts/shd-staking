/**
 * @file app/swap/page.tsx
 * @description 兑换页面 — SHD/SCNY 数据资产兑换，显示滑点税明细。
 */
"use client";

import { useState } from "react";
import { ArrowUpDown, ArrowDown, Wallet, Info } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { NetworkGuard } from "@/components/web3/NetworkGuard";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AnimatedSection } from "@/components/ui/AnimatedSection";
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
  const [isFlipping, setIsFlipping] = useState(false);

  const numericAmount = parseFloat(amount) || 0;
  const quote = useSwapQuote(numericAmount, direction);

  const fromSymbol = direction === "buy" ? "SCNY" : "SHD";
  const toSymbol = direction === "buy" ? "SHD" : "SCNY";
  const fromBalance = direction === "buy" ? scnyBalance : shdBalance;

  const toggleDirection = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setDirection((d) => (d === "buy" ? "sell" : "buy"));
      setAmount("");
      reset();
    }, 150);
    setTimeout(() => setIsFlipping(false), 400);
  };

  const handleSwap = () => {
    if (numericAmount <= 0) return;
    const fromAddr = direction === "buy" ? SCNY_TOKEN_ADDRESS : SHD_TOKEN_ADDRESS;
    const toAddr = direction === "buy" ? SHD_TOKEN_ADDRESS : SCNY_TOKEN_ADDRESS;
    swap(fromAddr, toAddr, BigInt(Math.floor(numericAmount * 1e18)));
  };

  return (
    <NetworkGuard>
      <PageContainer>
        <div className="animate-slide-up">
          <h1 className="mb-1 text-lg font-semibold text-text-primary sm:text-xl">数据资产兑换</h1>
          <p className="mb-5 text-xs text-text-muted sm:mb-6 sm:text-sm">SHD / SCNY 交易对兑换</p>
        </div>

        <div className="mx-auto max-w-md space-y-4 sm:space-y-6">
          <div className="animate-scale-in opacity-0" style={{ animationDelay: "0.1s" }}>
            <Card>
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <div className="transition-all duration-300" style={{ transform: isFlipping ? "scale(0.9)" : "scale(1)", opacity: isFlipping ? 0.5 : 1 }}>
                  <Badge variant={direction === "buy" ? "green" : "orange"}>
                    {direction === "buy" ? "买入 SHD" : "卖出 SHD"}
                  </Badge>
                </div>
                <button
                  onClick={toggleDirection}
                  className="rounded-lg border border-card-border p-1.5 text-text-secondary transition-all duration-300 hover:bg-white/5 hover:text-text-primary hover:border-cyber-blue/30 hover:shadow-[0_0_12px_rgba(59,130,246,0.2)] active:scale-90 sm:p-2"
                  style={{ transform: isFlipping ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}
                >
                  <ArrowUpDown size={14} strokeWidth={1.5} className="sm:h-4 sm:w-4" />
                </button>
              </div>

              <div style={{ transition: "opacity 0.3s, transform 0.3s", opacity: isFlipping ? 0.3 : 1, transform: isFlipping ? "translateY(-4px)" : "translateY(0)" }}>
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
                        className="text-xs text-cyber-blue transition-all duration-200 hover:scale-110 active:scale-95"
                      >
                        MAX
                      </button>
                      <span className="text-xs font-medium sm:text-sm">{fromSymbol}</span>
                    </div>
                  }
                />
                {fromBalance !== undefined && (
                  <p className="mt-1 text-[10px] text-text-muted sm:text-xs">
                    可用: {formatTokenAmount(fromBalance)} {fromSymbol}
                  </p>
                )}
              </div>

              <div className="my-3 flex justify-center sm:my-4">
                <div
                  className="rounded-lg border border-card-border bg-white/5 p-1.5 transition-all duration-300 sm:p-2"
                  style={{ transform: isFlipping ? "rotate(180deg) scale(1.1)" : "rotate(0) scale(1)" }}
                >
                  <ArrowDown size={14} strokeWidth={1.5} className="text-cyber-blue sm:h-4 sm:w-4" />
                </div>
              </div>

              <div
                className="cut-corners border border-card-border bg-white/5 px-3 py-2.5 transition-all duration-300 sm:px-4 sm:py-3"
                style={{ opacity: isFlipping ? 0.3 : 1, transform: isFlipping ? "translateY(4px)" : "translateY(0)" }}
              >
                <p className="mb-0.5 text-[10px] text-text-muted sm:mb-1 sm:text-xs">获得 ({toSymbol})</p>
                <p className={`text-xl font-bold transition-all duration-500 sm:text-2xl ${quote.outputAmount > 0 ? "text-cyber-blue" : "text-text-primary"}`}>
                  {quote.outputAmount > 0
                    ? quote.outputAmount.toFixed(4)
                    : "0.0"}
                </p>
              </div>

              <div className="mt-4 sm:mt-6">
                {!isConnected ? (
                  <Button onClick={connectWallet} className="w-full gap-2">
                    <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />连接钱包
                  </Button>
                ) : (
                  <Button
                    onClick={handleSwap}
                    loading={isSending}
                    disabled={numericAmount <= 0}
                    className="w-full"
                  >
                    {isConfirmed ? "✓ 兑换成功!" : "确认兑换"}
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {numericAmount > 0 && (
            <AnimatedSection direction="up" delay={0}>
              <Card>
                <h3 className="mb-2.5 flex items-center gap-2 text-xs font-medium text-text-secondary sm:mb-3 sm:text-sm">
                  <Info className="h-3.5 w-3.5 text-amber-orange sm:h-4 sm:w-4" />
                  交易税 (滑点 {quote.slippageRate}%)
                </h3>
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-text-muted">滑点扣税总额</span>
                    <span className="text-amber-orange">
                      -{quote.slippageTotal.toFixed(4)} {fromSymbol}
                    </span>
                  </div>

                  {quote.details && (
                    <>
                      <hr className="border-card-border" />
                      <div className="flex justify-between text-[10px] sm:text-xs">
                        <span className="text-text-muted">LP 分红 (1.5%)</span>
                        <span className="text-text-secondary">
                          {quote.details.lpDividend.toFixed(4)}
                        </span>
                      </div>

                      {direction === "buy" && "burn" in quote.details && (
                        <div className="flex justify-between text-[10px] sm:text-xs">
                          <span className="text-text-muted">直接销毁 (2.0%)</span>
                          <span className="text-text-secondary">
                            {(quote.details as { burn: number }).burn.toFixed(4)}
                          </span>
                        </div>
                      )}

                      {direction === "sell" && "marketing" in quote.details && (
                        <>
                          <div className="flex justify-between text-[10px] sm:text-xs">
                            <span className="text-text-muted">营销补贴 (1.5%)</span>
                            <span className="text-text-secondary">
                              {(quote.details as { marketing: number }).marketing.toFixed(4)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px] sm:text-xs">
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
            </AnimatedSection>
          )}
        </div>
      </PageContainer>
    </NetworkGuard>
  );
}
