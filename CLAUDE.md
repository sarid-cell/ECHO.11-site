# CLAUDE.md — echo11.app

A static site (plain HTML/CSS/JS, no framework) on Vercel. Repo: sarid-cell/ECHO.11-site → Vercel project echo-11-site → echo11.app.
Owner: Shira Sarid. She is not a developer. Explain things to her simply, in Hebrew.

## The current plan
Read `SEO-PLAN.md`. Do only the phase she asked for, and tick off checkboxes when they're done.

## Working rules
1. **Every change goes on its own branch** → push → Vercel Preview → stop and send her the preview link. Nothing goes to main without her approval.
2. **PageSpeed is sacred.** No new libraries, no external fonts, no images over 150KB (WebP/AVIF), and no iframes on page load (use a facade). If a change might slow a page down, say so before making it.
3. **Health content (YMYL):** no medical promises. Phrasing like "research suggests" or "small studies found". Every claim gets a real peer-reviewed source with a link. Never invent a source or a statistic. If you aren't sure a source exists, leave it out. Every evidence page carries a short note that this is not medical advice.
4. **Brand voice:** honest and precise. It's fine to say what doesn't work. Spelling: **Echo.11** (in running text) / ECHO.11 (in titles).
5. **Every new page:** unique title and meta description, one H1, logical H2s, canonical, JSON-LD (Article + FAQPage where relevant, author = the Person entity from about.html), entry in `sitemap.xml`, and links to its trio (band page ↔ evidence page ↔ session).
6. **Hebrew:** `lang="he" dir="rtl"`, reciprocal hreflang, and short, natural text, not a translation.
7. **Don't touch** `vercel.json` (CSP/redirects) unless asked. If a new page needs a redirect from a URL without .html, add it following the existing pattern.
8. Commit messages in English, short and specific.
