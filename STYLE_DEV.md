# WeChat Style Development Notes

This note is for future agents working on layout or theme changes for `wechat-draft-from-markdown`.

Read this file before changing article styles.
If you discover a new WeChat-specific constraint or a reliable pattern, update this file after finishing.

## Goal

Develop styles that survive the full pipeline:

- Markdown
- rendered HTML
- `juice` inline CSS
- WeChat draft API
- WeChat article rendering

The target is not "looks good in a normal browser".
The target is "looks correct inside WeChat".

## Core Rule

Prefer stable WeChat-compatible HTML and CSS over clever CSS.

If you must choose between:

- prettier browser-only CSS
- slightly simpler but more reliable WeChat output

choose the second.

## Known Pain Points

These issues already happened during real development:

- Pseudo-elements are not reliable for critical visuals in WeChat.
- Fine spacing often changes after WeChat rendering.
- Code blocks are especially sensitive to padding, line-height, and inline layout.
- `juice` inlining helps compatibility, but can change behavior compared with a stylesheet-driven browser preview.
- A style that looks right in generated HTML may still look wrong in the final WeChat article.

## Rules For Critical Visual Elements

Do not use pseudo-elements for must-have UI details such as:

- code block traffic-light dots
- icons that must always appear
- decorative markers that affect spacing perception

Use real DOM nodes instead.

Current example:

- code block dots are rendered as real elements in `scripts/markdown-renderer.ts`
- do not revert them to `::before` or `box-shadow` tricks

## Rules For Code Blocks

Code blocks were the hardest part to tune. Follow these rules:

- Keep the structure simple: one `pre`, one toolbar node, one `code`.
- Use real nodes for the three colored dots.
- Use conservative padding values; WeChat tends to make loose layouts feel even looser.
- Prefer smaller top padding than you would choose for a browser-only design.
- Force code content to start on its own line with `display: block` on the inner `code`.
- Avoid complicated nested wrappers unless necessary.

When adjusting code blocks, change one of these at a time:

- `pre` padding
- toolbar `top`
- toolbar `left`
- code line-height
- font-size
- border radius

Do not change several spacing variables at once unless the current result is completely broken.

## Rules For Callouts

WeChat callouts should use:

- real HTML structure
- fixed header row
- simple borders and backgrounds
- SVG icons inline when needed

Do not assume a Markdown callout title should become the visible card header.
For this skill, the stable pattern is:

- fixed English type label in the header, such as `Abstract`, `Tip`, `Info`, `Note`
- the Markdown callout title is injected into the body as inline title text

This matched the desired house style better than the earlier Chinese-title-in-header version.

## Recommended Development Workflow

For any new style or style change:

1. Edit the minimum possible surface area.
2. Run a dry-run publish first.
3. Inspect the generated HTML, especially inline styles.
4. Publish a real draft.
5. Validate in WeChat screenshots, not only the local HTML.
6. If the result is off, change one variable family only and republish.

Do not do large theme rewrites and visual tuning in the same pass.

## Suggested Verification Checklist

For each style change, verify:

- heading spacing
- callout structure
- code block top spacing
- code block left/right padding
- traffic-light dots visibility
- code content line wrapping / line start position
- inline code pill appearance

If the user is comparing against an older article, prioritize matching:

- relative spacing
- density
- hierarchy

before doing color polish.

## Current Stable Defaults

These are currently treated as stable defaults:

- cover style: `classroom-editorial`
- publishing path: API only
- theme file: `scripts/markdown-theme.ts`
- renderer file: `scripts/markdown-renderer.ts`

## Files To Touch

Most style work should stay within:

- `scripts/markdown-theme.ts`
- `scripts/markdown-renderer.ts`

Avoid changing publishing or upload scripts for pure visual tuning unless the visual problem is actually caused by HTML generation.

## After You Finish

If you learned anything new about WeChat rendering behavior, add a short note here.

Keep updates brief and practical:

- what broke
- what worked
- what to avoid next time
