const VERIFIER_BYTE_LENGTH = 32;
const STATE_BYTE_LENGTH = 16;

/** RFC 7636 unreserved base64url alphabet, plus `+`/`/` swapped for `-`/`_` and padding stripped. */
const toBase64Url = (bytes: Uint8Array): string => {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const randomBase64Url = (byteLength: number): string =>
  toBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));

/** A random PKCE code verifier, per RFC 7636 (43-128 chars once base64url-encoded). */
export const generateCodeVerifier = (): string => randomBase64Url(VERIFIER_BYTE_LENGTH);

/** The S256 code challenge for a given verifier, per RFC 7636. */
export const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return toBase64Url(new Uint8Array(digest));
};

/** A random CSRF-guard token for the OAuth `state` parameter. */
export const generateState = (): string => randomBase64Url(STATE_BYTE_LENGTH);
