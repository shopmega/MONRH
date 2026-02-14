import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Score Risque Conformite",
  description:
    "Score de risque social et checklist de priorites pour renforcer la conformite RH.",
  canonicalPath: "/tools/compliance-risk-score",
});

export default function ComplianceRiskScoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
