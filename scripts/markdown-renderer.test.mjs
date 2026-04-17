import test from "node:test";
import assert from "node:assert/strict";

import { normalizeCalloutLists, renderMarkdownDocument } from "./markdown-renderer.ts";

test("keeps flat ordered lists as numbered paragraph lines", () => {
  const html = normalizeCalloutLists("<ol><li>alpha</li><li>beta</li></ol>");
  assert.match(html, /1\.\s*alpha/);
  assert.match(html, /2\.\s*beta/);
  assert.doesNotMatch(html, /<ol\b/);
});

test("keeps flat unordered lists as bullet paragraph lines", () => {
  const html = normalizeCalloutLists("<ul><li>alpha</li><li>beta</li></ul>");
  assert.match(html, /•\s*alpha/);
  assert.match(html, /•\s*beta/);
  assert.doesNotMatch(html, /<ul\b/);
});

test("flattens nested list items into explanation lines without empty bullets", () => {
  const html = normalizeCalloutLists(
    "<ol><li><code>[P1101](https://example.com)</code><ul><li><strong>适合点</strong>：说明</li></ul></li></ol>",
  );
  assert.match(html, /1\.\s*<code>\[P1101\]\(https:\/\/example\.com\)<\/code>/);
  assert.match(html, /wx-callout-list-line wx-callout-list-line-nested/);
  assert.match(html, /<strong>适合点<\/strong>：说明/);
  assert.doesNotMatch(html, />\s*•\s*<strong>适合点<\/strong>/);
  assert.doesNotMatch(html, /<p class="wx-callout-list-line[^"]*">\s*<\/p>/);
});

test("normalizes nested lists inside callouts without producing orphan bullets", async () => {
  const markdown = [
    "> [!tip] 本节看什么",
    "> 1. 主项",
    ">    - **适合点**：说明文字",
  ].join("\n");

  const { html } = await renderMarkdownDocument(markdown, { defaultTitle: "callout-test" });
  assert.match(html, /1\.\s*主项/);
  assert.match(html, /wx-callout-list-line wx-callout-list-line-nested/);
  assert.match(html, /适合点<\/strong>：说明文字/);
  assert.doesNotMatch(html, />\s*•\s*<strong>适合点<\/strong>/);
  assert.doesNotMatch(html, /<p class="wx-callout-list-line[^"]*">\s*<\/p>/);
});
