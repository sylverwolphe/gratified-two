# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gratified is a static coffee + art website for a creative coffee experience brand. Part of the Buttercup Destiny parent company. The site features:
- Interactive drink menu with WebGL liquid shader effects
- Multi-mode canvas particle system (steam, dust, grounds, dots, diamonds)
- Light/dark theme with drink-specific color palettes
- Single-page multi-section layout with scroll-snap navigation
- Partnership inquiry forms with Google Forms integration

## Development

```bash
python -m http.server 8000
# Open http://localhost:8000
```

No build system - vanilla JS served directly.

## Architecture

### JavaScript Structure

The site uses modular JS files in `assets/js/`, loaded in this order:
1. **theme.js** - Light/dark toggle persisted to localStorage
2. **page-theme.js** - Page-specific theming
3. **particles.js** - Multi-mode canvas particle system. Modes: `dots`, `diamonds`, `steam`, `dust`, `grounds`. Global: `setParticleMode()`, `setSpiceColors(drinkId)`
4. **liquid-shader.js** - WebGL shader for coffee cup filling effect. Global: `setLiquidDrink(drinkId)`. Features frame-rate independent transitions, WebGL context loss recovery
5. **menu-loader.js** - Loads drinks from `config/menu-config.json`, renders menu cards
6. **subscribe-loader.js** - Loads subscription tiers from config
7. **drink-detail.js** - Drink detail modal with prev/next navigation
8. **modals.js** - Modal management with focus trapping, ARIA notifications
9. **partners-loader.js** - Loads partner logos from `partners/partners.json`
10. **navigation.js** - Hash-based navigation with IntersectionObserver
11. **particle-controller.js** - Coordinates particle system with page/drink changes

### Configuration Files

- `config/menu-config.json`: Drink menu data (id, name, descriptions, icons as SVG strings)
- `partners/partners.json`: Partner logos configuration

### Drink-Theming System

When a drink is selected, multiple systems update in coordination:
1. `setLiquidDrink(drinkId)` - WebGL shader colors
2. `setSpiceColors(drinkId)` - Particle colors
3. `setDrinkTheme(drinkId)` - UI accent colors via `--theme-accent` CSS variable

Drink IDs: `pour-over`, `cappuccino`, `latte`, `mocha`, `hot-chocolate`, `matcha-latte`, `moroccan-mint`, `something-different`

### Liquid Shader

`assets/js/liquid-shader.js` contains a WebGL shader with:
- `drinkConfigs` object defining colors per drink (baseColor, secondaryColor, flowSpeed, fillLevel)
- Frame-rate independent transitions using delta time
- WebGL context loss/restore handling for mobile
- Zigzag surface waves with depth gradient

### CSS Theming

`assets/styles.css` uses CSS custom properties:
- `--theme-accent`: Current accent color (changes with drink selection)
- `--dusty-rose`, `--deep-burgundy`, `--cream-parchment`, `--charcoal-ink`: Brand colors
- `[data-theme="dark"]` selector for dark mode overrides

### Forms

Partnership/membership forms submit to Google Forms via hidden iframe. See `docs/GOOGLE_FORMS_SETUP.md` for setup instructions.

### Partner Logos

Add logo files to `partners/` folder and configure in `partners/partners.json`. See `partners/README.md`.
