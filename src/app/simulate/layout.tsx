import type { Metadata } from "next";
import { DEFAULT_OG_IMAGE_PATH, absoluteUrl } from "@/lib/seo";
import { SectionLayoutWrapper } from "@/components/section-layout-wrapper";
import { simulatorSidebarGroups } from "@/lib/content/simulators-sidebar";

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
  return (
    <SectionLayoutWrapper
      indexPath="/simulateurs"
      sidebarProps={{
        title: { fr: "Simulateurs", ar: "المحاكيات" },
        groups: simulatorSidebarGroups.map(group => ({
          title: group.title,
          items: [...group.items]
        })),
        backHref: "/simulateurs",
        backLabel: { fr: "Retour simulateurs", ar: "الرجوع إلى المحاكيات" },
      }}
    >
      {children}
    </SectionLayoutWrapper>
  );
}
