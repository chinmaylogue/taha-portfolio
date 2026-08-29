/** Vertical reel (9:16) or landscape (16:9) — drives the tile's aspect in the strip. */
export type VideoFormat = "reel" | "wide";

export const ASPECT: Record<VideoFormat, number> = {
  reel: 9 / 16,
  wide: 16 / 9,
};

export type MediaItem = {
  id: string;
  kind: "image" | "video";
  src: string;
  poster?: string;
  caption?: string;
  /** Videos only. */
  format?: VideoFormat;
  /** Images only — width relative to the strip height. */
  ratio?: number;
};

export const site = {
  name: "TAHA MALAK",
  email: "tahamalak@gmail.com",
  copyright: `© ${new Date().getFullYear()} Taha Malak. All Rights Reserved.`,
  socials: [
    { label: "Instagram", href: "https://instagram.com/", icon: "instagram" },
    { label: "LinkedIn", href: "https://linkedin.com/", icon: "linkedin" },
    { label: "Spotify", href: "https://open.spotify.com/", icon: "spotify" },
  ] as const,
};

export const nav = [
  { label: "Work", href: "/" },
  { label: "Editorial", href: "/editorial" },
  { label: "Info", href: "/info" },
];

/**
 * Home / Work — films only, looping in place and scrolled horizontally.
 * Roughly 80% vertical reels to 20% landscape, interleaved so the strip breathes.
 */
/** Placeholder assets pulled from public sample buckets — swap for real files in /public/media. */
const TV = "https://test-videos.co.uk/vids";
const W3 = "https://media.w3.org/2010/05";
const MDN = "https://mdn.github.io/shared-assets/videos";
const poster = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const work: MediaItem[] = [
  { id: "w1", kind: "video", src: `${MDN}/flower.mp4`, poster: poster("late-crossing", 720, 1280), format: "reel", caption: "Late Crossing" },
  { id: "w2", kind: "video", src: `${TV}/jellyfish/mp4/h264/720/Jellyfish_720_10s_1MB.mp4`, poster: poster("nightshift", 720, 1280), format: "reel", caption: "Nightshift" },
  { id: "w3", kind: "video", src: `${W3}/sintel/trailer.mp4`, poster: poster("reel-2026", 1280, 720), format: "wide", caption: "Reel 2026" },
  { id: "w4", kind: "video", src: `${TV}/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4`, poster: poster("rooftop", 720, 1280), format: "reel", caption: "Rooftop" },
  { id: "w5", kind: "video", src: `${MDN}/friday.mp4`, poster: poster("static-bloom", 720, 1280), format: "reel", caption: "Static Bloom" },
  { id: "w6", kind: "video", src: `${W3}/bunny/movie.mp4`, poster: poster("studio-test", 720, 1280), format: "reel", caption: "Studio Test" },
  { id: "w7", kind: "video", src: `${TV}/sintel/mp4/h264/720/Sintel_720_10s_1MB.mp4`, poster: poster("coast-road", 720, 1280), format: "reel", caption: "Coast Road" },
  { id: "w8", kind: "video", src: `${W3}/video/movie_300.mp4`, poster: poster("field-notes", 1280, 720), format: "wide", caption: "Field Notes" },
  { id: "w9", kind: "video", src: `${W3}/bunny/trailer.mp4`, poster: poster("dust-16mm", 720, 1280), format: "reel", caption: "Dust, 16mm" },
  { id: "w10", kind: "video", src: `${TV}/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4`, poster: poster("second-house", 720, 1280), format: "reel", caption: "Second House" },
];

/** Editorial — photography, same horizontal strip as Work. */
export const editorial: MediaItem[] = [
  { id: "e1", kind: "image", src: poster("tank-01", 1400, 1000), ratio: 1.4, caption: "Tank Air" },
  { id: "e2", kind: "image", src: poster("tank-02", 1000, 1000), ratio: 1, caption: "Tank Air" },
  { id: "e3", kind: "image", src: poster("tank-03", 1600, 1000), ratio: 1.6, caption: "Tank Air" },
  { id: "e4", kind: "image", src: poster("house-01", 1500, 1000), ratio: 1.5, caption: "Second House" },
  { id: "e5", kind: "image", src: poster("house-02", 1000, 1000), ratio: 1, caption: "Second House" },
  { id: "e6", kind: "image", src: poster("house-03", 1200, 1000), ratio: 1.2, caption: "Second House" },
  { id: "e7", kind: "image", src: poster("house-04", 1700, 1000), ratio: 1.7, caption: "Second House" },
  { id: "e8", kind: "image", src: poster("dust-01", 1800, 1000), ratio: 1.8, caption: "Dust" },
  { id: "e9", kind: "image", src: poster("dust-02", 1000, 1000), ratio: 1, caption: "Dust" },
];

export const info = {
  portrait: poster("taha-portrait", 1200, 1200),
  bio: [
    "Taha Malak is a photographer and director working between editorial and music. His background in still photography carries into motion work, where the same instinct for timing and available light shapes how he shoots.",
    "He works close to his subjects and fast, favouring a documentary approach over staging — a run-and-gun aesthetic that has become his signature across commissions for magazines, labels, and brands.",
  ],
  clients: ["Tank Air", "Second House", "Nightshift Records", "Coast", "Field Notes"],
};
