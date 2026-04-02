import type { Metadata } from "next";
import { SimulationResultPage } from "@/components/simulation-result-page";

export const metadata: Metadata = {
  title: "Resultat simulation | Carriere et decisions",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PlanifierResultRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <SimulationResultPage slug={slug} expectedPath={`/planifier/${slug}`} />;
}
