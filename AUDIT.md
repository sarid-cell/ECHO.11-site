# ECHO.11 — Site audit (baseline)

**Date:** 24 Nov 2026 · **Scope:** all 25 HTML pages in `main` (commit `c42a0c5`) · **Status:** audit only, no site file changed.

**How this was tested**
- The live domain (echo11.app) is blocked from the audit container, so every test ran against a local copy served by a small server that copies Vercel's behaviour: the same `vercel.json` headers (CSP included), the same redirects, and brotli compression.
- Browser: Chromium (Playwright) at 390×844 (mobile, iPhone user agent) and 1440×900 (desktop). Lighthouse 12, 3 runs per page and form factor, median reported.
- **Not tested on real devices.** Anything about iOS Safari or Android Chrome audio comes from reading `assets/js/session.js` against known browser behaviour. Those rows are marked **hypothesis**, and each one says how to check it on a phone.
- Screenshots are in `audit/screens/`: `<page>-m390-fold.jpg` / `-d1440-fold.jpg` (first screen), `-full.jpg` (whole page), and `flow-*.jpg` (journey steps).

---

## 1. Executive summary: the 5 fixes that matter most

1. **The player has a broken pause button, and iPhone audio may fail silently.** While a session plays, the pause icon is invisible: the button turns into an empty black circle (`flow-2b-playing-focus-mode.jpg`). On iPhone, the 10 Hz and 40 Hz sessions use Web Audio, which iOS is known to mute when the side silent switch is on and to stop when the screen locks; the code has no defence against either, so the page would keep saying "Session active" with no sound (hypothesis: needs a 2-minute check on your iPhone). The player is the whole product, so fix this first. The work is small (S) and does not touch speed.
2. **Science pages hide the way to a session.** On `/bands/alpha.html` the first link to a session sits about 72% of the way down (10,237 px into a 14,269 px page). The floating "Listen" pill, which is meant to fix that, is hidden under the cookie banner until the visitor answers it (`flow-1a` vs `flow-1b`). REM has the same problem: its session link is 78% of the way down. Google visitors read, never see a way to listen, and leave.
3. **From the homepage, sound takes 3 taps, and the first tap looks like Play but isn't.** The ▶ icons on the home hero are links. They open the session page, where the visitor has to press Play again and then answer the headphone question. A shorter path (open the headphone question as soon as the page loads, so the next tap plays) needs your decision.
4. **The analytics numbers can't be trusted yet.** GA runs on every Vercel preview and on your own visits, with no filter. The cookie banner very likely causes the `echo11.app` self-referrals. No key events are set up, and the Vercel Web Analytics tag loads on every page while Web Analytics is switched off for the project. Fix the measurement first; otherwise none of the other fixes can be measured.
5. **Two health-claim problems in the session text.** The "7–15 minute window" has no source, on the English 10 Hz page and both Hebrew session pages. The Hebrew 10 Hz page states the CIA/Gateway document's conclusion in bold, as fact, while the English page correctly labels it "History · not evidence". Under your YMYL rule, both need fixing.

**Speed is already good** (mobile Performance 92–99 on the 7 pages tested, CLS ≈ 0). Nothing here needs a new library. The only speed work proposed makes pages lighter, chiefly the Hebrew 10 Hz page, the slowest one (LCP 3.3 s).

---

## 2. Findings

Impact is measured against the three goals: (1) press Play and stay, (2) science page → session, (3) on to Instagram, YouTube, and the app.
Effort: **S** ≤ 1 h · **M** half a day · **L** more.
Risk column: risk to speed or to the brand. **⚑ = needs Shira's decision.**

### A. Player and audio (goal 1)

