// Writes web/public/version.json so anyone can check which commit is live:
//   https://brainyapp2.netlify.app/version.json  (compared by scripts/verify-live.sh)
import fs from 'node:fs';
import { execSync } from 'node:child_process';
let commit = process.env.COMMIT_REF || '';
if (!commit) { try { commit = execSync('git rev-parse HEAD').toString().trim(); } catch { commit = 'unknown'; } }
const v = { commit, short: commit.slice(0, 7), branch: process.env.BRANCH || process.env.HEAD || 'local', context: process.env.CONTEXT || 'local', builtAt: new Date().toISOString() };
fs.writeFileSync('web/public/version.json', JSON.stringify(v, null, 1) + '\n');
console.log(`version.json → ${v.short} (${v.context})`);
