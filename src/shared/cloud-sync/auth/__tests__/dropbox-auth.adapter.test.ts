import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { dropboxAuthAdapter } from "../dropbox-auth.adapter";

describe("dropboxAuthAdapter", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "test-client-id");
    vi.stubGlobal("location", { origin: "https://brewme.example" });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("buildAuthorizationUrl", () => {
    it("builds Dropbox's authorization URL with PKCE params and offline access", () => {
      const url = new URL(dropboxAuthAdapter.buildAuthorizationUrl("challenge-123", "state-abc"));

      expect(url.origin + url.pathname).toBe("https://www.dropbox.com/oauth2/authorize");
      expect(url.searchParams.get("client_id")).toBe("test-client-id");
      expect(url.searchParams.get("response_type")).toBe("code");
      expect(url.searchParams.get("code_challenge")).toBe("challenge-123");
      expect(url.searchParams.get("code_challenge_method")).toBe("S256");
      expect(url.searchParams.get("token_access_type")).toBe("offline");
      expect(url.searchParams.get("state")).toBe("state-abc");
      expect(url.searchParams.get("redirect_uri")).toBe("https://brewme.example/oauth/callback");
    });

    it("throws a clear error when no client id is configured", () => {
      vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "");
      expect(() => dropboxAuthAdapter.buildAuthorizationUrl("c", "s")).toThrow(
        /VITE_DROPBOX_CLIENT_ID/,
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
            expires_in: 14400,
            scope: "files.content.write",
            token_type: "bearer",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      const tokens = await dropboxAuthAdapter.exchangeCodeForTokens("auth-code", "verifier-1");

      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.dropboxapi.com/oauth2/token",
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
      expect(tokens.scope).toBe("files.content.write");
      expect(tokens.expiresAt).toBeGreaterThan(Date.now());
    });

    it("throws when Dropbox responds with a non-ok status", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 400 }));

      await expect(
        dropboxAuthAdapter.exchangeCodeForTokens("bad-code", "verifier"),
      ).rejects.toThrow(/400/);
    });
  });

  describe("refreshTokens", () => {
    it("POSTs a refresh_token grant and falls back to the existing refresh token when none is reissued", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            access_token: "access-2",
            expires_in: 14400,
            scope: "files.content.write",
            token_type: "bearer",
          }),
      });
      vi.stubGlobal("fetch", fetchMock);

      const tokens = await dropboxAuthAdapter.refreshTokens("refresh-1");

      const body = fetchMock.mock.calls[0][1].body as string;
      const params = new URLSearchParams(body);
      expect(params.get("grant_type")).toBe("refresh_token");
      expect(params.get("refresh_token")).toBe("refresh-1");

      expect(tokens.accessToken).toBe("access-2");
      expect(tokens.refreshToken).toBe("refresh-1");
    });
  });
});
