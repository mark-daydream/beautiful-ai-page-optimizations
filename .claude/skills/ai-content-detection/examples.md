# Example Audits

Two sample reports showing expected output shape. These are reference outputs — run the skill on real text for live audits.

---

## Example 1 — Obvious AI sample (expect High risk)

**Input:**

> Furthermore, it is important to recognize the significance of presentation software in today's fast-paced world. Presentation software helps teams create slides quickly. It offers templates for common use cases. Many tools include collaboration features. Users can share decks with stakeholders easily. Moreover, it is important to note that effective presentation software improves team productivity and collaboration. In conclusion, leveraging a comprehensive solution empowers users to streamline their workflow seamlessly.

**Expected summary:** Overall risk **High**; uniform sentence rhythm + multiple phrase-pattern hits.

**Sample flags:**

### Flag 1 — AI transition phrases — High
> Furthermore, it is important to recognize the significance of presentation software in today's fast-paced world.

**Why flagged:** Opens with a predictable filler chain ("Furthermore" + "it is important to recognize" + "today's fast-paced world") — classic low-perplexity AI phrasing.

**Suggested revision:** Drop the opener. Start with a concrete claim: "Most teams still rebuild slides from scratch every week."

### Flag 2 — Burstiness — High
> Presentation software helps teams create slides quickly. It offers templates for common use cases. Many tools include collaboration features. Users can share decks with stakeholders easily.

**Why flagged:** Four consecutive sentences with nearly identical length (~8–10 words) and parallel structure.

**Suggested revision:** Break the rhythm — one short sentence, one longer one with a specific detail.

---

## Example 2 — Human blog excerpt (expect Low risk)

**Input:**

> We cut deck prep from two days to an afternoon — but only after we stopped treating every slide like a blank canvas. Templates helped. What actually moved the needle was killing the weekly "just fix the fonts" meeting. If your team still exports to PDF before every review, you're not alone.

**Expected summary:** Overall risk **Low**; varied sentence lengths, first-person perspective, specific scenario.

**Sample flags:** None or at most one Low-severity note (em dash present — normalize if copy-pasting from AI tools, but here reads as intentional human punctuation).

---

## Running the script on samples

```bash
cd ~/.agents/skills/ai-content-detection

# AI sample
python3 scripts/analyze_text.py --input /tmp/ai-sample.txt --json

# Human sample
python3 scripts/analyze_text.py --input /tmp/human-sample.txt --json
```

Compare `risk_hints`, `burstiness.low_burstiness`, and `phrase_matches` counts between the two.
