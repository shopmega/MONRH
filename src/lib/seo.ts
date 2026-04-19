import type { Metadata } from "next";

export const SITE_NAME = "MON RH";
export const SITE_DESCRIPTION =
  "Salaire, CNSS, litiges et modeles RH pour les salaries au Maroc.";
export const DEFAULT_SITE_URL = "https://monrh.vercel.app";
const VERCEL_URL = process.env.VERCEL_URL?.trim();
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (VERCEL_URL ? `https://${VERCEL_URL}` : DEFAULT_SITE_URL);
export const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";
export const DEFAULT_OG_IMAGE_ALT = "MON RH - Salaire, CNSS, litiges et modeles RH au Maroc";

export function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, SITE_URL).toString();
}

export function buildOgImageUrl(title: string, subtitle?: string, siteName?: string) {
  const params = new URLSearchParams({ title: title.slice(0, 90) });
  if (subtitle && subtitle.trim().length > 0) {
    params.set("subtitle", subtitle.slice(0, 140));
  }
  if (siteName && siteName.trim().length > 0) {
    params.set("site", siteName.slice(0, 70));
  }
  return absoluteUrl(`/api/og?${params.toString()}`);
}

export function buildPageMetadata(input: {
  title: string;
  description: string;
  canonicalPath: string;
}): Metadata {
  const imageUrl = buildOgImageUrl(input.title, input.description);
  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: input.canonicalPath,
      languages: {
        "fr-MA": input.canonicalPath,
        "ar-MA": input.canonicalPath,
        "x-default": input.canonicalPath,
      },
    },
    openGraph: {
      type: "website",
      title: input.title,
      description: input.description,
      url: input.canonicalPath,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: input.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [imageUrl],
    },
  };
}
