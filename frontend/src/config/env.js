// Frontend Configuration Constants
export const ENV = {
  API_BASE_URL: import.meta.env?.VITE_API_URL || 'http://localhost:3000/api',
  STORAGE_TOKEN_KEY: 'cyberisland_token',
  STORAGE_REFRESH_KEY: 'cyberisland_refresh_token',
  STORAGE_TEAM_KEY: 'cyberisland_team_data',
  GAME_CANVAS_WIDTH: 1280,
  GAME_CANVAS_HEIGHT: 720,
  DEFAULT_AUDIO_MUTED: false,
};
