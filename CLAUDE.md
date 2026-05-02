# Portfolio Site — Claude Instructions

## Tech stack
Single-page React apps written in plain HTML files using Babel standalone (no build step). All styling is React inline styles. No external CSS framework.

---

## Dark mode architecture

### How it works
Dark mode is implemented via a React Context (`ThemeCtx`) and a `useC()` hook. Every component calls `const C = useC()` at the top to get the right color set — the hook returns `CD` (dark palette) or `C` (light palette) based on context.

### Key files
- `index.html` — main portfolio page, defines the canonical `C`, `CD`, `ThemeCtx`, `useC()` pattern
- `resume.html` — resume page, same dark mode infrastructure
- `projects/user-language-model.html` — project detail page, same infrastructure
- `projects/instagram-latency.html` — project detail page, same infrastructure

### Adding a new page — required checklist

Every new page **must** include all of the following or dark mode will silently break:

1. **Anti-flash script** (place immediately after `</style>` in `<head>`):
   ```html
   <script>(function(){try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark');}catch(e){}})()</script>
   ```

2. **Dark CSS rule** (inside the `<style>` tag):
   ```css
   body { ...; transition: background 0.25s ease, color 0.25s ease; }
   html.dark body { background: #1C1A17; color: #F0EBE1; }
   ```

3. **Dark palette + context** (after `const C = {...}` in the script):
   ```javascript
   const CD = {
     cream: '#1C1A17', creamDark: '#232019', creamCard: '#2B2722',
     white: '#332E28', ink: '#F0EBE1', inkMid: '#B5A99A', inkLight: '#7A7065',
     border: 'rgba(240,235,225,0.09)', borderMid: 'rgba(240,235,225,0.14)',
   };
   const ThemeCtx = React.createContext(false);
   function useC() { const dark = React.useContext(ThemeCtx); return dark ? CD : C; }
   ```

4. **Every component** that references colors must call `const C = useC()` at the top of the function body. This shadows the module-level `C` with the themed version.

5. **Root component** (the one that renders the page) must:
   - Read dark state from localStorage
   - Sync `classList.toggle('dark', dark)` in a `useEffect`
   - Wrap its return in `<ThemeCtx.Provider value={dark}>...</ThemeCtx.Provider>`
   - Use `const T = dark ? CD : C` for its own JSX (cannot use `useC()` — it is the provider)

6. **Nav toggle** must show sun icon in light mode and moon icon in dark mode (see `index.html` for the conditional SVG pattern).

### Special cases

**Dark-background sections** (stats bars, Footer): These use `C.ink` (`#1C1810`) as background in light mode. In dark mode `C.ink` becomes the light text color (`#F0EBE1`), which is wrong for a background. Fix: hardcode the background conditionally:
```javascript
background: dark ? '#0D0B09' : '#1C1810'
```

**Root component color access**: The root component creates `ThemeCtx.Provider` and therefore cannot consume `useC()` (context not yet available to itself). Use `const T = dark ? CD : C` as a local alias instead. Note: `const C = dark ? CD : C` causes a temporal dead zone error — always use a different variable name like `T`.

**Hardcoded `'#fff'` backgrounds**: These need updating for dark mode. Replace with `C.white` (which maps to `#332E28` in dark mode). Examples: floating image cards, PDF viewer container.

**Sections with non-palette (hardcoded) backgrounds**: Any section that uses a hardcoded gradient or color instead of a palette token (e.g., Testimonials) must be made dark-mode aware explicitly. Components that only call `useC()` get the palette but not the raw `dark` boolean — they cannot conditionally swap a hardcoded gradient. The fix: consume the context directly and branch the background:
```javascript
function MySection() {
  const C = useC();
  const dark = React.useContext(ThemeCtx);
  // ...
  background: dark ? 'linear-gradient(...)' : 'linear-gradient(...)'
```
The Testimonials section uses this pattern:
- Light: `linear-gradient(160deg, #c93a06 0%, #decbc3 100%)`
- Dark: `linear-gradient(160deg, #3a1508 0%, #1a1412 100%)`

