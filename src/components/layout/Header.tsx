import { motion } from 'framer-motion';
import { Link, NavLink, useLocation } from 'react-router';
import { Trophy, Calendar, Users, GitBranch, Flag, LayoutDashboard, Radio } from 'lucide-react';
import { clsx } from 'clsx';
import { useEffect, useState } from 'react';

const NAV = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard },
  { to: '/grupos', label: 'Grupos', icon: Flag },
  { to: '/calendario', label: 'Calendario', icon: Calendar },
  { to: '/eliminatorias', label: 'Eliminatorias', icon: GitBranch },
  { to: '/equipos', label: 'Equipos', icon: Users },
] as const;

export function Header() {
  const location = useLocation();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now);

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-night-900/70 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          <Link to="/" className="flex items-center gap-3 focus-ring rounded-lg">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
              className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-pitch-500 to-pitch-700 flex items-center justify-center shadow-lg shadow-pitch-500/20"
            >
              <Trophy className="w-5 h-5 text-white" />
            </motion.div>
            <div className="hidden sm:block">
              <div className="font-display font-black text-lg leading-none tracking-tight">
                MUNDIAL <span className="text-pitch-400">'26</span>
              </div>
              <div className="text-[10px] text-night-400 uppercase tracking-widest mt-0.5">EN VIVO</div>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  clsx(
                    'focus-ring inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-white/10 text-white' : 'text-night-300 hover:text-white hover:bg-white/5',
                  )
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-night-300 font-mono">
              <Radio className="w-3 h-3 text-red-400 animate-pulse" />
              <span>ESPAÑA · {time}</span>
            </div>
          </div>
        </div>

        <nav className="md:hidden flex items-center gap-1 overflow-x-auto pb-2 -mx-1 px-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  isActive ? 'bg-white/10 text-white' : 'text-night-300',
                )
              }
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-pitch-500/40 to-transparent"
      />
      <span className="sr-only">Ruta actual: {location.pathname}</span>
    </header>
  );
}
