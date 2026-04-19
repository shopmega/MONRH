import type { Metadata } from "next";
import { IntentPage } from "@/components/intent-page";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "IR / IGR Maroc",
  description: "Comprenez votre impot sur le revenu, votre taux effectif et l'impact de vos primes au Maroc.",
  canonicalPath: "/salaire/ir-igr",
});

export default function SalaireIrIgrPage() {
  return <IntentPage page={INTENT_PAGES["salaire-ir-igr"]} />;
}
