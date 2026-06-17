export type MatchStatus =
  | 'scheduled'
  | 'in_progress'
  | 'halftime'
  | 'final'
  | 'postponed'
  | 'canceled';

export interface Team {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  countryCode: string;
  flagUrl: string;
  color: string;
  isFavorite?: boolean;
}

export interface MatchScore {
  home: number;
  away: number;
}

export interface MatchCompetitor {
  team: Team;
  score: number;
  homeAway: 'home' | 'away';
  winner?: boolean;
}

export interface Match {
  id: string;
  status: MatchStatus;
  statusDetail: string;
  clock?: string;
  minute?: number;
  startTimeUtc: string;
  startTimestamp: number;
  localDate: string;
  localTime: string;
  venue: string;
  city?: string;
  country?: string;
  broadcasters: string[];
  group?: string;
  round: string;
  phase: 'group' | 'round_of_32' | 'round_of_16' | 'quarterfinal' | 'semifinal' | 'third_place' | 'final';
  home: MatchCompetitor;
  away: MatchCompetitor;
  score?: MatchScore;
  winner?: 'home' | 'away' | 'draw';
}

export interface GroupStanding {
  team: Team;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  qualificationStatus: 'qualified' | 'playoff' | 'eliminated' | 'pending';
  form?: ('W' | 'D' | 'L')[];
}

export interface Group {
  id: string;
  name: string;
  letter: string;
  standings: GroupStanding[];
}

export interface BracketMatch {
  id: string;
  round: string;
  roundNumber: number;
  positionInRound: number;
  status: MatchStatus;
  home: { team: Team | null; score: number | null; fromMatchId?: string };
  away: { team: Team | null; score: number | null; fromMatchId?: string };
  startTimeUtc?: string;
}

export interface Bracket {
  roundsOf32: BracketMatch[];
  roundOf16: BracketMatch[];
  quarterfinals: BracketMatch[];
  semifinals: BracketMatch[];
  final: BracketMatch | null;
  thirdPlace: BracketMatch | null;
}

export interface CalendarDay {
  date: string;
  matches: Match[];
}

export interface ApiError {
  message: string;
  status?: number;
}
