# Brand Voice Rubric

Run in **Phase 1b** after target scrape, **before** branded terminology checkpoint.

## Sample pages (3–4, same domain, exclude target)

1. Homepage `/`
2. About or company page
3. Flagship product/solutions page
4. One blog/resource post (if exists)

```bash
firecrawl map "https://example.com" --limit 100 --json -o .firecrawl/site-map.json
firecrawl scrape "<url1>" "<url2>" "<url3>" --only-main-content -o .firecrawl/brand-voice/
```

## Output: `.firecrawl/brand-voice-profile.md`

```markdown
# Brand Voice Profile — {domain}

## Tone
[2–3 sentences: formal/casual, confident/measured, technical/accessible]

## Sentence rhythm
[avg length, lists vs prose]

## Vocabulary
**Uses:** …
**Avoids:** …

## CTA style
[verb patterns, urgency]

## Branded lexicon (auto-detected)
- Exact product/feature names and capitalization
- Taglines, plan tiers

## Voice examples (verbatim, 2–3)
> …

## Punctuation on live site
[note for reference; recommended copy must still pass content-quality gate — no em dashes in recommendations]
```

## Branded terminology checkpoint

Merge lexicon + `branded`/`locked` sections → present to user → `.firecrawl/branded-lexicon.md` on approval.
