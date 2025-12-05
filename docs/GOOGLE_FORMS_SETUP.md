# Google Forms Setup

## Quick Start

1. Create a Google Form for each form type (Host, Food, Art, Team, Unlimited, Investor)
2. Get the Form ID and Entry IDs
3. Update `googleFormsConfig` in `script.js`

## Getting Form ID

From your Google Form URL:
```
https://docs.google.com/forms/d/e/1FAIpQLSf...ABC123.../viewform
                                    └─── FORM ID ───┘
```

## Getting Entry IDs

1. Open your Google Form
2. Click the 3-dot menu → "Get pre-filled link"
3. Fill in dummy data for each field
4. Click "Get link"
5. The URL contains entry IDs like `entry.123456789=test`

## Field Mapping

Update `script.js` around line 507:

```javascript
'hostForm': {
    formId: '1FAIpQLSf...ABC123...',  // Your form ID
    fields: {
        'name': 'entry.123456789',     // Your entry IDs
        'email': 'entry.234567890',
        'spaceType': 'entry.345678901',
        'location': 'entry.456789012',
        'details': 'entry.567890123'
    },
    successMessage: 'hosting inquiry'
},
```

## Required Google Form Fields

| Form | Fields |
|------|--------|
| Host | Name, Email, Space Type (dropdown), Location, Details |
| Food | Name, Email, Business Name, Food Type (dropdown), Details |
| Art | Name, Email, Art Type (dropdown), Portfolio URL, Details |
| Team | Name, Email, Role (dropdown), Portfolio URL, Details |
| Unlimited | Name, Email, Phone, Source (dropdown) |
| Investor | Name, Email, Phone, Details, LinkedIn URL |

## Dropdown Options

**Space Type:** Coworking Space, Art Studio, Creative Office, Community Space, Other

**Food Type:** Bakery/Pastries, Savory Snacks, Specialty Foods, Small Batch Producer, Other

**Art Type:** Visual Artist, Photographer, Illustrator, Zine Maker, Mixed Media, Other

**Role:** Barista, Event Coordinator, Social Media Creator, Artist/Designer, Other

**Source:** Instagram, Twitter, Friend, Visited a location, Other

## Testing

Forms work in demo mode until configured. Check browser console for submitted data:
```
Google Form not configured for: hostForm {name: "Test", email: "test@test.com", ...}
```
