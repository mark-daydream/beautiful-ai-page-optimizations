---
name: net-new-content
version: 1.1.0
description: |
  Net-new SEO content for a customer: draft a page that does not exist yet, targeting a
  primary keyword + supporting keywords. Runs the same SERP/intent/competitive pipeline as
  on-page-seo-optimization, but replaces the target-page scrape with (a) a template-discovery
  layer that extracts the structural contract of the customer template the new page will live
  in, and (b) a claims-register accuracy layer that grounds every customer fact in
  customer-owned sources — never competitor content. If only a single keyword is provided
  (no supporting keywords), builds the keyword theme first via the growth:keyword-research
  skill before drafting. Use when the user asks for a new page, net-new content, a new
  article/glossary/landing page draft, content the customer doesn't have yet, or "write a
  page targeting {keyword}".
allowed-tools:
  - Bash(firecrawl *)
  - Bash(npx firecrawl *)
  - mcp__firecrawl__firecrawl_scrape
  - mcp__firecrawl__firecrawl_search
  - mcp__firecrawl__firecrawl_map
disable-model-invocation: true
---

# Net-New Content

Draft **one new page** (does not exist yet) for a primary keyword + supporting keywords, fitted to a **real template on the customer's site**, with **every customer fact grounded in customer-owned sources**. Output the same **Daydream-styled 3-tab HTML bundle** as the on-page skill.

**Sibling skill:** `on-page-seo-optimization` (`../on-page-seo-optimization/`). This skill **shares its reference files and bundle templates** — read them from that directory; do not duplicate them here:

| Shared asset | Path |
|---|---|
| Design system | `../on-page-seo-optimization/daydream-design-system.md` |
| Brand voice rubric | `../on-page-seo-optimization/brand-voice-rubric.md` |
| Content quality gate | `../on-page-seo-optimization/content-quality-gate.md` |
| SERP page types | `../on-page-seo-optimization/serp-page-types.md` |
| Bundle scaffold + CSS + review-ui.js | `../on-page-seo-optimization/templates/` |
| Appendix slide spec | `../on-page-seo-optimization/templates/appendix-slides.md` |

**Firecrawl access:** CLI or MCP, interchangeable — see the table in `../on-page-seo-optimization/SKILL.md` ("Firecrawl access"). Write working files to `.firecrawl/` exactly as that skill does.

**New reference files (this skill):**
- [template-discovery.md](template-discovery.md) — how to extract the structural contract from sibling pages
- [claims-register.md](claims-register.md) — the accuracy layer: claim types, register format, gate rules

## The two inversions vs on-page (keep these in mind throughout)

1. **No target page.** There is nothing to scrape at the target URL. The "Before" is the customer's **template** (sibling pages), and the layout-fidelity rules apply to *those* pages instead.
2. **Accuracy risk flips.** On-page protects existing copy from being mangled; net-new must not **invent customer facts by osmosis from competitor pages**. SERP/competitor content informs **topic coverage and structure only** — never what the customer's product does, costs, integrates with, or has achieved. That is the claims register's job.

## Intake

**Required** (max 3 questions if missing):

1. Customer domain
2. Primary keyword (or a single seed keyword — see Phase 0k)

**Conditional:**

3. Supporting keywords (comma-separated). If the user provides them, use them as-is. If the user has only one keyword (a page with a single keyword mapped, a bare "write a page targeting {keyword}" ask), **do not ask them to invent supporting keywords** — go to Phase 0k, which offers to build the theme (recommended) or proceed single-keyword. Only ask for supporting keywords directly when it's ambiguous whether they have a theme already, or when Phase 0k's preflight finds the theme engine unavailable (then asking IS the fallback).

**Optional:** intended template/section (e.g. "blog", "glossary"), proposed URL slug, locale, volunteered protected terms, links to customer material pages (docs, pricing, feature pages) worth grounding on.

**Do not ask** for brand voice URLs, competitors, or SERP data.

**Fact sources are customer-owned web only** — pages on the customer's domain(s): site, docs, help center, changelog, pricing. Scraped fresh at draft time. Gaps become `[NEEDS CUSTOMER INPUT]` flags, never guesses.

## Workflow checklist

