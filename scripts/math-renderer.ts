import { mathjax } from "@mathjax/src/js/mathjax.js";
import { TeX } from "@mathjax/src/js/input/tex.js";
import { SVG } from "@mathjax/src/js/output/svg.js";
import { liteAdaptor } from "@mathjax/src/js/adaptors/liteAdaptor.js";
import { RegisterHTMLHandler } from "@mathjax/src/js/handlers/html.js";
import "@mathjax/src/js/util/asyncLoad/esm.js";
import "@mathjax/src/js/input/tex/base/BaseConfiguration.js";
import "@mathjax/src/js/input/tex/ams/AmsConfiguration.js";
import "@mathjax/src/js/input/tex/newcommand/NewcommandConfiguration.js";
import "@mathjax/src/js/input/tex/noundefined/NoUndefinedConfiguration.js";
import { MathJaxNewcmFont } from "@mathjax/mathjax-newcm-font/js/svg.js";

const EM = 16;
const EX = 8;
const CONTAINER_WIDTH = 640;

const adaptor = liteAdaptor({ fontSize: EM });
RegisterHTMLHandler(adaptor);

const texInput = new TeX({
  packages: ["base", "ams", "newcommand", "noundefined"],
  formatError(jax: any, error: Error) {
    return jax.formatError(error);
  },
});

const svgOutput = new SVG({
  // WeChat's draft API strips both glyph IDs and <use> href references.
  // Emit every glyph as an explicit <path> so formulas survive sanitization.
  fontCache: "none",
  exFactor: EX / EM,
  fontData: MathJaxNewcmFont,
});

const mathDocument = mathjax.document("", {
  InputJax: texInput,
  OutputJax: svgOutput,
});

const cache = new Map<string, string>();

function makeSvgWechatSafe(svg: string, display: boolean): string {
  let result = svg
    .replace(/\swidth="[^"]*"/i, "")
    .replace(
      /<svg\b([^>]*)>/i,
      (_match, attrs: string) => {
        const originalStyle = attrs.match(/\sstyle="([^"]*)"/i)?.[1] ?? "";
        const originalVerticalAlign = originalStyle.match(/vertical-align\s*:\s*([^;]+)/i)?.[1]?.trim();
        const cleanAttrs = attrs.replace(/\sstyle="[^"]*"/i, "");
        const verticalAlign = display ? "middle" : (originalVerticalAlign ?? "-0.16em");
        return `<svg${cleanAttrs} style="display:${display ? "block" : "inline-block"};max-width:100%;height:auto;color:inherit;vertical-align:${verticalAlign};">`;
      },
    );

  result = result.replace(
    /<g\b([^>]*)>/i,
    (_match, attrs) => `<g${attrs} fill="currentColor" stroke="currentColor" style="fill:currentColor;stroke:currentColor;">`,
  );
  return result;
}

export async function renderMathSvg(source: string, display: boolean): Promise<string> {
  const key = `${display ? "1" : "0"}\u0000${source}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const node = await mathDocument.convertPromise(source, {
    display,
    em: EM,
    ex: EX,
    containerWidth: CONTAINER_WIDTH,
  });
  const outer = adaptor.outerHTML(node);
  const svgMatch = outer.match(/<svg\b[\s\S]*<\/svg>/i);
  if (!svgMatch) throw new Error(`MathJax did not return SVG for: ${source}`);

  const result = makeSvgWechatSafe(svgMatch[0], display);
  cache.set(key, result);
  return result;
}
