import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Journal Heures Supplementaires | SIMPAIE",
  description:
    "Enregistrez vos heures supplementaires, triez les preuves et preparez un historique exploitable pour vos reclamations.",
  alternates: {
    canonical: "/journal/overtime",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function OvertimeJournalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
