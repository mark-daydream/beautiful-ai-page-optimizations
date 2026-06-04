# Content Quality Gate

Mandatory before HTML bundle assembly. Log to `.firecrawl/content-quality-review.md`.

For full passage-level AI detector audit (perplexity, burstiness, n-gram repetition, Unicode artifacts), run the `ai-content-detection` skill as **Phase 6c**. This gate covers hard fails only.

## Anti-AI-slop (fail = rewrite)

| Check | Rule |
|-------|------|
| Em dashes | No `—` or `&mdash;` in recommended copy |
| Filler openers | No "In today's fast-paced world", "When it comes to", "It's important to note", "Furthermore/Moreover" chains |
| Vague superlatives | No "best-in-class", "cutting-edge", "revolutionary" without specific proof |
| Generic listicles | No "Key benefits include:" unless live site uses that pattern |
| Keyword stuffing | No exact phrase in adjacent sentences |
| Voice drift | Must match `brand-voice-profile.md` |

## Branded content

- Locked terms verbatim (spelling, capitalization)
- No renaming products/features for SEO
- Keywords only in `generic` sections; change-notes cite eligibility

## Review log

```markdown
# Content Quality Review

| Block ID | Pass | Notes |
|----------|------|-------|
| block-h1 | yes | |

**Status:** PASS
```

**Do not ship bundle on FAIL.**
