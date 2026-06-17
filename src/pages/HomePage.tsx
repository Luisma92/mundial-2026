import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { ChevronRight, MapPin, Calendar as CalendarIcon, Trophy, Star } from 'lucide-react';
import { clsx } from 'clsx';
import { useLiveMatches, useTodayMatches, useMatches } from '@/hooks/useWorldCup';
import { MatchCard } from '@/components/matches/MatchCard';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { TeamFlag } from '@/components/teams/TeamFlag';
import { buildTeamFromAbbr } from '@/lib/teams';
import { TOURNAMENT } from '@/lib/constants';
import { useFavorites } from '@/lib/favorites';

export function HomePage() {
  const liveQ = useLiveMatches();
  const todayQ = useTodayMatches();
  const allQ = useMatches();
  const { favoriteList, isFavorite, count: favCount } = useFavorites();

  const liveMatches = liveQ.data ?? [];
  const todayMatches = todayQ.data ?? [];
  const allMatches = allQ.data ?? [];
  const favMatches = allMatches.filter((m) => isFavorite(m.home.team.abbreviation) || isFavorite(m.away.team.abbreviation));
  const upcoming = allMatches.filter((m) => m.status === 'scheduled').slice(0, 6);

  return (
    <div className="space-y-12">
      <Hero />

      {favCount === 0 ? (
        <FavoritesEmptyState />
      ) : (
        <FavoriteTeamsSection favorites={favoriteList} />
      )}

      {favCount > 0 && favMatches.length > 0 && (
        <section className="space-y-4">
          <SectionHeader
            title="Partidos de tus selecciones"
            subtitle={`${favMatches.length} partidos en todo el torneo`}
            link={{ to: '/calendario', label: 'Filtrar por favoritas' }}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {favMatches
              .filter((m) => m.status === 'in_progress' || m.status === 'scheduled' || (m.status === 'final' && Date.now() - m.startTimestamp < 1000 * 60 * 60 * 24 * 3))
              .slice(0, 6)
              .map((match, idx) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <MatchCard match={match} />
                </motion.div>
              ))}
          </div>
        </section>
      )}

      {liveQ.isLoading ? (
        <SectionSkeleton title="EN VIVO" icon={Trophy} />
      ) : liveQ.isError ? (
        <ErrorState title="No se pudo cargar" message={(liveQ.error as Error).message} onRetry={() => liveQ.refetch()} />
      ) : liveMatches.length === 0 ? (
        <EmptyLiveBanner />
      ) : (
        <section className="space-y-4">
          <SectionHeader title="EN VIVO AHORA" subtitle="Partidos en directo" accent />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {liveMatches.map((match, idx) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <MatchCard match={match} variant="featured" />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <SectionHeader
          title="Hoy"
          subtitle={new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' }).format(new Date())}
          link={{ to: '/calendario', label: 'Ver calendario completo' }}
        />
        {todayQ.isLoading ? (
          <div className="rounded-2xl glass p-6"><Spinner label="Cargando partidos de hoy..." /></div>
        ) : todayQ.isError ? (
          <ErrorState message={(todayQ.error as Error).message} onRetry={() => todayQ.refetch()} />
        ) : todayMatches.length === 0 ? (
          <div className="rounded-2xl glass p-8 text-center">
            <CalendarIcon className="w-10 h-10 text-night-400 mx-auto mb-3 opacity-60" />
            <p className="text-night-300">No hay partidos programados para hoy.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {todayMatches.map((match, idx) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <MatchCard match={match} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {upcoming.length > 0 && (
        <section className="space-y-4">
          <SectionHeader title="Próximos partidos" subtitle="Lo que viene en el torneo" link={{ to: '/calendario', label: 'Todos los partidos' }} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {upcoming.map((match, idx) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
              >
                <MatchCard match={match} />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Hero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl pitch-pattern border border-white/5"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-night-900/80 via-night-900/40 to-night-900/80" />
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-pitch-500/20 blur-3xl animate-pulse" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-spain-500/15 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-argentina-500/10 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative px-6 sm:px-12 py-12 md:py-20 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full glass-strong text-xs font-bold uppercase tracking-widest text-pitch-300"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-pitch-400 animate-pulse" />
          Fase de grupos en curso
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="font-display font-black text-5xl sm:text-7xl md:text-8xl tracking-tighter leading-none"
        >
          <span className="text-gradient-pitch">MUNDIAL</span>{' '}
          <span className="text-white">2026</span>
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-base sm:text-lg text-night-200 max-w-2xl mx-auto"
        >
          {TOURNAMENT.teams} selecciones · {TOURNAMENT.groups} grupos · 3 sedes · 1 Copa
          <br />
          <span className="text-night-400 text-sm">{TOURNAMENT.hostCountries.join(' · ')}</span>
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link to="/grupos" className="btn btn-primary px-5 py-2.5">
            <Trophy className="w-4 h-4" />
            Ver grupos
          </Link>
          <Link to="/eliminatorias" className="btn btn-ghost border border-white/10 px-5 py-2.5">
            <ChevronRight className="w-4 h-4" />
            Cuadro eliminatorio
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-night-400 uppercase tracking-widest"
        >
          <span className="inline-flex items-center gap-1.5">
            <CalendarIcon className="w-3 h-3" /> 11 jun — 19 jul
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> 16 ciudades
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Trophy className="w-3 h-3" /> 104 partidos
          </span>
        </motion.div>
      </div>
    </motion.section>
  );
}

function FavoriteTeamsSection({ favorites }: { favorites: readonly string[] }) {
  const teams = favorites.map((abbr) => buildTeamFromAbbr(abbr, `fav-${abbr}`));
  return (
    <section className="space-y-4">
      <SectionHeader
        title="Mis selecciones"
        subtitle={`${teams.length} ${teams.length === 1 ? 'favorita' : 'favoritas'} seguidas`}
        accent
        link={{ to: '/equipos', label: 'Editar favoritas' }}
      />
      <div className={clsx(
        'grid gap-4',
        teams.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2',
        teams.length >= 3 ? 'lg:grid-cols-3' : '',
      )}>
        {teams.map((team, idx) => (
          <motion.div
            key={team.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + idx * 0.05 }}
          >
            <Link
              to={`/equipos/${team.abbreviation.toLowerCase()}`}
              className="block relative overflow-hidden rounded-2xl border border-pitch-500/30 hover:border-pitch-500/60 transition-colors group focus-ring glass-strong"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pitch-500/15 via-transparent to-transparent opacity-70 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6 sm:p-8 flex items-center gap-6">
                <TeamFlag team={team} size="2xl" showRing ringColor={team.color} />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-pitch-300 mb-1 inline-flex items-center gap-1.5">
                    <Star className="w-3 h-3 fill-current" />
                    Tu favorita
                  </div>
                  <h2 className="font-display font-black text-3xl sm:text-4xl text-white leading-none">
                    {team.name}
                  </h2>
                </div>
                <ChevronRight className="w-6 h-6 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FavoritesEmptyState() {
  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl glass-strong p-8 sm:p-10 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-pitch-500/8 via-transparent to-argentina-500/8 pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div className="w-16 h-16 rounded-2xl bg-pitch-500/20 flex items-center justify-center shrink-0">
          <Star className="w-8 h-8 text-pitch-300" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-display font-black text-white">Personalizá tu Mundial</h2>
          <p className="text-sm text-night-300 mt-1 max-w-2xl">
            Elegí las selecciones que querés seguir y te resaltamos sus partidos, te filtramos el calendario, los
            destacamos en los grupos y los goleadores, y te mandamos push cuando juegan.
          </p>
        </div>
        <Link to="/equipos" className="btn btn-primary px-5 py-2.5 shrink-0">
          <Star className="w-4 h-4" />
          Elegir favoritas
        </Link>
      </div>
    </motion.section>
  );
}

function EmptyLiveBanner() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl glass p-8 text-center"
    >
      <div className="inline-flex items-center gap-2 text-night-300 text-sm">
        <span className="w-2 h-2 rounded-full bg-night-500" />
        No hay partidos en vivo en este momento. El próximo partido aparecerá aquí cuando arranque.
      </div>
    </motion.div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  link?: { to: string; label: string };
  accent?: boolean;
}

function SectionHeader({ title, subtitle, link, accent }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-4 border-b border-white/5 pb-3">
      <div>
        <h2 className={accent ? 'text-2xl font-display font-black text-gradient-pitch uppercase tracking-tight' : 'text-2xl font-display font-black text-white'}>
          {title}
        </h2>
        {subtitle && <p className="text-xs text-night-400 uppercase tracking-widest mt-0.5">{subtitle}</p>}
      </div>
      {link && (
        <Link to={link.to} className="text-xs text-night-300 hover:text-white inline-flex items-center gap-1 transition-colors shrink-0">
          {link.label}
          <ChevronRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}

function SectionSkeleton({ title, icon: Icon }: { title: string; icon: typeof Trophy }) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between border-b border-white/5 pb-3">
        <h2 className="text-2xl font-display font-black text-gradient-pitch uppercase tracking-tight inline-flex items-center gap-2">
          <Icon className="w-6 h-6" />
          {title}
        </h2>
      </div>
      <div className="rounded-2xl glass p-6">
        <Spinner label="Buscando partidos en vivo..." />
      </div>
    </section>
  );
}
