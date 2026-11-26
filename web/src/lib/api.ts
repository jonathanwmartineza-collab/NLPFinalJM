// BrainyApp2 has no server AI. This keeps the original streamModel() interface, but every mode runs on the
// visitor's device through the local engine (web/src/ai/engine.ts).
import type { Plan } from './types';
import { chat, EngineError, type ChatMessage } from '../ai/engine';
import { BUDGET } from '../ai/models';
import { system, getAgent, fitHistory, EXPERT_TASK, REVIEW_TASK, SYNTH_TASK } from '../ai/prompts';
import { routeQuestion } from '../ai/router';
import { detectInjection, injectionNote } from '../ai/safety';

export class ApiError extends Error {
  constructor(public code: string, message: string, public resetAt?: string) { super(message); }
}
export type StreamResult = { text: string; stop: string; complete: boolean; plan?: Plan; runToken?: string; model?: string };
type Contribution = { slug: string; text: string };
export type LocalRequest =
  | { mode: 'chat'; slug: string; messages: { role: 'user' | 'assistant'; content: string }[] }
  | { mode: 'route'; question: string }
  | { mode: 'expert'; slug: string; question: string; subQuestion: string; runToken?: string }
  | { mode: 'review' | 'synth'; question: string; contributions: Contribution[]; runToken?: string };

const joinContrib = (cs: Contribution[], each: number) =>
  cs.map((c) => `## ${getAgent(c.slug)?.name ?? c.slug} (${getAgent(c.slug)?.title ?? 'expert'})\n${c.text.slice(0, each)}`).join('\n\n');

/** Appends the takeover reminder to the newest visitor message when it tries to change the expert's role. */
function guardLast(messages: ChatMessage[], slug: string) {
  const last = messages[messages.length - 1];
  const a = getAgent(slug);
  if (a && last?.role === 'user' && detectInjection(last.content)) messages[messages.length - 1] = { ...last, content: last.content + injectionNote(a.name, a.title) };
}

export async function streamModel(body: LocalRequest, onText: (t: string) => void, signal?: AbortSignal): Promise<StreamResult> {
  if (body.mode === 'route') {
    const plan = routeQuestion(body.question, (s) => !!getAgent(s));
    return { text: '', stop: 'end', complete: true, plan, runToken: 'local' };
  }
  let messages: ChatMessage[]; let maxTokens: number;
  switch (body.mode) {
    case 'chat': {
      if (!getAgent(body.slug)) throw new ApiError('bad_agent', 'Unknown expert.');
      messages = [{ role: 'system', content: system(body.slug).slice(0, BUDGET.systemChars) }, ...fitHistory(body.messages, BUDGET.historyChars, BUDGET.inputChars)];
      maxTokens = BUDGET.maxTokens;
      guardLast(messages, body.slug); break;
    }
    case 'expert':
      messages = [{ role: 'system', content: system(body.slug, EXPERT_TASK).slice(0, BUDGET.systemChars) }, { role: 'user', content: body.question.slice(0, BUDGET.inputChars) }];
      maxTokens = 300; guardLast(messages, body.slug); break;
    case 'review':
      messages = [{ role: 'system', content: system('red-team-reviewer', REVIEW_TASK).slice(0, BUDGET.systemChars) }, { role: 'user', content: `Question:\n${body.question.slice(0, 800)}\n\nExpert answers:\n${joinContrib(body.contributions, 700)}` }];
      maxTokens = 220; break;
    case 'synth':
      messages = [{ role: 'system', content: system('orchestrator', SYNTH_TASK).slice(0, BUDGET.systemChars) }, { role: 'user', content: `Visitor's question:\n${body.question.slice(0, 800)}\n\nInputs:\n${joinContrib(body.contributions, Math.floor(3_000 / Math.max(1, body.contributions.length)))}` }];
      maxTokens = 600; break;
  }
  try {
    const r = await chat(messages, { maxTokens }, onText, signal);
    // 'repeat': the repetition guard stopped a looping answer (r.text is already trimmed to before the loop).
    const stop = r.finish === 'aborted' ? 'aborted' : r.finish === 'length' ? 'max_tokens' : r.finish === 'repeat' ? 'repeat' : 'end_turn';
    return { text: r.text, stop, complete: stop === 'end_turn' };
  } catch (e) {
    if (e instanceof EngineError) throw new ApiError(e.code, e.message);
    throw e;
  }
}
