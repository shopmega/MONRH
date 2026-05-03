import type { Metadata } from "next";
import { SimulationResultPage } from "@/components/simulation-result-page";
import { resultRouteToExpectedPath } from "@/lib/simulations/calculator-path";

export const metadata: Metadata = {
  title: "Resultat Simulation | SIMPAIE",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CentralResultRoute({
  params,
}: {
  params: Promise<{ group: string; slug: string }>;
}) {
  const { group, slug } = await params;
  const expectedPath = resultRouteToExpectedPath(group, slug);
  
  return <SimulationResultPage slug={slug} expectedPath={expectedPath} />;
}
