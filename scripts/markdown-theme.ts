export const COLOR_PRESETS: Record<string, string> = {
  blue: "#0F4C81",
  green: "#1C7C54",
  vermilion: "#C75146",
  yellow: "#C69026",
  purple: "#6C5CE7",
  sky: "#00B4D8",
  rose: "#D16D9E",
  olive: "#718355",
  black: "#172033",
  gray: "#6B7280",
  pink: "#D63384",
  red: "#B42318",
  orange: "#D97706",
};

export interface ThemeStyle {
  primaryColor: string;
  fontFamily: string;
  fontSize: string;
}

export const DEFAULT_STYLE: ThemeStyle = {
  primaryColor: COLOR_PRESETS.blue,
  fontFamily:
    '-apple-system-font,BlinkMacSystemFont,"Helvetica Neue","PingFang SC","Hiragino Sans GB","Microsoft YaHei UI","Microsoft YaHei",Arial,sans-serif',
  fontSize: "16px",
};

export function resolveColorToken(value?: string): string | undefined {
  if (!value) return undefined;
  return COLOR_PRESETS[value] ?? value;
}

export function buildThemeCss(style: ThemeStyle): string {
  return `
:root {
  --md-primary-color: ${style.primaryColor};
  --md-font-family: ${style.fontFamily};
  --md-font-size: ${style.fontSize};
  --md-text: #31415f;
  --md-title: #172033;
  --md-soft-bg: #f7fbff;
  --md-card-bg: #fbfdff;
  --md-card-border: rgba(15, 76, 129, 0.12);
}

body {
  margin: 0;
  padding: 24px;
  background: #ffffff;
}

#output {
  max-width: 860px;
  margin: 0 auto;
  font-family: var(--md-font-family);
  font-size: var(--md-font-size);
  line-height: 1.85;
  text-align: left;
  color: var(--md-text);
}

#output section > :first-child {
  margin-top: 0 !important;
}

h1 {
  display: block;
  padding: 0 0 0.55em;
  border-bottom: 3px solid rgba(15, 76, 129, 0.14);
  margin: 0.4em 0 1.2em;
  color: var(--md-title);
  font-size: calc(var(--md-font-size) * 1.65);
  font-weight: 800;
  letter-spacing: 0.04em;
  text-align: left;
  line-height: 1.28;
}

h1::after {
  content: "";
  display: block;
  width: 5.2em;
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--md-primary-color), rgba(15, 76, 129, 0.25));
  margin-top: 0.7em;
}

h2 {
  display: inline-block;
  padding: 0.48em 0.9em;
  margin: 3.2em 0 1.25em;
  color: var(--md-title);
  background: linear-gradient(180deg, #eef5fb, #e6f0f8);
  border: 1px solid var(--md-card-border);
  border-radius: 14px;
  box-shadow: 0 8px 22px rgba(15, 76, 129, 0.08);
  font-size: calc(var(--md-font-size) * 1.18);
  font-weight: 800;
  text-align: left;
}

h3 {
  padding-left: 12px;
  border-left: 4px solid var(--md-primary-color);
  margin: 2.1em 0 0.8em;
  color: #21304d;
  font-size: calc(var(--md-font-size) * 1.1);
  font-weight: 800;
  line-height: 1.35;
}

h4, h5, h6 {
  margin: 1.8em 0 0.5em;
  color: var(--md-primary-color);
  font-size: calc(var(--md-font-size) * 1);
  font-weight: 700;
}

p {
  margin: 1.15em 0;
  letter-spacing: 0.03em;
  color: var(--md-text);
  line-height: 1.9;
}

blockquote {
  margin: 1.25em 0;
  padding: 1.05em 1.1em;
  border: 1px solid var(--md-card-border);
  border-radius: 16px;
  color: #2d3b57;
  background: #fafcff;
  box-shadow: 0 6px 18px rgba(16, 42, 67, 0.05);
}

blockquote > p {
  margin: 0;
}

.wx-callout {
  margin: 1.25em 0;
  padding: 1.05em 1.15em 1.08em;
  border-radius: 18px;
  border: 1px solid rgba(214, 224, 236, 0.88);
  background: #fcfdff;
  box-shadow: 0 4px 14px rgba(148, 163, 184, 0.06);
}

.wx-callout-title {
  display: block;
  font-size: 0.95em;
  font-weight: 600;
  letter-spacing: 0;
  margin-bottom: 0.72em;
}

.wx-callout-icon {
  display: inline-block;
  align-items: center;
  justify-content: center;
  width: 1.08em;
  height: 1.08em;
  vertical-align: -0.16em;
  margin-right: 0.38em;
}

.wx-callout-icon svg {
  display: block;
  width: 100%;
  height: 100%;
}

.wx-callout-label {
  font-size: 1em;
  font-weight: 600;
}

.wx-callout-inline-title {
  font-weight: 600;
  margin-right: 0.2em;
  display: inline-block;
  margin-bottom: 0.18em;
}

.wx-callout-body > :first-child {
  margin-top: 0;
}

.wx-callout-body > :last-child {
  margin-bottom: 0;
}

.wx-callout-body p,
.wx-callout-body li {
  color: #34486d;
}

.wx-callout-body p {
  line-height: 1.76;
}

.wx-callout-body ol,
.wx-callout-body ul {
  margin-top: 0.35em;
}

.wx-callout-list {
  margin-top: 0.28em;
}

.wx-callout-list-line {
  margin: 0.42em 0;
  color: #34486d;
  line-height: 1.82;
}

.wx-callout-abstract, .wx-callout-summary, .wx-callout-tldr {
  border-color: rgba(197, 219, 240, 0.9);
  background: #fcfdff;
}

.wx-callout-abstract .wx-callout-title,
.wx-callout-summary .wx-callout-title,
.wx-callout-tldr .wx-callout-title {
  color: #0ea5e9;
}

.wx-callout-tip, .wx-callout-success {
  border-color: rgba(208, 220, 232, 0.92);
  background: #fcfdff;
}

.wx-callout-tip .wx-callout-title,
.wx-callout-success .wx-callout-title {
  color: #5aaa58;
}

.wx-callout-info, .wx-callout-note {
  border-color: rgba(208, 220, 232, 0.92);
  background: #fcfdff;
}

.wx-callout-info .wx-callout-title,
.wx-callout-note .wx-callout-title {
  color: #76aef5;
}

.wx-callout-warning, .wx-callout-example {
  border-color: rgba(208, 220, 232, 0.92);
  background: #fcfdff;
}

.wx-callout-warning .wx-callout-title,
.wx-callout-example .wx-callout-title {
  color: #7f6a35;
}

pre.code__pre,
.hljs.code__pre {
  position: relative;
  overflow-x: auto;
  border-radius: 20px;
  margin: 1.25em 0 1.55em;
  padding: 1.28em 0.72em 0.5em;
  background: #ffffff;
  color: #2f3747;
  box-shadow: 0 10px 24px rgba(148, 163, 184, 0.08);
  border: 1px solid rgba(220, 228, 239, 0.95);
  line-height: 1.58;
  font-size: 14px;
  font-family: "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", monospace;
}

.code__toolbar {
  position: absolute;
  top: 6px;
  left: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  line-height: 0;
}

.code__dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 999px;
  flex: 0 0 auto;
}

.code__dot-red {
  background: #ef6b5b;
}

.code__dot-yellow {
  background: #f3bf4d;
}

.code__dot-green {
  background: #79c95d;
}

pre.code__pre code,
.hljs.code__pre code {
  display: block;
  background: transparent;
  color: inherit;
  padding: 0;
  border-radius: 0;
  white-space: pre;
  font-family: inherit;
  font-size: 1em;
  line-height: inherit;
}

code {
  font-size: 90%;
  color: #8f2c56;
  background: rgba(137, 76, 109, 0.08);
  padding: 3px 6px;
  border-radius: 8px;
}

.hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-built_in {
  color: #ef4444;
  font-weight: 600;
}

.hljs-meta, .hljs-preprocessor, .hljs-meta .hljs-keyword {
  color: #2563eb;
}

.hljs-string, .hljs-attribute, .hljs-regexp {
  color: #5b6ee1;
}

.hljs-number, .hljs-symbol, .hljs-bullet {
  color: #7c3aed;
}

.hljs-title, .hljs-section, .hljs-selector-id {
  color: #1d4ed8;
}

.hljs-comment, .hljs-quote {
  color: #94a3b8;
}

.hljs-type, .hljs-class .hljs-title {
  color: #0f766e;
}

.hljs-operator, .hljs-punctuation {
  color: #374151;
}

.hljs-variable, .hljs-template-variable {
  color: #1f2937;
}

.hljs-subst, .hljs-params {
  color: #111827;
}

.hljs-function {
  color: #111827;
}

img {
  display: block;
  max-width: 100%;
  margin: 0.25em auto 0.75em;
  border-radius: 18px;
  box-shadow: 0 16px 32px rgba(15, 34, 56, 0.12);
}

figure {
  margin: 1.8em 0;
}

figcaption {
  text-align: center;
  color: #6f7d96;
  font-size: 0.82em;
  margin-top: 0.6em;
}

ol, ul {
  padding-left: 1.1em;
  margin-left: 0;
  color: var(--md-text);
}

li {
  margin: 0.3em 0;
  color: var(--md-text);
  line-height: 1.85;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  border: 1px solid #dde6f0;
  padding: 0.42em 0.6em;
  color: #1f304e;
  background: #eef4fa;
}

td {
  border: 1px solid #dde6f0;
  padding: 0.42em 0.6em;
  color: var(--md-text);
}

hr {
  border: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(15, 76, 129, 0.18), transparent);
  margin: 2em 0;
}

a {
  color: #245d93;
  text-decoration: none;
  border-bottom: 1px solid rgba(36, 93, 147, 0.22);
}

strong {
  color: #15294a;
  font-weight: 700;
}

em {
  font-style: italic;
}

.footnotes {
  margin: 0.6em 0;
  font-size: 0.82em;
  color: #607089;
}
`.trim();
}