| ID | Page | Problem | Evidence | Fix | Impact | Effort | Risk |
|---|---|---|---|---|---|---|---|
| A1 | All 6 session pages | **Pause icon is invisible during playback.** Both icons fill with `url(#playBtnIconGradient)`, but that gradient is defined *inside* the play-icon SVG, which becomes `display:none` during playback, so the pause icon has no fill. Confirmed in Chromium (so Android Chrome is affected too); Safari not yet checked. | `audit/screens/flow-2b-playing-focus-mode.jpg` (empty black disc); `frequency.html:732-733`, same markup on `40hz`, `sleep`, `he/*` | Move the `<defs>` gradient into its own always-rendered, hidden `<svg>` | **High** | S | None |
| A2 | 10 Hz and 40 Hz (EN + HE) | **Hypothesis:** on iPhone, Web Audio is muted when the side silent switch is on, so the visitor presses Play and hears nothing while the timer runs. | `session.js` `startAudio()` builds an `AudioContext` with oscillators and never sets `navigator.audioSession`. **Verify:** iPhone, silent switch on, play `/frequency.html` | Set `navigator.audioSession.type = 'playback'` where supported (newer iOS Safari); one guarded line | **High** | S | None |
| A3 | 10 Hz and 40 Hz | **Hypothesis:** if audio is interrupted (iOS screen lock, a phone call, Bluetooth disconnecting), nothing notices. The `AudioContext` goes to `suspended`/`interrupted`, but the UI stays on "Session active" and the timer keeps going on return, with silence. | `session.js` has no `audioCtx.onstatechange` handler and no resume on `visibilitychange`; the visibility handler only reports analytics. **Verify:** start 10 Hz on an iPhone, lock for 30 s, unlock | On `statechange` → pause with "Paused · tap to continue"; on return try `audioCtx.resume()` | **High** | S–M | None |
| A4 | 10 Hz and 40 Hz | **The timer is not based on real clock time.** It subtracts 1 per `setInterval` tick, so throttled or frozen timers (background tab, locked phone) make it drift from the audio actually heard, and `frequency_complete` can fire at the wrong moment. (The sleep page is fine: it follows the audio file's own clock.) | `session.js` `beginSession()`: `remaining--; playedSeconds++` | Compute elapsed time from `audioCtx.currentTime` (or `performance.now()`) | Med | S | None |
| A5 | Sleep (EN + HE) | **Hypothesis:** no loading or error state. The 10.4 MB file uses `preload="none"`; on a slow connection the page shows "Session active" frozen at 30:00 with no sound and no message. (The file *is* web-optimised, so it can start before it finishes downloading.) | `session.js` `getMedia()` listens only for `ended`, with no `waiting`/`error`; file check: `moov` atom at byte 28 | Show "Loading…" on `waiting` and a short message on `error` | Med | S | None |
| A6 | All 6 session pages | **The timer is `aria-live="polite"` and changes every second**, so a screen reader announces the countdown every second for 11–30 minutes. | `frequency.html:735`, `40hz.html:792`, `sleep.html:684`, `he/*` | Remove `aria-live` from the timer; keep announcements for state changes only | Med | S | None |
| A7 | Home → session | **The ▶ icons on the home hero are links, not players.** Sound takes 3 taps (home ▶ → page Play → headphone gate), and the first ▶ breaks the promise its icon makes. Context: the data shows 12 users started and 4 saw the gate. | `index.html:1851-1871`; `audit/screens/home-m390-fold.jpg`, `flow-2a-headphone-gate.jpg` | ⚑ Option a: carry the intent (`frequency.html?start=1` opens the headphone gate on arrival, so the next tap plays: 2 taps). Option b: replace ▶ with → so the icon is honest | **High** | S–M | Brand (icon or behaviour) ⚑ |

### B. Getting from a science page to a session (goal 2)

| ID | Page | Problem | Evidence | Fix | Impact | Effort | Risk |
|---|---|---|---|---|---|---|---|
| B1 | Every page; worst on band and REM pages | **The cookie banner covers the floating "Listen" pill** (banner `z-index:99999`, 125 px tall at 390 px; pill `z-index:9997`, `bottom:20px`). Search visitors who ignore the banner never see the pill. On session pages the banner also covers the instruction line "Headphones on · Press play · Close your eyes". | `flow-1a-alpha-scrolled-banner-hides-pill.jpg` vs `flow-1b-…-pill-visible.jpg`; `frequency-m390-fold.jpg` | Quick: lift the pill above the banner while the banner shows. ⚑ Bigger: a calmer one-line banner in the site's own type and colours (today it's a black bar in system sans-serif, not the brand) | **High** | S (lift) / S–M (restyle) | Restyle = brand ⚑ |
| B2 | `/bands/*`, `/rem-sleep.html` | **The first link to a session is about ¾ of the way down.** Alpha: 10,237 px of 14,269 px. REM: 14,130 px of 18,103 px. A "Listen · 10 Hz" chip exists, but it is the 4th chip and below the first screen on mobile. | Measured in Playwright (`#alpha-listen`, `#rem-listen` offsets) | Add one quiet line right after the answer paragraph, e.g. "Try it: the free 11-minute 10 Hz session →", in the existing mono link style | **High** | S | Low (one text link, no assets) ⚑ copy |
| B3 | `/rem-sleep.html` | **Weak internal linking.** Only 3 pages link to REM (delta, gamma, theta). Not the menu, not `/sleep.html`, not `/bands/`. It ranks at average position 76. | `audit` link crawl: inbound counts (REM = 3; band pages 6–10) | Link it from `sleep.html` ("What your brain does after you let go") and from `/bands/` | Med | S | None |
| B4 | `/sleep.html` | Title is 85 characters and the meta description 226, so Google cuts both off. | Crawl metrics | Shorten to about 60 and 155 characters | Low–Med | S | None |

