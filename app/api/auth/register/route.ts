import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Valider les données
    const result = registerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { message: 'Données invalides', errors: result.error.errors },
        { status: 400 }
      )
    }
    
    const { name, email, password } = result.data
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.user.findUnique({
      where: { email },
    })
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)
    
    // Créer l'utilisateur
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'CLIENT',
      },
    })
    
    // Ne pas renvoyer le mot de passe
    const { password: _, ...userWithoutPassword } = user
    
    return NextResponse.json(
      { message: 'Utilisateur créé avec succès', user: userWithoutPassword },
      { status: 201 }
    )
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error)
    return NextResponse.json(
      { message: 'Une erreur est survenue lors de l\'inscription' },
      { status: 500 }
    )
  }
}