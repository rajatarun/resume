import type { Metadata } from "next";
import { AiLabPage } from "@/components/labs/AiLabPage";
import { routeMetadata } from "@/src/seo/seo.config";

export const metadata: Metadata = routeMetadata["/labs"];

export default function LabsPage() {
  return <AiLabPage />;
}
