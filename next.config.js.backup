/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // Configuration des images
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
      },
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.worldvectorlogo.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's.alicdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'logos-world.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'companieslogo.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.wikia.nocookie.net',
        pathname: '/**',
      }
    ],
    // Garder domains pour la compatibilité
    domains: ['res.cloudinary.com', 'loremflickr.com', 'upload.wikimedia.org', 'ik.imagekit.io', 'cdn.worldvectorlogo.com', 's.alicdn.com', 'logos-world.net', 'companieslogo.com', 'static.wikia.nocookie.net'],
  },
  
  // Extensions de pages
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  
  // Configuration du compilateur
  compiler: {
    // Supprimer les console.log en production
    removeConsole: process.env.NODE_ENV === 'production',
  },
}

module.exports = nextConfig 