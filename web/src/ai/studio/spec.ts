// One-shot Studio content schema. The model fills this small JSON object; code renders the page.
import { z } from 'zod';

export const KINDS = ['features', 'cards', 'pricing', 'steps', 'stats', 'faq', 'schedule', 'gallery', 'quote', 'about', 'contact', 'cta'] as const;
export const PALETTES = ['ember', 'ocean', 'forest', 'plum', 'slate', 'rose'] as const;
export type Kind = (typeof KINDS)[number];

const str = (max: number, def = '') => z.preprocess((v) => (v == null ? def : typeof v === 'string' ? v : typeof v === 'number' ? String(v) : def), z.string().transform((s) => s.trim().slice(0, max)));
const Item = z.object({ title: str(80), text: str(280), meta: str(40) }).catch({ title: '', text: '', meta: '' });
const Section = z.object({
  kind: z.preprocess((v) => (typeof v === 'string' ? v.toLowerCase().trim() : v), z.enum(KINDS)).catch('features'),
  heading: str(80),
  intro: str(240),
  items: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(Item)).transform((a) => a.filter((i) => i.title || i.text).slice(0, 8)),
}).catch({ kind: 'features', heading: '', intro: '', items: [] });

export const SpecSchema = z.object({
  title: str(80, 'My page'),
  tagline: str(200),
  palette: z.preprocess((v) => (typeof v === 'string' ? v.toLowerCase().trim() : v), z.enum(PALETTES)).catch('ember'),
  cta: str(40, 'Get started'),
  sections: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(Section)).transform((a) => a.filter((s) => s.heading || s.items.length || s.kind === 'contact').slice(0, 8)),
});
export type Spec = z.infer<typeof SpecSchema>;

/**
 * The same shape as a JSON Schema string, for WebLLM's grammar-constrained JSON mode. WebLLM 0.2.89 fails to start
 * JSON mode without a schema ("GrammarMatcherInitError: Cannot pass non-string to std::string") on every model.
 */
const S = { type: 'string' };
export const SPEC_JSON_SCHEMA = JSON.stringify({
  type: 'object',
  properties: {
    title: S, tagline: S, palette: { type: 'string', enum: PALETTES }, cta: S,
    sections: { type: 'array', items: { type: 'object', properties: {
      kind: { type: 'string', enum: KINDS }, heading: S, intro: S,
      items: { type: 'array', items: { type: 'object', properties: { title: S, text: S, meta: S }, required: ['title', 'text', 'meta'] } },
    }, required: ['kind', 'heading', 'intro', 'items'] } },
  },
  required: ['title', 'tagline', 'palette', 'cta', 'sections'],
});

/** Find the first balanced {...} in a model reply (tolerates fences and chatter). */
export function extractObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return text.slice(start, i + 1);
  }
  // Truncated: close what is open (best effort).
  let s = text.slice(start).replace(/,\s*$/, '');
  if (inStr) s += '"';
  const opens = [...s].reduce((a, c) => (c === '{' || c === '[' ? [...a, c] : c === '}' || c === ']' ? a.slice(0, -1) : a), [] as string[]);
  return s + opens.reverse().map((c) => (c === '{' ? '}' : ']')).join('');
}

/** Parse, repair and validate a model reply. Returns null when nothing usable came back. */
export function parseSpec(text: string): Spec | null {
  const raw = extractObject(text);
  if (!raw) return null;
  for (const candidate of [raw, raw.replace(/,\s*([}\]])/g, '$1')]) {
    try {
      const spec = SpecSchema.parse(JSON.parse(candidate));
      if (spec.sections.length || spec.tagline) return spec;
    } catch { /* try the next repair */ }
  }
  return null;
}

/** A sensible page when the model's answer can't be used. */
export function fallbackSpec(brief: string): Spec {
  const clean = brief.replace(/\s+/g, ' ').trim();
  const first = clean.split(/[.!?:\n]/)[0].slice(0, 60) || 'My page';
  return SpecSchema.parse({
    title: first.replace(/^(a|an|the)\s+/i, '').replace(/^\w/, (c) => c.toUpperCase()),
    tagline: clean.slice(0, 180),
    palette: 'ember', cta: 'Get in touch',
    sections: [
      { kind: 'features', heading: 'What you get', items: [
        { title: 'Made for you', text: 'Describe the main benefit here in one or two sentences.' },
        { title: 'Simple to start', text: 'Explain how easy it is to begin.' },
        { title: 'Here when you need us', text: 'Say how people get help.' },
      ] },
      { kind: 'steps', heading: 'How it works', items: [
        { title: 'Tell us what you need', text: 'A short first step.' },
        { title: 'We get to work', text: 'What happens next.' },
        { title: 'Enjoy the result', text: 'The outcome people care about.' },
      ] },
      { kind: 'faq', heading: 'Questions', items: [{ title: 'How much does it cost?', text: 'Add your pricing answer here.' }, { title: 'How do I start?', text: 'Use the contact form below.' }] },
      { kind: 'contact', heading: 'Get in touch', intro: 'Send a message and we will reply soon.', items: [] },
    ],
  });
}
