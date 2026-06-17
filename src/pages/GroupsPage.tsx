import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useStandings } from '@/hooks/useWorldCup';
import { GroupTable } from '@/components/groups/GroupTable';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { clsx } from 'clsx';
import type { Group } from '@/lib/types';

export function GroupsPage() {
  const { data, isLoading, isError, error, refetch } = useStandings();
  const [search, setSearch] = useState('');

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
            >
              <GroupTable group={group as Group} />
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
