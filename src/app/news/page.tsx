"use client";

import { PageContainer } from "@/components/layout/PageContainer";
import { AnimatedSection } from "@/components/ui/AnimatedSection";

export default function NewsPage() {
  return (
    <PageContainer>
      <AnimatedSection direction="up">
        <div className="text-center">
          <h1 className="mb-1 text-lg font-semibold text-text-primary sm:text-xl">打新</h1>
          <p className="mb-5 text-xs text-text-muted sm:mb-6 sm:text-sm">暂未开放</p>
        </div>
      </AnimatedSection>

      <AnimatedSection direction="up" delay={0.08}>
        <div className="rounded-2xl border border-card-border bg-white/5 py-10 text-center sm:py-14">
          <p className="text-sm font-medium text-text-secondary sm:text-base">暂未开放</p>
        </div>
      </AnimatedSection>
    </PageContainer>
  );
}
