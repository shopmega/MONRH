import type { Metadata } from "next";
import { EmployerDashboardClient } from "@/components/employer/employer-dashboard-client";
import { SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  title: `Portail employeur | ${SITE_NAME}`,
  description: "Suite employeur pour paie, declarations, registre RH, temps, self-service et conformite au Maroc.",
  robots: { index: false, follow: false },
};

export default function EmployerPortalPage() {
  return <EmployerDashboardClient />;
}
