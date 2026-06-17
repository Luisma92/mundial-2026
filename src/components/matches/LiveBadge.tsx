import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';
import { clsx } from 'clsx';

interface LiveBadgeProps {
  minute?: number;
  clock?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function LiveBadge({ minute, clock, size = 'sm', className }: LiveBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-wider',
        'bg-red-500 text-white',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        className,
      )}
      style={{
        boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)',
        animation: 'pulse-live 1.6s ease-in-out infinite',
      }}
    >
      <Radio className={clsx(size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
      <span>EN VIVO</span>
      {(minute ?? 0) > 0 && <span className="opacity-90">{minute}'</span>}
      {clock && <span className="opacity-90">{clock}</span>}
    </motion.div>
  );
}
