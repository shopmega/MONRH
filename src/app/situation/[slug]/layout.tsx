import type { Metadata } from "next";
import situationsData from "@/data/situations.json";
import { buildPageMetadata } from "@/lib/seo";

type SituationHub = {
  title: { fr: string; ar: string };
  description: { fr: string; ar: string };
};

const SITUATION_HUBS = situationsData as Record<string, SituationHub>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const hub = SITUATION_HUBS[slug];
  if (!hub) {
    return {
      title: "Situation non trouvee | SIMPAIE",
      robots: { index: false, follow: false },
    };
  }

  return buildPageMetadata({
    title: `${hub.title.fr} | Situation Travail Maroc`,
    description: hub.description.fr,
    canonicalPath: `/situation/${slug}`,
  });
}

export default function SituationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