### C. Onward: Instagram, YouTube, the app (goal 3)

| ID | Page | Problem | Evidence | Fix | Impact | Effort | Risk |
|---|---|---|---|---|---|---|---|
| C1 | Session-complete modal (10 Hz, 40 Hz, EN + HE) | The end of a session, the best moment to ask, offers YouTube and Instagram but **never the free app beta**. The app (echo11.space) is linked only inside the hamburger menu. The sleep modal has no next step at all (right for bedtime). The English 10 Hz modal also says "the effect builds with repetition", an unsourced health claim. | `frequency.html` `#completeModal`; `grep echo11.space` → 1 link per page, menu only | ⚑ Add "Try the app (free beta)" as a quiet third action; drop or source "builds with repetition" | Med | S | Copy ⚑ |
| C2 | All | Outbound clicks to Instagram and echo11.space carry no UTM tags and fire no custom event, so you can't see which page sends people to the app. | `grep` for `gtag` events: only YouTube links are tracked (`yt-facade.js:33`) | Add `?utm_source=echo11.app&utm_medium=referral&utm_content=<placement>` to echo11.space links; one `outbound_click` event | Med | S | None |

### D. Analytics: why the GA4 numbers look strange

| ID | Page | Problem | Evidence | Fix | Impact | Effort | Risk |
|---|---|---|---|---|---|---|---|
| D1 | All | **GA runs on every Vercel preview URL and on your own visits.** No hostname check, no internal-traffic flag. This is the most likely source of the github.com and vercel.com referrals. | `<head>` gtag snippet (e.g. `index.html:5-31`); `vercel.json` redirects only `echo-11-site.vercel.app`, not `*-git-*` previews | Load GA only when `location.hostname === 'echo11.app'`; add a `?internal=1` switch that sets `traffic_type=internal`, then exclude it with a GA4 data filter | **High** | S | None |
| D2 | All | **Hypothesis: the cookie banner creates the `echo11.app` self-referrals.** Consent starts as `denied`, so the landing-page `page_view` goes out without cookies. Accepting updates consent but sends no new hit. The first cookied session then starts on page 2, whose referrer is echo11.app, and Instagram or Google lose the credit. | `index.html:9` (default denied), `:2358-2362` (update only). **Verify:** GA4 DebugView, fresh browser, Accept on the landing page, click to a second page, check `session_start` source | After Accept, send one `page_view` for the current page; also add echo11.app to GA4 → Data stream → "List unwanted referrals" | **High** (data) | S | None |
| D3 | All | **The Vercel Web Analytics tag loads on every page, but Web Analytics isn't enabled for the project.** The Vercel API returns "Web Analytics not found" for `echo-11-site`, so `/_vercel/insights/script.js` most likely returns 404: one console error per page. This is the only thing keeping Best Practices at 96 instead of 100. | Lighthouse `errors-in-console` on all 7 pages; Vercel API check; tag at `index.html:2403`. **Verify:** live DevTools → Network | ⚑ Either switch Web Analytics on in Vercel (cookieless page counts that need no consent, a useful second source since GA undercounts) or delete the tag | Med | S | None |
| D4 | All | **Hypothesis:** the CSP `connect-src` allows only `www.google-analytics.com`. GA4 can also send to `region1.google-analytics.com` and `*.analytics.google.com`, and those hits would be blocked and lost. | `vercel.json` CSP header. **Verify:** live DevTools console, look for "Refused to connect" | ⚑ Widen `connect-src` to the hosts in Google's GA4 CSP guide (needs your OK: `vercel.json` is off-limits by default) | Med–High | S | None ⚑ |
| D5 | GA4 admin | No key events and no custom dimensions, so the funnel you already send (`gate_*`, `frequency_start`, `frequency_progress` at minutes 1/3/5/8, `frequency_stop` with reason, `frequency_complete`) is invisible in reports. "2 complete of 12" only counts people who listened 11 unbroken minutes. | Your GA4 numbers; `session.js` sends `hz`, `id`, `minute`, `reason`, `seconds_played` | (In GA4, by you, about 15 min) Mark `frequency_start` and `frequency_complete` as key events; register those 5 parameters as custom dimensions; build a funnel exploration: gate_shown → gate_confirmed → start → progress 1 → 3 → 5 → complete | **High** | S | None |
| D6 | `/book-thankyou.html` | `purchase` fires on every load of the thank-you page, so a refresh, a bookmark or a shared link records another sale. | `book-thankyou.html:1015-1017` | Fire it once (remember in `localStorage` that it was sent and skip it on later loads) | Low–Med | S | None |

