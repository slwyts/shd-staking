"use client";

import "@/styles/globals.css";
import { Web3Provider } from "@/providers/Web3Provider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" data-scroll-behavior="smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <Web3Provider>
            <div className="flex min-h-screen flex-col pb-[calc(4rem+env(safe-area-inset-bottom,0px))]">
              <Header />
              <main className="flex-1">{children}</main>
            </div>
            <BottomNav />
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
