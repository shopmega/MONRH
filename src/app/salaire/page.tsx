import type { Metadata } from "next";
import { CategoryHubPage } from "@/components/category-hub-page";
import { CATEGORY_HUBS } from "@/lib/navigation/category-hubs";

export const metadata: Metadata = {
  title: "Salaire et Fiche de Paie",
  description: "Calculez votre salaire net, verifiez vos retenues et comprenez votre fiche de paie au Maroc.",
};

export default function SalairePage() {
  return <CategoryHubPage hub={CATEGORY_HUBS.salaire} />;
}
