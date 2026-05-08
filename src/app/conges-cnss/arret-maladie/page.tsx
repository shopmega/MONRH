import type { Metadata } from "next";
import { IntentPageStatic } from "@/components/intent-page-static";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";

export const metadata: Metadata = {
  title: "Arret Maladie Maroc",
  description: "Estimez l'impact financier d'un arret maladie et vos droits associes au Maroc.",
};

export default function ArretMaladiePage() {
  // Server component - renders static HTML for SEO
  return <IntentPageStatic page={INTENT_PAGES["arret-maladie"]} />;
}
