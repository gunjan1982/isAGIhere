import { useEffect } from "react";

interface SeoOptions {
  title: string;
  description?: string;
  image?: string;
  type?: "website" | "profile" | "article";
}

const SITE_NAME = "AI Water Cooler";
const DEFAULT_DESCRIPTION = "Curated intelligence hub tracking AI people, publications, communities, and the race to AGI.";
const DEFAULT_IMAGE = "/og-image.png";

export function useSeo({ title, description, image, type = "website" }: SeoOptions) {
  const fullTitle = `${title} — ${SITE_NAME}`;
  const desc = description || DEFAULT_DESCRIPTION;
  const img = image || DEFAULT_IMAGE;

  useEffect(() => {
    document.title = fullTitle;

    function setMeta(property: string, content: string, isName = false) {
      const attr = isName ? "name" : "property";
      let el = document.querySelector(`meta[${attr}="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    }

    setMeta("description", desc, true);
    setMeta("og:title", fullTitle);
    setMeta("og:description", desc);
    setMeta("og:image", img);
    setMeta("og:type", type);
    setMeta("og:site_name", SITE_NAME);
    setMeta("twitter:card", "summary_large_image", true);
    setMeta("twitter:title", fullTitle, true);
    setMeta("twitter:description", desc, true);
    setMeta("twitter:image", img, true);

    return () => {
      document.title = SITE_NAME;
    };
  }, [fullTitle, desc, img, type]);
}
