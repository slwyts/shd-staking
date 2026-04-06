/**
 * @file components/ui/Modal.tsx
 * @description 模态弹窗组件 — 居中弹出，背景遮罩，玻璃拟态面板。
 */
"use client";

import { type ReactNode, useEffect } from "react";

interface ModalProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 弹窗标题 */
  title?: string;
  children: ReactNode;
}

/**
 * Modal — 模态弹窗
 * @param open - 控制显示/隐藏
 * @param onClose - 点击遮罩或关闭按钮时触发
 * @param title - 可选标题
 */
export function Modal({ open, onClose, title, children }: ModalProps) {
  // 打开时禁止页面滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* 弹窗面板 */}
      <div className="glass-card relative z-10 mx-4 w-full max-w-md p-6 animate-slide-up">
        {/* 标题栏 */}
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            <button
              onClick={onClose}
              className="cut-corners p-1 text-text-muted transition-colors hover:bg-white/10 hover:text-text-primary"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
