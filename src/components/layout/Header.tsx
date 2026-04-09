"use client";

import Image from "next/image";
import Link from "next/link";
import { Languages, Wallet } from "lucide-react";
import { useLocale } from "@/providers/LocaleProvider";

export function Header() {
  const { locale, toggleLocale, t } = useLocale();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-card-border bg-deep-space/80 px-3 py-2.5 backdrop-blur-md transition-all duration-300 animate-slide-down sm:px-5 sm:py-3">
      <Link href="/" className="group flex items-center gap-1.5 sm:gap-2">
        <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-lg bg-cyber-blue shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] sm:h-7 sm:w-7">
          <Image src="/images/brand-logo.png" alt="SHD 品牌标志" fill className="object-cover" sizes="28px" priority />
        </div>
        <span className="text-[10px] font-semibold leading-tight text-text-primary transition-colors group-hover:text-cyber-blue sm:text-xs">可信数据空间酒类数据资产平台</span>
      </Link>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={toggleLocale}
          className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] text-text-secondary transition-all duration-200 hover:bg-white/5 hover:text-text-primary active:scale-95 sm:gap-1 sm:px-2.5 sm:text-xs"
        >
          <Languages className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          {locale === "zh" ? "EN" : "中文"}
        </button>

        <div className="flex items-center gap-1 rounded-lg border border-transparent bg-white/5 px-2 py-1.5 transition-all duration-200 hover:border-amber-orange/30 hover:bg-amber-orange/5 sm:gap-1.5 sm:px-3">
          <Wallet className="h-3 w-3 text-amber-orange sm:h-3.5 sm:w-3.5" />
          <span className="text-[10px] text-text-secondary sm:text-xs">{t("header.installWallet")}</span>
        </div>
      </div>
    </header>
  );
}
