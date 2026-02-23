import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const siteUrl = "https://tarunraja.dev";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Tarun Raja | Full-Stack Engineer",
    template: "%s | Tarun Raja"
  },
  description:
    "Professional personal website for Tarun Raja, full-stack engineering leader specializing in cloud platforms, resilient systems, and GenAI delivery.",
  openGraph: {
    title: "Tarun Raja | Full-Stack Engineer",
    description:
      "Explore Tarun Raja's resume, projects, recruiter profile, portfolio, blog, and contact pages.",
    url: siteUrl,
    siteName: "Tarun Raja",
    type: "website"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
