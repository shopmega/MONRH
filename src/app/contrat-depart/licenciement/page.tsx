import type { Metadata } from "next";
import { IntentPageStatic } from "@/components/intent-page-static";
import { INTENT_PAGES } from "@/lib/navigation/intent-pages";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Licenciement Maroc",
  description: "Estimez vos indemnites de licenciement, votre preavis et vos droits de sortie au Maroc.",
  canonicalPath: "/contrat-depart/licenciement",
});

export default function ContratDepartLicenciementPage() {
  // Server component - renders static HTML for SEO
  return <IntentPageStatic page={INTENT_PAGES["depart-licenciement"]} />;
}
