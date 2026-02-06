import type { MetadataRoute } from "next";

const base = "https://convertix.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();
  const paths = [
    "/",
    "/get-started",
    "/pricing",
    "/docs",
    "/x-pdf",
    "/x-image",
    "/noteflowlm",
    "/studios",
    "/status",
    "/signin",
    "/dashboard"
  ];
  return paths.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: path === "/" ? 1 : 0.7
  }));
}
