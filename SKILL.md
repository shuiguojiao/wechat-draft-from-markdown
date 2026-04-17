---
name: wechat-draft-from-markdown
description: Convert an Obsidian Markdown note into a WeChat Official Account draft and publish it to the WeChat draft box by API. Use when Codex needs to take a local .md file, keep Markdown as the source of truth, resolve title/summary/cover, generate or replace a WeChat cover in a consistent classroom-editorial style, and publish with WECHAT_APP_ID and WECHAT_APP_SECRET from environment variables or a local .env file.
---

# WeChat Draft From Markdown

Turn one local Markdown note into a WeChat Official Account draft.

This skill is for the full article pipeline:

- take one Markdown file as source of truth
- resolve article metadata
- resolve or generate a cover
- render through the skill's WeChat-safe pipeline
- publish to the draft box by API

This skill is not just a Markdown-to-HTML converter.
Its job is to produce a draft that survives WeChat rendering with minimal surprises.

## Operating Stance

Default posture:

- prefer API publishing
- keep Markdown as the source of truth
- prefer Codex built-in image generation for covers
- prefer reliable WeChat-safe markup over browser-clever markup

Do not switch to browser publishing unless the user explicitly asks.
Do not manually hand-convert Markdown to HTML before publishing.

## Bundled Files

Primary scripts:

- `scripts/publish-draft.sh`
- `scripts/wechat-api.ts`
- `scripts/md-to-wechat.ts`

Style and rendering notes:

- `STYLE_DEV.md`

Before changing layout, theme, renderer behavior, or visual structure:

- read `STYLE_DEV.md`
- update `STYLE_DEV.md` after finishing if you learn a new reliable WeChat constraint or rendering pattern

If `scripts/node_modules` is missing, run:

```bash
cd scripts
npm install
```

## Fast Decision Order

For a normal request, make decisions in this order:

1. Validate that the input is one local Markdown file.
2. Resolve title, summary, and author.
3. Resolve cover, preferring a problem-specific cover for problem articles.
4. Publish by API through the bundled scripts.
5. Report the exact publish result.

## 1. Validate The Input

Accept:

- one local Markdown file

If the user gives:

- plain text
- HTML
- multiple source files without a clear primary file

this skill is not the best fit as-is.
Ask for the Markdown source file or switch workflows.

## 2. Resolve Metadata

Resolve fields in this order.

Title:

- frontmatter `title`
- first H1
- filename

Summary:

- frontmatter `description`
- frontmatter `summary`
- first meaningful paragraph, truncated

Author:

- frontmatter `author`

Rules:

- do not manually build HTML yourself before publishing
- pass the original Markdown file to `wechat-api.ts`
- let the bundled pipeline handle Markdown conversion and inline image upload

## 3. Resolve The Cover

Resolve cover in this order:

- frontmatter `coverImage`
- frontmatter `featureImage`
- frontmatter `cover`
- frontmatter `image`
- article-local `imgs/cover.png`
- another explicit local cover path the user gave
- a newly generated cover

### Cover Policy For Problem Articles

For problem statements, standard solutions, and detailed solutions:

- do not treat an old generic reusable cover as the default final choice
- do generate the cover from the current problem's actual content unless the user explicitly asks to reuse an existing cover
- do make the cover reflect the problem's subject, algorithm, and teaching angle, not just a house style

For problem-solution articles, derive the visual concept from the current article itself, including:

- subject matter or story scene
- key algorithm or data structure
- important state transitions, flow, or decision process
- the teaching focus of the write-up

Do not keep reusing an unrelated old cover just because it already exists nearby.

### Default Cover Direction

Unless the user asks for a different direction, use this visual stance:

- classroom-editorial, not flashy
- light background
- clear information hierarchy
- strong readability at thumbnail size
- clean Chinese typography
- logic-diagram feel: flow boxes, arrows, layered code cards
- suitable for algorithm and problem-solution articles
- simple, intentional composition rather than busy decoration

### Cover Compatibility Rules

WeChat cover slots crop aggressively.
Design covers for crop safety, not for a full uncropped canvas preview.

Use these rules:

- keep headline text inside a safe central band
- avoid placing critical text too close to the top edge
- prefer wide banner-like compositions over poster-like compositions when matching an existing account style
- if the existing local cover convention is already narrow or ultra-wide, match that ratio instead of inventing a new one

If a newly generated cover is needed:

- prefer Codex built-in image generation first
- use Gemini only if built-in generation is unavailable and `GEMINI_API_KEY` exists

Save generated covers next to the article, preferably as:

- `imgs/cover-<slug>.jpg`

Use the chosen file as `--cover` when publishing.
Do not insert the cover into the Markdown body unless the user explicitly asks.

If the user says "use the same style as last time", keep the same overall visual language, but still adapt the actual concept to the current article unless they explicitly want the exact old cover reused.

## 4. Publish By API

Load credentials in this order:

- current shell environment
- `<cwd>/.env`

Required variables:

- `WECHAT_APP_ID`
- `WECHAT_APP_SECRET`

Run:

```bash
bash ./scripts/publish-draft.sh /absolute/path/to/article.md --cover /absolute/path/to/cover.jpg
```

Omit `--cover` only when the Markdown already resolves to a usable cover path.

Optional flags may be forwarded to `wechat-api.ts`, for example:

```bash
bash ./scripts/publish-draft.sh /absolute/path/to/article.md --theme default
bash ./scripts/publish-draft.sh /absolute/path/to/article.md --summary "自定义摘要"
```

## 5. Report The Result

Always report:

- input path
- title
- summary
- cover path used
- returned `media_id`
- draft management link: `https://mp.weixin.qq.com`

## Rendering And WeChat Compatibility

WeChat rendering is the real target.
Normal browser appearance is only a local approximation.

When working on layout or theme:

- prefer stable HTML structure over clever CSS
- prefer real DOM nodes over pseudo-elements for critical visuals
- avoid assuming that browser-perfect output will survive WeChat unchanged

Important known constraints:

- pseudo-elements are not reliable for critical UI details
- spacing often shifts after WeChat rendering
- code blocks are sensitive to padding and line-height
- callout internals are especially fragile
- native lists inside styled containers may render inconsistently in WeChat

If you are changing style or renderer behavior, read `STYLE_DEV.md` first.

## Non-Negotiable Rules

- Keep Markdown as the source of truth.
- Prefer the API route and the bundled scripts.
- Prefer Codex built-in image generation before Gemini.
- Default theme to `default` unless the user asks otherwise.
- If publishing fails because no cover is found, generate or supply a cover and retry once.
- If `.env` is missing required credentials, stop and ask the user to provide `WECHAT_APP_ID` and `WECHAT_APP_SECRET`.
- Do not silently switch publishing methods.
- Do not silently reuse an unrelated cover for a problem article.

## Good Defaults

When the request is underspecified, default to:

- one Markdown file
- API publishing
- `default` theme
- problem-aware classroom-editorial cover
- concise publish report with `media_id`

## What Success Looks Like

A successful run means:

- the Markdown file remains the source of truth
- the cover matches the article rather than generic branding only
- the generated article survives WeChat rendering reasonably well
- the draft is actually created in the WeChat draft box
- the user receives the exact `media_id` and draft link
