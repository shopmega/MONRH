import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE_PATH, absoluteUrl } from "@/lib/seo";
import { SectionLayoutWrapper } from "@/components/section-layout-wrapper";
import { protectionToolsSidebarItems } from "@/lib/content/tools-sidebar";

export const metadata: Metadata = {
  title: "Outils RH et Conformite",
  description:
    "Outils pratiques pour verifier bulletin, retard de salaire et risque de conformite sociale au Maroc.",
  alternates: {
    canonical: "/outils",
  },
  openGraph: {
    title: "Outils RH",
    description:
      "Detection d'anomalies de paie, retards salaire et indicateurs de conformite.",
    url: "/outils",
    images: [
      {
        url: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
        width: 1200,
        height: 630,
        alt: "Outils RH TON RH",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Outils RH",
    description:
      "Detection d'anomalies de paie, retards salaire et indicateurs de conformite.",
    images: [absoluteUrl(DEFAULT_OG_IMAGE_PATH)],
  },
};

export default function ToolsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SectionLayoutWrapper
      indexPath="/outils"
      sidebarProps={{
        title: { fr: "Outils de protection", ar: "أدوات الحماية" },
        items: [...protectionToolsSidebarItems],
        backHref: "/outils",
        backLabel: { fr: "Retour outils", ar: "الرجوع إلى الأدوات" },
      }}
    >
      {children}
    </SectionLayoutWrapper>
  );
}
