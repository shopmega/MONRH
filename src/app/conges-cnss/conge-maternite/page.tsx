import type { Metadata } from "next";
import { IntentPage } from "@/components/intent-page";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";

export const metadata: Metadata = {
  title: "Conge Maternite Maroc",
  description: "Estimez votre conge maternite, vos droits CNSS et les documents utiles au Maroc.",
};

export default function CongesCnssCongeMaternitePage() {
  return <IntentPage page={INTENT_PAGES["conge-maternite"]} />;
}
