import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Temporalmente ignorar errores de ESLint durante builds en Vercel
    // debido a problemas de caché
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Mantener verificación de TypeScript activa
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
