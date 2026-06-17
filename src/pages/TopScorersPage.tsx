import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Search, Medal, Goal } from 'lucide-react';
import { useTopScorers } from '@/hooks/useWorldCup';
import { TeamFlag } from '@/components/teams/TeamFlag';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { clsx } from 'clsx';
import { useFavorites } from '@/lib/favorites';

export function TopScorersPage() {
  const { data, isLoading, isError, error, refetch } = useTopScorers();
  const [search, setSearch] = useState('');
  const { isFavorite } = useFavorites();

  const scorers = useMemo(() => {
    if (!data) return [];
    return data
      .map((s) => ({ ...s, isFavorite: isFavorite(s.team.abbreviation) }))
      .sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        if (b.goals !== a.goals) return b.goals - a.goals;
        if (b.assists !== a.assists) return b.assists - a.assists;
        return a.matches - b.matches;
      });
  }, [data, isFavorite]);

  const filtered = useMemo(() => {
    if (!search.trim()) return scorers;
    const q = search.trim().toLowerCase();
    return scorers.filter(
      (s) =>
        s.athlete.name.toLowerCase().includes(q) ||
        s.athlete.shortName.toLowerCase().includes(q) ||
        s.team.shortName.toLowerCase().includes(q) ||
        s.team.abbreviation.toLowerCase().includes(q),
    );
  }, [scorers, search]);

  const topThree = scorers.slice(0, 3);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-pitch-400" />
            <span className="text-xs text-night-400 uppercase tracking-widest">Bota de Oro</span>
          </div>
          <h1 className="text-4xl font-display font-black tracking-tight">
            <span className="text-gradient-pitch">Goleadores</span>
          </h1>
          <p className="text-sm text-night-400 mt-1">
            {scorers.length} jugadores con gol · Líder: {scorers[0]?.athlete.name ?? '—'}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar jugador o selección..."
            className="w-full rounded-xl bg-white/[0.04] border border-white/10 pl-10 pr-3 py-2.5 text-sm placeholder:text-night-500 focus:outline-none focus:ring-2 focus:ring-pitch-400 focus:bg-white/[0.06]"
          />
        </div>
      </header>

      {isLoading ? (
        <div className="rounded-2xl glass p-12"><Spinner label="Cargando goleadores..." /></div>
      ) : isError ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : scorers.length === 0 ? (
        <div className="rounded-2xl glass p-12 text-center">
          <Goal className="w-12 h-12 text-night-400 mx-auto mb-4 opacity-60" />
          <p className="text-night-300">Aún no hay goles en el torneo. La tabla se actualizará cuando arranque la fase de grupos.</p>
        </div>
      ) : (
        <>
          {topThree.length >= 3 && <Podium top={topThree} />}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl glass overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-night-400 border-b border-white/5">
                    <th className="px-3 py-3 text-left font-medium w-10">#</th>
                    <th className="px-2 py-3 text-left font-medium">Jugador</th>
                    <th className="px-2 py-3 text-left font-medium">Selección</th>
                    <th className="px-2 py-3 text-center font-medium w-12 text-pitch-300" title="Goles">
                      <Goal className="w-3.5 h-3.5 inline" />
                    </th>
                    <th className="px-2 py-3 text-center font-medium w-12" title="Asistencias">A</th>
                    <th className="px-2 py-3 text-center font-medium w-12" title="Penales">P</th>
                    <th className="px-2 py-3 text-center font-medium w-12" title="Partidos">PJ</th>
                    <th className="px-2 py-3 text-center font-medium w-16" title="Promedio">G/PJ</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((scorer, idx) => (
                    <motion.tr
                      key={scorer.athlete.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={clsx(
                        'border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors',
                        scorer.isFavorite && 'bg-pitch-900/15',
                        scorer.rank <= 3 && 'bg-pitch-900/10',
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <span
                          className={clsx(
                            'inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-black',
                            scorer.rank === 1
                              ? 'bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/40'
                              : scorer.rank === 2
                                ? 'bg-slate-300/20 text-slate-200 ring-1 ring-slate-300/40'
                                : scorer.rank === 3
                                  ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/40'
                                  : 'bg-white/5 text-night-300',
                          )}
                        >
                          {scorer.rank}
                        </span>
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {scorer.athlete.headshot ? (
                            <img
                              src={scorer.athlete.headshot}
                              alt={scorer.athlete.name}
                              loading="lazy"
                              className="w-7 h-7 rounded-full object-cover bg-night-700 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-night-700 flex items-center justify-center text-[10px] text-night-300 font-bold shrink-0">
                              {scorer.athlete.shortName.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate">{scorer.athlete.shortName}</div>
                            <div className="text-[10px] text-night-400 truncate">{scorer.athlete.name}</div>
                          </div>
                          {scorer.isFavorite && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-pitch-300 bg-pitch-500/10 rounded px-1.5 py-0.5 shrink-0">
                              ★
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <TeamFlag team={scorer.team} size="xs" />
                          <span className="text-night-200 truncate">{scorer.team.shortName}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-center font-mono font-black text-pitch-300 text-base">
                        {scorer.goals}
                      </td>
                      <td className="px-2 py-2.5 text-center font-mono text-night-200">{scorer.assists}</td>
                      <td className="px-2 py-2.5 text-center font-mono text-night-300">{scorer.penalties || '—'}</td>
                      <td className="px-2 py-2.5 text-center font-mono text-night-200">{scorer.matches}</td>
                      <td className="px-2 py-2.5 text-center font-mono text-night-300 text-xs">
                        {scorer.matches > 0 ? (scorer.goals / scorer.matches).toFixed(2) : '—'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

function Podium({ top }: { top: ReturnType<typeof useTopScorers>['data'] extends (infer U)[] | undefined ? U[] : never }) {
  const order = [top[1], top[0], top[2]];
  const heights = ['h-32', 'h-44', 'h-24'];
  const colors = ['bg-slate-300/10 border-slate-300/30', 'bg-yellow-500/15 border-yellow-500/40', 'bg-orange-500/10 border-orange-500/30'];
  const medals = ['text-slate-300', 'text-yellow-300', 'text-orange-300'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-3 gap-3 items-end"
    >
      {order.map((scorer, idx) => {
        if (!scorer) return null;
        const realIdx = idx;
        return (
          <motion.div
            key={scorer.athlete.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + realIdx * 0.1 }}
            className="flex flex-col items-center"
          >
            <div className="flex flex-col items-center gap-1 mb-2">
              {scorer.athlete.headshot ? (
                <img src={scorer.athlete.headshot} alt={scorer.athlete.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-white/20" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-night-700 flex items-center justify-center text-xl text-night-300 font-bold ring-2 ring-white/20">
                  {scorer.athlete.shortName.charAt(0)}
                </div>
              )}
              <div className="text-center">
                <div className="font-bold text-white text-sm truncate max-w-[120px]">{scorer.athlete.shortName}</div>
                <div className="flex items-center justify-center gap-1 text-[10px] text-night-400 mt-0.5">
                  <TeamFlag team={scorer.team} size="xs" />
                  <span>{scorer.team.abbreviation}</span>
                </div>
              </div>
            </div>
            <div className={clsx('w-full rounded-t-xl border flex flex-col items-center justify-end pb-3 pt-4', heights[realIdx], colors[realIdx])}>
              <Medal className={clsx('w-6 h-6', medals[realIdx])} />
              <div className={clsx('font-display font-black text-3xl tabular-nums mt-1', medals[realIdx])}>{scorer.goals}</div>
              <div className="text-[10px] uppercase tracking-wider text-night-400 mt-1">goles</div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
