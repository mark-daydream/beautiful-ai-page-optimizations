# Beautiful.ai Optimization Drafts

On-page SEO optimization deliverables for Beautiful.ai. Each draft is a self-contained 3-tab HTML bundle: **optimization draft**, **wireframe mockup**, and **research appendix**.

## View

Open **`index.html`** — the directory page that lists every draft and links to each bundle.

> The HTML loads styling from the local CSS/JS files, so keep these together in one folder:
> `daydream-tokens.css`, `bundle-shell.css`, `tab-draft-styles.css`, `tab-mockup-styles.css`, `bundle-ui.js`, and `logo-icon-rounded.svg`.
> Fonts load from Google Fonts (needs an internet connection).

## Drafts

| # | Page | Primary keyword | URL |
|---|------|-----------------|-----|
| 01 | What Is Presentation Software | what is presentation software | `what-is-presentation-software/` (clean URL `/what-is-presentation-software`) |
| 02 | The 10/20/30 Rule for Presentations | 10/20/30 rule for presentations | `10-20-30-rule-for-presentations/` (clean URL `/10-20-30-rule-for-presentations`) |

## Supporting research (per draft)

`onpage-strategy-*.md` · `brand-voice-profile.md` · `branded-lexicon.md` · `content-quality-review.md` · `onpage-serp-primary.json`

## Reproducing a draft (the skill travels with this repo)

The on-page SEO workflow is bundled at **`.claude/skills/on-page-seo-optimization/`**, so it's available wherever this repo is opened (local Claude Code, Claude Code on the web, or Claude Cowork) — not just on one machine.

- **Run it:** in Claude Code, invoke `/on-page-seo-optimization` (or ask for an "on-page optimization" draft), then provide the target URL, primary keyword, and supporting keywords.
- **Firecrawl:** the skill works with either the **Firecrawl CLI** (local) or the **Firecrawl MCP server** (portable, for Cowork / web). See the "Firecrawl access (CLI or MCP)" section in the skill's `SKILL.md`. You only need a `FIRECRAWL_API_KEY` for the MCP path.
- Intermediate research is written to `.firecrawl/` (gitignored); the committed deliverable is each draft's clean-URL folder.
