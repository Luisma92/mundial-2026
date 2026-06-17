# Mundial 2026 · Dashboard

Web para seguir el Mundial de Fútbol 2026 (EE.UU. · Canadá · México).

## Stack

- **Vite + React 19 + TypeScript** — SPA estática
- **Tailwind CSS v4** — utility-first
- **Framer Motion** — animaciones
- **TanStack Query** — cache + refetch
- **React Router 7** — routing
- **Datos**: ESPN (`site.api.espn.com/apis/site/v2/sports/soccer/fifa.world`)
- **Deploy**: nginx reverse proxy + mkcert + AdGuard DNS rewrite

## Funcionalidades

- **Inicio**: partidos en vivo, partidos del día, próximos partidos, destaque de España y Argentina
- **Grupos (A-L)**: clasificación con posiciones, puntos, diferencia de gol, badges de cualificación
- **Calendario**: completo con filtros por estado (en vivo / próximos / finalizados) y grupo
- **Eliminatorias**: cuadro visual de 32avos → Octavos → Cuartos → Semis → Final (cuando arranca)
- **Equipos**: 48 selecciones con banderas
- **Detalle de equipo**: partidos jugados, próximos, estadísticas (goles, posiciones)
- **Detalle de partido**: marcador en vivo, eventos, hora local España/Madrid

## Estructura

```
src/
├── components/     # UI (layout, matches, groups, bracket, teams, ui)
├── pages/          # HomePage, GroupsPage, CalendarPage, BracketPage, TeamsPage, TeamDetailPage, MatchDetailPage
├── hooks/          # useWorldCup (TanStack Query)
├── lib/            # api.ts (ESPN client), espn.ts (mappers), types.ts, teams.ts, constants.ts, format.ts
└── index.css       # Tailwind v4 + theme tokens (colores España/Argentina)
```

## Comandos

```bash
pnpm install
pnpm dev       # localhost:5173
pnpm build     # genera dist/
pnpm preview   # sirve dist/ en localhost:4173

# Deploy
./deploy/deploy.sh
```

## Datos

ESPN API se consulta directo desde el navegador. CORS habilitado.
