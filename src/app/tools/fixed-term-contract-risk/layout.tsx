import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Risque de Requalification CDD",
  description:
    "Estimez le risque juridique d'un CDD selon motif, duree, renouvellements et formalisation.",
  canonicalPath: "/outils/risque-requalification-cdd",
});

export default function FixedTermContractRiskLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
