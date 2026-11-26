import { useSyncExternalStore } from 'react';

/** One toast at a time. A toast with `undo` stays for 8 seconds (paused while the pointer is over it). */
export type Toast = { id: number; text: string; undo?: () => void; ms: number };
let current: Toast | null = null;
let seq = 0;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function showToast(text: string, undo?: () => void, ms = undo ? 8000 : 5000): number {
  current = { id: ++seq, text, undo, ms };
  emit();
  return current.id;
}
export function dismissToast(id?: number) {
  if (current && (id === undefined || current.id === id)) { current = null; emit(); }
}
export const useToast = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => current, () => current);
