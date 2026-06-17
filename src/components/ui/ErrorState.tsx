import { AlertTriangle, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = 'Algo salió mal', message, onRetry, className }: ErrorStateProps) {
  return (
    <div className={clsx('rounded-2xl glass border-red-500/20 p-6 text-center', className)}>
      <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
      <h3 className="text-white font-semibold mb-1">{title}</h3>
      <p className="text-sm text-night-300 mb-4 max-w-md mx-auto">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary">
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </button>
      )}
    </div>
  );
}
