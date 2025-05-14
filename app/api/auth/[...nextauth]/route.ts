import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { NextAuthOptions } from 'next-auth'
import { getServerSession } from 'next-auth/next'
import CredentialsProvider from 'next-auth/providers/credentials'
import * as bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import NextAuth from 'next-auth/next'

// Étendre les types de NextAuth
declare module "next-auth" {
  interface User {
    id: string
    role: string
  }
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Identifiants requis')
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email,
          },
        })

        if (!user || !user.password) {
          throw new Error('Utilisateur non trouvé')
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!passwordMatch) {
          throw new Error('Mot de passe incorrect')
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST } 