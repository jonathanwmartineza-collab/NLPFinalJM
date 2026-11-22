import { useEffect, useRef, useState } from 'react';
import type { LibraryItem, Team } from './lib/types';
import { usePath, onLinkClick } from './lib/router';
import { getPref, setPref } from './lib/storage';
import Sidebar from './components/Sidebar';
import ChatPage from './pages/ChatPage';
import TeamPage from './pages/TeamPage';
import StudioPage from './pages/StudioPage';
import LibraryPage from './pages/LibraryPage';
import { ResourcesPage, GuidePage, PrivacyPage, NotFound } from './pages/ContentPages';

const THEMES = ['system', 'light', 'dark'] as const;

export default function App() {
  const path = usePath();
  const [team, setTeam] = useState<Team | null>(null);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [loadErr, setLoadErr] = useState('');
  const [drawer, setDrawer] = useState(false);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [theme, setTheme] = useState(getPref('theme', 'system'));
  const intro = useRef<HTMLDialogElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const startBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetch('/team.json').then((r) => r.json()).then(setTeam).catch(() => setLoadErr('Could not load the team.'));
    fetch('/library.json').then((r) => r.json()).then(setLibrary).catch(() => setLibrary([]));
    const on = () => setOnline(true), off = () => setOnline(false);
    addEventListener('online', on); addEventListener('offline', off);
    return () => { removeEventListener('online', on); removeEventListener('offline', off); };
  }, []);
  useEffect(() => {
    if (theme === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  useEffect(() => { if (team && getPref('intro', '0') !== '1') { try { intro.current?.showModal(); startBtn.current?.focus(); } catch { /* no dialog support */ } } }, [team]);
  useEffect(() => {
    if (!drawer) return;
    const side = document.getElementById('sidebar');
    const f = side?.querySelector<HTMLElement>('input, a, button'); f?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setDrawer(false); menuBtn.current?.focus(); }
      if (e.key === 'Tab' && side) {
        const items = Array.from(side.querySelectorAll<HTMLElement>('a, button, input'));
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey);
  }, [drawer]);
  useEffect(() => { const t = team?.studio.name ?? 'BrainyApp2'; document.title = path === '/' ? `${t} · Free AI product studio` : `${t} · ${path.split('/').filter(Boolean)[0]?.replace(/^\w/, (c) => c.toUpperCase()) ?? ''}`; }, [path, team]);

  if (loadErr) return <main className="page"><div className="page-inner"><h1>Something went wrong</h1><p>{loadErr} Please reload the page.</p></div></main>;
  if (!team) return <main className="page" aria-busy="true"><div className="page-inner"><p className="thinking">Loading the studio <span className="dots"><i /><i /><i /></span></p></div></main>;

  const costMode = 'balanced';
  const expert = path.startsWith('/expert/') ? team.agents.find((a) => a.slug === path.slice(8)) : undefined;
  let page: React.ReactNode;
  if (path === '/' || path === '/team') page = <TeamPage team={team} />;
  else if (expert) page = <ChatPage key={expert.slug} agent={expert} />;
  else if (path === '/studio') page = <StudioPage library={library} />;
  else if (path === '/library') page = <LibraryPage library={library} team={team} />;
  else if (path === '/resources') page = <ResourcesPage team={team} />;
  else if (path === '/guide') page = <GuidePage team={team} />;
  else if (path === '/privacy') page = <PrivacyPage />;
  else page = <NotFound />;

  return (
    <>
      <a href="#main" className="skip">Skip to content</a>
      {!online && <div className="offline" role="status">You are offline. A model that is already downloaded keeps working.</div>}
      <div className="shell">
        <Sidebar team={team} path={path} costMode={costMode} open={drawer} onClose={() => setDrawer(false)} theme={theme}
          onTheme={() => { const n = THEMES[(THEMES.indexOf(theme as any) + 1) % 3]; setTheme(n); setPref('theme', n); }} />
        {drawer && <div className="scrim" onClick={() => setDrawer(false)} aria-hidden="true" />}
        <div className="main">
          <div className="topbar">
            <button ref={menuBtn} type="button" className="icon-btn" aria-controls="sidebar" aria-expanded={drawer} onClick={() => setDrawer(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/></svg>
              <span className="sr-only">Open the list of experts</span>
            </button>
            <b>{team.studio.name}</b>
          </div>
          <main id="main" className="page" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }} tabIndex={-1}>{page}</main>
        </div>
      </div>
      <dialog ref={intro} className="intro" aria-labelledby="intro-title" onClose={() => setPref('intro', '1')}>
        <div className="in">
          <h2 id="intro-title">Welcome to {team.studio.name}</h2>
          <p>A free studio of {team.agents.length} AI experts that plan, design and build apps with you. The AI runs on your own device: no account, no cost.</p>
          <ul>
            <li><b>Ask one expert</b> from the list, or <b>ask the whole team</b> and get one combined answer.</li>
            <li><b>One-shot Studio</b> turns a description into a complete web page you can preview and download.</li>
            <li>Answers are AI-generated: review them before you rely on them.</li>
            <li>The first time, you choose a model and your browser downloads it once (about 1 GB; the Quality model is bigger). Nothing you type leaves your browser.</li>
            <li>Needs a browser with WebGPU (for example a recent Chrome or Edge on a laptop). Small models give short, simpler answers.</li>
          </ul>
          <p style={{ fontSize: 14, color: 'var(--soft)' }}>Read the <a href="/privacy" onClick={(e) => { intro.current?.close(); onLinkClick(e); }}>privacy note</a>.</p>
          <form method="dialog"><button ref={startBtn} className="btn">Get started</button></form>
        </div>
      </dialog>
    </>
  );
}
