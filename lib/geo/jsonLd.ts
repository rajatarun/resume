import { publications } from "@/data/publications";
import { resume } from "@/lib/resume";
import { baseUrl, githubUrl, linkedInUrl } from "@/src/seo/seo.config";
import {
  alumniOfFromResume,
  credentialsFromResume,
  knowsAboutFromResume,
  parseUsLocation,
  publicEntity
} from "./publicEntity";

const PERSON_ID = `${baseUrl}/resume#tarun-raja`;

export function buildPersonJsonLd() {
  const address = parseUsLocation(publicEntity.locationLabel);
  const currentRole = resume.experience[0];
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": PERSON_ID,
    name: publicEntity.name,
    jobTitle: publicEntity.currentTitle,
    url: baseUrl,
    sameAs: [githubUrl, linkedInUrl, publicEntity.orcidUrl],
    identifier: {
      "@type": "PropertyValue",
      propertyID: "ORCID",
      value: publicEntity.orcid
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: address.addressLocality,
      addressRegion: address.addressRegion,
      addressCountry: address.addressCountry
    },
    ...(currentRole
      ? {
          worksFor: {
            "@type": "Organization",
            name: currentRole.company
          }
        }
      : {}),
    knowsAbout: knowsAboutFromResume(),
    alumniOf: alumniOfFromResume(),
    hasCredential: credentialsFromResume(),
    description: publicEntity.profileSummary
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: publicEntity.name,
    url: baseUrl,
    inLanguage: "en-US",
    description: publicEntity.siteTagline,
    publisher: {
      "@type": "Person",
      "@id": PERSON_ID,
      name: publicEntity.name,
      url: baseUrl,
      sameAs: [githubUrl, linkedInUrl, publicEntity.orcidUrl]
    }
  };
}

export function buildProfilePageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${baseUrl}/resume#profile`,
    url: `${baseUrl}/resume`,
    name: `${publicEntity.name} — Resume`,
    description: publicEntity.profileHeadline,
    dateModified: new Date().toISOString().split("T")[0],
    mainEntity: { "@id": PERSON_ID },
    hasPart: resume.projects.map((project) => ({
      "@type": "SoftwareSourceCode",
      name: project.name,
      description: project.subtitle ?? project.name,
      author: { "@id": PERSON_ID },
      ...(project.githubRepo
        ? { codeRepository: `https://github.com/${project.githubRepo}` }
        : {}),
      url: `${baseUrl}/resume`
    }))
  };
}

export function buildPublicationsItemListJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Tarun Raja — Zenodo preprints",
    itemListElement: publications.map((pub, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "ScholarlyArticle",
        headline: pub.title,
        author: {
          "@type": "Person",
          "@id": PERSON_ID,
          name: pub.author.name,
          identifier: pub.author.orcid
        },
        datePublished: pub.published,
        isPartOf: {
          "@type": "WebPage",
          url: `${baseUrl}/publications`
        },
        description: `${pub.status} on ${pub.venue}. Not peer-reviewed.`,
        sameAs: [pub.recordUrl, `https://doi.org/${pub.doi}`]
      }
    }))
  };
}
