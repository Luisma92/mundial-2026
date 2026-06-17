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
  details?: Array<{
    id?: string;
    type?: { id?: number; text?: string; abbreviation?: string };
    clock?: { displayValue?: string; value?: number };
    team?: { id?: string; abbreviation?: string };
    scoreValue?: number;
    scoringPlay?: boolean;
    yellowCard?: boolean;
    redCard?: boolean;
    penaltyKick?: boolean;
    ownGoal?: boolean;
    shootout?: boolean;
    athletesInvolved?: Array<{
      id?: string;
      displayName?: string;
      shortName?: string;
      fullName?: string;
      jersey?: string;
      position?: string;
      headshot?: string;
    }>;
  }>;
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

function classifyPositionGroup(abbr: string | undefined): import('./types').PlayerPositionGroup {
  const a = (abbr ?? '').toUpperCase();
  // Goalkeepers
  if (a === 'G' || a === 'GK' || a === 'GKP') return 'GK';
  // Defenders — backs, center-backs, wing-backs
  if (
    a === 'D' || a === 'DEF' ||
    a === 'CB' || a === 'RCB' || a === 'LCB' || a === 'CD' || a === 'CD-R' || a === 'CD-L' ||
    a === 'RB' || a === 'LB' || a === 'RWB' || a === 'LWB' || a === 'RB5'
  ) return 'DEF';
  // Midfielders — DM, CM, AM, RM, LM and any "Midfielder" / "Midfielder" variants
  if (
    a === 'M' || a === 'MID' ||
    a === 'DM' || a === 'CDM' || a === 'RDM' || a === 'LDM' ||
    a === 'CM' || a === 'RCM' || a === 'LCM' || a === 'CM-R' || a === 'CM-L' ||
    a === 'RM' || a === 'LM' ||
    a === 'AM' || a === 'AM-R' || a === 'AM-L' || a === 'CAM' || a === 'RAM' || a === 'LAM'
  ) return 'MID';
  // Forwards — strikers, center-forwards, wingers
  if (
    a === 'F' || a === 'FW' || a === 'FWD' ||
    a === 'ST' || a === 'CF' || a === 'CF-R' || a === 'CF-L' || a === 'RF' || a === 'LF' || a === 'RW' || a === 'LW'
  ) return 'FWD';
  // Default: classify by position name if abbreviation is unknown
  return 'MID';
}

function classifyEventType(text: string, flags: { scoringPlay?: boolean; yellowCard?: boolean; redCard?: boolean; penaltyKick?: boolean; ownGoal?: boolean; shootout?: boolean }): import('./types').MatchEventType {
  const lower = text.toLowerCase();
  if (flags.redCard) return 'red_card';
  if (flags.yellowCard) return 'yellow_card';
  if (lower.includes('substitution') || lower.includes('sub on') || lower.includes('sub off')) return 'substitution';
  if (lower.includes('var')) return 'var';
  if (lower.includes('penalty missed') || lower.includes('pen missed') || lower.includes('pk miss')) return 'penalty_missed';
  if (flags.ownGoal) return 'own_goal';
  if (flags.penaltyKick || lower.includes('penalty') && lower.includes('goal')) return 'penalty_goal';
  if (flags.scoringPlay || lower.includes('goal')) return 'goal';
  return 'other';
}

