import type { Metadata } from "next";
import { IntentPage } from "@/components/intent-page";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";

export const metadata: Metadata = {
  title: "Duree de Preavis Maroc",
  description: "Calculez la duree legale de preavis au Maroc selon votre contrat et votre anciennete.",
};

export default function ContratDepartDureePreavisPage() {
  return <IntentPage page={INTENT_PAGES["depart-preavis"]} />;
}
