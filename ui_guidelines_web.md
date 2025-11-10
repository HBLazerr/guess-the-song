# 🧩 UI System Guidelines for React Web Apps

Use this file as a reference for any AI working on full-stack responsive React web applications. It enforces consistency across components, spacing, layout, and typography. Do **not** override client branding but follow these rules for structure, padding, alignment, and responsive behavior.

---

## 📏 Spacing System

- **Base unit**: `8px`
- **Scale (Tokenized)**:
  ```
  spacing.xs = 4px
  spacing.sm = 8px
  spacing.md = 16px
  spacing.lg = 24px
  spacing.xl = 32px
  spacing.2xl = 48px
  spacing.3xl = 64px
  spacing.4xl = 80px
  ```
- **Rules**:
  - All margin and padding values must use this scale.
  - Inner spacing (padding) ≤ outer spacing (margin).
  - Use larger spacing (`xl+`) to separate major sections.

---

## 🧱 Layout Grid

- **Container max-width**: `1440px` (centered)
- **Grid system**: 12-column responsive grid
- **Column behavior**:
  ```
  columns.desktop = 12
  columns.tablet = 8
  columns.mobile = 4
  ```
- **Gutter size**: `24px`
- **Breakpoints**:
  ```
  breakpoint.sm = 600px
  breakpoint.md = 900px
  breakpoint.lg = 1200px
  breakpoint.xl = 1440px
  ```
- **Responsiveness**:
  - Mobile-first: start with `mobile`, enhance with media queries.
  - Use `flex` or `grid` layout utilities.

---

## 🔠 Typography

- **Font sizes**:
  ```
  text.xs = 12px
  text.sm = 14px
  text.base = 16px
  text.md = 18px
  text.lg = 20px
  text.xl = 24px
  text.2xl = 32px
  text.3xl = 40px
  ```
- **Line height**: `1.5x` font size (round to nearest 4px)
- **Font family**: System font stack or San Francisco if unspecified
- **Weight**:
  ```
  heading = 600 or 700
  body = 400
  subtext = 300
  ```
- Use no more than 2 font families.

---

## 🎛️ Components

- **Reusable components only**: Buttons, Cards, Form Inputs, Modals, etc.
- Use `design tokens` for:
  - Padding
  - Colors
  - Typography
  - Border radius (default: `8px`)
- **States**:
  - All interactive elements must define: `default`, `hover`, `active`, `disabled`
  - Accessibility contrast ratios must pass WCAG AA
  - Use native elements where possible (e.g., `<button>`, `<a>`, `<input>`)

---

## 🎯 Visual Hierarchy

- Define at most 3 levels of content priority:
  - `Primary` – prominent headers, CTAs
  - `Secondary` – support text, links
  - `Tertiary` – metadata, muted labels
- Use `font size`, `weight`, and `color` to create emphasis (never just color alone)
- Use **whitespace** and **alignment** to group related elements
- Squint test: page should scan top-down clearly

---

## 📱 Responsive Behavior

- Use relative units where possible: `%`, `em`, `rem`, `fr`
- Text and layout must adjust fluidly across breakpoints
- Touch targets ≥ `44x44px`
- Test at all breakpoints listed in Layout Grid

---

## 🧪 Implementation Notes

- Enforce vertical rhythm via 8px baseline grid
- All UI elements should align to grid lines
- Don’t hardcode pixel values unless specified in tokens
- AI must not invent new components unless extending an existing system
- Match spacing, alignment, and states 1:1 with system tokens

---

## ✅ Output Expectation

When using this system, all generated components, layouts, and UI patterns should:
- Respect spacing scale
- Align to grid and breakpoints
- Follow visual hierarchy guidelines
- Be responsive and accessible
- Be reusable and token-driven

---

_End of UI Web App Design Guidelines._

_Mobile-specific system to be added separately._

