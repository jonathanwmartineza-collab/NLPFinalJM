// Single source of truth → website data.
// Reads .claude/agents, knowledge/, prompts/library.json, studio.config.json and the one-shot-build skill,
// then writes web/public/team.json, web/public/library.json and web/src/ai/_generated/agents.json (lite on-device prompts).
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { rel, listAgents, readFrontmatter, DEPARTMENTS } from './lib.mjs';

try {
  execFileSync(process.execPath, [rel('scripts/validate-team.mjs')], { stdio: 'inherit' });
} catch {
  console.error('build-team: validate-team failed, so the build stops here.');
  process.exit(1);
}

const studio = JSON.parse(fs.readFileSync(rel('studio.config.json'), 'utf8'));
const KNOWLEDGE_MAX_CHARS = 8_000; // about 2,000 tokens per agent
const KEEP = ['identity', 'operating principles', 'principles', 'method', 'output template', 'self-check', 'boundaries', 'quality bar', 'standards'];
const DROP_LINE = /(\bAgent tool\b|\bSkill tool\b|\.claude\/|knowledge\/|hand[- ]?off|delegate to|@agent-|read the notes|\(Bash\)|\bnpx\s|have Write but not Edit|\bwith Grep\b)/i;

/** Remove Claude Code tool instructions that make no sense in a tool-less web chat. */
export function stripTools(text) {
  return text
    .replace(/invoke the `([^`]+)` skill with the Skill tool and follow it/g, "follow the studio's $1 rules")
    .replace(/\s*\(if it is unavailable,\s+read\s+`[^`]+`\)/g, '')
    .split('\n').filter((l) => !DROP_LINE.test(l)).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/** Keep the parts of a Claude Code system prompt that make sense in a tool-less web chat. */
