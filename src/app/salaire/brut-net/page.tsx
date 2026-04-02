import type { Metadata } from "next";
import { IntentPage } from "@/components/intent-page";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";

export const metadata: Metadata = {
  title: "Calcul Salaire Net Brut Maroc",
  description: "Calculez votre salaire net, brut et vos cotisations au Maroc.",
};

export default function SalaireBrutNetPage() {
  return <IntentPage page={INTENT_PAGES["salaire-brut-net"]} />;
}
