import type { Team } from './types';

const TEAM_REGISTRY: Record<string, Partial<Team> & { code: string; color: string; name: string; shortName?: string }> = {
  ALG: { code: 'dz', color: '#006233', name: 'Argelia', shortName: 'Argelia' },
  ARG: { code: 'ar', color: '#75aadb', name: 'Argentina', shortName: 'Argentina' },
  AUS: { code: 'au', color: '#00843d', name: 'Australia', shortName: 'Australia' },
  AUT: { code: 'at', color: '#ed2939', name: 'Austria', shortName: 'Austria' },
  BEL: { code: 'be', color: '#fdda24', name: 'Bélgica', shortName: 'Bélgica' },
  BIH: { code: 'ba', color: '#002395', name: 'Bosnia-Herzegovina', shortName: 'Bosnia' },
  BRA: { code: 'br', color: '#009c3b', name: 'Brasil', shortName: 'Brasil' },
  CAN: { code: 'ca', color: '#ff0000', name: 'Canadá', shortName: 'Canadá' },
  CIV: { code: 'ci', color: '#f77f00', name: 'Costa de Marfil', shortName: 'Costa de Marfil' },
  COD: { code: 'cd', color: '#fcd116', name: 'RD Congo', shortName: 'RD Congo' },
  COL: { code: 'co', color: '#fcd116', name: 'Colombia', shortName: 'Colombia' },
  CPV: { code: 'cv', color: '#003893', name: 'Cabo Verde', shortName: 'Cabo Verde' },
  CRO: { code: 'hr', color: '#ff0000', name: 'Croacia', shortName: 'Croacia' },
  CUW: { code: 'cw', color: '#002b7f', name: 'Curaçao', shortName: 'Curaçao' },
  CZE: { code: 'cz', color: '#11457e', name: 'Chequia', shortName: 'Chequia' },
  ECU: { code: 'ec', color: '#fcd116', name: 'Ecuador', shortName: 'Ecuador' },
  EGY: { code: 'eg', color: '#ce1126', name: 'Egipto', shortName: 'Egipto' },
  ENG: { code: 'gb-eng', color: '#cf142b', name: 'Inglaterra', shortName: 'Inglaterra' },
  ESP: { code: 'es', color: '#c1121f', name: 'España', shortName: 'España' },
  FRA: { code: 'fr', color: '#002395', name: 'Francia', shortName: 'Francia' },
  GER: { code: 'de', color: '#000000', name: 'Alemania', shortName: 'Alemania' },
  GHA: { code: 'gh', color: '#006b3f', name: 'Ghana', shortName: 'Ghana' },
  HAI: { code: 'ht', color: '#00209f', name: 'Haití', shortName: 'Haití' },
  IRN: { code: 'ir', color: '#239f40', name: 'Irán', shortName: 'Irán' },
  IRQ: { code: 'iq', color: '#ce1126', name: 'Irak', shortName: 'Irak' },
  JOR: { code: 'jo', color: '#000000', name: 'Jordania', shortName: 'Jordania' },
  JPN: { code: 'jp', color: '#bc002d', name: 'Japón', shortName: 'Japón' },
  KOR: { code: 'kr', color: '#cd2e3a', name: 'Corea del Sur', shortName: 'Corea del Sur' },
  KSA: { code: 'sa', color: '#006c35', name: 'Arabia Saudita', shortName: 'Arabia Saudita' },
  MAR: { code: 'ma', color: '#c1272d', name: 'Marruecos', shortName: 'Marruecos' },
  MEX: { code: 'mx', color: '#006847', name: 'México', shortName: 'México' },
  NED: { code: 'nl', color: '#21468b', name: 'Países Bajos', shortName: 'Países Bajos' },
  NOR: { code: 'no', color: '#ef2b2d', name: 'Noruega', shortName: 'Noruega' },
  NZL: { code: 'nz', color: '#000000', name: 'Nueva Zelanda', shortName: 'Nueva Zelanda' },
  PAN: { code: 'pa', color: '#005aa7', name: 'Panamá', shortName: 'Panamá' },
  PAR: { code: 'py', color: '#d52b1e', name: 'Paraguay', shortName: 'Paraguay' },
  POR: { code: 'pt', color: '#006600', name: 'Portugal', shortName: 'Portugal' },
  QAT: { code: 'qa', color: '#8d1b3d', name: 'Catar', shortName: 'Catar' },
  RSA: { code: 'za', color: '#007749', name: 'Sudáfrica', shortName: 'Sudáfrica' },
  SCO: { code: 'gb-sct', color: '#005eb8', name: 'Escocia', shortName: 'Escocia' },
  SEN: { code: 'sn', color: '#00853f', name: 'Senegal', shortName: 'Senegal' },
  SUI: { code: 'ch', color: '#da291c', name: 'Suiza', shortName: 'Suiza' },
  SWE: { code: 'se', color: '#006aa7', name: 'Suecia', shortName: 'Suecia' },
  TUN: { code: 'tn', color: '#e70013', name: 'Túnez', shortName: 'Túnez' },
  TUR: { code: 'tr', color: '#e30a17', name: 'Turquía', shortName: 'Turquía' },
  URU: { code: 'uy', color: '#0038a8', name: 'Uruguay', shortName: 'Uruguay' },
  USA: { code: 'us', color: '#bf0a30', name: 'Estados Unidos', shortName: 'EE.UU.' },
  UZB: { code: 'uz', color: '#0099b5', name: 'Uzbekistán', shortName: 'Uzbekistán' },
};

