import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'mundial-2026-favorites-v1';
const STORAGE_VERSION = 1;
const EVENT_NAME = 'mundial-2026-favorites-changed';

interface FavoritesState {
  version: number;
  abbrs: string[];
}

function readState(): FavoritesState {
  if (typeof window === 'undefined') return { version: STORAGE_VERSION, abbrs: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: STORAGE_VERSION, abbrs: [] };
    const parsed = JSON.parse(raw) as Partial<FavoritesState>;
    return {
      version: parsed.version ?? STORAGE_VERSION,
      abbrs: Array.isArray(parsed.abbrs) ? parsed.abbrs.filter((s): s is string => typeof s === 'string') : [],
    };
  } catch {
    return { version: STORAGE_VERSION, abbrs: [] };
  }
}

function writeState(state: FavoritesState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: state }));
  } catch {
    // ignore quota
  }
}

export function getFavorites(): string[] {
  return readState().abbrs.map((a) => a.toUpperCase());
}

export function isFavoriteStored(abbr: string): boolean {
  return getFavorites().includes(abbr.toUpperCase());
}

export function setFavorites(abbrs: string[]): void {
  const normalized = Array.from(new Set(abbrs.map((a) => a.toUpperCase())));
  writeState({ version: STORAGE_VERSION, abbrs: normalized });
}

export function toggleFavorite(abbr: string): boolean {
  const upper = abbr.toUpperCase();
  const current = getFavorites();
  const next = current.includes(upper) ? current.filter((a) => a !== upper) : [...current, upper];
  setFavorites(next);
  return next.includes(upper);
}

export function addFavorite(abbr: string): void {
  const upper = abbr.toUpperCase();
  const current = getFavorites();
  if (!current.includes(upper)) setFavorites([...current, upper]);
}

export function removeFavorite(abbr: string): void {
  const upper = abbr.toUpperCase();
  const current = getFavorites();
  if (current.includes(upper)) setFavorites(current.filter((a) => a !== upper));
}

export function clearFavorites(): void {
  setFavorites([]);
}

export function useFavorites(): {
  favorites: ReadonlySet<string>;
  favoriteList: readonly string[];
  count: number;
  toggle: (abbr: string) => boolean;
  add: (abbr: string) => void;
  remove: (abbr: string) => void;
  clear: () => void;
  isFavorite: (abbr: string) => boolean;
} {
  const [favorites, setFavoritesState] = useState<ReadonlySet<string>>(() => new Set(getFavorites()));

  useEffect(() => {
    const handler = () => setFavoritesState(new Set(getFavorites()));
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const toggle = useCallback((abbr: string) => toggleFavorite(abbr), []);
  const add = useCallback((abbr: string) => addFavorite(abbr), []);
  const remove = useCallback((abbr: string) => removeFavorite(abbr), []);
  const clear = useCallback(() => clearFavorites(), []);
  const isFavorite = useCallback(
    (abbr: string) => favorites.has(abbr.toUpperCase()),
    [favorites],
  );

  return {
    favorites,
    favoriteList: Array.from(favorites),
    count: favorites.size,
    toggle,
    add,
    remove,
    clear,
    isFavorite,
  };
}
