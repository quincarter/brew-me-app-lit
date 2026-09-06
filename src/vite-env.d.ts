/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/**
 * Cloud-sync provider client IDs - public PKCE client ids, safe to ship in
 * built JS (no secret involved), see `.env.example`. Optional because a dev
 * checkout without a `.env` should still build/typecheck; the adapters
 * themselves throw a clear error at runtime if a needed one is missing.
 */
interface ImportMetaEnv {
  readonly VITE_DROPBOX_CLIENT_ID?: string;
  readonly VITE_MICROSOFT_CLIENT_ID?: string;
  readonly VITE_GOOGLE_CLIENT_ID?: string;
}
