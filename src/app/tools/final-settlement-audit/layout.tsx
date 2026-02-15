import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Audit Solde de Tout Compte",
  description:
    "Estimation du solde final: indemnites, preavis, conges restants, salaires et heures impayes.",
  canonicalPath: "/outils/audit-solde-tout-compte",
});

export default function FinalSettlementAuditLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
