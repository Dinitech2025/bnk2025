import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET - Liste tous les clients
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    let where: any = {
      role: 'CLIENT',
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          phone: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    const [clients, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
        },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      db.user.count({ where }),
    ])

    return NextResponse.json({
      data: clients,
      total,
      page,
      limit,
    })
  } catch (error) {
    console.error('[CLIENTS_GET]', error)
    return new NextResponse('Internal error', { status: 500 })
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