**GA4 events per page, and when they fire** (from the code)

| Where | Event | When |
|---|---|---|
| Every page | `page_view` (automatic) | When `gtag.js` loads: on the first scroll, click, key press, touch or mouse move, or 3 s after `load`. A visitor who leaves within ~3 s without touching anything is never counted. Before Accept: sent cookieless (consent `denied`) |
| Every page | Enhanced-measurement events (scroll, outbound click, …) | Only if they're switched on in the GA4 stream settings (not visible from the code) |
| 6 session pages | `gate_shown` → `gate_confirmed` / `gate_skipped` | First Play in a browser tab (10 Hz and 40 Hz only; sleep has no gate). After that the tab remembers (`sessionStorage`), so the gate doesn't show again |
| 6 session pages | `frequency_start` | Start of a fresh session (not on resume) |
| 6 session pages | `frequency_progress` {minute} | After 1, 3, 5, 8 min of real playback (sleep: 1, 5, 10, 20, 29) |
| 6 session pages | `frequency_stop` {reason, seconds_played} | Pause, tab hidden (10/40 Hz only), or leaving the page |
| 6 session pages | `frequency_complete` | The countdown reaches 0 (or Stop after a looped cycle) |
| Pages with YouTube | `youtube_embed_play`, `youtube_outbound` | Facade clicked; a YouTube link in the completion modal clicked |
| Band and REM pages | `band_*_interact`, `band_fold_open`, `band_float_listen_click` | Interactive figures, FAQ folds, the floating Listen pill |
| `/frequencies.html` | `hub_choice` {hz} | A session card is chosen |
| `/book-thankyou.html` | `purchase`, `file_download` | `purchase` on *every* load of the page (see D6); `file_download` when the download button is clicked |

### E. UI, accessibility and consistency

