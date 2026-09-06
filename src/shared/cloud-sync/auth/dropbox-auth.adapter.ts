import type {
  ICloudAuthAdapter,
  ICloudProviderTokens,
} from "../../interfaces/cloud-sync.interface";
import { getOAuthRedirectUri } from "./oauth-redirect-uri.utility";

const AUTHORIZE_URL = "https://www.dropbox.com/oauth2/authorize";
const TOKEN_URL = "https://api.dropboxapi.com/oauth2/token";

/** Dropbox's `/oauth2/token` response shape (both the code exchange and the refresh grant return this same shape - `refresh_token` is only present on the very first exchange). */
interface IDropboxTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

const getClientId = (): string => {
  const clientId: string | undefined = import.meta.env.VITE_DROPBOX_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "VITE_DROPBOX_CLIENT_ID is not configured - see .env.example to set up a Dropbox app.",
    );
  }
  return clientId;
};

/** Dropbox only re-issues `refresh_token` on the very first code exchange - later refreshes must fall back to the one already on file. */
const toTokens = (
  response: IDropboxTokenResponse,
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

const postForm = async (body: Record<string, string>): Promise<IDropboxTokenResponse> => {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });

  if (!response.ok) {
    throw new Error(`Dropbox token request failed (${response.status}).`);
  }

  return (await response.json()) as IDropboxTokenResponse;
};

/**
 * Dropbox's PKCE public-client auth adapter - no client secret anywhere,
 * per the "Scoped access" + "App folder" app type set up in the Dropbox App
 * Console (see .env.example).
 */
export const dropboxAuthAdapter: ICloudAuthAdapter = {
  providerId: "dropbox",

  buildAuthorizationUrl(codeChallenge, state) {
    const params = new URLSearchParams({
      client_id: getClientId(),
      response_type: "code",
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      redirect_uri: getOAuthRedirectUri(),
      // Requests a refresh token alongside the access token so silent
      // background sync keeps working after the short-lived access token
      // expires, without asking the person to reconnect.
      token_access_type: "offline",
      state,
    });
    return `${AUTHORIZE_URL}?${params.toString()}`;
  },

  async exchangeCodeForTokens(code, codeVerifier) {
    const response = await postForm({
      grant_type: "authorization_code",
      code,
      client_id: getClientId(),
      redirect_uri: getOAuthRedirectUri(),
      code_verifier: codeVerifier,
    });
    return toTokens(response);
  },

  async refreshTokens(refreshToken) {
    const response = await postForm({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: getClientId(),
    });
    return toTokens(response, refreshToken);
  },
};
