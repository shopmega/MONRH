import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Générateur de Contrats de Travail | MONRH",
  description:
    "Créez des contrats de travail CDI et CDD conformes au Code du travail marocain. Générateur déterministe, 8 étapes guidées, clauses personnalisables.",
  keywords: [
    "contrat de travail maroc",
    "CDI maroc",
    "CDD maroc",
    "générateur contrat",
    "contrat travail modèle",
    "code du travail 65-99",
  ],
};

export default function ContratLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
