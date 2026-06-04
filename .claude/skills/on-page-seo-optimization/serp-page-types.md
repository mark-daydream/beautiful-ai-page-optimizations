# SERP Page-Type Classification

Classify each organic result and the target page before the SERP gate.

## Types

| Type | Signals |
|------|---------|
| `homepage` | Domain root, brand overview, multi-product nav |
| `product` | Single product/feature landing, tool demo |
| `category` | Listing hub, `/category/` paths |
| `blog` | Article, author/date, `/blog/` |
| `landing` | Use-case page (`/sales`, `/enterprise`), single CTA |
| `comparison` | "Best X", "X vs Y", ranked lists |
| `tool` | Interactive generator, free tool UI |
| `local` | Location pages, maps |
| `faq` | Help center article |
| `about` | Company story, team |
| `other` | PDF, forum — exclude from gate count |

## Intent

`informational` | `commercial` | `transactional` | `navigational` | `mixed`

## Gate

- **Pass:** ≥5/10 same type as target
- **Niche:** ≥3/10 with user confirmation

## Examples

- Target `homepage`, SERP mostly `blog` → **fail**
- Target `landing`, SERP mostly `landing`/`product` → **pass**
