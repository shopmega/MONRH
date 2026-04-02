import type { Metadata } from "next";
import { IntentPage } from "@/components/intent-page";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";

export const metadata: Metadata = {
  title: "Salaire Impaye Maroc",
  description: "Calculez le salaire impaye, les penalites et preparez votre reclamation au Maroc.",
};

export default function LitigesSalaireImpayePage() {
  return <IntentPage page={INTENT_PAGES["litige-salaire-impaye"]} />;
}
