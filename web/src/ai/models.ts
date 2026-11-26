// Model tiers. IDs are copied from @mlc-ai/web-llm 0.2.89 prebuiltAppConfig.model_list
// (tests/unit/models.test.ts fails if one is missing). Permissive licences only.
export type TierId = 'lite' | 'quality';
export type ModelTier = {
  id: TierId; label: string; blurb: string; sizeGb: number; minMemGb: number;
  f16: string; f32: string; licence: string; licenceUrl: string; attribution?: string; source: string;
  /** Grammar-constrained JSON (Studio). Off where WebLLM's JSON mode fails for the model. */
  json: boolean;
  /** Engine options passed to WebLLM when loading (for example a chat-template fix). */
  chatOpts?: Record<string, unknown>;
  /** Extra request fields sent with every answer (for example turning off a model's thinking mode). */
  request?: Record<string, unknown>;
};

export const TIERS: ModelTier[] = [
  {
    id: 'lite', label: 'Lite', blurb: 'For phones and laptops with less memory. Smallest download and fastest, but simple answers: check facts and maths.',
    sizeGb: 0.9, minMemGb: 4,
    f16: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', f32: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    licence: 'Llama 3.2 Community Licence', licenceUrl: 'https://www.llama.com/llama3_2/license/', attribution: 'Built with Llama',
    source: 'https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC', json: true,
  },
  {
    id: 'quality', label: 'Quality', blurb: 'Recommended. The best answers on your device, for laptops with 8 GB of memory or more.',
    sizeGb: 3.4, minMemGb: 8,
    f16: 'Qwen3-4B-q4f16_1-MLC', f32: 'Qwen3-4B-q4f32_1-MLC',
    licence: 'Apache-2.0', licenceUrl: 'https://huggingface.co/Qwen/Qwen3-4B/blob/main/LICENSE',
    source: 'https://huggingface.co/mlc-ai/Qwen3-4B-q4f16_1-MLC', json: true,
    // Replaced Phi-4-mini (Nov 2026): in a real-model test on a Mac, Phi-4-mini still ran to the token limit on 3 of
    // 10 prompts with a corrected chat template; Qwen3-4B ended all 14 (chat and Studio JSON) in 6 to 31 s. Thinking
    // mode is off: it would spend the 4,096-token context on hidden reasoning (engine.ts hides the empty think tags).
    request: { extra_body: { enable_thinking: false } },
  },
];

export const tierById = (id: string) => TIERS.find((t) => t.id === id);
export const modelIdFor = (t: ModelTier, f16: boolean) => (f16 ? t.f16 : t.f32);
export const ALL_MODEL_IDS = TIERS.flatMap((t) => [t.f16, t.f32]);

/** Pick a tier from the device: memory (GB, if the browser tells us) and whether it is a phone-class device. */
export function recommendTier(memGb: number | undefined, mobile: boolean): TierId {
  // Two tiers since Nov 2026: Balanced (Qwen2.5-1.5B) was removed after real-model tests (it missed the emergency
  // instruction, invented studies and got simple maths wrong). Chrome reports at most 8 GB; Safari and Firefox report
  // nothing, so desktops without a figure get Quality, with "Use the Lite model instead" if memory runs out.
  if (mobile) return 'lite';
  if (memGb === undefined || memGb >= 8) return 'quality';
  return 'lite';
}

// Context budget. Every tier runs with WebLLM's 4,096-token context window (≈ 4 characters per token in English).
// systemChars holds safety rule + persona + rules + task; inputChars is the longest message the model reads in full.
// The chat box uses inputChars too, so nothing is ever cut silently (tested in build-team.test.ts).
export const CONTEXT_TOKENS = 4_096;
export const BUDGET = { systemChars: 2_800, historyChars: 2_000, inputChars: 4_000, maxTokens: 700 } as const;
