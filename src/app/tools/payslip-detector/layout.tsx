import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Detecteur Bulletin de Paie",
  description:
    "Analyse automatique des ecarts de paie: net, CNSS, IR et coherence du bulletin.",
  canonicalPath: "/tools/payslip-detector",
});

export default function PayslipDetectorLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
