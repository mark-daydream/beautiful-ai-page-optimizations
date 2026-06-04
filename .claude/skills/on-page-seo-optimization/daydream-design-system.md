# Daydream Design System

**Canonical:** [melodic-daifuku-b26a1a.netlify.app](https://melodic-daifuku.b26a1a.netlify.app/)

## Tab styling

| Tab | Styling |
|-----|---------|
| 1 Optimization Draft | Raleway + `daydream-tokens.css` + `tab-draft-styles.css` |
| 2 Mockup | Inter wireframe only + `tab-mockup-styles.css` |
| 3 Appendix | Raleway deck + `bundle-shell.css` |

## Tokens

See [templates/daydream-tokens.css](templates/daydream-tokens.css).

| Token | Hex |
|-------|-----|
| `--pink` | `#FFCADF` |
| `--lavender` | `#EED1FF` |
| `--mint` | `#C3F2D0` |
| `--blue-ice` | `#D0F2FF` |
| `--warm-cream` | `#FFF9F4` |
| `--near-black` | `#232323` |
| `--border` | `#E8E2DC` |
| Gradient | `#C3F2D0` → `#B3EBFF` → `#FEE3CC` |

Optimized blocks use lavender/peach-warm borders per reference HTML.

## Logo

Use inline gradient SVG in topnav (from bundle template). Do not redraw the mark.

## Rules

1. Never substitute generic SaaS styling
2. Reuse class names: `pill-opt`, `ba-grid`, `change-block`, `slide`, `card.client`, `data-table`
3. Tab 2: no Daydream tokens
4. Netlify wins on token values; reference HTML wins on component structure
