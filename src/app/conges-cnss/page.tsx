import type { Metadata } from "next";
import { CategoryHubPage } from "@/components/category-hub-page";
import { CATEGORY_HUBS } from "@/lib/navigation/category-hubs";

export const metadata: Metadata = {
  title: "Conges et CNSS",
  description: "Consultez vos droits en cas de conge, absence, maladie, maternite, accident du travail ou pension CNSS.",
};

export default function CongesCnssPage() {
  return <CategoryHubPage hub={CATEGORY_HUBS["conges-cnss"]} />;
}
