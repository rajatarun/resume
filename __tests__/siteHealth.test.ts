/**
 * The site-health page reads Google's PageSpeed Insights response into the
 * four category scores, the lab Core Web Vitals, real-user field data and the
 * audits that failed. These pin that reading on a small stand-in response:
 * bands follow Lighthouse's own 90 / 50 cut-offs, only audits that can fail
 * and did are listed, pass/fail checks come before scored ones, and field
 * data says whether it describes the page or falls back to the whole origin.
 */
import {
  bandOf,
  buildAuditTargets,
  buildPsiRequestUrl,
  parsePsiResponse,
  pageSpeedUiUrl,
} from '../lib/siteHealth';

const response = {
  lighthouseResult: {
    lighthouseVersion: '12.8.2',
    fetchTime: '2026-10-07T20:00:00.000Z',
    finalDisplayedUrl: 'https://tarunraja.info/',
    categories: {
      performance: {
        score: 0.92,
        auditRefs: [
          { id: 'largest-contentful-paint', group: 'metrics' },
          { id: 'unused-javascript' },
          { id: 'uses-text-compression' },
        ],
      },
      accessibility: {
        score: 0.87,
        auditRefs: [{ id: 'color-contrast' }, { id: 'image-alt' }, { id: 'manual-check' }],
      },
      'best-practices': { score: 1, auditRefs: [{ id: 'errors-in-console' }] },
      seo: { score: 0.45, auditRefs: [{ id: 'meta-description' }, { id: 'is-crawlable', group: 'hidden' }] },
    },
    audits: {
      'largest-contentful-paint': { score: 0.6, displayValue: '3.4 s', scoreDisplayMode: 'numeric' },
      'total-blocking-time': { score: 1, displayValue: '20 ms', scoreDisplayMode: 'numeric' },
      'cumulative-layout-shift': { score: 0.99, displayValue: '0.012', scoreDisplayMode: 'numeric' },
      'first-contentful-paint': { score: 0.95, displayValue: '1.1 s', scoreDisplayMode: 'numeric' },
      'speed-index': { score: 0.3, displayValue: '7.0 s', scoreDisplayMode: 'numeric' },
      'unused-javascript': { title: 'Reduce unused JavaScript', score: 0.5, scoreDisplayMode: 'metricSavings', displayValue: 'Est savings of 120 KiB', details: { items: [{}, {}] } },
      'uses-text-compression': { title: 'Enable text compression', score: 1, scoreDisplayMode: 'metricSavings' },
      'color-contrast': { title: 'Insufficient contrast', score: 0, scoreDisplayMode: 'binary', details: { items: [{}, {}, {}] } },
      'image-alt': { title: 'Images have alt', score: 1, scoreDisplayMode: 'binary' },
      'manual-check': { title: 'Manual', score: null, scoreDisplayMode: 'manual' },
      'errors-in-console': { title: 'No console errors', score: 1, scoreDisplayMode: 'binary' },
      'meta-description': { title: 'Missing meta description', score: 0, scoreDisplayMode: 'binary' },
      'is-crawlable': { title: 'Crawlable', score: 0, scoreDisplayMode: 'binary' },
    },
  },
  loadingExperience: {
    origin_fallback: true,
    overall_category: 'AVERAGE',
    metrics: {
      LARGEST_CONTENTFUL_PAINT_MS: { percentile: 2900, category: 'AVERAGE' },
      CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: 4, category: 'FAST' },
      INTERACTION_TO_NEXT_PAINT: { percentile: 180, category: 'FAST' },
    },
  },
};

describe('site health', () => {
  it('bands scores the way Lighthouse does', () => {
    expect([bandOf(100), bandOf(90), bandOf(89), bandOf(50), bandOf(49), bandOf(0)]).toEqual([
      'good', 'good', 'average', 'average', 'poor', 'poor',
    ]);
  });

  it('asks PageSpeed Insights for all four categories, with the key only when there is one', () => {
    const url = new URL(buildPsiRequestUrl('https://tarunraja.info/', 'mobile'));
    expect(url.searchParams.getAll('category')).toEqual(['performance', 'accessibility', 'best-practices', 'seo']);
    expect(url.searchParams.get('strategy')).toBe('mobile');
    expect(url.searchParams.has('key')).toBe(false);
    expect(new URL(buildPsiRequestUrl('https://x/', 'desktop', 'k')).searchParams.get('key')).toBe('k');
    expect(pageSpeedUiUrl('https://tarunraja.info/', 'desktop')).toContain('form_factor=desktop');
  });

  it('audits every public route and every homepage design', () => {
    const paths = buildAuditTargets(['/', '/publications']).map((t) => t.path);
    expect(paths).toContain('/');
    expect(paths).toContain('/publications');
    expect(paths).toContain('/?home=prism');
    expect(paths).toContain('/?home=midnight');
  });

  const report = parsePsiResponse(response, 'mobile');

  it('reads the four category scores', () => {
    expect(report.scores).toEqual({ performance: 92, accessibility: 87, 'best-practices': 100, seo: 45 });
    expect(report.lighthouseVersion).toBe('12.8.2');
    expect(report.url).toBe('https://tarunraja.info/');
  });

  it('reads the lab metrics with their bands', () => {
    const lcp = report.lab.find((m) => m.short === 'LCP')!;
    expect(lcp.display).toBe('3.4 s');
    expect(lcp.band).toBe('average');
    expect(report.lab.find((m) => m.short === 'SI')!.band).toBe('poor');
  });

  it('lists only audits that can fail and did, pass/fail checks first', () => {
    expect(report.failing.performance.map((a) => a.id)).toEqual(['unused-javascript']);
    expect(report.failing.performance[0]).toMatchObject({ score: 50, items: 2, display: 'Est savings of 120 KiB' });
    expect(report.failing.accessibility).toEqual([
      { id: 'color-contrast', title: 'Insufficient contrast', display: '', score: null, items: 3 },
    ]);
    expect(report.failing['best-practices']).toEqual([]);
    // Hidden-group audits are Lighthouse internals, not findings.
    expect(report.failing.seo.map((a) => a.id)).toEqual(['meta-description']);
  });

  it('says when field data is the whole origin rather than this page', () => {
    expect(report.field?.scope).toBe('origin');
    expect(report.field?.overall).toBe('average');
    expect(report.field?.metrics.map((m) => [m.id, m.display, m.band])).toEqual([
      ['LARGEST_CONTENTFUL_PAINT_MS', '2.9 s', 'average'],
      ['INTERACTION_TO_NEXT_PAINT', '180 ms', 'good'],
      ['CUMULATIVE_LAYOUT_SHIFT_SCORE', '0.04', 'good'],
    ]);
  });

  it('has no field data when Google has none, and fails loudly on an error response', () => {
    expect(parsePsiResponse({ lighthouseResult: response.lighthouseResult }, 'desktop').field).toBeNull();
    expect(() => parsePsiResponse({ error: { message: 'Quota exceeded' } }, 'mobile')).toThrow('Quota exceeded');
  });
});
