import type { Metadata } from "next";
import { CategoryHubPage } from "@/components/category-hub-page";
import { CATEGORY_HUBS } from "@/lib/navigation/category-hubs";

export const metadata: Metadata = {
  title: "Contrat et Depart",
  description: "Estimez vos indemnites, votre preavis et les documents utiles pour demission, licenciement ou fin de CDD.",
};

export default function ContratDepartPage() {
  return <CategoryHubPage hub={CATEGORY_HUBS["contrat-depart"]} />;
}
