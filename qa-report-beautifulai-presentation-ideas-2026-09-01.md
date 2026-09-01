# Beautiful.ai draft #31 (presentation ideas) QA

QA of presentation-ideas/index.html against net-new-content 1.1.0, 1 September 2026. Structure, claims grounding, numbers and the SERP/template contract all came back clean: 25 + 30 = 55 matches the H1, the seven FAQ questions match the schema verbatim, the keyword table matches the theme JSON, and all eleven product claims quote a live beautiful.ai page.
Verdict: ship, after the five fixes below (all applied).
Versions: qa-review 1.2.0 · net-new-content 1.1.0 · ai-content-detection 1.1.1 · checker check_bundle.py (run; two flags are net-new spec, see "For the requester") · no SHA, ~/.claude/skills is not a git repo
Run manifest: 1 ran · 2 ran · 2b ran (no channel expectation for this deliverable beyond the Asana commission) · 3 ran · 4.1 ran · 4.2 ran · 4.3 ran · 4.4 ran (5 claims live-fetched, pricing read rendered) · 4.5 n/a (article draft, owning skill's voice rules govern) · 5 ran · 5c skipped (single unit) · 6 ran

## Tab 1 — Content Draft

Fix:
- "Start a free trial" (3 occurrences: Tab 1 CTA chrome block, Tab 2 rail card, Tab 2 banner) -> "Get started" in the rail card and "Schedule a demo" in the banner. Both live siblings carry those labels in those slots and neither page contains the string "Start a free trial" anywhere. net-new-content Tab 1 item 3: "Real sibling CTA labels, never invented ones."
- Supporting Keywords row ended at "creative presentations ideas" -> appended "theme via keyword-research, 1 September 2026". net-new-content Tab 1 item 1 requires the note whenever Phase 0k built the theme.
- Eight double-space artifacts in rendered copy, e.g. "as you type instead of breaking.  You never start from a blank slide" -> single space. Left behind when [C1]-style claim markers were stripped at build time.
- "Beautiful.ai /blog/presentation-ideas &mdash; Content Draft" (bundle H1) and "Blog listicle &mdash;" (Template meta row) -> "&middot;". Both render as em dashes on a client-facing surface. The Phase 9b house rule bans em dashes; the earlier gate only tested the literal character and missed the entity.
- FAQPage schema stopped mirroring the visible FAQ after the pricing answer was edited -> schema answer re-synced. net-new-content Tab 1 item 5 requires the schema to mirror the visible FAQ verbatim. This one was introduced during QA fixing and caught on re-check.

Check:
- Eight of eleven blocks carry a "Why:" line with no "Sources:" line. net-new-content Tab 1 item 4 reads "Each block ends with Why ... plus a Sources line", but its parenthetical ("claims with no ID = industry-generic copy") suggests claim-free blocks legitimately have none. The three blocks that make product claims all carry one. Decide whether template-chrome and industry-generic blocks should print "Sources: none".
- The Claims Register renders six columns (ID, Claim, Type, Source, Supporting quote, Status). The skill specifies four (ID, Claim, Source, Status). The extra two are additive and useful for a reviewer, but they are a divergence from the written contract.

## Working files

Check:
- fact-base row F16 quotes "The Team plan is $40 per user per month billed annually, or $50 billed monthly, for 2 to 20 seats." That exact string is not on the rendered pricing page, which shows $14, $40 and $45 tiers. F16 is not used anywhere in the draft, so nothing shipped wrong, but the row should not be reused as-is. Re-read the pricing page rendered before quoting any plan price.

## For the requester

- **A claim was added during QA.** The pricing FAQ now states that the trial requires a credit card and is charged in full if not cancelled, grounded on the rendered /pricing FAQ and logged as claim C11. The draft previously said only that there is no free tier. The free-variant honesty precedent from the infographic draft argues for stating it, but it is new copy, so read it before it goes to the client.
- **Two checker flags are not defects.** check_bundle.py expects 7 appendix slides and the schema block last in Tab 1. net-new-content requires 8 slides (it adds the Grounding and accuracy slide) and places the Claims Register after the schema. The checker belongs to on-page-seo-optimization and does not know the net-new contract.
- **The checker contradicts a standing rule.** It fails the meta table for having no "(NN characters)" note on the title and meta description rows. Mark's 2 August rule forbids exactly those annotations ("values only, no context annotations"). The rule won here. Worth fixing in the script, since it will fail every future bundle the same way.
- **A rule inside net-new-content conflicts with itself.** Tab 1 item 1 requires the Supporting Keywords row to name "keyword-research", while the no-internal-context rule in the same file bans tooling and skill names from client-facing surfaces. The skill's own pre-ship grep does not catch the phrase, so the explicit instruction was followed. Worth resolving the wording.
