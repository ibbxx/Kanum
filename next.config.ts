import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimizer aktif (sebelumnya unoptimized: true — 87MB PNG dikirim mentah).
  // sharp sudah ada di lockfile. remotePatterns diizinkan luas supaya
  // image_url dari DB (path lokal maupun URL eksternal) tetap tampil,
  // sama seperti perilaku <img> sebelumnya.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  outputFileTracingRoot: process.cwd(),
};

export default nextConfig;
