import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Politique de Confidentialite",
  description: "Politique de confidentialite de SIMPAIE: donnees collectees, usage, cookies, publicite et droits des utilisateurs.",
  canonicalPath: "/privacy",
});

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Confidentialite"
      title="Politique de Confidentialite"
      path="/privacy"
      description="Cette page explique comment SIMPAIE traite les donnees personnelles, les cookies, les mesures d'audience et les services publicitaires."
      updatedAt="29 avril 2026"
      sections={[
        {
          title: "Donnees collectees",
          body: [
            "SIMPAIE peut collecter les informations que vous saisissez dans les formulaires, simulateurs, outils, documents generes, demandes de contact ou espaces de compte.",
            "Des donnees techniques peuvent aussi etre traitees, comme l'adresse IP, le type d'appareil, le navigateur, les pages consultees, les erreurs applicatives et les preferences de langue ou de theme.",
          ],
        },
        {
          title: "Utilisation des donnees",
          body: [
            "Les donnees sont utilisees pour fournir les simulateurs, generer les resultats, ameliorer le service, securiser les comptes, repondre aux demandes et mesurer la performance du site.",
            "Les informations saisies dans les outils juridiques restent indicatives et servent a produire une estimation ou un document selon les donnees fournies par l'utilisateur.",
          ],
        },
        {
          title: "Cookies, analytics et publicite",
          body: [
            "Le site peut utiliser des cookies ou technologies similaires pour conserver vos preferences, maintenir une session, mesurer l'audience et proteger le service.",
            "SIMPAIE peut afficher des annonces via des partenaires publicitaires, dont Google AdSense. Ces partenaires peuvent utiliser des cookies pour diffuser et mesurer des annonces personnalisees ou non personnalisees selon vos choix et la reglementation applicable.",
          ],
        },
        {
          title: "Partage et conservation",
          body: [
            "Les donnees peuvent etre traitees par des prestataires techniques necessaires au fonctionnement du site, comme l'hebergement, l'authentification, la base de donnees, l'analyse d'audience ou la publicite.",
            "Les donnees sont conservees pendant une duree proportionnee a leur finalite, sauf obligation legale, securite, prevention des abus ou demande de suppression recevable.",
          ],
        },
        {
          title: "Vos droits",
          body: [
            "Vous pouvez demander l'acces, la correction ou la suppression de vos donnees personnelles lorsque cela est applicable.",
            "Vous pouvez egalement gerer les cookies depuis les reglages de votre navigateur et, lorsque disponible, depuis les controles proposes par les partenaires publicitaires.",
          ],
        },
      ]}
    />
  );
}
