export const TOURNAMENT = {
  name: 'Copa Mundial de la FIFA 2026',
  shortName: 'Mundial 2026',
  hostCountries: ['Estados Unidos', 'Canadá', 'México'],
  startDate: '2026-06-11',
  endDate: '2026-07-19',
  teams: 48,
  groups: 12,
  groupLetters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const,
  cities: [
    'Atlanta', 'Boston', 'Dallas', 'Houston', 'Kansas City', 'Los Angeles',
    'Miami', 'Nueva York/Nueva Jersey', 'Philadelphia', 'San Francisco',
    'Seattle', 'Toronto', 'Vancouver', 'México City', 'Guadalajara', 'Monterrey',
  ],
};

export const FAVORITE_TEAMS = ['ESP', 'ARG'] as const;

export const FEATURED_VENUES = [
  { city: 'México City', stadium: 'Estadio Azteca', capacity: 87523, match: 'Inaugural' },
  { city: 'Nueva York/Nueva Jersey', stadium: 'MetLife Stadium', capacity: 82500, match: 'Final' },
  { city: 'Dallas', stadium: 'AT&T Stadium', capacity: 80000, match: 'Semifinal' },
  { city: 'Los Angeles', stadium: 'SoFi Stadium', capacity: 70240, match: 'Cuartos' },
  { city: 'Toronto', stadium: 'BMO Field', capacity: 30000, match: 'Grupos' },
] as const;

export const REFRESH_INTERVALS = {
  live: 30_000,
  upcoming: 60_000,
  standings: 120_000,
  teams: 600_000,
} as const;
