import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { Group } from '@/lib/types';
import { TeamFlag } from '@/components/teams/TeamFlag';

interface GroupTableProps {
  group: Group;
}

export function GroupTable({ group }: GroupTableProps) {
  return (
    <div className="rounded-2xl glass overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-pitch-900/40 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pitch-500/20 text-pitch-300 flex items-center justify-center font-black">
            {group.letter}
          </div>
          <h3 className="text-base font-bold text-white">{group.name}</h3>
        </div>
        <span className="text-[10px] text-night-400 uppercase tracking-wider hidden sm:block">
          {group.standings.length} equipos
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] uppercase tracking-wider text-night-400 border-b border-white/5">
              <th className="px-3 py-2 text-left font-medium w-8">#</th>
              <th className="px-2 py-2 text-left font-medium">Equipo</th>
              <th className="px-2 py-2 text-center font-medium w-8" title="Jugados">PJ</th>
              <th className="px-2 py-2 text-center font-medium w-8" title="Ganados">G</th>
              <th className="px-2 py-2 text-center font-medium w-8" title="Empatados">E</th>
              <th className="px-2 py-2 text-center font-medium w-8" title="Perdidos">P</th>
              <th className="px-2 py-2 text-center font-medium w-12" title="Goles a favor">GF</th>
              <th className="px-2 py-2 text-center font-medium w-12" title="Goles en contra">GC</th>
              <th className="px-2 py-2 text-center font-medium w-10" title="Diferencia">DIF</th>
              <th className="px-3 py-2 text-center font-medium w-10 text-pitch-300" title="Puntos">PTS</th>
            </tr>
          </thead>
          <tbody>
            {group.standings.map((standing, idx) => (
              <motion.tr
                key={standing.team.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={clsx(
                  'border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors group',
                  standing.position <= 2 && 'bg-pitch-900/10',
                  standing.position === 3 && 'bg-spain-900/10',
                  standing.position === 4 && 'bg-argentina-900/10',
                )}
              >
                <td className="px-3 py-2.5">
                  <span
                    className={clsx(
                      'inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold',
                      standing.position <= 2
                        ? 'bg-pitch-500/20 text-pitch-300'
                        : 'bg-white/5 text-night-300',
                    )}
                  >
                    {standing.position}
                  </span>
                </td>
                <td className="px-2 py-2.5">
                  <Link
                    to={`/equipos/${standing.team.abbreviation.toLowerCase()}`}
                    className="flex items-center gap-2.5 min-w-0 focus-ring rounded-md"
                  >
                    <TeamFlag
                      team={standing.team}
                      size="sm"
                      showRing={standing.team.isFavorite}
                      ringColor={standing.team.color}
                    />
                    <span className="font-medium text-white truncate">{standing.team.shortName}</span>
                    {standing.team.isFavorite && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-pitch-300 bg-pitch-500/10 rounded px-1.5 py-0.5">
                        ★
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-2 py-2.5 text-center font-mono text-night-200">{standing.played}</td>
                <td className="px-2 py-2.5 text-center font-mono text-night-200">{standing.won}</td>
                <td className="px-2 py-2.5 text-center font-mono text-night-200">{standing.drawn}</td>
                <td className="px-2 py-2.5 text-center font-mono text-night-200">{standing.lost}</td>
                <td className="px-2 py-2.5 text-center font-mono text-night-200">{standing.goalsFor}</td>
                <td className="px-2 py-2.5 text-center font-mono text-night-200">{standing.goalsAgainst}</td>
                <td
                  className={clsx(
                    'px-2 py-2.5 text-center font-mono font-semibold',
                    standing.goalDifference > 0 ? 'text-pitch-300' : standing.goalDifference < 0 ? 'text-red-400' : 'text-night-300',
                  )}
                >
                  {standing.goalDifference > 0 ? '+' : ''}
                  {standing.goalDifference}
                </td>
                <td className="px-3 py-2.5 text-center font-mono font-black text-pitch-300">{standing.points}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2.5 border-t border-white/5 flex items-center gap-4 text-[10px] text-night-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-pitch-500/40 border border-pitch-500/60" />
          Clasifican a 16avos
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-spain-500/40 border border-spain-500/60" />
          Repesca
        </span>
        <ChevronRight className="w-3 h-3 ml-auto opacity-50 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}
