/// <reference types="vite/client" />

declare module 'troika-three-text' {
  export function preloadFont(
    options: { font?: string; characters?: string | string[] },
    callback: () => void
  ): void
}
