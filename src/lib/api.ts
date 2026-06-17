import type { Group, Match, Bracket, TopScorer, Player, TeamLineup } from './types';
import {
  mapESPNEvents,
  mapESPNStandings,
  mapKnockoutMatches,
  mapESPNTopScorers,
  mapESPNRoster,
  mapESPNLineups,
  aggregatePenaltyScorers,
  type ESPNEvent,
  type ESPNStandingGroup,
  type ESPNStatsPayload,
  type ESPNRosterPayload,
  type ESPNSummaryPayload,
} from './espn';
import { TOURNAMENT } from './constants';

const ESPN_SITE_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world';
const ESPN_API_BASE = 'https://site.api.espn.com/apis/v2/sports/soccer/fifa.world';
const N8N_BASE = (import.meta.env.VITE_N8N_BASE as string | undefined) ?? null;

export interface N8nScoreboardResponse {
  source: string;
  generatedAt: string;
  timeZone: string;
  count: number;
  matches: Match[];
}

async function fetchJSON<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText} (${url})`);
  }
  return (await res.json()) as T;
}

interface ESPNDirectScoreboard {
  events?: ESPNEvent[];
  leagues?: unknown;
}

async function fetchFromN8n<T>(path: string, signal?: AbortSignal): Promise<T | null> {
  if (!N8N_BASE) return null;
  try {
    const url = `${N8N_BASE}${path}`;
    return await fetchJSON<T>(url, signal);
  } catch (err) {
    if (import.meta.env.DEV) {
      console.warn(`[api] n8n unreachable (${path}):`, err);
    }
    return null;
  }
}

export async function fetchMatches(timeZone = 'Europe/Madrid', signal?: AbortSignal): Promise<Match[]> {
  const params = new URLSearchParams({
    dates: `${TOURNAMENT.startDate.replace(/-/g, '')}-${TOURNAMENT.endDate.replace(/-/g, '')}`,
    limit: '500',
  });

  const direct = await fetchJSON<ESPNDirectScoreboard>(
    `${ESPN_SITE_BASE}/scoreboard?${params.toString()}`,
    signal,
  ).catch(() => null);

  if (direct?.events) {
    return mapESPNEvents(direct.events, timeZone);
  }

  const fromN8n = await fetchFromN8n<{ matches: Match[] }>(
    `/webhook/world-cup/scoreboard?dates=${params.get('dates')}`,
    signal,
  );
  if (fromN8n?.matches) return fromN8n.matches;
  throw new Error('No se pudieron cargar los partidos desde ninguna fuente.');
}

export async function fetchStandings(signal?: AbortSignal): Promise<Group[]> {
  const direct = await fetchJSON<{ children?: ESPNStandingGroup[] }>(
    `${ESPN_API_BASE}/standings`,
    signal,
  ).catch(() => null);
  if (direct?.children) return mapESPNStandings(direct);

  const fromN8n = await fetchFromN8n<{ groups: Group[] }>('/webhook/world-cup/standings', signal);
  if (fromN8n?.groups) return fromN8n.groups;
  throw new Error('No se pudieron cargar las posiciones.');
}

export async function fetchBracket(signal?: AbortSignal): Promise<Bracket> {
  const matches = await fetchMatches('Europe/Madrid', signal);
  return mapKnockoutMatches(matches);
}

export async function fetchTodayMatches(timeZone = 'Europe/Madrid', signal?: AbortSignal): Promise<Match[]> {
  const all = await fetchMatches(timeZone, signal);
  const today = new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
  return all.filter((m) => m.localDate === today);
}

export async function fetchLiveMatches(timeZone = 'Europe/Madrid', signal?: AbortSignal): Promise<Match[]> {
  const all = await fetchMatches(timeZone, signal);
  return all.filter((m) => m.status === 'in_progress' || m.status === 'halftime');
}

export async function fetchTeamMatches(teamAbbr: string, signal?: AbortSignal): Promise<Match[]> {
  const all = await fetchMatches('Europe/Madrid', signal);
  const abbr = teamAbbr.toUpperCase();
  return all.filter(
    (m) =>
      m.home.team.abbreviation.toUpperCase() === abbr ||
      m.away.team.abbreviation.toUpperCase() === abbr,
  );
}

export async function fetchTopScorers(signal?: AbortSignal): Promise<TopScorer[]> {
  const [stats, matches] = await Promise.all([
    fetchJSON<ESPNStatsPayload>(
      `${ESPN_SITE_BASE}/statistics`,
      signal,
    ).catch(() => null),
    fetchMatches('Europe/Madrid', signal).catch(() => [] as Match[]),
  ]);
  if (!stats) return [];

  // Aggregate penalty scorers from match events
  const allEvents = matches.flatMap((m) => m.events ?? []);
  const penaltyMap = aggregatePenaltyScorers(allEvents);
  // Inject into payload-like object for the mapper
  (stats as unknown as { _eventPenalties: Map<string, number> })._eventPenalties = penaltyMap;

  return mapESPNTopScorers(stats);
}

interface ESPNTeamListEntry {
  team?: {
    id?: string;
    abbreviation?: string;
  };
}

async function resolveTeamId(abbr: string, signal?: AbortSignal): Promise<string | null> {
  // 1) Try standings (always populated during tournament)
  const standings = await fetchJSON<{ children?: ESPNStandingGroup[] }>(
    `${ESPN_API_BASE}/standings`,
    signal,
  ).catch(() => null);
  if (standings?.children) {
    for (const group of standings.children) {
      for (const e of group.standings?.entries ?? []) {
        if (e.team?.abbreviation?.toUpperCase() === abbr.toUpperCase() && e.team?.id) {
          return String(e.team.id);
        }
      }
    }
  }
  // 2) Fallback to /teams endpoint
  const teams = await fetchJSON<{ sports?: Array<{ leagues?: Array<{ teams?: ESPNTeamListEntry[] }> }> }>(
    `${ESPN_SITE_BASE}/teams?limit=100`,
    signal,
  ).catch(() => null);
  const teamList = teams?.sports?.[0]?.leagues?.[0]?.teams ?? [];
  for (const t of teamList) {
    if (t.team?.abbreviation?.toUpperCase() === abbr.toUpperCase() && t.team?.id) {
      return String(t.team.id);
    }
  }
  return null;
}

export async function fetchTeamRoster(abbr: string, signal?: AbortSignal): Promise<Player[]> {
  const teamId = await resolveTeamId(abbr, signal);
  if (!teamId) return [];
  const payload = await fetchJSON<ESPNRosterPayload>(
    `${ESPN_SITE_BASE}/teams/${teamId}/roster`,
    signal,
  ).catch(() => null);
  if (!payload) return [];
  return mapESPNRoster(payload);
}

export async function fetchMatchLineups(matchId: string, signal?: AbortSignal): Promise<TeamLineup[]> {
  const payload = await fetchJSON<ESPNSummaryPayload>(
    `${ESPN_SITE_BASE}/summary?event=${matchId}`,
    signal,
  ).catch(() => null);
  if (!payload) return [];
  return mapESPNLineups(payload, matchId);
}
