# Template Discovery

Extract the structural contract of the customer template the new page will live in. The contract is the net-new equivalent of the on-page skill's "real live page" — the draft and mockup must reproduce it with the same fidelity the on-page skill demands for an existing page.

## 1. Identify the template family

From `.firecrawl/site-map.json`, group URLs by path pattern and match against the SERP-required page type (Phase 2):

| Required type | Typical URL patterns |
|---|---|
| `blog` | `/blog/`, `/articles/`, `/resources/`, dated slugs |
| `faq` / glossary | `/glossary/`, `/what-is-`, `/help/`, `/learn/` |
| `landing` | `/solutions/`, `/for-`, `/use-cases/`, flat marketing slugs |
| `comparison` | `/vs/`, `/compare/`, `/alternatives/` |
| `product` | `/features/`, `/product/` |
| `tool` | `/tools/`, `/templates/`, `/generator/` |

If multiple families match, prefer the one whose existing pages already rank for adjacent keywords (check the Phase 0 `site:` search). If none match → the SKILL.md "no template" checkpoint.

## 2. Pick 2–3 sibling pages

Representative, not cherry-picked: one recent, one older/high-traffic if known, one mid-pack. Avoid outliers (launch announcements, guest posts, pages with obvious one-off layouts).

## 3. Scrape + verify

```bash
firecrawl scrape "<sibling-1>" "<sibling-2>" "<sibling-3>" # FULL page — never --only-main-content
```

Then **open one sibling in Chrome (claude-in-chrome) and verify against the live DOM** — the same discipline as the on-page skill's Accuracy & scope section. Scrapes silently drop hero/banner/sidebar chrome on Webflow/SPA sites; the DOM is ground truth. Read at minimum: rendered H1 alignment and hero column structure, sidebar presence/side/contents (compare body `h2` x-position vs H1 and footer, per the on-page Tab 2 method), CTA labels and placement, media types, and the JSON-LD `<script type="application/ld+json">` blocks (schema types the family actually uses).

## 4. Write the contract

`.firecrawl/template-contract-{family}.md`:

```markdown
# Template Contract — {family}
**Siblings:** {url-1} · {url-2} · {url-3}
**SERP-required type:** {type} — matched

## Section skeleton (in order, from live DOM)
1. Hero — {centered single-col | two-col text-left} · H1 + subhead + CTA "{verbatim label}" · media: {image|video|none}
2. {section} — {notes: heading level, layout, image side}
...
N. Footer CTA banner — "{verbatim label}"

## Conventions
- Heading depth: H2 sections, H3 subsections (max depth seen: …)
- Word count range across siblings: {min}–{max}
- Sidebar: {none | left 230px: TOC + share | right: author card + related}
- Media cadence: {e.g. one image per H2 | hero only}
- FAQ block: {present on n/3 siblings | absent}
- Author/date metadata: {present? format?}
- Schema types in JSON-LD: {Article, FAQPage, BreadcrumbList, …}
- Internal-link pattern: {e.g. 3–6 links to /features/ and /glossary/ pages}
- URL convention: {/blog/{kebab-slug} — no dates}

## Template chrome (reproduce VERBATIM in draft + mockup)
- {CTA banner copy + label}
- {newsletter box copy}
- {related-posts rail: count + card contents}
```

## Rules

- **Every skeleton section is mandatory in the draft** unless siblings disagree (present on 1/3 → optional, note it).
- **Template chrome copy is `locked`** — reproduced verbatim, tagged "Template (verbatim)" in Tab 1, never keyword-optimized.
- **Never invent a section the family doesn't have** (no bolted-on comparison table because competitors have one — if the coverage outline demands something the template lacks, put it inside an existing section type or flag the tension in the strategy brief).
- The contract, not the competitor pages, decides layout. Competitors decide *topic coverage*; the template decides *shape*.
