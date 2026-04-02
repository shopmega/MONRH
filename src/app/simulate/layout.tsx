import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE_PATH, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Salaire, conges et droits au travail",
  description:
    "Simulateurs salariaux et juridiques pour salaries au Maroc: net/brut, licenciement, conges, heures supplementaires, CNSS.",
  alternates: {
    canonical: "/salaire",
  },
  openGraph: {
    title: "Salaire et droits",
    description:
      "Estimez vos droits salariaux, indemnites et compensations selon les regles legales.",
    url: "/salaire",
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
        width: 1200,
        height: 630,
        alt: "Salaire et droits MON RH",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Salaire et droits",
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
