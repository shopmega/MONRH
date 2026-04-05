import type { Metadata } from "next";
import { SimulationResultPage } from "@/components/simulation-result-page";

export const metadata: Metadata = {
  title: "Resultat Simulation | MONRH",
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
  const expectedPath = `/${group}/${slug}`;
  
  return <SimulationResultPage slug={slug} expectedPath={expectedPath} />;
}
