import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface ScoreDisplayProps {
  home: number;
  away: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  highlight?: boolean;
}

const SIZE_MAP = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-5xl md:text-6xl',
  xl: 'text-6xl md:text-7xl',
  hero: 'text-7xl md:text-8xl',
} as const;

export function ScoreDisplay({ home, away, size = 'md', highlight }: ScoreDisplayProps) {
  return (
    <div className={clsx('flex items-center justify-center gap-3 font-mono font-black tabular-nums leading-none', SIZE_MAP[size])}>
      <ScoreNumber value={home} highlight={highlight} />
      <span className="text-night-400 -mx-1">:</span>
      <ScoreNumber value={away} highlight={highlight} />
    </div>
  );
}

function ScoreNumber({ value, highlight }: { value: number; highlight?: boolean }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ y: -12, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 12, opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
        className={clsx(
          'inline-block min-w-[0.7em] text-center',
          highlight ? 'text-pitch-300' : 'text-white',
        )}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}
