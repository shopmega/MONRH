import type { Metadata } from "next";
import { IntentPageStatic } from "@/components/intent-page-static";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "IR / IGR Maroc",
  description: "Comprenez votre impot sur le revenu, votre taux effectif et l'impact de vos primes au Maroc.",
  canonicalPath: "/salaire/ir-igr",
});

export default function SalaireIrIgrPage() {
  // Server component - renders static HTML for SEO
  return <IntentPageStatic page={INTENT_PAGES["salaire-ir-igr"]} />;
}
