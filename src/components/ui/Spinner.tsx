import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  className?: string;
  label?: string;
}

export function Spinner({ className, label }: SpinnerProps) {
  return (
    <div className={clsx('flex items-center justify-center gap-2 text-night-300', className)}>
      <Loader2 className="w-4 h-4 animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
