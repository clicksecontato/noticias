import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true
  },
  outputFileTracingRoot: path.join(process.cwd(), "../../"),
  async redirects() {
    return [
      {
        source: "/games/:slug",
        destination: "/subjects/:slug",
        permanent: true
      },
      {
        source: "/games-like/:slug",
        destination: "/subjects-like/:slug",
        permanent: true
      },
      {
        source: "/hardware/:path*",
        destination: "/news",
        permanent: true
      },
      {
        source: "/best/:genre/:platform",
        destination: "/best/:genre",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
