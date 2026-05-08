import type { Metadata } from "next";
import { CategoryHubPage } from "@/components/category-hub-page";
import { CATEGORY_HUBS } from "@/lib/navigation/category-hubs";

export const metadata: Metadata = {
  title: "Modeles de Lettres",
  description: "Retrouvez les modeles de lettres et documents RH les plus utiles pour vos demarches de travail au Maroc.",
};

export default function ModelesPage() {
  return <CategoryHubPage hub={CATEGORY_HUBS.modeles} />;
}
