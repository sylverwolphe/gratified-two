# Config

JSON configuration files for site content. Edit these to update drinks, subscription tiers, and page content without touching code.

## Files

### menu-config.json

Drink menu data loaded by `assets/js/menu-loader.js`.

```json
{
  "drinks": [
    {
      "id": "pour-over",        // Used for theming (CSS, particles, shader)
      "name": "Pour Over",      // Display name
      "shortDesc": "...",       // Card description
      "fullDesc": "...",        // Detail view description
      "extras": ["...", "..."], // Bullet points in detail view
      "icon": "pour-over"       // Key into icons object
    }
  ],
  "icons": {
    "pour-over": "<svg>...</svg>"  // Inline SVG string
  }
}
```

**Drink IDs** must match the theming system:
- `pour-over`, `cappuccino`, `latte`, `mocha`, `hot-chocolate`, `matcha-latte`, `moroccan-mint`, `something-different`

Adding a new drink requires updating color configs in:
- `assets/js/particles.js` - `drinkSpiceColors`, `drinkLogoColorsLight`, `drinkLogoColorsDark`, `drinkNavbarColors`
- `assets/js/liquid-shader.js` - `drinkConfigs`

### subscribe-config.json

Subscription page content loaded by `assets/js/subscribe-loader.js`.

```json
{
  "page": {
    "title": "Subscribe",
    "tagline": "join the journey"
  },
  "joinSection": {
    "title": "Join Us",
    "intro": "..."
  },
  "tiers": [
    {
      "id": "follow",
      "name": "Follow",
      "price": "Free",
      "priceSubtext": "",
      "featured": false,         // Adds visual highlight
      "perks": ["...", "..."],
      "buttons": [
        {
          "text": "Substack",
          "url": "https://...",
          "type": "link",        // "link" or "modal"
          "primary": false
        }
      ]
    }
  ],
  "perksSection": {
    "title": "What You Get",
    "items": [
      {
        "icon": "◆",
        "title": "Community",
        "description": "..."
      }
    ]
  },
  "socialLinks": [
    { "text": "twitter", "url": "https://..." }
  ]
}
```

**Button types:**
- `"type": "link"` - Opens URL in new tab
- `"type": "modal"` - Opens modal by `modalId` (modal must exist in HTML)
