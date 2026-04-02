import type { MetadataRoute } from "next";
import { readAdminConfig } from "@/lib/server/admin-config";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const config = await readAdminConfig();
  const name = config.websiteSettings.siteName.trim() || SITE_NAME;
  const description =
    config.websiteSettings.siteDescription.trim() || SITE_DESCRIPTION;

  return {
    name,
    short_name: name,
    description,
    start_url: "/",
    scope: "/",
    id: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    lang: "fr-MA",
    dir: "ltr",
    categories: ["legal", "business"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Accueil", short_name: "Accueil", url: "/", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Salaire", short_name: "Salaire", url: "/salaire", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Articles", short_name: "Articles", url: "/articles", icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }] },
    ],
    screenshots: [],
    prefer_related_applications: false,
  };
}
