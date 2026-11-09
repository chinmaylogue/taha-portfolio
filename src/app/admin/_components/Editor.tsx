"use client";

import { useEffect, useState, useTransition } from "react";
import { SOCIAL_ICONS, type MediaItem, type SiteContent, type SocialIconName } from "@/data/content";
import type { Revision, StorageMode } from "@/lib/cms/store";
import { loadRevision, logout, publish, revisions } from "../actions";
import MediaListEditor from "./MediaListEditor";
import MediaLibrary from "./MediaLibrary";
import { Card, Field, MediaField, button, iconButton, input, primaryButton } from "./ui";

const TABS = [
  { id: "work", label: "Work", hint: "Films" },
  { id: "editorial", label: "Editorial", hint: "Photography" },
  { id: "info", label: "Info", hint: "Bio & portrait" },
  { id: "settings", label: "Settings", hint: "Site, socials, SEO" },
  { id: "media", label: "Media", hint: "Uploads" },
  { id: "history", label: "History", hint: "Past versions" },
] as const;
type Tab = (typeof TABS)[number]["id"];

type Props = { initial: SiteContent; storage: StorageMode; readOnly: boolean };

export default function Editor({ initial, storage, readOnly }: Props) {
  const [content, setContent] = useState(initial);
  const [published, setPublished] = useState(() => JSON.stringify(initial));
  const [tab, setTab] = useState<Tab>("work");
  const [status, setStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [saving, startSaving] = useTransition();

  const dirty = JSON.stringify(content) !== published;
  const tabs = TABS.filter((t) => t.id !== "history" || storage === "blob");

  // Remember the open tab across reloads via the URL hash.
  useEffect(() => {
    const fromHash = location.hash.slice(1) as Tab;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync from URL on mount
    if (TABS.some((t) => t.id === fromHash)) setTab(fromHash);
  }, []);
  useEffect(() => {
    history.replaceState(null, "", `#${tab}`);
  }, [tab]);

  // Warn before leaving with unpublished edits.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function save() {
    if (!dirty || saving || readOnly) return;
    startSaving(async () => {
      const res = await publish(content);
      if (res.ok) {
        // Server may have normalised values (trimmed, dropped empty items).
        setContent(res.data);
        setPublished(JSON.stringify(res.data));
        setStatus({ kind: "ok", text: `Published ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` });
      } else {
        setStatus({ kind: "error", text: res.error });
      }
    });
  }

  // ⌘S / Ctrl+S publishes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const setList = (key: "work" | "editorial") => (fn: (items: MediaItem[]) => MediaItem[]) =>
    setContent((c) => ({ ...c, [key]: fn(c[key]) }));
  const setSite = (patch: Partial<SiteContent["site"]>) => setContent((c) => ({ ...c, site: { ...c.site, ...patch } }));
  const setInfo = (patch: Partial<SiteContent["info"]>) => setContent((c) => ({ ...c, info: { ...c.info, ...patch } }));

  const missing = [...content.work, ...content.editorial].filter((it) => !it.src).length;

  return (
    <div className="flex min-h-full flex-col bg-neutral-50 text-neutral-900">
      {/* Top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-neutral-200 bg-white/90 px-4 backdrop-blur md:px-6">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="truncate text-[15px] font-bold tracking-tight">{content.site.name || "Site"}</span>
          <span className="text-[12px] text-neutral-500">CMS</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span
            className={`hidden text-[12px] sm:inline ${
              dirty ? "text-amber-600" : status?.kind === "error" ? "text-red-600" : "text-neutral-500"
            }`}
          >
            {dirty ? "Unpublished changes" : (status?.text ?? (content.updatedAt ? `Last published ${new Date(content.updatedAt).toLocaleString()}` : "Using default content"))}
          </span>
          {dirty && (
            <button
              type="button"
              className={button}
              onClick={() => {
                if (confirm("Discard all unpublished changes?")) setContent(JSON.parse(published));
              }}
            >
              Discard
            </button>
          )}
          <button type="button" className={primaryButton} onClick={save} disabled={!dirty || saving || readOnly} title="⌘S">
            {saving ? "Publishing…" : "Publish"}
          </button>
          <a href="/" target="_blank" rel="noreferrer" className={`${button} hidden sm:inline-flex`}>
            View site ↗
          </a>
          <form action={logout}>
            <button type="submit" className={iconButton} title="Log out" aria-label="Log out">
              ⎋
            </button>
          </form>
        </div>
      </header>

      {status?.kind === "error" && (
        <div className="border-b border-red-200 bg-red-50 px-6 py-2 text-[12px] text-red-700">{status.text}</div>
      )}
      {readOnly && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-[12px] leading-relaxed text-amber-800">
          <strong>Read-only:</strong> this deployment has no writable storage. In Vercel, open the project →{" "}
          <em>Storage</em> → create a <em>Blob</em> store and connect it (that sets <code>BLOB_READ_WRITE_TOKEN</code>), then redeploy.
        </div>
      )}

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Tabs */}
        <nav className="no-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-neutral-200 bg-white px-3 py-2 md:w-56 md:flex-col md:overflow-visible md:border-r md:border-b-0 md:px-3 md:py-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 flex-col items-start rounded-md px-3 py-2 text-left transition-colors ${
                tab === t.id ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              <span className="text-[13px] font-medium">{t.label}</span>
              <span className={`hidden text-[11px] md:block ${tab === t.id ? "text-white/60" : "text-neutral-500"}`}>
                {t.hint}
              </span>
            </button>
          ))}
        </nav>

        <main className="min-w-0 flex-1 p-4 md:p-8">
          <div className="mx-auto flex max-w-4xl flex-col gap-6">
            {missing > 0 && (tab === "work" || tab === "editorial") && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                {missing} item{missing === 1 ? " has" : "s have"} no file and will be skipped when you publish.
              </p>
            )}

            {tab === "work" && (
              <MediaListEditor
                title="Work"
                description="The home page drum. Mostly vertical reels, with the odd wide film."
                items={content.work}
                onChange={setList("work")}
                defaultKind="video"
                storage={storage}
              />
            )}

            {tab === "editorial" && (
              <MediaListEditor
                title="Editorial"
                description="Photography on the Editorial page."
                items={content.editorial}
                onChange={setList("editorial")}
                defaultKind="image"
                storage={storage}
              />
            )}

            {tab === "info" && <InfoTab content={content} setInfo={setInfo} storage={storage} />}

            {tab === "settings" && <SettingsTab content={content} setSite={setSite} storage={storage} />}

            {tab === "media" && <MediaLibrary storage={storage} usedIn={JSON.stringify(content)} />}

            {tab === "history" && (
              <HistoryTab
                onLoad={(c) => {
                  setContent(c);
                  setTab("work");
                  setStatus({ kind: "ok", text: "Older version loaded — publish to restore it" });
                }}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Info tab */

function InfoTab({
  content,
  setInfo,
  storage,
}: {
  content: SiteContent;
  setInfo: (p: Partial<SiteContent["info"]>) => void;
  storage: StorageMode;
}) {
  const { info } = content;
  const setBio = (i: number, text: string) => setInfo({ bio: info.bio.map((p, j) => (j === i ? text : p)) });

  return (
    <>
      <Card title="Portrait">
        <MediaField
          label="Portrait image"
          value={info.portrait}
          onChange={(portrait) => setInfo({ portrait })}
          accept="image/*"
          kind="image"
          storage={storage}
          hint="Shown square at the top of the Info page."
        />
      </Card>

      <Card
        title="Bio"
        description="Each box is one paragraph."
        actions={
          <button type="button" className={button} onClick={() => setInfo({ bio: [...info.bio, ""] })}>
            Add paragraph
          </button>
        }
      >
        <div className="flex flex-col gap-3">
          {info.bio.map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <textarea className={`${input} min-h-28 leading-relaxed`} value={p} onChange={(e) => setBio(i, e.target.value)} />
              <button
                type="button"
                className={`${iconButton} hover:text-red-600`}
                aria-label="Remove paragraph"
                onClick={() => setInfo({ bio: info.bio.filter((_, j) => j !== i) })}
              >
                ✕
              </button>
            </div>
          ))}
          {info.bio.length === 0 && <p className="text-[13px] text-neutral-500">No bio yet.</p>}
        </div>
      </Card>

      <Card title="Clients" description="One per line. Stored for the Info page; not displayed in the current design.">
        <textarea
          className={`${input} min-h-32`}
          value={info.clients.join("\n")}
          onChange={(e) => setInfo({ clients: e.target.value.split("\n") })}
        />
      </Card>
    </>
  );
}

