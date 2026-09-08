import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Room for multipart overhead on top of MAX_PRODUCT_FILE_MB (5).
      bodySizeLimit: "6mb",
    },
    proxyClientMaxBodySize: "6mb",
  },
};

export default nextConfig;
