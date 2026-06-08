# Detection Signals Rubric

Reference for qualitative audit. Primary source: [AI Detectors article](https://www.thepromptindex.com/ai-detectors-how-to-stay-undetected.html).

For each signal: **Detect** → **Why detectors care** → **Severity** → **Fix**

---

## 1. Perplexity / predictable phrasing

**Detect:** Template transitions, symmetrical paragraph openers, phrases a language model predicts easily. See [phrase-patterns.md](phrase-patterns.md).

**Why detectors care:** Low perplexity means the next word was highly predictable — a hallmark of LLM output.

**Severity:**
- Low: one filler opener in a long piece
- Medium: 2+ transition chains in one section
- High: paragraph reads like a numbered outline rendered as prose

**Fix:** Swap template transitions for direct statements. Break parallel structure. Start a sentence with "And" or "But" occasionally.

**Examples:**

| AI-like | More human |
|---------|------------|
| Furthermore, it is important to recognize the significance of… | Let's not forget how important this is. |
| In today's fast-paced world, businesses must adapt. | Most teams I talk to are still catching up. |
| This comprehensive solution empowers users to streamline workflows. | It cuts the busywork — you finish decks in half the time. |

---

## 2. Burstiness (sentence variation)

**Detect:** Consecutive sentences with similar word counts. No rhetorical questions. Uniform medium-length sentences. Script flags when sentence-length stdev/mean ratio < 0.35.

**Why detectors care:** Humans alternate short punchy lines with longer ones. AI output tends toward smooth, even pacing.

**Severity:**
- Low: 2–3 similar-length sentences in one paragraph
- Medium: 5+ consecutive sentences within ±3 words of each other
- High: entire section with no sentence under 12 or over 28 words

**Fix:** Insert a 4–6 word sentence. Add a question. Split one long sentence or merge two short ones.

**Examples:**

| AI-like (even pacing) | More human |
|-----------------------|------------|
| Presentation software helps teams create slides quickly. It offers templates for common use cases. Many tools include collaboration features. Users can share decks with stakeholders easily. | Presentation software saves time. That's the pitch, anyway — templates, collab, share links. Most teams still fight over fonts. |

---

## 3. N-gram repetition

**Detect:** Same 3–5 word phrase appears 2+ times (intro echoes conclusion, repeated "it is important to"). Script surfaces repeated n-grams.

**Why detectors care:** LLMs reuse high-probability phrase chunks across a document.

**Severity:**
- Low: one repeated phrase in headings
- Medium: 2–3 repeated phrases in body
- High: intro and conclusion share 5+ word sequences

**Fix:** Reword one instance entirely. Use synonyms only where meaning shifts — don't swap word-for-word in parallel.

---

## 4. Stylometric uniformity

**Detect:** Flat vocabulary richness. Function words (the, a, of, to) in identical proportions across paragraphs. Every paragraph same structure: topic sentence → support → wrap.

**Why detectors care:** Stylometric models compare word-frequency fingerprints to human baselines.

**Severity:**
- Low: one formulaic paragraph
- Medium: 3+ paragraphs with identical structure
- High: no domain-specific terms, idioms, or irregular word choices anywhere

**Fix:** Add a concrete noun from the subject domain. Drop in an idiom or regional phrase. Vary paragraph openings (question, fragment, stat).

---

## 5. Over-polished grammar

**Detect:** Perfect parallel structure. No contractions where a human would use them. No sentence fragments. Em-dash chains. Every list item grammatically identical.

**Why detectors care:** AI outputs are often cleaner than typical human writing.

**Severity:**
- Low: missing contractions in casual content
- Medium: every paragraph grammatically flawless + formal transitions
- High: reads like a textbook; zero informal markers in marketing/blog copy

**Fix:** Use contractions in casual content. Allow one fragment. Break parallel list structure intentionally.

**Examples:**

| AI-like | More human |
|---------|------------|
| It is essential that teams utilize the platform effectively. | You'll get more from it once your team actually uses it daily. |
| The tool provides flexibility, scalability, and reliability. | It's flexible. Scale isn't an issue. Reliability? Mostly. |

---

## 6. Unicode / formatting artifacts

**Detect:** Curly/smart quotes (`"` `"` `'` `'`), non-breaking spaces (U+00A0), zero-width characters, em dashes (—) from copy-paste. Script reports character positions.

**Why detectors care:** Copy-pasted AI output often carries Unicode artifacts humans rarely type.

**Severity:**
- Low: 1–2 smart quotes
- Medium: mix of smart quotes + NBSP
- High: multiple hidden characters or zero-width joins

**Fix:** Normalize to straight quotes and apostrophes. Replace em dashes with commas or periods. Strip hidden Unicode.

---

## 7. Generic tone (no voice)

**Detect:** No anecdotes, opinions, preferences, or first-hand context. Could apply to any industry. No "I/we" where appropriate. No specific numbers, names, or dates.

**Why detectors care:** AI text defaults to neutral encyclopedic tone; detectors treat absence of personal markers as a signal.

**Severity:**
- Low: one generic paragraph in otherwise specific copy
- Medium: entire section could swap industry nouns unchanged
- High: no human perspective in 500+ words of marketing/blog content

**Fix:** Add one concrete example, opinion, or constraint ("We tried X and it failed because…"). Name a real scenario. Include a number or timeframe.

**Examples:**

| AI-like | More human |
|---------|------------|
| Effective presentation software improves team productivity and collaboration. | We cut our deck prep from two days to an afternoon once we stopped rebuilding slides from scratch. |

---

## Overall risk scoring

| Overall risk | Criteria |
|--------------|----------|
| **High** | 3+ high-severity flags, OR uniform sentence rhythm (burstiness flag) + 2+ phrase-pattern hits |
| **Medium** | 1–2 high-severity flags, OR 4+ medium-severity flags |
| **Low** | Mostly stylistic nits; no structural AI tells |

## Estimated detector sensitivity

Map overall risk to likely third-party detector response (heuristic, not API-verified):

| Overall risk | Estimated detector sensitivity |
|--------------|-------------------------------|
| Low | Low — unlikely to trigger major flags |
| Medium | Medium — may flag sections or score 40–70% AI |
| High | High — likely flagged as predominantly AI-generated |
