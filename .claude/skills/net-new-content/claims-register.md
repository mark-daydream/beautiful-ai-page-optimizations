# Claims Register — the accuracy layer

Grounding methodology ported from `chbg/docs-grounding-agent` (Houston's ship gate, built for exactly this surface: net-new comparison/product articles; production on Exa). This file is the register's v2 — same admissible-sources rules as v1, plus atomic claims, three-verdict judging, a typed blocking policy, and mechanical quote verification.

Net-new drafts are written against competitor SERP content, which creates one dominant failure mode: **customer facts invented by osmosis** — the draft asserts the customer does what the SERP-typical page does ("integrates with X", "starts at $Y", "trusted by Z companies") without the customer ever saying so. The register makes every factual claim traceable, contradicted-checked, or visible as a gap.

## Atomic claims (extraction)

Break draft copy into **atomic claims** — one checkable assertion each:

- Split compound sentences: a sentence claiming two things produces two rows.
- Resolve pronouns and carry the subject down from headings, so the claim stands alone without its paragraph.
- Record the **source sentence** (draft sentence, verbatim) alongside the claim, so a reworded draft can be re-matched to its rows.

**Type** — `product` / `positioning` / `number` / `competitor` / `meta`:

- `product` — falsifiable assertion about what the customer's product does, costs, integrates with, supports, or has achieved (capabilities, integrations, pricing/plans, limits, platform support, security/compliance, company facts, customer names/quotes). Test: could the customer's own pages confirm or deny it as written?
- `positioning` — preference, superiority, or best-fit judgement ("X is the best choice for…", "X excels at…"). Classify by the **form** of the sentence: "X supports voice agents" is product; "X is the best choice for voice agents" is positioning. Docs state capabilities, never preference — a positioning claim can never be `supported` by documentation, and that is fine (see blocking policy).
- `number` — any figure or statistic, including industry stats ("68% of buyers…").
- `competitor` — assertion about a vendor other than the customer (alternatives/comparison articles are made of these).
- `meta` — page furniture: URLs, title tags, headings that assert nothing. Exempt from rows, like industry-generic educational prose with no factual assertion and no figures.

**Subject** — `customer` / `competitor` / `other` (category, trend, no single vendor). Type and subject are independent. Never widen a claim about a category into a claim about the customer.

## Admissible sources (unchanged from v1 — stricter than the ported gate, on purpose)

- **Customer claims** ground ONLY in customer-owned web: pages on the customer's domain(s) — marketing site, docs, help center, changelog, pricing, case studies. Scraped fresh during Phase 5 into `fact-base-{slug}.md`.
- **Competitor claims** ground ONLY in that competitor's own pages, scraped into `competitor-facts-{slug}.md`. A competitor claim is never judged against the customer's fact base (nothing to check it against), and never sourced from a third listicle.
- **Numbers/industry stats** need a citable **primary** source (the original study/report — not a competitor blog citing it).
- **Inadmissible always:** SERP snippets, review sites (G2/Capterra), press, model memory. Competitor pages contribute structure and topic coverage only — never facts about the customer.

## Judging (three verdicts, evidence-only)

Rule on the scraped fact-base excerpts alone — never from prior knowledge of the product:

- `supported` — the excerpts state the claim, or state something it follows from directly.
- `contradicted` — the excerpts state something incompatible with **every** reading of the claim. Per-plan numbers and unit conversions are equivalences, not conflicts ("$5 per 1,000 requests" = "$0.005 per request"). This verdict is a different diagnosis from a gap: the draft conflicts with the customer's own site. Fix the wording to match the docs (use the quote) — never ship it, never merely flag it.
- `undocumented` — the excerpts do not settle it. Silence is `undocumented`, never `supported`.

**Quote rule (mechanical):** `supported` and `contradicted` require a quote copied character-for-character from the fact-base file — no paraphrase, no tidied punctuation, no joining excerpts. Verify: `grep -F "<quote>" .firecrawl/fact-base-{slug}.md` (or the competitor-facts file) must hit. A failed quote check invalidates the verdict → `undocumented`. Also re-open the live source URL on the verification pass — the fact base must still match the live page.

**Overstatement drift** is a `contradicted`-family failure even when the topic matches: source says "connects with Slack via Zapier", draft says "native Slack integration" → the row fails; fix the wording, re-verify. Paraphrase is fine; strengthening is not.

**Second pass before any `undocumented`:** re-grep the fact base with the claim's distinctive tokens (feature names, parameter words, figures). "Undocumented" often means retrieval missed it — don't send the client a `NEEDS CUSTOMER INPUT` for a fact that's already on their site.

## Blocking policy (verdict ≠ policy — they are separate on purpose)

| Type | Blocks on | Resolution |
|------|-----------|------------|
| `product` (subject customer) | contradicted, undocumented | supported → ships · contradicted → reword to the docs · undocumented (after 2nd pass) → `[NEEDS CUSTOMER INPUT: …]` block or cut |
| `positioning` (subject customer) | contradicted only | ships as editorial voice; if the customer's own site contradicts it, reword |
| `number` (any subject) | no VERIFIED primary source | cut the number, keep the qualitative point if it stands alone |
| `competitor` type or subject | contradicted or undocumented **vs that competitor's own pages** | reword to what their docs say, hedge to remove the factual edge, or cut. Never "verify" against customer sources |
| `meta` / exempt prose | nothing | — |

## Register format

`.firecrawl/claims-register-{slug}.md`:

```markdown
# Claims Register — {slug}

| ID | Claim (atomic) | Type/Subject | Source URL | Quote (character-exact) | Verdict | Status |
|----|----------------|--------------|------------|-------------------------|---------|--------|
| C1 | "…integrates with Slack and Microsoft Teams" | product/customer | https://…/integrations | "Connect … to Slack, Teams…" | supported | SHIPS |
| C2 | "SOC 2 Type II certified" | product/customer | — | — | undocumented | NEEDS CUSTOMER INPUT |
| C3 | "43% of teams…" | number/other | https://original-study… | "43 percent of…" | supported | SHIPS |
| C4 | "{Competitor} caps exports at 10/mo" | product/competitor | https://competitor…/pricing | "10 exports per month" | supported | SHIPS |

## Verification passes
- Pass 1 ({date-from-user-context}): 11 supported · 1 contradicted→reworded · 2 NEEDS INPUT · 1 REMOVED · quote check 15/15
```

**Verdict** is the finding (supported/contradicted/undocumented). **Status** is the action (`SHIPS` · `NEEDS CUSTOMER INPUT` · `REWORDED` · `REMOVED`). Append each pass; never overwrite (auditable like the AI-detection log).

## Verification pass (Phase 6a — GATING)

Independent re-verification of every row: re-open the source, re-run the mechanical quote check, apply the second-pass rule to every `undocumented`, then apply the blocking policy.

**Gate rules — all must hold before Phase 6b:**

1. Every non-exempt claim in the copy has a row; no row lacks a verdict.
2. Zero blocking claims ship as plain prose — resolved per the policy table (`[NEEDS CUSTOMER INPUT: …]` block, reword, or cut).
3. Zero `contradicted` rows unresolved, including overstatement drift and competitor claims vs their own pages.
4. Zero numbers without a supported row on a primary source.
5. Every quote passes the exact-string check; a failed quote is not evidence.
6. Any claim traceable only to competitor/SERP content → automatic FAIL until removed or independently re-grounded in the admissible source for its subject.
7. If Phase 6c (AI-detection revisions) rewords a sentence carrying claim IDs, those rows are re-verified before the bundle builds (match via the recorded source sentence).

Log the pass to the register file (append). **Do not proceed on FAIL.**

## In the bundle

- Each Tab 1 block carries `<strong>Sources:</strong> C1, C4` after its Why line.
- The full register renders as the **Claims Register block** (`.data-table`) after Structured Data in Tab 1 — Verdict column included, in client terms ("verified against {customer}'s own pages").
- `NEEDS CUSTOMER INPUT` items appear in-block as flagged callouts **and** in the register, so the client sees exactly what to supply.
- The Tab 3 "Grounding & accuracy" slide reports the counts (claims judged / supported / reworded / needs-input). No internal tooling vocabulary on any client-facing surface.
