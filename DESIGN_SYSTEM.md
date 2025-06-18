# MamaStock Design System

This document summarises the visual guidelines used across the front-end.

## Colours

| Token | Hex | Usage |
|-------|-----|-------|
| `mamastock-bg` | `#0f1c2e` | main dark background |
| `mamastock-text` | `#f0f0f5` | default text in dark theme |
| `mamastock-gold` | `#bfa14d` | accent colour and primary buttons |
| `mamastock-gold-hover` | `#a98b39` | hover state for gold elements |

Legacy components may also use camelCase versions of these tokens
(`mamastockBg`, `mamastockText`, etc.). Both spellings are available in
`tailwind.config.cjs` for backward compatibility.

## Typography

The interface uses the **Inter** font via Tailwind CSS. Headings rely on `font-bold` and consistent spacing to create a clear hierarchy.

## Components

- **Buttons** `.btn` / `.btn-primary` use `bg-mamastockGold` with rounded corners and hover transition.
- **Inputs** `.input` have a gold border and transparent background.
- **Badges** `.badge-*` provide role labels with colored backgrounds.
- **Modals** `DialogContent` is styled with `rounded-xl`, `shadow-lg` and fade animations.

### Examples

```html
<button class="btn">Valider</button>
<input class="input" placeholder="Recherche...">
```

Interactive elements should provide an `aria-label` when the purpose is not obvious.