The card backgrounds inside (`C.cream`, `C.white`) then work correctly in both modes since they invert automatically with the palette.

### Persistence across pages
Preference is saved to `localStorage` under the key `'theme'` with values `'dark'` or `'light'`. The anti-flash script reads this before React loads to prevent a white flash. All pages read and write to the same key, so toggling on any page persists to all others.

### Default mode
Light mode is the default. New visitors with no localStorage entry get `null === 'dark'` → `false` → light mode.

---

## Color palettes

### Light (`C`)
```javascript
cream: '#F4EFE6',  creamDark: '#EDE5D8',  creamCard: '#EAE3D5',
white: '#FFFFFF',  ink: '#1C1810',         inkMid: '#4A3F32',
inkLight: '#8A7E70',  border: 'rgba(28,24,16,0.11)',  borderMid: 'rgba(28,24,16,0.18)'
```

### Dark (`CD`)
```javascript
cream: '#1C1A17',  creamDark: '#232019',  creamCard: '#2B2722',
white: '#332E28',  ink: '#F0EBE1',         inkMid: '#B5A99A',
inkLight: '#7A7065',  border: 'rgba(240,235,225,0.09)',  borderMid: 'rgba(240,235,225,0.14)'
```

Accent color `ACC = '#D95F2B'` is the same in both modes.

---

## Shared utility functions — include on every page

Every page must declare these exact implementations (copy verbatim):

```javascript
function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setWidth(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return width;
}

function hPad(w) {
  if (w < 768) return '20px';
  if (w < 1024) return '32px';
  return 'max(56px, calc((100vw - 1280px) / 2))';
}
```

Include `useInView` on any page with scroll animations:
```javascript
function useInView(ref, threshold = 0.1) {
  const [v, setV] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return v;
}
```

Include `useCounter` on any page with animated stat numbers:
```javascript
function useCounter(target, visible, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let start = null;
    const step = ts => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [visible, target]);
  return val;
}
```

---

## Responsive breakpoints

Consistent across all pages — never deviate:

| Breakpoint | Variable | Value |
|---|---|---|
| Mobile | `isMobile` | `w < 768` |
| Tablet | `isTablet` | `w < 1024` |
| Footer/Testimonials mobile | `isMobile` | `w < 640` |
| Testimonials tablet | `isTablet` | `w < 960` |

The `hPad(w)` function uses these exact same thresholds. Padding tiers: `20px` (mobile) → `32px` (tablet) → `max(56px, calc((100vw - 1280px) / 2))` (desktop, max-width 1280px centered).

---

## Navbar — canonical component

The `Nav` component is identical across all pages except for `navLinks` (relative paths differ by depth). Always includes:
- Fixed position, `zIndex: 200`
- Logo: orange "R" badge (32×32px, `borderRadius: 6`) + "Rohan Vartak" text
- Scroll-triggered frosted-glass effect at `scrollY > 50`: `${C.cream}f0` background + `blur(16px)` backdrop
- Dark mode toggle (moon SVG in dark mode, sun SVG in light mode)
- Desktop: nav links + "Get in Touch" CTA pill (ACC background, `borderRadius: 100`)
- Mobile: hamburger menu toggle instead of nav links + CTA; menu opens below nav

**Nav links (always these 4, in this order):** Projects, Skills, Testimonials, Resume

**Path rules by page depth:**

| Page | Logo href | Nav link base | "Get in Touch" href |
|---|---|---|---|
| `index.html` | `#hero` | `#projects`, `#skills`, etc. | `#contact` |
| `resume.html` | `index.html` | `index.html#projects`, etc. | `index.html#contact` |
| `projects/*.html` | `../index.html` | `../index.html#projects`, etc. | `../index.html#contact` |

Never change the nav link labels or order without updating every page.

---

## Footer — canonical component

