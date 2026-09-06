import { describe, expect, it } from "vitest";
import { generateCodeChallenge, generateCodeVerifier, generateState } from "../pkce.utility";

describe("pkce.utility", () => {
  it("generates a base64url code verifier of RFC 7636 length", () => {
    const verifier = generateCodeVerifier();
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("generates different verifiers each call", () => {
    expect(generateCodeVerifier()).not.toBe(generateCodeVerifier());
  });

  it("generates a base64url state token", () => {
    expect(generateState()).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("derives a deterministic S256 code challenge for a given verifier", async () => {
    // Known RFC 7636 appendix B test vector.
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const challenge = await generateCodeChallenge(verifier);
    expect(challenge).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });

  it("derives base64url (no padding, no +/) output for an arbitrary verifier", async () => {
    const challenge = await generateCodeChallenge(generateCodeVerifier());
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });
});
