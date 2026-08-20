# RobinHood — NGO Sample Website

A complete, static marketing website for a fictional US-based nonprofit, built with plain
HTML, CSS and JavaScript. No build step, no frameworks, no dependencies.

> **This is a demonstration site.** RobinHood Alliance, Inc., its staff, statistics,
> address, phone numbers and financials are all invented sample content created for
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
| `privacy.html` | Privacy Policy | What is collected, what is never done with it, cookies, donor rights, retention |
| `terms.html` | Terms of Use | Permitted use, donation and recurring-gift terms, refunds, IP, liability |
| `accessibility.html` | Accessibility | WCAG 2.1 AA target, what is built in, known limitations, accommodations |
| `donor-rights.html` | Donor Bill of Rights | Ten donor commitments and how the board enforces them |
| `state-disclosures.html` | State Disclosures | Per-state charitable solicitation notices (sample registration numbers) |

## Structure

```
.
├── index.html  about.html  work.html  impact.html
├── get-involved.html  donate.html  contact.html
├── privacy.html  terms.html  accessibility.html
├── donor-rights.html  state-disclosures.html
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
- **Layout** — CSS Grid and Flexbox, 1200px container
- **Accessibility** — skip link, visible focus rings, labelled form fields, ARIA on the
  nav toggle, accordions and live regions, `prefers-reduced-motion` support, print styles

## Responsive behaviour

Breakpoints, largest to smallest:

| Width | What changes |
| --- | --- |
| ≤ 1100px | Footer drops to three columns, brand block spans the row |
| ≤ 1024px | 4-up grids become 2-up; the donation form and its summary stack |
| ≤ 900px | Hamburger drawer replaces the nav; splits become single column; stats go 2-up |
| ≤ 640px | Single-column grids, full-width buttons, 16px form text, 2-up amount chips, badge moves below its image |
| ≤ 420px | Narrower page gutter (18px) |
| ≤ 360px | Remaining 2-up grids collapse to one column |

Notes on the mobile menu:

- The drawer is `position: fixed` inside the header. Any `transform`, `filter`, or
  `backdrop-filter` on an ancestor makes that ancestor the containing block for fixed
  descendants — which would clip the drawer to the header's height. `.site-header`
  therefore turns its `backdrop-filter` **off** at ≤900px. Keep it that way.
- The toggle button sits above the drawer (`z-index: 106` vs `105`) so it stays tappable
  and animates into an X to close. Tapping the backdrop, pressing Escape, choosing a link,
  or resizing past 900px all close it too.
- Tables scroll horizontally inside `.table-wrap`. `setupTableHints()` in `main.js`
  measures each wrapper and reveals its "scroll sideways" hint only when it actually
  overflows, at any width.

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
```

Phone numbers use the 555-01xx range reserved for fictional use.
