import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET - Liste tous les clients
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Vérifier l'authentification et les autorisations
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer les paramètres de requête
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // Construire la requête
    const where = {
      role: 'CLIENT',
      OR: search
        ? [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ]
        : undefined,
    }

    // Exécuter la requête
    const [clients, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          image: true,
          createdAt: true,
          customerType: true,
          companyName: true,
          _count: {
            select: {
              orders: true,
              addresses: true,
            },
          },
        } as any,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      clients,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des clients:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// POST - Crée un nouveau client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Vérifier l'authentification et les autorisations
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'STAFF')) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer les données du corps de la requête
    const data = await request.json()
    const { 
      email, 
      password, 
      name,
      firstName,
      lastName,
      phone,
      birthDate,
      gender,
      preferredLanguage,
      newsletter,
      notes,
      customerType,
      companyName,
      vatNumber,
      image
    } = data

    // Validation de base
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Vérifier si l'email existe déjà
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'Cet email est déjà utilisé' },
        { status: 400 }
      )
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer le client
    const newClient = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || `${firstName || ''} ${lastName || ''}`.trim() || null,
        firstName,
        lastName,
        phone,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender,
        preferredLanguage,
        newsletter: newsletter || false,
        notes,
        customerType,
        companyName,
        vatNumber,
        image,
        role: 'CLIENT',
      } as any,
    })

    // Exclure le mot de passe de la réponse
    const { password: _, ...clientWithoutPassword } = newClient

    return NextResponse.json(clientWithoutPassword, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du client:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
} 