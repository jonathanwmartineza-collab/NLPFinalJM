// Model tiers. IDs are copied from @mlc-ai/web-llm 0.2.89 prebuiltAppConfig.model_list
// (tests/unit/models.test.ts fails if one is missing). Permissive licences only.
export type TierId = 'lite' | 'balanced' | 'quality';
export type ModelTier = {
  id: TierId; label: string; blurb: string; sizeGb: number; minMemGb: number;
  f16: string; f32: string; licence: string; licenceUrl: string; attribution?: string; source: string;
};

export const TIERS: ModelTier[] = [
  {
    id: 'lite', label: 'Lite', blurb: 'Fastest and smallest. Works on most laptops with a recent browser. Shortest, simplest answers.',
    sizeGb: 0.9, minMemGb: 4,
    f16: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', f32: 'Llama-3.2-1B-Instruct-q4f32_1-MLC',
    licence: 'Llama 3.2 Community Licence', licenceUrl: 'https://www.llama.com/llama3_2/license/', attribution: 'Built with Llama',
    source: 'https://huggingface.co/mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC',
  },
  {
    id: 'balanced', label: 'Balanced', blurb: 'Recommended. Better answers, still quick on a typical laptop.',
    sizeGb: 1.6, minMemGb: 8,
    f16: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', f32: 'Qwen2.5-1.5B-Instruct-q4f32_1-MLC',
    licence: 'Apache-2.0', licenceUrl: 'https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct/blob/main/LICENSE',
    source: 'https://huggingface.co/mlc-ai/Qwen2.5-1.5B-Instruct-q4f16_1-MLC',
  },
  {
    id: 'quality', label: 'Quality', blurb: 'Best answers. Needs a strong graphics card and a bigger download.',
    sizeGb: 3.4, minMemGb: 16,
    f16: 'Phi-4-mini-instruct-q4f16_1-MLC', f32: 'Phi-4-mini-instruct-q4f32_1-MLC',
    licence: 'MIT', licenceUrl: 'https://huggingface.co/microsoft/Phi-4-mini-instruct/blob/main/LICENSE',
    source: 'https://huggingface.co/mlc-ai/Phi-4-mini-instruct-q4f16_1-MLC',
  },
];

export const tierById = (id: string) => TIERS.find((t) => t.id === id);
export const modelIdFor = (t: ModelTier, f16: boolean) => (f16 ? t.f16 : t.f32);
export const ALL_MODEL_IDS = TIERS.flatMap((t) => [t.f16, t.f32]);

/** Pick a tier from the device: memory (GB, if the browser tells us) and whether it is a phone-class device. */
export function recommendTier(memGb: number | undefined, mobile: boolean): TierId {
  if (mobile) return 'lite';
  if (memGb === undefined) return 'balanced';
  if (memGb >= 16) return 'balanced'; // Quality is opt-in: big download.
  if (memGb >= 8) return 'balanced';
  return 'lite';
}

// Context budget (4,096 tokens; ≈ 4 characters per token). Enforced in local.ts, tested in budget.test.ts.
export const BUDGET = { systemChars: 1_800, historyChars: 3_200, inputChars: 2_400, maxTokens: 700 } as const;
