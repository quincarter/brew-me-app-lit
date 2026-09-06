import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  ICloudProviderConnection,
  ISyncEnvelope,
} from "../../../interfaces/cloud-sync.interface";

vi.mock("../../auth/google-auth.adapter", () => ({
  googleAuthAdapter: {
    providerId: "google-drive",
    buildAuthorizationUrl: vi.fn(),
    exchangeCodeForTokens: vi.fn(),
    refreshTokens: vi.fn(),
  },
}));

const { googleAuthAdapter } = await import("../../auth/google-auth.adapter");
const { googleDriveFileAdapter } = await import("../google-drive-file.adapter");

const makeConnection = (
  overrides: Partial<ICloudProviderConnection> = {},
): ICloudProviderConnection => ({
  providerId: "google-drive",
  connectedAt: 1,
  tokens: {
    accessToken: "access-token",
    refreshToken: "refresh-token",
    expiresAt: Date.now() + 60 * 60 * 1000,
    scope: "https://www.googleapis.com/auth/drive.appdata",
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

describe("googleDriveFileAdapter.readSyncFile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fetches content directly by remoteFileId when already known", async () => {
    const envelope = makeEnvelope();
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ status: 200, ok: true, json: () => Promise.resolve(envelope) });
    vi.stubGlobal("fetch", fetchMock);

    const result = await googleDriveFileAdapter.readSyncFile(
      makeConnection({ remoteFileId: "file-1" }),
    );

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("/files/file-1?alt=media");
    expect(result).toEqual({ envelope, remoteFileId: "file-1", tokens: undefined });
  });

  it("lists appDataFolder to discover the file id when remoteFileId isn't known yet", async () => {
    const envelope = makeEnvelope();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ files: [{ id: "discovered-id" }] }),
      })
      .mockResolvedValueOnce({ status: 200, ok: true, json: () => Promise.resolve(envelope) });
    vi.stubGlobal("fetch", fetchMock);

    const result = await googleDriveFileAdapter.readSyncFile(makeConnection());

    expect(fetchMock.mock.calls[0][0]).toContain("spaces=appDataFolder");
    expect(fetchMock.mock.calls[1][0]).toContain("/files/discovered-id?alt=media");
    expect(result).toEqual({ envelope, remoteFileId: "discovered-id", tokens: undefined });
  });

  it("returns null when the list comes back empty (no remote file yet)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ files: [] }),
      }),
    );

    const result = await googleDriveFileAdapter.readSyncFile(makeConnection());

    expect(result).toBeNull();
  });

  it("refreshes once and retries on a 401 fetching content, then succeeds", async () => {
    vi.mocked(googleAuthAdapter.refreshTokens).mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 1000,
      scope: "https://www.googleapis.com/auth/drive.appdata",
      obtainedAt: Date.now(),
    });

    const envelope = makeEnvelope();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 401, ok: false, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({ status: 200, ok: true, json: () => Promise.resolve(envelope) });
    vi.stubGlobal("fetch", fetchMock);

    const result = await googleDriveFileAdapter.readSyncFile(
      makeConnection({ remoteFileId: "file-1" }),
    );

    expect(googleAuthAdapter.refreshTokens).toHaveBeenCalledWith("refresh-token");
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer new-access-token");
    expect(result?.envelope).toEqual(envelope);
    // The reactively-refreshed token must be reported back, not just used
    // for the one retried request - otherwise the caller persists a
    // connection with a stale accessToken and repeats the same
    // refresh-then-discard dance on every subsequent sync.
    expect(result?.tokens?.accessToken).toBe("new-access-token");
  });

  it("throws a reconnect-required error when the retried request still 401s", async () => {
    vi.mocked(googleAuthAdapter.refreshTokens).mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 1000,
      scope: "https://www.googleapis.com/auth/drive.appdata",
      obtainedAt: Date.now(),
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 401, ok: false, json: () => Promise.resolve({}) }),
    );

    await expect(
      googleDriveFileAdapter.readSyncFile(makeConnection({ remoteFileId: "file-1" })),
    ).rejects.toThrow(/reconnect/i);
  });
});

