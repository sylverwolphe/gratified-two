# Gratified

A coffee + art experience bringing warmth, creativity, and community.

Part of **Buttercup Destiny**.

## Features

- Interactive drink menu with WebGL liquid shader effects
- Multi-mode particle system (steam, dust, grounds, dots, diamonds)
- Light/dark theme with drink-specific color palettes
- Single-page scroll-snap navigation
- Membership subscription tiers
- Partnership inquiry forms with Google Forms integration
- Responsive design with mobile-optimized navigation

## Tech

- Vanilla JavaScript (modular files in `assets/js/`)
- WebGL shader with frame-rate independent animations and context loss recovery
- Canvas particle system with configurable modes
- CSS custom properties for theming
- No build system required

## Pages

- **Home** - Landing with animated particles
- **Menu** - Drink selection with live shader preview
- **Subscribe** - Membership tiers
- **Partner** - Collaboration opportunities
- **Buttercup** - Parent company

## Drinks

`pour-over` · `cappuccino` · `latte` · `mocha` · `hot-chocolate` · `matcha-latte` · `moroccan-mint` · `something-different`

## Development

```bash
python -m http.server 8000
```

Open `http://localhost:8000`
