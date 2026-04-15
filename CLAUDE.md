# Escherize Zone - Project Guidelines

## Design Context

### Users
Developers and tech enthusiasts interested in experimental programming, functional languages, and creative coding. They're browsing during breaks or learning time, looking for interesting technical content with personality. They appreciate when someone takes unconventional approaches to problems.

### Brand Personality
**Voice**: Playful, curious, irreverent

**Emotional goals**: Delight, surprise, "that's clever!" moments. The site should feel like discovering a friend's workshop full of interesting experiments—not a corporate portfolio.

**Content themes**: "Cursed" coding experiments (goto in Clojure), functional programming in unexpected contexts (Gleam on fantasy consoles), developer tooling that sparks joy.

### Aesthetic Direction
**Visual tone**: Playful chaos—bold but not chaotic, energetic but readable

**Theme**: Light mode with warm cream background (`#faf8f5`), ink-like text, warm orange (`#e85d04`) and electric purple (`#8338ec`) accents

**Typography**: Space Grotesk (display, quirky geometric) + Source Sans 3 (body, readable)

**Key visual elements**:
- Offset "playful" shadows (`4px 4px 0`)
- Organic blob shapes for decoration
- Staggered entrance animations
- Bold 2px borders
- Two-color tag system (orange/purple)

**Anti-references** (explicitly avoid):
- AI-generated dark mode aesthetic (cyan accents, glassmorphism, purple-to-blue gradients, glow effects)
- Generic SaaS/startup sites (gradient heroes, stock photos, corporate speak)
- Overly minimal/boring (plain white, no personality)

### Design Principles

1. **Personality over polish**: The design should feel human and intentional, not template-generated. Quirky > safe.

2. **Content matches container**: The playful, experimental content deserves a playful, experimental design. No cognitive dissonance.

3. **Readable chaos**: Bold visual choices that enhance rather than hinder readability. The content is the star.

4. **Warmth over coolness**: Warm cream, orange, and purple instead of cold navy, cyan, and gray. Inviting, not intimidating.

5. **Intentional details**: Every decorative element should feel hand-placed. No generic shadows, no default border-radius, no "good enough."

---

## Technical Context

### Stack
- **Framework**: Astro 5.x (static site generation)
- **Styling**: Scoped CSS with design tokens in BaseLayout.astro
- **Fonts**: Google Fonts (Space Grotesk, Source Sans 3) with preload optimization
- **JavaScript**: Zero client-side JS except for progressive enhancement (lazy loading)

### Design Tokens Location
All design tokens are defined in `src/layouts/BaseLayout.astro` under `:root`. This is the single source of truth for:
- Colors (`--color-*`)
- Typography (`--font-*`, `--font-size-*`)
- Spacing (`--space-*`)
- Border radius (`--radius-*`)
- Shadows (`--shadow-*`)
- Transitions (`--transition-*`, `--ease-out-expo`)

### Performance Considerations
- Fonts are preloaded and loaded non-blocking
- Images use native lazy loading
- CSS containment on post content
- No JS frameworks = fast by default

### Accessibility
- `:focus-visible` styles on all interactive elements
- `@media (prefers-reduced-motion: reduce)` support
- Semantic HTML throughout
- `aria-hidden` on decorative elements
