import { useEffect, useState } from 'react';

export function navigate(to: string) {
  if (to === location.pathname + location.search) return;
  history.pushState(null, '', to);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
export function usePath() {
  const [p, setP] = useState(location.pathname);
  useEffect(() => { const on = () => setP(location.pathname); addEventListener('popstate', on); return () => removeEventListener('popstate', on); }, []);
  return p;
}
/** Intercept same-origin link clicks so navigation stays in the app. */
export function onLinkClick(e: React.MouseEvent<HTMLAnchorElement>) {
  const a = e.currentTarget;
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
  const url = new URL(a.href);
  if (url.origin !== location.origin) return;
  e.preventDefault(); navigate(url.pathname + url.search);
}
