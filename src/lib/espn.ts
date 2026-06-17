import type {
  Match,
  MatchCompetitor,
  MatchStatus,
  BracketMatch,
  Group,
  Team,
} from './types';
import { buildTeamFromAbbr } from './teams';

const STATUS_MAP: Record<string, MatchStatus> = {
  pre: 'scheduled',
  in: 'in_progress',
  halftime: 'halftime',
  post: 'final',
  canceled: 'canceled',
  postponed: 'postponed',
};

interface ESPNCompetitor {
  homeAway: string;
  score?: string | number | { displayValue?: string | number };
  winner?: boolean;
  team?: {
    id?: string;
    displayName?: string;
    shortDisplayName?: string;
    name?: string;
    abbreviation?: string;
  };
}

interface ESPNCompetition {
  id: string;
  date?: string;
  startDate?: string;
  venue?: { fullName?: string; address?: { city?: string; country?: string } };
  broadcasts?: Array<{ names?: string[] }>;
  geoBroadcasts?: Array<{ media?: { shortName?: string } }>;
  status?: { type?: { state?: string; description?: string; detail?: string; shortDetail?: string }; displayClock?: string; period?: number };
  competitors?: ESPNCompetitor[];
  type?: { text?: string; abbreviation?: string };
  altGameNote?: string;
  notes?: Array<{ headline?: string }>;
  groups?: { group?: { name?: string } };
}

interface ESPNLink {
  rel?: string[];
  href?: string;
}

export interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  status?: { type?: { state?: string; description?: string; detail?: string; shortDetail?: string }; displayClock?: string; period?: number };
  competitions?: ESPNCompetition[];
  venue?: { displayName?: string };
  links?: ESPNLink[];
}

function asNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (value && typeof value === 'object' && 'displayValue' in value) {
    return asNumber((value as { displayValue: unknown }).displayValue);
  }
  return 0;
}

function extractScore(c: ESPNCompetitor | undefined): number {
  if (!c?.score) return 0;
  return asNumber(c.score);
}

function datePartsInTZ(date: Date, timeZone: string): { date: string; time: string } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

function inferRound(competition: ESPNCompetition, event: ESPNEvent): Match['phase'] {
  const note = (competition.altGameNote ?? '').toLowerCase();
  const typeText = `${competition.type?.text ?? ''} ${competition.type?.abbreviation ?? ''}`.toLowerCase();
  const nameText = (event.name ?? '').toLowerCase();
  const haystack = `${note} ${typeText} ${nameText}`;
  if (haystack.includes('third place') || haystack.includes('3rd place')) return 'third_place';
  if (haystack.includes('final') && !haystack.includes('semi')) return 'final';
  if (haystack.includes('semi')) return 'semifinal';
  if (haystack.includes('quarter')) return 'quarterfinal';
  if (haystack.includes('round of 16')) return 'round_of_16';
  if (haystack.includes('round of 32') || haystack.includes('group stage knockout')) return 'round_of_32';
  if (haystack.includes('group')) return 'group';
  return 'group';
}

function inferGroup(competition: ESPNCompetition): string | undefined {
  const direct = competition.groups?.group?.name;
  if (direct) return direct;
  const note = competition.altGameNote ?? '';
  const match = note.match(/Group\s+([A-Z])/i);
  if (match) return `Grupo ${match[1].toUpperCase()}`;
  return competition.notes?.[0]?.headline;
}

