/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'loremflickr.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/**',
      }
    ],
    domains: ['res.cloudinary.com', 'loremflickr.com', 'upload.wikimedia.org'],
  },
  // Définir /admin comme une route indépendante avec son propre layout racine
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // Activer l'optimisation CSS avec critters
  experimental: {
    optimizeCss: true,
  },
}

module.exports = nextConfig 