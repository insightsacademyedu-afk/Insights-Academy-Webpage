# Website pages and owner editing

The layout follows the supplied STEP reference with Insights Academy's own teal and orange branding.

| Page | Content |
| --- | --- |
| Home (`/`) | Banner, popular programmes, About Us, news, features, optional teachers/results/reviews/gallery, admissions and FAQs |
| `/programs.html` | All classes, with stage filters |
| `/fee-structure.html` | The eight supplied tuition and stationery fee rows |
| `/blogs.html` | Searchable articles and category filters |
| `/blog.html?post=article-slug` | A complete article |
| `/scholarships.html` | The owner's scholarship policy, or admissions contact information |
| `/position-holders.html` | Approved student results, or a contact message until results are added |

Fees and blog articles are displayed on their own pages. Home and class cards do not display fee amounts.

## Owner dashboard

Open `/admin/` to manage the new **Homepage courses**, **Homepage features**, and **Blogs** sections, alongside the existing academy data and fee structure.

Blogs support a title, unique URL slug, category, optional date, short introduction, article text, and uploaded cover image. Article text is plain text; leave a blank line to start a new paragraph. Three original study articles are included as editable starting content. They contain general study guidance rather than academy performance claims.

Under **Academy details**, the owner can upload a homepage banner. The included banner is an AI-generated education illustration, not a photograph of an actual student or campus. See [asset and final prompt notes](asset-notes.md).

Use **Save draft**, then **Preview draft**. The preview's page selector and internal links let you check Home, fees, blogs, articles, and other pages using saved draft content. Use **Publish to website** to apply changes to the running website. During local review, that updates only the local database.

Empty optional sections stay hidden. Scholarships and position holders have useful contact information until the owner supplies their policies and permission-approved results.

## Verification

Automated checks exercise all seven public pages, menu controls, fee separation, article search and category filters, full article routes, programme filters, old content compatibility, safe text rendering, content validation, and authentication rules. The local server serves the public pages and banner successfully.

These are code and simulated-DOM checks. A connected browser was unavailable for visual review; review the local preview on desktop and mobile before deployment. The site is pushed to the academy GitHub repository and deployed on Cloudflare Pages. Production stores content and uploaded photos in D1; R2 is optional.


## Choosing an owner password

After the initial sign-in, click **Change password** at the top of the dashboard. Enter the current password and a new password of at least 12 characters, confirm it, and click **Update password**. The owner is signed out and can sign in again with their chosen password. All other devices are signed out as well. Save any content draft before changing a password. This is independent of Save Draft and Publish.
