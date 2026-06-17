import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { useBracket } from '@/hooks/useWorldCup';
import { Bracket } from '@/components/bracket/Bracket';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';

export function BracketPage() {
  const { data, isLoading, isError, error, refetch } = useBracket();

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="w-5 h-5 text-pitch-400" />
            <span className="text-xs text-night-400 uppercase tracking-widest">Fase eliminatoria</span>
          </div>
          <h1 className="text-4xl font-display font-black tracking-tight">
            <span className="text-gradient-pitch">Cuadro</span> del torneo
          </h1>
          <p className="text-sm text-night-400 mt-1">
            32avos → Octavos → Cuartos → Semis → <span className="text-pitch-300 font-bold">Final</span>
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="rounded-2xl glass p-12"><Spinner label="Cargando cuadro eliminatorio..." /></div>
      ) : isError ? (
        <ErrorState message={(error as Error).message} onRetry={() => refetch()} />
      ) : data ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Bracket bracket={data} />
        </motion.div>
      ) : null}
    </div>
  );
}
