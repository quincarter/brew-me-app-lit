import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getConfiguredCloudProviders,
  isAnyCloudProviderConfigured,
  isCloudProviderConfigured,
} from "../cloud-provider-config.utility";

describe("cloud-provider-config.utility", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("isCloudProviderConfigured", () => {
    it("returns false for a provider with no client id env var set", () => {
      vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "");

      expect(isCloudProviderConfigured("dropbox")).toBe(false);
    });

    it("returns true once the provider's client id env var is set", () => {
      vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "abc123");

      expect(isCloudProviderConfigured("dropbox")).toBe(true);
    });

    it("checks each provider's own distinct env var", () => {
      vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "");
      vi.stubEnv("VITE_MICROSOFT_CLIENT_ID", "ms-client-id");
      vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");

      expect(isCloudProviderConfigured("dropbox")).toBe(false);
      expect(isCloudProviderConfigured("onedrive")).toBe(true);
      expect(isCloudProviderConfigured("google-drive")).toBe(false);
    });
  });

  describe("getConfiguredCloudProviders", () => {
    it("returns only the configured providers, in the fixed display order", () => {
      vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "dbx-id");
      vi.stubEnv("VITE_MICROSOFT_CLIENT_ID", "");
      vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "google-id");

      expect(getConfiguredCloudProviders()).toEqual(["dropbox", "google-drive"]);
    });

    it("returns an empty array when nothing is configured", () => {
      vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "");
      vi.stubEnv("VITE_MICROSOFT_CLIENT_ID", "");
      vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");

      expect(getConfiguredCloudProviders()).toEqual([]);
    });
  });

  describe("isAnyCloudProviderConfigured", () => {
    it("returns false when no provider is configured", () => {
      vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "");
      vi.stubEnv("VITE_MICROSOFT_CLIENT_ID", "");
      vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "");

      expect(isAnyCloudProviderConfigured()).toBe(false);
    });

    it("returns true when at least one provider is configured", () => {
      vi.stubEnv("VITE_DROPBOX_CLIENT_ID", "");
      vi.stubEnv("VITE_MICROSOFT_CLIENT_ID", "");
      vi.stubEnv("VITE_GOOGLE_CLIENT_ID", "google-id");

      expect(isAnyCloudProviderConfigured()).toBe(true);
    });
  });
});
