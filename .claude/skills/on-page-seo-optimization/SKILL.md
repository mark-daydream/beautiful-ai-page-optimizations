---
name: on-page-seo-optimization
description: |
  On-page SEO optimization for a single URL using primary and supporting keywords.
  Validates SERP page-type and search intent match, compares top-10 ranking pages,
  samples brand voice, and outputs a 3-tab HTML bundle (optimization draft,
  wireframe mockup, research appendix). Use when the user asks for on-page optimization,
  optimization draft, SEO appendix, wireframe mockup, or HTML SEO deliverable,
  SERP intent check, keyword page optimization, or competitor content gap analysis for one page.
allowed-tools:
  - Bash(firecrawl *)
  - Bash(npx firecrawl *)
  - mcp__firecrawl__firecrawl_scrape
  - mcp__firecrawl__firecrawl_search
  - mcp__firecrawl__firecrawl_map
disable-model-invocation: true
---

# On-Page SEO Optimization

Optimize **one URL** for a primary keyword + supporting keywords. Output a **Daydream-styled HTML bundle** (3 tabs). Requires **Firecrawl access** — CLI or MCP (see below).

## Firecrawl access (CLI **or** MCP)

The phases below show **Firecrawl CLI** commands. They are the default on a local machine where the CLI is installed and authenticated (`firecrawl --status`). If the CLI is unavailable — e.g. **Claude Cowork**, **Claude Code on the web**, or any sandbox where it isn't installed — use the **Firecrawl MCP server** instead; it is portable (config travels via MCP, only an API key is needed). The two are interchangeable:

| Step | CLI | MCP tool |
|------|-----|----------|
| Scrape a page | `firecrawl scrape <url> --only-main-content -o out.md` | `firecrawl_scrape` (`onlyMainContent: true`, `formats: ["markdown"]`) |
| SERP search + scrape | `firecrawl search "<kw>" --scrape --limit 10 --json -o out.json` | `firecrawl_search` (`limit: 10`, `scrapeOptions: {formats:["markdown"]}`) |
| List/site map | `firecrawl map <url> --limit 100 --json` | `firecrawl_map` |

When using MCP, write the returned data to the same `.firecrawl/` working files the phases reference, so the rest of the workflow is identical. **Portability tip:** keep this skill in the project repo at `.claude/skills/on-page-seo-optimization/` so it travels with GitHub and works in cloud/desktop environments, not just the local machine.

