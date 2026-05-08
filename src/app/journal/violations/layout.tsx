import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Journal Infractions Travail | SIMPAIE",
  description:
    "Consignez les retards de salaire, heures impayees, risques de harcelement ou autres incidents de travail avec dates et preuves.",
  alternates: {
    canonical: "/journal/violations",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ViolationsJournalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
