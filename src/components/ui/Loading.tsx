/**
 * @file components/ui/Loading.tsx
 * @description 加载状态组件 — 包含旋转图标和骨架屏两种模式。
 */

interface LoadingSpinnerProps {
  /** 尺寸 */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SPINNER_SIZES = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
} as const;

/**
 * LoadingSpinner — 旋转加载图标
 */
export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-2 border-cyber-blue/20 border-t-cyber-blue ${SPINNER_SIZES[size]}`}
      />
    </div>
  );
}

/**
 * Skeleton — 骨架屏占位
 * @param className - 传入宽高等尺寸类
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse cut-corners bg-white/10 ${className}`}
    />
  );
}

/**
 * PageLoading — 全页加载状态
 */
export function PageLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-text-secondary">加载中...</p>
      </div>
    </div>
  );
}
