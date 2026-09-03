import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { cssColorToHex, Jimp } from "jimp";

const scriptPath = path.resolve("normalize-cover.ts");

async function withTempDir(run) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "wechat-cover-test-"));
  try {
    await run(directory);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

function normalize(...args) {
  return execFileSync("npx", ["-y", "bun", scriptPath, ...args], {
    cwd: path.dirname(scriptPath),
    encoding: "utf8",
  });
}

test("crop mode produces an exact 1200x511 image", async () => {
  await withTempDir(async (directory) => {
    const input = path.join(directory, "square.png");
    const output = path.join(directory, "cover.jpg");
    await new Jimp({ width: 640, height: 640, color: 0x336699ff }).write(input);

    const report = JSON.parse(normalize(input, output, "--mode", "crop"));
    const image = await Jimp.read(output);

    assert.equal(report.outputDimensions, "1200x511");
    assert.equal(image.bitmap.width, 1200);
    assert.equal(image.bitmap.height, 511);
  });
});

test("pad mode preserves the complete source and uses the requested background", async () => {
  await withTempDir(async (directory) => {
    const input = path.join(directory, "portrait.png");
    const output = path.join(directory, "cover.png");
    const background = "#f6f2e8";
    await new Jimp({ width: 200, height: 600, color: 0xcc3300ff }).write(input);

    normalize(input, output, "--mode", "pad", "--background", background);
    const image = await Jimp.read(output);

    assert.equal(image.bitmap.width, 1200);
    assert.equal(image.bitmap.height, 511);
    assert.equal(image.getPixelColor(0, 0), cssColorToHex(background));
  });
});
