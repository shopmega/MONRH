import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE_PATH, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Carriere, salaire et decisions professionnelles",
  description:
    "Comparez vos scenarios de carriere, d'augmentation, de freelance ou de retraite avec une lecture simple pour le Maroc.",
  alternates: {
    canonical: "/carriere",
  },
  openGraph: {
    title: "Carriere et decisions",
    description:
      "Comparez, decidez, agissez: outils de carriere et de projection pour les salaries marocains.",
    url: "/carriere",
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
        width: 1200,
        height: 630,
        alt: "Carriere et decisions MON RH",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Carriere et decisions",
    description:
      "Comparez, decidez, agissez: outils de carriere et de projection pour les salaries marocains.",
    images: [absoluteUrl(DEFAULT_OG_IMAGE_PATH)],
  },
};

export default function PlanifierLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
