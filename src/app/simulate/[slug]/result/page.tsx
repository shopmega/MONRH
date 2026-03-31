import type { Metadata } from "next";
import { SimulationResultPage } from "@/components/simulation-result-page";

export const metadata: Metadata = {
  title: "Resultat Simulation",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SimulatorResultRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <SimulationResultPage slug={slug} />;
}
