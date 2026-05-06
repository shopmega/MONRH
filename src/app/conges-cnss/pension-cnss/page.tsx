import type { Metadata } from "next";
import { IntentPageStatic } from "@/components/intent-page-static";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";

export const metadata: Metadata = {
  title: "Pension CNSS Maroc",
  description: "Projetez votre pension CNSS et anticipez vos droits de retraite au Maroc.",
};

export default function PensionCnssPage() {
  // Server component - renders static HTML for SEO
  return <IntentPageStatic page={INTENT_PAGES["cnss-pension"]} />;
}
