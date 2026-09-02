import test from "node:test";
import assert from "node:assert/strict";

import {
  cleanSummaryText,
  normalizeCalloutLists,
  preprocessObsidianWikiLinks,
  renderMarkdownDocument,
} from "./markdown-renderer.ts";

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

test("renders inline and block TeX as self-contained SVG without raw dollar delimiters", async () => {
  const markdown = [
    "行内公式 $n \\le 20$。",
    "",
    "$$",
    "rest + mx > 2mx",
    "$$",
  ].join("\n");

  const { html } = await renderMarkdownDocument(markdown, { defaultTitle: "math-test" });
  assert.match(html, /class="wx-math-inline"/);
  assert.match(html, /class="wx-math-block"/);
  assert.match(html, /<svg\b/);
  assert.match(html, /<path\b[^>]*d="/);
  assert.match(html, /currentColor/);
  assert.doesNotMatch(html, /<defs\b/);
  assert.doesNotMatch(html, /<use\b/);
  assert.doesNotMatch(html, /xlink:href=/);
  assert.doesNotMatch(html, /\$n \\le 20\$/);
  assert.doesNotMatch(html, />\$\$</);
});

test("renders formulas inside callouts as ordinary text that survives WeChat dark mode", async () => {
  const markdown = [
    "> [!info] 题目要求",
    "> 有 $n$ 根木棍，至少选择 $3$ 根，对 $998244353$ 取模，示例 $20=(10100)\\_2$。",
  ].join("\n");

  const { html } = await renderMarkdownDocument(markdown, { defaultTitle: "callout-math-test" });
  const callout = html.match(/<section class="wx-callout[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.match(callout, /class="wx-math-text"[^>]*aria-label="n"[^>]*>n<\/span>/);
  assert.match(callout, /class="wx-math-text"[^>]*aria-label="3"[^>]*>3<\/span>/);
  assert.match(callout, /class="wx-math-text"[^>]*aria-label="998244353"[^>]*>998244353<\/span>/);
  assert.match(callout, /class="wx-math-text"[^>]*>20=\(10100\)_2<\/span>/);
  assert.doesNotMatch(callout, /class="wx-math-inline"/);
  assert.match(callout, /aria-label="n"/);
  assert.match(callout, /aria-label="3"/);
  assert.match(callout, /aria-label="998244353"/);
});

test("collapses Obsidian wiki links to their publishable labels", () => {
  const markdown = "知识回顾：[[../../Lectures/Level2/背包问题总结|背包问题总结：选择限制决定循环顺序]]；[[P1164_solution]]。";
  const processed = preprocessObsidianWikiLinks(markdown);
  assert.equal(processed, "知识回顾：背包问题总结：选择限制决定循环顺序；P1164_solution。");
  assert.doesNotMatch(processed, /\[\[/);
});

test("turns an exact backticked Markdown link into a real link", async () => {
  const markdown = "`[P1048 采药](https://www.luogu.com.cn/problem/P1048)`";
  const { html } = await renderMarkdownDocument(markdown, { defaultTitle: "link-test" });
  assert.match(html, /<a href="https:\/\/www\.luogu\.com\.cn\/problem\/P1048"/);
  assert.match(html, />P1048 采药<\/a>/);
  assert.doesNotMatch(html, /\[P1048 采药\]\(/);
});

test("wraps wide tables in a WeChat-safe horizontal scroller", async () => {
  const markdown = [
    "| 适用数据 | 可用方案 | 时间复杂度 | 作用 |",
    "| --- | --- | --- | --- |",
    "| n <= 20 | 枚举集合 | O(2^n) | 验证 |",
  ].join("\n");
  const { html } = await renderMarkdownDocument(markdown, { defaultTitle: "table-test" });
  assert.match(html, /class="wx-table-scroll"/);
  assert.match(html, /overflow-x:\s*scroll/);
  assert.match(html, /min-width:\s*560px/);
});

test("keeps code indentation and uses horizontal scrolling instead of forced wrapping", async () => {
  const markdown = "```cpp\n    int value = some_really_long_function_name(argument_one, argument_two);\n```";
  const { html } = await renderMarkdownDocument(markdown, { defaultTitle: "code-test" });
  assert.match(html, /&nbsp;&nbsp;&nbsp;&nbsp;/);
  assert.match(html, /overflow-x:\s*(?:auto|scroll)\s*!important/);
  assert.match(html, /white-space:\s*pre\s*!important/);
  assert.match(html, /word-break:\s*normal\s*!important/);
  assert.match(html, /overflow-wrap:\s*normal\s*!important/);
  assert.doesNotMatch(html, /white-space:\s*pre-wrap/);
  assert.doesNotMatch(html, /word-break:\s*break-all/);
  assert.doesNotMatch(html, /int&nbsp;value/);
});

test("uses a transparent, border-led h2 that remains legible in dark mode", async () => {
  const { html } = await renderMarkdownDocument("# 标题\n\n## 思路分析", {
    defaultTitle: "heading-test",
    keepTitle: true,
  });
  assert.match(html, /<h2[^>]*border-left:\s*5px solid/);
  assert.match(html, /background:\s*transparent/);
  assert.doesNotMatch(html, /<h2[^>]*linear-gradient/);
  assert.doesNotMatch(html, /var\(--md-/);
});

test("removes TeX delimiters and common commands from automatic summaries", () => {
  const summary = cleanSummaryText("适合 $n\\le 20$，复杂度为 $O(n\\times V)$。");
  assert.equal(summary, "适合 n≤ 20，复杂度为 O(n× V)。");
  assert.doesNotMatch(summary, /\$/);
  assert.doesNotMatch(summary, /\\le|\\times/);
});
