import type { NextConfig } from "next";

function getAllowedDevOrigins() {
  const raw = process.env.ALLOWED_DEV_ORIGINS;
  if (!raw) return [];

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: getAllowedDevOrigins(),
};

export default nextConfig;
