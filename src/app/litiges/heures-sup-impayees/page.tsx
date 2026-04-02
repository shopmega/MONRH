import type { Metadata } from "next";
import { IntentPage } from "@/components/intent-page";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";

export const metadata: Metadata = {
  title: "Heures Supplementaires Impayees",
  description: "Calculez les heures supplementaires impayees et preparez votre reclamation au Maroc.",
};

export default function LitigesHeuresSupImpayeesPage() {
  return <IntentPage page={INTENT_PAGES["litige-heures-sup"]} />;
}
