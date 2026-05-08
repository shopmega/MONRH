/**
 * Generates PWA icons and favicon from public/logo.svg.
 * Run: node scripts/generate-pwa-icons.mjs
 * Requires: npm install sharp --save-dev
 */
import { readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");
const svgPath = join(publicDir, "logo.svg");

function inlineIconColors(svg) {
  return svg
    .toString("utf8")
    .replaceAll("var(--mark-bg)", "#8a5022")
    .replaceAll("var(--mark-bg-2)", "#c6824f")
    .replaceAll("var(--mark-fg)", "#ffffff")
    .replaceAll("var(--mark-line)", "rgba(255, 255, 255, 0.7)");
}

function buildIcoFromPng(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const directory = Buffer.alloc(16);
  directory.writeUInt8(size >= 256 ? 0 : size, 0);
  directory.writeUInt8(size >= 256 ? 0 : size, 1);
  directory.writeUInt8(0, 2);
  directory.writeUInt8(0, 3);
  directory.writeUInt16LE(1, 4);
  directory.writeUInt16LE(32, 6);
  directory.writeUInt32LE(png.length, 8);
  directory.writeUInt32LE(22, 12);

  return Buffer.concat([header, directory, png]);
}

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Run: npm install sharp --save-dev");
    process.exit(1);
  }
  const svg = Buffer.from(inlineIconColors(await readFile(svgPath)));
  for (const size of [192, 512]) {
    const out = join(publicDir, `icon-${size}.png`);
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(out);
    console.log("Wrote", out);
  }

  const faviconPng = await sharp(svg)
    .resize(64, 64)
    .png()
    .toBuffer();
  const favicon = buildIcoFromPng(faviconPng, 64);
  await writeFile(join(root, "src", "app", "favicon.ico"), favicon);
  console.log("Wrote", join(root, "src", "app", "favicon.ico"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
