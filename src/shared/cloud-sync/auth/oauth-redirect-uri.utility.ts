import { withBase } from "../../configuration/base-path";

/**
 * The redirect URI every provider's PKCE auth adapter sends as
 * `redirect_uri` and later re-supplies verbatim on token exchange (most
 * providers require the two to match exactly). Built from the current
 * origin plus this app's base path so it resolves correctly whether the app
 * is served from the domain root or a sub-path (e.g. a GitHub Pages-style
 * deployment) - unlike most in-app `href`/`navigateTo` targets, this one is
 * handed to an external OAuth server and must be a fully qualified URL, not
 * an app-relative path.
 *
 * Uses `self.location`, not `window.location` - `buildAuthorizationUrl` runs
 * on the main thread, but `exchangeCodeForTokens`/`refreshTokens` run inside
 * `sync.worker.ts`'s dedicated Web Worker, which has no `window` global.
 * `self` resolves to the same `Window` on the main thread and to the
 * worker's own global scope inside a worker, and `.location.origin` exists
 * on both.
 */
export const getOAuthRedirectUri = (): string =>
  `${self.location.origin}${withBase("/oauth/callback")}`;
