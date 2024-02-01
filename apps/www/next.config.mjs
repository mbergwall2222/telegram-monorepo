import "./src/env.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  output: "standalone",
  experimental: {
    // windowHistorySupport: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "telegram-media.nyc3.cdn.digitaloceanspaces.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;

    return config;
  },
  cacheHandler:
    process.env.NODE_ENV == "production" ? "./cache-handler.js" : undefined,
  cacheMaxMemorySize: 0, // disable default in-memory caching
  // transpilePackages: ["@telegram/db"],
  async rewrites() {
    return [
      {
        source: "/ingest/:path*",
        destination: "https://app.posthog.com/:path*",
      },
    ];
  },
};

export default nextConfig;
