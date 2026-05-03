import { NextResponse } from "next/server";
import { DEFAULT_OG_IMAGE_PATH, absoluteUrl } from "@/lib/seo";
import { listArticles } from "@/lib/server/articles-store";
import { listDocumentTemplates } from "@/lib/server/document-templates-store";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function imageUrl(value: string | undefined) {
  if (!value || value.trim().length === 0) return null;
  return absoluteUrl(value.trim());
}

export async function GET() {
  const [articles, documents] = await Promise.all([listArticles(), listDocumentTemplates()]);
  const entries = new Map<string, { loc: string; images: Set<string> }>();

  function add(path: string, images: Array<string | null>) {
    const loc = absoluteUrl(path);
    const entry = entries.get(loc) ?? { loc, images: new Set<string>() };
    images.filter(Boolean).forEach((url) => entry.images.add(url as string));
    if (entry.images.size > 0) entries.set(loc, entry);
  }

  add("/", [imageUrl(DEFAULT_OG_IMAGE_PATH), imageUrl("/logo.svg"), imageUrl("/icon-512.png")]);
  articles
    .filter((article) => (article.isActive ?? true) && (article.access ?? "public") === "public")
    .forEach((article) => add(article.href, [imageUrl(article.coverImageUrl), imageUrl(article.thumbnailUrl)]));
  documents.forEach((template) => {
    add(template.href, [imageUrl(DEFAULT_OG_IMAGE_PATH)]);
  });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${Array.from(entries.values())
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
${Array.from(entry.images)
  .map((url) => `    <image:image><image:loc>${escapeXml(url)}</image:loc></image:image>`)
  .join("\n")}
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new NextResponse(body, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
