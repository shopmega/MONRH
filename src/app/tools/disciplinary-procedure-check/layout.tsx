import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Controle Procedure Disciplinaire",
  description:
    "Verifiez les risques proceduraux d'une sanction disciplinaire avant execution.",
  canonicalPath: "/outils/controle-procedure-disciplinaire",
});

export default function DisciplinaryProcedureCheckLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