/* ------------------------------------------------------------ Settings tab */

function SettingsTab({
  content,
  setSite,
  storage,
}: {
  content: SiteContent;
  setSite: (p: Partial<SiteContent["site"]>) => void;
  storage: StorageMode;
}) {
  const { site } = content;
  const setSocial = (i: number, patch: Partial<SiteContent["site"]["socials"][number]>) =>
    setSite({ socials: site.socials.map((s, j) => (j === i ? { ...s, ...patch } : s)) });

  return (
    <>
      <Card title="General">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Site name" hint="The wordmark in the sidebar.">
            <input className={input} value={site.name} onChange={(e) => setSite({ name: e.target.value })} />
          </Field>
          <Field label="Contact email" hint="Used by the contact form and the Info page. Leave empty to hide both.">
            <input className={input} type="email" value={site.email} onChange={(e) => setSite({ email: e.target.value })} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Copyright line" hint={<>Use <code>{"{year}"}</code> for the current year.</>}>
              <input className={input} value={site.copyright} onChange={(e) => setSite({ copyright: e.target.value })} />
            </Field>
          </div>
        </div>
      </Card>

      <Card
        title="Social links"
        actions={
          <button
            type="button"
            className={button}
            onClick={() => setSite({ socials: [...site.socials, { label: "", href: "https://", icon: "instagram" }] })}
          >
            Add link
          </button>
        }
      >
        <div className="flex flex-col gap-3">
          {site.socials.map((s, i) => (
            <div key={i} className="grid grid-cols-[8rem_1fr_auto] items-center gap-2 md:grid-cols-[9rem_10rem_1fr_auto]">
              <select
                className={input}
                value={s.icon}
                onChange={(e) => setSocial(i, { icon: e.target.value as SocialIconName })}
                aria-label="Icon"
              >
                {SOCIAL_ICONS.map((icon) => (
                  <option key={icon} value={icon}>
                    {icon[0].toUpperCase() + icon.slice(1)}
                  </option>
                ))}
              </select>
              <input
                className={`${input} hidden md:block`}
                value={s.label}
                placeholder="Label"
                onChange={(e) => setSocial(i, { label: e.target.value })}
                aria-label="Label"
              />
              <input
                className={input}
                value={s.href}
                placeholder="https://"
                onChange={(e) => setSocial(i, { href: e.target.value })}
                aria-label="URL"
              />
              <button
                type="button"
                className={`${iconButton} hover:text-red-600`}
                aria-label="Remove link"
                onClick={() => setSite({ socials: site.socials.filter((_, j) => j !== i) })}
              >
                ✕
              </button>
            </div>
          ))}
          {site.socials.length === 0 && <p className="text-[13px] text-neutral-500">No social links.</p>}
        </div>
      </Card>

      <Card title="Atmosphere">
        <div className="flex flex-col gap-4">
          <MediaField
            label="Background music"
            value={site.music}
            onChange={(music) => setSite({ music })}
            accept="audio/*"
            kind="audio"
            storage={storage}
            hint="Loops quietly after the visitor's first interaction. Leave empty to turn music off."
          />
          <MediaField
            label="Info page background"
            value={site.infoBackground}
            onChange={(infoBackground) => setSite({ infoBackground })}
            accept="image/*"
            kind="image"
            storage={storage}
          />
        </div>
      </Card>

      <Card title="Search & sharing">
        <div className="flex flex-col gap-4">
          <Field label="Page title">
            <input className={input} value={site.seoTitle} onChange={(e) => setSite({ seoTitle: e.target.value })} />
          </Field>
          <Field label="Description" hint={`${site.seoDescription.length}/160 characters recommended`}>
            <textarea
              className={`${input} min-h-20`}
              value={site.seoDescription}
              onChange={(e) => setSite({ seoDescription: e.target.value })}
            />
          </Field>
        </div>
      </Card>
    </>
  );
}

/* ------------------------------------------------------------- History tab */

function HistoryTab({ onLoad }: { onLoad: (c: SiteContent) => void }) {
  const [list, setList] = useState<Revision[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    revisions().then((res) => (res.ok ? setList(res.data) : setError(res.error)));
  }, []);

  return (
    <Card title="History" description="The last 20 published versions. Loading one puts it in the editor; publish to make it live.">
      {error && <p className="text-[13px] text-red-600">{error}</p>}
      {!list && !error && <p className="text-[13px] text-neutral-500">Loading…</p>}
      {list?.length === 0 && <p className="text-[13px] text-neutral-500">Nothing published yet.</p>}
      {list && list.length > 0 && (
        <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
          {list.map((r, i) => (
            <li key={r.url} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="text-[13px]">
                {new Date(r.savedAt).toLocaleString()}
                {i === 0 && <span className="ml-2 rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] text-white">Live</span>}
              </span>
              <button
                type="button"
                className={button}
                disabled={busy !== null}
                onClick={async () => {
                  setBusy(r.url);
                  const res = await loadRevision(r.url);
                  setBusy(null);
                  if (res.ok) onLoad(res.data);
                  else setError(res.error);
                }}
              >
                {busy === r.url ? "Loading…" : "Load"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
