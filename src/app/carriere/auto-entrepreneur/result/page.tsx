import { SimulationResultPage } from '@/components/simulation-result-page';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Resultat - Planifier', robots: { index: false, follow: false } };

export default function ResultPage() { return <SimulationResultPage slug='auto-entrepreneur' expectedPath='/carriere/auto-entrepreneur' />; }
