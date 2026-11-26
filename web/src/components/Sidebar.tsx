import { useMemo, useState } from 'react';
import type { Agent, Team, Tier } from '../lib/types';
import { onLinkClick } from '../lib/router';

export const effectiveTier = (t: Tier, costMode: string): Tier => costMode === 'economy' ? (t === 'opus' ? 'sonnet' : 'haiku') : t;

export function Avatar({ a, lg }: { a: Pick<Agent, 'department' | 'monogram' | 'name'>; lg?: boolean }) {
  return <span className={`av dept-${a.department}${lg ? ' lg' : ''}`} aria-hidden="true">{a.monogram || a.name[0]}</span>;
}

export default function Sidebar({ team, path, costMode, open, onClose, theme, onTheme, contrast, onContrast }: {
  team: Team; path: string; costMode: string; open: boolean; onClose: () => void; theme: string; onTheme: () => void; contrast: boolean; onContrast: () => void;
}) {
  const [q, setQ] = useState('');
  const orchestrator = team.agents.find((a) => a.slug === 'orchestrator');
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return team.agents.filter((a) => a.slug !== 'orchestrator' && (!s || `${a.name} ${a.title} ${a.department} ${a.personality}`.toLowerCase().includes(s)));
  }, [q, team]);
  const go = (e: React.MouseEvent<HTMLAnchorElement>) => { onLinkClick(e); onClose(); };
  const cur = (href: string) => (path === href ? 'page' : undefined);
  return (
    <aside className="side" id="sidebar" data-open={open} aria-label="Experts">
      <div className="side-head">
        <a href="/" className="brand" onClick={go}><span className="brand-mark" aria-hidden="true">B</span><b>{team.studio.name}</b></a>
        <p className="tagline">{team.studio.tagline}</p>
        <nav className="side-links" aria-label="Site">
          <a href="/guide" onClick={go} aria-current={cur('/guide')}>Guide</a>
          <a href="/resources" onClick={go} aria-current={cur('/resources')}>Resources</a>
          <a href="/privacy" onClick={go} aria-current={cur('/privacy')}>Privacy</a>
        </nav>
      </div>
      <div className="side-tools">
        <label htmlFor="agent-search" className="sr-only">Search experts</label>
        <input id="agent-search" className="search" type="search" placeholder={`Search ${team.agents.length} experts`} value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className="icon-btn" onClick={onTheme} aria-label={`Theme: ${theme}. Change theme`} title={`Theme: ${theme}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">{theme === 'dark'
            ? <path fill="currentColor" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            : theme === 'light'
              ? <g fill="currentColor"><circle cx="12" cy="12" r="4.5" /><path d="M11 1h2v3h-2zm0 19h2v3h-2zM1 11h3v2H1zm19 0h3v2h-3zM4.2 5.6l1.4-1.4 2.1 2.1-1.4 1.4zm12.1 12.1 1.4-1.4 2.1 2.1-1.4 1.4zM4.2 18.4l2.1-2.1 1.4 1.4-2.1 2.1zM16.3 6.3l2.1-2.1 1.4 1.4-2.1 2.1z" /></g>
              : <path fill="currentColor" d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2v16a8 8 0 0 1 0-16z" />}</svg>
        </button>
        <button type="button" className="icon-btn" onClick={onContrast} aria-pressed={contrast} aria-label="High contrast" title={contrast ? 'High contrast: on' : 'High contrast: off'}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20zm0 2a8 8 0 0 0 0 16V4zM3 21 21 3l1.4 1.4L4.4 22.4z" /></svg>
        </button>
      </div>
      <div className="side-scroll">
        <nav className="nav-studio" aria-label="Tools">
          <a href="/studio" onClick={go} aria-current={cur('/studio')}>One-shot Studio</a>
          <a href="/library" onClick={go} aria-current={cur('/library')}>Prompt Library</a>
        </nav>
        {orchestrator && (
          <a href="/" className="row team" onClick={go} aria-current={path === '/' ? 'page' : undefined}>
            <Avatar a={orchestrator} />
            <span>
              <span className="row-name">Ask the whole team</span>
              <span className="row-title" style={{ display: 'block' }}>{orchestrator.name} routes your question to the right experts</span>
            </span>
          </a>
        )}
        {team.departments.map((d) => {
          const rows = list.filter((a) => a.department === d);
          if (!rows.length) return null;
          return (
            <section key={d} aria-labelledby={`dept-${d}`}>
              <h2 className="dept-label" id={`dept-${d}`}>{d}</h2>
              {rows.map((a) => {
                return (
                  <a key={a.slug} href={`/expert/${a.slug}`} className="row" onClick={go} aria-current={cur(`/expert/${a.slug}`)} title={a.personality}>
                    <Avatar a={a} />
                    <span>
                      <span className="row-name">{a.name}</span>
                      <span className="row-title" style={{ display: 'block' }}>{a.title}</span>
                      <span className="row-pers" style={{ display: 'block' }}>{a.personality}</span>
                    </span>
                  </a>
                );
              })}
            </section>
          );
        })}
        {!list.length && <p className="empty-search">No expert matches “{q}”.</p>}
      </div>
    </aside>
  );
}
