# echo·11

<div align="center">

<img src="assets/images/hero.png" alt="echo·11" width="100%">

### Decoding the Algorithm of Human Resilience

*Bridging consumer psychology and generative AI to build future-proof brands.*

[![Live Site](https://img.shields.io/badge/Live%20Site-echo11.app-black?style=for-the-badge)](https://echo11.app)
[![Substack](https://img.shields.io/badge/Substack-Subscribe-FF6719?style=for-the-badge&logo=substack&logoColor=white)](https://shira.substack.com)

</div>

---

## About

**echo·11** is a digital laboratory exploring the intersection of consumer psychology and generative AI — a curated space for "Quiet Branding" and strategic foresight, created by [Shira Sarid](https://linkedin.com/in/shirasarid).

> *"In an age of artificial intelligence, our most powerful tool remains the human mind."*

## What's on the Site

| Page | Description |
|---|---|
| [`index.html`](index.html) | Homepage — vision, insights, and the core thesis |
| [`about.html`](about.html) | About echo·11 and Shira Sarid |
| [`book.html`](book.html) | *Behind the Scenes* — the digital book, available for purchase |
| [`book-thankyou.html`](book-thankyou.html) | Post-purchase delivery page |
| [`frequency.html`](frequency.html) | Interactive 10Hz binaural-beat reset tool (Web Audio API) |
| [`privacy.html`](privacy.html) / [`accessibility.html`](accessibility.html) | Policy pages |

## Project Structure

```
.
├── index.html, about.html, book.html, ...   # Pages (static HTML/CSS/JS)
├── assets/
│   ├── images/                               # Photos, illustrations (PNG + WebP)
│   ├── video/                                # Background/loop video
│   └── docs/                                 # Purchasable PDF
├── robots.txt, sitemap.xml, llms.txt         # Crawler & LLM discovery config
└── site-content.md                           # Plain-text content reference
```

## Tech Stack

- **Frontend** — HTML5, CSS3, vanilla JavaScript (no build step, no framework)
- **Audio** — Web Audio API for the binaural-beat frequency tool
- **Hosting** — [Vercel](https://vercel.com), auto-deployed from `main`
- **Analytics** — Google Analytics 4 (GA4) event tracking
- **Typography** — [Outfit](https://fonts.google.com/specimen/Outfit) + [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono)

## Key Features

- 🎧 10Hz binaural-beat session tool with a live progress ring and headphone check
- 📖 End-to-end digital book purchase flow (PayPal / card → delivery page → PDF)
- ♿ Accessibility-first: skip links, `aria-hidden`/`inert` side menu, WCAG-conscious contrast
- 🤖 SEO + LLM-crawlability: structured data (JSON-LD), `llms.txt`, semantic markup
- 🖼️ WebP-first images with PNG fallback via `<picture>`
- 📱 Fully responsive, scroll-reveal animations

## Local Development

This is a static site — no build step required.

```bash
git clone https://github.com/sarid-cell/ECHO.11-site.git
cd ECHO.11-site
python3 -m http.server 8000   # or any static file server
```

Then open `http://localhost:8000`.

## Deployment

Pushes to `main` deploy automatically to production via Vercel. Feature work happens on branches and is merged into `main` once verified.

## Connect

<div align="center">

[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=flat-square&logo=instagram&logoColor=white)](https://instagram.com/shira.sarid)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/shirasarid)
[![Pinterest](https://img.shields.io/badge/Pinterest-E60023?style=flat-square&logo=pinterest&logoColor=white)](https://pinterest.com/shirasarid)
[![Substack](https://img.shields.io/badge/Substack-FF6719?style=flat-square&logo=substack&logoColor=white)](https://shira.substack.com)

</div>

---

<div align="center">

**Psychology First, Pixels Second.**

</div>
