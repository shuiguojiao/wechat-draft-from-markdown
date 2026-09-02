# WeChat Style Development Notes

This note is for future agents changing layout, theme, renderer output, or structural article styling for `wechat-draft-from-markdown`.

Read this file before changing visual output.
If you learn a new WeChat-specific rendering constraint, update this file after finishing.

## What This File Is For

This is not a general CSS note.
It is a compatibility and design memo for one specific pipeline:

- Markdown
- rendered HTML
- `juice` inline CSS
- WeChat draft API
- final WeChat article rendering

The real target is not:

- "looks good in a normal browser"

The real target is:

- "still looks correct after WeChat has rendered it"

## Design Stance

Use a restrained editorial aesthetic.
Do not chase cleverness if it reduces rendering stability.

Bias toward:

- simple hierarchy
- real structure
- conservative spacing
- predictable inline styles
- fewer moving parts

If you must choose between:

- prettier browser-only output
- slightly plainer but more reliable WeChat output

choose the second.

## Non-Negotiable Compatibility Rules

- Prefer stable WeChat-compatible HTML over intricate CSS tricks.
- Prefer real DOM nodes over pseudo-elements for critical visuals.
- Prefer one clear structure over nested wrappers.
- Treat local browser preview as a hint, not as proof.
- Validate with actual WeChat screenshots whenever the user is sensitive to visual fidelity.

## Known Failure Modes

These problems have already happened in real use:

- pseudo-elements disappearing or behaving inconsistently
- spacing becoming looser after WeChat rendering
- code block padding shifting after inline CSS
- local HTML looking fine while the final article looks off
- list structures inside decorated containers becoming unstable
- numbered items in callout cards drifting away from their text
- cover images being cropped differently than expected in WeChat slots
- raw TeX delimiters such as `$...$` appearing because WeChat does not run a page-level math script
- empty formula boxes after the draft API removes SVG glyph IDs and `<use>` references
- callout formulas disappearing even after SVG path and color fixes because WeChat's reader treats inline SVG inside decorated cards differently from ordinary text
- wide tables being forced into the article width until Chinese text wraps one character per line
- long code lines clipping when they neither wrap nor have a horizontal scroll container
- CSS custom properties surviving in inline styles even though the published article no longer has the `<head>` declaration block
- Obsidian wiki-link source and expanded external URLs leaking into the visible article

## Math Rules

Do not publish raw TeX and do not depend on a CDN script or browser-side MathJax startup.
The draft API receives article-body HTML, and WeChat may remove or decline to execute page-level scripts.

Render TeX before publishing as self-contained inline SVG:

- disable the SVG font cache so every glyph is emitted as an explicit `<path>`
- remove fixed SVG widths and keep `max-width: 100%`
- use `currentColor` for formula paths so formulas remain legible in dark mode
- preserve the MathJax inline vertical alignment
- retain the original TeX as an `aria-label`

Do not publish MathJax's cached-glyph form (`<defs><path id="...">` plus `<use href="...">`).
The WeChat draft API keeps the outer SVG but strips the path `id` and the `<use>` reference attribute, leaving a correctly sized but visually empty formula.
Use MathJax SVG output with `fontCache: "none"`, then verify the saved draft contains direct `<path d="...">` nodes and no `<defs>`, `<use>`, or `xlink:href`.

Inside callout bodies, do not use SVG for inline variables, numbers, or short expressions.
Render callout math as ordinary styled text with the original TeX retained in `aria-label`; ordinary text survives WeChat's card and dark-mode transformations more reliably than inline SVG.
Keep SVG math for normal article paragraphs and display equations, where it has been verified to survive.

If rendering fails, show a readable plain-text fallback rather than the original dollar delimiters.

## CSS Inlining Rules

The uploaded article content is extracted from the generated document body.
Do not assume `<head>` styles or root-level CSS variables will accompany it.

When running `juice`:

- resolve CSS custom properties to concrete values
- inspect the extracted article fragment, not only the full preview document
- reject output that still contains `var(--...)` in critical inline styles

## Table Rules

Do not shrink a table with three or more columns to fit the article viewport.
Wrap it in a real `<section>` with horizontal scrolling and give the table a conservative minimum width.

Keep headers on one line where practical and allow normal wrapping in body cells.
The correct mobile fallback is horizontal swipe, not character-by-character vertical text.

## Critical Visual Elements

Do not use pseudo-elements for must-have UI details such as:

- code block traffic-light dots
- icons that must always appear
- decorative markers that affect alignment perception

Use real nodes instead.

Current stable example:

- code block dots are rendered as real elements in `scripts/markdown-renderer.ts`

Do not revert this to `::before`, `::after`, or `box-shadow` tricks.

## Code Block Rules

Code blocks are the most sensitive styled element in the pipeline.
Keep them structurally simple.

