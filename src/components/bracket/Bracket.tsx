import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { Bracket } from '@/lib/types';
import { BracketMatchNode, type BracketNodeMatch } from './BracketMatchNode';
import type { Team, MatchStatus } from '@/lib/types';

const ROUND_LABELS = {
  roundOf32: '32avos de final',
  roundOf16: 'Octavos de final',
  quarterfinals: 'Cuartos de final',
  semifinals: 'Semifinales',
  final: 'Final',
  thirdPlace: 'Tercer puesto',
} as const;

export function Bracket({ bracket }: BracketProps) {
  const isKnockoutStarted = bracket.roundOf16.length > 0 || bracket.roundsOf32.length > 0;

  if (!isKnockoutStarted) {
    return (
      <div className="rounded-2xl glass p-12 text-center">
        <Trophy className="w-12 h-12 text-pitch-400 mx-auto mb-4 opacity-60" />
        <h3 className="text-xl font-bold text-white mb-2">La fase eliminatoria aún no comienza</h3>
        <p className="text-sm text-night-300 max-w-md mx-auto">
          El cuadro se mostrará aquí cuando termine la fase de grupos. Los 2 mejores de cada grupo (12 grupos) y los 8 mejores terceros clasificarán a 32avos de final.
        </p>
      </div>
    );
  }

  const toNode = (m: { id: string; status: MatchStatus; home: { team: Team | null; score: number | null }; away: { team: Team | null; score: number | null }; startTimeUtc?: string }): BracketNodeMatch => ({
    id: m.id,
    status: m.status,
    homeTeam: m.home.team,
    awayTeam: m.away.team,
    homeScore: m.home.score,
    awayScore: m.away.score,
  });

  return (
    <div className="space-y-8">
      {bracket.roundsOf32.length > 0 && (
        <BracketRound title={ROUND_LABELS.roundOf32} matches={bracket.roundsOf32.map(toNode)} />
      )}
      {bracket.roundOf16.length > 0 && (
        <BracketRound title={ROUND_LABELS.roundOf16} matches={bracket.roundOf16.map(toNode)} />
      )}
      {bracket.quarterfinals.length > 0 && (
        <BracketRound title={ROUND_LABELS.quarterfinals} matches={bracket.quarterfinals.map(toNode)} />
      )}
      {bracket.semifinals.length > 0 && (
        <BracketRound title={ROUND_LABELS.semifinals} matches={bracket.semifinals.map(toNode)} />
      )}
      <div className="grid md:grid-cols-2 gap-6">
        {bracket.final && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl glass-strong p-6 border-2 border-pitch-500/30 bg-gradient-to-br from-pitch-900/30 to-transparent"
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-pitch-400" />
              <h3 className="text-base font-black text-white uppercase tracking-wider">Final</h3>
            </div>
            <BracketMatchNode match={toNode(bracket.final)} size="md" />
          </motion.div>
        )}
        {bracket.thirdPlace && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl glass p-6"
          >
            <h3 className="text-base font-bold text-night-200 uppercase tracking-wider mb-4">Tercer puesto</h3>
            <BracketMatchNode match={toNode(bracket.thirdPlace)} size="md" />
          </motion.div>
        )}
      </div>
    </div>
  );
}

interface BracketProps {
  bracket: Bracket;
}

interface BracketRoundProps {
  title: string;
  matches: BracketNodeMatch[];
}

function BracketRound({ title, matches }: BracketRoundProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <h3 className="text-xs font-bold text-night-400 uppercase tracking-widest px-1">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {matches.map((match, idx) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
          >
            <BracketMatchNode match={match} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
