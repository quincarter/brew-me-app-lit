export interface IWbcEvent {
  title: string;
  location: string;
  dates: string;
  description: string;
  worldOfCoffeeUrl: string;
  wbcOfficialUrl: string;
}

export interface IWbcVideo {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  description: string;
}

export interface IWbcPlaylist {
  title: string;
  url: string;
  description: string;
}

export const WBC_UPCOMING_EVENT: IWbcEvent = {
  title: "World Barista Championship 2026",
  location: "Panama",
  dates: "October 22–25, 2026",
  description:
    "The World Barista Championship (WBC) is the premier international coffee competition produced annually by World Coffee Events. The 2026 event takes place October 22–25 in Panama alongside World of Coffee.",
  worldOfCoffeeUrl: "https://panama.worldofcoffee.org/",
  wbcOfficialUrl: "https://wcc.coffee/world-barista-championship",
};

export const WBC_ROUTINES: IWbcVideo[] = [
  {
    id: "jack-simpson-wbc-2025-finals",
    youtubeId: "HVoHoMhzy2w",
    title: "Jack Simpson, Australia | 2025 World Barista Championship: Finals - Winner",
    channel: "World Coffee Events",
    description:
      "Winning 15-minute routine by Jack Simpson representing Australia at the 2025 World Barista Championship Finals.",
  },
  {
    id: "morgan-eckroth-wbc-2022-finals",
    youtubeId: "agLdXmYYb54",
    title: "2022 World Barista Championship: Finals — Winner",
    channel: "Morgan Eckroth",
    description:
      "Full winning 15-minute routine by Morgan Eckroth at the 2022 World Barista Championship Finals in Melbourne.",
  },
];

export const WBC_MISC_VIDEOS: IWbcVideo[] = [
  {
    id: "morgan-eckroth-wbc-beverage",
    youtubeId: "wSPCdAX70J8",
    title: "How To Make a World Barista Championship Beverage (2nd Place)",
    channel: "Morgan Eckroth",
    description:
      "Morgan Eckroth demonstrates how to craft a championship-level signature coffee beverage inspired by their 2nd place routine.",
  },
];

export const WBC_FEATURED_VIDEOS: IWbcVideo[] = [...WBC_ROUTINES, ...WBC_MISC_VIDEOS];

export const WBC_PLAYLISTS: IWbcPlaylist[] = [
  {
    title: "2025 World Barista Championship YouTube Playlist",
    url: "https://www.youtube.com/playlist?list=PLzI16LSYAwDYEN8tA7RDGMf40WLet_QQX",
    description:
      "Official YouTube playlist featuring full competitor routines, round coverage, and highlights from the 2025 WBC.",
  },
];
