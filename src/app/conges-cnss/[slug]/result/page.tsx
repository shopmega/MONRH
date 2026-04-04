import type { Metadata } from "next";
import { SimulationResultPage } from "@/components/simulation-result-page";

export const metadata: Metadata = {
  title: "Resultat Simulation | Conges et CNSS",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CongesCnssResultRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <SimulationResultPage slug={slug} expectedPath={`/conges-cnss/${slug}`} />;
}
