# SEO-PLAN.md — echo11.app: content authority (0–90 days)

> Claude Code: read CLAUDE.md first. Work on **one phase per session**, on its own branch, and stop for Shira's approval after the Vercel Preview.

## The goal
Make echo11.app the most honest, accurate source on brainwaves and binaural beats in **English and Hebrew**.
**Success metric:** the number of distinct queries in Search Console (not clicks).
Clicks follow later. Targets: ~12 clicks/month today → 80–150 a month by day 90.

## What already exists (as of 8 Nov 2026)
- 5 band pages + a hub: `bands/alpha|beta|theta|gamma|delta.html` (1,400–5,000 words, FAQPage schema on each). No Hebrew versions, no hreflang.
- Session pages: `frequency.html` (10Hz), `40hz.html`, `sleep.html`, each with FAQ and hreflang.
- Hebrew: `he/teder-10hz.html`, `he/teder-40hz.html`, `he/sheina.html`
- Entity: `about.html` (~2,850 words), `shira-sarid.html` (~2,500 words), plus links to YouTube @shira_sarid, Substack, and the Ctrl Human podcast
- `essays/`: the template is ready, but `ghost-in-the-machine` and `unlimited-tools` are **empty shells** (the essay text was never pasted in), so they're noindex. `substack-analytics` is a deliberate draft (noindex, unlinked).

## Search-intent split: one page per question (prevents cannibalization)
| Type | Question it answers | Example |
|---|---|---|
| Band page `/bands/` | "What is X?" (EEG, definition) | What are gamma waves |
| Evidence page `/research/` (new) | "Does X work for Y?" | Do 40Hz binaural beats help studying |
| Session page | "I want to listen" | 40Hz focus session |
Every page links to the other two in its trio. One page must never compete with another for the same query.

---

## Phase 0: Cleanup ✅ (8 Nov 2026)
- [x] `.vercelignore`: `*.md` and `tools/` aren't served publicly (README.md used to be reachable at echo11.app/README.md)
- [x] CLAUDE.md + SEO-PLAN.md added to the repo
- [x] Checked: sitemap.xml (19 URLs) matches every indexable page; the noindex drafts are correctly left out
- [x] Checked: `substack-analytics` is a deliberate draft, not a bug

## Phase 1: 4 English evidence pages (`/research/`)
1. `binaural-beats-focus.html`: Binaural beats for focus: what the research actually says
2. `alpha-10hz-anxiety.html`: 10Hz alpha for anxiety and calm: an evidence review
3. `gamma-40hz-studying.html`: 40Hz gamma for studying and deep work
4. `delta-sleep.html`: Delta binaural beats for sleep: an honest guide

Structure for every page: an answer in the first 2–3 lines → what the research found (peer-reviewed sources with links and a year) → what isn't known / what has been oversold → how to try it safely → FAQ with schema → link to the session + the band page.
Add a `research/index.html` hub, plus Article schema with author = the Person entity.
**Done when:** each page has 1,200+ words, at least 5 real sources, unchanged PageSpeed, and is in the sitemap.
**One page per session.** Shira approves the first one before the rest go ahead.

## Phase 2: Hebrew
- [ ] A Hebrew version of each evidence page (`/he/research/...`). Write it natively for an Israeli audience, not as a literal translation
- [ ] Hebrew versions of the 5 band pages (`/he/bands/...`)
- [ ] Reciprocal hreflang (en ↔ he ↔ x-default) on every pair
**Done when:** every page has a pair with valid hreflang, RTL is correct, and the sitemap is updated.

## Phase 3: Upgrading the band pages
- [x] **Start here:** 7 claims marked `CITATION NEEDED` in the code (alpha 2, beta 3, theta 2). Theta: both resolved 9 Nov 2026 (Jensen & Tesche 2002; Buzsáki 2002). Alpha: both resolved 10 Nov 2026 (Klimesch et al. 2007, Jensen & Mazaheri 2010 vs Pfurtscheller et al. 1996; Ingendoh et al. 2023, López-Caballero & Escera 2017). Beta: all 3 resolved 10 Nov 2026 (Pfurtscheller & Lopes da Silva 1999, Kilavik et al. 2013; the "anxiety = high beta" claim replaced with Newson & Thiagarajan 2019, which does not support it; López-Caballero & Escera 2017, Basu & Banerjee 2023). All 7 done. Find a real peer-reviewed source for each one, or remove the claim
- [ ] Refresh sources and check that every source is real and current
- [ ] One comparison chart of the bands (inline SVG, no heavy images)
- [ ] Link from every band page to the matching evidence page
- [ ] YouTube embeds use a facade: a thumbnail that loads the iframe only on click, to protect PageSpeed

## Phase 4: Entity and linking
- [ ] Check that `sameAs` in the Person entity covers: LinkedIn, YouTube, Substack, Instagram, the podcast, and Pinterest
- [ ] Footer on every page: links to About and Shira Sarid
- [ ] **Needs material from Shira:** the full text of the Substack essays → paste into the existing templates in `essays/`, switch them to index, add them to the sitemap

---

## Outside Claude Code (Shira, in parallel)
- **YouTube:** in every video's description, link the specific page (an evidence or session page), not the homepage. Titles must match what's actually in the video.
- **Distribution:** in Reddit communities (r/binauralbeats, r/sleep), read the self-promotion rules before the first post. Give value first; the link comes second.
- **Measurement:** once a week, take a screenshot of Search Console → Queries (number of queries) and paste it into the chat.
