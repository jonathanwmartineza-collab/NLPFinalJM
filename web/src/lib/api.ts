// BrainyApp2 has no server AI. This keeps the original streamModel() interface, but every mode runs on the
// visitor's device through the local engine (web/src/ai/engine.ts).
import type { Plan } from './types';
import { chat, EngineError, type ChatMessage } from '../ai/engine';
import { BUDGET } from '../ai/models';
import { system, getAgent, fitHistory, withContext, EXPERT_TASK, REVIEW_TASK, SYNTH_TASK } from '../ai/prompts';
import { routeQuestion } from '../ai/router';
import { detectInjection, injectionNote } from '../ai/safety';
import { LeakGuard, redactLeaks } from '../ai/leakguard';

export class ApiError extends Error {
  constructor(public code: string, message: string, public resetAt?: string) { super(message); }
}
export type StreamResult = { text: string; stop: string; complete: boolean; plan?: Plan; runToken?: string; model?: string };
type Contribution = { slug: string; text: string };
/** context: earlier team-chat turns from teamContext() (team modes); previous: earlier questions (routing). */
export type LocalRequest =
  | { mode: 'chat'; slug: string; messages: { role: 'user' | 'assistant'; content: string }[] }
  | { mode: 'route'; question: string; previous?: string }
  | { mode: 'expert'; slug: string; question: string; subQuestion: string; context?: string; runToken?: string }
  | { mode: 'review' | 'synth'; question: string; contributions: Contribution[]; context?: string; runToken?: string };

const joinContrib = (cs: Contribution[], each: number) =>
  cs.map((c) => `## ${getAgent(c.slug)?.name ?? c.slug} (${getAgent(c.slug)?.title ?? 'expert'})\n${c.text.slice(0, each)}`).join('\n\n');

/** Appends the takeover reminder to the newest visitor message when the visitor's own words try to change the expert's role. */
function guardLast(messages: ChatMessage[], slug: string, visitorText?: string) {
  const last = messages[messages.length - 1];
  const a = getAgent(slug);
  if (a && last?.role === 'user' && detectInjection(visitorText ?? last.content)) messages[messages.length - 1] = { ...last, content: last.content + injectionNote(a.name, a.title) };
}

/** The messages and answer length for one request (pure: no model call). Exported for unit tests. */
export function buildMessages(body: Exclude<LocalRequest, { mode: 'route' }>): { messages: ChatMessage[]; maxTokens: number } {
  let messages: ChatMessage[];
  switch (body.mode) {
    case 'chat': {
      if (!getAgent(body.slug)) throw new ApiError('bad_agent', 'Unknown expert.');
      messages = [{ role: 'system', content: system(body.slug).slice(0, BUDGET.systemChars) }, ...fitHistory(body.messages, BUDGET.historyChars, BUDGET.inputChars)];
      guardLast(messages, body.slug);
      return { messages, maxTokens: BUDGET.maxTokens };
    }
    case 'expert': {
      const q = body.question.slice(0, BUDGET.inputChars);
      messages = [{ role: 'system', content: system(body.slug, EXPERT_TASK).slice(0, BUDGET.systemChars) }, { role: 'user', content: withContext(q, body.context) }];
      // Only the new question is checked for a takeover: earlier turns are context, not the visitor's new request.
      guardLast(messages, body.slug, q);
      return { messages, maxTokens: 300 };
    }
    case 'review':
      messages = [{ role: 'system', content: system('red-team-reviewer', REVIEW_TASK).slice(0, BUDGET.systemChars) }, { role: 'user', content: `${withContext(`Question:\n${body.question.slice(0, 800)}`, body.context)}\n\nExpert answers:\n${joinContrib(body.contributions, 700)}` }];
      return { messages, maxTokens: 220 };
    case 'synth':
      messages = [{ role: 'system', content: system('orchestrator', SYNTH_TASK).slice(0, BUDGET.systemChars) }, { role: 'user', content: `${withContext(`Visitor's question:\n${body.question.slice(0, 800)}`, body.context)}\n\nInputs:\n${joinContrib(body.contributions, Math.floor(3_000 / Math.max(1, body.contributions.length)))}` }];
      return { messages, maxTokens: 600 };
  }
}

export async function streamModel(body: LocalRequest, onText: (t: string) => void, signal?: AbortSignal): Promise<StreamResult> {
  if (body.mode === 'route') {
    const plan = routeQuestion(body.question, (s) => !!getAgent(s), 3, body.previous ?? '');
    return { text: '', stop: 'end', complete: true, plan, runToken: 'local' };
  }
  const { messages, maxTokens } = buildMessages(body);
  // Every chat answer (expert, team, review, synthesis) passes the prompt-leak guard while it streams, so what is
  // shown, saved and passed to the next team step never contains a verbatim copy of a system prompt.
  const guard = new LeakGuard();
  let shown = '';
  const emit = (t: string) => { if (t) { shown += t; onText(t); } };
  try {
    const r = await chat(messages, { maxTokens }, (t) => emit(guard.push(t)), signal);
    // 'repeat': the repetition guard stopped a looping answer (r.text is already trimmed to before the loop).
    const stop = r.finish === 'aborted' ? 'aborted' : r.finish === 'length' ? 'max_tokens' : r.finish === 'repeat' ? 'repeat' : 'end_turn';
    emit(guard.end());
    const text = stop === 'repeat' ? redactLeaks(r.text) : shown;
    return { text, stop, complete: stop === 'end_turn' };
  } catch (e) {
    if (e instanceof EngineError) throw new ApiError(e.code, e.message);
    throw e;
  }
}
