# RobinHood — NGO Sample Website

A complete, static marketing website for a fictional US-based nonprofit, built with plain
HTML, CSS and JavaScript. No build step, no frameworks, no dependencies.

> **This is a demonstration site.** RobinHood Alliance, Inc., its staff, statistics,
> address, phone numbers, EIN and financials are all invented sample content created for
> design purposes. The donation form validates input in the browser only — it is not
> connected to a payment processor and never submits, stores or transmits anything.

## Run it

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Pages

| File | Page | Contents |
| --- | --- | --- |
| `index.html` | Home | Hero, mission, program preview, FY2025 results, field story, ways to give, newsroom |
| `about.html` | About Us | Mission & vision, values, history timeline, leadership & board, audited financials, donor FAQ |
| `work.html` | Our Work | The six program lines in depth, the stabilize → secure → grow model, regional offices |
| `impact.html` | Our Impact | Outcome table (including missed targets), participant stories, evaluation method, published reports |
| `get-involved.html` | Get Involved | Volunteer roles + interest form, partnership options, events, career openings |
| `donate.html` | Donate | One-time/monthly gift form with card fields, live summary, giving FAQ |
| `contact.html` | Contact | Contact form, direct lines, regional offices, map, emergency assistance info |

## Structure

```
.
├── index.html  about.html  work.html  impact.html
├── get-involved.html  donate.html  contact.html
├── assets/
│   ├── css/style.css     # design system: tokens, components, responsive rules
│   └── js/
│       ├── main.js       # nav, sticky header, counters, accordions, reveal, demo forms
│       └── donate.js     # donation form: amounts, fees, card formatting, validation
└── README.md
```

## Donation form behaviour

Everything happens client-side in `assets/js/donate.js`:

- One-time / monthly toggle, six preset amounts plus a custom amount field
- Gift designation by program line
- Live impact sentence that changes with the amount
- Optional "cover the processing fee" (2.9% + $0.30) reflected in the running total
- Tribute (in honor / in memory) fields that appear on demand
- Card number auto-formatting with brand detection (Visa, Mastercard, Amex, Discover,
  Diners, JCB), Amex-aware grouping and CVC length
- Expiry auto-slash with a future-date check, Luhn checksum on the card number,
  ZIP and required-field validation, with per-field inline error messages
- On submit: `preventDefault()`, then a success panel. Nothing is sent anywhere.

Other forms (newsletter, volunteer interest, contact) are handled by
`setupDemoForms()` in `main.js` and behave the same way.

## Design

- **Palette** — deep forest green (`#123b2e`), gold accent (`#c9a227`), warm cream (`#fbf8f3`)
- **Type** — Source Serif 4 for headings, Inter for interface and body text (Google Fonts,
  with system fallbacks if offline)
- **Layout** — CSS Grid and Flexbox, 1200px container, breakpoints at 1024 / 900 / 640px
- **Accessibility** — skip link, visible focus rings, labelled form fields, ARIA on the
  nav toggle, accordions and live regions, `prefers-reduced-motion` support, print styles

## Images

Photography is loaded from Unsplash's CDN (`images.unsplash.com`) under the
[Unsplash License](https://unsplash.com/license), which permits free commercial and
non-commercial use. All 24 image URLs were verified to resolve. If an image ever fails to
load, `main.js` swaps in a brand gradient so the layout never breaks. To make the site
fully offline, download the images into `assets/img/` and update the `src` attributes.

## Sample contact details used throughout

```
RobinHood Alliance, Inc.
1750 Sherman Street, Suite 900
Denver, CO 80203
(303) 555-0142 · hello@robinhood-alliance.org
EIN 47-1234567 (fictional)
```

Phone numbers use the 555-01xx range reserved for fictional use.
