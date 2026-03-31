import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Alerte Retard de Salaire",
  description:
    "Evaluation du risque en cas de retards de salaire et recommandations d'actions legales.",
  canonicalPath: "/outils/alerte-retard-salaire",
});

export default function SalaryDelayAlertLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
