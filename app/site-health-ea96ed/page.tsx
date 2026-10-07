import type { Metadata } from "next";
import { SiteHealthDashboard } from "@/components/siteHealth/SiteHealthDashboard";
import { buildAuditTargets } from "@/lib/siteHealth";
import { baseUrl, seoRoutes } from "@/src/seo/seo.config";

// Unlisted on purpose: the random suffix keeps the URL unguessable, nothing
// links here, it is not in either sitemap (both list routes explicitly), and
// robots meta keeps it out of search results. Rename the folder to move it.
// It is not access control: anyone with the link can open it, and all it
// shows is what PageSpeed Insights would show anyone about the public site.
export const metadata: Metadata = {
  title: "Site health",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  alternates: { canonical: null }
};

export default function SiteHealthPage() {
  return (
    <SiteHealthDashboard
      baseUrl={baseUrl}
      targets={buildAuditTargets(seoRoutes)}
      apiKey={process.env.NEXT_PUBLIC_PAGESPEED_API_KEY || undefined}
    />
  );
}
