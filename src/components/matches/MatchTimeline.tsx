import { motion, AnimatePresence } from 'framer-motion';
import { Goal, AlertTriangle, Square, ArrowLeftRight, Video } from 'lucide-react';
import { clsx } from 'clsx';
import type { MatchEvent, MatchEventType } from '@/lib/types';
import { TeamFlag } from '@/components/teams/TeamFlag';
import { buildTeamFromAbbr } from '@/lib/teams';

const EVENT_CONFIG: Record<MatchEventType, { icon: typeof Goal; color: string; bg: string; ring: string; label: string }> = {
  goal: { icon: Goal, color: 'text-pitch-300', bg: 'bg-pitch-500/20', ring: 'ring-pitch-500/40', label: 'Gol' },
  own_goal: { icon: Goal, color: 'text-red-400', bg: 'bg-red-500/20', ring: 'ring-red-500/40', label: 'Gol en contra' },
  penalty_goal: { icon: Goal, color: 'text-pitch-300', bg: 'bg-pitch-500/20', ring: 'ring-pitch-500/40', label: 'Gol de penal' },
  penalty_missed: { icon: Goal, color: 'text-red-400', bg: 'bg-red-500/10', ring: 'ring-red-500/30', label: 'Penal fallado' },
  yellow_card: { icon: Square, color: 'text-yellow-300', bg: 'bg-yellow-500/15', ring: 'ring-yellow-500/30', label: 'Tarjeta amarilla' },
  red_card: { icon: Square, color: 'text-red-400', bg: 'bg-red-500/20', ring: 'ring-red-500/40', label: 'Roja directa' },
  substitution: { icon: ArrowLeftRight, color: 'text-night-200', bg: 'bg-white/5', ring: 'ring-white/10', label: 'Cambio' },
  var: { icon: Video, color: 'text-cyan-300', bg: 'bg-cyan-500/15', ring: 'ring-cyan-500/30', label: 'VAR' },
  other: { icon: AlertTriangle, color: 'text-night-300', bg: 'bg-white/5', ring: 'ring-white/10', label: 'Evento' },
};

interface MatchTimelineProps {
  events: MatchEvent[];
  homeAbbr: string;
  awayAbbr: string;
}

export function MatchTimeline({ events, homeAbbr, awayAbbr }: MatchTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-2xl glass p-8 text-center text-night-300 text-sm">
        Aún no hay eventos registrados en este partido.
      </div>
    );
  }

  const homeTeam = buildTeamFromAbbr(homeAbbr, `team-${homeAbbr}`);
  const awayTeam = buildTeamFromAbbr(awayAbbr, `team-${awayAbbr}`);

  const sorted = [...events].sort((a, b) => a.minute - b.minute);

  return (
    <div className="relative space-y-2">
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
      <AnimatePresence initial={false}>
        {sorted.map((event, idx) => {
          const isHome = event.teamAbbr.toUpperCase() === homeAbbr.toUpperCase();
          const config = EVENT_CONFIG[event.type];
          const Icon = config.icon;
          const team = isHome ? homeTeam : awayTeam;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: idx * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
              className={clsx(
                'relative grid grid-cols-[1fr_auto_1fr] items-center gap-3',
                event.type === 'goal' || event.type === 'penalty_goal' || event.type === 'own_goal' ? 'py-2' : 'py-1.5',
              )}
            >
              {isHome ? <EventSide event={event} team={team} config={config} align="right" /> : <div />}

              <div className={clsx('relative z-10 flex flex-col items-center gap-1')}>
                <div className={clsx('w-9 h-9 rounded-full ring-2 flex items-center justify-center', config.bg, config.ring)}>
                  <Icon className={clsx('w-4 h-4', config.color)} />
                </div>
                <div className={clsx('text-[10px] font-mono font-bold tabular-nums', config.color)}>
                  {event.displayMinute}
                </div>
              </div>

              {!isHome ? <EventSide event={event} team={team} config={config} align="left" /> : <div />}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

interface EventSideProps {
  event: MatchEvent;
  team: import('@/lib/types').Team;
  config: typeof EVENT_CONFIG[MatchEventType];
  align: 'left' | 'right';
}

function EventSide({ event, team, config, align }: EventSideProps) {
  return (
    <div className={clsx('flex items-center gap-2 min-w-0', align === 'right' ? 'justify-end flex-row-reverse text-right' : 'text-left')}>
      <div className="min-w-0">
        <div className={clsx('flex items-center gap-1.5', align === 'right' ? 'justify-end' : '')}>
          <TeamFlag team={team} size="xs" />
          <span className="text-[11px] font-bold text-white uppercase tracking-wider">{team.abbreviation}</span>
        </div>
        <div className="text-[11px] text-night-300 mt-0.5">{config.label}</div>
        {event.athletes.length > 0 && (
          <div className={clsx('text-xs text-white font-semibold truncate mt-0.5', align === 'right' ? 'text-right' : '')}>
            {event.athletes.map((a) => a.shortName).join(', ')}
          </div>
        )}
        {event.scoreAfter && (
          <div className={clsx('text-[10px] text-night-400 font-mono tabular-nums mt-0.5')}>
            {event.scoreAfter}
          </div>
        )}
      </div>
    </div>
  );
}
