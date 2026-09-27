/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Neon Function API base URL, e.g. http://localhost:8787 in development.
  readonly VITE_API_URL: string
  // Neon Auth base URL for the branch (from `neon neon-auth status`).
  readonly VITE_NEON_AUTH_URL: string
  readonly VITE_DONATE_URL?: string
  readonly VITE_VOLUNTEER_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
