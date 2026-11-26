import type { ChatMsg } from './types';

const KEY = 'ba2-chats-v1';
const safe = <T,>(fn: () => T, fallback: T): T => { try { return fn(); } catch { return fallback; } };

export const loadChats = (): Record<string, ChatMsg[]> => safe(() => JSON.parse(localStorage.getItem(KEY) ?? '{}'), {});
export const saveChat = (id: string, msgs: ChatMsg[]) => safe(() => {
  const all = loadChats(); all[id] = msgs.slice(-40); localStorage.setItem(KEY, JSON.stringify(all)); return true;
}, false);
export const clearChats = () => safe(() => { localStorage.removeItem(KEY); return true; }, false);
export const getPref = (k: string, d: string) => safe(() => localStorage.getItem(`ba2-${k}`) ?? d, d);
export const setPref = (k: string, v: string) => safe(() => { localStorage.setItem(`ba2-${k}`, v); return true; }, false);

// Studio builds live in IndexedDB (they can be large); localStorage only holds small preferences.
type Build = { id: string; brief: string; versions: string[]; at: number; v2?: unknown };
const idb = (): Promise<IDBDatabase> => new Promise((res, rej) => {
  const r = indexedDB.open('ba2-studio', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('builds', { keyPath: 'id' });
  r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
});
// Studio storage operations run one after another, so an Undo (save) can never be overtaken by the Clear before it.
let queue: Promise<unknown> = Promise.resolve();
const serial = <T,>(fn: () => Promise<T>): Promise<T> => { const run = queue.then(fn, fn); queue = run.catch(() => {}); return run; };
export const saveBuild = (b: Build) => serial(() => saveBuildNow(b));
export const clearBuilds = () => serial(() => clearBuildsNow());
export const lastBuild = () => serial(() => lastBuildNow());
async function saveBuildNow(b: Build) {
  try {
    const db = await idb();
    try { await new Promise((res, rej) => { const tx = db.transaction('builds', 'readwrite'); tx.objectStore('builds').put(b); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); } finally { db.close(); }
  } catch { /* storage unavailable */ }
}
async function lastBuildNow(): Promise<Build | null> {
  try {
    const db = await idb();
    try {
      return await new Promise((res) => {
        const out: Build[] = []; const c = db.transaction('builds').objectStore('builds').openCursor();
        c.onsuccess = () => { const cur = c.result; if (cur) { out.push(cur.value); cur.continue(); } else res(out.sort((a, b) => b.at - a.at)[0] ?? null); };
        c.onerror = () => res(null);
      });
    } finally { db.close(); }
  } catch { return null; }
}
/** Empty the Studio's saved pages (connections are closed after every use, so this is never blocked). */
async function clearBuildsNow() {
  try {
    const db = await idb();
    try { await new Promise((res, rej) => { const tx = db.transaction('builds', 'readwrite'); tx.objectStore('builds').clear(); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); } finally { db.close(); }
  } catch { /* storage unavailable */ }
}
