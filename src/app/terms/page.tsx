import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Conditions d'Utilisation",
  description: "Conditions d'utilisation de SIMPAIE: usage du site, limites des informations juridiques, responsabilites et services.",
  canonicalPath: "/terms",
});

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Conditions"
      title="Conditions d'Utilisation"
      description="Ces conditions encadrent l'utilisation de SIMPAIE, de ses simulateurs, guides, modeles, outils et services associes."
      updatedAt="29 avril 2026"
      sections={[
        {
          title: "Objet du service",
          body: [
            "SIMPAIE propose des informations pratiques, simulateurs, outils de verification, articles et modeles lies au travail, a la paie, aux droits sociaux et aux demarches RH au Maroc.",
            "Le service est destine a aider l'utilisateur a comprendre une situation et a preparer ses demarches, sans remplacer un conseil personnalise d'un professionnel qualifie.",
          ],
        },
        {
          title: "Informations indicatives",
          body: [
            "Les resultats fournis par les simulateurs dependent des donnees saisies par l'utilisateur et des regles integrees dans l'application.",
            "Malgre les efforts de mise a jour, SIMPAIE ne garantit pas que chaque information soit complete, exhaustive ou applicable a toutes les situations individuelles.",
          ],
        },
        {
          title: "Responsabilites de l'utilisateur",
          body: [
            "L'utilisateur s'engage a fournir des informations exactes, a ne pas utiliser le service de maniere abusive et a verifier les resultats avant toute decision importante.",
            "Pour un litige, une rupture de contrat, une reclamation officielle ou une situation urgente, l'utilisateur doit demander conseil a un avocat, inspecteur du travail, expert-comptable ou autre professionnel competent.",
          ],
        },
        {
          title: "Comptes et securite",
          body: [
            "Certaines fonctionnalites peuvent necessiter un compte. L'utilisateur est responsable de la confidentialite de ses identifiants et des actions effectuees depuis son compte.",
            "SIMPAIE peut restreindre, suspendre ou supprimer l'acces en cas d'usage abusif, tentative de contournement, atteinte a la securite ou violation de ces conditions.",
          ],
        },
        {
          title: "Modifications",
          body: [
            "SIMPAIE peut modifier le contenu, les fonctionnalites, les tarifs eventuels, les pages legales ou les presentes conditions afin d'ameliorer le service ou de respecter les obligations applicables.",
            "La poursuite de l'utilisation du site apres publication des modifications vaut acceptation des conditions mises a jour.",
          ],
        },
      ]}
    />
  );
}