export function isPlaceholderTeam(abbr: string | null | undefined): boolean {
  if (!abbr) return true;
  const a = String(abbr).toUpperCase();
  if (!/^[A-Z]{3}$/.test(a)) return true;
  // Anything not present in the registry of 48 World Cup teams is treated
  // as a placeholder (covers bracket slots like "QFW1", group positions "1A").
  return !TEAM_REGISTRY[a];
}

const CONFEDERATION_BY_ABBR: Record<string, { code: 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'AFC' | 'CAF' | 'OFC'; label: string }> = {
  ARG: { code: 'CONMEBOL', label: 'CONMEBOL' },
  BRA: { code: 'CONMEBOL', label: 'CONMEBOL' },
  URU: { code: 'CONMEBOL', label: 'CONMEBOL' },
  COL: { code: 'CONMEBOL', label: 'CONMEBOL' },
  CHI: { code: 'CONMEBOL', label: 'CONMEBOL' },
  PER: { code: 'CONMEBOL', label: 'CONMEBOL' },
  PAR: { code: 'CONMEBOL', label: 'CONMEBOL' },
  BOL: { code: 'CONMEBOL', label: 'CONMEBOL' },
  VEN: { code: 'CONMEBOL', label: 'CONMEBOL' },
  ECU: { code: 'CONMEBOL', label: 'CONMEBOL' },
  ESP: { code: 'UEFA', label: 'UEFA' },
  FRA: { code: 'UEFA', label: 'UEFA' },
  GER: { code: 'UEFA', label: 'UEFA' },
  ENG: { code: 'UEFA', label: 'UEFA' },
  POR: { code: 'UEFA', label: 'UEFA' },
  NED: { code: 'UEFA', label: 'UEFA' },
  BEL: { code: 'UEFA', label: 'UEFA' },
  CRO: { code: 'UEFA', label: 'UEFA' },
  SUI: { code: 'UEFA', label: 'UEFA' },
  NOR: { code: 'UEFA', label: 'UEFA' },
  SCO: { code: 'UEFA', label: 'UEFA' },
  AUT: { code: 'UEFA', label: 'UEFA' },
  CZE: { code: 'UEFA', label: 'UEFA' },
  TUR: { code: 'UEFA', label: 'UEFA' },
  BIH: { code: 'UEFA', label: 'UEFA' },
  SWE: { code: 'UEFA', label: 'UEFA' },
  USA: { code: 'CONCACAF', label: 'CONCACAF' },
  MEX: { code: 'CONCACAF', label: 'CONCACAF' },
  CAN: { code: 'CONCACAF', label: 'CONCACAF' },
  PAN: { code: 'CONCACAF', label: 'CONCACAF' },
  HAI: { code: 'CONCACAF', label: 'CONCACAF' },
  CUW: { code: 'CONCACAF', label: 'CONCACAF' },
  JPN: { code: 'AFC', label: 'AFC' },
  KOR: { code: 'AFC', label: 'AFC' },
  IRN: { code: 'AFC', label: 'AFC' },
  IRQ: { code: 'AFC', label: 'AFC' },
  JOR: { code: 'AFC', label: 'AFC' },
  KSA: { code: 'AFC', label: 'AFC' },
  QAT: { code: 'AFC', label: 'AFC' },
  UZB: { code: 'AFC', label: 'AFC' },
  AUS: { code: 'AFC', label: 'AFC' },
  MAR: { code: 'CAF', label: 'CAF' },
  EGY: { code: 'CAF', label: 'CAF' },
  ALG: { code: 'CAF', label: 'CAF' },
  TUN: { code: 'CAF', label: 'CAF' },
  GHA: { code: 'CAF', label: 'CAF' },
  SEN: { code: 'CAF', label: 'CAF' },
  CIV: { code: 'CAF', label: 'CAF' },
  RSA: { code: 'CAF', label: 'CAF' },
  CPV: { code: 'CAF', label: 'CAF' },
  COD: { code: 'CAF', label: 'CAF' },
  NZL: { code: 'OFC', label: 'OFC' },
};

export function getConfederation(abbr: string): { code: 'UEFA' | 'CONMEBOL' | 'CONCACAF' | 'AFC' | 'CAF' | 'OFC'; label: string } | null {
  return CONFEDERATION_BY_ABBR[abbr.toUpperCase()] ?? null;
}

export function buildTeamFromAbbr(abbr: string, id: string, name?: string): Team {
  const key = abbr.toUpperCase();
  const meta = TEAM_REGISTRY[key] ?? { code: 'xx', color: '#888', name: name ?? abbr };
  const code = meta.code === 'xx' ? abbr.toLowerCase().slice(0, 2) : meta.code;
  return {
    id,
    name: name ?? meta.name,
    shortName: meta.shortName ?? meta.name,
    abbreviation: abbr,
    countryCode: code,
    flagUrl: `https://flagcdn.com/w160/${code}.png`,
    color: meta.color,
  };
}

export function getFlagUrl(countryCode: string, size: 'w20' | 'w40' | 'w80' | 'w160' | 'w320' | 'w640' = 'w160'): string {
  return `https://flagcdn.com/${size}/${countryCode.toLowerCase()}.png`;
}
