import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isUserAuthenticated } from "@/lib/server/user-session";

export const metadata: Metadata = {
  title: "Compte et Historique",
  description:
    "Suivi personnel des simulations, documents generes et indicateurs RH de base.",
  alternates: {
    canonical: "/compte",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CompteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authenticated = await isUserAuthenticated();
  if (!authenticated) {
    redirect("/login?next=/compte");
  }

  return children;
}
