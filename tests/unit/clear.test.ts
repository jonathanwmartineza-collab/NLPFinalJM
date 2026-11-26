import { describe, it, expect, vi } from 'vitest';
vi.mock('../../web/src/lib/cleanup', () => ({ freeUpSpace: async () => 0, formatBytes: () => '' }));
import { clearWithUndo } from '../../web/src/components/ClearOptions';

// A chat as the page holds it: what is on screen and what is saved in the browser.
function fakeChat<T>(start: T) {
  const state = { screen: start, saved: start, saves: 0 };
  const apply = (v: T) => { state.screen = v; state.saved = v; state.saves++; };
  return { state, apply };
}

describe('Clear with Undo', () => {
  it('one press empties the chat on screen and in saved history', () => {
    const msgs = [{ role: 'user', content: 'Plan a bakery launch' }, { role: 'assistant', content: 'Here is a plan…' }];
    const { state, apply } = fakeChat(msgs);
    clearWithUndo(msgs, [], apply);
    expect(state.screen).toEqual([]);
    expect(state.saved).toEqual([]);
  });

  it('Undo puts back the whole conversation and saves it again', () => {
    const msgs = Array.from({ length: 40 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `message ${i}` }));
    const { state, apply } = fakeChat(msgs);
    const undo = clearWithUndo(msgs, [], apply);
    undo();
    expect(state.screen).toBe(msgs);
    expect(state.saved).toBe(msgs);
    expect(state.saved).toHaveLength(40);
  });

  it('Undo works once: a second press changes nothing', () => {
    const { state, apply } = fakeChat(['a']);
    const undo = clearWithUndo(['a'], [] as string[], apply);
    undo(); apply(['a', 'b']); undo();
    expect(state.saved).toEqual(['a', 'b']);
  });
});
