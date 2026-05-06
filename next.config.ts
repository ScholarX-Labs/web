import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
};
export default nextConfig;

// Optional Cloudflare helper used for local dev. Make this import safe
// so builds won't fail when the package isn't installed (CI/Vercel).
// import("@opennextjs/cloudflare")
//   .then((m) => m.initOpenNextCloudflareForDev?.())
//   .catch(() => {
//     // no-op when package is missing
//   });
