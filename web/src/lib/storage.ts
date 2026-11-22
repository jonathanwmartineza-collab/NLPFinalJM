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
export async function saveBuild(b: Build) {
  try { const db = await idb(); await new Promise((res, rej) => { const tx = db.transaction('builds', 'readwrite'); tx.objectStore('builds').put(b); tx.oncomplete = res; tx.onerror = () => rej(tx.error); }); } catch { /* storage unavailable */ }
}
export async function lastBuild(): Promise<Build | null> {
  try {
    const db = await idb();
    return await new Promise((res) => {
      const out: Build[] = []; const c = db.transaction('builds').objectStore('builds').openCursor();
      c.onsuccess = () => { const cur = c.result; if (cur) { out.push(cur.value); cur.continue(); } else res(out.sort((a, b) => b.at - a.at)[0] ?? null); };
      c.onerror = () => res(null);
    });
  } catch { return null; }
}
export async function clearBuilds() { try { indexedDB.deleteDatabase('ba2-studio'); } catch { /* ignore */ } }
