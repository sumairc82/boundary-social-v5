import { AppState } from './types';
const KEY = 'boundary-social-v5';
export const saveState = (s: AppState) => {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
};
export const loadState = (): Partial<AppState> | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
