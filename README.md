# Beautiful.ai Optimization Drafts

On-page SEO optimization deliverables for Beautiful.ai. Each draft is a self-contained 3-tab HTML bundle: **optimization draft**, **wireframe mockup**, and **research appendix**.

## View

Open **`index.html`** — the directory page that lists every draft and links to each bundle.

> The HTML loads styling from the local CSS/JS files, so keep these together in one folder:
> `daydream-tokens.css`, `bundle-shell.css`, `tab-draft-styles.css`, `tab-mockup-styles.css`, `review-ui.js`, and `logo-icon-rounded.svg`.
> Fonts load from Google Fonts (needs an internet connection).

## Drafts

| # | Page | Primary keyword | URL |
|---|------|-----------------|-----|
| 01 | What Is Presentation Software | what is presentation software | `what-is-presentation-software/` (clean URL `/what-is-presentation-software`) |
| 02 | The 10/20/30 Rule for Presentations | 10/20/30 rule for presentations | `10-20-30-rule-for-presentations/` (clean URL `/10-20-30-rule-for-presentations`) |
| 03 | Team SWOT Analysis | team swot analysis | `team-swot-analysis/` (clean URL `/team-swot-analysis`) |
| 04 | Creative Presentation Ideas for College | creative presentation ideas for college | `creative-presentation-ideas-college/` (clean URL `/creative-presentation-ideas-college`) |
| 05 | VC Pitch Deck Template (Uber / First Round Capital) | vc pitch deck template | `uber-vc-pitch-deck-presentation-template/` (clean URL `/uber-vc-pitch-deck-presentation-template`) |
| 06 | Rebrand Presentation Examples | rebrand presentation examples | `rebrand-presentation-examples/` (clean URL `/rebrand-presentation-examples`) |
| 07 | Automate Presentation Design with AI | how to automate presentation design | `how-to-automate-presentation-design/` (clean URL `/how-to-automate-presentation-design`) |
| 08 | Team Presentation Icebreakers | team presentation icebreakers | `team-presentation-icebreakers/` (clean URL `/team-presentation-icebreakers`) |

## Reviewing a draft (Approve / Reject)

Every draft carries the same review layer (`review-ui.js`): each section in the **Optimization Draft** tab gets an **Approve / Reject** bar (Reject requires a reason), a per-section **Clear** to undo, and a floating **Rejected** panel listing every rejection. A one-time guided tour (re-openable via **Take a tour**) explains the flow.

Decisions sync live to a shared Cloud Firestore project (`on-page-optimizations`), namespaced per page by `pageId`, so reviewers on any device see the same state with nothing to download or email back. With no Firebase config the same UI falls back to per-browser `localStorage` for offline testing. This wiring is part of the skill scaffold, so **all future drafts get it automatically**.

## Supporting research (per draft)

`onpage-strategy-*.md` · `brand-voice-profile.md` · `branded-lexicon.md` · `content-quality-review.md` · `onpage-serp-primary.json`

## Reproducing a draft (the skill travels with this repo)

The on-page SEO workflow is bundled at **`.claude/skills/on-page-seo-optimization/`**, so it's available wherever this repo is opened (local Claude Code, Claude Code on the web, or Claude Cowork) — not just on one machine.

- **Run it:** in Claude Code, invoke `/on-page-seo-optimization` (or ask for an "on-page optimization" draft), then provide the target URL, primary keyword, and supporting keywords.
- **Firecrawl:** the skill works with either the **Firecrawl CLI** (local) or the **Firecrawl MCP server** (portable, for Cowork / web). See the "Firecrawl access (CLI or MCP)" section in the skill's `SKILL.md`. You only need a `FIRECRAWL_API_KEY` for the MCP path.
- Intermediate research is written to `.firecrawl/` (gitignored); the committed deliverable is each draft's clean-URL folder.
