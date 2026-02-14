import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE_PATH, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Outils RH et Conformite",
  description:
    "Outils pratiques pour verifier bulletin, retard de salaire et risque de conformite sociale au Maroc.",
  alternates: {
    canonical: "/tools",
  },
  openGraph: {
    title: "Outils RH",
    description:
      "Detection d'anomalies de paie, retards salaire et indicateurs de conformite.",
    url: "/tools",
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
        width: 1200,
        height: 630,
        alt: "Outils RH Salarie.ma",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Outils RH",
    description:
      "Detection d'anomalies de paie, retards salaire et indicateurs de conformite.",
    images: [absoluteUrl(DEFAULT_OG_IMAGE_PATH)],
  },
};

export default function ToolsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
