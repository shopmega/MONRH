import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE_PATH, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Generateurs de Documents",
  description:
    "Modeles de lettres employe et documents RH conformes au contexte marocain: demission, preavis, reclamations et CNSS.",
  alternates: {
    canonical: "/documents",
  },
  openGraph: {
    title: "Documents",
    description:
      "Modeles de lettres RH au Maroc: reclamation salaire, heures sup, inspection du travail et plus.",
    url: "/documents",
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
        width: 1200,
        height: 630,
        alt: "Documents Salarie.ma",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Documents",
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
