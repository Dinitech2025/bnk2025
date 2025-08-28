// Utilitaire pour obtenir l'URL de base selon l'environnement
// Évite les URLs HTTP en dur qui causent les alertes de sécurité

export function getBaseUrl(): string {
  // En production, toujours HTTPS
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_BASE_URL || 'https://boutik-naka.com'
  }
  
  // En développement, priorité à la variable d'environnement
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL
  }
  
  // Fallback développement : détecter le protocole du navigateur
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol
    const host = window.location.host
    return `${protocol}//${host}`
  }
  
  // Fallback serveur : HTTP pour développement local
  return 'http://localhost:3000'
}

export function getApiBaseUrl(): string {
  const baseUrl = getBaseUrl()
  return baseUrl
}

export function getSecureBaseUrl(): string {
  const baseUrl = getBaseUrl()
  
  // Force HTTPS si on est en production ou si l'URL contient un domaine
  if (process.env.NODE_ENV === 'production' || !baseUrl.includes('localhost')) {
    return baseUrl.replace('http://', 'https://')
  }
  
  return baseUrl
}

// Utilitaire pour les URLs de retour PayPal
export function getPayPalReturnUrls() {
  const baseUrl = getSecureBaseUrl()
  
  return {
    returnUrl: `${baseUrl}/order-success`,
    cancelUrl: `${baseUrl}/checkout`
  }
}

// Utilitaire pour les redirections d'authentification
export function getAuthUrls() {
  const baseUrl = getSecureBaseUrl()
  
  return {
    signInUrl: `${baseUrl}/auth/signin`,
    callbackUrl: `${baseUrl}/auth/callback`,
    redirectUrl: baseUrl
  }
}
