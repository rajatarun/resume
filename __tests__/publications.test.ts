/**
 * The publications catalogue is the only source the site renders.
 * These pins keep the page on the five Zenodo preprints: the right titles,
 * preprint status, author ORCID, DOI, and record links — and nothing else.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  doiUrl,
  formatPublicationDate,
  publicationAuthor,
  publications,
  type Publication,
} from '@/data/publications';

const EXPECTED: Array<Pick<Publication, 'title' | 'doi' | 'recordUrl' | 'published'>> = [
  {
    title:
      'Learning to Route Without Trusting the Model: Verified Rewards for Adaptive Retrieval Routers',
    doi: '10.5281/zenodo.22998238',
    recordUrl: 'https://zenodo.org/records/22998238',
    published: '2026-09-27',
  },
  {
    title:
      'Estimate Before You Deploy: Offline Evaluation as a Safety Gate for Changing Retrieval Routing Policies',
    doi: '10.5281/zenodo.22998267',
    recordUrl: 'https://zenodo.org/records/22998267',
    published: '2026-09-27',
  },
  {
    title: 'A Retrieval Router That Silently Stopped Learning: Diagnosis and Correction',
    doi: '10.5281/zenodo.22726968',
    recordUrl: 'https://zenodo.org/records/22726968',
    published: '2026-09-12',
  },
  {
    title:
      'Adaptive-Confidence Fusion and Policy Interposition for Language-Driven Control of Physical Devices',
    doi: '10.5281/zenodo.22718368',
    recordUrl: 'https://zenodo.org/records/22718368',
    published: '2026-09-12',
  },
  {
    title:
      'Graph-Topology-Driven Dynamic Cipher Selection with Drift-Triggered Fail-Secure Override for Agentic Data Flows',
    doi: '10.5281/zenodo.22716273',
    recordUrl: 'https://zenodo.org/records/22716273',
    published: '2026-09-12',
  },
];

const root = join(__dirname, '..');

function source(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('publications catalogue', () => {
  it('lists exactly the five Zenodo preprints', () => {
    expect(publications).toHaveLength(EXPECTED.length);
    expect(publications.map((publication) => publication.title)).toEqual(
      EXPECTED.map((publication) => publication.title),
    );
    expect(publications.map((publication) => publication.doi)).toEqual(
      EXPECTED.map((publication) => publication.doi),
    );
    expect(publications.map((publication) => publication.recordUrl)).toEqual(
      EXPECTED.map((publication) => publication.recordUrl),
    );
    expect(publications.map((publication) => publication.published)).toEqual(
      EXPECTED.map((publication) => publication.published),
    );
  });

  it('labels every entry as a Zenodo preprint by Tarun Raja', () => {
    for (const publication of publications) {
      expect(publication.status).toBe('Preprint');
      expect(publication.venue).toBe('Zenodo');
      expect(publication.author).toEqual(publicationAuthor);
      expect(doiUrl(publication.doi)).toBe(`https://doi.org/${publication.doi}`);
      expect(publication.recordUrl).toBe(
        `https://zenodo.org/records/${publication.doi.split('.').pop()}`,
      );
    }

    expect(publicationAuthor).toEqual({
      name: 'Tarun Raja',
      orcid: '0009-0009-0842-8072',
      orcidUrl: 'https://orcid.org/0009-0009-0842-8072',
    });
  });

  it('does not attach an affiliation or any other author', () => {
    expect(publicationAuthor).not.toHaveProperty('affiliation');
    for (const publication of publications) {
      expect(Object.keys(publication).sort()).toEqual(
        ['author', 'doi', 'published', 'recordUrl', 'status', 'title', 'venue'].sort(),
      );
      expect(Object.keys(publication.author).sort()).toEqual(['name', 'orcid', 'orcidUrl']);
    }

    const serialized = JSON.stringify({ publicationAuthor, publications }).toLowerCase();
    expect(serialized).not.toContain('affiliation');
    expect(serialized).not.toContain('jpmorgan');
    expect(serialized).not.toContain('mcp-observatory');
  });

  it('formats publication dates without shifting the calendar day', () => {
    expect(formatPublicationDate('2026-09-27')).toBe('September 27, 2026');
    expect(formatPublicationDate('2026-09-12')).toBe('September 12, 2026');
  });
});

describe('publications are rendered and linked', () => {
  it('renders each catalogue field on the publications page', () => {
    const page = source('app/publications/page.tsx');
    expect(page).toContain('from "@/data/publications"');
    expect(page).toContain('publication.status');
    expect(page).toContain('publication.venue');
    expect(page).toContain('publication.author.name');
    expect(page).toContain('publication.author.orcid');
    expect(page).toContain('publication.author.orcidUrl');
    expect(page).toContain('doiUrl(publication.doi)');
    expect(page).toContain('publication.recordUrl');
    expect(page).toContain('Zenodo record');
  });

  it('is linked from the Work menu and the public sitemaps', () => {
    expect(source('components/TopNav.tsx')).toContain('href: "/publications"');
    expect(source('src/seo/seo.config.ts')).toContain('"/publications"');
    expect(source('scripts/generate-seo-files.mjs')).toContain('"/publications"');
    expect(source('public/sitemap.xml')).toContain('/publications');
  });
});
