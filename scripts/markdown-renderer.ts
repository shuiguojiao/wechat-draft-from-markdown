import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import frontMatter from "front-matter";
import hljs from "highlight.js";
import { marked, Lexer } from "marked";
import juice from "juice";
import { parseFragment, serialize, serializeOuter } from "parse5";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkCjkFriendly from "remark-cjk-friendly";
import remarkStringify from "remark-stringify";

import { buildThemeCss, DEFAULT_STYLE, resolveColorToken, type ThemeStyle } from "./markdown-theme.ts";

export { resolveColorToken } from "./markdown-theme.ts";

export interface ImageInfo {
  placeholder: string;
  localPath: string;
  originalPath: string;
}

export interface RenderResult {
  html: string;
  title: string;
  summary: string;
  author: string;
}

type FrontmatterFields = Record<string, string>;

interface FrontMatterAttributes {
  [key: string]: unknown;
}

interface CalloutToken {
  type: "obsidianCallout";
  raw: string;
  calloutType: string;
  headerLabel: string;
  iconSvg: string;
  inlineTitle?: string;
  tokens: any[];
}

interface HtmlNode {
  nodeName: string;
  tagName?: string;
  childNodes?: HtmlNode[];
}

const CALLOUT_META: Record<string, { label: string; iconSvg: string }> = {
  abstract: {
    label: "Abstract",
    iconSvg:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 3h7l5 5v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M15 3v5h5" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  },
  summary: {
    label: "Summary",
    iconSvg:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 3h7l5 5v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M15 3v5h5" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  },
  tldr: {
    label: "Summary",
    iconSvg:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 3h7l5 5v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M15 3v5h5" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  },
  tip: {
    label: "Tip",
    iconSvg:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 18h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10 22h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 2a7 7 0 0 0-4 12.74c.63.44 1.05 1.1 1.23 1.83l.12.43h5.3l.12-.43c.18-.73.6-1.39 1.23-1.83A7 7 0 0 0 12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  },
  info: {
    label: "Info",
    iconSvg:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 10v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7" r="1.2" fill="currentColor"/></svg>',
  },
  note: {
    label: "Note",
    iconSvg:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 10v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7" r="1.2" fill="currentColor"/></svg>',
  },
  warning: {
    label: "Warning",
    iconSvg:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 4 21 20H3L12 4Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 9v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.1" fill="currentColor"/></svg>',
  },
  success: {
    label: "Success",
    iconSvg:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="m8.5 12.5 2.3 2.3 4.7-5.1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  },
  example: {
    label: "Example",
    iconSvg:
      '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M8 3h7l5 5v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M15 3v5h5" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 13h6M9 17h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  },
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function injectCalloutInlineTitle(html: string, inlineTitle?: string): string {
  if (!inlineTitle) return html;
  const safeTitle = escapeHtml(inlineTitle);
  if (/<p\b[^>]*>/.test(html)) {
    return html.replace(/<p(\b[^>]*)>/, `<p$1><span class="wx-callout-inline-title">${safeTitle}</span>`);
  }
  return `<p><span class="wx-callout-inline-title">${safeTitle}</span></p>${html}`;
}

function stripWrappingParagraph(html: string): string {
  return html.trim().replace(/^<p\b[^>]*>/, "").replace(/<\/p>$/, "").trim();
}

function isElement(node: HtmlNode | undefined, tagName?: string): node is HtmlNode & { tagName: string; childNodes: HtmlNode[] } {
  if (!node || typeof node.tagName !== "string") return false;
  return tagName ? node.tagName === tagName : true;
}

function parseHtmlFragment(html: string): HtmlNode[] {
  return (parseFragment(html).childNodes ?? []) as HtmlNode[];
}

function serializeNodes(nodes: HtmlNode[]): string {
  return nodes.map((node) => serializeOuter(node as any)).join("");
}

function normalizeNodeChildren(parent: HtmlNode, nestedInListItem = false): void {
  if (!parent.childNodes?.length) return;
  const normalized: HtmlNode[] = [];
  for (const child of parent.childNodes) {
    if (isElement(child, "ol") || isElement(child, "ul")) {
      normalized.push(...parseHtmlFragment(renderListNode(child, nestedInListItem)));
      continue;
    }
    normalizeNodeChildren(child, isElement(child, "li"));
    normalized.push(child);
  }
  parent.childNodes = normalized;
}

function renderListNode(listNode: HtmlNode & { tagName: string; childNodes: HtmlNode[] }, nested: boolean): string {
  const ordered = listNode.tagName === "ol";
  const items = (listNode.childNodes ?? []).filter((child) => isElement(child, "li"));
  if (!items.length) return serializeOuter(listNode as any);

  const lines: string[] = [];
  for (const [index, item] of items.entries()) {
    const contentNodes: HtmlNode[] = [];
    const nestedBlocks: string[] = [];

    for (const child of item.childNodes ?? []) {
      if (isElement(child, "ol") || isElement(child, "ul")) {
        nestedBlocks.push(renderListNode(child, true));
        continue;
      }
      normalizeNodeChildren(child, isElement(child, "li"));
      contentNodes.push(child);
    }

    const contentHtml = stripWrappingParagraph(serializeNodes(contentNodes));
    if (contentHtml) {
      const marker = nested ? "" : ordered ? `${index + 1}.` : "•";
      const markerPrefix = marker ? `${marker} ` : "";
      const lineClass = nested ? "wx-callout-list-line wx-callout-list-line-nested" : "wx-callout-list-line";
      lines.push(`<p class="${lineClass}">${markerPrefix}${contentHtml}</p>`);
    }

    if (nestedBlocks.length) {
      lines.push(nestedBlocks.join(""));
    }
  }

  const nestedClass = nested ? " wx-callout-list-nested" : "";
  return `<div class="wx-callout-list${ordered ? " wx-callout-list-ordered" : " wx-callout-list-unordered"}${nestedClass}">${lines.join("")}</div>`;
}

export function normalizeCalloutLists(html: string): string {
  const fragment = parseFragment(html) as HtmlNode;
  normalizeNodeChildren(fragment);
  return serialize(fragment as any);
}

export function stripWrappingQuotes(value: string): string {
  if (!value) return value;
  const doubleQuoted = value.startsWith('"') && value.endsWith('"');
  const singleQuoted = value.startsWith("'") && value.endsWith("'");
  if (doubleQuoted || singleQuoted) {
    return value.slice(1, -1).trim();
  }
  return value.trim();
}

export function parseFrontmatter(content: string): { frontmatter: FrontmatterFields; body: string } {
  try {
    const parsed = frontMatter<FrontMatterAttributes>(content);
    const normalized: FrontmatterFields = {};
    for (const [key, value] of Object.entries(parsed.attributes ?? {})) {
      if (typeof value === "string") normalized[key] = stripWrappingQuotes(value);
      else if (typeof value === "number" || typeof value === "boolean") normalized[key] = String(value);
    }
    return { frontmatter: normalized, body: parsed.body };
  } catch {
    const match = content.match(/^\s*---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!match) return { frontmatter: {}, body: content };
    const frontmatter: FrontmatterFields = {};
    for (const line of match[1]!.split("\n")) {
      const idx = line.indexOf(":");
      if (idx <= 0) continue;
      frontmatter[line.slice(0, idx).trim()] = stripWrappingQuotes(line.slice(idx + 1).trim());
    }
    return { frontmatter, body: match[2]! };
  }
}

export function serializeFrontmatter(frontmatter: FrontmatterFields): string {
  const entries = Object.entries(frontmatter);
  if (!entries.length) return "";
  return `---\n${entries.map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join("\n")}\n---\n`;
}

export function cleanSummaryText(value: string): string {
  return value
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?[a-z][a-z0-9:-]*(?:\s+[^>]*)?>/gi, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function extractTitleFromMarkdown(markdown: string): string {
  const tokens = Lexer.lex(markdown, { gfm: true, breaks: true });
  for (const token of tokens) {
    if (token.type !== "heading") continue;
    if (token.depth !== 1 && token.depth !== 2) continue;
    return stripWrappingQuotes(token.text);
  }
  return "";
}

export function extractSummaryFromBody(body: string, maxLen: number): string {
  const lines = body.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#")) continue;
    if (trimmed.startsWith(">")) continue;
    if (trimmed.startsWith("![")) continue;
    if (trimmed.startsWith("-") || trimmed.startsWith("*")) continue;
    if (/^\d+\./.test(trimmed)) continue;
    const cleanText = cleanSummaryText(
      trimmed
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/\*(.+?)\*/g, "$1")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/`([^`]+)`/g, "$1"),
    );
    if (cleanText.length > 20) {
      return cleanText.length > maxLen ? `${cleanText.slice(0, maxLen - 3)}...` : cleanText;
    }
  }
  return "";
}

export function replaceMarkdownImagesWithPlaceholders(
  markdown: string,
  prefix = "WECHATIMGPH_",
): { markdown: string; images: ImageInfo[] } {
  let index = 0;
  const images: ImageInfo[] = [];
  let rewritten = markdown.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g, (_m, _alt, src) => {
    const placeholder = `${prefix}${++index}`;
    images.push({
      placeholder,
      localPath: "",
      originalPath: src,
    });
    return placeholder;
  });

  rewritten = rewritten.replace(/!\[\[([^\]]+)\]\]/g, (_m, src) => {
    const placeholder = `${prefix}${++index}`;
    images.push({
      placeholder,
      localPath: "",
      originalPath: src,
    });
    return placeholder;
  });

  return { markdown: rewritten, images };
}

export async function resolveContentImages(
  images: ImageInfo[],
  baseDir: string,
): Promise<ImageInfo[]> {
  return images.map((image) => {
    const originalPath = image.originalPath.trim();
    if (/^https?:\/\//i.test(originalPath)) {
      return {
        ...image,
        localPath: originalPath,
      };
    }
    const normalized = originalPath.split("|")[0]!.trim();
    return {
      ...image,
      localPath: path.resolve(baseDir, normalized),
      originalPath: normalized,
    };
  });
}

function preprocessCjkEmphasis(markdown: string): string {
  const processor = unified().use(remarkParse).use(remarkCjkFriendly);
  const tree = processor.parse(markdown);
  const extractText = (node: any): string => {
    if (node.type === "text") return node.value;
    if (node.type === "inlineCode") return `\`${node.value}\``;
    if (node.children) return node.children.map(extractText).join("");
    return "";
  };
  const visit = (node: any, parent?: any, index?: number) => {
    if (node.children) {
      for (let i = 0; i < node.children.length; i++) visit(node.children[i], node, i);
    }
    if (node.type === "strong" && parent && typeof index === "number") {
      parent.children[index] = { type: "html", value: `<strong>${extractText(node)}</strong>` };
    }
    if (node.type === "emphasis" && parent && typeof index === "number") {
      parent.children[index] = { type: "html", value: `<em>${extractText(node)}</em>` };
    }
  };
  visit(tree);
  const result = unified().use(remarkStringify).stringify(tree);
  return result.replace(/^(\s*>\s*)\\\[!([A-Za-z0-9_-]+)\]/gm, "$1[!$2]");
}

function createCalloutExtension() {
  return {
    extensions: [
      {
        name: "obsidianCallout",
        level: "block" as const,
        start(src: string) {
          return src.match(/^>\s*\[![A-Za-z0-9_-]+\]/m)?.index;
        },
        tokenizer(this: any, src: string): CalloutToken | undefined {
          const first = src.match(/^>\s*\[!([A-Za-z0-9_-]+)\](?:[+-])?\s*(.*)(?:\n|$)/);
          if (!first) return;
          const lines = src.split("\n");
          const rawLines: string[] = [];
          const bodyLines: string[] = [];
          for (const line of lines) {
            if (!line.startsWith(">")) break;
            rawLines.push(line);
            bodyLines.push(line.replace(/^>\s?/, ""));
          }
          const raw = rawLines.join("\n");
          const calloutType = first[1]!.toLowerCase();
          const firstTitle = first[2]!.trim();
          const remainingBody = bodyLines.slice(1).join("\n").trim();
          const tokens = this.lexer.blockTokens(remainingBody);
          const meta = CALLOUT_META[calloutType] ?? {
            label: calloutType.charAt(0).toUpperCase() + calloutType.slice(1),
            iconSvg:
              '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 10v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7" r="1.2" fill="currentColor"/></svg>',
          };
          return {
            type: "obsidianCallout",
            raw,
            calloutType,
            headerLabel: meta.label,
            iconSvg: meta.iconSvg,
            inlineTitle: firstTitle || undefined,
            tokens,
          };
        },
        renderer(this: any, token: CalloutToken) {
          const parsed = this.parser.parse(token.tokens ?? []);
          const inner = normalizeCalloutLists(parsed);
          const displayLabel = token.inlineTitle || token.headerLabel;
          return `<section class="wx-callout wx-callout-${token.calloutType}"><div class="wx-callout-title"><span class="wx-callout-icon" aria-hidden="true">${token.iconSvg}</span><span class="wx-callout-label">${displayLabel}</span></div><div class="wx-callout-body">${inner}</div></section>`;
        },
      },
    ],
  };
}

function buildRenderer(citeStatus: boolean) {
  const footnotes: Array<[number, string, string]> = [];
  let footnoteIndex = 0;

  const addFootnote = (title: string, link: string) => {
    const existing = footnotes.find(([, , existingLink]) => existingLink === link);
    if (existing) return existing[0];
    footnotes.push([++footnoteIndex, title, link]);
    return footnoteIndex;
  };

  const renderer = {
    heading({ tokens, depth }: any) {
      const text = this.parser.parseInline(tokens);
      return `<h${depth}>${text}</h${depth}>`;
    },
    paragraph({ tokens }: any) {
      const text = this.parser.parseInline(tokens);
      if (!text.trim()) return text;
      if (text.includes("<figure") && text.includes("<img")) return text;
      return `<p>${text}</p>`;
    },
    blockquote({ tokens }: any) {
      const text = this.parser.parse(tokens);
      return `<blockquote>${text}</blockquote>`;
    },
    image({ href, title, text }: any) {
      const titleAttr = title ? ` title="${title}"` : "";
      const caption = text ? `<figcaption>${text}</figcaption>` : "";
      return `<figure><img src="${href}" alt="${text ?? ""}"${titleAttr}>${caption}</figure>`;
    },
    link({ href, title, text, tokens }: any) {
      const parsedText = this.parser.parseInline(tokens);
      if (/^https?:\/\/mp\.weixin\.qq\.com/.test(href)) {
        return `<a href="${href}" title="${title || text}">${parsedText}</a>`;
      }
      if (href === text) return parsedText;
      if (citeStatus) {
        const ref = addFootnote(title || text, href);
        return `<a href="${href}" title="${title || text}">${parsedText}<sup>[${ref}]</sup></a>`;
      }
      return `<a href="${href}" title="${title || text}">${parsedText}</a>`;
    },
    code({ text, lang = "" }: any) {
      const langText = lang.split(" ")[0] || "plaintext";
      const validLang = hljs.getLanguage(langText) ? langText : "plaintext";
      const highlighted = hljs.highlight(text, { language: validLang }).value;
      // WeChat often ignores white-space: pre in article bodies, so preserve
      // line breaks and indentation explicitly in the rendered code HTML.
      const preserveSpaces = (line: string): string => {
        let result = "";
        let inTag = false;
        for (const ch of line) {
          if (ch === "<") { inTag = true; result += ch; }
          else if (ch === ">") { inTag = false; result += ch; }
          else if (ch === " " && !inTag) { result += "&nbsp;"; }
          else { result += ch; }
        }
        return result;
      };
      const wechatCode = highlighted.split("\n").map(preserveSpaces).join("<br>");
      return `<pre class="hljs code__pre"><span class="code__toolbar" aria-hidden="true"><span class="code__dot code__dot-red"></span><span class="code__dot code__dot-yellow"></span><span class="code__dot code__dot-green"></span></span><code class="language-${validLang}">${wechatCode}</code></pre>`;
    },
    codespan({ text }: any) {
      return `<code>${text}</code>`;
    },
    hr() {
      return "<hr>";
    },
  };

  return { renderer, footnotes };
}

function buildFootnotes(footnotes: Array<[number, string, string]>): string {
  if (!footnotes.length) return "";
  const content = footnotes
    .map(([index, title, link]) => `<code>[${index}]</code> ${title}: <i style="word-break:break-all">${link}</i><br>`)
    .join("\n");
  return `<h4>引用链接</h4><p class="footnotes">${content}</p>`;
}

export async function renderMarkdownDocument(
  markdown: string,
  options: { defaultTitle?: string; primaryColor?: string; theme?: string; citeStatus?: boolean; keepTitle?: boolean } = {},
): Promise<{ html: string }> {
  const style: ThemeStyle = {
    ...DEFAULT_STYLE,
    primaryColor: options.primaryColor ?? DEFAULT_STYLE.primaryColor,
  };

  marked.setOptions({
    gfm: true,
    breaks: true,
  });
  marked.use(createCalloutExtension());
  const { renderer, footnotes } = buildRenderer(!!options.citeStatus);
  marked.use({ renderer });

  const preprocessed = preprocessCjkEmphasis(markdown);
  let contentHtml = marked.parse(preprocessed) as string;
  contentHtml = normalizeCalloutLists(contentHtml);
  if (!options.keepTitle) {
    contentHtml = contentHtml.replace(/<h[12][^>]*>[\s\S]*?<\/h[12]>/, "");
  }
  contentHtml = `<section>${contentHtml}${buildFootnotes(footnotes)}</section>`;

  const css = buildThemeCss(style);
  const fullHtml = [
    "<!doctype html>",
    "<html>",
    "<head>",
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    `  <title>${options.defaultTitle ?? "document"}</title>`,
    `  <style>${css}</style>`,
    "</head>",
    "<body>",
    '  <div id="output">',
    contentHtml,
    "  </div>",
    "</body>",
    "</html>",
  ].join("\n");

  const html = juice(fullHtml, {
    inlinePseudoElements: true,
    preserveImportant: true,
    resolveCSSVariables: false,
  });

  return { html };
}

export async function renderMarkdownFileToHtml(
  inputPath: string,
  options: { defaultTitle?: string; primaryColor?: string; theme?: string; citeStatus?: boolean; keepTitle?: boolean } = {},
) {
  const markdown = fs.readFileSync(inputPath, "utf-8");
  const outputPath = path.resolve(path.dirname(inputPath), `${path.basename(inputPath, path.extname(inputPath))}.html`);
  const result = await renderMarkdownDocument(markdown, {
    ...options,
    defaultTitle: options.defaultTitle ?? path.basename(outputPath, ".html"),
  });
  fs.writeFileSync(outputPath, result.html, "utf-8");
  return { ...result, outputPath };
}

export function createTempHtmlPath(): string {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "wechat-article-images-"));
  return path.join(tempDir, "temp-article.html");
}
