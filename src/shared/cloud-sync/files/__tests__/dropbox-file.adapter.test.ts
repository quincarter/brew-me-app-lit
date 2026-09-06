import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ICloudProviderConnection,
  ISyncEnvelope,
} from "../../../interfaces/cloud-sync.interface";

vi.mock("../../auth/dropbox-auth.adapter", () => ({
  dropboxAuthAdapter: {
    providerId: "dropbox",
    buildAuthorizationUrl: vi.fn(),
    exchangeCodeForTokens: vi.fn(),
    refreshTokens: vi.fn(),
  },
}));

const { dropboxAuthAdapter } = await import("../../auth/dropbox-auth.adapter");
const { dropboxFileAdapter } = await import("../dropbox-file.adapter");

const makeConnection = (
  overrides: Partial<ICloudProviderConnection> = {},
): ICloudProviderConnection => ({
  providerId: "dropbox",
  connectedAt: 1,
  tokens: {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAt: Date.now() + 60 * 60 * 1000,
    scope: "files.content.write",
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

describe("dropboxFileAdapter.readSyncFile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns the envelope and rev parsed from the Dropbox-API-Result header", async () => {
    const envelope = makeEnvelope();
    const response = {
      status: 200,
      ok: true,
      headers: { get: () => JSON.stringify({ rev: "rev-123" }) },
      text: () => Promise.resolve(JSON.stringify(envelope)),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const result = await dropboxFileAdapter.readSyncFile(makeConnection());

    expect(result).toEqual({ envelope, revision: "rev-123" });
  });

  it("returns null for a path/not_found 409 (no sync file yet)", async () => {
    const response = {
      status: 409,
      ok: false,
      headers: { get: () => null },
      json: () =>
        Promise.resolve({
          error_summary: "path/not_found/...",
          error: { ".tag": "path", path: { ".tag": "not_found" } },
        }),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    const result = await dropboxFileAdapter.readSyncFile(makeConnection());

    expect(result).toBeNull();
  });

  it("throws for a 409 that isn't path/not_found", async () => {
    const response = {
      status: 409,
      ok: false,
      headers: { get: () => null },
      json: () =>
        Promise.resolve({
          error_summary: "path/conflict/...",
          error: { ".tag": "path", path: { ".tag": "conflict" } },
        }),
    };
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    await expect(dropboxFileAdapter.readSyncFile(makeConnection())).rejects.toThrow(
      /path\/conflict/,
    );
  });

  it("refreshes once and retries on a 401, then succeeds", async () => {
    vi.mocked(dropboxAuthAdapter.refreshTokens).mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 1000,
      scope: "files.content.write",
      obtainedAt: Date.now(),
    });

    const envelope = makeEnvelope();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 401, ok: false, headers: { get: () => null } })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: { get: () => null },
        text: () => Promise.resolve(JSON.stringify(envelope)),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await dropboxFileAdapter.readSyncFile(makeConnection());

    expect(dropboxAuthAdapter.refreshTokens).toHaveBeenCalledWith("refresh-token");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer new-access-token");
    expect(result?.envelope).toEqual(envelope);
    // The reactively-refreshed token must be reported back, not just used for
    // the one retried request - otherwise the caller persists a connection
    // with a stale accessToken and repeats the same refresh-then-discard
    // dance on every subsequent sync.
    expect(result?.tokens?.accessToken).toBe("new-access-token");
  });

  it("throws a reconnect-required error when the retried request still 401s", async () => {
    vi.mocked(dropboxAuthAdapter.refreshTokens).mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 1000,
      scope: "files.content.write",
      obtainedAt: Date.now(),
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 401, ok: false, headers: { get: () => null } }),
    );

    await expect(dropboxFileAdapter.readSyncFile(makeConnection())).rejects.toThrow(/reconnect/i);
  });
});

describe("dropboxFileAdapter.writeSyncFile", () => {
  beforeEach(() => {
    vi.mocked(dropboxAuthAdapter.refreshTokens).mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses add mode with no lastKnownRevision", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ rev: "rev-1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await dropboxFileAdapter.writeSyncFile(makeConnection(), makeEnvelope());

    const arg = JSON.parse(fetchMock.mock.calls[0][1].headers["Dropbox-API-Arg"]);
    expect(arg.mode).toEqual({ ".tag": "add" });
    expect(result).toEqual({ revision: "rev-1" });
  });

  it("uses update mode with lastKnownRevision", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ rev: "rev-2" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await dropboxFileAdapter.writeSyncFile(
      makeConnection({ lastKnownRevision: "rev-1" }),
      makeEnvelope(),
    );

    const arg = JSON.parse(fetchMock.mock.calls[0][1].headers["Dropbox-API-Arg"]);
    expect(arg.mode).toEqual({ ".tag": "update", update: "rev-1" });
  });

  it("refreshes once and retries on a 401, reporting the refreshed tokens back", async () => {
    vi.mocked(dropboxAuthAdapter.refreshTokens).mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 1000,
      scope: "files.content.write",
      obtainedAt: Date.now(),
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 401, ok: false, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ rev: "rev-1" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await dropboxFileAdapter.writeSyncFile(makeConnection(), makeEnvelope());

    expect(dropboxAuthAdapter.refreshTokens).toHaveBeenCalledWith("refresh-token");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer new-access-token");
    expect(result).toEqual({
      revision: "rev-1",
      tokens: expect.objectContaining({ accessToken: "new-access-token" }),
    });
  });

  it("throws a reconnect-required error when the retried write still 401s", async () => {
    vi.mocked(dropboxAuthAdapter.refreshTokens).mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 1000,
      scope: "files.content.write",
      obtainedAt: Date.now(),
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 401, ok: false, json: () => Promise.resolve({}) }),
    );

    await expect(
      dropboxFileAdapter.writeSyncFile(makeConnection(), makeEnvelope()),
    ).rejects.toThrow(/reconnect/i);
  });

  it("throws with the Dropbox error summary on a non-ok, non-401 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 500,
        ok: false,
        json: () => Promise.resolve({ error_summary: "internal_server_error" }),
      }),
    );

    await expect(
      dropboxFileAdapter.writeSyncFile(makeConnection(), makeEnvelope()),
    ).rejects.toThrow(/internal_server_error/);
  });
});
