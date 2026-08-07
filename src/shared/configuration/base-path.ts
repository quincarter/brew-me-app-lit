const raw = import.meta.env.BASE_URL ?? "/";

/** Base path without trailing slash, e.g. '' or '/brew-me-app-lit' */
export const BASE_PATH = raw.endsWith("/") ? raw.slice(0, -1) : raw;

/** Prefix a path with the configured base, e.g. '/calculate' -> '/brew-me-app-lit/calculate' */
export const withBase = (path: string): string => {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${normalized}`;
};
