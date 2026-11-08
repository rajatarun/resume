import { buildPersonJsonLd, buildWebSiteJsonLd } from "@/lib/geo/jsonLd";

export function StructuredData() {
  const personSchema = buildPersonJsonLd();
  const websiteSchema = buildWebSiteJsonLd();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
    </>
  );
}
