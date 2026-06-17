import { useEffect, useRef } from 'react';
import { useFavorites } from './favorites';

const N8N_BASE = (import.meta.env.VITE_N8N_BASE as string | undefined) ?? null;

/**
 * Sincroniza la lista de favoritas del usuario con el workflow de n8n
 * para que las push notifications reflejen lo que el usuario eligió.
 *
 * Si VITE_N8N_BASE no está configurado, no hace nada.
 * Si el POST falla, no rompe la UI (fire-and-forget).
 */
export function useN8nFavoritesSync(): void {
  const { favoriteList } = useFavorites();
  const lastSentRef = useRef<string>('');

  useEffect(() => {
    if (!N8N_BASE) return;
    const key = [...favoriteList].sort().join(',');
    if (key === lastSentRef.current) return;
    if (favoriteList.length === 0) return;

    const handle = setTimeout(() => {
      lastSentRef.current = key;
      fetch(`${N8N_BASE}/webhook/world-cup-favorites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorites: favoriteList }),
        keepalive: true,
      }).catch(() => {
        // Silenciar — si n8n está caído, no rompe la UI
      });
    }, 400);

    return () => clearTimeout(handle);
  }, [favoriteList]);
}
