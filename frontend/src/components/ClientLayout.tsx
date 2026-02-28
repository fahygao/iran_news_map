"use client";

import { useState } from "react";
import Link from "next/link";
import { I18nProvider, useI18n } from "@/lib/i18n";

function Header() {
  const { locale, setLocale, t } = useI18n();

  return (
    <header className="header-bar border-b border-white/[0.06] sticky top-0 z-50">
      <nav className="max-w-screen-2xl mx-auto px-4 sm:px-5 h-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="status-dot" />
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-gray-200">
            <span className="iran-glow">IRAN</span>
            <span className="text-gray-500 font-normal mx-1.5">/</span>
            <span className="text-gray-400 font-medium">NEWS MAP</span>
          </span>
        </Link>
        <div className="flex items-center gap-0.5">
          <Link
            href="/"
            className="nav-link px-2.5 sm:px-3 py-1.5 rounded text-[12px] sm:text-[13px] font-medium tracking-wide"
          >
            {t("nav.map")}
          </Link>
          <Link
            href="/timeline"
            className="nav-link px-2.5 sm:px-3 py-1.5 rounded text-[12px] sm:text-[13px] font-medium tracking-wide"
          >
            {t("nav.timeline")}
          </Link>
          <Link
            href="/predict"
            className="nav-link px-2.5 sm:px-3 py-1.5 rounded text-[12px] sm:text-[13px] font-medium tracking-wide"
          >
            {t("nav.predict")}
          </Link>
          <div className="w-px h-4 bg-white/[0.06] mx-1" />
          <button
            onClick={() => setLocale(locale === "en" ? "zh" : "en")}
            className="lang-toggle px-2 py-1 rounded text-[11px] font-[family-name:var(--font-jetbrains)] tracking-wide cursor-pointer"
          >
            {locale === "en" ? "中文" : "EN"}
          </button>
        </div>
      </nav>
    </header>
  );
}

const SOLANA_ADDRESS = "HVimxtePvhS62Xqj5J4EVSShjeraHZX4iC2t5ga4PrUr";

function Footer() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(SOLANA_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <footer className="footer-bar border-t border-white/[0.06] z-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-5 h-9 flex items-center justify-between">
        {/* Left: Built by + social links */}
        <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-gray-500 font-[family-name:var(--font-jetbrains)] tracking-wide">
          <span className="text-gray-600">{t("footer.builtBy")}</span>
          <a
            href="https://github.com/fahygao"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-gray-300 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            <span>fahygao</span>
          </a>
          <a
            href="https://x.com/fahygaoyf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-gray-300 transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>fahygaoyf</span>
          </a>
        </div>

        {/* Right: Solana tip */}
        <button
          onClick={copyAddress}
          title={t("footer.clickToCopy")}
          className="tip-button flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] sm:text-[11px] font-[family-name:var(--font-jetbrains)] cursor-pointer"
        >
          <span className="text-[13px] leading-none">&#9672;</span>
          <span>{t("footer.tipSolana")}</span>
          <span className="text-gray-600 hidden sm:inline">
            {SOLANA_ADDRESS.slice(0, 4)}...{SOLANA_ADDRESS.slice(-4)}
          </span>
          {copied && (
            <span className="text-green-400 text-[9px] ml-1">{t("footer.copied")}</span>
          )}
        </button>
      </div>
    </footer>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <Header />
      <main className="h-[calc(100vh-5.25rem)]">{children}</main>
      <Footer />
    </I18nProvider>
  );
}
