import { AppState } from './types';
const KEY = 'boundary-social-v5';
const VERSION_KEY = 'boundary-social-v5-version';
const CURRENT_VERSION = '5'; // bump to force-clear stale state

export const saveState = (s: AppState) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
  } catch {}
};
export const loadState = (): Partial<AppState> | null => {
  try {
    const version = localStorage.getItem(VERSION_KEY);
    if (version !== CURRENT_VERSION) {
      localStorage.removeItem(KEY);
      return null;
    }
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
