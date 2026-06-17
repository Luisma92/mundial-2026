import { motion } from 'framer-motion';
import { Trophy, Sparkles, Trophy as TrophyIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { Bracket } from '@/lib/types';
import { BracketMatchNode, type BracketNodeMatch } from './BracketMatchNode';
import type { Team, MatchStatus } from '@/lib/types';
import { loadPredictions, setBracketPrediction, clearAllPredictions, getPredictionScore } from '@/lib/predictions';
import { useStandings } from '@/hooks/useWorldCup';
import { clsx } from 'clsx';

const ROUND_LABELS = {
  roundOf32: '32avos de final',
  roundOf16: 'Octavos de final',
  quarterfinals: 'Cuartos de final',
  semifinals: 'Semifinales',
  final: 'Final',
  thirdPlace: 'Tercer puesto',
} as const;

export function Bracket({ bracket }: BracketProps) {
  const [, setRefresh] = useState(0);
  const predictions = useMemo(() => loadPredictions(), []);
  const standingsQ = useStandings();
  const score = useMemo(
    () => getPredictionScore(standingsQ.data ?? [], bracket, predictions),
    [standingsQ.data, bracket, predictions],
  );

  const isKnockoutStarted = bracket.roundOf16.length > 0 || bracket.roundsOf32.length > 0;
  const hasAnyPrediction = Object.keys(predictions.bracket).length > 0;

  const handlePredict = (matchId: string, abbr: string) => {
    setBracketPrediction(matchId, abbr);
    setRefresh((r) => r + 1);
  };

  const toNode = (m: { id: string; status: MatchStatus; home: { team: Team | null; score: number | null }; away: { team: Team | null; score: number | null }; startTimeUtc?: string }): BracketNodeMatch => ({
    id: m.id,
    status: m.status,
    homeTeam: m.home.team,
    awayTeam: m.away.team,
    homeScore: m.home.score,
    awayScore: m.away.score,
  });

  if (!isKnockoutStarted) {
    return (
      <div className="space-y-6">
        <PredictionSummary
          groupCorrect={score.details.groupCorrect}
          groupTotal={score.details.groupTotal}
          bracketCorrect={score.details.bracketCorrect}
          bracketTotal={score.details.bracketTotal}
          points={score.groupPoints + score.bracketPoints}
          onClear={hasAnyPrediction ? () => { clearAllPredictions(); setRefresh((r) => r + 1); } : undefined}
        />
        <div className="rounded-2xl glass p-12 text-center">
          <Trophy className="w-12 h-12 text-pitch-400 mx-auto mb-4 opacity-60" />
          <h3 className="text-xl font-bold text-white mb-2">La fase eliminatoria aún no comienza</h3>
          <p className="text-sm text-night-300 max-w-md mx-auto">
            El cuadro se mostrará aquí cuando termine la fase de grupos. Los 2 mejores de cada grupo (12 grupos) y los 8 mejores terceros clasificarán a 32avos de final.
          </p>
          <p className="text-xs text-night-400 mt-4">
            💡 Mientras tanto, podés predecir los clasificados de cada grupo en la pestaña <strong>Grupos</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PredictionSummary
        groupCorrect={score.details.groupCorrect}
        groupTotal={score.details.groupTotal}
        bracketCorrect={score.details.bracketCorrect}
        bracketTotal={score.details.bracketTotal}
        points={score.groupPoints + score.bracketPoints}
        onClear={hasAnyPrediction ? () => { clearAllPredictions(); setRefresh((r) => r + 1); } : undefined}
      />

      {bracket.roundsOf32.length > 0 && (
        <BracketRound title={ROUND_LABELS.roundOf32} matches={bracket.roundsOf32.map(toNode)} predictions={predictions.bracket} onPredict={handlePredict} />
      )}
      {bracket.roundOf16.length > 0 && (
        <BracketRound title={ROUND_LABELS.roundOf16} matches={bracket.roundOf16.map(toNode)} predictions={predictions.bracket} onPredict={handlePredict} />
      )}
      {bracket.quarterfinals.length > 0 && (
        <BracketRound title={ROUND_LABELS.quarterfinals} matches={bracket.quarterfinals.map(toNode)} predictions={predictions.bracket} onPredict={handlePredict} />
      )}
      {bracket.semifinals.length > 0 && (
        <BracketRound title={ROUND_LABELS.semifinals} matches={bracket.semifinals.map(toNode)} predictions={predictions.bracket} onPredict={handlePredict} />
      )}
      <div className="grid md:grid-cols-2 gap-6">
        {bracket.final && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl glass-strong p-6 border-2 border-pitch-500/30 bg-gradient-to-br from-pitch-900/30 to-transparent"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrophyIcon className="w-5 h-5 text-pitch-400" />
              <h3 className="text-base font-black text-white uppercase tracking-wider">Final</h3>
            </div>
            <BracketMatchNode
              match={toNode(bracket.final)}
              size="md"
              predictionAbbr={predictions.bracket[bracket.final.id]?.winnerAbbr}
              onPredict={(abbr) => handlePredict(bracket.final!.id, abbr)}
              showPredictionControls
            />
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
            <BracketMatchNode
              match={toNode(bracket.thirdPlace)}
              size="md"
              predictionAbbr={predictions.bracket[bracket.thirdPlace.id]?.winnerAbbr}
              onPredict={(abbr) => handlePredict(bracket.thirdPlace!.id, abbr)}
              showPredictionControls
            />
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
  predictions: Record<string, { matchId: string; winnerAbbr: string }>;
  onPredict: (matchId: string, abbr: string) => void;
}

function BracketRound({ title, matches, predictions, onPredict }: BracketRoundProps) {
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
            <BracketMatchNode
              match={match}
              predictionAbbr={predictions[match.id]?.winnerAbbr}
              onPredict={(abbr) => onPredict(match.id, abbr)}
              showPredictionControls
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

interface PredictionSummaryProps {
  groupCorrect: number;
  groupTotal: number;
  bracketCorrect: number;
  bracketTotal: number;
  points: number;
  onClear?: () => void;
}

function PredictionSummary({ groupCorrect, groupTotal, bracketCorrect, bracketTotal, points, onClear }: PredictionSummaryProps) {
  const totalPredicted = groupTotal + bracketTotal;
  if (totalPredicted === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl glass-strong p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-pitch-500/5 pointer-events-none" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6 text-yellow-300" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-display font-black text-white">Bracket Challenge</h2>
            <p className="text-xs text-night-400 mt-0.5">
              Elegí el ganador de cada partido haciendo click abajo. Cada acierto en grupos suma 1 punto, en eliminatorias 3.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }
  const accuracy = totalPredicted > 0 ? Math.round(((groupCorrect + bracketCorrect) / totalPredicted) * 100) : 0;
  return (
    <motion.div
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
            <h2 className="text-base font-display font-black text-white">Tus predicciones</h2>
            <p className="text-xs text-night-400 mt-0.5">
              {groupCorrect}/{groupTotal} grupos · {bracketCorrect}/{bracketTotal} eliminatorias
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-night-400">%</div>
            <div className={clsx('font-mono font-black text-2xl', accuracy >= 50 ? 'text-pitch-300' : 'text-white')}>{accuracy}%</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-night-400">Puntos</div>
            <div className="font-mono font-black text-2xl text-yellow-300">{points}</div>
          </div>
          {onClear && (
            <button onClick={onClear} className="text-[10px] uppercase tracking-wider text-night-400 hover:text-red-400 px-2 py-1">
              Limpiar todo
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}