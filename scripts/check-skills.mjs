// Checks every skill folder: real files, parseable frontmatter, name + description, sane sizes.
import fs from 'node:fs';
import { rel, listSkills, readFrontmatter } from './lib.mjs';

const errors = [], warnings = [];
for (const name of listSkills()) {
  const dir = rel('.claude/skills', name);
  if (fs.lstatSync(dir).isSymbolicLink()) { errors.push(`${name}: is a symlink (install real files)`); continue; }
  const file = rel('.claude/skills', name, 'SKILL.md');
  if (!fs.existsSync(file)) { errors.push(`${name}: missing SKILL.md`); continue; }
  const { data, body, error } = readFrontmatter(file);
  if (error) { errors.push(`${name}: ${error}`); continue; }
  if (!data.name) errors.push(`${name}: missing name`);
  else if (data.name !== name) warnings.push(`${name}: frontmatter name "${data.name}" differs from folder`);
  if (!data.description) errors.push(`${name}: missing description`);
  const d = `${data.description ?? ''}${data.when_to_use ?? ''}`;
  if (d.length > 1536) errors.push(`${name}: description + when_to_use is ${d.length} chars (max 1,536)`);
  const lines = body.split('\n').length;
  if (lines > 500) errors.push(`${name}: SKILL.md body is ${lines} lines (max 500)`);
}
for (const w of warnings) console.log('WARN', w);
if (errors.length) { for (const e of errors) console.log('FAIL', e); process.exit(1); }
console.log(`check-skills: ${listSkills().length} skills OK`);
