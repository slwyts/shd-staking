import { Search, Globe, Download, ExternalLink } from "lucide-react";
import { siteConfig } from "@/config/site";

export function Footer() {
  return (
    <footer className="border-t border-card-border py-3 px-4">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <p className="text-[11px] text-text-muted">
          &copy; {new Date().getFullYear()} {siteConfig.name}
        </p>
        <div className="flex items-center gap-4">
          <a href={siteConfig.links.explorer} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-1 text-[11px] text-text-muted transition-colors hover:text-text-secondary">
            <Search className="h-3 w-3" />区块浏览器
            <ExternalLink className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
          <a href={siteConfig.links.chainWebsite} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-1 text-[11px] text-text-muted transition-colors hover:text-text-secondary">
            <Globe className="h-3 w-3" />官网
            <ExternalLink className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
          <a href={siteConfig.links.walletDownload} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-1 text-[11px] text-text-muted transition-colors hover:text-text-secondary">
            <Download className="h-3 w-3" />钱包
            <ExternalLink className="h-2.5 w-2.5 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
        </div>
      </div>
    </footer>
  );
}
