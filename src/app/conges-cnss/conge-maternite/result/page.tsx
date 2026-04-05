import { SimulationResultPage } from '@/components/simulation-result-page';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Resultat Simulation', robots: { index: false, follow: false } };

export default function ResultPage() { return <SimulationResultPage slug='conge-maternite' expectedPath='/conges-cnss/conge-maternite' />; }
