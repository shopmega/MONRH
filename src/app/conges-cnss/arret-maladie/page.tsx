import type { Metadata } from "next";
import { IntentPage } from "@/components/intent-page";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";

export const metadata: Metadata = {
  title: "Arret Maladie Maroc",
  description: "Estimez l'impact financier d'un arret maladie et vos droits associes au Maroc.",
};

export default function CongesCnssArretMaladiePage() {
  return <IntentPage page={INTENT_PAGES["arret-maladie"]} />;
}