export function webPrompt(body) {
  const sections = body.split(/\n(?=## )/);
  const head = sections.shift() ?? '';
  const kept = sections.filter((s) => {
    const h = s.split('\n')[0].replace(/^##\s*/, '').toLowerCase();
    return KEEP.some((k) => h.startsWith(k));
  });
  return stripTools([head, ...kept].join('\n'));
}

/** Condense an agent's knowledge folder into headings, bullets and checklist lines, within a hard cap. */
export function condenseKnowledge(slug) {
  const dir = rel('knowledge', slug);
  if (!fs.existsSync(dir)) return '';
  const own = fs.readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md').sort().map((f) => `${dir}/${f}`);
  // The README's quick reference, then notes it links to (including shared ones), then the agent's own notes.
  const readme = fs.existsSync(`${dir}/README.md`) ? fs.readFileSync(`${dir}/README.md`, 'utf8') : '';
  const linked = [...readme.matchAll(/\]\(([^)]+\.md)\)/g)].map((m) => rel('knowledge', slug, m[1])).filter((f) => fs.existsSync(f));
  const files = [`${dir}/README.md`, ...linked, ...own].filter((f, i, a) => fs.existsSync(f) && a.indexOf(f) === i);
  let out = '';
  for (const file of files) {
    const f = file.split('/').pop();
    const lines = fs.readFileSync(file, 'utf8').split('\n')
      .filter((l) => /^(#{1,3} |\s*[-*] |\s*\d+\. |\|)/.test(l) && !/https?:\/\//.test(l))
      .map((l) => l.replace(/\s+$/, ''));
    const chunk = `\n### ${f.replace(/\.md$/, '')}\n${lines.join('\n')}\n`;
    if (out.length + chunk.length > KNOWLEDGE_MAX_CHARS) { out += chunk.slice(0, Math.max(0, KNOWLEDGE_MAX_CHARS - out.length)); break; }
    out += chunk;
  }
  return stripTools(out);
}

function oneShotRules() {
  const f = rel('.claude/skills/one-shot-build/SKILL.md');
  const fallback = `Rules: inline CSS and JS only; no external scripts; system fonts or Google Fonts; images as inline SVG or CSS; responsive from 360px; WCAG 2.2 AA (contrast 4.5:1, visible focus, labels, landmarks, prefers-reduced-motion); light and dark via prefers-color-scheme and CSS variables; realistic content, no lorem ipsum; empty, loading and error states where relevant; no network requests.`;
  if (!fs.existsSync(f)) return fallback;
  const { body } = readFrontmatter(f);
  const m = body.match(/## Checklist\n([\s\S]*?)(\n## |$)/);
  return m ? `Follow this checklist:\n${m[1].trim()}` : fallback;
}

const agents = [];
for (const file of listAgents()) {
  const { data: d, body } = readFrontmatter(rel('.claude/agents', file));
  const k = condenseKnowledge(d.name);
  agents.push({
    slug: d.name, name: d.display.displayName, title: d.display.title, department: d.display.department,
    tier: d.model, personality: d.display.personality, mission: d.display.mission, monogram: d.display.monogram,
    examplePrompts: d.display.examplePrompts.slice(0, 3),
    system: `${webPrompt(body)}${k ? `\n\n# Reference notes (condensed from knowledge/${d.name})\n${k}` : ''}`,
  });
}
const TIER = { opus: 0, sonnet: 1, haiku: 2 };
agents.sort((a, b) => DEPARTMENTS.indexOf(a.department) - DEPARTMENTS.indexOf(b.department) || TIER[a.tier] - TIER[b.tier] || a.name.localeCompare(b.name));

let library = [];
if (fs.existsSync(rel('prompts/library.json'))) {
  library = JSON.parse(fs.readFileSync(rel('prompts/library.json'), 'utf8')).map((p) => ({
    id: p.id, title: p.title, category: p.category, agent: p.agent, runsInStudio: !!p.runsInStudio,
    variables: p.variables ?? [], prompt: p.prompt,
  }));
}

const pub = agents.map(({ system, ...rest }) => rest);
fs.mkdirSync(rel('web/public'), { recursive: true });
fs.writeFileSync(rel('web/public/team.json'), JSON.stringify({
  studio: { name: studio.studioName, tagline: studio.tagline, accent: studio.accent, researchDate: studio.researchDate },
  departments: DEPARTMENTS.filter((d) => pub.some((a) => a.department === d)), agents: pub,
}, null, 1));
fs.writeFileSync(rel('web/public/library.json'), JSON.stringify(library, null, 1));

// BrainyApp2: short system prompts that fit a 4,096-token on-device context (≤ 1,400 chars + web rules).
const LITE_MAX = 1_200; // leaves room for the web rules and the longest task prompt within BUDGET.systemChars
const SKIP = /(evidence rule|NOT RUN|confirm at|change: confirm|verify .* docs|date what you cite|Every change ships|Agent calls|in the same turn|never run commands|Use Read on|Read-only, always)/i;
// Whole bullets (wrapped lines joined), clipped at a sentence boundary so the model never gets half a rule.
const clip = (t, n = 230) => {
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  const i = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '), cut.lastIndexOf(': '));
  return i > 60 ? `${cut.slice(0, i).replace(/[;:,]$/, '')}.` : `${cut.slice(0, cut.lastIndexOf(' '))}…`;
};
export function litePrompt(d, body) {
  const section = body.match(/## Operating principles\n([\s\S]*?)(\n## |\n### |$)/)?.[1] ?? '';
  const bullets = section.split('\n').reduce((acc, l) => {
    if (/^- /.test(l)) acc.push(l); else if (/^\s+\S/.test(l) && acc.length) acc[acc.length - 1] += ` ${l.trim()}`;
    return acc;
  }, []);
  const principles = bullets.filter((l) => !SKIP.test(l) && !DROP_LINE.test(l)).slice(0, 5)
    .map((l) => clip(l.replace(/`/g, '').replace(/\s+/g, ' ')));
  let out = `You are ${d.display.displayName}, ${d.display.title} at ${studio.studioName}. ${d.display.mission}\nStyle: ${d.display.personality}\nPrinciples:\n${principles.join('\n')}`;
  while (out.length > LITE_MAX && principles.length > 1) { principles.pop(); out = `You are ${d.display.displayName}, ${d.display.title} at ${studio.studioName}. ${d.display.mission}\nStyle: ${d.display.personality}\nPrinciples:\n${principles.join('\n')}`; }
  return out.slice(0, LITE_MAX);
}
const lite = {};
for (const file of listAgents()) {
  const { data: d, body } = readFrontmatter(rel('.claude/agents', file));
  lite[d.name] = { name: d.display.displayName, title: d.display.title, mission: d.display.mission, department: d.display.department, prompt: litePrompt(d, body) };
}
fs.mkdirSync(rel('web/src/ai/_generated'), { recursive: true });
fs.writeFileSync(rel('web/src/ai/_generated/agents.json'), JSON.stringify({ studio: { name: studio.studioName }, agents: lite }, null, 1));
const sizes = Object.values(lite).map((a) => a.prompt.length);
console.log(`build-team: ${agents.length} agents, ${library.length} library prompts; largest lite prompt ${Math.max(...sizes)} chars`);
