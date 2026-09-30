export type PublicationAuthor = {
  name: string;
  orcid: string;
  orcidUrl: string;
};

export type Publication = {
  title: string;
  author: PublicationAuthor;
  status: "Preprint";
  venue: "Zenodo";
  doi: string;
  recordUrl: string;
  published: string;
};

export const publicationAuthor: PublicationAuthor = {
  name: "Tarun Raja",
  orcid: "0009-0009-0842-8072",
  orcidUrl: "https://orcid.org/0009-0009-0842-8072"
};

export function doiUrl(doi: string): string {
  return `https://doi.org/${doi}`;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
] as const;

/** Format a YYYY-MM-DD date without timezone shift. */
export function formatPublicationDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return isoDate;
  }

  const year = match[1];
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const month = MONTHS[monthIndex];
  if (!month || day < 1 || day > 31) {
    return isoDate;
  }

  return `${month} ${day}, ${year}`;
}

export const publications: readonly Publication[] = [
  {
    title:
      "Learning to Route Without Trusting the Model: Verified Rewards for Adaptive Retrieval Routers",
    author: publicationAuthor,
    status: "Preprint",
    venue: "Zenodo",
    doi: "10.5281/zenodo.22998238",
    recordUrl: "https://zenodo.org/records/22998238",
    published: "2026-09-27"
  },
  {
    title:
      "Estimate Before You Deploy: Offline Evaluation as a Safety Gate for Changing Retrieval Routing Policies",
    author: publicationAuthor,
    status: "Preprint",
    venue: "Zenodo",
    doi: "10.5281/zenodo.22998267",
    recordUrl: "https://zenodo.org/records/22998267",
    published: "2026-09-27"
  },
  {
    title: "A Retrieval Router That Silently Stopped Learning: Diagnosis and Correction",
    author: publicationAuthor,
    status: "Preprint",
    venue: "Zenodo",
    doi: "10.5281/zenodo.22726968",
    recordUrl: "https://zenodo.org/records/22726968",
    published: "2026-09-12"
  },
  {
    title:
      "Adaptive-Confidence Fusion and Policy Interposition for Language-Driven Control of Physical Devices",
    author: publicationAuthor,
    status: "Preprint",
    venue: "Zenodo",
    doi: "10.5281/zenodo.22718368",
    recordUrl: "https://zenodo.org/records/22718368",
    published: "2026-09-12"
  },
  {
    title:
      "Graph-Topology-Driven Dynamic Cipher Selection with Drift-Triggered Fail-Secure Override for Agentic Data Flows",
    author: publicationAuthor,
    status: "Preprint",
    venue: "Zenodo",
    doi: "10.5281/zenodo.22716273",
    recordUrl: "https://zenodo.org/records/22716273",
    published: "2026-09-12"
  }
];
