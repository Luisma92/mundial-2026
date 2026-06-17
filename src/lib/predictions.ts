import type { Group, Team } from './types';

const STORAGE_KEY = 'mundial-2026-predictions-v1';

export interface GroupPrediction {
  first: string; // team abbr
  second: string; // team abbr
}

export interface BracketPrediction {
  matchId: string;
  winnerAbbr: string; // predicted winner team abbr
}

export interface PredictionsState {
  groups: Record<string, GroupPrediction>; // keyed by group letter
  bracket: Record<string, BracketPrediction>; // keyed by matchId
  updatedAt: number;
}

function loadState(): PredictionsState {
  if (typeof window === 'undefined') return { groups: {}, bracket: {}, updatedAt: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { groups: {}, bracket: {}, updatedAt: 0 };
    const parsed = JSON.parse(raw) as PredictionsState;
    return {
      groups: parsed.groups ?? {},
      bracket: parsed.bracket ?? {},
      updatedAt: parsed.updatedAt ?? 0,
    };
  } catch {
    return { groups: {}, bracket: {}, updatedAt: 0 };
  }
}

function saveState(state: PredictionsState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function loadPredictions(): PredictionsState {
  return loadState();
}

export function setGroupPrediction(groupLetter: string, position: 'first' | 'second', teamAbbr: string): PredictionsState {
  const state = loadState();
  const existing = state.groups[groupLetter] ?? { first: '', second: '' };
  if (position === 'first') {
    state.groups[groupLetter] = { first: teamAbbr, second: existing.second === teamAbbr ? '' : existing.second };
  } else {
    state.groups[groupLetter] = { first: existing.first === teamAbbr ? '' : existing.first, second: teamAbbr };
  }
  state.updatedAt = Date.now();
  saveState(state);
  return state;
}

export function clearGroupPrediction(groupLetter: string): PredictionsState {
  const state = loadState();
  delete state.groups[groupLetter];
  state.updatedAt = Date.now();
  saveState(state);
  return state;
}

export function setBracketPrediction(matchId: string, winnerAbbr: string): PredictionsState {
  const state = loadState();
  state.bracket[matchId] = { matchId, winnerAbbr };
  state.updatedAt = Date.now();
  saveState(state);
  return state;
}

export function clearBracketPrediction(matchId: string): PredictionsState {
  const state = loadState();
  delete state.bracket[matchId];
  state.updatedAt = Date.now();
  saveState(state);
  return state;
}

export function clearAllPredictions(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getPredictionScore(groups: Group[], bracket: import('./types').Bracket | null | undefined, predictions: PredictionsState): {
  groupPoints: number;
  bracketPoints: number;
  totalCorrect: number;
  totalPredicted: number;
  details: { groupCorrect: number; groupTotal: number; bracketCorrect: number; bracketTotal: number };
} {
  let groupPoints = 0;
  let groupCorrect = 0;
  let groupTotal = 0;

  for (const group of groups) {
    const pred = predictions.groups[group.letter];
    if (!pred?.first && !pred?.second) continue;
    groupTotal += 2;

    const top2 = group.standings.slice(0, 2).map((s) => s.team.abbreviation.toUpperCase());
    if (pred.first && top2.includes(pred.first.toUpperCase())) {
      groupCorrect++;
      groupPoints += pred.first && pred.second === pred.first ? 1 : 1;
    }
    if (pred.second && top2.includes(pred.second.toUpperCase())) {
      groupCorrect++;
      groupPoints += 1;
    }
  }

  let bracketCorrect = 0;
  let bracketTotal = 0;
  if (bracket) {
    const allKnockout: import('./types').BracketMatch[] = [
      ...bracket.roundsOf32,
      ...bracket.roundOf16,
      ...bracket.quarterfinals,
      ...bracket.semifinals,
    ];
    if (bracket.final) allKnockout.push(bracket.final);
    for (const m of allKnockout) {
      const pred = predictions.bracket[m.id];
      if (!pred?.winnerAbbr) continue;
      bracketTotal++;
      const winnerAbbr = m.winner === 'home'
        ? m.home.team?.abbreviation
        : m.winner === 'away'
          ? m.away.team?.abbreviation
          : undefined;
      if (winnerAbbr && pred.winnerAbbr.toUpperCase() === winnerAbbr.toUpperCase()) {
        bracketCorrect++;
      }
    }
  }

  return {
    groupPoints,
    bracketPoints: bracketCorrect * 3,
    totalCorrect: groupCorrect + bracketCorrect,
    totalPredicted: groupTotal + bracketTotal,
    details: { groupCorrect, groupTotal, bracketCorrect, bracketTotal },
  };
}

export type { Team };
