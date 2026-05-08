import type { Metadata } from "next";
import { CategoryHubPage } from "@/components/category-hub-page";
import { CATEGORY_HUBS } from "@/lib/navigation/category-hubs";

export const metadata: Metadata = {
  title: "Carriere et Decisions",
  description: "Comparez des scenarios d'augmentation, de freelance, de promotion, de credit et de retraite.",
};

export default function CarrierePage() {
  return <CategoryHubPage hub={CATEGORY_HUBS.carriere} />;
}
