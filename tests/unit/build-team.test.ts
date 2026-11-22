import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { BUDGET } from '../../web/src/ai/models';
import { system, WEB_RULES, EXPERT_TASK, SYNTH_TASK } from '../../web/src/ai/prompts';

const team = JSON.parse(fs.readFileSync('web/public/team.json', 'utf8'));
const lite = JSON.parse(fs.readFileSync('web/src/ai/_generated/agents.json', 'utf8'));

describe('team build output', () => {
  it('publishes every agent (31) with public fields only', () => {
    const n = fs.readdirSync('.claude/agents').filter((f) => f.endsWith('.md') && f !== 'README.md').length;
    expect(n).toBe(31);
    expect(team.agents.length).toBe(n);
    for (const a of team.agents) {
      expect(a).not.toHaveProperty('system');
      for (const k of ['slug', 'name', 'title', 'department', 'personality', 'mission', 'examplePrompts']) expect(a).toHaveProperty(k);
    }
    expect(team.studio.name).toBe('BrainyApp2');
    const cfg = JSON.parse(fs.readFileSync('studio.config.json', 'utf8'));
    expect(team.studio.repoUrl).toBe(cfg.repoPublic === false ? '' : cfg.repoUrl); // no dead links while the repo is private
  });
  it('generates a lite on-device prompt for every agent within the context budget', () => {
    expect(Object.keys(lite.agents).length).toBe(31);
    for (const [slug, a] of Object.entries<any>(lite.agents)) {
      expect(a.prompt, slug).toMatch(/^You are \w+/);
      expect(a.prompt, slug).not.toMatch(/Agent tool|Skill tool|\.claude\/|@agent-/);
      for (const task of ['', EXPERT_TASK, SYNTH_TASK]) expect(system(slug, task).length, slug).toBeLessThanOrEqual(BUDGET.systemChars);
    }
  });
  it('fits the whole request into a 4,096-token context with margin (≈4 chars/token)', () => {
    const worst = BUDGET.systemChars / 4 + BUDGET.historyChars / 4 + BUDGET.inputChars / 4 + BUDGET.maxTokens;
    expect(worst).toBeLessThanOrEqual(4_096 * 0.85);
    expect(WEB_RULES.length).toBeLessThan(500);
  });
});
