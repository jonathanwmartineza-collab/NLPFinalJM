import { clearChats, clearBuilds } from './storage';
import { initEngine, deleteModels } from '../ai/engine';

const used = async (): Promise<number | null> => {
  try { const e = await navigator.storage?.estimate?.(); return typeof e?.usage === 'number' ? e.usage : null; } catch { return null; }
};

/**
 * "Free up space": deletes every chat, Studio page, downloaded model, cache and temporary database this site
 * stored. Keeps preferences (theme, contrast, chosen model size). Returns the bytes freed when the browser
 * can report storage use, otherwise null.
 */
export async function freeUpSpace(): Promise<number | null> {
  const before = await used();
  clearChats();
  await clearBuilds();
  await initEngine();
  await deleteModels(); // unloads a running model and removes the model caches
  try { if ('caches' in self) for (const k of await caches.keys()) await caches.delete(k); } catch { /* unavailable */ }
  try {
    const dbs = (await (indexedDB as any).databases?.()) as { name?: string }[] | undefined;
    for (const d of dbs ?? []) if (d.name) await new Promise((r) => { const q = indexedDB.deleteDatabase(d.name!); q.onsuccess = q.onerror = q.onblocked = () => r(null); });
  } catch { /* unavailable */ }
  try { sessionStorage.clear(); } catch { /* blocked */ }
  const after = await used();
  return before !== null && after !== null ? Math.max(0, before - after) : null;
}

export const formatBytes = (b: number) => b >= 1e9 ? `${(b / 1e9).toFixed(2)} GB` : b >= 1e6 ? `${Math.round(b / 1e6)} MB` : b >= 1e3 ? `${Math.round(b / 1e3)} KB` : `${b} bytes`;
