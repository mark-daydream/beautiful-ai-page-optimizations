---
name: ai-content-detection
description: |
  Audits text for AI-detector risk signals — perplexity, burstiness, n-gram
  repetition, stylometric uniformity, Unicode artifacts, and generic AI phrasing.
  Flags specific passages and outputs a markdown revision report with prioritized
  recommendations. Use when the user asks to detect AI writing, check if content
  will pass AI detectors, audit for AI slop, humanize recommendations, or review
  copy before publishing. Also run as Phase 6c when shipping on-page SEO drafts.
disable-model-invocation: true
---

# AI Content Detection

Audit prose for patterns commonly flagged by AI detectors (GPTZero, Originality.ai, Copyleaks, Turnitin). Output a **markdown audit report** with risk scoring, passage-level flags, and revision recommendations. **Do not rewrite the source text** unless the user explicitly asks.

**Rubric:** [references/detection-signals.md](references/detection-signals.md) · **Phrase list:** [references/phrase-patterns.md](references/phrase-patterns.md) · **Examples:** [examples.md](examples.md)

## Intake

Accept:
- Pasted text
- File path
- `.firecrawl/` draft copy from on-page SEO work

Ask **at most one** clarifying question (content type: blog / marketing / academic) only if tone expectations materially affect the audit.

Default output path: `ai-detection-audit.md` (or `.firecrawl/ai-detection-audit.md` when run as SEO Phase 6c).

## Workflow checklist

```
- [ ] Step 1: Resolve input text
- [ ] Step 2: Run scripts/analyze_text.py → JSON metrics
- [ ] Step 3: Read detection-signals.md; qualitative pass on full text
- [ ] Step 4: Write audit report (template below)
```

## Step 2 — Deterministic scan

From the skill directory (or pass absolute paths):

```bash
python3 scripts/analyze_text.py --input "<file>" --json
# or stdin:
echo "text" | python3 scripts/analyze_text.py --json
```

Script returns: burstiness stats, paragraph-structure uniformity (runs of same-shaped paragraphs + repeated openers), repeated n-grams, Unicode/hidden-char hits, em-dash count, phrase-pattern matches, contrast-frame ("X, not Y") hits, and colon-pivot density (the em-dash successor). Use these to anchor qualitative flags — do not rely on script output alone.

## Step 3 — Qualitative audit

Read [references/detection-signals.md](references/detection-signals.md). Cross-reference script JSON with a full-text read.

For each flag:
- Quote the **exact passage** (max ~2 sentences)
- Name the signal category
- Assign severity: Low / Medium / High
- Give a concrete revision direction (not a full rewrite unless the flagged span is a short phrase)

## Step 4 — Report template

**Always** use this structure:

```markdown
# AI Detection Audit — {source label}

## Summary
| Metric | Result |
|--------|--------|
| Overall risk | Low / Medium / High |
| Estimated detector sensitivity | Low / Medium / High |
| Top 3 issues | … |

## Signal breakdown
| Signal | Risk | Flags | Notes |
|--------|------|-------|-------|
| Burstiness (sentence variation) | … | … | … |
| Paragraph-structure uniformity | … | … | … |
| Predictable phrasing | … | … | … |
| N-gram repetition | … | … | … |
| AI transition phrases | … | … | … |
| Over-polished grammar | … | … | … |
| Unicode / formatting artifacts | … | … | … |
| Generic tone (no voice) | … | … | … |
| Rhetorical headers / scaffolding | … | … | … |
| Decorative bold | … | … | … |
| Editorialization vs. meat | … | … | … |
| "X, not Y" contrast frames | … | … | … |
| Colon pivots (em-dash successor) | … | … | … |

## Flagged passages
### Flag {n} — {signal} — {Low|Medium|High}
> {exact quoted text}

**Why flagged:** {1–2 sentences}
**Suggested revision:** {concrete rewrite direction}

## Priority revision checklist
1. {highest-impact fix}
2. …

## Script metrics
{paste key JSON stats from analyze_text.py}
```

### Risk scoring

| Overall risk | Criteria |
|--------------|----------|
| **High** | 3+ high-severity flags, OR uniform sentence rhythm + 2+ phrase-pattern hits |
| **Medium** | 1–2 high-severity flags, OR 4+ medium-severity flags |
| **Low** | Mostly stylistic nits; no structural AI tells |

## SEO integration (Phase 6c)

When invoked from `on-page-seo-optimization`:
1. Extract **Tab 1 After** copy from the optimization draft (changed sections only, or full page if user requests)
2. Run this skill's workflow
3. Save to `.firecrawl/ai-detection-audit.md`
4. Do **not** block bundle ship unless user asks — this phase is optional

## Related skills

- `on-page-seo-optimization` — Phase 6b content-quality gate (hard fails only)
- `on-page-seo-optimization` — Phase 6c optional hook to this skill
