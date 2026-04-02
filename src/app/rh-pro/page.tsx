import type { Metadata } from "next";
import { CategoryHubPage } from "@/components/category-hub-page";
import { CATEGORY_HUBS } from "@/lib/navigation/category-hubs";

export const metadata: Metadata = {
  title: "Outils RH Pro",
  description: "Cout employeur, masse salariale et recrutement pour les equipes RH et employeurs au Maroc.",
};

export default function RhProPage() {
  return <CategoryHubPage hub={CATEGORY_HUBS["rh-pro"]} />;
}
