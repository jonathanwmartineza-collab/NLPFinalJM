import { describe, it, expect } from 'vitest';
import { prebuiltAppConfig } from '@mlc-ai/web-llm';
import { TIERS, ALL_MODEL_IDS, recommendTier } from '../../web/src/ai/models';

describe('model tiers', () => {
  const list = prebuiltAppConfig.model_list;
  it('uses only model IDs that exist in the pinned WebLLM package', () => {
    for (const id of ALL_MODEL_IDS) expect(list.some((m) => m.model_id === id), id).toBe(true);
  });
  it('f32 variants need no shader-f16; sizes in the UI are close to the package estimate', () => {
    for (const t of TIERS) {
      const f32 = list.find((m) => m.model_id === t.f32)!;
      expect(f32.required_features ?? []).not.toContain('shader-f16');
      const f16 = list.find((m) => m.model_id === t.f16)!;
      expect(Math.abs((f16.vram_required_MB ?? 0) / 1000 - t.sizeGb)).toBeLessThan(0.4);
    }
  });
  it('downloads only from Hugging Face and the MLC model-library repo (matches the CSP)', () => {
    for (const id of ALL_MODEL_IDS) {
      const m = list.find((x) => x.model_id === id)!;
      expect(m.model).toMatch(/^https:\/\/huggingface\.co\/mlc-ai\//);
      expect(m.model_lib).toMatch(/^https:\/\/raw\.githubusercontent\.com\/mlc-ai\//);
    }
  });
  it('never offers a non-commercial model', () => { expect(ALL_MODEL_IDS.join()).not.toMatch(/Qwen2\.5-3B/); });
  it('recommends a tier from the device', () => {
    expect(recommendTier(undefined, true)).toBe('lite');
    expect(recommendTier(4, false)).toBe('lite');
    expect(recommendTier(8, false)).toBe('balanced');
    expect(recommendTier(undefined, false)).toBe('balanced');
  });
});
