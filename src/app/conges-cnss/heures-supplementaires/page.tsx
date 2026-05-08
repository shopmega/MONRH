import type { Metadata } from "next";
import { IntentPageStatic } from "@/components/intent-page-static";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";

export const metadata: Metadata = {
  title: "Heures Supplementaires Maroc",
  description: "Calculez les heures supplementaires et les majorations legales au Maroc.",
};

export default function HeuresSupplementairesPage() {
  // Server component - renders static HTML for SEO
  return <IntentPageStatic page={INTENT_PAGES["heures-supplementaires"]} />;
}
