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
