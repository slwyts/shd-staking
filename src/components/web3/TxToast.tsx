/**
 * @file components/web3/TxToast.tsx
 * @description 交易状态通知组件 — 显示交易的等待/成功/失败状态。
 */
"use client";

import { type ReactNode, useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle, X } from "lucide-react";

export type TxStatus = "pending" | "success" | "error" | null;

interface TxToastProps {
  status: TxStatus;
  txHash?: string;
  message?: string;
  onClose: () => void;
}

const STATUS_CONFIG: Record<
  Exclude<TxStatus, null>,
  { icon: ReactNode; title: string; color: string }
> = {
  pending: {
    icon: <Loader2 className="h-5 w-5 animate-spin text-cyber-blue" />,
    title: "交易处理中",
    color: "border-cyber-blue/50 bg-cyber-blue/10",
  },
  success: {
    icon: <CheckCircle2 className="h-5 w-5 text-accent-green" />,
    title: "交易成功",
    color: "border-accent-green/50 bg-accent-green/10",
  },
  error: {
    icon: <XCircle className="h-5 w-5 text-error" />,
    title: "交易失败",
    color: "border-error/50 bg-error/10",
  },
};

/**
 * TxToast — 交易状态浮动通知
 */
export function TxToast({ status, txHash, message, onClose }: TxToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status) {
      setVisible(true);
      // 成功/失败状态 5 秒后自动关闭
      if (status !== "pending") {
        const timer = setTimeout(() => {
          setVisible(false);
          onClose();
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [status, onClose]);

  if (!status || !visible) return null;

  const config = STATUS_CONFIG[status];

  return (
    <div className="fixed bottom-6 right-6 z-[200] animate-slide-up">
      <div
        className={`glass-card flex items-center gap-3 border px-5 py-3 ${config.color}`}
      >
        <span className="shrink-0">{config.icon}</span>
        <div>
          <p className="text-sm font-medium text-text-primary">{config.title}</p>
          {message && (
            <p className="text-xs text-text-secondary">{message}</p>
          )}
          {txHash && (
            <a
              href={`https://block.bjwmls.com/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyber-blue hover:underline"
            >
              查看交易详情
            </a>
          )}
        </div>
        <button
          onClick={() => { setVisible(false); onClose(); }}
          className="ml-2 rounded-md p-1 text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
