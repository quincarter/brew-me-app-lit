import type {
  ICloudAuthAdapter,
  ICloudProviderTokens,
} from "../../interfaces/cloud-sync.interface";
import { getOAuthRedirectUri } from "./oauth-redirect-uri.utility";

// The `common` tenant (not `consumers`) so both personal Microsoft accounts
// and organizational (Entra) accounts can connect - see .env.example for the
// app registration this expects.
const AUTHORIZE_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

/** `offline_access` gets a refresh token; `Files.ReadWrite.AppFolder` scopes Graph access to just this app's sandboxed "App Root" folder. */
const SCOPE = "offline_access Files.ReadWrite.AppFolder";

/** Microsoft's `/oauth2/v2.0/token` response shape - both the code exchange and the refresh grant return this same shape. Microsoft usually re-issues `refresh_token` on a refresh too, but it's still optional defensively. */
interface IMicrosoftTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

const getClientId = (): string => {
  const clientId: string | undefined = import.meta.env.VITE_MICROSOFT_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "VITE_MICROSOFT_CLIENT_ID is not configured - see .env.example to set up an Azure AD app registration.",
    );
  }
  return clientId;
};

const toTokens = (
  response: IMicrosoftTokenResponse,
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

const postForm = async (body: Record<string, string>): Promise<IMicrosoftTokenResponse> => {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });

  if (!response.ok) {
    throw new Error(`Microsoft token request failed (${response.status}).`);
  }

  return (await response.json()) as IMicrosoftTokenResponse;
};

/**
 * Microsoft Graph's PKCE public-client auth adapter - the Azure AD app is
 * registered as a "Single-page application" platform (not "Web"), so no
 * client secret is ever sent (see .env.example).
 */
export const microsoftAuthAdapter: ICloudAuthAdapter = {
  providerId: "onedrive",

  buildAuthorizationUrl(codeChallenge, state) {
    const params = new URLSearchParams({
      client_id: getClientId(),
      response_type: "code",
      redirect_uri: getOAuthRedirectUri(),
      response_mode: "query",
      scope: SCOPE,
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
      scope: SCOPE,
    });
    return toTokens(response, refreshToken);
  },
};
