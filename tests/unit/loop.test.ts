import { describe, it, expect, vi } from 'vitest';
vi.mock('@mlc-ai/web-llm', () => ({}));
import { loopCut, stripThink } from '../../web/src/ai/engine';

describe('repetition guard (backstop for looping answers)', () => {
  it('cuts a word loop and keeps one copy', () => {
    const t = 'Use a strict CSP and encode output explicitly' + ' explicitly'.repeat(6);
    const cut = loopCut(t);
    expect(cut).toBeGreaterThan(0);
    expect(t.slice(0, cut)).toMatch(/output explicitly/);
    expect(t.slice(0, cut).match(/explicitly/g)!.length).toBeLessThanOrEqual(4);
  });
  it('cuts a repeated paragraph', () => {
    const p = 'Ask explicitly and drive the answer with confidence interval rules.\n\n';
    const t = 'The relative lift is 50%.\n\n' + p.repeat(4);
    const cut = loopCut(t);
    expect(cut).toBeGreaterThan(0);
    expect(t.slice(0, cut)).toContain('50%');
  });
  it('leaves normal answers, tables and code alone', () => {
    const normal = `**Stored XSS** is saved on the server and served to every visitor. **Reflected XSS** bounces off a request.\n\n| Type | Where |\n|---|---|\n| Stored | Database |\n| Reflected | URL |\n\n\`\`\`ts\nfor (let i = 0; i < 3; i++) {\n  console.log(i);\n}\n\`\`\`\n- One\n- Two\n- Three`;
    expect(loopCut(normal)).toBe(-1);
    expect(loopCut('ok ok')).toBe(-1);
    expect(loopCut('|---|---|---|---|')).toBe(-1);
  });
});
describe('repetition guard edge cases', () => {
  it('ignores long markdown table rules', () => { expect(loopCut('| a | b | c | d | e | f |\n|---|---|---|---|---|---|---|---|---|---|---|')).toBe(-1); });
});

describe('stripThink', () => {
  it('hides an empty or full think block and keeps the answer', () => {
    expect(stripThink('<think>\n\n</think>\n\nOK')).toBe('OK');
    expect(stripThink('<think>plan</think>Hi')).toBe('Hi');
    expect(stripThink('<thi')).toBe('');
    expect(stripThink('<think>\n\n')).toBe('');
    expect(stripThink('Hello <think> is a tag')).toBe('Hello <think> is a tag');
  });
});
