// Frontend Configuration Constants

// The API is called on the SAME origin as the page: /api. In production nginx proxies it to the backend
// (whatever port the site is served on); `npm run dev` proxies it via vite.config.js.
// Override with VITE_API_URL only if the backend lives on a different origin (it then needs CORS).
export const ENV = {
  API_BASE_URL: import.meta.env?.VITE_API_URL || '/api',
  STORAGE_TOKEN_KEY: 'cyberisland_token',
  STORAGE_REFRESH_KEY: 'cyberisland_refresh_token',
  STORAGE_TEAM_KEY: 'cyberisland_team_data',
  GAME_CANVAS_WIDTH: 1280,
  GAME_CANVAS_HEIGHT: 720,
  DEFAULT_AUDIO_MUTED: false,

  // Dev-only escape hatch: `VITE_SKIP_LOGIN=true` in frontend/.env.local plays fully offline
  // (no login, no timer, nothing recorded). Ignored in production builds.
  SKIP_LOGIN: Boolean(import.meta.env?.DEV) && import.meta.env?.VITE_SKIP_LOGIN === 'true',

  // How often the contest status (timer / started / ended) is re-fetched while playing
  STATUS_POLL_MS: 10000,
  // Retry interval on the "waiting for contest" / "server unreachable" screens
  WAITING_POLL_MS: 3000,

  // Frontend challenge number (1..6) -> backend stage id (1..6, strictly sequential on the server).
  // The game has exactly 6 stages, so this is the identity map.
  STAGE_MAP: { 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6 },
};