describe("googleDriveFileAdapter.writeSyncFile", () => {
  beforeEach(() => {
    vi.mocked(googleAuthAdapter.refreshTokens).mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("creates a new multipart file when there's no remoteFileId yet, and returns the new id", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ id: "created-id" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await googleDriveFileAdapter.writeSyncFile(makeConnection(), makeEnvelope());

    expect(fetchMock.mock.calls[0][0]).toContain("uploadType=multipart");
    expect(fetchMock.mock.calls[0][1].method).toBe("POST");
    expect(fetchMock.mock.calls[0][1].headers["Content-Type"]).toContain("multipart/related");
    expect(result).toEqual({ remoteFileId: "created-id", tokens: undefined });
    // No conditional-write primitive exists for appData files - never
    // reports a revision.
    expect(result).not.toHaveProperty("revision");
  });

  it("updates in place with a media-only PATCH when remoteFileId is already known", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve({ id: "file-1" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await googleDriveFileAdapter.writeSyncFile(
      makeConnection({ remoteFileId: "file-1" }),
      makeEnvelope(),
    );

    expect(fetchMock.mock.calls[0][0]).toContain("/files/file-1?uploadType=media");
    expect(fetchMock.mock.calls[0][1].method).toBe("PATCH");
    expect(result).toEqual({ remoteFileId: "file-1", tokens: undefined });
  });

  it("refreshes once and retries on a 401, reporting the refreshed tokens back", async () => {
    vi.mocked(googleAuthAdapter.refreshTokens).mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 1000,
      scope: "https://www.googleapis.com/auth/drive.appdata",
      obtainedAt: Date.now(),
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 401, ok: false, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ id: "file-1" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await googleDriveFileAdapter.writeSyncFile(
      makeConnection({ remoteFileId: "file-1" }),
      makeEnvelope(),
    );

    expect(googleAuthAdapter.refreshTokens).toHaveBeenCalledWith("refresh-token");
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer new-access-token");
    expect(result).toEqual({
      remoteFileId: "file-1",
      tokens: expect.objectContaining({ accessToken: "new-access-token" }),
    });
  });

  it("throws a reconnect-required error when the retried write still 401s", async () => {
    vi.mocked(googleAuthAdapter.refreshTokens).mockResolvedValue({
      accessToken: "new-access-token",
      refreshToken: "refresh-token",
      expiresAt: Date.now() + 1000,
      scope: "https://www.googleapis.com/auth/drive.appdata",
      obtainedAt: Date.now(),
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 401, ok: false, json: () => Promise.resolve({}) }),
    );

    await expect(
      googleDriveFileAdapter.writeSyncFile(
        makeConnection({ remoteFileId: "file-1" }),
        makeEnvelope(),
      ),
    ).rejects.toThrow(/reconnect/i);
  });

  it("recreates the file and returns the new id when a cached remoteFileId 404s (the file was deleted outside the app)", async () => {
    // Regression test: without this, a stale remoteFileId (e.g. the appData
    // file was deleted manually) would 404 on every single future sync
    // forever, since nothing ever cleared the bad cached id.
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ status: 404, ok: false, json: () => Promise.resolve({}) })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ id: "recreated-id" }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await googleDriveFileAdapter.writeSyncFile(
      makeConnection({ remoteFileId: "deleted-id" }),
      makeEnvelope(),
    );

    expect(fetchMock.mock.calls[0][0]).toContain("/files/deleted-id?uploadType=media");
    expect(fetchMock.mock.calls[0][1].method).toBe("PATCH");
    expect(fetchMock.mock.calls[1][0]).toContain("uploadType=multipart");
    expect(fetchMock.mock.calls[1][1].method).toBe("POST");
    expect(result).toEqual({ remoteFileId: "recreated-id", tokens: undefined });
  });

  it("throws a clear error on a non-ok, non-401 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ status: 500, ok: false, json: () => Promise.resolve({}) }),
    );

    await expect(
      googleDriveFileAdapter.writeSyncFile(makeConnection(), makeEnvelope()),
    ).rejects.toThrow(/500/);
  });
});
