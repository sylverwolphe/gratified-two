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

The main `assets/script.js` contains all core functionality in IIFEs:
- **Menu Config Loader** (top): Loads drinks from `config/menu-config.json`, builds `drinkDetails` object, renders menu cards
- **Partner Logos Loader**: Loads from `partners/partners.json`
- **Particle System**: Multi-mode particles with drink-themed color palettes. Modes: `dots`, `diamonds`, `steam`, `dust`, `grounds`. Global functions: `setParticleMode()`, `setSpiceColors(drinkId)`, `setLogoColor(drinkId)`
- **Liquid Shader**: WebGL shader for coffee cup filling effect. Global: `setLiquidDrink(drinkId)`
- **Theme System**: Light/dark toggle persisted to localStorage. Colors defined in CSS custom properties
- **Page Navigation**: Hash-based navigation with IntersectionObserver for scroll detection

### Modular JS files in `assets/js/`

Alternative modular implementations exist but `assets/script.js` is the active main file. The modular files serve as reference/backup.

### Configuration Files

- `config/menu-config.json`: Drink menu data (id, name, descriptions, icons as SVG strings)
- `partners/partners.json`: Partner logos configuration

### Drink-Theming System

When a drink is selected, multiple systems update in coordination:
1. `setLiquidDrink(drinkId)` - WebGL shader colors
2. `setSpiceColors(drinkId)` - Particle colors
3. `setLogoColor(drinkId)` / `setDrinkTheme(drinkId)` - UI accent colors

Drink IDs: `pour-over`, `cappuccino`, `latte`, `mocha`, `hot-chocolate`, `matcha-latte`, `moroccan-mint`, `something-different`

### CSS Theming

`assets/styles.css` uses CSS custom properties for theming:
- `--theme-accent`: Current accent color
- `--dusty-rose`, `--deep-burgundy`, `--cream-parchment`, `--charcoal-ink`: Brand colors
- `[data-theme="dark"]` selector for dark mode overrides

### Forms

Partnership/membership forms submit to Google Forms via hidden iframe. Configure form IDs and entry IDs in the `googleFormsConfig` object. See `docs/GOOGLE_FORMS_SETUP.md` for setup instructions.

### Partner Logos

Add logo files to `partners/` folder and configure in `partners/partners.json`. See `partners/README.md`.
