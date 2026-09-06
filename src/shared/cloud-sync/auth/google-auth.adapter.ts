import type {
  ICloudAuthAdapter,
  ICloudProviderTokens,
} from "../../interfaces/cloud-sync.interface";
import { getOAuthRedirectUri } from "./oauth-redirect-uri.utility";

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

/** Scoped to just the hidden app-data folder, never the person's visible Drive. */
const SCOPE = "https://www.googleapis.com/auth/drive.appdata";

/** Google's `/token` response shape - both the code exchange and the refresh grant return this same shape. `refresh_token` is only reliably present on a first-consent exchange (see `prompt=consent` below), never on a refresh. */
interface IGoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

const getClientId = (): string => {
  const clientId: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "VITE_GOOGLE_CLIENT_ID is not configured - see .env.example to set up a Google Cloud Console OAuth client.",
    );
  }
  return clientId;
};

const toTokens = (
  response: IGoogleTokenResponse,
  existingRefreshToken?: string,
): ICloudProviderTokens => {
  const obtainedAt = Date.now();
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token ?? existingRefreshToken,
    expiresAt: obtainedAt + response.expires_in * 1000,
    scope: response.scope,
    obtainedAt,
  };
};

const postForm = async (body: Record<string, string>): Promise<IGoogleTokenResponse> => {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });

  if (!response.ok) {
    throw new Error(`Google token request failed (${response.status}).`);
  }

  return (await response.json()) as IGoogleTokenResponse;
};

/**
 * Google Drive's PKCE public-client auth adapter - no client secret sent
 * (see .env.example). Ships "as beta": Google's refresh-token posture is
 * rockier than Dropbox/Microsoft's while the OAuth consent screen is in
 * "Testing" publishing status (7-day refresh-token expiry, 100 test-user
 * cap) - `cloud-sync-page.ts` surfaces a persistent "may need reconnecting"
 * note on this provider's row for that reason.
 */
export const googleAuthAdapter: ICloudAuthAdapter = {
  providerId: "google-drive",

  buildAuthorizationUrl(codeChallenge, state) {
    const params = new URLSearchParams({
      client_id: getClientId(),
      redirect_uri: getOAuthRedirectUri(),
      response_type: "code",
      scope: SCOPE,
      // Required to get a refresh token at all.
      access_type: "offline",
      // Google only re-issues a refresh token on the very first consent
      // grant unless re-consent is forced - since a person may disconnect
      // and reconnect, forcing this every time guarantees a refresh token
      // comes back instead of silently omitting it on a second connect.
      prompt: "consent",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      state,
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  },

  async exchangeCodeForTokens(code, codeVerifier) {
    const response = await postForm({
      grant_type: "authorization_code",
      client_id: getClientId(),
      redirect_uri: getOAuthRedirectUri(),
      code,
      code_verifier: codeVerifier,
    });
    return toTokens(response);
  },

  async refreshTokens(refreshToken) {
    const response = await postForm({
      grant_type: "refresh_token",
      client_id: getClientId(),
      refresh_token: refreshToken,
    });
    return toTokens(response, refreshToken);
  },
};