export function mapESPNEvent(event: ESPNEvent, timeZone = 'Europe/Madrid'): Match {
  const competition = event.competitions?.[0] ?? ({} as ESPNCompetition);
  const competitors: ESPNCompetitor[] = Array.isArray(competition.competitors) ? competition.competitors : [];
  const homeComp = competitors.find((c) => c.homeAway === 'home') ?? competitors[0];
  const awayComp = competitors.find((c) => c.homeAway === 'away') ?? competitors[1];

  const statusState = competition.status?.type?.state ?? event.status?.type?.state ?? 'pre';
  const status: MatchStatus = STATUS_MAP[statusState] ?? 'scheduled';

  const start = new Date(event.date ?? competition.date ?? competition.startDate ?? new Date().toISOString());
  const local = Number.isNaN(start.getTime())
    ? { date: '', time: '' }
    : datePartsInTZ(start, timeZone);

  const phase = inferRound(competition, event);
  const group = phase === 'group' ? inferGroup(competition) : undefined;
  const round = competition.type?.text ?? event.name ?? '';

  const homeTeam = homeComp?.team
    ? buildTeamFromAbbr(
        homeComp.team.abbreviation ?? 'TBD',
        String(homeComp.team.id ?? homeComp.team.abbreviation ?? 'home'),
        homeComp.team.shortDisplayName ?? homeComp.team.displayName ?? homeComp.team.name,
      )
    : buildTeamFromAbbr('TBD', 'tbd-home', 'Por definir');

  const awayTeam = awayComp?.team
    ? buildTeamFromAbbr(
        awayComp.team.abbreviation ?? 'TBD',
        String(awayComp.team.id ?? awayComp.team.abbreviation ?? 'away'),
        awayComp.team.shortDisplayName ?? awayComp.team.displayName ?? awayComp.team.name,
      )
    : buildTeamFromAbbr('TBD', 'tbd-away', 'Por definir');

  const homeScore = extractScore(homeComp);
  const awayScore = extractScore(awayComp);

  const home: MatchCompetitor = {
    team: homeTeam,
    score: homeScore,
    homeAway: 'home',
    winner: homeComp?.winner,
  };
  const away: MatchCompetitor = {
    team: awayTeam,
    score: awayScore,
    homeAway: 'away',
    winner: awayComp?.winner,
  };

  const broadcasters = Array.from(
    new Set(
      [
        ...(competition.broadcasts ?? []).flatMap((b) => b.names ?? []),
        ...(competition.geoBroadcasts ?? []).map((g) => g.media?.shortName ?? '').filter(Boolean),
      ].filter(Boolean),
    ),
  );

  return {
    id: String(event.id ?? competition.id ?? `${homeTeam.id}-${awayTeam.id}-${start.toISOString()}`),
    status,
    statusDetail: competition.status?.type?.description ?? event.status?.type?.description ?? '',
    clock: competition.status?.displayClock ?? event.status?.displayClock,
    minute: typeof competition.status?.period === 'number' ? competition.status.period : undefined,
    startTimeUtc: start.toISOString(),
    startTimestamp: Math.floor(start.getTime() / 1000),
    localDate: local.date,
    localTime: local.time,
    venue: competition.venue?.fullName ?? event.venue?.displayName ?? '',
    city: competition.venue?.address?.city,
    country: competition.venue?.address?.country,
    broadcasters,
    group,
    round,
    phase,
    home,
    away,
    score: status === 'scheduled' ? undefined : { home: homeScore, away: awayScore },
    winner:
      status === 'final' && homeScore !== awayScore
        ? homeScore > awayScore
          ? 'home'
          : 'away'
        : undefined,
  };
}

export function mapESPNEvents(events: ESPNEvent[], timeZone = 'Europe/Madrid'): Match[] {
  return (events ?? []).map((e) => mapESPNEvent(e, timeZone));
}

export interface ESPNStandingEntry {
  team: {
    id: string;
    displayName?: string;
    shortDisplayName?: string;
    name?: string;
    abbreviation?: string;
  };
  stats?: Array<{ name?: string; value?: number; displayValue?: string }>;
  note?: { color?: string; description?: string };
}

export interface ESPNStandingGroup {
  name?: string;
  slug?: string;
  standings?: { entries?: ESPNStandingEntry[] };
}

