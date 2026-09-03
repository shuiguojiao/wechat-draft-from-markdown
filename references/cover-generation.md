# WeChat Cover Generation

Read this reference only when generating or replacing a cover.

## Execution Model

Use Codex built-in `image_gen` in generate mode. It is an orchestration tool, not
a local library or command, so local publishing scripts must not try to invoke it.

For a project-bound cover:

1. Read the article and derive one visual concept from its actual content.
2. Shape the prompt with the template below and call built-in `image_gen` once.
3. Inspect the source for subject accuracy, Chinese text, hierarchy, and crop safety.
4. Copy the selected source from Codex's generated-images directory into the workspace.
5. Run `scripts/normalize-cover.ts` to produce an exact `1200×511` JPG or PNG.
6. Inspect the normalized file. If the crop damages text or the main subject, rerun
   normalization in `pad` mode or make one targeted image-generation revision.
7. Pass the normalized file to `publish-draft.sh --cover`.

Do not insert a cover into the Markdown body unless the user explicitly requests it.
Do not overwrite an existing cover unless replacement was explicitly requested; use
a versioned filename otherwise.

## Derive The Concept

For an algorithm or solution article, extract:

- the concrete problem object or story scene
- the algorithm or data structure
- the information being maintained or compressed
- the main teaching insight

Prefer a visual transformation that connects the problem object to the algorithm.
For example, sticks can form a polygon and then flow into a DP-state grid. Avoid a
generic coding illustration that could belong to any article.

## Prompt Template

Use this as adaptable scaffolding, not text that must be copied mechanically:

```text
Use case: scientific-educational
Asset type: WeChat Official Account article cover
Primary request: Create a classroom-editorial cover about <article-specific concept>.
Scene/backdrop: light, uncluttered editorial background with subtle subject-relevant texture.
Subject: <problem object> transforming into or interacting with <algorithm visual metaphor>.
Style/medium: refined flat hand-drawn editorial illustration; crisp shapes; not photorealistic.
Composition/framing: ultra-wide banner designed for a final 2.35:1 crop. Keep every
  essential object and all text within the central 55% of image height. Use generous
  negative space and a clear left-to-right reading order.
Lighting/mood: bright, calm, intelligent, encouraging.
Color palette: warm light background with two or three high-contrast teaching colors.
Text (verbatim): "<short Simplified Chinese title>"
Secondary text (verbatim): "<optional short subtitle>"
Typography: large clean Simplified Chinese; render the supplied strings exactly;
  do not add any other text.
Constraints: readable as a small thumbnail; crop-safe central band; clear hierarchy;
  no logo; no watermark; no copyrighted character; no dense code or formulas.
Avoid: vertical poster composition, busy decoration, text near top or bottom edges,
  garbled Chinese, extra letters, extra numbers.
```

Keep the headline at eight Chinese characters or fewer when possible. Use at most one
short subtitle. If exact in-image text is not essential or fails after one targeted
retry, prefer a text-free illustration rather than publishing garbled text.

## Normalization

The generated aspect ratio is only an intermediate result. The publishing asset must
be exactly `1200×511` by default.

Crop-safe source:

```bash
npx -y bun scripts/normalize-cover.ts source.png cover.jpg --mode crop
```

Source whose edges contain important content:

```bash
npx -y bun scripts/normalize-cover.ts source.png cover.jpg \
  --mode pad --background '#f6f2e8'
```

Never resize width and height independently. `crop` preserves scale and removes only
overflow; `pad` preserves the complete source and adds background space.

## Fallback Boundary

If built-in `image_gen` fails or is unavailable, stop and report it. Offer an external
image API only as an explicitly selected fallback with credentials configured outside
the skill. Do not depend on the legacy `xiaohu-wechat-cover` configuration or its
missing generator script.
