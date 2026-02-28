import type { Metadata } from "next";
import { JetBrains_Mono, DM_Sans } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Iran News Map - Real-Time Conflict Intelligence",
  description:
    "Interactive map and news feed tracking Iran and US conflict events in real-time",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} antialiased bg-[#0a0c10] text-gray-100 min-h-screen font-[family-name:var(--font-dm-sans)]`}
      >
        <header className="header-bar border-b border-white/[0.06] sticky top-0 z-50">
          <nav className="max-w-screen-2xl mx-auto px-5 h-12 flex items-center justify-between">
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
                className="nav-link px-3 py-1.5 rounded text-[13px] font-medium tracking-wide"
              >
                MAP
              </Link>
              <Link
                href="/timeline"
                className="nav-link px-3 py-1.5 rounded text-[13px] font-medium tracking-wide"
              >
                TIMELINE
              </Link>
            </div>
          </nav>
        </header>
        <main className="h-[calc(100vh-3rem)]">{children}</main>
      </body>
    </html>
  );
}
