/**
 * Unit tests for the Control Room's execution gate.
 *
 * The gate's job is to stop a consequential action running on a click. Three
 * properties make it worth having, and each is easy to break in a way that
 * leaves the UI looking identical:
 *
 *   1. It is deterministic. A verdict that wanders between two looks at the
 *      same proposal teaches an operator to click through it.
 *   2. signals_defined travels with the score. A low composite drawn from one
 *      signal is not the evidence a low composite drawn from six is, so a clear
 *      on fewer than three is held for review however low it scored.
 *   3. A signal that could not be measured reads as null, never as zero. Zero
 *      is "measured, and clean" — the most expensive possible way to be wrong
 *      about risk.
 */

import {
  RISK_SIGNALS,
  ProposalKind,
  scoreProposal,
  propose,
  explain,
} from '@/lib/admin/gate';

const KINDS: ProposalKind[] = [
  'publish',
  'generate',
  'routine-toggle',
  'routine-run',
  'reject',
];

describe('scoreProposal', () => {
  it('is deterministic for the same kind and subject', () => {
    const a = scoreProposal('publish', 'article-7f21c');
    const b = scoreProposal('publish', 'article-7f21c');
    expect(a).toEqual(b);
  });

  it('separates proposals that differ only by subject', () => {
    const a = scoreProposal('publish', 'article-one');
    const b = scoreProposal('publish', 'article-two');
    expect(a.composite).not.toEqual(b.composite);
  });

  it('reports an unmeasurable signal as null, never as zero', () => {
    const risk = scoreProposal('reject', 'article-7f21c');
    const nulls = RISK_SIGNALS.filter((s) => risk.vector[s] === null);

    expect(nulls.length).toBeGreaterThan(0);
    // The distinction the whole mechanism rests on: absent is not clean.
    nulls.forEach((s) => expect(risk.vector[s]).not.toBe(0));
  });

  it('counts exactly the signals it actually measured', () => {
    KINDS.forEach((kind) => {
      const risk = scoreProposal(kind, 'subject');
      const measured = RISK_SIGNALS.filter((s) => risk.vector[s] !== null);
      expect(risk.signalsDefined).toBe(measured.length);
    });
  });

  it('measures all six for a model-drafting proposal', () => {
    const risk = scoreProposal('generate', 'article-7f21c');
    expect(risk.signalsDefined).toBe(6);
  });

  it('never clears an action measured on fewer than three signals', () => {
    KINDS.forEach((kind) => {
      // Many subjects, so this is not one lucky hash.
      for (let i = 0; i < 200; i += 1) {
        const risk = scoreProposal(kind, `subject-${i}`);
        if (risk.signalsDefined < 3) {
          expect(risk.thin).toBe(true);
          expect(risk.decision).not.toBe('ALLOW');
        }
      }
    });
  });

  it('keeps the composite inside the unit interval', () => {
    KINDS.forEach((kind) => {
      for (let i = 0; i < 100; i += 1) {
        const risk = scoreProposal(kind, `subject-${i}`);
        expect(risk.composite).toBeGreaterThanOrEqual(0);
        expect(risk.composite).toBeLessThanOrEqual(1);
      }
    });
  });

  it('maps the level onto the decision consistently', () => {
    KINDS.forEach((kind) => {
      for (let i = 0; i < 200; i += 1) {
        const risk = scoreProposal(kind, `subject-${i}`);
        if (risk.level === 'high') expect(risk.decision).toBe('BLOCK');
        if (risk.decision === 'ALLOW') {
          expect(risk.level).toBe('low');
          expect(risk.thin).toBe(false);
        }
      }
    });
  });

  it('produces every decision across the space, so no branch is dead', () => {
    const seen = new Set<string>();
    KINDS.forEach((kind) => {
      for (let i = 0; i < 400; i += 1) {
        seen.add(scoreProposal(kind, `subject-${i}`).decision);
      }
    });
    expect(seen).toEqual(new Set(['ALLOW', 'REVIEW', 'BLOCK']));
  });
});

describe('propose', () => {
  it('carries the title through and scores the subject', () => {
    const p = propose('publish', 'Approve and publish “X”', 'article-7f21c');
    expect(p.title).toBe('Approve and publish “X”');
    expect(p.risk).toEqual(scoreProposal('publish', 'article-7f21c'));
  });
});

describe('explain', () => {
  it('names thin evidence as the reason when that is what held it', () => {
    // 'reject' measures one signal, so it can never clear on evidence alone.
    const risk = scoreProposal('reject', 'article-7f21c');
    expect(risk.thin).toBe(true);
    expect(explain(risk)).toMatch(/1 of 6 signals/);
  });

  it('says a blocked proposal will not commit', () => {
    const blocked = KINDS.flatMap((kind) =>
      Array.from({ length: 400 }, (_, i) => scoreProposal(kind, `subject-${i}`)),
    ).find((r) => r.decision === 'BLOCK');

    expect(blocked).toBeDefined();
    expect(explain(blocked!)).toMatch(/will not commit/);
  });
});
