import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useStandings, useMatches } from '@/hooks/useWorldCup';
import { TeamFlag } from '@/components/teams/TeamFlag';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { clsx } from 'clsx';
import type { Team } from '@/lib/types';

export function TeamsPage() {
  const standingsQ = useStandings();
  const matchesQ = useMatches();
  const [search, setSearch] = useState('');

  const allTeams = useMemo<Team[]>(() => {
    const set = new Map<string, Team>();
    for (const group of standingsQ.data ?? []) {
      for (const s of group.standings) set.set(s.team.id, s.team);
    }
    for (const match of matchesQ.data ?? []) {
      set.set(match.home.team.id, match.home.team);
      set.set(match.away.team.id, match.away.team);
    }
    return Array.from(set.values()).sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name, 'es');
    });
  }, [standingsQ.data, matchesQ.data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return allTeams;
    const q = search.trim().toLowerCase();
    return allTeams.filter((t) =>
      t.name.toLowerCase().includes(q) ||
      t.shortName.toLowerCase().includes(q) ||
      t.abbreviation.toLowerCase().includes(q),
    );
  }, [allTeams, search]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tight">
            <span className="text-gradient-pitch">Equipos</span>
          </h1>
          <p className="text-sm text-night-400 mt-1">
            {allTeams.length} selecciones · Busca por país, nombre o abreviación
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar selección..."
            className="w-full rounded-xl bg-white/[0.04] border border-white/10 pl-10 pr-3 py-2.5 text-sm placeholder:text-night-500 focus:outline-none focus:ring-2 focus:ring-pitch-400 focus:bg-white/[0.06]"
          />
        </div>
      </header>

      {standingsQ.isLoading || matchesQ.isLoading ? (
        <div className="rounded-2xl glass p-12"><Spinner label="Cargando equipos..." /></div>
      ) : standingsQ.isError ? (
        <ErrorState message={(standingsQ.error as Error).message} onRetry={() => standingsQ.refetch()} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
        >
          {filtered.map((team, idx) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(idx * 0.015, 0.4) }}
            >
              <Link
                to={`/equipos/${team.abbreviation.toLowerCase()}`}
                className={clsx(
                  'group flex flex-col items-center gap-2 rounded-2xl p-4 transition-all focus-ring border',
                  team.isFavorite
                    ? 'glass-strong border-pitch-500/40 hover:border-pitch-500/70 bg-pitch-900/20'
                    : 'glass border-white/5 hover:border-white/20 hover:bg-white/[0.04]',
                )}
              >
                <TeamFlag
                  team={team}
                  size="xl"
                  showRing={team.isFavorite}
                  ringColor={team.color}
                />
                <div className="text-center w-full min-w-0">
                  <div className={clsx('text-sm font-bold truncate', team.isFavorite ? 'text-pitch-200' : 'text-white')}>
                    {team.shortName}
                  </div>
                  <div className="text-[10px] text-night-400 uppercase tracking-wider mt-0.5">{team.abbreviation}</div>
                </div>
                {team.isFavorite && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold text-pitch-300 bg-pitch-500/15 rounded-full px-1.5 py-0.5 uppercase tracking-wider">
                    ★
                  </span>
                )}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {filtered.length === 0 && !standingsQ.isLoading && !standingsQ.isError && (
        <div className="rounded-2xl glass p-8 text-center text-night-300 text-sm">
          No se encontró "{search}".
        </div>
      )}
    </div>
  );
}
