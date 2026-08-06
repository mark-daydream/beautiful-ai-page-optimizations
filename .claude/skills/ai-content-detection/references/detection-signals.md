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

**Detect:** Flat vocabulary richness. Function words (the, a, of, to) in identical proportions across paragraphs. Every paragraph same structure: topic sentence → support → wrap. Script anchors this: `paragraph_structure` reports runs of 3+ consecutive paragraphs with near-identical shape (sentence count ±1, mean length ±4 words) and paragraph openers repeated 3+ times.

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

## 8. Rhetorical headers / editorial scaffolding

**Detect:** Section headers that editorialize instead of label: a plain topic plus a rhetorical suffix after a colon or dash ("The competitive set: corrected", "Backlinks: the engine is already running", "The roadmap: from defense to offense"). Every header in the doc following the same title-plus-payoff pattern.

**Why detectors care:** Humans title business sections with plain nouns ("Competitive set", "Backlinks"). The suffixed-payoff header is an LLM signature, and human readers now recognize it on sight — it gets a doc discounted as AI even when the content is sound.

**Severity:**
- Low: one clever header in an otherwise plain set
- Medium: 2+ suffixed headers
- High: every header follows the pattern

**Fix:** Strip headers to the plain topic noun. Put the payoff in the first sentence of the section if it's a fact; delete it if it's framing.

---

## 9. Decorative bold

**Detect:** Bold applied to mid-prose phrases for emphasis rather than structure — bolded metric claims, bolded ledes opening every list item, bold scattered through paragraphs. Structural bold (table headers, defined terms) is fine.

**Why detectors care:** LLMs bold what they consider important at a much higher rate than human writers of business prose. Readers experience it as "random bold" and read it as AI formatting.

**Severity:**
- Low: 1–2 emphatic bolds in a long doc
- Medium: bolded lede on every bullet, or 5+ mid-prose bolds
- High: bold density high enough that emphasis stops meaning anything

**Fix:** Remove bold from prose entirely; let the numbers carry the emphasis. Keep bold only for structure the reader navigates by.

---

## 10. Editorialization vs. meat

**Detect:** Sentences that narrate the document instead of stating facts: framing preambles ("We want to be straight about X", "the honest read is", "worth noting"), self-aware transitions ("Fair critique.", "That's the logic behind…"), interpretation restating what a table already shows, and closers that summarize the section the reader just read. See the "Meta-discourse" section of phrase-patterns.md. Rough test: if a sentence contains no number, name, date, or commitment, it's a candidate.

**Why detectors care:** Beyond detector scores, this is the tell human readers punish most in business writing — the doc reads as an essay about its facts rather than the facts. AI-assisted docs routinely run 2–3× longer than the same content written by a busy human.

**Severity:**
- Low: a few framing sentences in a doc that is mostly facts
- Medium: each section opens and closes with narration; interpretive sentences ≈ factual ones
- High: editorial sentences outnumber factual ones; the facts would fit in half the length

**Fix:** Cut to the meat. Keep facts, numbers, commitments, and at most one line of interpretation per section. Deliver short; expand later in response to actual questions rather than pre-answering imagined ones. For client-facing docs, target the length the busiest reader would write themselves.

---

## 11. "X, not Y" contrast frames

**Detect:** The comma-not construction ("structured data, not web pages"), "isn't X, it's Y", "not X, but Y", stacked "rather than". Script reports counts, per-1,000-word density, and instances under `contrast_frames`.

**Why detectors care:** The contrast frame is a stock LLM rhetorical move — models reach for it to sound decisive. One is a stylistic choice; three or more in a piece is a fingerprint, and trained classifiers weight it heavily. Human readers who review AI drafts now recognize it on sight.

**Severity:**
- Low: 1–2 in a long piece
- Medium: 3–5, or density ≥ 2 per 1,000 words
- High: 6+, or the frame appears in most sections

**Fix:** Keep the positive claim, drop the negation ("returns structured data" — the reader infers what it isn't). Where the contrast genuinely matters, state it as two plain sentences instead of one balanced clause.

**Examples:**

| AI-like | More human |
|---------|------------|
| It returns structured data, not web pages that mention those keywords. | It returns structured data. You won't have to parse pages that merely mention the keywords. |
| This is a difference in philosophy, not features. | The philosophies differ more than the feature lists do. |

---

## 12. Colon pivots (the em-dash successor)

**Detect:** Payoff colons in body prose: a short setup clause (≤6 words), a colon, then a prose payoff — "That pattern is the story: the harder the query, the wider the gap." Includes sentence-fragment openers ("The honest takeaway: run your own eval."). Script reports count, fragment-opener count, and per-1,000-word density under `colon_pivots`. List-introducing colons, URLs, times, tables, and code are excluded. Colon-suffixed headers stay under signal 8.

**Why detectors care:** The em dash became the most recognized AI tell, so newer model output (and lightly edited AI drafts) routes the same setup-pivot-payoff cadence through a colon instead. The rhetorical move is the fingerprint, not the punctuation mark — swap the colon for an em dash and the "ChatGPT sentence" reappears.

**Severity:**
- Low: 1–2 payoff colons in a long piece
- Medium: 3–5, or density ≥ 2.5 per 1,000 words
- High: 6+, or a fragment-opener colon in most sections

**Fix:** Make the payoff its own sentence. "That pattern is the story: the harder the query, the wider the gap" → "The harder the query, the wider the gap." The setup clause usually adds nothing once the payoff stands alone.

**Examples:**

| AI-like | More human |
|---------|------------|
| The honest takeaway: run your own eval before trusting any vendor's chart. | Run your own eval before trusting any vendor's chart. |
| Parallel's model is declarative: you state an objective and it decides how to retrieve. | Parallel's model is declarative. You state an objective and it decides how to retrieve. |

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
