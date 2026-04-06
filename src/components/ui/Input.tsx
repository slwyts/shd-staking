/**
 * @file components/ui/Input.tsx
 * @description 输入框组件 — 科幻风格，支持标签、后缀和错误提示。
 */
"use client";

import { type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 输入框标签 */
  label?: string;
  /** 右侧后缀内容（如代币符号、MAX 按钮） */
  suffix?: React.ReactNode;
  /** 错误提示文本 */
  error?: string;
}

/**
 * Input — 科幻风格输入框
 * @param label - 上方标签
 * @param suffix - 右侧后缀
 * @param error - 底部错误提示
 */
export function Input({ label, suffix, error, className = "", ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      <div
        className={`flex items-center border bg-white/5 transition-colors focus-within:border-cyber-blue/50 focus-within:bg-white/[0.08] cut-corners ${
          error ? "border-error/50" : "border-card-border"
        }`}
      >
        <input
          className={`flex-1 bg-transparent px-4 py-3 text-text-primary placeholder-text-muted outline-none ${className}`}
          {...props}
        />
        {suffix && (
          <div className="flex items-center pr-3 text-text-secondary">
            {suffix}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
