import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { awaitTourTarget } from "../tour-target.utility";

/** happy-dom never computes real layout, so `getBoundingClientRect` returns
 * an all-zero rect by default - stub it to a fixed non-zero box. */
const stubRect = (el: HTMLElement): void => {
  el.getBoundingClientRect = () =>
    ({
      top: 0,
      left: 0,
      right: 100,
      bottom: 40,
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      toJSON: () => ({}),
    }) as DOMRect;
};

describe("awaitTourTarget", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["requestAnimationFrame"] });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("resolves the element once a matching connected element with a non-zero rect appears", async () => {
    const promise = awaitTourTarget(["div.tour-target"]);

    // Not present for the first couple of frames.
    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();

    const el = document.createElement("div");
    el.className = "tour-target";
    stubRect(el);
    document.body.appendChild(el);

    vi.advanceTimersToNextFrame();

    await expect(promise).resolves.toBe(el);
  });

  it("resolves null after maxFrames frames when the target never appears", async () => {
    const promise = awaitTourTarget(["div.never-appears"], { maxFrames: 5 });

    for (let i = 0; i < 5; i += 1) {
      vi.advanceTimersToNextFrame();
    }

    await expect(promise).resolves.toBeNull();
  });

  it("respects a custom maxFrames option", async () => {
    const promise = awaitTourTarget(["div.never-appears"], { maxFrames: 2 });

    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();

    await expect(promise).resolves.toBeNull();
  });

  it("ignores a matching element that has a zero-size rect until it gets a real layout box", async () => {
    const el = document.createElement("div");
    el.className = "tour-target-zero";
    document.body.appendChild(el);
    // Deliberately no stubRect() call - rect stays all-zero.

    const promise = awaitTourTarget(["div.tour-target-zero"], { maxFrames: 3 });

    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();
    vi.advanceTimersToNextFrame();

    await expect(promise).resolves.toBeNull();
  });
});
