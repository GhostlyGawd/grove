/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Dev fallback host base URL when no manifest/bridge is present. */
  readonly VITE_GROVE_HOST_URL?: string;
  /** Dev fallback bearer token paired with `VITE_GROVE_HOST_URL`. */
  readonly VITE_GROVE_HOST_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