function extractEvents(competition: ESPNCompetition, competitors: ESPNCompetitor[]): import('./types').MatchEvent[] {
  const details = competition.details ?? [];
  const teamAbbrById = new Map<string, { abbr: string; id: string }>();
  for (const c of competitors) {
    const id = c.team?.id ? String(c.team.id) : '';
    const abbr = c.team?.abbreviation ?? '';
    if (id && abbr) teamAbbrById.set(id, { abbr, id });
  }

  return details
    .map((d, idx): import('./types').MatchEvent | null => {
      const text = d.type?.text ?? '';
      const type = classifyEventType(text, {
        scoringPlay: d.scoringPlay,
        yellowCard: d.yellowCard,
        redCard: d.redCard,
        penaltyKick: d.penaltyKick,
        ownGoal: d.ownGoal,
        shootout: d.shootout,
      });
      if (type === 'other') return null;
      const teamId = d.team?.id ? String(d.team.id) : '';
      const teamInfo = teamAbbrById.get(teamId);
      const minuteRaw = d.clock?.value ?? 0;
      const minute = Math.floor(minuteRaw / 60);
      const athletes: import('./types').MatchEventAthlete[] = (d.athletesInvolved ?? []).map((a) => ({
        id: a.id ?? '',
        name: a.displayName ?? a.fullName ?? a.shortName ?? '',
        shortName: a.shortName ?? a.displayName ?? '',
        jersey: a.jersey,
        position: a.position,
        headshot: a.headshot,
      }));
      const scoreAfter = competitors
        .map((c) => {
          const abbr = c.team?.abbreviation ?? '';
          const s = asNumber(c.score);
          return `${abbr} ${s}`;
        })
        .filter(Boolean)
        .join(' · ');
      return {
        id: `${d.id ?? idx}-${type}-${minute}`,
        type,
        rawType: text,
        minute,
        displayMinute: d.clock?.displayValue ?? `${minute}'`,
        teamAbbr: teamInfo?.abbr ?? d.team?.abbreviation ?? '',
        teamId,
        scoreAfter,
        athletes,
        detail: text,
      };
    })
    .filter((e): e is import('./types').MatchEvent => e !== null)
    .sort((a, b) => a.minute - b.minute);
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
  const events = extractEvents(competition, competitors);

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
    events,
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
      winner: m.winner,
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

export interface ESPNRosterAthlete {
  id: string;
  displayName?: string;
  shortName?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  age?: number;
  jersey?: string;
  height?: number;
  displayHeight?: string;
  weight?: number;
  displayWeight?: string;
  citizenship?: string;
  flag?: { href?: string };
  position?: { id?: string; name?: string; displayName?: string; abbreviation?: string };
  statistics?: {
    splits?: {
      categories?: Array<{
        name?: string;
        displayName?: string;
        stats?: Array<{ name?: string; displayValue?: string; value?: number }>;
      }>;
    };
  };
}

export interface ESPNRosterPayload {
  athletes?: ESPNRosterAthlete[];
  team?: { color?: string };
}

function classifyPosition(abbr: string | undefined): import('./types').PlayerPositionGroup {
  const a = (abbr ?? '').toUpperCase();
  if (a === 'G' || a === 'GK') return 'GK';
  if (a === 'D' || a === 'DEF') return 'DEF';
  if (a === 'M' || a === 'MID') return 'MID';
  if (a === 'F' || a === 'FW' || a === 'FWD') return 'FWD';
  return 'MID';
}

export function mapESPNRoster(payload: ESPNRosterPayload): import('./types').Player[] {
  const athletes = payload.athletes ?? [];
  const players: import('./types').Player[] = [];
  for (const ath of athletes) {
    const statsMap = new Map<string, number>();
    for (const cat of ath.statistics?.splits?.categories ?? []) {
      for (const s of cat.stats ?? []) {
        if (s.name) statsMap.set(s.name, asNumber(s.value ?? s.displayValue ?? 0));
      }
    }
    const position = ath.position;
    const headshotUrl = ath.id
      ? `https://a.espncdn.com/i/headshots/soccer/players/full/${ath.id}.png`
      : undefined;
    players.push({
      id: ath.id,
      name: ath.displayName ?? ath.fullName ?? `${ath.firstName ?? ''} ${ath.lastName ?? ''}`.trim(),
      shortName: ath.shortName ?? ath.displayName ?? '',
      position: {
        abbreviation: position?.abbreviation ?? '?',
        name: position?.displayName ?? position?.name ?? 'Jugador',
        group: classifyPosition(position?.abbreviation),
      },
      jersey: ath.jersey,
      age: ath.age,
      dateOfBirth: ath.dateOfBirth,
      height: ath.displayHeight,
      weight: ath.displayWeight,
      citizenship: ath.citizenship,
      headshotUrl,
      color: payload.team?.color ? `#${payload.team.color}` : undefined,
      stats: {
        appearances: statsMap.get('appearances') ?? 0,
        minutesPlayed: statsMap.get('minutesPlayed') ?? 0,
        goals: statsMap.get('totalGoals') ?? 0,
        assists: statsMap.get('goalAssists') ?? 0,
        shots: statsMap.get('totalShots') ?? 0,
        shotsOnTarget: statsMap.get('shotsOnTarget') ?? 0,
        foulsCommitted: statsMap.get('foulsCommitted') ?? 0,
        foulsSuffered: statsMap.get('foulsSuffered') ?? 0,
        yellowCards: statsMap.get('yellowCards') ?? 0,
        redCards: statsMap.get('redCards') ?? 0,
        offsides: statsMap.get('offsides') ?? 0,
        saves: statsMap.get('saves'),
        goalsConceded: statsMap.get('goalsConceded'),
        cleanSheets: statsMap.get('cleanSheets'),
      },
    });
  }
  return players;
}

export interface ESPNStatsAthlete {
  id: string;
  displayName: string;
  shortName: string;
  headshot?: { href?: string };
  jersey?: string;
  team?: {
    id?: string;
    name?: string;
    abbreviation?: string;
    displayName?: string;
    color?: string;
    logos?: Array<{ href?: string }>;
  };
  statistics?: Array<{ name?: string; value?: number; displayValue?: string }>;
}

export interface ESPNStatsCategory {
  name: string;
  displayName?: string;
  shortDisplayName?: string;
  abbreviation?: string;
  leaders?: Array<{
    displayValue?: string;
    value?: number;
    athlete?: ESPNStatsAthlete;
  }>;
}

export interface ESPNStatsPayload {
  stats?: ESPNStatsCategory[];
}

export function mapESPNTopScorers(payload: ESPNStatsPayload): import('./types').TopScorer[] {
  const goals = payload.stats?.find((c) => c.name === 'goalsLeaders');
  const assists = payload.stats?.find((c) => c.name === 'assistsLeaders');
  if (!goals?.leaders) return [];

  const scorers: import('./types').TopScorer[] = [];
  goals.leaders.forEach((entry, idx) => {
    const ath = entry.athlete;
    if (!ath) return;
    const getStat = (name: string): number => {
      const s = ath.statistics?.find((s) => s.name === name);
      return asNumber(s?.value ?? s?.displayValue ?? 0);
    };
    const teamAbbr = ath.team?.abbreviation ?? 'TBD';
    const team = buildTeamFromAbbr(
      teamAbbr,
      String(ath.team?.id ?? teamAbbr),
      ath.team?.displayName ?? ath.team?.name,
    );
    if (ath.team?.color) team.color = `#${ath.team.color}`;
    const goalsCount = asNumber(entry.value ?? getStat('totalGoals'));
    const appearances = getStat('appearances');
    const assistsCount = assists?.leaders?.find((l) => l.athlete?.id === ath.id)
      ? asNumber(assists.leaders.find((l) => l.athlete?.id === ath.id)!.value ?? 0)
      : 0;
    scorers.push({
      rank: idx + 1,
      athlete: {
        id: ath.id,
        name: ath.displayName,
        shortName: ath.shortName,
        headshot: ath.headshot?.href,
      },
      team,
      goals: goalsCount,
      assists: assistsCount,
      matches: appearances,
      penalties: 0,
    });
  });

  // Enrich with penalty count from scoreboard events
  const playerPenalties = new Map<string, number>();
  const eventCategories = (payload as unknown as { _eventPenalties?: Map<string, number> })._eventPenalties;
  if (eventCategories) {
    for (const [k, v] of eventCategories.entries()) playerPenalties.set(k, v);
  }
  for (const s of scorers) {
    s.penalties = playerPenalties.get(s.athlete.id) ?? 0;
  }

  return scorers;
}

export function aggregatePenaltyScorers(events: import('./types').MatchEvent[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const ev of events) {
    if (ev.type !== 'penalty_goal') continue;
    for (const ath of ev.athletes) {
      if (!ath.id) continue;
      map.set(ath.id, (map.get(ath.id) ?? 0) + 1);
    }
  }
  return map;
}

interface ESPNSummaryAthlete {
  id?: string;
  displayName?: string;
  shortName?: string;
  fullName?: string;
  jerseyImages?: Array<{ href?: string }>;
}

interface ESPNSummaryRosterEntry {
  active?: boolean;
  starter?: boolean;
  jersey?: string;
  athlete?: ESPNSummaryAthlete;
  position?: { name?: string; displayName?: string; abbreviation?: string };
  formationPlace?: string;
  stats?: Array<{ name?: string; value?: number; displayValue?: string }>;
}

interface ESPNSummaryRoster {
  homeAway?: 'home' | 'away';
  team?: {
    id?: string;
    displayName?: string;
    shortDisplayName?: string;
    name?: string;
    abbreviation?: string;
    color?: string;
  };
  formation?: string;
  uniform?: { type?: string; color?: string; alternateColor?: string };
  roster?: ESPNSummaryRosterEntry[];
}

export interface ESPNSummaryPayload {
  rosters?: ESPNSummaryRoster[];
}

function jerseyImageFor(matchId: string, athleteId: string | undefined): string | undefined {
  if (!athleteId) return undefined;
  return `https://stitcher.espn.com/sports/soccer/leagues/fifa.world/events/${matchId}/athletes/${athleteId}/jersey.png?darkMode=false`;
}

function headshotFor(athleteId: string | undefined): string | undefined {
  if (!athleteId) return undefined;
  return `https://a.espncdn.com/i/headshots/soccer/players/full/${athleteId}.png`;
}

export function mapESPNLineups(
  payload: ESPNSummaryPayload,
  matchId: string,
): import('./types').TeamLineup[] {
  const rosters = payload.rosters ?? [];
  const lineups: import('./types').TeamLineup[] = [];

  for (const r of rosters) {
    if (!r.homeAway || !r.team) continue;
    const abbr = r.team.abbreviation ?? '';
    const team: import('./types').Team = buildTeamFromAbbr(
      abbr,
      String(r.team.id ?? abbr),
      r.team.displayName ?? r.team.shortDisplayName ?? r.team.name,
    );
    if (r.team.color) team.color = `#${r.team.color}`;

    const players: import('./types').LineupPlayer[] = [];
    for (const p of r.roster ?? []) {
      const ath = p.athlete ?? {};
      const id = ath.id ?? '';
      const pos = p.position ?? {};
      const statsMap = new Map<string, number>();
      for (const s of p.stats ?? []) {
        if (s.name) statsMap.set(s.name, asNumber(s.value ?? s.displayValue ?? 0));
      }
      players.push({
        id,
        name: ath.displayName ?? ath.fullName ?? '',
        shortName: ath.shortName ?? ath.displayName ?? '',
        position: {
          abbreviation: pos.abbreviation ?? '?',
          name: pos.displayName ?? pos.name ?? 'Jugador',
          group: classifyPositionGroup(pos.abbreviation),
        },
        jersey: p.jersey ?? p.formationPlace ?? '?',
        formationPlace: Number(p.formationPlace ?? 0) || 0,
        starter: p.starter === true,
        headshotUrl: headshotFor(id),
        jerseyImageUrl: jerseyImageFor(matchId, id),
        stats: {
          appearances: statsMap.get('appearances') ?? (p.starter ? 1 : 0),
          minutesPlayed: statsMap.get('minutesPlayed') ?? 0,
          goals: statsMap.get('totalGoals') ?? 0,
          assists: statsMap.get('goalAssists') ?? 0,
          shots: statsMap.get('totalShots') ?? 0,
          shotsOnTarget: statsMap.get('shotsOnTarget') ?? 0,
          foulsCommitted: statsMap.get('foulsCommitted') ?? 0,
          foulsSuffered: statsMap.get('foulsSuffered') ?? 0,
          yellowCards: statsMap.get('yellowCards') ?? 0,
          redCards: statsMap.get('redCards') ?? 0,
          offsides: statsMap.get('offsides') ?? 0,
          saves: statsMap.get('saves'),
          goalsConceded: statsMap.get('goalsConceded'),
          cleanSheets: statsMap.get('cleanSheets'),
        },
      });
    }

    lineups.push({
      homeAway: r.homeAway,
      team,
      formation: r.formation ?? '',
      players,
      uniform: r.uniform,
    });
  }
  return lineups;
}
