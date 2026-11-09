# Taha Malak — Portfolio

Next.js 16 portfolio with a built-in CMS at **`/admin`**.

```bash
npm install
npm run dev   # http://localhost:3000
```

## CMS

Everything visitors see — Work films, Editorial photos, the Info page, site name,
email, socials, background music, SEO — is edited at `/admin` and goes live when
you hit **Publish** (⌘S).

### Setup

Create `.env.local`:

```bash
ADMIN_PASSWORD=choose-a-long-password
# Optional: sign sessions with a separate secret so changing the password doesn't log you out
# AUTH_SECRET=random-32+-char-string
```

Restart `npm run dev` and sign in at http://localhost:3000/admin.

### Where content is stored

| Mode | When | Content | Uploads |
| --- | --- | --- | --- |
| **Local** | no `BLOB_READ_WRITE_TOKEN` | `content/site.json` | `public/uploads/` |
| **Vercel Blob** | `BLOB_READ_WRITE_TOKEN` is set | versioned JSON in Blob (last 20 kept, see *History* tab) | Blob |

- **Local** is for editing in `next dev`. Commit `content/site.json` and
  `public/uploads/` to ship your changes.
- **On Vercel**, the filesystem is read-only, so connect Blob storage to edit
  the live site: Vercel project → *Storage* → *Create* → *Blob* → connect to the
  project (this adds `BLOB_READ_WRITE_TOKEN`), add `ADMIN_PASSWORD` under
  *Settings → Environment Variables*, then redeploy. Uploads go straight from the
  browser to Blob, so large videos aren't limited by the 4.5 MB function body cap.

Until the first publish, the site serves the seed content in `src/data/content.ts`.

### Code map

- `src/app/(site)/` — public pages; read content via `getContent()`
- `src/app/admin/` — editor UI and Server Functions (`actions.ts`)
- `src/app/api/admin/upload/route.ts` — upload endpoint
- `src/lib/cms/store.ts` — storage (local / Blob)
- `src/lib/cms/schema.ts` — validation applied to every save
- `src/lib/cms/session.ts`, `auth.ts`, `src/proxy.ts` — password login + signed session cookie
