import type { Metadata } from "next";
import { IntentPageStatic } from "@/components/intent-page-static";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";

export const metadata: Metadata = {
  title: "Heures Supplementaires Impayees",
  description: "Calculez les heures supplementaires impayees et preparez votre reclamation au Maroc.",
};

export default function HeuresSupImpayeesPage() {
  // Server component - renders static HTML for SEO
  return <IntentPageStatic page={INTENT_PAGES["litige-heures-sup"]} />;
}
