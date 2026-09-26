# Deploying the site and using the admin panel

The website is plain HTML/CSS/JS. All its text, images, links, colours and lists live in **content.json**, and the admin panel at **/admin** edits that content and publishes it. Published content and uploaded images are stored in **Vercel Blob**.

## 1. Deploy to Vercel (one time)

1. Put this folder in a GitHub repository (the `.gitignore` is already set up).
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repository.
   - Framework preset: **Other**. Leave the build settings empty.
3. Click **Deploy**.

## 2. Turn on storage (one time)

1. In your Vercel project → **Storage** tab → **Create Database** → **Blob** → create it.
2. Connect it to this project and tick **all environments** (Production, Preview, Development). Vercel adds `BLOB_READ_WRITE_TOKEN` automatically.
   Public or private store both work.
3. **Redeploy** (Deployments → latest → ⋯ → Redeploy). The token only reaches the site after a new deployment.

## 3. Set the admin password (one time)

1. Project → **Settings → Environment Variables**.
2. Add **`ADMIN_PASSWORD`** with a strong password (12+ characters). Only share it with people who should edit the site.
3. Go to **Deployments** → the latest one → **⋯ → Redeploy**, so the new settings take effect.

## 4. Use the admin

Open **https://your-site.vercel.app/admin/** and log in.

- Pick a section on the left: **General**, **Home page**, **Clubs page**, **Recruitment** or **Tools**.
- Edit anything. The preview on the right updates as you type (switch it to **Mobile** to check phones).
- Your edits are a **draft** until you click **Publish** (or press **Ctrl + S**). The live site updates a few seconds later.
- **Discard changes** throws away the draft and goes back to what's live.
- Drafts are kept in your browser, so closing the tab doesn't lose them.

**Images:** click **Upload** on any image field. Photos are resized and compressed automatically before upload. **Library** reuses an image you've already uploaded. **Tools → Media library** lists every upload and lets you delete ones you no longer need.

**Lists** (sports, fixtures, council, gallery, clubs, steps): use **+ Add**, the arrows to reorder, ⧉ to duplicate and ✕ to delete. Click an item to open it.

**Undo a publish:** **Tools → Version history** keeps your last 40 publishes. Load one, check the preview, then **Publish** to restore it.

**Backups:** **Tools → Backup** downloads everything as a file, and can restore from one.

## Recruitment form

Applications go to a Google Sheet through Google Apps Script. Follow [apps-script/SETUP.md](apps-script/SETUP.md), then paste the web-app link in **Admin → Recruitment → Status & applications**. Turn **Recruitment is open** off to replace the form with a "closed" message.

## Testing on your own computer

```bash
npm install
npm run dev
```

Open http://localhost:3000 (site) and http://localhost:3000/admin/ (password: `admin`). Local edits are saved in the `.data/` folder and never uploaded.

## How it fits together

| Part | What it does |
| --- | --- |
| `content.json` | Built-in default content. The site uses it until you publish from the admin. |
| `content.js` | Loads the published content on every page and fills it in. |
| `admin/` | The admin panel. `schema.js` lists every editable field. |
| `api/` | Vercel functions: `login`, `content` (read/publish), `upload`, `media`, `history`. |
| `dev-server.mjs` | Local test server only. Not used on Vercel. |

## Troubleshooting

The admin checks storage when you log in and shows a yellow banner if publishing can't work. Common messages:

| Message | Fix |
| --- | --- |
| *BLOB_READ_WRITE_TOKEN is missing* | Storage → your Blob store → **Connect Project** → tick all environments → then **Redeploy**. |
| *The Blob store … no longer exists* / *rejected the token* | The store was deleted or reconnected. Reconnect it to the project, then **Redeploy**. |
| *Blob store is suspended* | You've hit the free-plan limit. Check Vercel → Storage for usage. |
| *ADMIN_PASSWORD isn't set* | Settings → Environment Variables → add `ADMIN_PASSWORD` → **Redeploy**. |

Environment variable changes never apply to an existing deployment: always redeploy after changing them.
