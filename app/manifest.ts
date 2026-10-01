import type { MetadataRoute } from "next";

// Lets the portal be installed as its own app window (e.g. on the studio
// PC), which keeps desktop alerts tied to a dedicated window.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Legg Tutoring",
    short_name: "Legg Tutoring",
    start_url: "/portal",
    display: "standalone",
    background_color: "#F7F3EA",
    theme_color: "#1D2733",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
