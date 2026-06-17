import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Sparkles, Target } from 'lucide-react';
import { Link } from 'react-router';
import { useStandings } from '@/hooks/useWorldCup';
import { GroupTable } from '@/components/groups/GroupTable';
import { GroupPredictionPanel } from '@/components/groups/GroupPredictionPanel';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { clsx } from 'clsx';
import type { Group } from '@/lib/types';
import { loadPredictions, getPredictionScore } from '@/lib/predictions';

export function GroupsPage() {
  const { data, isLoading, isError, error, refetch } = useStandings();
  const [search, setSearch] = useState('');
  const [, setRefresh] = useState(0);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const q = search.trim().toLowerCase();
    return data
      .map((group) => ({
        ...group,
        standings: group.standings.filter((s) =>
          s.team.name.toLowerCase().includes(q) || s.team.shortName.toLowerCase().includes(q) || s.team.abbreviation.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.standings.length > 0);
  }, [data, search]);

  const predictions = useMemo(() => loadPredictions(), [data]);
  const score = useMemo(() => getPredictionScore(data ?? [], null, predictions), [data, predictions]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-4xl font-display font-black tracking-tight">
            <span className="text-gradient-pitch">Grupos</span>
          </h1>
          <p className="text-sm text-night-400 mt-1">
            12 grupos · 48 selecciones · Clasifican los 2 primeros + 8 mejores terceros a 32avos
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-night-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar equipo..."
            className="w-full rounded-xl bg-white/[0.04] border border-white/10 pl-10 pr-3 py-2.5 text-sm placeholder:text-night-500 focus:outline-none focus:ring-2 focus:ring-pitch-400 focus:bg-white/[0.06]"
          />
        </div>
      </header>

      <PredictionBanner score={score} onRefresh={() => setRefresh((r) => r + 1)} />

      {isLoading ? (
        <div className="rounded-2xl glass p-12"><Spinner label="Cargando posiciones..." /></div>
      ) : isError ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {filtered.map((group, idx) => (
            <motion.div
              key={group.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="space-y-3"
            >
              <GroupTable group={group as Group} />
              <GroupPredictionPanel group={group as Group} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {filtered.length === 0 && !isLoading && !isError && (
        <div className={clsx('rounded-2xl glass p-8 text-center text-night-300 text-sm')}>
          No se encontraron equipos con "{search}".
        </div>
      )}
    </div>
  );
}

function PredictionBanner({ score, onRefresh }: { score: ReturnType<typeof getPredictionScore>; onRefresh: () => void }) {
  const totalPredicted = score.details.groupTotal + score.details.bracketTotal;
  const totalCorrect = score.totalCorrect;
  const accuracy = totalPredicted > 0 ? Math.round((totalCorrect / totalPredicted) * 100) : 0;

  return (
    <motion.div
      onClick={onRefresh}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl glass-strong p-5 sm:p-6 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-pitch-500/5 via-transparent to-argentina-500/5 pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-pitch-500/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-pitch-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-display font-black text-white">Bracket Challenge</h2>
              <span className="chip bg-pitch-500/15 text-pitch-300">Activo</span>
            </div>
            <p className="text-xs text-night-400 mt-0.5">
              Predecí los 2 clasificados de cada grupo · se califica automáticamente cuando termine la fase de grupos
            </p>
          </div>
        </div>
        {totalPredicted > 0 ? (
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-widest text-night-400">Aciertos</div>
              <div className="font-mono font-black text-2xl text-pitch-300">{totalCorrect}/{totalPredicted}</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-widest text-night-400">%</div>
              <div className="font-mono font-black text-2xl text-white">{accuracy}%</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-widest text-night-400">Puntos</div>
              <div className="font-mono font-black text-2xl text-yellow-300">{score.groupPoints + score.bracketPoints}</div>
            </div>
          </div>
        ) : (
          <Link to="/eliminatorias" className="text-xs text-pitch-300 hover:text-pitch-200 inline-flex items-center gap-1">
            <Target className="w-3 h-3" />
            Ver cuadro eliminatorio
          </Link>
        )}
      </div>
    </motion.div>
  );
}
