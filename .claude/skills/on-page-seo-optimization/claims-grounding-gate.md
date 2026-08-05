# Claims Grounding Gate (Phase 6d)

Mandatory before HTML bundle assembly. Log to `.firecrawl/claims-grounding-review.md`.

Ported from `chbg/docs-grounding-agent` (Houston's ship gate, production on Exa comparison pages). Why it exists: a reviewed, live client page said "1B+ profiles with 50M+ weekly updates" — the docs say 1B+ profiles refreshed weekly, and *separately* 50M+ companies. The draft reattached a company count to profiles as an update rate. Wrong-but-plausible claims survive human review; this gate checks every one against the client's own documentation.

## Scope

Extract claims from **Tab 1 After copy only**, split by origin:

- **Ours** — sentences that are new or differ from the live page (`pill-new`, `pill-rev`, and the changed spans of `pill-opt`). Full blocking policy applies.
- **Carried over** — sentences reproduced verbatim from the live page. Judge for `contradicted` only; a hit is surfaced to the user as a question (their live copy conflicts with their docs), never silently rewritten and never a ship-blocker on its own.

## Corpus (client docs only)

Build `.firecrawl/grounding-corpus/` from the client's **own** documentation — this is the only evidence the judge may use:

1. Try `https://{domain}/llms-full.txt` first, then a docs subdomain/path via `firecrawl map`, then product/pricing/feature pages. Reuse Phase 1/1b scrapes where they cover product facts.
2. Save each source as its own `.md` file.
3. **Trap:** some sites publish `llms.txt` as an index of page titles + links. That ingests fine and then rules everything `undocumented` because there is no prose. Verify the corpus contains real documentation text, not a link list.

## Claim extraction

Break the in-scope copy into atomic claims. Split compound sentences — one assertion per claim; do not merge to keep the count down, do not invent claims the copy does not make. Each claim records:

| Field | Rule |
|-------|------|
| `text` | Self-contained assertion; resolve pronouns, carry the subject down from headings so it stands alone |
| `sourceSentence` | The sentence it came from, verbatim |
| `type` | `product` / `positioning` / `number` / `competitor` / `meta` (below) |
| `subject` | `brand` (the client) / `competitor` (one named other vendor) / `other` (category, trend, no single vendor) |
| `query` | The search you'd run against the docs — phrased in the words the documentation itself would use, not as a question |

**Types:**

- `product` — falsifiable assertion about what the client's product does: features, parameters, integrations, supported formats, published prices, documented capacities. Test: could documentation confirm or deny it as written?
- `positioning` — preference, superiority, or best-fit judgement ("X is the best choice for…", "X excels at…"). Classify by the **form** of the sentence: "Brand supports voice agents" is product; "Brand is the best choice for voice agents" is positioning. Docs state capabilities, never preference.
- `number` — a benchmark result, eval score, or measured figure from an experiment rather than from documentation.
- `competitor` — assertion about a vendor other than the client.
- `meta` — page furniture: URLs, title tags, meta descriptions, headings that assert nothing.

Type and subject are independent (`product` + subject `competitor` is valid). Never widen a claim about a category into a claim about the client.

## Judging

For each claim, retrieve evidence: grep the corpus for the `query` terms and read the surrounding prose. Rule on the **excerpts alone** — never from prior knowledge of the product. Exactly one verdict:

- `supported` — the excerpts state the claim, or state something it follows from directly.
- `contradicted` — the excerpts state something incompatible with **every** reading. Per-plan numbers and unit conversions are equivalences, not conflicts: "$5 per 1,000 requests" and "$0.005 per request" are the same fact. True on any documented plan or under any equivalent unit → not contradicted.
- `undocumented` — the excerpts do not settle it either way. Silence is `undocumented`, never `supported`.

**Quote rule (mechanical):** `supported` and `contradicted` require a quote copied character-for-character from the corpus — no paraphrase, no tidied punctuation, no joining two excerpts. Verify: `grep -F "<quote>" .firecrawl/grounding-corpus/*` must hit. A quote that fails the check invalidates the verdict — it becomes `undocumented`.

**Second pass:** before finalizing any `undocumented`, re-grep the corpus with the claim's distinctive tokens (product terms, parameter names, figures). "Undocumented" often means retrieval missed it — claims have been blocked while their term appeared in the corpus 20+ times. Also sanity-check the reason: a verdict whose reason **cites the line that supports the claim** is wrong — re-judge it.

## Blocking policy

Verdicts are findings; blocking is policy. They are separate on purpose.

| Type | Blocks on |
|------|-----------|
| `product` | contradicted, undocumented |
| `positioning` | contradicted |
| `number` | ours + not in corpus or live page → block pending a user-supplied source; carried over → record only |
| `competitor` (type or subject) | nothing — recorded with flag `competitor_subject_no_corpus`; the corpus holds one brand's docs, so these are unjudgeable. A `contradicted` here is usually the judge quoting client docs against a sentence about someone else — noise, do not "fix" |
| `meta` | nothing |

## Resolution

Per blocking claim, in order of preference: **rewrite to what the docs actually say** (use the verified quote), **drop the claim**, or **ask the user** for a source (numbers) or a ruling (carried-over contradictions, docs that lag the product). After fixes, re-judge the rewritten sentences, and re-run the Phase 6c `analyze_text.py` script on any span this gate changed. Present grounding fixes alongside the 6c diff at the pre-build checkpoint.

## Review log

```markdown
# Claims Grounding Review

Corpus: {n} sources · Claims: {n} extracted / {n} judged / {n} unjudgeable (competitor)

| Claim | Type/Subject | Verdict | Quote or reason | Action |
|-------|--------------|---------|-----------------|--------|
| "…" | product/brand | supported | "…" (docs.example.com) | — |

**Status:** PASS / BLOCKED ({n} claims)
```

**Do not ship bundle on BLOCKED.**