```
- [ ] Phase 0k (conditional): Single-keyword intake → ask theme-vs-proceed (recommend theme) → growth:keyword-research, supporting kws ≥30% SERP overlap; if that skill isn't installed, ask for supporting keywords instead (never improvise a theme)
- [ ] Phase 0 (GATING): Cannibalization/routing gate — no existing page already owns this keyword
- [ ] Phase 1: SERP pull for primary keyword
- [ ] Phase 2 (GATING): SERP consensus → required page type (inverted gate)
- [ ] Phase 3: Template discovery → template-contract-{family}.md
- [ ] Phase 3b: Brand voice → brand-voice-profile.md
- [ ] Checkpoint: User confirms branded-lexicon.md + template choice
- [ ] Phase 4: Competitive coverage analysis (matched SERP URLs)
- [ ] Phase 5: Customer fact base → fact-base-{slug}.md
- [ ] Phase 6: Strategy brief + full draft (template contract + claims cited)
- [ ] Phase 6a (GATING): Claims verification gate — zero unverified customer claims
- [ ] Phase 6b (GATING): Content quality gate PASS
- [ ] Phase 6c (GATING): AI detection audit + auto-apply loop → risk Low
- [ ] Phase 7–9: HTML bundle + copy CSS alongside
- [ ] Phase 9b (GATING): Bundle-wide editorial re-scan — appendix, Why lines, meta Summary, Tab 2 labels each scanned separately → risk Low on EVERY surface
- [ ] Phase 10 (GATING): Definition of Done — render-verify all 3 tabs + claims spot-check
```

## Phase 0k — Keyword theme (conditional)

Runs **only** when supporting keywords weren't provided (single-keyword intake). Skip entirely when the user supplied a theme.

**Ask before building (REQUIRED):** don't auto-run the theme build. When intake lands with one keyword (and the preflight below passes), ask the user first — AskUserQuestion with two options:

1. **Build a keyword theme (Recommended)** — up to 9 supporting keywords, each validated at ≥30% SERP overlap with the primary; ~$2 DataForSEO ceiling (observed ~$0.60).
2. **Proceed with just this keyword** — the draft targets the primary only; the Supporting Keywords meta-table row reads "None — single-keyword run (user choice)".

Recommend option 1: a theme widens the page's query surface and the overlap gate keeps every addition on the primary's actual SERP. If they pick option 2, skip the rest of this phase.

**Availability preflight (REQUIRED first):** the theme engine is the `keyword-research` skill's `theme.py` script, which resolves from either of two places — check in this order:

1. **Vendored sibling (ships with this repo):** `../keyword-research/scripts/theme.py` relative to this skill's directory. This is the copy repo consumers get.
2. **The `growth:keyword-research` plugin skill** (`daydream-growth-skills` marketplace), if installed.

They are the same script with the same constants (the sibling is a byte-identical vendored copy; provenance note in its SKILL.md). Use whichever exists; read its accompanying SKILL.md and follow it verbatim. **If neither is available: do NOT build a theme.** Never approximate the theme logic in prose, from memory, or with ad-hoc SERP pulls — a hand-derived theme silently violates the determinism guarantees the script exists to enforce. Fall back to the original intake behavior: tell the user theme development is unavailable, ask them for supporting keywords (comma-separated), or proceed primary-only if they say so.

**Shared logic, not duplicated in prose:** `theme.py` is the single scoring source (DataForSEO volume/CPC/median dofollow RDs, SERP-overlap validation). Never re-derive its logic conversationally. The script needs `DATAFORSEO_LOGIN`/`DATAFORSEO_PASSWORD` (env or repo-root `.env.local`); its own stop conditions cover missing creds.

Run in single-theme seed mode with the intake keyword as the seed:

```bash
export SSL_CERT_FILE=$(python3 -c "import certifi; print(certifi.where())")
python3 <resolved keyword-research dir>/scripts/theme.py --seed "<intake keyword>"
```

