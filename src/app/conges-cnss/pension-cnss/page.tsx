import type { Metadata } from "next";
import { IntentPage } from "@/components/intent-page";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";

export const metadata: Metadata = {
  title: "Pension CNSS Maroc",
  description: "Projetez votre pension CNSS et anticipez vos droits de retraite au Maroc.",
};

export default function CongesCnssPensionPage() {
  return <IntentPage page={INTENT_PAGES["cnss-pension"]} />;
}