export function mapESPNStandings(payload: { children?: ESPNStandingGroup[] }): Group[] {
  const groups: Group[] = [];
  for (const child of payload.children ?? []) {
    const letter = ((child.name ?? '').match(/Group\s+([A-Z])/i)?.[1] ?? '').toUpperCase()
      || (child.slug ?? '').replace(/^group-?/i, '').toUpperCase();
    const entries = (child.standings?.entries ?? []) as Array<ESPNStandingEntry & { position?: number }>;
    const standings = entries
      .map((entry, idx) => {
        const team = buildTeamFromAbbr(
          entry.team.abbreviation ?? 'TBD',
          String(entry.team.id ?? entry.team.abbreviation ?? `g-${letter}-${idx}`),
          entry.team.shortDisplayName ?? entry.team.displayName ?? entry.team.name,
        );
        const get = (key: string, fallback = 0): number => {
          const stat = entry.stats?.find((s) => s.name === key);
          return asNumber(stat?.value ?? stat?.displayValue ?? fallback);
        };
        const points = get('points', 0);
        const position = entry.position ?? idx + 1;
        const noteDesc = (entry.note?.description ?? '').toLowerCase();
        let status: 'qualified' | 'playoff' | 'eliminated' | 'pending' = 'pending';
        if (noteDesc.includes('round of 32') || noteDesc.includes('advance')) status = 'qualified';
        else if (noteDesc.includes('playoff') || noteDesc.includes('repechage') || noteDesc.includes('repêchage')) status = 'playoff';
        else if (noteDesc.includes('eliminated') || noteDesc.includes('out')) status = 'eliminated';
        return {
          team,
          position,
          played: get('gamesPlayed', 0),
          won: get('wins', 0),
          drawn: get('ties', 0),
          lost: get('losses', 0),
          goalsFor: get('pointsFor', 0),
          goalsAgainst: get('pointsAgainst', 0),
          goalDifference: get('pointDifferential', 0),
          points,
          qualificationStatus: status,
        };
      })
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
        if (b.won !== a.won) return b.won - a.won;
        return b.goalsFor - a.goalsFor;
      })
      .map((s, i) => ({ ...s, position: i + 1 }));

    if (standings.length === 0) continue;
    groups.push({
      id: `group-${letter}`,
      letter,
      name: `Grupo ${letter}`,
      standings,
    });
  }
  return groups;
}

export function mapKnockoutMatches(matches: Match[]): import('./types').Bracket {
  const phaseMap: Record<Match['phase'], Match[]> = {
    round_of_32: matches.filter((m) => m.phase === 'round_of_32'),
    round_of_16: matches.filter((m) => m.phase === 'round_of_16'),
    quarterfinal: matches.filter((m) => m.phase === 'quarterfinal'),
    semifinal: matches.filter((m) => m.phase === 'semifinal'),
    final: matches.filter((m) => m.phase === 'final'),
    third_place: matches.filter((m) => m.phase === 'third_place'),
    group: [],
  };

  const toBracket = (ms: Match[]): BracketMatch[] =>
    ms.map((m, idx) => ({
      id: m.id,
      round: m.round,
      roundNumber: idx,
      positionInRound: idx,
      status: m.status,
      home: { team: m.home.team, score: m.score?.home ?? null },
      away: { team: m.away.team, score: m.score?.away ?? null },
      startTimeUtc: m.startTimeUtc,
    }));

  return {
    roundsOf32: toBracket(phaseMap.round_of_32),
    roundOf16: toBracket(phaseMap.round_of_16),
    quarterfinals: toBracket(phaseMap.quarterfinal),
    semifinals: toBracket(phaseMap.semifinal),
    final: toBracket(phaseMap.final)[0] ?? null,
    thirdPlace: toBracket(phaseMap.third_place)[0] ?? null,
  };
}

export function emptyTeam(): Team {
  return buildTeamFromAbbr('TBD', 'tbd', 'Por definir');
}
