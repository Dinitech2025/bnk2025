import { NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  // Protéger les routes admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!token) {
      // Rediriger vers la page d'accueil si non connecté (le modal de connexion s'ouvrira)
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Vérifier si l'utilisateur a les droits admin ou staff
    if (token.role !== 'ADMIN' && token.role !== 'STAFF') {
      // Rediriger vers la page d'erreur d'autorisation
      return NextResponse.redirect(new URL('/auth/unauthorized', request.url))
    }
  }

  return NextResponse.next()
}

// Configurer les chemins à vérifier
export const config = {
  matcher: ['/admin/:path*'],
} 