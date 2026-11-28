import { describe, it, expect } from 'vitest';
import { routeQuestion } from '../../web/src/ai/router';
import { fitHistory } from '../../web/src/ai/prompts';

describe('team router', () => {
  it('picks 2–3 relevant experts without a model call', () => {
    const p = routeQuestion('We need a landing page for a coffee subscription: positioning, page structure and accessibility must-haves.');
    expect(p.experts.length).toBeGreaterThanOrEqual(2);
    expect(p.experts.length).toBeLessThanOrEqual(3);
    expect(p.experts.map((e) => e.slug)).toContain('accessibility-specialist');
    expect(new Set(p.experts.map((e) => e.slug)).size).toBe(p.experts.length);
    expect(p.fallback).toBe(false);
  });
  it('falls back to the core panel and flags stakes', () => {
    const p = routeQuestion('hmm?');
    expect(p.fallback).toBe(true);
    expect(p.experts.map((e) => e.slug)).toEqual(['product-strategist', 'ux-architect', 'software-architect']);
    expect(routeQuestion('Is our pricing and GDPR consent ok before launch?').stakes).toEqual(expect.arrayContaining(['money', 'legal', 'release']));
  });
  it('never picks the orchestrator and respects unknown agents', () => {
    const p = routeQuestion('design system tokens and dark mode', (s) => s !== 'design-systems-lead');
    expect(p.experts.map((e) => e.slug)).not.toContain('design-systems-lead');
    expect(p.experts.map((e) => e.slug)).not.toContain('orchestrator');
  });
});

describe('history budget', () => {
  it('keeps the newest messages within the limit and starts with a user turn', () => {
    const msgs = Array.from({ length: 10 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'x'.repeat(900) }));
    msgs.push({ role: 'user', content: 'latest question' });
    const out = fitHistory(msgs, 3_200, 2_400);
    expect(out[out.length - 1].content).toBe('latest question');
    expect(out[0].role).toBe('user');
    expect(out.reduce((n, m) => n + m.content.length, 0)).toBeLessThanOrEqual(3_200 + 2_400);
  });
  it('truncates an oversized latest message', () => {
    expect(fitHistory([{ role: 'user', content: 'y'.repeat(9_000) }], 3_200, 2_400)[0].content.length).toBe(2_400);
  });
});

describe('explicit angles', () => {
  it('always includes the expert for an angle the visitor names', () => {
    const p = routeQuestion('Native app vs PWA for a habit tracker? Give me the product, engineering and privacy angles.');
    expect(p.experts.map((e) => e.slug)).toContain('privacy-compliance');
    expect(p.experts.length).toBeLessThanOrEqual(3);
  });
});

describe('keyword matching', () => {
  const slugs = (q: string) => routeQuestion(q).experts.map((e) => e.slug);
  it('matches whole short words, not letters inside other words', () => {
    expect(slugs('Build a quick guide for new staff')).not.toContain('ui-designer');
    expect(slugs('Help me decide between two offers')).not.toContain('devops-engineer');
    expect(slugs('Where should we keep file storage?')).not.toContain('ai-engineer');
    expect(slugs('Make the context window more specific')).not.toContain('prompt-engineer');
  });
  it('still matches plurals, word starts and the intended short words', () => {
    expect(slugs('Which UI should we use for the dashboard?')).toContain('ui-designer');
    expect(slugs('Set up CI for the repo and deploy it')).toContain('devops-engineer');
    expect(slugs('How do we scale this to many users?')).toContain('software-architect');
    expect(slugs('How should we add RAG with embeddings?')).toContain('ai-engineer');
    expect(slugs('Which APIs do we need for authentication?')).toContain('backend-engineer');
  });
  it('flags stakes only for the real words', () => {
    expect(routeQuestion('How should the display look on a phone?').stakes).not.toContain('money');
    expect(routeQuestion('Map the relationship between pages').stakes).not.toContain('release');
    expect(routeQuestion('Who is the author of this guide?').stakes).not.toContain('security');
    expect(routeQuestion('Should we ship it and how will users pay?').stakes).toEqual(expect.arrayContaining(['money', 'release']));
    expect(routeQuestion('Is our payment and authentication flow ok?').stakes).toEqual(expect.arrayContaining(['money', 'security']));
  });
});
