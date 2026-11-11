---
name: Warm Editorial Quiet Luxury
colors:
  surface: '#fcf9f4'
  surface-dim: '#dcdad5'
  surface-bright: '#fcf9f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ee'
  surface-container: '#f0ede9'
  surface-container-high: '#ebe8e3'
  surface-container-highest: '#e5e2dd'
  on-surface: '#1c1c19'
  on-surface-variant: '#444748'
  inverse-surface: '#31302d'
  inverse-on-surface: '#f3f0eb'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#855224'
  on-secondary: '#ffffff'
  secondary-container: '#ffbb84'
  on-secondary-container: '#7a491b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#221917'
  on-tertiary-container: '#8f817e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#fcb881'
  on-secondary-fixed: '#2e1500'
  on-secondary-fixed-variant: '#693b0f'
  tertiary-fixed: '#f0dfdb'
  tertiary-fixed-dim: '#d4c3bf'
  on-tertiary-fixed: '#221917'
  on-tertiary-fixed-variant: '#504442'
  background: '#fcf9f4'
  on-background: '#1c1c19'
  surface-variant: '#e5e2dd'
  surface-card: '#FFFFFF'
  surface-sand: '#F5F2EB'
  border-ecru: '#E6E1D8'
  text-muted: '#6B665F'
  status-stock: '#2D5A3D'
typography:
  display-hero:
    fontFamily: Playfair Display
    fontSize: 56px
    fontWeight: '400'
    lineHeight: 64px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Playfair Display
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 44px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 40px
    fontWeight: '400'
    lineHeight: 48px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 36px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 36px
  headline-sm:
    fontFamily: Playfair Display
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-uppercase:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.12em
  price-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 24px
  price-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
---

## Brand & Style

The design system embodies "Warm Minimalist Quiet Luxury"—a design philosophy pairing high-fashion editorial rigor with an organic, tactile sensibility. Drawing inspiration from modern atelier lookbooks and architectural print publications, it rejects the visual clamor, aggressive discount badges, and oversaturated palettes typical of mass e-commerce in favor of generous breathing space, deliberate typography, and tactile warm neutrals.

Targeted at discerning Gen Z and young millennial professionals, the aesthetic evokes serene confidence, unhurried curation, and understated prestige. The visual language balances razor-sharp, architectural container lines with soft organic tones: warm alabaster linen, sand-wash neutrals, deep carbon ink, and whisper-soft blush accents. Interface elements feature ultra-refined 2px to 4px edge radii, strictly reserved full-radius pills for input exploration, and circular visual portals for category discovery.

## Colors

The color palette departs from cold, clinical monochromatic grays, building upon an organic warm-paper foundation reminiscent of heavy linen stock.

- **Canvas & Surface Architecture**: The default application canvas utilizes `#FBF8F3` (Warm Alabaster), creating an unhurried, low-fatigue backdrop. Product cards, active input fields, and catalog viewports sit on `#FFFFFF` (Pure White) for crisp item separation. Dedicated structural modules, order summaries, and sticky cart drawers leverage `#F5F2EB` (Warm Sand) to provide subtle visual docking without heavy contrast.
- **Ink & Typography**: Primary headlines, prices, high-priority interactive states, and solid CTAs utilize `#1A1A1A` (Deep Carbon Ink). Secondary metadata, body copy, care notes, and breadcrumbs rest comfortably in `#6B665F` (Muted Umber), maintaining strict WCAG 2.2 AA accessibility ratios exceeding 11:1 against the canvas.
- **Accents & Borders**: The top announcement bar uses `#FCEAE6` (Soft Blush) to host non-intrusive service messages. Structural dividers, accordion separators, and input borders rely on `#E6E1D8` (Ecru Hairline), preventing dark wireframe effects. `#B87D4B` (Warm Ochre / Caramel) acts as an intentional warm secondary accent for editorial sub-headers and selective interactive highlights. Inventory availability uses `#2D5A3D` (Subdued Forest Green) to indicate healthy stock status with quiet authority.

## Typography

The typography system relies on a dual-type hierarchy: high-contrast editorial serif paired with a technical, high-legibility geometric sans-serif.

- **Editorial Serif (Playfair Display)**: Reserved strictly for hero headlines, major collection titles, and PDP product naming. It creates the bespoke boutique presence characteristic of fashion publications. It should be rendered in regular or medium weights, avoiding heavy bold weights to preserve the delicate stroke contrast and graceful terminals.
- **Functional Sans-Serif (Inter)**: Drives all operational and transactional UI surfaces—including navigation menus, form inputs, sizing matrices, product specifications, and pricing. It ensures crystal-clear readability across smaller viewport matrices.
- **Uppercase Micro-Metadata (`label-uppercase`)**: Applied to category subheads, order stage tags, coupon flags, and announcement banners. These tokens mandate all-caps styling paired with wide tracking (`0.12em`) to evoke curated gallery placards.

## Layout & Spacing

The layout philosophy follows a structured 12-column desktop grid with a strict 4-column mobile adaptation, calibrated for asymmetrical lookbook grids and generous editorial white space.

