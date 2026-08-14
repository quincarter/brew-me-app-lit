import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { importWithRetry } from "../import-with-retry.utility";

const RELOAD_FLAG_KEY = "brewme-chunk-reload-attempted";

describe("import-with-retry.utility", () => {
  const originalLocation = window.location;
  let reloadSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    window.sessionStorage.clear();
    reloadSpy = vi.fn();
    // happy-dom's `window.location` doesn't implement `reload()`, and it's a
    // read-only, mostly-getter-backed object - replace the whole property
    // rather than trying to stub the method directly.
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, reload: reloadSpy },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
    window.sessionStorage.clear();
    vi.useRealTimers();
  });

  it("resolves with the importer's return value, calling it only once on success", async () => {
    const importer = vi.fn().mockResolvedValue("module");

    await expect(importWithRetry(importer)).resolves.toBe("module");

    expect(importer).toHaveBeenCalledTimes(1);
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it("retries after transient chunk-load failures and resolves once the importer eventually succeeds", async () => {
    const importer = vi
      .fn()
      .mockRejectedValueOnce(new Error("Failed to fetch dynamically imported module: /views/home-page/home-page.ts"))
      .mockRejectedValueOnce(new Error("Failed to fetch dynamically imported module: /views/home-page/home-page.ts"))
      .mockResolvedValueOnce("module");

    const promise = importWithRetry(importer);
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe("module");
    expect(importer).toHaveBeenCalledTimes(3);
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it("rethrows immediately without retrying or reloading when the importer fails for a reason other than a missing chunk", async () => {
    const bugError = new Error("Cannot read properties of undefined (reading 'foo')");
    const importer = vi.fn().mockRejectedValue(bugError);

    await expect(importWithRetry(importer)).rejects.toBe(bugError);

    expect(importer).toHaveBeenCalledTimes(1);
    expect(reloadSpy).not.toHaveBeenCalled();
  });

  it("reloads the page after exhausting all attempts, and never settles, when no reload has been attempted this session", async () => {
    const importer = vi
      .fn()
      .mockRejectedValue(new Error("Failed to fetch dynamically imported module: /views/home-page/home-page.ts"));

    const promise = importWithRetry(importer);
    await vi.runAllTimersAsync();

    expect(importer).toHaveBeenCalledTimes(3);
    expect(window.sessionStorage.getItem(RELOAD_FLAG_KEY)).toBe("true");
    expect(reloadSpy).toHaveBeenCalledTimes(1);

    // The promise deliberately never resolves or rejects once a reload is
    // triggered - race it against an already-resolved promise to confirm it
    // stays pending rather than hanging the test.
    const pendingSentinel = Symbol("pending");
    const result = await Promise.race([promise, Promise.resolve(pendingSentinel)]);
    expect(result).toBe(pendingSentinel);
  });

  it("rejects with the last error, without reloading again, when a reload was already attempted this session", async () => {
    window.sessionStorage.setItem(RELOAD_FLAG_KEY, "true");
    const finalError = new Error("Failed to fetch dynamically imported module: /views/home-page/home-page.ts");
    const importer = vi
      .fn()
      .mockRejectedValueOnce(new Error("Failed to fetch dynamically imported module: /views/home-page/home-page.ts"))
      .mockRejectedValueOnce(new Error("Failed to fetch dynamically imported module: /views/home-page/home-page.ts"))
      .mockRejectedValueOnce(finalError);

    const promise = importWithRetry(importer);
    // Attach the rejection assertion before advancing timers so the
    // rejection is handled synchronously as soon as it happens, rather than
    // surfacing as an unhandled rejection in the gap between
    // `runAllTimersAsync` settling it and this test observing it.
    const assertion = expect(promise).rejects.toBe(finalError);
    await vi.runAllTimersAsync();
    await assertion;

    expect(importer).toHaveBeenCalledTimes(3);
    expect(reloadSpy).not.toHaveBeenCalled();
  });
});
