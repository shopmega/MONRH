import type { Metadata } from "next";
import { IntentPage } from "@/components/intent-page";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Demission Maroc",
  description: "Simulez l'impact financier de votre demission et preparez votre preavis au Maroc.",
  canonicalPath: "/contrat-depart/demission",
});

export default function ContratDepartDemissionPage() {
  return <IntentPage page={INTENT_PAGES["depart-demission"]} />;
}
