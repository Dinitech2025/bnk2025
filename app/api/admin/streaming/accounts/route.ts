import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { requireStaff } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET - Récupérer tous les comptes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const platformId = searchParams.get('platformId')
    
    // Construire la requête de base
    const baseQuery = {
      include: {
        platform: true,
        accountProfiles: true
      },
      orderBy: {
        username: 'asc' as const
      }
    } satisfies Prisma.AccountFindManyArgs

    // Si un platformId est spécifié, ajouter les filtres spécifiques
    if (platformId) {
      // Vérifier si la plateforme existe
      const platform = await prisma.platform.findUnique({
        where: { id: platformId }
      })

      if (!platform) {
        return NextResponse.json(
          { message: 'Plateforme non trouvée' },
          { status: 404 }
        )
      }

      // Construction dynamique de la requête selon que la plateforme supporte les profils ou non
      let filteredQuery: Prisma.AccountFindManyArgs = {
        ...baseQuery,
        where: {
          platformId: platformId,
          status: 'AVAILABLE',
        },
        include: {
          ...baseQuery.include,
        }
      };

      // Si la plateforme supporte les profils, ajouter des conditions supplémentaires
      if (platform.hasProfiles) {
        filteredQuery.where = {
          ...filteredQuery.where,
          accountProfiles: {
            some: {
              isAssigned: false
            }
          }
        };
        
        filteredQuery.include = {
          ...filteredQuery.include,
          accountProfiles: {
            where: {
              isAssigned: false
            }
          }
        };
      }

      const accounts = await prisma.account.findMany(filteredQuery)
      return NextResponse.json(accounts)
    }

    // Si aucun platformId n'est spécifié, retourner tous les comptes
    const accounts = await prisma.account.findMany(baseQuery)
    return NextResponse.json(accounts)

  } catch (error) {
    console.error('Erreur lors de la récupération des comptes:', error)
    return NextResponse.json(
      { message: 'Erreur lors de la récupération des comptes' },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau compte avec profils automatiques
export async function POST(request: NextRequest) {
  try {
    // En production: const user = await requireStaff()
    
    const data = await request.json()
    const { username, email, password, status, platformId } = data

    // Vérifier si les champs obligatoires sont présents
    if (!username || !password || !platformId) {
      return NextResponse.json(
        { message: 'Veuillez fournir tous les champs requis' },
        { status: 400 }
      )
    }

    // Récupérer la plateforme pour connaître le nombre de profils à créer
    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
      select: { 
        maxProfilesPerAccount: true, 
        name: true,
        hasProfiles: true 
      }
    })

    if (!platform) {
      return NextResponse.json(
        { message: 'Plateforme non trouvée' },
        { status: 404 }
      )
    }

    // Ne créer des profils que si la plateforme les supporte
    const shouldCreateProfiles = platform.hasProfiles;
    const profileCount = shouldCreateProfiles ? (platform.maxProfilesPerAccount || 1) : 0;

    // Générer un code PIN à 4 chiffres pour chaque profil
    const generatePin = () => {
      return Math.floor(1000 + Math.random() * 9000).toString();
    };

    // Créer le compte
    const account = await prisma.account.create({
      data: {
        username,
        email: email || null,
        password,
        status: status || "AVAILABLE",
        platformId,
        accountProfiles: shouldCreateProfiles ? {
          // Créer automatiquement le nombre de profils requis avec nom et PIN
          create: Array.from({ length: profileCount }).map((_, index) => ({
            profileSlot: index + 1,
            name: `${username} - Profil ${index + 1}`,
            pin: generatePin(),
            isAssigned: false
          }))
        } : undefined
      },
      include: {
        platform: true,
        accountProfiles: true
      }
    })

    return NextResponse.json(account, { status: 201 })
  } catch (error) {
    console.error('Erreur lors de la création du compte:', error)
    return NextResponse.json(
      { message: 'Erreur serveur lors de la création du compte' },
      { status: 500 }
    )
  }
} 