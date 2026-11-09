import {
  SOCIAL_ICONS,
  defaultContent,
  type MediaItem,
  type SiteContent,
  type Social,
  type SocialIconName,
} from "@/data/content";

/**
 * Hand-rolled validation for content coming back from the admin editor (or a
 * stored JSON file). Anything malformed is coerced or dropped rather than
 * trusted, so a bad save can never crash the public pages.
 */

const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Accept absolute http(s) URLs, root-relative paths, or empty. Rejects javascript:, data: etc. */
export function safeUrl(v: unknown): string {
  const s = str(v, 2048);
  if (!s) return "";
  if (s.startsWith("/") && !s.startsWith("//")) return s;
  try {
    const u = new URL(s);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
  } catch {
    return "";
  }
}

/** Same as safeUrl but also allows mailto: links for socials. */
function safeLink(v: unknown): string {
  const s = str(v, 2048);
  if (s.startsWith("mailto:")) return s;
  return safeUrl(s);
}

function mediaItem(v: unknown, i: number): MediaItem | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const kind = o.kind === "video" ? "video" : o.kind === "image" ? "image" : null;
  const src = safeUrl(o.src);
  if (!kind || !src) return null;

  const item: MediaItem = {
    id: str(o.id, 64) || `item-${Date.now().toString(36)}-${i}`,
    kind,
    src,
  };
  const caption = str(o.caption, 200);
  if (caption) item.caption = caption;

  if (kind === "video") {
    item.format = o.format === "wide" ? "wide" : "reel";
    const poster = safeUrl(o.poster);
    if (poster) item.poster = poster;
  } else {
    const ratio = Number(o.ratio);
    item.ratio = Number.isFinite(ratio) && ratio > 0.1 && ratio < 10 ? Math.round(ratio * 1000) / 1000 : 1;
  }
  return item;
}

function mediaList(v: unknown): MediaItem[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: MediaItem[] = [];
  v.slice(0, 500).forEach((raw, i) => {
    const item = mediaItem(raw, i);
    if (!item) return;
    // Keep ids unique — React keys and the drum rely on it.
    while (seen.has(item.id)) item.id = `${item.id}-${i}`;
    seen.add(item.id);
    out.push(item);
  });
  return out;
}

function social(v: unknown): Social | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const icon = SOCIAL_ICONS.includes(o.icon as SocialIconName) ? (o.icon as SocialIconName) : null;
  const href = safeLink(o.href);
  if (!icon || !href) return null;
  return { label: str(o.label, 60) || icon, href, icon };
}

const stringList = (v: unknown, maxItems: number, maxLen: number) =>
  Array.isArray(v) ? v.map((s) => str(s, maxLen)).filter(Boolean).slice(0, maxItems) : [];

export function parseContent(input: unknown): SiteContent {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const site = (o.site && typeof o.site === "object" ? o.site : {}) as Record<string, unknown>;
  const info = (o.info && typeof o.info === "object" ? o.info : {}) as Record<string, unknown>;
  const d = defaultContent;

  return {
    site: {
      name: str(site.name, 80) || d.site.name,
      email: str(site.email, 200),
      copyright: str(site.copyright, 200),
      socials: Array.isArray(site.socials)
        ? site.socials.map(social).filter((s): s is Social => s !== null).slice(0, 12)
        : d.site.socials,
      seoTitle: str(site.seoTitle, 200) || d.site.seoTitle,
      seoDescription: str(site.seoDescription, 500),
      music: safeUrl(site.music),
      infoBackground: safeUrl(site.infoBackground),
    },
    work: mediaList(o.work),
    editorial: mediaList(o.editorial),
    info: {
      portrait: safeUrl(info.portrait),
      bio: stringList(info.bio, 20, 4000),
      clients: stringList(info.clients, 100, 120),
    },
    updatedAt: str(o.updatedAt, 40) || undefined,
  };
}
