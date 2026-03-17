/**
 * Generates PWA icons (192x192 and 512x512) from public/window.svg.
 * Run: node scripts/generate-pwa-icons.mjs
 * Requires: npm install sharp --save-dev
 */
import { readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const publicDir = join(root, "public");
const svgPath = join(publicDir, "window.svg");

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Run: npm install sharp --save-dev");
    process.exit(1);
  }
  const svg = await readFile(svgPath);
  for (const size of [192, 512]) {
    const out = join(publicDir, `icon-${size}.png`);
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(out);
    console.log("Wrote", out);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