| ID | Page | Problem | Evidence | Fix | Impact | Effort | Risk |
|---|---|---|---|---|---|---|---|
| E1 | All | **A thin black bar at the top-left of every page.** It's the "Skip to content" link: hidden at `top:-50px` but 54.6 px tall, so 4.6 px stays on screen. It looks like a stuck loading bar. | Visible at the top-left of every screenshot; measured with `elementFromPoint` | Move it further up (`top:-100px`) or hide it with a transform until focused | Med (polish on every page) | S | None |
| E2 | All | **Tap targets under 44 px:** hamburger 26×18 px, theme toggle 34×34, cookie buttons 73×33, the home "בעברית ←" links 60×33, band "Read the guide" links 145×21. | Crawl metrics (`smallTargets`) | Add padding so each target is 44×44, with no visual change | Med | S | None |
| E3 | Session pages EN + HE | **Contrast below WCAG AA (4.5:1)** for small grey text: eyebrows `#8f8f8f`/`#969696` on `#fdfdfd` (2.9–3.2:1), labels `#858585` (3.6:1), Hebrew labels `#909090` on white (3.2:1). | Lighthouse `color-contrast` on `frequency`, `sleep`, `he/teder-10hz` | Darken those greys to `#767676` or darker | Med | S | Slight visual change ⚑ (show in preview) |
| E4 | All | **Four different headers.** Home has desktop nav links; session and band pages don't; about, book and shira-sarid show a live ticking clock; privacy and accessibility have a "Back to ECHO.11" link that wraps onto 2 lines at 390 px. Footers range from 12 links to 1 (privacy). This is the main reason some pages feel like a different site. | `home-d1440-fold.jpg` vs `frequency-d1440-fold.jpg`; `about-m390-fold.jpg`, `book-m390-fold.jpg` (clock); `privacy-m390-fold.jpg` | ⚑ One shared header and footer on every page (same logo position, theme toggle, language link, menu) | Med | M | Brand ⚑ |
| E5 | Session pages | The language link has `aria-label="Switch language"`, but its visible text is "עברית"/"English" (label-in-name failure). | Lighthouse `label-content-name-mismatch` | Remove the `aria-label` (the visible text with `lang` is enough) | Low | S | None |
| E6 | `bands/gamma`, `bands/theta` | Duplicate IDs (`gamma-listen`, `theta-listen` used on both an `<h2>` and an `<a>`). | `bands/gamma.html:437-438`, `bands/theta.html:463` | Rename the heading ID | Low | S | None |
| E7 | Book | The eyebrow "ECHO.11 · Volume One" sits over the photo and is barely readable. | `book-m390-fold.jpg` | Darken it or give it a text backdrop | Low | S | Visual ⚑ |

### F. Hebrew path

| ID | Page | Problem | Evidence | Fix | Impact | Effort | Risk |
|---|---|---|---|---|---|---|---|
| F1 | `he/*` | **The Hebrew path ends after the three sessions.** On Hebrew pages the logo goes to the English home; the menu, footer and modal links to the book, about, privacy, accessibility and all science pages are English. There are no Hebrew science pages yet (SEO-PLAN Phase 2). | `flow-4a-hebrew-menu.jpg`; `he/teder-10hz.html` link list | Quick: Hebrew logo → `/he/teder-10hz.html`, and mark every English link "(English)" consistently. Long-term: Phase 2 pages | Med | S / L | None |
| F2 | `he/*` | Hebrew copy addresses the reader in the feminine only ("איך שאת מרגישה", "חזרי"). | Completion modal, `he/teder-10hz.html` | ⚑ Decide: intentional voice, or neutral/plural forms | Low–Med | S | Brand ⚑ |

### G. Health content (YMYL)

| ID | Page | Problem | Evidence | Fix | Impact | Effort | Risk |
|---|---|---|---|---|---|---|---|
| G1 | `he/teder-10hz.html` | **The CIA/Gateway paragraph presents the document's conclusion as fact, in bold:** "טכנולוגיית ביטים בינאורליים משנה מצב תודעה באופן מדיד וניתן לשחזור". The English page frames the same document as "History · not evidence". | `he/teder-10hz.html:470-472` vs `frequency.html:932-939` | Align the Hebrew text with the English framing (history, not evidence; the peer-reviewed research is what to weigh) | **High** (trust/YMYL) | S | Copy ⚑ (preview) |
| G2 | `frequency.html`, `he/teder-10hz.html`, `he/teder-40hz.html` | **"7–15 minutes … brainwave synchronization stabilizes" has no source.** The Hebrew version goes further than the English: "11 minutes is the minimum length at which it can be measured". | `frequency.html:949`, `he/teder-10hz.html:478`, `he/teder-40hz.html:482` | Find a real peer-reviewed source, or remove the number and keep the honest line "a design choice, not a clinical threshold". I won't add a source I can't verify | **High** (YMYL) | S | Copy ⚑ |

### H. Speed

