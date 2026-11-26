import { useEffect, useRef, useState } from 'react';
import type { LibraryItem, Team } from './lib/types';
import { usePath } from './lib/router';
import OwnerLogo, { COPYRIGHT } from './components/OwnerLogo';
import Toaster from './components/Toaster';
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
  const [contrast, setContrast] = useState(getPref('contrast', 'normal'));
  const menuBtn = useRef<HTMLButtonElement>(null);

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
  useEffect(() => {
    if (contrast === 'high') document.documentElement.setAttribute('data-contrast', 'high');
    else document.documentElement.removeAttribute('data-contrast');
  }, [contrast]);
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
  useEffect(() => {
    const t = team?.studio.name ?? 'BrainyApp2';
    const ex = path.startsWith('/expert/') ? team?.agents.find((a) => a.slug === path.slice(8)) : undefined;
    const sec = ex ? `${ex.name}, ${ex.title}` : path.split('/').filter(Boolean)[0]?.replace(/^\w/, (c) => c.toUpperCase()) ?? '';
    document.title = path === '/' ? `${t} · Free AI product studio` : `${sec} · ${t}`;
  }, [path, team]);

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
      <header className="topbar">
        <button ref={menuBtn} type="button" className="icon-btn menu-btn" aria-controls="sidebar" aria-expanded={drawer} onClick={() => setDrawer(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/></svg>
          <span className="sr-only">Open the list of experts</span>
        </button>
        <OwnerLogo />
        <span className="topbar-name">{team.studio.name}</span>
      </header>
      <div className="shell">
        <Sidebar team={team} path={path} costMode={costMode} open={drawer} onClose={() => setDrawer(false)} theme={theme}
          onTheme={() => { const n = THEMES[(THEMES.indexOf(theme as any) + 1) % 3]; setTheme(n); setPref('theme', n); }}
          contrast={contrast === 'high'} onContrast={() => { const n = contrast === 'high' ? 'normal' : 'high'; setContrast(n); setPref('contrast', n); }} />
        {drawer && <div className="scrim" onClick={() => setDrawer(false)} aria-hidden="true" />}
        <div className="main">
          <main id="main" className="page" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }} tabIndex={-1}>{page}</main>
        </div>
      </div>
      <footer className="site-foot">{COPYRIGHT}</footer>
      <Toaster />
    </>
  );
}
