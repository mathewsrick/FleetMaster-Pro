/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_WOMPI_API_URL?: string
  readonly GEMINI_API_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}