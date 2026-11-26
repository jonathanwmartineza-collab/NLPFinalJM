// The live NLTK client (web/src/nlp/client.ts) with a fake Web Worker: loading, failures, timeouts and retries.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runNltk, startNltk, TIMEOUTS, _test } from '../../web/src/nlp/client';
import { friendlyError } from '../../web/src/nlp/boot';

type Msg = { id: number; fn: string; args?: unknown };
type Behaviour = (w: FakeWorker, m: Msg) => void;
const workers: FakeWorker[] = [];
let behaviour: Behaviour;

class FakeWorker {
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onerror: ((e: { message?: string }) => void) | null = null;
  posted: Msg[] = [];
  terminated = false;
  constructor() { workers.push(this); }
  postMessage(m: Msg) { this.posted.push(m); behaviour(this, m); }
  terminate() { this.terminated = true; }
  reply(data: unknown) { queueMicrotask(() => this.onmessage?.({ data })); }
}
const answerAll: Behaviour = (w, m) => w.reply({ id: m.id, ok: true, result: m.fn === 'boot' ? null : { fn: m.fn, args: m.args }, ms: 1 });
const saved = { ...TIMEOUTS };

beforeEach(() => {
  workers.length = 0;
  behaviour = answerAll;
  (globalThis as any).Worker = FakeWorker;
  _test.reset();
});
afterEach(() => { vi.useRealTimers(); Object.assign(TIMEOUTS, saved); });

describe('live NLTK client', () => {
  it('loads once, then runs calls and returns their results', async () => {
    const r = await runNltk('coach', { text: 'hi' });
    expect(r.result).toEqual({ fn: 'coach', args: { text: 'hi' } });
    await runNltk('analyze', { text: 'x' });
    expect(workers).toHaveLength(1);
    expect(workers[0].posted.map((m) => m.fn)).toEqual(['boot', 'coach', 'analyze']);
    expect(_test.state().status).toBe('ready');
  });

  it('two quick clicks share one load (no double boot)', async () => {
    await Promise.all([startNltk(), startNltk(), runNltk('coach', { text: 'a' })]);
    expect(workers[0].posted.filter((m) => m.fn === 'boot')).toHaveLength(1);
  });

  it('a failed download shows the error, and Try again starts a fresh worker', async () => {
    behaviour = (w, m) => w.reply({ id: m.id, ok: false, error: 'Failed to fetch dynamically imported module' });
    await expect(startNltk()).rejects.toThrow(/Failed to fetch/);
    expect(_test.state()).toMatchObject({ status: 'error', error: expect.stringMatching(/Failed to fetch/) });
    expect(workers[0].terminated).toBe(true);
    behaviour = answerAll;
    await startNltk();
    expect(workers).toHaveLength(2);
    expect(_test.state().status).toBe('ready');
  });

  it('a worker that dies (for example offline) fails the waiting call instead of spinning for ever', async () => {
    behaviour = (w) => queueMicrotask(() => w.onerror?.({}));
    await expect(runNltk('coach', { text: 'a' })).rejects.toThrow(/failed to start/);
    expect(_test.state().status).toBe('error');
    behaviour = answerAll;
    await runNltk('coach', { text: 'a' });
    expect(workers).toHaveLength(2);
  });

  it('a call that never answers is stopped after the timeout and the next call reloads NLTK', async () => {
    vi.useFakeTimers();
    TIMEOUTS.callMs = 1000;
    behaviour = (w, m) => { if (m.fn === 'boot') answerAll(w, m); };
    const p = runNltk('analyze', { text: 'huge' });
    const done = expect(p).rejects.toThrow(/more than 1 seconds.*shorter text/);
    await vi.advanceTimersByTimeAsync(1001);
    await done;
    expect(workers[0].terminated).toBe(true);
    expect(_test.state().status).toBe('idle');
    behaviour = answerAll;
    vi.useRealTimers();
    await runNltk('analyze', { text: 'short' });
    expect(workers).toHaveLength(2);
  });

  it('a load that stalls is stopped with a clear message', async () => {
    vi.useFakeTimers();
    TIMEOUTS.bootMs = 2000;
    behaviour = () => {};
    const done = expect(startNltk()).rejects.toThrow(/Loading Python and NLTK took more than 2 seconds/);
    await vi.advanceTimersByTimeAsync(2001);
    await done;
    expect(_test.state().status).toBe('error');
  });

  it('a late answer from a stopped worker is ignored', async () => {
    vi.useFakeTimers();
    TIMEOUTS.callMs = 500;
    let late: (() => void) | undefined;
    behaviour = (w, m) => { if (m.fn === 'boot') answerAll(w, m); else late = () => w.onmessage?.({ data: { id: m.id, ok: true, result: 'old', ms: 1 } }); };
    const done = expect(runNltk('coach', { text: 'a' })).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(501);
    await done;
    vi.useRealTimers();
    behaviour = answerAll;
    const fresh = runNltk('coach', { text: 'b' });
    late?.();
    expect((await fresh).result).toEqual({ fn: 'coach', args: { text: 'b' } });
  });
});

describe('friendlyError', () => {
  it('shows only the last line of a Python traceback', () => {
    const tb = 'PythonError: Traceback (most recent call last):\n  File "x", line 1\nTypeError: expected string';
    expect(friendlyError('coach', new Error(tb))).toBe('NLTK could not process this text (TypeError: expected string).');
  });
  it('says what to check when Python cannot be downloaded', () => {
    expect(friendlyError('boot', new Error('Failed to fetch dynamically imported module: https://cdn'))).toMatch(/connection or content blocker/);
  });
});
