import type { Metadata } from "next";
import { IntentPage } from "@/components/intent-page";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";

export const metadata: Metadata = {
  title: "Heures Supplementaires Maroc",
  description: "Calculez les heures supplementaires et les majorations legales au Maroc.",
};

export default function CongesCnssHeuresSupplementairesPage() {
  return <IntentPage page={INTENT_PAGES["heures-supplementaires"]} />;
}
