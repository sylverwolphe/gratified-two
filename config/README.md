# Config

JSON configuration files for site content. Edit these to update drinks, events, socials, and ordering without touching code.

## Files

### menu-config.json

Drink menu data loaded by `assets/js/menu-loader.js`. Includes pricing and customization options for the ordering flow.

```json
{
  "sizeUpcharges": { "small": 0, "medium": 0.50, "large": 1.00 },
  "addOnPrices": { "extra-shot": 1.00, "vanilla": 0.75 },
  "drinks": [
    {
      "id": "pour-over",
      "name": "Pour Over",
      "shortDesc": "Card description",
      "fullDesc": "Detail view description",
      "extras": ["Bullet 1", "Bullet 2"],
      "image": "config/menu-images/pour-over.jpg",
      "price": 5.00,
      "sizes": ["small", "medium", "large"],
      "milkOptions": [],
      "addOns": ["honey"]
    }
  ]
}
```

### menu-images/

Folder for drink images. Cropped to square via CSS `object-fit: cover`.

### socials-config.json

Social media links loaded by `assets/js/socials-loader.js`.

```json
{
  "socials": [
    { "platform": "Instagram", "handle": "@gratifiedwegrow", "url": "https://..." }
  ]
}
```

### events-config.json

Event cards loaded by `assets/js/events-loader.js`.

```json
{
  "events": [
    {
      "id": "summer-solstice-2026",
      "title": "Summer Solstice",
      "date": "June 21, 2026",
      "time": "2:30 - 3:30 PM",
      "description": "...",
      "rsvpUrl": "",
      "status": "upcoming",
      "badge": "Next Event"
    }
  ]
}
```

Event `status` can be `"upcoming"` (full card) or `"tbd"` (dashed placeholder).

### square-config.json

Client-safe Square configuration. **Never put your access token here** — that goes in the Cloudflare Worker environment variables.

```json
{
  "applicationId": "YOUR_SQUARE_APPLICATION_ID",
  "locationId": "YOUR_SQUARE_LOCATION_ID",
  "workerUrl": "https://api.gratified.com",
  "environment": "sandbox"
}
```

Set `environment` to `"production"` when going live.
