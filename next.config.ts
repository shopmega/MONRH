import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async redirects() {
    return [
      { source: "/login", destination: "/connexion", permanent: true },
      { source: "/forgot-password", destination: "/mot-de-passe-oublie", permanent: true },
      { source: "/reset-password", destination: "/reinitialiser-mot-de-passe", permanent: true },
      { source: "/simulate", destination: "/simulateurs", permanent: true },
      { source: "/simulate/net-gross", destination: "/simulateurs/brut-net", permanent: true },
      {
        source: "/simulate/employer-total-cost",
        destination: "/simulateurs/cout-employeur-total",
        permanent: true,
      },
      { source: "/simulate/annual-income-tax", destination: "/simulateurs/ir-annuel", permanent: true },
      { source: "/simulate/licenciement", destination: "/simulateurs/licenciement", permanent: true },
      { source: "/simulate/demission", destination: "/simulateurs/demission", permanent: true },
      { source: "/simulate/fin-cdd", destination: "/simulateurs/fin-cdd", permanent: true },
      {
        source: "/simulate/probation-termination",
        destination: "/simulateurs/rupture-periode-essai",
        permanent: true,
      },
      {
        source: "/simulate/seniority-growth",
        destination: "/simulateurs/progression-anciennete",
        permanent: true,
      },
      {
        source: "/simulate/leave-accrual",
        destination: "/simulateurs/acquisition-conges",
        permanent: true,
      },
      { source: "/simulate/smig-compliance", destination: "/simulateurs/conformite-smig", permanent: true },
      { source: "/simulate/overtime", destination: "/simulateurs/heures-supplementaires", permanent: true },
      {
        source: "/simulate/public-holiday-compensation",
        destination: "/simulateurs/compensation-jours-feries",
        permanent: true,
      },
      { source: "/simulate/maternity-leave", destination: "/simulateurs/conge-maternite", permanent: true },
      { source: "/simulate/sick-leave", destination: "/simulateurs/conge-maladie", permanent: true },
      { source: "/simulate/cnss-pension", destination: "/simulateurs/pension-cnss", permanent: true },
      { source: "/simulate/work-accident", destination: "/simulateurs/accident-travail", permanent: true },
      {
        source: "/simulate/harassment-scenario",
        destination: "/simulateurs/scenario-harcelement",
        permanent: true,
      },
      {
        source: "/simulate/unpaid-salary-recovery",
        destination: "/simulateurs/recouvrement-salaire-impaye",
        permanent: true,
      },
      {
        source: "/simulate/unpaid-overtime-recovery",
        destination: "/simulateurs/recouvrement-heures-supplementaires",
        permanent: true,
      },
      { source: "/tools", destination: "/outils", permanent: true },
      { source: "/tools/payslip-detector", destination: "/outils/detecteur-fiche-paie", permanent: true },
      { source: "/tools/salary-delay-alert", destination: "/outils/alerte-retard-salaire", permanent: true },
      {
        source: "/tools/compliance-risk-score",
        destination: "/outils/score-risque-conformite",
        permanent: true,
      },
      {
        source: "/tools/final-settlement-audit",
        destination: "/outils/audit-solde-tout-compte",
        permanent: true,
      },
      {
        source: "/tools/disciplinary-procedure-check",
        destination: "/outils/controle-procedure-disciplinaire",
        permanent: true,
      },
      {
        source: "/tools/fixed-term-contract-risk",
        destination: "/outils/risque-requalification-cdd",
        permanent: true,
      },
      {
        source: "/tools/pre-litigation-timeline",
        destination: "/outils/feuille-route-pre-contentieux",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/connexion", destination: "/login" },
      { source: "/mot-de-passe-oublie", destination: "/forgot-password" },
      { source: "/reinitialiser-mot-de-passe", destination: "/reset-password" },
      { source: "/simulateurs", destination: "/simulate" },
      { source: "/simulateurs/brut-net", destination: "/simulate/net-gross" },
      { source: "/simulateurs/cout-employeur-total", destination: "/simulate/employer-total-cost" },
      { source: "/simulateurs/ir-annuel", destination: "/simulate/annual-income-tax" },
      { source: "/simulateurs/licenciement", destination: "/simulate/licenciement" },
      { source: "/simulateurs/demission", destination: "/simulate/demission" },
      { source: "/simulateurs/fin-cdd", destination: "/simulate/fin-cdd" },
      { source: "/simulateurs/rupture-periode-essai", destination: "/simulate/probation-termination" },
      { source: "/simulateurs/progression-anciennete", destination: "/simulate/seniority-growth" },
      { source: "/simulateurs/acquisition-conges", destination: "/simulate/leave-accrual" },
      { source: "/simulateurs/conformite-smig", destination: "/simulate/smig-compliance" },
      { source: "/simulateurs/heures-supplementaires", destination: "/simulate/overtime" },
      {
        source: "/simulateurs/compensation-jours-feries",
        destination: "/simulate/public-holiday-compensation",
      },
      { source: "/simulateurs/conge-maternite", destination: "/simulate/maternity-leave" },
      { source: "/simulateurs/conge-maladie", destination: "/simulate/sick-leave" },
      { source: "/simulateurs/pension-cnss", destination: "/simulate/cnss-pension" },
      { source: "/simulateurs/accident-travail", destination: "/simulate/work-accident" },
      { source: "/simulateurs/scenario-harcelement", destination: "/simulate/harassment-scenario" },
      {
        source: "/simulateurs/recouvrement-salaire-impaye",
        destination: "/simulate/unpaid-salary-recovery",
      },
      {
        source: "/simulateurs/recouvrement-heures-supplementaires",
        destination: "/simulate/unpaid-overtime-recovery",
      },
      { source: "/simulateurs/:slug/result", destination: "/simulate/:slug/result" },
      { source: "/outils", destination: "/tools" },
      { source: "/outils/detecteur-fiche-paie", destination: "/tools/payslip-detector" },
      { source: "/outils/alerte-retard-salaire", destination: "/tools/salary-delay-alert" },
      { source: "/outils/score-risque-conformite", destination: "/tools/compliance-risk-score" },
      { source: "/outils/audit-solde-tout-compte", destination: "/tools/final-settlement-audit" },
      {
        source: "/outils/controle-procedure-disciplinaire",
        destination: "/tools/disciplinary-procedure-check",
      },
      { source: "/outils/risque-requalification-cdd", destination: "/tools/fixed-term-contract-risk" },
      { source: "/outils/feuille-route-pre-contentieux", destination: "/tools/pre-litigation-timeline" },
    ];
  },
};

export default nextConfig;
