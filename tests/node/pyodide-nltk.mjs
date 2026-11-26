// Runs the browser's NLTK code path (web/src/nlp/boot.ts + web/public/nlp/*) in Node with Pyodide.
// Usage: PYODIDE_INDEX=/path/to/pyodide/ node tests/node/pyodide-nltk.mjs   (default: jsDelivr CDN)
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { loadPyodide } from 'pyodide';
import { boot, PYODIDE_CDN } from '../../web/src/nlp/boot.ts';

const root = path.resolve(import.meta.dirname, '../..');
const pub = (p) => path.join(root, 'web/public', p);
const t0 = Date.now();
const call = await boot({
  loadPyodide, indexURL: process.env.PYODIDE_INDEX ?? PYODIDE_CDN,
  text: async (p) => fs.readFileSync(pub(p), 'utf8'),
  bytes: async (p) => { const b = fs.readFileSync(pub(p)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength); },
  progress: (s) => console.log('  ...', s),
});
console.log(`boot ${Date.now() - t0} ms`);
const t1 = Date.now();
const a = call('analyze', { text: 'I love this team. The second answer was not helpful at all!' });
assert.equal(a.counts.sentences, 2); assert.equal(a.sentences[0].label, 'positive'); assert.equal(a.sentences[1].label, 'negative');
const c = call('coach', { text: 'Can you make my landing page better and add some stuff about accessibility?' });
assert.ok(c.vague.some((v) => v.word === 'better')); assert.ok(c.topics.length > 0); assert.ok(c.experts.length > 0); assert.ok(c.sharper.includes('['));
const m = call('agreement', { answers: [
  { name: 'A', text: 'I recommend a native app. Push notifications matter for habit reminders.' },
  { name: 'B', text: 'I recommend a PWA. Push notifications work on Android and cost less.' }] });
assert.equal(m.pairs[0].verdict, 'disagree');
// Parity with the build (CPython) output for the same sample text.
const nltkJson = JSON.parse(fs.readFileSync(pub('nlp/nltk.json'), 'utf8'));
const live = call('analyze', { text: nltkJson.sample.text });
assert.deepEqual(live.sentiment, nltkJson.sample.sentiment);
assert.deepEqual(live.top_words, nltkJson.sample.top_words);
console.log(`calls ${Date.now() - t1} ms; coach score ${c.score}; topics ${c.topics.join(', ')}; experts ${c.experts.map((e) => e.name).join(', ')}`);
console.log('pyodide-nltk: PASS (Pyodide NLTK matches the CPython build output)');
