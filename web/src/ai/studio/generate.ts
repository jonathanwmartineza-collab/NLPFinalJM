// Studio pipeline: brief → model fills JSON → repair/validate → fallback → render. Refine edits the JSON.
import { chat, EngineError, jsonSupported, type ChatMessage } from '../engine';
import { BUDGET } from '../models';
import { SPEC_TASK, REFINE_TASK, STUDIO_NAME } from '../prompts';
import { parseSpec, fallbackSpec, SPEC_JSON_SCHEMA, type Spec } from './spec';
import { renderPage } from './render';

// JSON mode (grammar-constrained by SPEC_JSON_SCHEMA) is preferred; if the engine rejects it, retry as plain text:
// parseSpec() repairs JSON from free text.
let jsonMode = true;
async function fill(messages: ChatMessage[], maxTokens: number, temperature: number, onText: (t: string) => void, signal?: AbortSignal) {
  if (jsonMode && jsonSupported()) {
    try { return await chat(messages, { maxTokens, temperature, json: SPEC_JSON_SCHEMA }, onText, signal); }
    catch (e) {
      if (!(e instanceof EngineError) || e.code !== 'other' || signal?.aborted) throw e;
      console.warn('[BrainyApp2] JSON mode failed; using plain text from now on.');
      jsonMode = false;
    }
  }
  return chat(messages, { maxTokens, temperature }, onText, signal);
}

const sameSpec = (a: Spec, b: Spec) => JSON.stringify(a) === JSON.stringify(b);
/** A page with no filled section besides contact (real test: Lite returned only a contact section) is not usable. */
export const thinSpec = (s: Spec) => s.sections.filter((x) => x.kind !== 'contact' && x.items.length).length === 0;

export type BuildResult = { spec: Spec; html: string; usedFallback: boolean };

export async function buildFromBrief(brief: string, onText: (t: string) => void, signal?: AbortSignal): Promise<BuildResult> {
  let spec: Spec | null = null;
  for (let attempt = 0; attempt < 2 && !spec && !signal?.aborted; attempt++) {
    const r = await fill([{ role: 'system', content: SPEC_TASK }, { role: 'user', content: `Brief: ${brief.slice(0, BUDGET.inputChars)}` }], 1_100, 0.5, onText, signal);
    spec = parseSpec(r.text);
    if (spec && thinSpec(spec)) spec = null;
  }
  if (signal?.aborted) throw new EngineError('aborted', 'Stopped.');
  const usedFallback = !spec;
  const final = spec ?? fallbackSpec(brief);
  return { spec: final, html: renderPage(final, STUDIO_NAME), usedFallback };
}

export async function refineSpec(spec: Spec, change: string, onText: (t: string) => void, signal?: AbortSignal): Promise<BuildResult> {
  const r = await fill([{ role: 'system', content: REFINE_TASK }, { role: 'user', content: `Change request: ${change.slice(0, 600)}\n\nCurrent JSON:\n${JSON.stringify(spec)}` }], 1_200, 0.4, onText, signal);
  if (signal?.aborted) throw new EngineError('aborted', 'Stopped.');
  const next = parseSpec(r.text);
  if (!next) throw new EngineError('refine', 'The AI could not apply that change, so this version was kept. Try a shorter, more specific request.');
  // A real-model test said "Version 2 ready" for a byte-identical page: never report an edit that changed nothing.
  if (sameSpec(next, spec)) throw new EngineError('noop', 'The AI returned the page unchanged, so no new version was made. Try rewording the change, for example “Add a pricing section with 4 repairs and their prices”.');
  return { spec: next, html: renderPage(next, STUDIO_NAME), usedFallback: false };
}

/** A Claude Code prompt for building the idea as a real project. No model needed. */
export function claudeCodePrompt(brief: string, spec?: Spec | null): string {
  const sections = spec?.sections.map((s) => `- ${s.heading || s.kind}${s.items.length ? `: ${s.items.map((i) => i.title).filter(Boolean).join(', ')}` : ''}`).join('\n');
  return `ROLE: You are a senior product team (strategy, UX/UI, front-end, QA). Plan first, then build.

GOAL: Build this as a complete, production-quality project:
${brief.trim()}
${spec ? `\nCONTENT PLAN (draft, improve it):\nTitle: ${spec.title}\nTagline: ${spec.tagline}\nSections:\n${sections}\n` : ''}
AUDIENCE: Infer the primary users from the goal and write them down before you start.

FEATURES & CONTENT: Realistic, specific content (no lorem ipsum). Every state designed: empty, loading, error, success.

DESIGN DIRECTION: Distinctive and calm; one accent colour; clear type scale; light and dark themes; responsive from 360 px.

TECH CONSTRAINTS: Choose a simple, proven stack and explain why. Static hosting (for example Netlify) unless a server is truly needed. Secrets only in environment variables.

ACCESSIBILITY & PERFORMANCE: WCAG 2.2 AA (keyboard, focus, labels, contrast 4.5:1, reduced motion). Lighthouse 90+ on every category.

DELIVERABLE: A working repository with README (setup, run, deploy), tests for the main flows, and a short list of decisions.

SELF-CHECK BEFORE RETURNING: Run the tests and the build; list anything you could not run as NOT RUN; re-read the goal and confirm each requirement is met.`;
}
