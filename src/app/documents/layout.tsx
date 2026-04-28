import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE_PATH, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Modeles et lettres RH Maroc",
  description:
    "Modeles de lettres employe et documents RH conformes au contexte marocain: demission, preavis, reclamations et CNSS.",
  alternates: {
    canonical: "/modeles",
  },
  openGraph: {
    title: "Modeles et lettres",
    description:
      "Modeles de lettres RH au Maroc: reclamation salaire, heures sup, inspection du travail et plus.",
    url: "/modeles",
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
        width: 1200,
        height: 630,
        alt: "Modeles TON RH",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Modeles et lettres",
    description:
      "Modeles de lettres RH au Maroc: reclamation salaire, heures sup, inspection du travail et plus.",
    images: [absoluteUrl(DEFAULT_OG_IMAGE_PATH)],
  },
};

export default function DocumentsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
