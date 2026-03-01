import type { Metadata } from "next";
import { routeMetadata } from "@/src/seo/seo.config";

export const metadata: Metadata = routeMetadata["/blog"];

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
