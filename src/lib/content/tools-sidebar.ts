import type { LocalizedText } from "@/lib/navigation/category-hubs";

export const protectionToolsSidebarItems = [
  {
    title: { fr: "Détecteur de fiche de paie", ar: "كاشف ورقة الأجر" },
    href: "/outils/detecteur-fiche-paie",
  },
  {
    title: { fr: "Alerte retard de salaire", ar: "تنبيه تأخير الأجر" },
    href: "/outils/alerte-retard-salaire",
  },
  {
    title: { fr: "Score de risque de conformité", ar: "درجة مخاطر التوافق" },
    href: "/outils/score-risque-conformite",
  },
  {
    title: { fr: "Audit solde de tout compte", ar: "مراجعة تسوية كل الحسابات" },
    href: "/outils/audit-solde-tout-compte",
  },
  {
    title: { fr: "Contrôle procédure disciplinaire", ar: "مراقبة الإجراء التأديبي" },
    href: "/outils/controle-procedure-disciplinaire",
  },
  {
    title: { fr: "Risque requalification CDD", ar: "مخاطر إعادة تصنيف عقد محدد المدة" },
    href: "/outils/risque-requalification-cdd",
  },
  {
    title: { fr: "Feuille route pré-contentieux", ar: "خريطة طريق ما قبل النزاع" },
    href: "/outils/feuille-route-pre-contentieux",
  },
] as const;
