"use client";

import { useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PcCard } from "@/components/dashboard/PersonalCenterHub";
import { dorNetwork } from "@/config/chains";
import { formatAddress } from "@/utils/format";

function connectorHint(connectorId: string): string {
  if (connectorId === "injected") {
    return "适用于 MetaMask、OKX Wallet、TokenPocket 等浏览器扩展或内置钱包。";
  }
  return "通过此方式授权并连接您的链上地址。";
}

function PanelSurface({
  hub,
  hover = false,
  className = "",
  children,
}: {
  hub: boolean;
  hover?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  if (hub) return <PcCard className={className}>{children}</PcCard>;
  return (
    <Card hover={hover} className={className}>
      {children}
    </Card>
  );
}

interface WalletConnectPanelProps {
  variant?: "default" | "hub";
}

/**
 * 个人中心内的钱包连接与管理（由原 /wallet 页面合并而来）
 */
export function WalletConnectPanel({ variant = "default" }: WalletConnectPanelProps) {
  const hub = variant === "hub";
  const { address, isConnected, chainId, connector: activeConnector } = useAccount();
  const { connect, connectors, isPending, variables } = useConnect();
  const { disconnect, isPending: isDisconnecting } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [copied, setCopied] = useState(false);

  const wrongChain =
    isConnected && chainId != null && chainId !== dorNetwork.id;
  const pendingConnectorId =
    isPending &&
    variables &&
    typeof variables === "object" &&
    "connector" in variables &&
    variables.connector &&
    typeof variables.connector === "object" &&
    "id" in variables.connector
      ? String((variables.connector as { id: string }).id)
      : undefined;
  const activeChainName =
    chainId === dorNetwork.id
      ? dorNetwork.name
      : chainId != null
        ? `链 ID ${chainId}`
        : "—";

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <section id={hub ? "wallet-hub" : undefined} className={hub ? "" : "mb-8"}>
      <h2
        className={
          hub
            ? "mb-3 text-sm font-semibold text-text-primary"
            : "mb-4 text-lg font-semibold text-text-secondary"
        }
      >
        链上钱包
      </h2>

      {!isConnected || !address ? (
        <>
          <p className="mb-3 text-sm font-medium text-text-muted">连接方式</p>
          <ul className="space-y-3">
            {connectors.map((connector) => {
              const loading = isPending && pendingConnectorId === connector.id;
              return (
                <li key={connector.uid}>
                  <PanelSurface
                    hub={hub}
                    hover={!hub}
                    className={
                      hub
                        ? "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-white/[0.06]"
                        : "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-text-primary">{connector.name}</span>
                        <Badge variant="blue">DOR</Badge>
                      </div>
                      <p className="mt-1 text-xs text-text-muted">{connectorHint(connector.id)}</p>
                    </div>
                    <Button
                      className="shrink-0 sm:min-w-[6.5rem]"
                      loading={loading}
                      disabled={isPending && !loading}
                      onClick={() => connect({ connector, chainId: dorNetwork.id })}
                    >
                      连接
                    </Button>
                  </PanelSurface>
                </li>
              );
            })}
          </ul>
          {connectors.length === 0 && (
            <PanelSurface hub={hub} className="text-center text-sm text-text-muted">
              暂无可用的钱包连接器。
            </PanelSurface>
          )}
        </>
      ) : (
        <>
          {wrongChain && (
            <PanelSurface
              hub={hub}
              className={hub ? "mb-3 border-error/30 bg-error/10" : "mb-4 border border-error/30 bg-error/5"}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="text-lg" aria-hidden>
                  ⚠️
                </span>
                <h3 className="text-base font-semibold text-text-primary">网络不匹配</h3>
              </div>
              <p className="mb-4 text-sm text-text-secondary">
                当前钱包不在 {dorNetwork.name}，请先切换网络后再查看资产与操作认购。
              </p>
              <Button
                loading={isSwitching}
                onClick={() => switchChain({ chainId: dorNetwork.id })}
              >
                切换至 {dorNetwork.name}
              </Button>
            </PanelSurface>
          )}

          <PanelSurface
            hub={hub}
            className={
              hub
                ? `mb-3 ${wrongChain ? "opacity-95" : "border-cyber-blue/30"}`
                : `mb-4 ${wrongChain ? "opacity-95" : "border border-cyber-blue/25"}`
            }
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-text-primary">钱包已连接</h3>
              <Badge variant={wrongChain ? "purple" : "blue"}>
                {wrongChain ? "待切换网络" : "已就绪"}
              </Badge>
            </div>
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-muted">
                  钱包地址
                </p>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <code
                    className={`block break-all px-3 py-2.5 font-mono text-sm text-cyber-blue ${
                      hub
                        ? "rounded-xl border border-white/10 bg-black/30"
                        : "cut-corners border border-card-border bg-white/5"
                    }`}
                  >
                    {address}
                  </code>
                  <Button variant="secondary" size="sm" className="shrink-0" onClick={copyAddress}>
                    {copied ? "已复制" : "复制"}
                  </Button>
                </div>
                <p className="mt-1 text-xs text-text-muted">缩略：{formatAddress(address)}</p>
              </div>
              <div className={`grid gap-3 border-t pt-4 sm:grid-cols-2 ${hub ? "border-white/10" : "border-card-border"}`}>
                <div>
                  <p className="mb-1 text-xs text-text-muted">当前网络</p>
                  <p className="font-medium text-text-primary">{activeChainName}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-text-muted">连接方式</p>
                  <p className="font-medium text-text-primary">{activeConnector?.name ?? "—"}</p>
                </div>
              </div>
            </div>
          </PanelSurface>

          <Button
            variant="danger"
            loading={isDisconnecting}
            onClick={() => disconnect()}
          >
            断开钱包连接
          </Button>
        </>
      )}
    </section>
  );
}
