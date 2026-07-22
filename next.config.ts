import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Cho phép tất cả các domain (phù hợp với Supabase URL động)
      },
    ],
  },
};

export default nextConfig;