| ID | Page | Problem | Evidence | Fix | Impact | Effort | Risk |
|---|---|---|---|---|---|---|---|
| H1 | `he/teder-10hz.html` | **Slowest LCP of the 7 pages (3.3 s mobile).** The hero loads the full 1456 px `astro-eyes-closed.webp` (182 KB) on a phone. 480 px and 960 px versions already exist and are used on the band pages. | Lighthouse `image-delivery-insight` (−202 KB); `he/teder-10hz.html:338` | Add `srcset`/`sizes` exactly like `bands/theta.html` | Med | S | Speed ↑ only |
| H2 | `sleep.html`, `frequency.html` | Sleep loads `astro.webp` at 169 KB on mobile (480/960 versions exist). The 10 Hz page's video poster is `book-hero.jpg` (138 KB JPEG) on phones, although phones never get the video. | Lighthouse biggest-request lists; `sleep.html:658`, `frequency.html:691` | Responsive `srcset` for the sleep hero; a WebP (or smaller) poster for 10 Hz | Med | S | Speed ↑ only |
| H3 | All | 3–6 render-blocking stylesheets per page (band pages: `fonts`, `view-transitions`, `quiet-mode`, `session`, `essay`, `band` ≈ 80 KB unminified). Lighthouse estimates 0.5–0.8 s of render delay on mobile. | Lighthouse `render-blocking-insight` on all 7 pages | Inline the three tiny ones (`view-transitions` 1.4 KB, `fonts` 3.8 KB, `quiet-mode` 3.9 KB) and minify the rest. Measure before and after each step | Med | M | Must be measured; revert if any score drops |

**Checked and clean** (no action needed): 0 broken internal links or anchors across 25 pages; the 3 EN↔HE hreflang pairs are reciprocal, with `x-default`; canonicals are correct; all 20 sitemap URLs exist; `robots.txt` is fine; JSON-LD parses on every page; one H1 per page; every image has `alt`; no horizontal scroll at 390 px; CLS ≤ 0.014 everywhere; no JavaScript errors except the Vercel Insights 404 (D3); the sleep audio and the 10 Hz video are web-optimised (`moov` atom first); the YouTube embeds use facades and the Substack iframe is lazy.

---

## 3. Flow map: where people drop off

```
FLOW 1  Google → /bands/alpha.html → session → end
  land on alpha (LCP 2.9 s mobile, fine)
   │  ✗ cookie banner covers the bottom 125 px                 [B1]
   │  ✗ no session link until ~72% down the page               [B2]
   │  ✗ floating "Listen" pill hidden under the banner         [B1]
   ▼  (only visitors who scroll ~10,000 px or dismiss the banner)
  /frequency.html → Play → headphone gate → playing
   │  ✗ pause icon invisible: "is it frozen?"                  [A1]
   │  ✗ iPhone silent switch: silence (hypothesis)             [A2]
   │  ✗ screen lock / call: silent, UI still "active" (hyp.)   [A3]
   ▼
  11:00 complete → YouTube / Instagram (no app beta)           [C1]
  Biggest drop-off: between landing and the first session link.

FLOW 2  Instagram → / → session → gate → play → complete
  home: clear in 5 s ("Free binaural beats for a quieter mind" + 3 sessions)
   │  ✗ ▶ looks like Play but only opens a page                [A7]
   ▼
  session page: Play is above the fold (y = 496–568 px on a 844 px screen) ✓
   │  ✗ cookie banner covers the instruction line              [B1]
   ▼
  headphone gate: clear, two 68–70 px buttons, "play anyway" ✓
   ▼
  playing → the A1/A2/A3 risks above
   ▼
  complete → Instagram ✓, YouTube ✓, app ✗                     [C1]
  Biggest drop-off: tap 1 → tap 2 (expectation broken), then audio reliability on iPhone.

FLOW 3  Google → /rem-sleep.html → /sleep.html
  land on REM (good page, LCP 2.4 s)
   │  ✗ link to /sleep.html at 78% of the page (14,130 / 18,103 px)  [B2]
   │  ✗ floating pill (→ /sleep.html) hidden under the banner        [B1]
   ▼
  /sleep.html: Play above the fold ✓, no headphones needed ✓
   │  ✗ no loading state on a slow connection (hypothesis)     [A5]
   ▼
  30:00 → "Down to silence" (right for bedtime) ✓
  Biggest drop-off: REM → sleep link too late; few pages link to REM at all [B3].

FLOW 4  Hebrew visitor → /he/teder-10hz.html
  Hebrew page, RTL correct, Play above the fold (y = 351 px) ✓
   │  LCP 3.3 s: the slowest page tested                       [H1]
   │  ✗ CIA claim stated as fact; unsourced "7–15 min"         [G1, G2]
   ▼
  session → Hebrew completion modal ✓ → YouTube / Instagram
   │  Moves between the 3 Hebrew sessions fine ✓
   ▼
  anything else (logo, book, about, privacy, science) → English  [F1]
  Answer: a full Hebrew path exists for listening; for everything else, the visitor ends up in English.
```

