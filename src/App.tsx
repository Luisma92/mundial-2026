import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useN8nFavoritesSync } from '@/lib/n8nSync';

const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const GroupsPage = lazy(() => import('@/pages/GroupsPage').then((m) => ({ default: m.GroupsPage })));
const CalendarPage = lazy(() => import('@/pages/CalendarPage').then((m) => ({ default: m.CalendarPage })));
const BracketPage = lazy(() => import('@/pages/BracketPage').then((m) => ({ default: m.BracketPage })));
const TeamsPage = lazy(() => import('@/pages/TeamsPage').then((m) => ({ default: m.TeamsPage })));
const TeamDetailPage = lazy(() => import('@/pages/TeamDetailPage').then((m) => ({ default: m.TeamDetailPage })));
const MatchDetailPage = lazy(() => import('@/pages/MatchDetailPage').then((m) => ({ default: m.MatchDetailPage })));
const TopScorersPage = lazy(() => import('@/pages/TopScorersPage').then((m) => ({ default: m.TopScorersPage })));

function PageFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="rounded-2xl glass p-16 text-center">
        <div className="inline-block w-8 h-8 rounded-full border-2 border-pitch-400 border-t-transparent animate-spin" />
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
      <div className="font-display font-black text-7xl text-pitch-500/50 mb-2">404</div>
      <p className="text-night-300">Esa ruta no existe en el torneo.</p>
    </div>
  );
}

export default function App() {
  useN8nFavoritesSync();
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/grupos" element={<GroupsPage />} />
            <Route path="/calendario" element={<CalendarPage />} />
            <Route path="/goleadores" element={<TopScorersPage />} />
            <Route path="/eliminatorias" element={<BracketPage />} />
            <Route path="/equipos" element={<TeamsPage />} />
            <Route path="/equipos/:abbr" element={<TeamDetailPage />} />
            <Route path="/partidos/:id" element={<MatchDetailPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
