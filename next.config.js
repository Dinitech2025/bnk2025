/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Définir /admin comme une route indépendante avec son propre layout racine
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // Activer l'optimisation CSS avec critters
  experimental: {
    optimizeCss: true,
  },
}

module.exports = nextConfig 