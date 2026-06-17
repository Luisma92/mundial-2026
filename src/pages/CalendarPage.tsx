import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Filter, Star } from 'lucide-react';
import { useMatches } from '@/hooks/useWorldCup';
import { MatchCard } from '@/components/matches/MatchCard';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { TOURNAMENT } from '@/lib/constants';
import type { Match } from '@/lib/types';
import { clsx } from 'clsx';
import { useFavorites } from '@/lib/favorites';

type FilterStatus = 'all' | 'scheduled' | 'in_progress' | 'final';

export function CalendarPage() {
  const { data, isLoading, isError, error, refetch } = useMatches();
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const { isFavorite, count: favCount } = useFavorites();

  const groups = TOURNAMENT.groupLetters;

  const filtered = useMemo<Match[]>(() => {
    if (!data) return [];
    return data
      .filter((m) => {
        if (statusFilter !== 'all' && m.status !== statusFilter) return false;
        if (groupFilter !== 'all' && m.group !== `Grupo ${groupFilter}`) return false;
        if (favoritesOnly && !isFavorite(m.home.team.abbreviation) && !isFavorite(m.away.team.abbreviation)) return false;
        return true;
      })
      .sort((a, b) => {
        const aFav = isFavorite(a.home.team.abbreviation) || isFavorite(a.away.team.abbreviation);
        const bFav = isFavorite(b.home.team.abbreviation) || isFavorite(b.away.team.abbreviation);
        if (aFav !== bFav) return aFav ? -1 : 1;
        return a.startTimestamp - b.startTimestamp;
      });
  }, [data, statusFilter, groupFilter, favoritesOnly, isFavorite]);

  const byDate = useMemo(() => {
    const map = new Map<string, Match[]>();
    for (const m of filtered) {
      const key = m.localDate || new Date(m.startTimeUtc).toISOString().slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(m);
      map.set(key, arr);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const counts = useMemo(() => {
    if (!data) return { all: 0, scheduled: 0, in_progress: 0, final: 0 };
    return {
      all: data.length,
      scheduled: data.filter((m) => m.status === 'scheduled').length,
      in_progress: data.filter((m) => m.status === 'in_progress').length,
      final: data.filter((m) => m.status === 'final').length,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-white/5 pb-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display font-black tracking-tight">
              <span className="text-gradient-pitch">Calendario</span>
            </h1>
            <p className="text-sm text-night-400 mt-1">
              {counts.all} partidos · {counts.scheduled} por jugar · {counts.final} finalizados
            </p>
          </div>
          <Calendar className="w-10 h-10 text-pitch-500 opacity-40" />
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterPill active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
            Todos <span className="ml-1.5 text-night-400">{counts.all}</span>
          </FilterPill>
          <FilterPill active={statusFilter === 'in_progress'} onClick={() => setStatusFilter('in_progress')}>
            En vivo <span className="ml-1.5 text-red-400">{counts.in_progress}</span>
          </FilterPill>
          <FilterPill active={statusFilter === 'scheduled'} onClick={() => setStatusFilter('scheduled')}>
            Próximos <span className="ml-1.5 text-night-400">{counts.scheduled}</span>
          </FilterPill>
          <FilterPill active={statusFilter === 'final'} onClick={() => setStatusFilter('final')}>
            Finalizados <span className="ml-1.5 text-night-400">{counts.final}</span>
          </FilterPill>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-night-400" />
          <span className="text-xs text-night-400 mr-1">Grupo:</span>
          <FilterPill active={groupFilter === 'all'} onClick={() => setGroupFilter('all')} small>Todos</FilterPill>
          {groups.map((letter) => (
            <FilterPill key={letter} active={groupFilter === letter} onClick={() => setGroupFilter(letter)} small>
              {letter}
            </FilterPill>
          ))}
          <button
            onClick={() => setFavoritesOnly((v) => !v)}
            disabled={favCount === 0}
            className={clsx(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all focus-ring ml-2',
              favCount === 0
                ? 'bg-white/[0.02] text-night-500 cursor-not-allowed'
                : favoritesOnly
                  ? 'bg-pitch-500 text-white shadow-lg shadow-pitch-500/20'
                  : 'bg-white/[0.04] text-night-300 hover:bg-white/[0.08] hover:text-white border border-white/5',
            )}
          >
            <Star className={clsx('w-3 h-3', favoritesOnly && 'fill-current')} />
            Mis favoritas {favCount > 0 && <span className="opacity-80">({favCount})</span>}
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="rounded-2xl glass p-12"><Spinner label="Cargando calendario..." /></div>
      ) : isError ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : byDate.length === 0 ? (
        <div className="rounded-2xl glass p-12 text-center text-night-300 text-sm">
          No hay partidos con los filtros seleccionados.
        </div>
      ) : (
        <div className="space-y-8">
          {byDate.map(([date, matches], dayIdx) => (
            <motion.section
              key={date}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(dayIdx * 0.05, 0.4) }}
              className="space-y-3"
            >
              <h2 className="text-xs font-bold text-night-300 uppercase tracking-widest sticky top-16 bg-night-900/80 backdrop-blur py-2 z-10 -mx-1 px-1 rounded">
                {formatDayHeading(date)}
                <span className="ml-2 text-night-500 normal-case font-normal">· {matches.length} partidos</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {matches.map((match, idx) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                  >
                    <MatchCard match={match} showDate={false} />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDayHeading(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const today = new Date();
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(today);
  if (dateStr === todayStr) return '🟢 HOY';
  const tomorrow = new Date(today.getTime() + 86400000);
  const tomorrowStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(tomorrow);
  if (dateStr === tomorrowStr) return 'MAÑANA';
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(date).toUpperCase();
}

function FilterPill({ children, active, onClick, small }: { children: React.ReactNode; active: boolean; onClick: () => void; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'inline-flex items-center rounded-full font-medium transition-all focus-ring',
        small ? 'px-2.5 py-0.5 text-[11px]' : 'px-3 py-1.5 text-xs',
        active
          ? 'bg-pitch-500 text-white shadow-lg shadow-pitch-500/20'
          : 'bg-white/[0.04] text-night-300 hover:bg-white/[0.08] hover:text-white border border-white/5',
      )}
    >
      {children}
    </button>
  );
}
