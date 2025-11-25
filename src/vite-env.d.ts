/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_URL: string;
  readonly VITE_API_BASE_PATH: string;

  // WebSocket Configuration
  readonly VITE_WS_URL: string;
  readonly VITE_WS_RECONNECTION_ATTEMPTS: string;
  readonly VITE_WS_RECONNECTION_DELAY: string;
  readonly VITE_WS_RECONNECTION_DELAY_MAX: string;

  // Application Configuration
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;

  // Development
  readonly VITE_DEV_PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
