---
name: KANUM
colors:
  surface: '#f8f9ff'
  surface-dim: '#d1dbec'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eef4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dfe9fa'
  surface-container-highest: '#d9e3f4'
  on-surface: '#121c28'
  on-surface-variant: '#404944'
  inverse-surface: '#27313e'
  inverse-on-surface: '#eaf1ff'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#9a4614'
  on-secondary: '#ffffff'
  secondary-container: '#fd925b'
  on-secondary-container: '#712c00'
  tertiary: '#3c2b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#584000'
  on-tertiary-container: '#e0a800'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#ffdbcb'
  secondary-fixed-dim: '#ffb693'
  on-secondary-fixed: '#341000'
  on-secondary-fixed-variant: '#7a3000'
  tertiary-fixed: '#ffdf9f'
  tertiary-fixed-dim: '#f9bd22'
  on-tertiary-fixed: '#261a00'
  on-tertiary-fixed-variant: '#5c4300'
  background: '#f8f9ff'
  on-background: '#121c28'
  surface-variant: '#d9e3f4'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 60px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  number-data:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2.5rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style
The design system is a premium educational interface that synthesizes modern engineering aesthetics with Indonesian cultural heritage. The brand personality is professional yet warm, positioning mathematics not as an abstract burden but as a culturally rooted discovery.

The design style is **Minimalist-Premium**, borrowing the high-utility structure of Vercel’s dashboard and the friendly engagement of top-tier ed-tech platforms. It prioritizes clarity, generous whitespace, and a high-end "editorial" layout. Subtle cultural textures (Ammatoa Kajang weaving patterns) are used sparingly as low-opacity background masks to provide depth without cluttering the learning experience.

## Colors
The palette is grounded in the "Tope Le'Leng" aesthetic.
- **Primary (Deep Teal/Emerald):** Used for primary actions, navigation headers, and authoritative UI elements.
- **Secondary (Terracotta):** Used for cultural highlights, secondary call-outs, and grounding elements.
- **Accent (Soft Gold):** Reserved exclusively for gamification, achievement states, streaks, and progress milestones.
- **Neutral:** A high-contrast Slate Gray for body text ensures WCAG AA compliance against the Off-white background.
- **Functional:** Success, Warning, and Error colors are slightly muted to remain harmonious with the earthy primary palette.

## Typography
The system uses a dual-font strategy. **Plus Jakarta Sans** provides a modern, geometric feel for headings that feels approachable. **Inter** is used for all functional and body copy to ensure maximum legibility during long-form math problems.

For all numerical data, scores, and mathematical tables, the `font-feature-settings` for tabular numerals (`tnum`) must be enabled. This ensures vertical alignment of digits, which is critical for mathematical comparison and clarity.

## Layout & Spacing
This design system utilizes a **12-column fluid grid** for desktop and a **4-column grid** for mobile. It follows a modular scale of 8px for spacing units.

- **Desktop:** 24px (1.5rem) gutters with wide side margins to maintain a focused, "Vercel-like" center column for educational content.
- **Mobile:** Margins are reduced to 16px (1rem). 
- **Reflow:** Sidebars on desktop collapse into a bottom navigation bar or a full-screen overlay menu on mobile to maintain one-handed usability.
- **Whitespace:** Use "Stack" spacing liberally. Lessons should never feel cramped; vertical rhythm should favor `stack-lg` between major sections to reduce cognitive load.

## Elevation & Depth
Elevation is handled through **Tonal Layers** and **Low-Contrast Outlines** rather than heavy shadows. This maintains a clean, modern aesthetic.

1.  **Level 0 (Base):** Off-white background (#F9FAFB).
2.  **Level 1 (Cards/Surface):** Pure White (#FFFFFF) with a 1px border in a very light neutral (Slate 100). No shadow.
3.  **Level 2 (Interactive/Floating):** Pure White with a subtle, ultra-diffused shadow: `0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)`.
4.  **Cultural Accents:** Patterns should be applied as a `mask-image` on Level 0 or Level 1 surfaces with an opacity of 3-5%, appearing like a watermark.

## Shapes
The shape language is friendly and modern. The standard `rounded-md` (0.5rem/8px) is used for small components like inputs and badges, while `rounded-lg` (1rem/16px) is the signature radius for primary cards and lesson modules. 

Buttons utilize a `rounded-lg` feel to appear "soft" and clickable, avoiding the harshness of sharp corners while remaining more professional than full-pill shapes.

## Components

### Buttons
- **Primary:** Deep Teal background, white text. Subtle lift on hover.
- **Secondary:** Off-white background with a 1px Terracotta border and Terracotta text.
- **Ghost:** No background or border. Primary Teal text. Used for "Cancel" or less-critical actions.

### Cards
- **Elevated:** White background, 16px radius, subtle shadow. Used for lesson modules.
- **Outlined:** White background, 1px light gray border. Used for dashboard stats and secondary information.

### Inputs
- **Field:** Soft gray border that transitions to a 2px Deep Teal border on focus. Labels sit clearly above the input in `label-md` typography.

### Progress Bars
- **Track:** Soft Teal (10% opacity).
- **Indicator:** Solid Accent Gold or Primary Teal.
- **Micro-interaction:** Use a spring-based transition (stiffness: 300, damping: 30) for filling progress to give a tactile, rewarding feel.

### Cultural Divider
- Instead of a simple line, use a thin horizontal strip (4px height) featuring a repeating geometric Ammatoa pattern in a low-contrast color to separate major page sections.