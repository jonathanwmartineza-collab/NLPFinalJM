import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
export const rel = (...p) => path.join(ROOT, ...p);

/** Split a markdown file into { data, body }. Throws on invalid YAML. Frontmatter must start on line 1. */
export function readFrontmatter(file) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.startsWith('---')) return { data: null, body: text, error: 'frontmatter must start on line 1' };
  const end = text.indexOf('\n---', 3);
  if (end < 0) return { data: null, body: text, error: 'unterminated frontmatter' };
  const yamlText = text.slice(3, end).replace(/^\r?\n/, '');
  try {
    return { data: parse(yamlText) ?? {}, body: text.slice(end + 4).replace(/^\r?\n/, '') };
  } catch (e) {
    return { data: null, body: text, error: `YAML: ${e.message.split('\n')[0]}` };
  }
}

export const listAgents = () =>
  fs.readdirSync(rel('.claude/agents')).filter((f) => f.endsWith('.md') && f !== 'README.md').sort();
export const listSkills = () =>
  fs.readdirSync(rel('.claude/skills'), { withFileTypes: true }).filter((d) => d.isDirectory() || d.isSymbolicLink()).map((d) => d.name).sort();

export const DEPARTMENTS = ['Leadership', 'Product', 'Design', 'Engineering', 'Quality', 'Launch', 'Governance'];
export const TOOLS = ['Read', 'Grep', 'Glob', 'Bash', 'Edit', 'Write', 'WebFetch', 'WebSearch', 'Skill', 'Agent', 'NotebookEdit', 'TodoWrite'];
export const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan'];
export const MODELS = ['opus', 'sonnet', 'haiku'];
export const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];
export const toolList = (t) => (Array.isArray(t) ? t : String(t ?? '').split(',')).map((s) => String(s).trim()).filter(Boolean);
