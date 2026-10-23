# Insights Academy — dynamic website

The public website now supports KG–Class 12 coaching, Punjab textbook syllabus and 4–8 pm academy hours. The supplied tuition and stationery fee structure is included. Unconfirmed subjects, batch sizes, address, results and staff details are left for the owner to supply.

## What the owner can do

Open `/admin/` and sign in with the owner password. Edit academy details and banner, homepage courses and features, blogs, classes, subjects, timings, the fee structure, announcements, teachers, results, reviews, FAQs, gallery and test resources. Add or reorder entries, upload JPG/PNG/WebP photos (up to 5 MB), and choose which entries appear publicly. Empty sections are hidden.

1. **Save draft** stores changes without changing the public website.
2. **Preview draft** opens the saved draft in a separate tab.
3. **Publish to website** saves and publishes the current content. Visitors see it on their next page load; no code edits or redeployment are needed.

Results and reviews require confirmation of publication permission. Unpublished entries stay private. Uploaded photos have public URLs: upload only photos intended for public use. Removing a gallery entry hides it from the page but does not delete the stored image.

The admission inquiry opens WhatsApp for the visitor to review and send. Inquiries are not stored in the database. The Student Portal remains a separate application.

## Local setup (developer)

Requires Node.js and npm.

```powershell
npm ci
npm run db:local
```

Create a `.dev.vars` file containing a strong local-only password (at least 16 characters):

```text
ADMIN_PASSWORD=your-long-private-password
```

Then run:

```powershell
npm run dev
```

Open the Local URL printed by Wrangler (normally `http://localhost:8788`) and `/admin/` for the dashboard. First run creates an ignored `wrangler.jsonc` from `wrangler.example.jsonc` for local D1/R2 storage. Local content persists in `.wrangler/state`. The example resource IDs are local placeholders, not production IDs. Never deploy the generated local configuration unchanged.

Verification:

```powershell
npm run check
npm test
# With the local server running and .dev.vars configured:
node scripts/integration.mjs
```

The integration check is local-only and updates local draft/published fixtures, then restores `data/content.json`. It also uploads one test logo to local R2. Do not point it at production.

## One-time Cloudflare Pages activation

Existing site: https://insights-academy-webpage.pages.dev/

These files have not been deployed. This project continues to use Cloudflare Pages; it does not require moving hosting.

1. In Cloudflare, create a **D1 database** for academy website content. Open its SQL console and execute the three `CREATE TABLE` statements in `schema.sql`.
2. In the existing Pages project's **Settings → Bindings**, add a D1 binding named **DB** and select that database.
3. Create an **R2 bucket** for website photos, then add an R2 binding named **MEDIA** to that bucket in Pages. Account R2 activation may be needed. Without this binding, text editing works but uploads return a setup message.
4. Add an encrypted Pages environment variable / secret named **ADMIN_PASSWORD**. Use a unique password of at least 16 characters. Share it privately with the owner; do not put it in Git or frontend files. Use a separate password and resources for preview deployments if enabling the dashboard there.
5. Set the production build command to **npm run build** and build output directory to **dist**. Keep the repository root directory as the project root so Cloudflare discovers `functions/`. Do not configure a static-only deployment that omits Functions.
6. Deploy this repository through the existing Git integration. The tracked source intentionally does not include production credentials or resource IDs. Configure production bindings in Cloudflare rather than committing the generated local `wrangler.jsonc`.
7. Open `/admin/`, sign in, enter the confirmed address, subjects, fees and other academy information, save a draft, preview, then publish.

Until the first publish, the page uses `data/content.json` as initial content. With no database binding, the public page still works but owner sign-in explains the missing setup. If the content API fails, visitors see the packaged academy information and a notice. Once content is published, it is stored in D1 and survives site redeploys.

## Files and security

- Public HTML pages, `script.js`, and `site.css`: public website and content rendering.
- `admin/`: form-based dashboard and private draft preview.
- `functions/api/[[path]].js`: server-side content, login, publishing and photo endpoints.
- `lib/content-schema.js`: shared validation and public-content filtering.
- `schema.sql`: content, session and login-throttling tables.
- `scripts/build.mjs`: copies only public assets to `dist`; server source, tests and secrets are excluded.

Owner sessions use random tokens stored as hashes, HttpOnly/SameSite cookies, Secure cookies on HTTPS, eight-hour expiry, and server-side sign-out. Sign-in is limited to five attempts per IP per 15 minutes. Changes require same-origin requests and a valid session. Concurrent edits produce a conflict instead of silently overwriting another saved draft. Content is validated server-side; website text is escaped and links are restricted to HTTP(S) or uploaded media paths.

This is a single-owner CMS. Separate staff accounts, password recovery, content history and admission record management are not included. Rotating the owner password does not revoke existing sessions: to revoke all sessions, clear the `sessions` table in the Cloudflare D1 console as part of the rotation.

Cloudflare setup reference: https://developers.cloudflare.com/pages/functions/bindings/


## Page structure and blogs

See [website pages and owner editing](docs/site-guide.md) for the separate Home, Fee Structure, Blogs and programme pages, blog editing, draft previews, and validation details.
