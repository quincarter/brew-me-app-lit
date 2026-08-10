import { queryDeep } from "./shadow-query.utility";

export interface IAwaitTourTargetOptions {
  maxFrames?: number;
}

/**
 * Polls via `requestAnimationFrame` for a tour target to exist, be
 * connected, and have a non-zero layout box, handling the race between
 * `navigateTo()` and the router's lazy route import + first render.
 * Resolves `null` if it never appears within `maxFrames` (~30, roughly
 * half a second at 60fps) so the caller can fall back gracefully.
 */
export const awaitTourTarget = (
  selectorPath: readonly string[],
  options: IAwaitTourTargetOptions = {},
): Promise<HTMLElement | null> => {
  const maxFrames = options.maxFrames ?? 30;

  return new Promise((resolve) => {
    let frame = 0;

    const tick = (): void => {
      const found = queryDeep(selectorPath);
      if (found instanceof HTMLElement && found.isConnected) {
        const rect = found.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          resolve(found);
          return;
        }
      }
      frame += 1;
      if (frame >= maxFrames) {
        resolve(null);
        return;
      }
      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  });
};
