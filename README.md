# Insights Academy — Public Website Starter

A responsive, animated-gradient public introduction website. It is a separate static website and does not modify the existing management system.

## Files
- `index.html` — page content and sections
- `style.css` — visual design, responsive layout, animations
- `academy-theme.css` — academy colors and visual identity
- `script.js` — mobile navigation, reveal animations, admission inquiry handoff to WhatsApp

## Before publishing
1. Open `script.js`.
2. Replace `923XXXXXXXXX` in `ACADEMY_WHATSAPP_NUMBER` with the academy's WhatsApp number in international format using digits only. Example format for Pakistan: `923001234567` (example only; use your real number).
3. Edit the starter program categories in `index.html` to match the academy's actual courses.
4. Add your real phone, address, email, logo, and social links if you want them shown.
5. Test all links and the inquiry form. The form opens a prefilled WhatsApp message; it does not store or send student information to a server automatically.

## Publish free with Cloudflare Pages
1. Create/sign in to GitHub at https://github.com/
2. Create a **new public repository** named `insights-academy-website`.
3. Upload `index.html`, `style.css`, `academy-theme.css`, and `script.js` to the repository's root (not the ZIP file itself).
4. Create/sign in to Cloudflare at https://dash.cloudflare.com/
5. Open Workers & Pages → Create application → Pages → Import an existing Git repository.
6. Select the GitHub repository.
7. For a plain static site, use build command `exit 0` and build output directory `/` (the repository root). If the interface rejects `/`, leave the output directory as the root/default as instructed by the current Cloudflare UI.
8. Deploy. Cloudflare will assign a `*.pages.dev` URL. The first deploy can take a few minutes.
9. Visit the URL on phone and computer; test the portal login and WhatsApp form.

Cloudflare's UI can change. Follow the current official guide:
https://developers.cloudflare.com/pages/framework-guides/deploy-anything/

## Existing portal
The portal buttons currently link to:
https://insights-academy.onrender.com/login

## Notes
- This is a front-end starter, not a complete student management or admissions backend.
- No API keys or passwords are included.
- Google Fonts are loaded from Google's CDN; the page still works if they fail to load, using fallback fonts.
- The course names are illustrative placeholders and should be edited before launch.
