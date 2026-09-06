import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ICloudProviderConnection,
  ISyncEnvelope,
} from "../../../interfaces/cloud-sync.interface";

vi.mock("../../auth/microsoft-auth.adapter", () => ({
  microsoftAuthAdapter: {
    providerId: "onedrive",
    buildAuthorizationUrl: vi.fn(),
    exchangeCodeForTokens: vi.fn(),
    refreshTokens: vi.fn(),
  },
}));

const { microsoftAuthAdapter } = await import("../../auth/microsoft-auth.adapter");
const { microsoftFileAdapter } = await import("../microsoft-file.adapter");

const makeConnection = (
  overrides: Partial<ICloudProviderConnection> = {},
): ICloudProviderConnection => ({
  providerId: "onedrive",
  connectedAt: 1,
  tokens: {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAt: Date.now() + 60 * 60 * 1000,
    scope: "Files.ReadWrite.AppFolder offline_access",
    obtainedAt: Date.now(),
  },
  ...overrides,
});

const makeEnvelope = (): ISyncEnvelope => ({
  schemaVersion: 1,
  deviceId: "device-1",
  savedAt: 1,
  savedBrews: [],
  savedShots: [],
  customBrewTypes: [],
  customStepLabels: [],
  tombstones: [],
});

describe("microsoftFileAdapter.readSyncFile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the envelope and the eTag fetched from the metadata endpoint", async () => {
    const envelope = makeEnvelope();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 200, ok: true, json: () => Promise.resolve(envelope) })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ eTag: "etag-123" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await microsoftFileAdapter.readSyncFile(makeConnection());

    expect(result).toEqual({ envelope, revision: "etag-123", tokens: undefined });
    expect(fetchMock.mock.calls[0][0]).toContain(":/content");
    expect(fetchMock.mock.calls[1][0]).not.toContain(":/content");
  });

  it("returns null for a 404 (no sync file yet)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 404, ok: false, json: () => Promise.resolve({}) }),
    );

    const result = await microsoftFileAdapter.readSyncFile(makeConnection());

    expect(result).toBeNull();
  });

  it("throws for a non-ok, non-404 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 500, ok: false, json: () => Promise.resolve({}) }),
    );

    await expect(microsoftFileAdapter.readSyncFile(makeConnection())).rejects.toThrow(/500/);
  });

  it("refreshes once and retries on a 401, then succeeds", async () => {
    vi.mocked(microsoftAuthAdapter.refreshTokens).mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 1000,
      scope: "Files.ReadWrite.AppFolder offline_access",
      obtainedAt: Date.now(),
    });

    const envelope = makeEnvelope();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 401, ok: false, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ status: 200, ok: true, json: () => Promise.resolve(envelope) })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ eTag: "etag-1" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await microsoftFileAdapter.readSyncFile(makeConnection());

    expect(microsoftAuthAdapter.refreshTokens).toHaveBeenCalledWith("refresh-token");
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer new-access-token");
    expect(result?.envelope).toEqual(envelope);
    // The reactively-refreshed token must be reported back, not just used
    // for the one retried request - otherwise the caller persists a
    // connection with a stale accessToken and repeats the same
    // refresh-then-discard dance on every subsequent sync.
    expect(result?.tokens?.accessToken).toBe("new-access-token");
  });

  it("throws a reconnect-required error when the retried request still 401s", async () => {
    vi.mocked(microsoftAuthAdapter.refreshTokens).mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 1000,
      scope: "Files.ReadWrite.AppFolder offline_access",
      obtainedAt: Date.now(),
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 401, ok: false, json: () => Promise.resolve({}) }),
    );

    await expect(microsoftFileAdapter.readSyncFile(makeConnection())).rejects.toThrow(/reconnect/i);
  });
});

describe("microsoftFileAdapter.writeSyncFile", () => {
  beforeEach(() => {
    vi.mocked(microsoftAuthAdapter.refreshTokens).mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("PUTs without If-Match when there's no lastKnownRevision", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ eTag: "etag-1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await microsoftFileAdapter.writeSyncFile(makeConnection(), makeEnvelope());

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers["If-Match"]).toBeUndefined();
    expect(fetchMock.mock.calls[0][1].method).toBe("PUT");
    expect(result).toEqual({ revision: "etag-1", tokens: undefined });
  });

  it("includes If-Match when lastKnownRevision is set", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ eTag: "etag-2" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await microsoftFileAdapter.writeSyncFile(
      makeConnection({ lastKnownRevision: "etag-1" }),
      makeEnvelope(),
    );

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(headers["If-Match"]).toBe("etag-1");
  });

  it("refreshes once and retries on a 401, reporting the refreshed tokens back", async () => {
    vi.mocked(microsoftAuthAdapter.refreshTokens).mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 1000,
      scope: "Files.ReadWrite.AppFolder offline_access",
      obtainedAt: Date.now(),
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 401, ok: false, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ eTag: "etag-1" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await microsoftFileAdapter.writeSyncFile(makeConnection(), makeEnvelope());

    expect(microsoftAuthAdapter.refreshTokens).toHaveBeenCalledWith("refresh-token");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer new-access-token");
    expect(result).toEqual({
      revision: "etag-1",
      tokens: expect.objectContaining({ accessToken: "new-access-token" }),
    });
  });

  it("throws a reconnect-required error when the retried write still 401s", async () => {
    vi.mocked(microsoftAuthAdapter.refreshTokens).mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 1000,
      scope: "Files.ReadWrite.AppFolder offline_access",
      obtainedAt: Date.now(),
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 401, ok: false, json: () => Promise.resolve({}) }),
    );

    await expect(
      microsoftFileAdapter.writeSyncFile(makeConnection(), makeEnvelope()),
    ).rejects.toThrow(/reconnect/i);
  });

  it("throws a clear error on a non-ok, non-401 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 500, ok: false, json: () => Promise.resolve({}) }),
    );

    await expect(
      microsoftFileAdapter.writeSyncFile(makeConnection(), makeEnvelope()),
    ).rejects.toThrow(/500/);
  });
});
