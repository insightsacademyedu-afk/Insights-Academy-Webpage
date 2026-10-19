# Insights Academy — Public Website

A responsive static introduction website for Insights Academy, using the academy's teal-and-orange identity.

## Files
- `index.html` — page content, contact details, and logo references
- `style.css` — layout, responsive styling, and animations
- `academy-theme.css` — academy colors and visual identity
- `assets/insights-academy-mark.png` — cropped academy logo mark used in the header, footer, and favicon
- `script.js` — mobile navigation, reveal animations, and admissions inquiry handoff to WhatsApp

## Contact details
- Phone: `03224103315`
- Email: `insightsacademy.edu@gmail.com`
- The inquiry form opens WhatsApp using the phone number in international format.

## Deployments
The `main` branch of the connected GitHub repository deploys automatically to Cloudflare Pages:
https://insights-academy-webpage.pages.dev/

## Notes
- The admission inquiry form opens a prefilled WhatsApp message; it does not store or send student information to a server automatically.
- The course names are illustrative starter categories and should be replaced with the academy's actual courses.
- Google Fonts are loaded from Google's CDN; the page falls back to system fonts if they are unavailable.
