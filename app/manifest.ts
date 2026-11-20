import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cedar Shop",
    short_name: "Cedar Shop",
    description: "Cedar Shop Lumber Management System",
    start_url: "/yard",
    scope: "/",
    display: "standalone",
    background_color: "#102b25",
    theme_color: "#102b25",
    icons: [
      {
        src: "/cedarshop-icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
