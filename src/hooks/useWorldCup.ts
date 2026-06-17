import { useQuery } from '@tanstack/react-query';
import {
  fetchMatches,
  fetchStandings,
  fetchBracket,
  fetchTodayMatches,
  fetchLiveMatches,
  fetchTeamMatches,
  fetchTopScorers,
  fetchTeamRoster,
} from '@/lib/api';
import { REFRESH_INTERVALS } from '@/lib/constants';

const TIMEZONE = 'Europe/Madrid';

export function useMatches() {
  return useQuery({
    queryKey: ['matches', 'all', TIMEZONE],
    queryFn: ({ signal }) => fetchMatches(TIMEZONE, signal),
    refetchInterval: REFRESH_INTERVALS.upcoming,
  });
}

export function useTodayMatches() {
  return useQuery({
    queryKey: ['matches', 'today', TIMEZONE],
    queryFn: ({ signal }) => fetchTodayMatches(TIMEZONE, signal),
    refetchInterval: REFRESH_INTERVALS.upcoming,
  });
}

export function useLiveMatches() {
  return useQuery({
    queryKey: ['matches', 'live', TIMEZONE],
    queryFn: ({ signal }) => fetchLiveMatches(TIMEZONE, signal),
    refetchInterval: REFRESH_INTERVALS.live,
  });
}

export function useTeamMatches(abbr: string | undefined) {
  return useQuery({
    queryKey: ['matches', 'team', abbr, TIMEZONE],
    queryFn: ({ signal }) => fetchTeamMatches(abbr!, signal),
    enabled: !!abbr,
    refetchInterval: REFRESH_INTERVALS.upcoming,
  });
}

export function useStandings() {
  return useQuery({
    queryKey: ['standings', TIMEZONE],
    queryFn: ({ signal }) => fetchStandings(signal),
    refetchInterval: REFRESH_INTERVALS.standings,
  });
}

export function useBracket() {
  return useQuery({
    queryKey: ['bracket', TIMEZONE],
    queryFn: ({ signal }) => fetchBracket(signal),
    refetchInterval: REFRESH_INTERVALS.standings,
  });
}

export function useTopScorers() {
  return useQuery({
    queryKey: ['topScorers'],
    queryFn: ({ signal }) => fetchTopScorers(signal),
    refetchInterval: REFRESH_INTERVALS.standings,
  });
}

export function useTeamRoster(abbr: string | undefined) {
  return useQuery({
    queryKey: ['teamRoster', abbr],
    queryFn: ({ signal }) => fetchTeamRoster(abbr!, signal),
    enabled: !!abbr,
    staleTime: 10 * 60 * 1000,
  });
}
