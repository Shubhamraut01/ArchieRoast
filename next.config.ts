import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Self-contained server output (.next/standalone) for the Docker image.
  output: "standalone",
  // Native/gRPC packages must stay out of the bundle.
  serverExternalPackages: [
    "@temporalio/client",
    "@temporalio/common",
    "@temporalio/proto",
    "@grpc/grpc-js",
  ],
  cacheComponents: true,
  partialPrefetching: true,
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
