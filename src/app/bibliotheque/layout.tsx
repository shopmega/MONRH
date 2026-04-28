import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE_PATH, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Guides pratiques RH Maroc",
  description:
    "Articles pratiques sur les droits des salaries au Maroc: contrat, CNSS, conges, licenciement et litiges.",
  alternates: {
    canonical: "/articles",
  },
  openGraph: {
    title: "Guides pratiques RH Maroc",
    description:
      "Guides et articles pratiques sur le droit du travail marocain, mis a jour en continu.",
    url: "/articles",
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
        width: 1200,
        height: 630,
        alt: "Guides pratiques TON RH",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Guides pratiques RH Maroc",
    description:
      "Guides et articles pratiques sur le droit du travail marocain, mis a jour en continu.",
    images: [absoluteUrl(DEFAULT_OG_IMAGE_PATH)],
  },
};

export default function BibliothequeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
