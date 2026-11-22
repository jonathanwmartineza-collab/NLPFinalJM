// Studio pipeline: brief → model fills JSON → repair/validate → fallback → render. Refine edits the JSON.
import { chat, EngineError } from '../engine';
import { BUDGET } from '../models';
import { SPEC_TASK, REFINE_TASK, STUDIO_NAME } from '../prompts';
import { parseSpec, fallbackSpec, type Spec } from './spec';
import { renderPage } from './render';

export type BuildResult = { spec: Spec; html: string; usedFallback: boolean };

export async function buildFromBrief(brief: string, onText: (t: string) => void, signal?: AbortSignal): Promise<BuildResult> {
  let spec: Spec | null = null;
  for (let attempt = 0; attempt < 2 && !spec && !signal?.aborted; attempt++) {
    const r = await chat([{ role: 'system', content: SPEC_TASK }, { role: 'user', content: `Brief: ${brief.slice(0, BUDGET.inputChars)}` }], { maxTokens: 1_100, temperature: 0.5, json: true }, onText, signal);
    spec = parseSpec(r.text);
  }
  if (signal?.aborted) throw new EngineError('aborted', 'Stopped.');
  const usedFallback = !spec;
  const final = spec ?? fallbackSpec(brief);
  return { spec: final, html: renderPage(final, STUDIO_NAME), usedFallback };
}

export async function refineSpec(spec: Spec, change: string, onText: (t: string) => void, signal?: AbortSignal): Promise<BuildResult> {
  const r = await chat([{ role: 'system', content: REFINE_TASK }, { role: 'user', content: `Change request: ${change.slice(0, 600)}\n\nCurrent JSON:\n${JSON.stringify(spec)}` }], { maxTokens: 1_200, temperature: 0.4, json: true }, onText, signal);
  if (signal?.aborted) throw new EngineError('aborted', 'Stopped.');
  const next = parseSpec(r.text);
  if (!next) throw new EngineError('refine', 'The AI could not apply that change. Try a shorter, more specific request.');
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
