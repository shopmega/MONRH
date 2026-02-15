import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Feuille de Route Pre-Contentieux",
  description:
    "Plan d'action chronologique avec delais et documents recommandes avant contentieux.",
  canonicalPath: "/outils/feuille-route-pre-contentieux",
});

export default function PreLitigationTimelineLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
