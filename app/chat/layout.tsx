import type { Metadata } from "next";
import type { ReactNode } from "react";
import { routeMetadata } from "@/src/seo/seo.config";

export const metadata: Metadata = routeMetadata["/chat"];

export default function ChatLayout({ children }: { children: ReactNode }) {
  return children;
}
