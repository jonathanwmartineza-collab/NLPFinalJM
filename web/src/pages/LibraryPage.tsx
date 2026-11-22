import { useMemo, useState } from 'react';
import type { LibraryItem, Team } from '../lib/types';
import { navigate } from '../lib/router';

export default function LibraryPage({ library, team }: { library: LibraryItem[]; team: Team }) {
  const cats = useMemo(() => ['All', ...Array.from(new Set(library.map((p) => p.category)))], [library]);
  const [cat, setCat] = useState('All');
  const [copied, setCopied] = useState('');
  const list = library.filter((p) => cat === 'All' || p.category === cat);
  const who = (s: string) => team.agents.find((a) => a.slug === s);
  return (
    <div className="page" tabIndex={0} role="region" aria-label="Prompt library"><div className="page-inner" style={{ maxWidth: 1100 }}>
      <h1>Prompt Library</h1>
      <p className="lede">Tested one-shot prompts for twelve kinds of apps. Copy one into Claude Code with your team, or open it in the One-shot Studio. Replace anything in [BRACKETS] with your details.</p>
      <div className="filters" role="group" aria-label="Filter by category">
        {cats.map((c) => <button key={c} type="button" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>)}
      </div>
      {!library.length && <p className="notice">The library is being written. Check back soon.</p>}
      <div className="cards">
        {list.map((p) => (
          <article key={p.id} className="card">
            <span className="tag">{p.category}{who(p.agent) ? ` · led by ${who(p.agent)!.name}` : ''}</span>
            <h3>{p.title}</h3>
            <p>{p.prompt.replace(/\s+/g, ' ').slice(0, 170)}…</p>
            <div className="acts">
              <button type="button" className="btn ghost sm" onClick={async () => { try { await navigator.clipboard.writeText(p.prompt); setCopied(p.id); setTimeout(() => setCopied(''), 1800); } catch { setCopied('fail'); } }}>{copied === p.id ? 'Copied' : 'Copy'}</button>
              <button type="button" className="btn sm" onClick={() => navigate(`/studio?t=${encodeURIComponent(p.id)}`)}>{p.runsInStudio ? 'Open in Studio' : 'Claude Code prompt'}</button>
            </div>
          </article>
        ))}
      </div>
      <p role="status" aria-live="polite" className="sr-only">{copied && copied !== 'fail' ? 'Prompt copied' : ''}</p>
    </div></div>
  );
}
