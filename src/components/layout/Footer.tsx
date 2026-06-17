import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-night-400">
          <div className="flex items-center gap-2">
            <span>Hecho con</span>
            <Heart className="w-3 h-3 text-red-500 fill-red-500" />
            <span>para el Mundial 2026</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Datos: ESPN vía n8n · {new Date().getFullYear()}</span>
            <span className="inline-flex items-center gap-1 text-night-500">v0.1.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
