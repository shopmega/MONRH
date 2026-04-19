import type { Metadata } from "next";
import { IntentPage } from "@/components/intent-page";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Calcul Salaire Net Brut Maroc",
  description: "Calculez votre salaire net, brut et vos cotisations au Maroc.",
  canonicalPath: "/salaire/brut-net",
});

export default function SalaireBrutNetPage() {
  return <IntentPage page={INTENT_PAGES["salaire-brut-net"]} />;
}
