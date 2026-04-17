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

Preferred fallback order:

1. Use the simplest possible text structure.
2. If numbering matters, prefer plain paragraph lines such as `1. ...`, `2. ...`, `3. ...`.
3. Only use more structured list layouts if plain lines are insufficient and have been visually verified in WeChat.

Do not assume that local success with `<ol>` or `<ul>` means final WeChat stability.

## Cover Rules

WeChat cover rendering is a compatibility issue as much as a design issue.

Design covers for crop safety:

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
- code line wrapping and start position
- inline code pill appearance
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
