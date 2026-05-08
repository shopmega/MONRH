import type { Metadata } from "next";
import { IntentPageStatic } from "@/components/intent-page-static";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";

export const metadata: Metadata = {
  title: "Salaire Impaye Maroc",
  description: "Calculez le salaire impaye, les penalites et preparez votre reclamation au Maroc.",
};

export default function SalaireImpayePage() {
  // Server component - renders static HTML for SEO
  return <IntentPageStatic page={INTENT_PAGES["litige-salaire-impaye"]} />;
}
