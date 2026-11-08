import { buildPublicationsItemListJsonLd } from "@/lib/geo/jsonLd";

export function PublicationsGeoStructuredData() {
  const schema = buildPublicationsItemListJsonLd();
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  );
}
