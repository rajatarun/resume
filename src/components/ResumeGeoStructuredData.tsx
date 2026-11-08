import { buildProfilePageJsonLd } from "@/lib/geo/jsonLd";

export function ResumeGeoStructuredData() {
  const schema = buildProfilePageJsonLd();
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  );
}
