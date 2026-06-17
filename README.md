# Mundial 2026 · Dashboard

Web para seguir el Mundial de Fútbol 2026 (EE.UU. · Canadá · México).

## Stack

- **Vite + React 19 + TypeScript** — SPA estática
- **Tailwind CSS v4** — utility-first
- **Framer Motion** — animaciones
- **TanStack Query** — cache + refetch
- **React Router 7** — routing
- **Datos**: ESPN (`site.api.espn.com/apis/site/v2/sports/soccer/fifa.world`)

## Funcionalidades

- **Inicio**: partidos en vivo, partidos del día, próximos partidos, destaque de España y Argentina
- **Grupos (A-L)**: clasificación con posiciones, puntos, diferencia de gol, badges de cualificación + predicción de clasificados
- **Calendario**: completo con filtros por estado (en vivo / próximos / finalizados) y grupo
- **Eliminatorias**: cuadro visual de 32avos → Octavos → Cuartos → Semis → Final con predicción de ganadores
- **Equipos**: 48 selecciones con banderas
- **Goleadores** (`/goleadores`): Bota de Oro con podio para top 3, headshots, métricas (goles, asist, penales, prom G/PJ)
- **Detalle de equipo**: partidos jugados, próximos, estadísticas
- **Detalle de partido**: marcador en vivo, **timeline de eventos** (goles, tarjetas, cambios, VAR)
- **Bracket Challenge**: predicciones en localStorage, scoring automático (1 pto por grupo, 3 por eliminatoria)

## Estructura

```
src/
├── components/     # UI (layout, matches, groups, bracket, teams, ui)
├── pages/          # HomePage, GroupsPage, CalendarPage, TopScorersPage, BracketPage, TeamsPage, TeamDetailPage, MatchDetailPage
├── hooks/          # useWorldCup (TanStack Query)
├── lib/            # api.ts (ESPN + n8n client), espn.ts (mappers), types.ts, teams.ts, constants.ts, format.ts, predictions.ts
└── index.css       # Tailwind v4 + theme tokens
```

## Comandos

```bash
pnpm install
pnpm dev        # localhost:5173
pnpm build      # genera dist/
pnpm preview    # sirve dist/ en localhost:4173
```

## Configuración

Por defecto la app consulta ESPN directo desde el navegador (CORS habilitado).

Si querés usar un workflow n8n como proxy/cache, copiá `.env.example` a `.env.local` y configurá:

```bash
VITE_N8N_BASE=https://tu-n8n.example.com
```

Endpoints esperados en n8n:
- `GET /webhook/world-cup/scoreboard?dates=YYYYMMDD-YYYYMMDD` → `{ matches: [...] }`
- `GET /webhook/world-cup/standings` → `{ groups: [...] }`

Si el endpoint de n8n falla, la app cae a ESPN directo.

## Bracket Challenge

Las predicciones se guardan en `localStorage` (key: `mundial-2026-predictions-v1`):
- Por cada grupo: elegís 1° y 2° clasificado (1 punto por acierto)
- Por cada partido eliminatorio: elegís ganador (3 puntos por acierto)
- Banner con score aparece en `/grupos` y `/eliminatorias`

## Build

El output de `pnpm build` es estático (HTML/JS/CSS). Servilo con cualquier servidor estático. La SPA necesita fallback a `index.html` para las rutas client-side:

```nginx
# nginx example
location / {
    try_files $uri $uri/ /index.html;
}
```
