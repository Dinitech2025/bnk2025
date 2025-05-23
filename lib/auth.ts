import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/auth/login')
  }
  
  return user
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  
  if (!user || user.role !== 'ADMIN') {
    redirect('/auth/unauthorized')
  }
  
  return user
}

export async function requireStaff() {
  const user = await getCurrentUser()
  
  if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
    redirect('/auth/unauthorized')
  }
  
  return user
} 