Identical across all pages except internal link paths (same depth rules as Nav). Always:
- Uses `dark ? '#0D0B09' : '#1C1810'` background — **never** use `C.ink` for this (it inverts in dark mode)
- 4-column grid on desktop (`2fr 1fr 1fr 1fr`), `1fr 1fr` on mobile with brand spanning full width
- Columns: Brand tagline | Work (Projects, Skills, Resume) | Social (LinkedIn, GitHub) | Contact (Get in Touch)
- Footer text colors use hardcoded `rgba(255,255,255,*)` — not palette tokens — because background is always dark
- Copyright: `Designed by Rohan Vartak © 2025` on left; email link on right

Footer consumes `ThemeCtx` directly via `React.useContext(ThemeCtx)` (not `useC()`) because it needs the raw `dark` boolean for the hardcoded background.

**Exact font sizes — must match across every page:**

| Element | `fontSize` |
|---|---|
| Logo "R" badge | `13` |
| "Rohan Vartak" text | `14` |
| Tagline paragraph | `13` |
| Column label (uppercase) | `10` |
| Column links | `13` |
| Copyright / email | `12` |

When copying the Footer to a new page, copy verbatim — do not resize any of these.

---

## Scroll-to-anchor on page load

`index.html`'s root `App` component includes this effect to handle deep-link navigation (e.g., from project pages back to `index.html#projects`):

```javascript
useEffect(() => {
  const hash = window.location.hash;
  if (!hash) return;
  requestAnimationFrame(() => {
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: 'instant' });
  });
}, []);
```

Include this on any page that may be navigated to with a hash anchor.

---

## Page structure patterns

### Root component naming
- `index.html` → `function App()`
- `resume.html` → `function ResumePage()`
- `projects/*.html` → `function ProjectPage()`

All follow the same ThemeCtx.Provider pattern. The root component uses `const T = dark ? CD : C` (not `useC()`) for its own JSX.

### Sub-page (project detail) anatomy
```
Nav (fixed)
  └─ Hero section: padding '120px 0 0', dot-grid background, ← Back to Projects link, title, tags
  └─ Dark stats strip: background dark ? '#0D0B09' : '#1C1810'
  └─ Content: maxWidth: 860, margin: '0 auto' — Section components with useInView animation
  └─ Footer
```

### Back-navigation links
- Project pages: `← Back to Projects` → `../index.html#projects`
- Resume page: `← Back to Portfolio` → `index.html`

---

## Scroll-reveal animation pattern

All sections and cards use this standard animation on scroll entry (fire once, never reverse):

```javascript
const ref = useRef(null);
const visible = useInView(ref);
// ...
<div ref={ref} style={{
  opacity: visible ? 1 : 0,
  transform: visible ? 'none' : 'translateY(20px)',
  transition: 'all 0.55s ease',
}}>
```

For staggered children (e.g., skill rows), bake the delay into the `transition` string:
```javascript
transition: `all 0.55s ease ${idx * 0.1}s`
```

### Stagger + hover conflict (important)

When a card has **both** a scroll-reveal stagger **and** hover effects, never use `transition: 'all ...'` and never use a separate `transitionDelay` property. The reason: React inline `transitionDelay` applies to the **target** state, so by the time `visible` flips to `true`, the delay is already `'0s'` in the target — the stagger never fires. And `opacity` must be named explicitly or it won't animate at all.

Correct pattern for cards with both concerns:
```javascript
transition: visible
  ? 'background 0.2s, box-shadow 0.2s, transform 0.2s, opacity 0.55s'
  : `background 0.2s, box-shadow 0.2s, transform 0.55s ${delay}s, opacity 0.55s ${delay}s`,
```
This staggered before reveal; after reveal, hover snaps at 0.2s as expected. Do **not** add a separate `transitionDelay` property alongside this.

---

## Reusable UI primitives

