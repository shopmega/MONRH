import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE_PATH, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Simulateurs Droit du Travail",
  description:
    "Simulateurs salariaux et juridiques pour salaries au Maroc: net/brut, licenciement, conges, heures supplementaires, CNSS.",
  alternates: {
    canonical: "/simulate",
  },
  openGraph: {
    title: "Simulateurs",
    description:
      "Estimez vos droits salariaux, indemnites et compensations selon les regles legales.",
    url: "/simulate",
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
        width: 1200,
        height: 630,
        alt: "Simulateurs Salarie.ma",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Simulateurs",
    description:
      "Estimez vos droits salariaux, indemnites et compensations selon les regles legales.",
    images: [absoluteUrl(DEFAULT_OG_IMAGE_PATH)],
  },
};

export default function SimulateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
