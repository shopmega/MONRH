import type { Metadata } from "next";
import { IntentPage } from "@/components/intent-page";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";

export const metadata: Metadata = {
  title: "Demission Maroc",
  description: "Simulez l'impact financier de votre demission et preparez votre preavis au Maroc.",
};

export default function ContratDepartDemissionPage() {
  return <IntentPage page={INTENT_PAGES["depart-demission"]} />;
}
