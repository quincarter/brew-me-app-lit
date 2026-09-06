import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { microsoftAuthAdapter } from "../microsoft-auth.adapter";

describe("microsoftAuthAdapter", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_MICROSOFT_CLIENT_ID", "test-client-id");
    vi.stubGlobal("location", { origin: "https://brewme.example" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("buildAuthorizationUrl", () => {
    it("builds Microsoft's common-tenant authorization URL with PKCE params and offline access", () => {
      const url = new URL(microsoftAuthAdapter.buildAuthorizationUrl("challenge-123", "state-abc"));

      expect(url.origin + url.pathname).toBe(
        "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      );
      expect(url.searchParams.get("client_id")).toBe("test-client-id");
      expect(url.searchParams.get("response_type")).toBe("code");
      expect(url.searchParams.get("response_mode")).toBe("query");
      expect(url.searchParams.get("scope")).toBe("offline_access Files.ReadWrite.AppFolder");
      expect(url.searchParams.get("code_challenge")).toBe("challenge-123");
      expect(url.searchParams.get("code_challenge_method")).toBe("S256");
      expect(url.searchParams.get("state")).toBe("state-abc");
      expect(url.searchParams.get("redirect_uri")).toBe("https://brewme.example/oauth/callback");
    });

    it("throws a clear error when no client id is configured", () => {
      vi.stubEnv("VITE_MICROSOFT_CLIENT_ID", "");
      expect(() => microsoftAuthAdapter.buildAuthorizationUrl("c", "s")).toThrow(
        /VITE_MICROSOFT_CLIENT_ID/,
      );
    });
  });

  describe("exchangeCodeForTokens", () => {
    it("POSTs a form-encoded authorization_code grant and maps the response to ICloudProviderTokens", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: "access-1",
            refresh_token: "refresh-1",
            expires_in: 3600,
            scope: "Files.ReadWrite.AppFolder offline_access",
            token_type: "Bearer",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      const tokens = await microsoftAuthAdapter.exchangeCodeForTokens("auth-code", "verifier-1");

      expect(fetchMock).toHaveBeenCalledWith(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        expect.objectContaining({ method: "POST" }),
      );
      const body = fetchMock.mock.calls[0][1].body as string;
      const params = new URLSearchParams(body);
      expect(params.get("grant_type")).toBe("authorization_code");
      expect(params.get("code")).toBe("auth-code");
      expect(params.get("code_verifier")).toBe("verifier-1");
      expect(params.get("client_id")).toBe("test-client-id");
      expect(params.get("redirect_uri")).toBe("https://brewme.example/oauth/callback");

      expect(tokens.accessToken).toBe("access-1");
      expect(tokens.refreshToken).toBe("refresh-1");
      expect(tokens.scope).toBe("Files.ReadWrite.AppFolder offline_access");
      expect(tokens.expiresAt).toBeGreaterThan(Date.now());
    });

    it("throws when Microsoft responds with a non-ok status", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400 }));

      await expect(
        microsoftAuthAdapter.exchangeCodeForTokens("bad-code", "verifier"),
      ).rejects.toThrow(/400/);
    });
  });

  describe("refreshTokens", () => {
    it("POSTs a refresh_token grant with the offline_access scope and falls back to the existing refresh token when none is reissued", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: "access-2",
            expires_in: 3600,
            scope: "Files.ReadWrite.AppFolder offline_access",
            token_type: "Bearer",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      const tokens = await microsoftAuthAdapter.refreshTokens("refresh-1");

      const body = fetchMock.mock.calls[0][1].body as string;
      const params = new URLSearchParams(body);
      expect(params.get("grant_type")).toBe("refresh_token");
      expect(params.get("refresh_token")).toBe("refresh-1");
      expect(params.get("scope")).toBe("offline_access Files.ReadWrite.AppFolder");

      expect(tokens.accessToken).toBe("access-2");
      expect(tokens.refreshToken).toBe("refresh-1");
    });
  });
});
