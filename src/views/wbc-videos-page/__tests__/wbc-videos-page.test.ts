import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  WBC_MISC_VIDEOS,
  WBC_PLAYLISTS,
  WBC_ROUTINES,
  WBC_UPCOMING_EVENT,
} from "../../../shared/data/wbc-content.data";
import "../wbc-videos-page";
import type { WbcVideosPage } from "../wbc-videos-page";

describe("wbc-videos-page", () => {
  let element: WbcVideosPage;

  beforeEach(async () => {
    element = document.createElement("wbc-videos-page") as WbcVideosPage;
    document.body.appendChild(element);
    await element.updateComplete;
  });

  afterEach(() => {
    element.remove();
  });

  it("renders the upcoming WBC event banner and links at the top", () => {
    const card = element.shadowRoot?.querySelector(".event-card");
    expect(card).not.toBeNull();
    expect(card?.textContent).toContain(WBC_UPCOMING_EVENT.title);
    expect(card?.textContent).toContain(WBC_UPCOMING_EVENT.dates);

    const linkCards = card?.querySelectorAll("brew-link-card");
    expect(linkCards).toHaveLength(2);
    expect(linkCards?.[0].getAttribute("href")).toBe(WBC_UPCOMING_EVENT.worldOfCoffeeUrl);
    expect(linkCards?.[1].getAttribute("href")).toBe(WBC_UPCOMING_EVENT.wbcOfficialUrl);
  });

  it("renders both winning competition routines and misc video cards", () => {
    const videoCards = element.shadowRoot?.querySelectorAll("brew-video-card");
    expect(videoCards).toHaveLength(WBC_ROUTINES.length + WBC_MISC_VIDEOS.length);
    expect(videoCards?.[0].getAttribute("youtube-id")).toBe(WBC_ROUTINES[0].youtubeId);
    expect(videoCards?.[2].getAttribute("youtube-id")).toBe(WBC_MISC_VIDEOS[0].youtubeId);
  });

  it("renders playlist link cards", () => {
    const content = element.shadowRoot?.querySelector(".content");
    const playlistCards = content?.querySelectorAll(".playlist-list brew-link-card");
    expect(playlistCards).toHaveLength(WBC_PLAYLISTS.length);
    expect(playlistCards?.[0].getAttribute("href")).toBe(WBC_PLAYLISTS[0].url);
  });
});
