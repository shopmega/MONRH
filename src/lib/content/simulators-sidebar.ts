import type { LocalizedText } from "@/lib/navigation/category-hubs";

export const simulatorSidebarGroups = [
  {
    title: { fr: "Salaire et Contributions", ar: "الأجر والاقتطاعات" },
    items: [
      {
        title: { fr: "Net <-> Brut", ar: "الصافي <-> الإجمالي" },
        href: "/simulateurs/brut-net",
      },
      {
        title: { fr: "Coût Total Employeur", ar: "الكلفة الإجمالية للمشغل" },
        href: "/simulateurs/cout-employeur-total",
      },
      {
        title: { fr: "IR Annuel", ar: "الضريبة السنوية" },
        href: "/simulateurs/ir-annuel",
      },
    ],
  },
  {
    title: { fr: "Rupture et Fin de Contrat", ar: "الإنهاء ونهاية العقد" },
    items: [
      {
        title: { fr: "Indemnité Licenciement", ar: "تعويض الفصل" },
        href: "/simulateurs/licenciement",
      },
      {
        title: { fr: "Scenario Démission", ar: "سيناريو الاستقالة" },
        href: "/simulateurs/demission",
      },
      {
        title: { fr: "Durée de Préavis", ar: "مدة الإشعار" },
        href: "/simulateurs/duree-preavis",
      },
      {
        title: { fr: "Fin de CDD", ar: "نهاية عقد محدد المدة" },
        href: "/simulateurs/fin-cdd",
      },
      {
        title: { fr: "Rupture en Période d'Essai", ar: "الإنهاء خلال فترة التجربة" },
        href: "/simulateurs/rupture-periode-essai",
      },
      {
        title: { fr: "Croissance Ancienneté", ar: "نمو الأقدمية" },
        href: "/simulateurs/progression-anciennete",
      },
    ],
  },
  {
    title: { fr: "Temps, Congés et Protection", ar: "الوقت والعطل والحماية" },
    items: [
      {
        title: { fr: "Congés Acquis", ar: "العطل المكتسبة" },
        href: "/simulateurs/acquisition-conges",
      },
      {
        title: { fr: "Heures Supplémentaires", ar: "الساعات الإضافية" },
        href: "/simulateurs/heures-supplementaires",
      },
      {
        title: { fr: "Travail Jour Férié", ar: "العمل في يوم عطلة" },
        href: "/simulateurs/compensation-jours-feries",
      },
      {
        title: { fr: "Congé Maternité", ar: "عطلة الأمومة" },
        href: "/simulateurs/conge-maternite",
      },
      {
        title: { fr: "Arrêt Maladie", ar: "التوقف المرضي" },
        href: "/simulateurs/conge-maladie",
      },
      {
        title: { fr: "Projection Pension CNSS", ar: "تقاعد CNSS" },
        href: "/simulateurs/pension-cnss",
      },
      {
        title: { fr: "Accident du Travail", ar: "حادثة الشغل" },
        href: "/simulateurs/accident-travail",
      },
      {
        title: { fr: "Conformité SMIG / SMAG", ar: "مطابقة SMIG / SMAG" },
        href: "/simulateurs/conformite-smig",
      },
    ],
  },
  {
    title: { fr: "Litiges et Recouvrement", ar: "النزاعات والاسترداد" },
    items: [
      {
        title: { fr: "Scénario Harcèlement", ar: "سيناريو التحرش" },
        href: "/simulateurs/scenario-harcelement",
      },
      {
        title: { fr: "Recouvrement Salaire Impayé", ar: "استرداد الأجر غير المدفوع" },
        href: "/simulateurs/recouvrement-salaire-impaye",
      },
      {
        title: { fr: "Recouvrement Heures Sup", ar: "استرداد الساعات الإضافية" },
        href: "/simulateurs/recouvrement-heures-supplementaires",
      },
    ],
  },
] as const;