**First 3 seconds on mobile:** the home page is the strongest screen on the site: calm, clear promise, three choices, Play visible. Session pages are dramatic and on-brand (big thin "10 Hz", glowing play disc). What breaks the calm on *every* page is the same pair of things: the heavy black cookie bar in a system font at the bottom, and the black sliver at the top-left (E1). On science pages the first screen is all reading, with no sign that you can listen.

---

## 4. Lighthouse baseline (before)

Lighthouse 12, local Vercel-like server, median of 3 runs. Mobile = simulated slow 4G and a mid-range phone; desktop = Lighthouse desktop preset.
Lighthouse can't measure INP (it needs real interactions); TBT stands in for it. There is too little traffic for Chrome field data (CrUX).
**After deploying any fix, re-run PageSpeed Insights on the live URLs: that is the number Google shows.** Local numbers can differ a little from live (CDN, GA loading 3 s after load).

| Page | Form | Perf | A11y | Best pr. | SEO | FCP | LCP | CLS | TBT | Page weight |
|---|---|---|---|---|---|---|---|---|---|---|
| / | mobile | **99** (99/99/99) | 100 | 96 | 100 | 1.4 s | 2.0 s | 0.001 | 0 ms | 138 KB |
| /frequency.html | mobile | **94** (95/94/94) | 96 | 96 | 100 | 1.5 s | 3.0 s | 0.006 | 0 ms | 276 KB |
| /40hz.html | mobile | **97** (97/97/97) | 100 | 96 | 100 | 1.4 s | 2.4 s | 0.006 | 0 ms | 195 KB |
| /sleep.html | mobile | **94** (94/94/94) | 97 | 96 | 100 | 1.4 s | 3.1 s | 0.006 | 0 ms | 309 KB |
| /bands/alpha.html | mobile | **94** (95/94/94) | 100 | 96 | 100 | 1.4 s | 2.9 s | 0.001 | 4 ms | 358 KB |
| /rem-sleep.html | mobile | **98** (98/98/98) | 100 | 96 | 100 | 1.5 s | 2.4 s | 0.001 | 20 ms | 202 KB |
| /he/teder-10hz.html | mobile | **92** (92/92/93) | 96 | 96 | 100 | 1.4 s | 3.3 s | 0.007 | 0 ms | 403 KB |
| / | desktop | **100** (100/100/100) | 100 | 96 | 100 | 0.4 s | 0.5 s | 0.014 | 0 ms | 259 KB |
| /frequency.html | desktop | **100** (100/100/100) | 96 | 96 | 100 | 0.5 s | 0.8 s | 0.001 | 0 ms | 651 KB |
| /40hz.html | desktop | **100** (100/100/100) | 100 | 96 | 100 | 0.4 s | 0.7 s | 0.001 | 0 ms | 281 KB |
| /sleep.html | desktop | **100** (99/100/100) | 97 | 96 | 100 | 0.4 s | 0.8 s | 0.001 | 0 ms | 491 KB |
| /bands/alpha.html | desktop | **100** (100/100/100) | 100 | 96 | 100 | 0.4 s | 0.7 s | 0.000 | 0 ms | 358 KB |
| /rem-sleep.html | desktop | **100** (100/100/100) | 100 | 96 | 100 | 0.4 s | 0.7 s | 0.000 | 0 ms | 202 KB |
| /he/teder-10hz.html | desktop | **100** (99/100/100) | 96 | 96 | 100 | 0.4 s | 0.7 s | 0.001 | 0 ms | 403 KB |

