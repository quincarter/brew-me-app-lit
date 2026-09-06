import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AEROPRESS_LOADER_CYCLE_MS } from "../../../components/aeropress-loader/AeropressLoader";

const completeProviderConnect = vi.fn();
const navigateTo = vi.fn();

vi.mock("../../../shared/stores/cloud-sync.store", () => ({
  completeProviderConnect: (...args: unknown[]) => completeProviderConnect(...args),
}));
vi.mock("../../../shared/utilities/navigation.utility", () => ({
  navigateTo: (...args: unknown[]) => navigateTo(...args),
}));

const { OauthCallbackPage } = await import("../oauth-callback-page");

const setSearch = (search: string): void => {
  window.history.replaceState({}, "", `/oauth/callback${search}`);
};

describe("oauth-callback-page", () => {
  let element: InstanceType<typeof OauthCallbackPage>;

  beforeEach(() => {
    completeProviderConnect.mockReset();
    navigateTo.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    element?.remove();
    vi.useRealTimers();
  });

  const mount = async (): Promise<void> => {
    element = document.createElement("oauth-callback-page") as InstanceType<
      typeof OauthCallbackPage
    >;
    document.body.appendChild(element);
    await element.updateComplete;
  };

  it("shows an error and eventually redirects when the provider reports an error", async () => {
    setSearch("?error=access_denied");
    await mount();
    await vi.advanceTimersByTimeAsync(0);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".message.error")?.textContent).toContain(
      "Connection cancelled",
    );
    expect(completeProviderConnect).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2000);
    expect(navigateTo).toHaveBeenCalledWith("/more/cloud-sync");
  });

  it("shows an error when code/state are missing", async () => {
    setSearch("");
    await mount();
    await vi.advanceTimersByTimeAsync(0);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".message.error")?.textContent).toContain("Missing");
    expect(element.shadowRoot?.querySelector("brew-aeropress-loader")).toBeNull();
  });

  it("completes the connection and redirects on success, holding the loader in its done pose first", async () => {
    completeProviderConnect.mockResolvedValue(undefined);
    setSearch("?code=auth-code&state=state-123");
    await mount();

    // The store call itself resolves right away, but the page still waits
    // for a full loader cycle before settling - advancing by 0ms should not
    // be enough yet.
    await vi.advanceTimersByTimeAsync(0);
    await element.updateComplete;
    expect(element.shadowRoot?.querySelector(".message")?.textContent).toBe("Connecting…");

    await vi.advanceTimersByTimeAsync(AEROPRESS_LOADER_CYCLE_MS);
    await element.updateComplete;

    expect(completeProviderConnect).toHaveBeenCalledWith("auth-code", "state-123");
    expect(element.shadowRoot?.querySelector(".message")?.textContent).toBe("Connected!");
    const loader = element.shadowRoot?.querySelector("brew-aeropress-loader");
    expect(loader).not.toBeNull();
    expect(loader?.hasAttribute("done")).toBe(true);

    await vi.advanceTimersByTimeAsync(2000);
    expect(navigateTo).toHaveBeenCalledWith("/more/cloud-sync");
  });

  it("keeps the AeroPress loader visible instead of hiding it once a connection succeeds - the filled cup is the success signal", async () => {
    completeProviderConnect.mockResolvedValue(undefined);
    setSearch("?code=auth-code&state=state-123");
    await mount();

    const loaderWhileConnecting = element.shadowRoot?.querySelector("brew-aeropress-loader");
    expect(loaderWhileConnecting).not.toBeNull();
    expect(loaderWhileConnecting?.hasAttribute("done")).toBe(false);

    await vi.advanceTimersByTimeAsync(AEROPRESS_LOADER_CYCLE_MS);
    await element.updateComplete;

    const loaderAfterSuccess = element.shadowRoot?.querySelector("brew-aeropress-loader");
    expect(loaderAfterSuccess).not.toBeNull();
    expect(loaderAfterSuccess?.hasAttribute("done")).toBe(true);
  });

  it("shows the store's error message when completing the connection fails, without waiting for a full loader cycle", async () => {
    completeProviderConnect.mockRejectedValue(new Error("No matching Dropbox connection attempt."));
    setSearch("?code=auth-code&state=stale-state");
    await mount();
    await vi.advanceTimersByTimeAsync(0);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector(".message.error")?.textContent).toBe(
      "No matching Dropbox connection attempt.",
    );
    expect(element.shadowRoot?.querySelector("brew-aeropress-loader")).toBeNull();
  });
});
