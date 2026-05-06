import type { Metadata } from "next";
import { IntentPageStatic } from "@/components/intent-page-static";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Duree de Preavis Maroc",
  description: "Calculez la duree legale de preavis au Maroc selon votre contrat et votre anciennete.",
  canonicalPath: "/contrat-depart/duree-preavis",
});

export default function DureePreavisPage() {
  // Server component - renders static HTML for SEO
  return <IntentPageStatic page={INTENT_PAGES["depart-preavis"]} />;
}