- **Breakpoints & Grids**:
  - **Desktop (≥ 1024px)**: 12-column fluid grid, max container width of 1440px, 48px outer canvas margin (`margin`), and 24px column gutters (`gutter`).
  - **Tablet (768px – 1023px)**: 8-column fluid grid, 32px outer canvas margins, and 20px column gutters.
  - **Mobile (≤ 767px)**: 4-column fluid grid, 20px outer canvas margins (`margin-mobile`), and 16px gutters (`gutter-mobile`).
- **Vertical Rhythm**: Section gaps require expansive separation (`space-2xl` / 64px) to simulate printed magazine spreads. Micro-spacing between labels and form inputs adheres strictly to `space-xs` (4px) and `space-sm` (8px), maintaining clean cognitive association without visual clutter.

## Elevation & Depth

This design system avoids blurry drop-shadows and synthetic 3D lighting, establishing visual hierarchy through structural planar layering and fine hairlines.

- **Tonal Layering**: Depth is achieved by placing Pure White (`#FFFFFF`) cards and input panels directly upon the Warm Alabaster (`#FBF8F3`) background, with sidebar panels and summary cards resting in Warm Sand (`#F5F2EB`).
- **Hairline Outlines**: Boundaries are articulated via 1px crisp borders in Ecru (`#E6E1D8`). Panels, cards, and input fields never use heavy drop-shadows; they assert their geometry through contrast against adjacent warm tones.
- **Floating Modals & Drawers**: Slide-over elements (e.g., Visual Size Guide, Quick Cart Drawer) introduce a translucent dimming backdrop using `#1A1A1A` at 25% opacity with an immediate 2px backdrop blur. The drawer surface remains completely opaque white with a subtle left hairline border, foregoing aggressive outer ambient shadows to maintain its quiet architectural quality.

## Shapes

The design system employs a calibrated corner language to preserve an architectural, tailored feel:

- **Tailored Soft Radii (2px – 4px)**: Product image cards, promotional panels, structured form fields, buttons, and summary enclosures use crisp, subtle corner rounding (`roundedness: 1`). This prevents the juvenile or playful feel of heavy rounding while softening sharp brutalist angles.
- **Pill Geometry (`rounded-full`)**: Strictly reserved for two interactive elements: the global search input bar in the navigation header and small editorial status badges (e.g., "ORGANIC COTTON", "NEW ARRIVAL").
- **Circular Discovery Portals (`rounded-full`)**: Homepage category links use strict 1:1 aspect ratios with 100% circular masks for model and accessory photography, juxtaposing circular geometry against rectangular editorial photo grids.

## Components

### Buttons & Interactive Controls
- **Primary Action Buttons**: Rendered with solid `#1A1A1A` background, white text in uppercase `label-uppercase` tracking, height of 48px (touch-friendly on mobile), and 2px border radius. Hover state features a subtle transition to `#333333`.
- **Secondary / Ghost Buttons**: Pure White or transparent fill with a 1px `#1A1A1A` border and deep charcoal text.
- **Quantity Steppers (`- 1 +`)**: Inline minimal blocks framed in 1px `#E6E1D8` with neutral center counts, allowing effortless cart adjustment without invasive popups.

### Form Inputs & Text Fields
- **Fields**: Background `#FFFFFF` with 1px border `#E6E1D8`, 44px minimum height, and 2px corner radius. Permanent floating label rendered above the field in `body-sm` (`#6B665F`).
- **Focus State**: The hairline border shifts crisply to `#1A1A1A` without fuzzy colored focus rings.

### Category Quick-Links & Thumbnails
- **Circular Thumbnails**: Framed within an exact 1:1 circular aspect ratio with a delicate, offset Ecru border ring. Below each circle, the category title is displayed in bold Inter body, accompanied by an item count micro-label in `#6B665F`.

### Product Cards
- **Structure**: Clean 3:4 or 4:5 vertical portrait aspect ratio for apparel photography. The media container rests on Pure White without an outer boundary border.
- **Details**: Product title in `body-md` Inter or `headline-sm` Playfair, secondary material notation (e.g., "Organic Cotton — Cream") in `body-sm` `#6B665F`, and the price aligned with clarity in `price-md`.
- **Hover Micro-interaction**: Smooth cross-fade to the secondary fit photo on desktop.

### Size Selector & Swatches
- **Size Chips**: Modular 40x40mm square buttons framed in 1px `#E6E1D8`. Default state: `#FFFFFF` fill with charcoal text. Selected state: solid `#1A1A1A` fill with white text. Disabled/out-of-stock state features a hairline diagonal slash with 40% opacity.
- **Color Swatches**: 24px circles with a 2px inner white gap and a focused active boundary ring.

### Drawers & Accordions
- **Accordion Menus**: Minimalist horizontal lines (`1px solid #E6E1D8`) separating sections (*Fabric & Fit*, *Care Instructions*, *Shipping & Returns*). Title rendered in `body-md` medium weight with a clean `+` / `−` glyph toggle.
- **Size Guide Drawer**: Slides from the right on desktop or bottom-sheet on mobile; features interactive body measurement tables, fit sliders (Tight, True to Size, Relaxed), and clear model dimensions.