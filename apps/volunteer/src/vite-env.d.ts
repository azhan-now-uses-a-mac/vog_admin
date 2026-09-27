/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Neon Function API base URL, e.g. http://localhost:8787 in development.
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
