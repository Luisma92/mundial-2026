import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Trophy, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { Group } from '@/lib/types';
import { TeamFlag } from '@/components/teams/TeamFlag';
import { loadPredictions, setGroupPrediction, clearGroupPrediction } from '@/lib/predictions';
import { useFavorites } from '@/lib/favorites';

interface GroupPredictionPanelProps {
  group: Group;
}

export function GroupPredictionPanel({ group }: GroupPredictionPanelProps) {
  const [, setRefresh] = useState(0);
  const predictions = loadPredictions();
  const pred = predictions.groups[group.letter];
  const actual = group.standings.slice(0, 2).map((s) => s.team.abbreviation.toUpperCase());

  const handlePick = (position: 'first' | 'second', abbr: string) => {
    setGroupPrediction(group.letter, position, abbr);
    setRefresh((r) => r + 1);
  };

  const handleClear = () => {
    clearGroupPrediction(group.letter);
    setRefresh((r) => r + 1);
  };

  const firstPick = pred?.first;
  const secondPick = pred?.second;

  return (
    <div className="rounded-2xl glass overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-pitch-900/40 to-transparent">
        <div className="flex items-center gap-3">
          <Trophy className="w-4 h-4 text-pitch-400" />
          <div className="text-xs text-night-300 uppercase tracking-widest">Tu predicción</div>
        </div>
        {(firstPick || secondPick) && (
          <button
            onClick={handleClear}
            className="text-[10px] uppercase tracking-wider text-night-400 hover:text-red-400 inline-flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Limpiar
          </button>
        )}
      </div>

      <div className="p-4 grid grid-cols-2 gap-3">
        <PositionPicker
          position="first"
          label="1° clasificado"
          color="border-pitch-500/40 bg-pitch-500/5"
          selected={firstPick}
          actual={actual[0]}
          teams={group.standings.map((s) => s.team)}
          onPick={(abbr) => handlePick('first', abbr)}
        />
        <PositionPicker
          position="second"
          label="2° clasificado"
          color="border-night-500/40 bg-white/5"
          selected={secondPick}
          actual={actual[1]}
          teams={group.standings.map((s) => s.team)}
          onPick={(abbr) => handlePick('second', abbr)}
        />
      </div>
    </div>
  );
}

interface PositionPickerProps {
  position: 'first' | 'second';
  label: string;
  color: string;
  selected: string | undefined;
  actual: string | undefined;
  teams: import('@/lib/types').Team[];
  onPick: (abbr: string) => void;
}

function PositionPicker({ label, color, selected, actual, teams, onPick }: PositionPickerProps) {
  const [open, setOpen] = useState(false);
  const { isFavorite } = useFavorites();
  const selectedTeam = teams.find((t) => t.abbreviation.toUpperCase() === selected?.toUpperCase());
  const isCorrect = selected && actual && selected.toUpperCase() === actual.toUpperCase();
  const hasActual = !!actual;
  const showResult = hasActual && !!selected;

  return (
    <div className={clsx('rounded-xl border p-3', color)}>
      <div className="text-[10px] uppercase tracking-widest text-night-400 mb-2">{label}</div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] p-2 transition-colors focus-ring"
      >
        {selectedTeam ? (
          <>
            <TeamFlag team={selectedTeam} size="sm" />
            <span className="text-sm font-bold text-white truncate flex-1 text-left">{selectedTeam.shortName}</span>
            {showResult && (
              <AnimatePresence>
                {isCorrect ? (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pitch-500 text-white"
                  >
                    <Check className="w-3 h-3" />
                  </motion.span>
                ) : (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/30 text-red-300"
                  >
                    <X className="w-3 h-3" />
                  </motion.span>
                )}
              </AnimatePresence>
            )}
          </>
        ) : (
          <span className="text-sm text-night-400">Elegir equipo...</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-1 max-h-56 overflow-y-auto">
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    onPick(t.abbreviation);
                    setOpen(false);
                  }}
                  className={clsx(
                    'w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
                    selected?.toUpperCase() === t.abbreviation.toUpperCase()
                      ? 'bg-pitch-500/20 text-pitch-200'
                      : 'hover:bg-white/5 text-night-100',
                  )}
                >
                  <TeamFlag team={t} size="xs" />
                  <span className="flex-1 truncate">{t.shortName}</span>
                  {isFavorite(t.abbreviation) && <span className="text-[10px] text-pitch-300">★</span>}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showResult && !isCorrect && actual && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-[10px] text-night-400"
        >
          Clasificó: <span className="text-white font-semibold">{teams.find((t) => t.abbreviation.toUpperCase() === actual)?.shortName ?? actual}</span>
        </motion.div>
      )}
    </div>
  );
}
