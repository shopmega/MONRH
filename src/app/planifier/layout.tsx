import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE_PATH, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Planifier — Simulations Financieres et Decisions de Carriere",
  description:
    "Simulateurs financiers pour salaries au Maroc: augmentation salaire, bonus, credit, retraite, freelance vs salarie, auto-entrepreneur.",
  alternates: {
    canonical: "/planifier",
  },
  openGraph: {
    title: "Planifier",
    description:
      "Comparez, decidez, agissez: outils de planification financiere et de carriere pour les salaries marocains.",
    url: "/planifier",
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
        width: 1200,
        height: 630,
        alt: "Planifier — MON RH",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Planifier",
    description:
      "Comparez, decidez, agissez: outils de planification financiere et de carriere pour les salaries marocains.",
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
