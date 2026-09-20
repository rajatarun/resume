import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { SiteFooter } from "@/components/SiteFooter";
import { Web3Provider } from "@/components/web3/Web3Provider";
import { SkipLink } from "@/components/SkipLink";
import { StructuredData } from "@/src/components/StructuredData";
import { baseUrl, githubUrl, linkedInUrl, routeMetadata } from "@/src/seo/seo.config";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Tarun Raja — AI Systems Architect & Social-Media Technologist",
    template: "%s"
  },
  description: routeMetadata["/"].description,
  openGraph: {
    ...(routeMetadata["/"].openGraph ?? {}),
    siteName: "Tarun Raja",
    type: "website",
    url: baseUrl
  },
  twitter: routeMetadata["/"].twitter,
  alternates: {
    canonical: baseUrl
  },
  other: {
    "profile:username": "tarunraja",
    "profile:github": githubUrl,
    "profile:linkedin": linkedInUrl
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* flex column + a growing <main> so the footer sits at the bottom of
          the viewport on short pages. min-h-screen alone only made the body
          tall; nothing pushed the footer down, so /admin and /contact ended
          with the footer floating mid-page above ~500px of dead background.
          The providers render no element of their own, so the nav, main and
          footer are this flex container's direct children. */}
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <SkipLink />
        <Web3Provider>
          <TopNav />
          <StructuredData />
          <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-24 sm:px-6 lg:px-8">{children}</main>
          <SiteFooter />
        </Web3Provider>
      </body>
    </html>
  );
}
