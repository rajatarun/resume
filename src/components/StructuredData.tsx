import { baseUrl, githubUrl, linkedInUrl } from "@/src/seo/seo.config";

export function StructuredData() {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Tarun Raja",
    jobTitle: "AI Systems Architect",
    url: baseUrl,
    sameAs: [githubUrl, linkedInUrl],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Plano",
      addressRegion: "TX",
      addressCountry: "US"
    },
    knowsAbout: [
      "AWS",
      "Kubernetes",
      "SRE",
      "DevOps",
      "GenAI",
      "LangChain",
      "LangGraph",
      "LLM Orchestration",
      "Fintech Systems"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Tarun Raja",
    url: baseUrl,
    inLanguage: "en-US",
    publisher: {
      "@type": "Person",
      name: "Tarun Raja",
      url: baseUrl,
      sameAs: [githubUrl, linkedInUrl]
    }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
    </>
  );
}
