import { describe, it, expect } from 'vitest';
import { createDictation, sessionText } from '../../web/src/lib/voice';

// A result list as Chrome sends it: each result has its best guess at [0] and an isFinal flag.
const list = (...rs: [string, boolean][]) => rs.map(([transcript, isFinal]) => Object.assign([{ transcript }], { isFinal }));

// The events recorded in Chrome 158 on a Mac for "red green blue", with interimResults set to false.
const RECORDED = [
  list(['Red', false]), list(['Red green', false]), list(['Red green blue', false]),
  list(['Red green blue', false]), list(['Red green blue', false]), list(['Red green blue', true]),
];

class FakeRecognizer {
  static all: FakeRecognizer[] = [];
  lang = ''; interimResults = true; continuous = true; started = false; stopped = false; aborted = false;
  onresult: any; onend: any; onerror: any;
  constructor() { FakeRecognizer.all.push(this); }
  start() { this.started = true; }
  stop() { this.stopped = true; }
  abort() { this.aborted = true; }
  say(events: any[]) { for (const results of events) this.onresult({ resultIndex: 0, results }); }
}

function setup() {
  FakeRecognizer.all = [];
  const texts: string[] = []; const states: boolean[] = [];
  const d = createDictation(FakeRecognizer, (t) => texts.push(t), (on) => states.push(on));
  return { d, texts, states, rec: () => FakeRecognizer.all[FakeRecognizer.all.length - 1] };
}

describe('voice input', () => {
  it('reads the latest result list instead of adding events up', () => {
    expect(sessionText(RECORDED[0])).toBe('Red');
    expect(sessionText(list(['Hello there', true], [' and more', false]))).toBe('Hello there and more');
    expect(sessionText([])).toBe('');
  });

  it('turns the recorded Chrome events into the three words once', () => {
    const { d, texts, states, rec } = setup();
    d.toggle();
    expect(rec().interimResults).toBe(false);
    rec().say(RECORDED); rec().onend();
    expect(texts).toEqual(['Red green blue']);
    expect(states).toEqual([true, false]);
  });

  it('hands the text over once when an error is followed by end', () => {
    const { d, texts, rec } = setup();
    d.toggle(); rec().say(RECORDED.slice(0, 3)); rec().onerror({ error: 'network' }); rec().onend();
    expect(texts).toEqual(['Red green blue']);
  });

  it('stopping and starting again adds only the new words', () => {
    const { d, texts, rec } = setup();
    d.toggle(); const first = rec(); first.say(RECORDED);
    d.toggle(); expect(first.stopped).toBe(true); first.onend();
    d.toggle(); const second = rec(); expect(second).not.toBe(first);
    second.say([list(['Yellow', false]), list(['Yellow', true])]); second.onend();
    first.say(RECORDED); first.onend(); // a late event from the old session changes nothing
    expect(texts).toEqual(['Red green blue', 'Yellow']);
  });

  it('adds nothing when nothing was heard, or when the page is left mid-sentence', () => {
    const { d, texts, rec } = setup();
    d.toggle(); rec().onerror({ error: 'no-speech' }); rec().onend();
    d.toggle(); rec().say(RECORDED.slice(0, 2)); d.dispose(); rec().onend();
    expect(rec().aborted).toBe(true);
    expect(texts).toEqual([]);
  });
});

describe('dictation language', () => {
  const withLang = (lang: string) => {
    const orig = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    Object.defineProperty(globalThis, 'navigator', { value: { language: lang }, configurable: true });
    try { const { d, rec } = setup(); d.toggle(); return rec().lang; }
    finally { if (orig) Object.defineProperty(globalThis, 'navigator', orig); else delete (globalThis as any).navigator; }
  };
  it('keeps an English browser language and falls back to US English otherwise', () => {
    expect(withLang('en-GB')).toBe('en-GB');
    expect(withLang('es-US')).toBe('en-US');
    expect(withLang('')).toBe('en-US');
  });
});
