/**
 * @file components/web3/TxToast.tsx
 * @description 交易状态通知组件 — 显示交易的等待/成功/失败状态。
 */
"use client";

import { useEffect, useState } from "react";

export type TxStatus = "pending" | "success" | "error" | null;

interface TxToastProps {
  /** 交易状态 */
  status: TxStatus;
  /** 交易哈希（用于跳转区块浏览器） */
  txHash?: string;
  /** 自定义消息 */
  message?: string;
  /** 关闭回调 */
  onClose: () => void;
}

const STATUS_CONFIG = {
  pending: {
    icon: "⏳",
    title: "交易处理中",
    color: "border-cyber-blue/50 bg-cyber-blue/10",
  },
  success: {
    icon: "✅",
    title: "交易成功",
    color: "border-accent-green/50 bg-accent-green/10",
  },
  error: {
    icon: "❌",
    title: "交易失败",
    color: "border-error/50 bg-error/10",
  },
} as const;

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
        <span className="text-xl">{config.icon}</span>
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
          className="ml-2 text-text-muted hover:text-text-primary"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
