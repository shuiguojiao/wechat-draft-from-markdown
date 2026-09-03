#!/usr/bin/env npx -y bun

import fs from "node:fs/promises";
import path from "node:path";
import {
  cssColorToHex,
  HorizontalAlign,
  Jimp,
  JimpMime,
  VerticalAlign,
} from "jimp";

type Mode = "crop" | "pad";
type Focus = "top" | "center" | "bottom";

interface Options {
  inputPath: string;
  outputPath: string;
  width: number;
  height: number;
  mode: Mode;
  focus: Focus;
  background: string;
  quality: number;
}

function usage(): never {
  console.log(`Normalize a generated cover for WeChat without non-uniform stretching.

Usage:
  npx -y bun normalize-cover.ts <input> <output> [options]

Options:
  --mode <crop|pad>       Preserve ratio by cropping overflow or adding background (default: crop)
  --width <pixels>        Output width (default: 1200)
  --height <pixels>       Output height (default: 511)
  --focus <position>      Vertical crop focus: top, center, bottom (default: center)
  --background <color>    Padding color in CSS hex form (default: #f6f2e8)
  --quality <1-100>       JPEG quality (default: 90)
  --help                  Show this help

Output must use .jpg, .jpeg, or .png.`);
  process.exit(0);
}

function positiveInteger(value: string | undefined, flag: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${flag} must be a positive integer`);
  }
  return parsed;
}

function parseArgs(argv: string[]): Options {
  if (argv.includes("--help") || argv.includes("-h")) usage();

  const positional: string[] = [];
  let width = 1200;
  let height = 511;
  let mode: Mode = "crop";
  let focus: Focus = "center";
  let background = "#f6f2e8";
  let quality = 90;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg === "--mode") {
      const value = argv[++i];
      if (value !== "crop" && value !== "pad") throw new Error("--mode must be crop or pad");
      mode = value;
    } else if (arg === "--width") {
      width = positiveInteger(argv[++i], "--width");
    } else if (arg === "--height") {
      height = positiveInteger(argv[++i], "--height");
    } else if (arg === "--focus") {
      const value = argv[++i];
      if (value !== "top" && value !== "center" && value !== "bottom") {
        throw new Error("--focus must be top, center, or bottom");
      }
      focus = value;
    } else if (arg === "--background") {
      background = argv[++i] || "";
      if (!/^#[0-9a-f]{6}$/i.test(background)) {
        throw new Error("--background must be a six-digit CSS hex color such as #f6f2e8");
      }
    } else if (arg === "--quality") {
      quality = positiveInteger(argv[++i], "--quality");
      if (quality > 100) throw new Error("--quality must be between 1 and 100");
    } else if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      positional.push(arg);
    }
  }

  if (positional.length !== 2) {
    throw new Error("Expected an input path and an output path. Use --help for usage.");
  }

  const inputPath = path.resolve(positional[0]!);
  const outputPath = path.resolve(positional[1]!);
  if (inputPath === outputPath) {
    throw new Error("Input and output paths must differ so the generated source is preserved");
  }

  const outputExt = path.extname(outputPath).toLowerCase();
  if (![".jpg", ".jpeg", ".png"].includes(outputExt)) {
    throw new Error("Output must use .jpg, .jpeg, or .png");
  }

  return { inputPath, outputPath, width, height, mode, focus, background, quality };
}

function verticalAlignment(focus: Focus): VerticalAlign {
  if (focus === "top") return VerticalAlign.TOP;
  if (focus === "bottom") return VerticalAlign.BOTTOM;
  return VerticalAlign.MIDDLE;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  await fs.access(options.inputPath);

  const source = await Jimp.read(options.inputPath);
  const inputWidth = source.bitmap.width;
  const inputHeight = source.bitmap.height;
  let normalized;

  if (options.mode === "crop") {
    normalized = source.clone().cover({
      w: options.width,
      h: options.height,
      align: HorizontalAlign.CENTER | verticalAlignment(options.focus),
    });
  } else {
    const scaled = source.clone().scaleToFit({ w: options.width, h: options.height });
    normalized = new Jimp({
      width: options.width,
      height: options.height,
      color: cssColorToHex(options.background),
    });
    normalized.composite(
      scaled,
      Math.floor((options.width - scaled.bitmap.width) / 2),
      Math.floor((options.height - scaled.bitmap.height) / 2),
    );
  }

  await fs.mkdir(path.dirname(options.outputPath), { recursive: true });
  const outputExt = path.extname(options.outputPath).toLowerCase();
  const buffer = outputExt === ".png"
    ? await normalized.getBuffer(JimpMime.png)
    : await normalized.getBuffer(JimpMime.jpeg, { quality: options.quality });
  await fs.writeFile(options.outputPath, buffer);

  const written = await Jimp.read(options.outputPath);
  if (written.bitmap.width !== options.width || written.bitmap.height !== options.height) {
    throw new Error(`Output verification failed: got ${written.bitmap.width}x${written.bitmap.height}`);
  }

  console.log(JSON.stringify({
    input: options.inputPath,
    inputDimensions: `${inputWidth}x${inputHeight}`,
    output: options.outputPath,
    outputDimensions: `${written.bitmap.width}x${written.bitmap.height}`,
    aspectRatio: Number((written.bitmap.width / written.bitmap.height).toFixed(6)),
    mode: options.mode,
    focus: options.focus,
  }, null, 2));
}

main().catch((error) => {
  console.error(`[normalize-cover] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
