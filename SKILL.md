---
name: wechat-draft-from-markdown
description: Convert an Obsidian Markdown note into a WeChat Official Account draft and publish it to the WeChat draft box by API. Use when Codex needs to take a local .md file, keep Markdown as the source of truth, resolve title/summary/cover, generate or replace a WeChat cover in a consistent classroom-editorial style, and publish with WECHAT_APP_ID and WECHAT_APP_SECRET from environment variables or a local .env file.
---

# WeChat Draft From Markdown

## Overview

Turn one Obsidian Markdown file into a WeChat draft.
Prefer API publishing only. Do not switch to browser publishing unless the user explicitly asks.
Prefer Codex built-in image generation for covers.

## Bundled Scripts

Use the scripts bundled with this skill:

- `scripts/publish-draft.sh`
- `scripts/wechat-api.ts`
- `scripts/md-to-wechat.ts`

For layout, theme, or visual-style development, read first:

- `STYLE_DEV.md`

Future agents should:

- read `STYLE_DEV.md` before changing styles
- update `STYLE_DEV.md` after finishing if they learn a new WeChat-specific constraint or reliable pattern

If `scripts/node_modules` is missing, run:

```bash
cd scripts
npm install
```

## Workflow

### 1. Validate the input

Accept one local Markdown file.
If the user gives plain text or HTML, this skill is not the best fit; ask for a Markdown file or switch skills.

### 2. Resolve metadata

Resolve fields in this order:

- Title: frontmatter `title` -> first H1 -> filename
- Summary: frontmatter `description`/`summary` -> first meaningful paragraph, truncated
- Author: frontmatter `author` if present

Do not hand-convert Markdown to HTML before publishing.
Pass the original Markdown file to `wechat-api.ts`; it already handles Markdown conversion and inline image upload.

### 3. Resolve the cover

Resolve cover in this order:

- frontmatter `coverImage` / `featureImage` / `cover` / `image`
- article-local `imgs/cover.png`
- another explicit local cover path the user gave
- a newly generated cover

If a new cover is needed, prefer Codex built-in image generation.
Use Gemini image generation only when built-in generation is unavailable and `GEMINI_API_KEY` is present.

Default cover style:

- classroom-editorial, not flashy
- light background, clear hierarchy, strong readability at thumbnail size
- clean Chinese typography
- logic-diagram feel: flow boxes, arrows, layered code cards
- suitable for algorithm/problem-solution articles
- keep the composition simple and intentional rather than busy

For problem-solution articles, treat this style as the default unless the user explicitly asks for another direction.

Save generated covers next to the article, preferably as:

- `imgs/cover-<slug>.jpg`

Use the generated file as `--cover` when publishing.
Do not insert the cover into the Markdown body unless the user explicitly asks.
If the user says "use the same style as last time", use the default cover style above.

### 4. Publish by API

Load `WECHAT_APP_ID` and `WECHAT_APP_SECRET` from the current shell environment.
If they are absent and `<cwd>/.env` exists, export variables from that `.env` file before publishing.

Run:

```bash
bash ./scripts/publish-draft.sh /absolute/path/to/article.md --cover /absolute/path/to/cover.jpg
```

Omit `--cover` only when the Markdown already has a usable cover path.

Optional extra flags may be forwarded to `wechat-api.ts`, for example:

```bash
bash ./scripts/publish-draft.sh /absolute/path/to/article.md --theme default
bash ./scripts/publish-draft.sh /absolute/path/to/article.md --summary "自定义摘要"
```

### 5. Report the result

Report:

- input path
- title
- summary
- cover path used
- returned `media_id`
- draft management link: `https://mp.weixin.qq.com`

## Rules

- Keep Markdown as the source of truth.
- Prefer the API route and this skill's bundled scripts.
- Prefer Codex built-in image generation first, Gemini second.
- Default theme to `default` when not specified.
- If publishing fails because no cover is found, generate or supply a cover and retry once.
- If `.env` is missing required keys, stop and ask the user to provide `WECHAT_APP_ID` and `WECHAT_APP_SECRET`.
