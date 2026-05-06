import type { Metadata } from "next";
import { IntentPageStatic } from "@/components/intent-page-static";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";

export const metadata: Metadata = {
  title: "Conge Maternite Maroc",
  description: "Estimez votre conge maternite, vos droits CNSS et les documents utiles au Maroc.",
};

export default function CongeMaternitePage() {
  // Server component - renders static HTML for SEO
  return <IntentPageStatic page={INTENT_PAGES["conge-maternite"]} />;
}