Preferred structure:

- one `pre`
- one toolbar node
- one `code`

Rules:

- use real nodes for the three dots
- keep padding conservative
- prefer smaller top padding than you would in browser-only design
- force inner `code` to start on its own line with `display: block`
- avoid extra wrappers unless a concrete bug requires them
- preserve source lines with `white-space: pre`; do not force-wrap or break identifiers
- make the `pre` element horizontally scrollable with touch momentum
- preserve leading indentation explicitly so WeChat cannot collapse it

## Link Rules

Obsidian wiki links are local authoring syntax and must not leak into a WeChat article.
Render `[[target|label]]` as `label` and `[[target]]` as the target basename.

Keep Markdown external links as actual `<a>` elements.
Do not expand every external link into visible `label (full URL)` text; that makes callouts and inline references unreadable on mobile.

## Heading Rules

Avoid pale filled heading pills whose text becomes white under WeChat dark-mode transformations.
Transparent headings with a real border accent retain hierarchy with fewer color-inversion surprises.

When tuning code blocks, change one variable family at a time:

- `pre` padding
- toolbar `top`
- toolbar `left`
- code line-height
- font-size
- border radius

Do not rewrite several spacing variables at once unless the current output is badly broken.

## Callout Rules

Callouts are visually important but structurally fragile in WeChat.

Preferred callout pattern:

- real HTML structure
- fixed header row
- simple border and background treatment
- SVG icons inline when needed
- body text with conservative spacing

Do not assume the Markdown callout title should become the visible card header.
For this skill, the stable house pattern is:

- fixed English type label in the header, such as `Abstract`, `Tip`, `Info`, `Note`
- the Markdown callout title is injected into the body as inline title text

This has proven more stable and visually cleaner than using the Markdown title as the visible header label.

### Lists Inside Callouts

This is a known high-risk area.

Native ordered or unordered lists inside callout containers are not reliable in WeChat.
Numbering and content can separate, drift, or stack in unexpected ways.
Do not rewrite nested list HTML with regex-only matching.
If nested lists must be normalized, walk the parsed HTML tree so parent `li` content is not split from child lists.

Preferred fallback order:

1. Use the simplest possible text structure.
2. If numbering matters, prefer plain paragraph lines such as `1. ...`, `2. ...`, `3. ...`.
3. Only use more structured list layouts if plain lines are insufficient and have been visually verified in WeChat.

Do not assume that local success with `<ol>` or `<ul>` means final WeChat stability.

## Cover Rules

WeChat cover rendering is a compatibility issue as much as a design issue.

Design covers for crop safety:

- use a final `2.35:1` aspect ratio; `1200×511` is the preferred working size
- treat generator-native `21:9` as an intermediate ratio and normalize the exported file before upload
- verify the actual pixel dimensions rather than relying on prompt text
- keep critical text away from the top edge
- keep essential content inside a safe central band
- match the account's established cover ratio when one already exists
- avoid designing covers like tall posters if the account uses wide banners

If a newly generated cover looks good locally but loses text in WeChat, the ratio or text placement is wrong.
Fix the composition, not just the typography.

## Recommended Workflow For Style Changes

For any new style or theme adjustment:

1. Edit the minimum possible surface area.
2. Run a dry-run publish first.
3. Inspect the generated HTML and inline styles.
4. Publish a real draft.
5. Compare the real WeChat result, not only the browser output.
6. If the result is wrong, change one variable family only and republish.

Do not combine large visual redesign, structural renderer changes, and cover experimentation in one pass unless the user explicitly wants broader redesign.

## Verification Checklist

For each style change, verify at minimum:

- heading spacing
- callout structure
- callout body density
- callout numbering alignment if numbered content exists
- code block top spacing
- code block left and right padding
- traffic-light dot visibility
- code line preservation, indentation, start position, and horizontal scrolling
- inline code pill appearance
- inline and block formula rendering, including dark-mode color
- wide-table horizontal scrolling without character-by-character wrapping
- absence of unresolved CSS variables and raw Obsidian wiki links
- cover crop safety in WeChat

If the user is comparing against an older article, prioritize:

- relative spacing
- density
- hierarchy

before color polish.

## Current Stable Defaults

These are the current defaults unless the user explicitly asks otherwise:

- cover style: `classroom-editorial`
- publishing path: API only
- theme file: `scripts/markdown-theme.ts`
- renderer file: `scripts/markdown-renderer.ts`

## Files You Should Usually Touch

Most style work should stay within:

- `scripts/markdown-theme.ts`
- `scripts/markdown-renderer.ts`

Avoid changing publishing or upload scripts for purely visual work unless the real cause is in HTML generation or asset handling.

## After You Finish

If you discover a reliable new WeChat behavior, add it here briefly.

Keep additions practical:

- what broke
- what worked
- what to avoid next time