**Design:** [daydream-design-system.md](daydream-design-system.md) · [Netlify brand book](https://melodic-daifuku-b26a1a.netlify.app/)  
**Bundle template:** [templates/optimization-bundle.html](templates/optimization-bundle.html)

## Intake

**Required** (max 3 questions if missing):

1. Target URL (or pasted HTML + domain)
2. Primary keyword
3. Supporting keywords (comma-separated)

**Optional:** page type, locale, volunteered protected terms.

**Do not ask** for brand voice URLs, competitors, or SERP data.

After **branded terminology checkpoint**:

> Optimizing `{url}` for **{primary}** (+{n} supporting). Page type: **{type}**. Locked terms: **{list}**.

## Workflow checklist

```
- [ ] Phase 1: Scrape target → section manifest + eligibility
- [ ] Phase 1b: Brand voice → brand-voice-profile.md
- [ ] Checkpoint: User confirms branded-lexicon.md
- [ ] Phase 2–4: SERP → classify → page-type gate
- [ ] Phase 5: Competitors (if pass)
- [ ] Phase 6: onpage-strategy-{slug}.md
- [ ] Phase 6b: content-quality-review.md PASS
- [ ] Phase 6c (GATING): AI detection audit + auto-apply loop on Tab 1 After copy → risk must be Low before Phase 7
- [ ] Phase 6d (GATING): Claims grounding gate — every factual claim in After copy judged against the client's own docs; no BLOCKED claims before Phase 7
- [ ] Phase 7–9: HTML bundle + copy CSS alongside
- [ ] Phase 10 (GATING): Definition of Done — render-verify all 3 tabs before declaring complete
```

## Phase 1 — Target page

```bash
mkdir -p .firecrawl
# Capture the FULL rendered page. Do NOT use --only-main-content / onlyMainContent:true —
# it silently drops the hero/H1, announcement banners, and other template chrome on
# Webflow/SPA sites, which is the #1 cause of a FABRICATED hero. Capture everything, then
# classify per section below (chrome gets tagged `excluded`, not dropped-then-imagined).
firecrawl scrape "<url>" -o .firecrawl/onpage-target.md
```

**Verify the real elements (REQUIRED).** If the hero H1, a CTA label, the hero media type, or any FAQ answer is missing or ambiguous after scraping (JS-rendered, lazy-loaded video, collapsed accordion), **open the page in Chrome (claude-in-chrome) and read the live DOM** — the rendered H1 text, the exact CTA label(s), whether the hero media is an image or an embedded video, and the accordion answers (they are in the DOM even when visually collapsed). **Never reconstruct a hero or any section from the `<title>`/meta or from assumption — if you cannot capture it, flag it; do not invent.** See [Accuracy & scope](#accuracy--scope-required) below.

Tag each section **`optimization_eligibility`:**

| Tag | Rule |
|-----|------|
| `generic` | Rewrite for keywords (intros, H2s, SEO FAQs) |
| `branded` | Feature cards, workflows, testimonials — preserve terms |
| `locked` | Confirmed lexicon — no copy changes |
| `excluded` | **Site chrome — NOT on-page content.** Promo/announcement banners, cookie/consent bars, global nav, footer, login bars. Do **not** render these as optimization blocks or mockup sections in either tab. |

See [extraction-checklist.md](extraction-checklist.md).

## Accuracy & scope (REQUIRED)

The Before column, every `unch-block`, and **every mockup section** must reproduce the **real live page** — never an approximation. Build failures the team has hit, now banned:

- **Real H1, not the title tag.** The `<h1>` shown in the draft Before and the mockup is the page's actual rendered H1 — verify it in Chrome. The `<title>` (e.g. "X Software | Brand") is metadata, not the H1.
- **Preserve existing interactive elements exactly.** CTA/button labels are reproduced verbatim (don't rename "Request a demo" → "Book a demo"; don't invent a "Compare plans" button). Media is shown with its real type — `[Embedded video — …]` vs `[Hero image — …]`. Links point where the real ones do.
- **FAQ "Before" shows questions AND answers**, verbatim from the live accordion.
- **Mockup layout fidelity.** The mockup must mirror the page's real layout — column structure, element order, and alignment. Do **not** default every hero to a two-column "text left / media right" block. If the real hero is a centered single column with the video below, render it that way. Verify the structure in Chrome when unsure.
- **`excluded` chrome never appears** as an on-page block (see the tag above).

## Draft structure contract (REQUIRED — identical on every page)

So a multi-page set is uniform, every draft uses this exact opening and conventions:

1. **Summary `meta-table`** with rows: Page URL · Primary Keyword · Supporting Keywords · **Proposed Title Tag** (char count) · **Proposed Meta Description** (char count) · Summary. The **title tag and meta description live ONLY here** — they are `<head>` metadata, not on-page content, so they are **not** also rendered as Before/After change-blocks.
2. **H1 block** — the page H1 rendered as an `<h3>` Before/After (Optimized) or a single `<h3>` in an `.unch-block` (Unchanged if the H1 is not changing). Always `<h3>`, so the H1 reads as a bold heading on every page.
3. **Content sections** in live order (each its own change-block, full copy).
4. **FAQ** block, then the canonical **Structured Data** `.schema-wrap` as the last block.

## Phase 1b — Brand voice

Sample 3–4 same-domain pages (homepage, about, product, optional blog):

```bash
firecrawl map "https://example.com" --limit 100 --json -o .firecrawl/site-map.json
firecrawl scrape "<home>" "<about>" "<product>" --only-main-content
```

Write `.firecrawl/brand-voice-profile.md` per [brand-voice-rubric.md](brand-voice-rubric.md).

## Branded terminology checkpoint

**Before SERP work**, present inferred terms + `branded`/`locked` sections. Ask user to **proceed with keep-as-is** (add/remove terms). Save `.firecrawl/branded-lexicon.md`.

## Phase 2 — SERP

```bash
firecrawl search "<primary keyword>" --scrape --limit 10 \
  -o .firecrawl/onpage-serp-primary.json --json
```

Do not re-scrape URLs already in JSON.

## Phase 3–4 — Classify & gate

Use [serp-page-types.md](serp-page-types.md). **Pass:** ≥5/10 same page type, or ≥3/10 with user niche confirmation.

**Fail:** No Tab 1/2 copy. Bundle: Tab 1–2 placeholders; Tab 3 = ~3-slide SERP-fail deck. Save `.firecrawl/serp-mismatch-report.md`.

## Phase 5 — Comparative analysis (pass only)

Matched SERP URLs only. Pattern table, success patterns, gaps, **unique strengths to preserve**.

## Phase 6 — Strategy brief

`.firecrawl/onpage-strategy-{slug}.md`: SERP summary, patterns, gaps, strengths, cannibalization flags, keyword priorities, eligibility map, brand voice link.

## Phase 6b — Content quality gate

[content-quality-gate.md](content-quality-gate.md): no em dashes, no AI slop, brand voice match, locked terms verbatim. Log `.firecrawl/content-quality-review.md`. **Do not ship on FAIL.**

## Phase 6c — AI detection audit + auto-apply loop (GATING)

Runs **before** Phase 7. The bundle is **not** assembled until the optimized copy clears the AI-risk gate. The skill is bundled in this repo at `.claude/skills/ai-content-detection/`, so it travels (local, Cowork, web).

**Gate threshold:** overall risk must be **Low**. Medium or High **blocks** bundle assembly.

**Scope of revision (guardrails — do not violate):**
- Only revise `generic` (keyword-eligible) copy.
- **Never** rewrite `locked` terms, `branded` sections, CTA blocks, or anything that would drift from `brand-voice-profile.md`. If a flag lands inside a branded/locked span, report it but leave the copy as-is.

**Loop:**
1. Extract Tab 1 **After** copy (changed sections; full page if the user requests).
2. Run the `ai-content-detection` workflow (`scripts/analyze_text.py` + qualitative pass). Save `.firecrawl/ai-detection-audit.md`.
3. If overall risk is **Low** → proceed to Phase 7.
4. If **Medium/High** → **apply** the report's revisions to the flagged generic spans (within the guardrails above), then re-run step 2. Repeat (cap at 3 passes).
5. If still not Low after 3 passes → stop, surface the residual flags, and ask the user how to proceed (do not silently ship).
6. Before building, present a **before/after diff** of every applied change at the branded-terminology-style checkpoint for approval.

Log each pass's score to `.firecrawl/ai-detection-audit.md` (append, don't overwrite) so the loop is auditable.

## Phase 6d — Claims grounding gate (GATING)

[claims-grounding-gate.md](claims-grounding-gate.md) — ported from `chbg/docs-grounding-agent`. Runs **after** 6c (6c mutates copy; facts are checked last). Extract every atomic factual claim from Tab 1 **After** copy, build a corpus from the client's **own docs** (`.firecrawl/grounding-corpus/`), and judge each claim `supported` / `contradicted` / `undocumented` with a **character-for-character quote** verified by `grep -F` against the corpus. Blocking policy per claim type is in the gate file (product blocks on contradicted + undocumented; competitor-subject claims are unjudgeable noise, never "fixed"). Log `.firecrawl/claims-grounding-review.md`. Fixes rewrite to what the docs say (or drop the claim); re-run the 6c script on any span changed here; present grounding fixes with the 6c diff at the pre-build checkpoint. **Do not ship on BLOCKED.**

## Phase 7–9 — HTML bundle

**Output:** `.firecrawl/{brand}-{slug}-optimization.html`

**Copy with HTML:** `templates/daydream-tokens.css`, `bundle-shell.css`, `tab-draft-styles.css`, `tab-mockup-styles.css`

1. Copy [templates/optimization-bundle.html](templates/optimization-bundle.html)
2. Replace `{CLIENT}`, `{PAGE_PATH}`, `{PRIMARY_KEYWORD}`, `{DATE}`
3. Inject Tab 1 between `<!-- TAB1_START -->` / `<!-- TAB1_END -->` — pattern in [tab-draft-partial.html](templates/tab-draft-partial.html)
4. Inject Tab 2 wireframe — [tab-mockup-partial.html](templates/tab-mockup-partial.html) (Inter B&W only)
5. Inject Tab 3 slides — [templates/appendix-slides.md](templates/appendix-slides.md)
6. Include [templates/review-ui.js](templates/review-ui.js) for the approve/reject review system, schema copy, and the guided tour. Set `window.REVIEW_CONFIG.pageId` to the page's clean-URL slug (the `optimization-bundle.html` scaffold already has the `REVIEW_CONFIG` block + `<script src="review-ui.js">` — just fill in the slug). The Firebase config in the scaffold is **shared across all drafts** (Firestore docs are namespaced by `pageId`); leave it as-is, or set `firebase: null` to fall back to per-browser `localStorage` for offline testing.

**Interactive UI (handled by `review-ui.js`, no extra markup needed):**
- **Approve / Reject:** review-ui auto-discovers every `#tab1 .change-block[id]` and the `.schema-wrap` block and appends an **Approve / Reject** bar to each — sections need no extra markup. Approve turns the section green; Reject opens a required-reason box and turns it red; a per-section **Clear** link resets the decision. Decisions persist live to Firestore (cross-device) when `firebase` is set, else to `localStorage`. A floating **Rejected** button (bottom-right) lists every rejected section + reason; clicking one jumps to it. The legacy `comment-btn` `+` buttons in the partials are auto-hidden (`.comment-btn{display:none}`), so they can stay in the markup harmlessly.
- **Walkthrough:** auto-shown once on first load (remembered in `localStorage`), re-openable via the "Take a tour" button. 8 steps introduce the draft elements (legend, Before/After cards), the Approve/Reject controls, the required reject reason, the per-section Clear, the **Mockup** tab (preview), and the **Appendix** tab (rationale); each step switches the underlying tab. Only appears when Tab 1 has real `.change-block` content (suppressed on SERP-fail bundles).

**Sync:** Mockup = Tab 1 **After** copy. Appendix = SERP/strategy evidence. Draft drives mockup.

**Full-body completeness (REQUIRED, both Tab 1 & Tab 2):** Render **every section of the live page**, in live order, with its **full body copy** — not just headings, and not summarized. This includes `unchanged`, `branded`, and `locked` sections. Never collapse real page text into a placeholder/summary such as `[5 tips — unchanged]` or `[4 benefit subsections — unchanged]`. A reviewer must be able to read the entire page, section by section, in both tabs. Placeholders are allowed **only** for non-text assets (images, video, logos).

**Copy-fidelity + Why note (REQUIRED, both tabs):** A section is exactly: **Before** (left = current copy verbatim) · **After** (right = the real publishable copy, exactly as it would appear on the page) · **Why** (one note underneath) · then the review controls. The Before/After columns, `.unch-block`, `.new-block`, and **every mockup section** contain **only literal page copy** — never meta-commentary about the change ("all 50 preserved", "now grouped into 7 themes", "refreshed to 2026", "em dashes cleaned", "sample of the original", "renders in full in the mockup", or `.callout` notes). For a restructured list, show the **full real Before list and full real After list**, not a description of the restructure. ALL explanation lives **only** in the Why line, which must open with a bold prefix: `<strong>Why:</strong> …` (`<p style="font-size:12px;color:var(--text-subtle);margin-top:10px;">`). The only meta labels permitted inside the mockup are `.section-tag` chips and `.opt-pill` badges.

### Tab 1 — Optimization Draft (Daydream)

Legend · meta table · callouts · change-blocks · keyword tables · **Structured Data section (canonical)** · approve/reject bars + Rejected FAB (auto-built by `review-ui.js`).

**Structured Data section (REQUIRED, standardized across all pages):** Model = the `what-is-presentation-software` bundle. Render it as its own `.section-label` "Structured Data" + `.schema-wrap` card, as the **last block in Tab 1** (after the final body/CTA block, before `<!-- TAB1_END -->`). The `<pre>` **must** carry `id="schema-json-store"` so the Copy button (`copySchema()` in `review-ui.js`) works. Show the FAQPage JSON-LD mirroring the visible FAQ verbatim; add Article/BlogPosting, HowTo, SoftwareApplication, or BreadcrumbList in the same card when the page warrants. Do **not** put the schema JSON inside a `change-block`/`new-block` — use the canonical `.schema-wrap`. Exact markup in [templates/tab-draft-partial.html](templates/tab-draft-partial.html).

**Pills:** `pill-opt` Optimized · `pill-new` New · `pill-unch` Unchanged · `pill-rev` Revised FAQ

**State color match (REQUIRED):** the pill, the box fill, and the box's label/headings must all share one color per state. Use the matching box class — never wrap unchanged/new copy in `.ba-after` (that is the purple Optimized style):

| State | Pill | Box class | Color |
|-------|------|-----------|-------|
| Unchanged | `pill-unch` | `.unch-block` | blue |
| Optimized | `pill-opt` | `.ba-grid` (`.ba-before` grey / `.ba-after` purple) | purple |
| New | `pill-new` | `.new-block` | green |
| Revised FAQ | `pill-rev` | `.ba-grid` | amber |

**Rules:** Light-touch; keywords in `generic` sections only; never rename locked terms; target keyword count without editing locked blocks; `<strong>` on keywords in After column.

**Every section = its own change-block, with full copy:**
- **Changed** (`pill-opt`/`pill-new`/`pill-rev`) → `.ba-grid` Before/After showing the **complete** body copy of that section (not just the heading line).
- **Unchanged** (`pill-unch`) → a single full-width `.ba-after` block (label "Unchanged") containing the section's **full body copy verbatim**. Do not abbreviate to a one-line note.
- Subsections (H3/H4) render as their own blocks or nested within the parent block, each with full text, so nothing is hidden.

### Tab 2 — Mockup (wireframe)

Inter, `#111` on white, `.section-tag`, live section order. No Daydream colors.

**Full body text required:** Every section renders its **complete body copy as real text** (headings, paragraphs, bullet lists, FAQ Q&As), in live order, including unchanged/branded sections. Dashed `.placeholder` boxes are reserved for **non-text assets only** (hero image, video, logo strip). Never replace section prose with a `[… unchanged]` summary box.

**Layout fidelity (REQUIRED):** the wireframe mirrors the page's **real layout** — verify it against the live DOM in Chrome, don't assume. Method: for each section read the rendered positions and replicate them.
- **Hero:** centered single-column vs two-column; where the media sits. `getComputedStyle(h1).textAlign` and the H1/CTA/media rects tell you. Don't reflexively use the `.two-col` hero — if the live hero is centered with the media below, build it that way (and center the `.subhead`: it has `max-width` with no auto-margin, so add `margin-left/right:auto` or it sits left of the H1/CTA).
- **Two-column body sections:** match each section's **real** image-vs-text side. Pages alternate, so don't just flip every section — compare `image.left < heading.left` per section against the live page (`img.left < h.left` → image-left). Getting the alternation phase wrong puts every section on the wrong side.
- **Blog / article templates — match the target site, never assume a default.** Blog layouts vary widely: single-column; left sidebar; right sidebar; and the sidebar may hold a table of contents, share buttons, author card, related posts, a newsletter box, or some combination. Read the live page and build what is actually there. Method: compare the body `h2` left/right position against the H1 and the footer CTAs — if the body is inset on one side, there is a sidebar on the other (e.g. H1 at x≈560 but body H2s at x≈1173 ⇒ **left** rail; the reverse ⇒ right rail). Then inspect what that rail contains and reproduce it. If the body spans the full width, it is **single-column — do not add a sidebar.**
  - The `.blog-cols` / `.blog-toc` classes in `tab-mockup-styles.css` are a **Pave-shaped example** (left 230px rail, TOC + share). They are a starting point, not a default: change `grid-template-columns` for the real side/width (`230px 1fr` left vs `1fr 230px` right, body-first), and replace the sidebar markup with whatever the real rail holds. For a single-column blog, do not use `.blog-cols` at all.
- Real CTA labels and real media type only (see [Accuracy & scope](#accuracy--scope-required)).

### Tab 3 — Appendix (Daydream deck)

7 slides (pass) or 3 (fail). Classes: `.slide`, `.slide.cover`, `.slide.close-slide`, `.card`, `.data-table`, `.dots`.

## SERP fail UI

- Tab 1: placeholder “Optimization stopped — SERP page-type mismatch”
- Tab 2: show `#mockup-placeholder`, hide `#mockup-content`
- Tab 3 only: short deck
- `switchTab('tab3')` on load; mark Tab 1–2 links `inactive` if needed

## SERP fail deck (3 slides)

1. Cover — SERP Validation Stopped  
2. SERP breakdown table (page types)  
3. Next steps  

## Gate pass appendix (7 slides)

See [templates/appendix-slides.md](templates/appendix-slides.md).

## Phase 10 — Definition of Done (GATING — do not skip)

A bundle is **not** finished until it passes these checks. **Do not trust counts or your own self-report — open and look.** (Bundles have shipped with two of three tabs missing while reported "complete," and with imagined heroes.)

**Structural (per file):**
- Exactly **3** `class="tab-panel"` divs with ids `tab1`, `tab2`, `tab3`; one `id="mockup-content"`; the correct slide count in Tab 3 (7 pass / 3 fail) wired to `#deck3`/`#dots3`; `switchTab` defined.
- `<div>`/`</div>` and `<section>`/`</section>` counts are **balanced**.
- No `excluded` chrome (promo banner, cookie bar, nav) rendered as a block in either tab.
- The H1 is present as an `<h3>` block; title/meta appear **only** in the summary table.

**Render-verify (REQUIRED):** open the bundle in Chrome (or `firecrawl_scrape` the deployed URL) and **switch into each tab** — confirm Tab 2 shows populated mockup sections and Tab 3 shows the slides. A grep that finds `id="tab2"` is **not** proof the panel renders.

**Accuracy spot-check:** the draft Before H1 matches the live H1 (not the title); hero CTA + media match the live page; FAQ Before has answers; the mockup layout matches the real page.

For a **multi-page run**, run this gate on **every** page and report a per-page pass/fail table.

## Related skills

- `ai-content-detection` — Phase 6c GATING AI detector audit + auto-apply loop (bundled at `.claude/skills/ai-content-detection/`; must clear Low risk before bundle build)
- `chbg/docs-grounding-agent` (GitHub, private) — source of the Phase 6d claims-grounding methodology; the runnable Mastra gate there (`npm run gate`) is the strict batch version if a full-page 500-claim audit is ever needed
- `firecrawl-seo-audit` — whole-site audits  
- `firecrawl-competitive-intel` — ongoing monitoring  

## Examples

[examples.md](examples.md)
