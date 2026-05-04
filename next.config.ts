import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  // Évite que Turbopack prenne C:\Users\XORSEE (lockfile parent) comme racine au lieu de ce projet.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
