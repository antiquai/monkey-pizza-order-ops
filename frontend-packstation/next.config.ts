import type { NextConfig } from "next";

const nextConfig = {
  experimental: {
    serverActions:{
      allowedOrigins: ['192.168.178.54:3002']
    },
  },
} as NextConfig;

export default nextConfig;
