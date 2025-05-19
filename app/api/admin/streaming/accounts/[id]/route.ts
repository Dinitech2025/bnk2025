import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireStaff } from '@/lib/auth'

// GET - Récupérer un compte spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // En production: const user = await requireStaff()
    
    const account = await db.account.findUnique({
      where: { id: params.id },
      include: {
        platform: true,
        accountProfiles: {
          select: {
            id: true,
            profileSlot: true,
            name: true,
            isAssigned: true,
            pin: true,
            subscriptionId: true
          }
        }
      },
    })

    if (!account) {
      return NextResponse.json(
        { message: 'Compte non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(account)
  } catch (error) {
    console.error('Erreur lors de la récupération du compte:', error)
    return NextResponse.json(
      { message: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour toutes les informations d'un compte
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Vérifier si le compte existe
    const existingAccount = await db.account.findUnique({
      where: { id: params.id },
      include: { accountProfiles: true }
    })

    if (!existingAccount) {
      return NextResponse.json(
        { message: 'Compte non trouvé' },
        { status: 404 }
      )
    }

    // Si on change de plateforme et que le compte a des profils, interdire le changement
    if (existingAccount.platformId !== platformId && existingAccount.accountProfiles.length > 0) {
      return NextResponse.json(
        { message: 'Impossible de changer la plateforme d\'un compte qui a déjà des profils' },
        { status: 400 }
      )
    }

    // Mettre à jour les noms des profils si le nom d'utilisateur change
    if (username !== existingAccount.username) {
      await Promise.all(existingAccount.accountProfiles.map(profile => 
        db.accountProfile.update({
          where: { id: profile.id },
          data: {
            name: `${username} - Profil ${profile.profileSlot}`
          }
        })
      ));
    }

    // Mettre à jour le compte
    const updatedAccount = await db.account.update({
      where: { id: params.id },
      data: {
        username,
        email: email || null,
        password,
        status,
        platformId,
      },
      include: {
        platform: true,
        accountProfiles: {
          select: {
            id: true,
            profileSlot: true,
            name: true,
            isAssigned: true,
            pin: true,
            subscriptionId: true
          }
        }
      }
    })

    return NextResponse.json(updatedAccount)
  } catch (error) {
    console.error('Erreur lors de la mise à jour du compte:', error)
    return NextResponse.json(
      { message: 'Erreur serveur lors de la mise à jour du compte' },
      { status: 500 }
    )
  }
}

// PATCH - Mettre à jour partiellement un compte (ex: statut)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // En production: const user = await requireStaff()
    
    const data = await request.json()

    // Vérifier si le compte existe
    const existingAccount = await db.account.findUnique({
      where: { id: params.id }
    })

    if (!existingAccount) {
      return NextResponse.json(
        { message: 'Compte non trouvé' },
        { status: 404 }
      )
    }

    // Mettre à jour le compte avec seulement les champs fournis
    const updatedAccount = await db.account.update({
      where: { id: params.id },
      data,
      include: {
        platform: true,
        accountProfiles: {
          select: {
            id: true,
            profileSlot: true,
            name: true,
            isAssigned: true,
            pin: true,
            subscriptionId: true
          }
        }
      }
    })

    return NextResponse.json(updatedAccount)
  } catch (error) {
    console.error('Erreur lors de la mise à jour partielle du compte:', error)
    return NextResponse.json(
      { message: 'Erreur serveur lors de la mise à jour du compte' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un compte (et tous ses profils en cascade)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // En production: const user = await requireStaff()
    
    // Vérifier si le compte existe
    const existingAccount = await db.account.findUnique({
      where: { id: params.id }
    })

    if (!existingAccount) {
      return NextResponse.json(
        { message: 'Compte non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer le compte (les profils seront supprimés en cascade grâce à la configuration Prisma)
    await db.account.delete({
      where: { id: params.id }
    })

    return NextResponse.json(
      { message: 'Compte supprimé avec succès' }
    )
  } catch (error) {
    console.error('Erreur lors de la suppression du compte:', error)
    return NextResponse.json(
      { message: 'Erreur serveur lors de la suppression du compte' },
      { status: 500 }
    )
  }
} 