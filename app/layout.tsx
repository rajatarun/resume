import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Web3Provider } from "@/components/web3/Web3Provider";

const siteUrl = "https://tarunraja.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Tarun Raja | Full-Stack Lead Engineer",
    template: "%s | Tarun Raja"
  },
  description:
    "Professional personal website for Tarun Raja, full-stack lead engineer specializing in cloud architecture, GenAI products, and mentorship.",
  openGraph: {
    title: "Tarun Raja | Full-Stack Lead Engineer",
    description:
      "Explore Tarun Raja's website, portfolio, blog, store, and appointment links.",
    url: siteUrl,
    siteName: "Tarun Raja",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Tarun Raja | Full-Stack Lead Engineer",
    description:
      "Explore Tarun Raja's website, portfolio, blog, store, and appointment links."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <Web3Provider>
          <TopNav />
          <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">{children}</main>
          <SiteFooter />
        </Web3Provider>
      </body>
    </html>
  );
}