Perf shows the median, with the 3 runs in brackets. Raw medians are saved in `audit/lighthouse-baseline.json` for the before/after comparison.

**What holds the scores back:** (1) mobile LCP of 2.9–3.3 s on 4 pages, from oversized hero images (H1, H2) and render-blocking CSS (H3); (2) Best Practices is 96 on every page, from the Vercel Insights 404 (D3); (3) Accessibility is 96–97 on the session pages, from contrast (E3) and the language-link label (E5).

**Heaviest items per page (mobile):** see H1 and H2. Every page loads `outfit-variable-latin.woff2` (33 KB) and IBM Plex Mono (16 KB per weight, up to 3 weights); both are already self-hosted and preloaded, which is fine. No third-party script runs before interaction (GA is deferred until first interaction or load + 3 s).

---

## 5. Proposed fix plan

Rules for every batch: branch `audit-fixes`, one commit per fix, Lighthouse re-run after the batch with before/after shown, any score drop reverted, Vercel preview link sent before anything reaches `main`.

### Batch 1: Quick wins (each ≤ 1 h, no visual or brand change, no speed risk)
| Order | Fix | IDs |
|---|---|---|
| 1 | Visible pause icon (gradient moved out of the hidden SVG) | A1 |
| 2 | iPhone silent-switch fix (`navigator.audioSession`) | A2 |
| 3 | Pause the UI when audio is interrupted, resume on return | A3 |
| 4 | Remove `aria-live` from the ticking timer | A6 |
| 5 | Lift the floating "Listen" pill above the cookie banner | B1 (lift only) |
| 6 | Skip-link sliver gone | E1 |
| 7 | 44 px tap targets via padding only | E2 |
| 8 | `aria-label` on the language link; duplicate IDs | E5, E6 |
| 9 | GA only on echo11.app, plus an internal-traffic switch | D1 |
| 10 | Send a `page_view` after Accept (self-referral fix) | D2 |
| 11 | Responsive hero images on Hebrew 10 Hz and sleep; lighter 10 Hz poster | H1, H2 |
| 12 | Link REM from `sleep.html` and `/bands/`; shorten the sleep title and description | B3, B4 |
| (you, in GA4) | Key events, custom dimensions, funnel, unwanted referrals | D5, D2 |

### Batch 2: Medium (needs a preview check, small visible changes)
| Fix | IDs |
|---|---|
| Real-clock timer for the 10 Hz and 40 Hz sessions | A4 |
| Loading and error state for the sleep audio | A5 |
| Early "Try the session →" line on the 5 band pages and REM (copy shown in preview) | B2 |
| Contrast: darken the small grey labels to AA | E3 |
| UTM tags and an outbound event on echo11.space and Instagram links | C2 |
| Hebrew logo → Hebrew home; consistent "(English)" labels | F1 (quick part) |
| Render-blocking CSS: inline the 3 tiny files, minify, measured step by step | H3 |
| YMYL text: align the Hebrew CIA paragraph with the English; source or remove "7–15 min" (you approve the wording) | G1, G2 |

### Batch 3: Needs Shira's decision
| Decision | IDs | My recommendation |
|---|---|---|
| Home ▶ → page that opens the headphone gate on arrival (2 taps), or change ▶ to → | A7 | Opening the gate on arrival: keeps the icon, removes one tap |
| Restyle the cookie banner as a slim, on-brand bar | B1 | Yes: it's on every page's first screen |
| Add "Try the app (free beta)" to the completion modal; drop "effect builds with repetition" | C1 | Yes, as the quiet third button |
| Enable Vercel Web Analytics, or remove its tag | D3 | Enable: consent-free counts you can trust next to GA |
| Widen CSP `connect-src` for GA4 (touches `vercel.json`) | D4 | Check the live console first; change only if hits are blocked |
| One shared header and footer across all pages (removes the clock variant) | E4 | Yes, later: biggest "one site" gain, medium effort |
| Hebrew voice: feminine-only or neutral | F2 | Your call |
| Book eyebrow contrast | E7 | Small tweak |

**Repo note:** `audit/screens/` (~10 MB) will also deploy to Vercel as public files. Before merging to `main`, add `audit/` to `.vercelignore` (one line).
