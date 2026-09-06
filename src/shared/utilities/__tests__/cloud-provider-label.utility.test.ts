import { describe, expect, it } from "vitest";
import { getCloudProviderLabel } from "../cloud-provider-label.utility";

describe("cloud-provider-label.utility", () => {
  it.each([
    ["dropbox", "Dropbox"],
    ["onedrive", "OneDrive"],
    ["google-drive", "Google Drive"],
  ] as const)("labels %s as %s", (providerId, label) => {
    expect(getCloudProviderLabel(providerId)).toBe(label);
  });
});
