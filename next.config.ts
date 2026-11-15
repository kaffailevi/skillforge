import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // The dev-tools badge (development only) would cover the theme picker at the sidebar's foot.
  devIndicators: { position: "bottom-right" },
  partialPrefetching: true,
  images: {
    // GitHub avatars in the user menu: GitHub's avatar_url is always /u/<id>?v=4
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com", pathname: "/u/**", search: "?v=4" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