**30% SERP-overlap floor (hard requirement, Mark's methodology):** every supporting keyword must share ≥30% of the primary's SERP domains. The script enforces this by default (`OVERLAP_THRESHOLD = 0.30`; below-threshold candidates are rejected, and a theme with zero qualifying candidates errors out rather than shipping weak keywords). Two rules on top:

- **Never pass `--overlap-threshold` below 0.30.** The flag exists in the script; this skill does not use it to loosen the gate.
- **Verify on receipt:** before presenting the theme, check every supporting keyword's `serp_overlap` in the output JSON is ≥ 0.30. Overlap counts **domains**, not URLs (two URLs on the same domain = one domain).

All of that skill's stop conditions apply unchanged, in particular:

- **Cost:** state ~$2 (ceiling; observed ~$0.60) before running.
- **`seed_not_primary` checkpoint:** if the sort picks a different primary than the intake keyword, STOP and ask — keep the sort-determined primary or `--force-primary "<seed>"`. Never decide silently. Whatever the user picks is the **primary keyword for every downstream phase** (Phase 0 cannibalization, Phase 1 SERP, meta-table).
- **Script error JSON** (`no_serp_results`, `theme_too_small`, …): relay it and stop — do not improvise a theme.
- Missing DataForSEO creds: stop.

Save the theme JSON to `.firecrawl/keyword-theme-{slug}.json` and record the run date (DataForSEO monthly refresh makes themes snapshot-specific). Present the theme (primary + supporting with overlap scores + cost) as a checkpoint before Phase 0; the confirmed supporting keywords flow into the intake exactly as if the user had provided them.

## Phase 0 — Cannibalization / routing gate (GATING)

Before writing anything net-new, confirm the customer doesn't already have a page for this keyword:

```bash
mkdir -p .firecrawl
firecrawl map "https://{customer-domain}" --limit 500 --json -o .firecrawl/site-map.json
firecrawl search "site:{customer-domain} {primary keyword}" --limit 10 --json -o .firecrawl/onpage-cannibal-check.json
```

Also check whether any customer URL appears in the Phase 1 SERP. If an existing page already targets or ranks for the keyword:

> **Stop and route.** Report the URL and recommend the `on-page-seo-optimization` skill instead. Only continue net-new on explicit user override (e.g. deliberate hub-vs-spoke split), and log the override in the strategy brief.

## Phase 1 — SERP

```bash
firecrawl search "<primary keyword>" --scrape --limit 10 \
  -o .firecrawl/onpage-serp-primary.json --json
```

Do not re-scrape URLs already in JSON.

## Phase 2 — Classify & gate (INVERTED vs on-page)

Classify each result per `../on-page-seo-optimization/serp-page-types.md`. There is no target page to match against, so the gate inverts: **the SERP consensus determines what page type to build.**

- **Pass:** ≥5/10 share one page type (or ≥3/10 with user niche confirmation) → that type is the **required page type**, and Phase 3 must find a customer template of that type.
- **Fail:** no consensus (fragmented SERP) → no draft. Save `.firecrawl/serp-mismatch-report.md`; bundle is the SERP-fail UI (Tab 1–2 placeholders, 3-slide Tab 3 deck) exactly per the on-page skill.
- **Conflict:** consensus type exists but contradicts the user's stated intent (they asked for a landing page, SERP is all `blog`) → checkpoint with the user before proceeding; the SERP wins unless they override knowingly.

## Phase 3 — Template discovery

Find the customer's template family matching the required page type and extract its **structural contract**. Full method: [template-discovery.md](template-discovery.md).

Summary: identify the family from `site-map.json` URL patterns → pick 2–3 representative sibling pages → scrape **full page** (never `--only-main-content`) → **verify layout in Chrome (claude-in-chrome) against the live DOM** — same discipline as the on-page skill's Accuracy & scope section → write `.firecrawl/template-contract-{family}.md`.

**If the customer has no template of the required type** (SERP says `glossary`, site has no glossary): stop and checkpoint. Options to present: nearest existing template (with what the SERP-typical page has that it lacks), or flag as a template-creation project outside this skill's scope. Never invent a page structure the site doesn't have.

## Phase 3b — Brand voice

Identical to on-page Phase 1b: sample 3–4 same-domain pages (homepage, about, product, optional blog), write `.firecrawl/brand-voice-profile.md` per the shared `brand-voice-rubric.md`. The template siblings scraped in Phase 3 count toward the sample.

## Branded terminology + template checkpoint

Before competitive work, present in one checkpoint:

1. Inferred branded/locked terms → user confirms → save `.firecrawl/branded-lexicon.md`.
2. The chosen **template family + sibling URLs** and a one-paragraph summary of the structural contract → user confirms this is the right home for the page.
3. Proposed URL slug.

> Drafting a new **{page type}** at `{proposed-slug}` for **{primary}** (+{n} supporting), using the **{family}** template (like {sibling-url}). Locked terms: **{list}**.

## Phase 4 — Competitive coverage analysis

Matched SERP URLs only. Same pattern-table discipline as on-page Phase 5, but the output is a **coverage outline** for a page that doesn't exist yet: topics/subtopics covered, common H2/H3 patterns, questions answered, content depth (word count range), media patterns, schema types used.

**Boundary (REQUIRED):** competitor pages contribute **structure and topic coverage only**. Any fact *about the customer* found or implied by competitor content is inadmissible — it goes into the draft only if independently grounded in Phase 5. Industry stats/claims from competitor pages are also inadmissible; a number ships only with a citable primary source (see claims-register.md).

## Phase 5 — Customer fact base

Ground truth for every customer claim the draft will make. From `site-map.json`, scrape the customer-owned pages relevant to the topic — product/feature pages, docs, help center, pricing, changelog, case studies:

```bash
firecrawl scrape "<feature-url>" "<docs-url>" "<pricing-url>" --only-main-content
```

Write `.firecrawl/fact-base-{slug}.md`: each entry = fact + verbatim supporting quote + source URL. This is the **only** admissible source pool for customer claims. Where the coverage outline (Phase 4) demands a customer fact the fact base can't support, log it now as a `NEEDS CUSTOMER INPUT` item — do not defer the discovery to writing time.

## Phase 6 — Strategy brief + draft

`.firecrawl/onpage-strategy-{slug}.md`: SERP summary, required page type, template contract link, coverage outline, keyword priorities, fact-base link, cannibalization result (incl. any override), brand voice link.

Then write the full draft, obeying all three contracts simultaneously:

- **Template contract:** every section the template family requires, in template order, matching its conventions (heading depth, CTA placement, word-count range, FAQ presence, schema types).
- **Claims register:** every non-exempt claim in the copy gets an **atomic** register row (ID, claim, type/subject, source URL, character-exact quote) per [claims-register.md](claims-register.md) — customer claims against the fact base, competitor claims against that competitor's own pages, numbers against a primary source. Unsupportable claims render as `[NEEDS CUSTOMER INPUT: …]` blocks, not prose.
- **Brand voice + lexicon:** locked terms verbatim; voice per profile.

Save the register to `.firecrawl/claims-register-{slug}.md` as you write, not after.

## Phase 6a — Claims verification gate (GATING)

Independent re-verification pass per [claims-register.md](claims-register.md) (methodology ported from `chbg/docs-grounding-agent`): every row is judged **supported / contradicted / undocumented** against its admissible source, with a character-exact quote verified by `grep -F` against the scraped fact base — a failed quote check invalidates the verdict. Re-grep with the claim's distinctive tokens before finalizing any `undocumented` (retrieval misses are the top false gap). Then apply the blocking policy table in the register file:

- **Zero** blocking claims ship as plain prose — `product` blocks on contradicted + undocumented; `positioning` on contradicted only; competitor claims block vs **that competitor's own pages**; unresolved ones become `[NEEDS CUSTOMER INPUT]` blocks, get reworded to the docs, or are cut.
- **Zero** `contradicted` rows unresolved — including overstatement drift ("via Zapier" → "native") and claims the customer's own site conflicts with.
- **Zero** numbers/stats without a supported row on a primary source.
- Any claim traceable only to competitor/SERP content → automatic FAIL until removed or re-grounded in the admissible source for its subject.

Log the pass to the register file (append). **Do not proceed on FAIL.**

## Phase 6b — Content quality gate

Shared gate, verbatim: `../on-page-seo-optimization/content-quality-gate.md`. Log `.firecrawl/content-quality-review.md`. **Do not ship on FAIL.**

## Phase 6c — AI detection audit + auto-apply loop (GATING)

Identical to on-page Phase 6c (run the `ai-content-detection` skill; overall risk must be **Low**; auto-apply loop capped at 3 passes; append to `.firecrawl/ai-detection-audit.md`), with one scope change: the audited copy is the **entire draft** (it is all new). Guardrails: never rewrite locked terms or template-verbatim blocks; revisions must not break a claims-register citation — if a revision changes a claim's wording, re-verify that row.

This pass clears the **page body only**. The rest of the bundle does not exist yet — it is written in Phase 7–9 and gated separately in **Phase 9b**, which is not optional.

## Phase 7–9 — HTML bundle

**Output:** `.firecrawl/{brand}-{slug}-new-page.html`

Copy the scaffold + CSS + `review-ui.js` from `../on-page-seo-optimization/templates/` exactly as the on-page skill does (same placeholder replacement, same `REVIEW_CONFIG.pageId` = proposed slug, same shared Firebase config). Differences:

### Tab 1 — Content Draft (Daydream)

No Before/After — the page doesn't exist. Structure contract:

1. **Summary `meta-table`** rows: Proposed URL · Primary Keyword · Supporting Keywords · **Template** (family + linked sibling example) · Proposed Title Tag · Proposed Meta Description · Summary. Title/meta live **only** here. **Values only — no context annotations** (no grey small-print asides, char counts, or rationale spans in table cells; Mark, 2026-08-02): rationale belongs in each block's Why line, and routing/keyword-scope context belongs in the strategy brief + appendix. If Phase 0k built the theme, the Supporting Keywords row notes "theme via keyword-research, {run date}".
2. **H1 block** — `<h3>` inside a `.new-block`.
3. **Content sections** in template-contract order. Each section = its own block with **full publishable copy**:
   - Authored sections → `pill-new` + `.new-block` (green).
   - Template chrome reproduced verbatim from siblings (CTA banners, newsletter box, related-posts rail) → `pill-unch` + `.unch-block` (blue), labeled "Template (verbatim)". Real sibling CTA labels — never invented ones.
   - Unresolved facts → a visually distinct `[NEEDS CUSTOMER INPUT: what's needed + why]` callout **inside** the owning block.
4. Each block ends with `<strong>Why:</strong> …` (same style as on-page) **plus a Sources line**: `<strong>Sources:</strong> C1, C4` linking claim IDs (claims with no ID = industry-generic copy).
5. **FAQ** block, then the canonical **Structured Data** `.schema-wrap` last (`id="schema-json-store"` on the `<pre>`), mirroring the schema types the template family actually uses + FAQPage if the draft has an FAQ.
6. **Claims Register block** — after Structured Data: the full register as a `.data-table` (ID · Claim · Source · Status) so the reviewer can audit grounding without leaving the tab.

Copy-fidelity rule carries over: blocks contain **only literal publishable copy**; all meta-commentary lives in the Why line.

**NO INTERNAL CONTEXT ON CLIENT-FACING SURFACES (hard rule, Mark 2026-08-02).** Every pixel of the bundle is client-facing — meta-table annotations, Why/Sources lines, appendix slides, and cover credits included. Never reference internal process or conversation context the client wasn't part of:

- Crawl/work artifacts: "the fresh 469-URL site map", "this run", scrape counts as provenance.
- Instruction/commissioning shorthand: "on explicit instruction (7/31)", "commissioned 7/31", "the override, logged".
- Tooling: skill names ("net-new-content skill run"), script names, internal pipeline vocabulary.
- Internal docs by their internal names ("the Daydream opportunities doc") — cite client-shared docs by their client-known name or not at all.

State the **conclusion in client terms** instead: "no existing beautiful.ai URL at this path", "a deliberate hub-vs-spoke split, following the /flowchart-maker precedent". Internal provenance belongs in the workspace strategy brief / HANDOFF docs, never in the bundle. **Pre-ship grep gate** (run on the final HTML; any hit = fix before deploy): `grep -niE 'site map|skill run|this run|commissioned|explicit instruction|opportunities doc|[0-9]+-URL' <bundle>.html` plus a read of every subtle-text annotation asking "does this only make sense to someone who was in our conversation?"

### Tab 2 — Mockup (wireframe)

Inter, `#111` on white, `.section-tag`, **template-contract order and layout**. Layout fidelity target = the **sibling pages** (verified in Chrome during Phase 3): hero shape, sidebar side/contents, two-column alternation, real CTA labels, real media types (`[Hero image — …]` placeholders for non-text assets only). Full body text for every section — the reviewer must be able to read the whole page. The `.blog-cols`/`.blog-toc` guidance in the on-page skill's Tab 2 section applies verbatim.

### Tab 3 — Appendix (Daydream deck)

8 slides (pass) or 3 (fail). The on-page 7-slide spec (`templates/appendix-slides.md`) plus one:

- Replace the "current page" slide with a **Template evidence** slide: sibling URLs, the structural contract, why this family fits the SERP-required type.
- Add a **Grounding & accuracy** slide: fact-base source count, claims VERIFIED / NEEDS-INPUT counts, the customer-owned-sources-only rule stated for the client.

## Phase 9b — Bundle-wide editorial re-scan (GATING)

**Runs after the bundle is assembled, before Phase 10.** Phase 6c cleared the page body. It did not clear the bundle: the Tab 3 appendix, every block's `Why:` line, the meta-table **Summary** row and the Tab 2 section labels are written *here*, in Phase 7–9, and have never been scanned. They are every bit as client-facing as the page copy.

Mark, 2026-08-17: the gates run on the **whole bundle**, not just the draft copy. On draft #27 the page copy was clean and the appendix still failed — 8 em dashes, "X, not Y" frames, a phrase-list hit, editorialized headlines, and agency-frame language ("flagged to the client"). Donor appendices from the timeline / gantt drafts predate the 2026-08-13 editorial house rules and carry the same patterns, so **re-scan them too when reusing one as a donor** — never assume an inherited appendix is clean.

**Extract each surface as its own plain-text file.** One concatenated blob dilutes per-passage scoring and lets a bad appendix hide behind good page copy.

| Surface | Extract to |
|---|---|
| Tab 3 appendix — all slide text | `.firecrawl/scan/appendix.md` |
| Every `Why:` line in Tab 1 | `.firecrawl/scan/why-lines.md` |
| The meta-table **Summary** row value | `.firecrawl/scan/meta-summary.md` |
| Tab 2 section labels + any authored connective copy | `.firecrawl/scan/mockup-labels.md` |

**Extract to markdown, not flat text.** Scanner verdicts move with input fidelity: flattened text turns every `<h3>` slide heading into a prose line, and `analyze_colon_pivots` then counts "Template evidence: why this family fits" as a payoff colon. That inflated all five Mastra Week-6 drafts to Medium on 2026-08-17. Emit headings as `#` and list items as `-` so the structure survives.

```bash
python3 - <<'EXTRACT'
import re, pathlib, html as H
src  = pathlib.Path(".firecrawl/{brand}-{slug}-new-page.html").read_text()
out  = pathlib.Path(".firecrawl/scan"); out.mkdir(parents=True, exist_ok=True)

def md(frag):                                  # keep heading + list structure
    frag = re.sub(r'<h([1-6])[^>]*>(.*?)</h\1>',
                  lambda m: "\n" + "#" * int(m.group(1)) + " " + m.group(2) + "\n", frag, flags=re.S)
    frag = re.sub(r'<li[^>]*>(.*?)</li>', r"\n- \1", frag, flags=re.S)
    frag = re.sub(r'</(p|div|section|tr)>', "\n", frag)
    frag = H.unescape(re.sub(r"<[^>]+>", " ", frag))   # space, not "" — else tags glue words together
    frag = "\n".join(re.sub(r"[ \t]{2,}", " ", l).strip() for l in frag.splitlines())
    return re.sub(r"\n{3,}", "\n\n", frag).strip()

tab3 = re.search(r'<div[^>]*id="tab3".*?(?=<div class="tab-panel"|\Z)', src, re.S)
(out/"appendix.md").write_text(md(tab3.group(0)) if tab3 else "")
(out/"why-lines.md").write_text("\n\n".join(md(m) for m in re.findall(r'<strong>Why:</strong>(.*?)</p>', src, re.S)))
print("wrote", *(p.name for p in sorted(out.iterdir())))
EXTRACT
```

Pull the meta-table Summary row and the Tab 2 labels the same way.

This is the shared recipe from `../on-page-seo-optimization/SKILL.md` (Phase 9b) with this skill's output filename; keep the two in step.

Eyeball each file before scanning — if headings came through as bare prose lines, fix the extraction rather than accepting the inflated score.

**Gate — all four surfaces must pass, independently:**

1. Run the `ai-content-detection` skill on each file (sibling at `../ai-content-detection/`; if it isn't installed locally, use its SKILL.md remote path — `gh api` the script and `phrase-patterns.md`, then run locally). **The deterministic scanner must actually execute**: a verdict without real scanner JSON is "Audit incomplete", not a pass — v1.1.1 gates on this because a phrase-list-only check silently passed a batch the scanner flagged. **Overall risk Low on every file**, not on the average.
2. The `../on-page-seo-optimization/content-quality-gate.md` *No internal context on client-facing surfaces* grep, run over the assembled HTML.
3. House rules from the 2026-08-13 editorial pass, which the scanner does not catch on its own: **no em dashes**, no balanced negation pairs ("nothing missing, nothing extra"), no `X, not Y` framing, no anthropomorphism, no editorialized headlines, and no agency-frame language — the client is the audience, not an onlooker to our process. "Flagged to the client", "we recommend that the team", "as noted in our analysis" are all failures.

**Sanctioned exemptions — do not "fix" these:**
- Bracketed media placeholders in Tab 2 (`[Hero image — …]`) keep their em dashes; that is the asset-slot format.
- `.unch-block` "Template (verbatim)" copy is the customer's own writing. Never rewrite it; exclude it from the scan.
- `[NEEDS CUSTOMER INPUT: …]` callouts and `Sources:` claim-ID lists are structured fields, not prose.
- Locked lexicon terms stay verbatim even when flagged.

**Re-scan rule:** any edit to any scanned surface **invalidates the pass**. Fix, then re-run the affected file — including micro-edits made during Phase 10. The delivery-gate hook expects a Low result on the copy as it actually ships, not on an earlier revision. Append every pass to `.firecrawl/ai-detection-audit.md`. **Do not ship on FAIL.**

## SERP fail UI

Identical to on-page: Tab 1 placeholder ("Draft stopped — no SERP page-type consensus"), Tab 2 `#mockup-placeholder`, Tab 3 = 3-slide deck (Cover · SERP breakdown · Next steps), `switchTab('tab3')` on load. The fail deck is authored copy and is **not** exempt from Phase 9b — scan its three slides.

## Phase 10 — Definition of Done (GATING — do not skip)

All structural + render-verify checks from on-page Phase 10 apply verbatim (3 tab panels, balanced tags, slide counts, **open in Chrome and switch into each tab**). Plus net-new-specific spot-checks:

- **Template match:** Tab 2 section order and layout match the sibling pages (open a sibling next to the mockup); CTA labels are the siblings' real labels.
- **Claims audit:** pick 3 register rows at random, open each source URL, confirm the quote is really there and supports the drafted sentence. Register block present in Tab 1; every `NEEDS CUSTOMER INPUT` item appears both in-block and in the register.
- **No orphan facts:** grep the draft for numbers/percentages/integration names — each must trace to a register row or be cut.
- **No cannibalization drift:** the proposed slug/title doesn't collide with an existing customer URL from `site-map.json`.
- **Phase 9b still valid:** every surface scanned in 9b is byte-identical to what ships. Any micro-edit made during this gate invalidates the pass — re-run the affected file before calling it done.

For a multi-page run, run this gate on **every** page and report a per-page pass/fail table.

## Related skills

- `on-page-seo-optimization` — sibling; use when the page already exists (Phase 0 routes there)
- `ai-content-detection` — Phase 6c gate (page body) **and** Phase 9b gate (assembled bundle: appendix, Why lines, meta Summary, Tab 2 labels)
- `keyword-research` (vendored sibling at `../keyword-research/`, or the `growth:keyword-research` plugin — same script) — theme engine: invoked in-flow by Phase 0k when only one keyword is provided; also usable standalone upstream to pick the primary before invoking this skill