### Main page (`index.html`)
```javascript
function Eyebrow({ children, style })  // uppercase label, fontSize 11, letterSpacing 0.18em, C.inkLight
function SectionHeading({ plain, italic, light })  // Playfair 900, clamp(28px, 4vw, 54px), ACC italic span
```

### Project detail pages (`projects/*.html`)
```javascript
function SectionLabel({ children })  // same as Eyebrow
function SectionTitle({ children })  // Playfair 800, clamp(26px, 3vw, 38px)
function SubTitle({ children })      // DM Sans 700, fontSize 17
function Body({ children })          // DM Sans 15, lineHeight 1.75, C.inkMid
function BulletList({ items })       // ACC dot bullets, fontSize 15, C.inkMid
function Section({ children })       // useInView wrapper with border-top + fade-up animation
```

Do not mix primitives across page types — define the appropriate set per page.

---

## Visual design rules

### Dot-grid background
Used in hero sections and project page headers:
```javascript
backgroundImage: `radial-gradient(circle, ${C.border} 1px, transparent 1px)`,
backgroundSize: '28px 28px',
opacity: 0.5,  // (hero section uses 0.6)
pointerEvents: 'none',
```

### Tag / pill style
Consistent across project cards and project page headers:
```javascript
background: `${ACC}15`, color: ACC, border: `1px solid ${ACC}30`,
borderRadius: 100, padding: '5px 14px', fontSize: 12, fontWeight: 500
```

### Card hover effect
Standard pattern for interactive cards:
```javascript
background: hovered ? C.white : C.creamCard,
border: `1px solid ${C.border}`,
borderRadius: 14,
boxShadow: hovered ? '0 12px 40px rgba(28,24,16,0.12)' : '0 2px 8px rgba(28,24,16,0.04)',
transform: hovered ? 'translateY(-3px)' : 'none',
transition: 'background 0.2s, box-shadow 0.2s, transform 0.2s',
```

### Dark stats strip
Inline stats bars (hero, project pages) always use hardcoded dark backgrounds:
```javascript
background: dark ? '#0D0B09' : '#1C1810'
```
Text colors inside are hardcoded: `rgba(255,255,255,0.85)` for values, `rgba(255,255,255,0.4)` for sublabels, `rgba(255,255,255,0.08)` for dividers.

### CTA buttons
Primary (filled): `background: ACC, color: '#fff', borderRadius: 100, padding: '12px 26px', fontSize: 14, fontWeight: 600`
Secondary (outline): `background: transparent, border: '1.5px solid ${C.borderMid}', borderRadius: 100, padding: '11px 24px'`
Hover on primary: `opacity: 0.88`. Hover on secondary: `borderColor: ACC, color: ACC`.

### Typography scale
- Page eyebrow/label: DM Sans 11px, weight 500, `letterSpacing: '0.18em'`, uppercase, `C.inkLight`
- Section heading: Playfair Display 900, `clamp(28px, 4vw, 54px)`, `letterSpacing: '-0.025em'`
- Hero h1: Playfair Display 900, `clamp(49px, 5vw, 67px)` desktop / `clamp(45px, 11vw, 59px)` mobile
- Body: DM Sans 15px, `lineHeight: 1.7`, `C.inkMid`
- Nav links: DM Sans 13px, weight 500, `C.inkMid`, hover → `ACC`

---

## State persistence rules

- **Dark mode**: `localStorage` key `'theme'`, values `'dark'` / `'light'`. Read on init, write on toggle. Persists across all pages automatically.
- **Form state** (Contact): Local React state only — not persisted. `sent` state gates the success message; `sending` state disables the submit button.
- **Nav scroll/menu state**: Local to `Nav` component, resets on navigation (correct behavior).
- No other state is persisted to localStorage.

---

## Orphaned files — do not reference

`style.css` and `projects/projects.css` are leftover from the old portfolio design (purple color scheme, Geist font, old nav class names). No page links to either file. They are safe to delete but currently kept in the repo. Do not import, link, or build on top of these files.
