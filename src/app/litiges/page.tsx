import type { Metadata } from "next";
import { CategoryHubPage } from "@/components/category-hub-page";
import { CATEGORY_HUBS } from "@/lib/navigation/category-hubs";

export const metadata: Metadata = {
  title: "Litiges et Reclamations",
  description: "Reagissez en cas de salaire impaye, harcelement, heures supplementaires impayees ou conflit avec l'employeur.",
};

export default function LitigesPage() {
  return <CategoryHubPage hub={CATEGORY_HUBS.litiges} />;
}
