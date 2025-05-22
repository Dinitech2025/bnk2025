import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { requireStaff } from '@/lib/auth'
import { Account as PrismaAccount, Platform, Prisma } from '@prisma/client'

interface AccountWithRelations extends Omit<PrismaAccount, 'createdAt' | 'updatedAt'> {
  platform: Platform;
  createdAt: Date | null;
  updatedAt: Date | null;
  accountProfiles: Array<{
    id: string;
    profileSlot: number;
    name: string | null;
    isAssigned: boolean;
    pin: string | null;
    subscriptionId: string | null;
    subscription: {
      id: string;
      status: string;
      startDate: Date;
      endDate: Date;
      user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
        email: string;
      };
    } | null;
  }>;
}

interface AccountDates {
  createdAt: Date;
  updatedAt: Date;
}

// GET - Récupérer un compte spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // En production: const user = await requireStaff()
    
    // Récupérer les dates avec une requête SQL directe
    const dates = await db.$queryRaw<AccountDates[]>`
      SELECT "createdAt", "updatedAt"
      FROM "Account"
      WHERE id = ${params.id}
    `

    if (dates.length === 0) {
      return NextResponse.json(
        { message: 'Compte non trouvé' },
        { status: 404 }
      )
    }

    console.log('Dates du compte dans la base de données:', dates)
    
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
            subscriptionId: true,
            subscription: {
              select: {
                id: true,
                status: true,
                startDate: true,
                endDate: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
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

    // Fusionner les données du compte avec les dates
    const accountWithDates = {
      ...account,
      createdAt: dates[0].createdAt,
      updatedAt: dates[0].updatedAt
    }

    console.log('Dates du compte avant formatage:', {
      createdAt: accountWithDates.createdAt,
      updatedAt: accountWithDates.updatedAt
    })

    // Convertir les dates en chaînes ISO
    const formattedAccount = {
      ...accountWithDates,
      createdAt: accountWithDates.createdAt.toISOString(),
      updatedAt: accountWithDates.updatedAt.toISOString(),
      accountProfiles: accountWithDates.accountProfiles.map(profile => ({
        ...profile,
        subscription: profile.subscription ? {
          ...profile.subscription,
          startDate: profile.subscription.startDate.toISOString(),
          endDate: profile.subscription.endDate.toISOString()
        } : null
      }))
    }

    console.log('Dates du compte après formatage:', {
      createdAt: formattedAccount.createdAt,
      updatedAt: formattedAccount.updatedAt
    })

    return NextResponse.json(formattedAccount)
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
            subscriptionId: true,
            subscription: {
              select: {
                id: true,
                status: true,
                startDate: true,
                endDate: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    }) as AccountWithRelations

    // Formater les dates avant de renvoyer la réponse
    const formattedAccount = {
      ...updatedAccount,
      createdAt: updatedAccount.createdAt ? updatedAccount.createdAt.toISOString() : null,
      updatedAt: updatedAccount.updatedAt ? updatedAccount.updatedAt.toISOString() : null,
      accountProfiles: updatedAccount.accountProfiles.map(profile => ({
        ...profile,
        subscription: profile.subscription ? {
          ...profile.subscription,
          startDate: profile.subscription.startDate.toISOString(),
          endDate: profile.subscription.endDate.toISOString()
        } : null
      }))
    }

    return NextResponse.json(formattedAccount)
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
            subscriptionId: true,
            subscription: {
              select: {
                id: true,
                status: true,
                startDate: true,
                endDate: true,
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    }) as AccountWithRelations

    // Formater les dates avant de renvoyer la réponse
    const formattedAccount = {
      ...updatedAccount,
      createdAt: updatedAccount.createdAt ? updatedAccount.createdAt.toISOString() : null,
      updatedAt: updatedAccount.updatedAt ? updatedAccount.updatedAt.toISOString() : null,
      accountProfiles: updatedAccount.accountProfiles.map(profile => ({
        ...profile,
        subscription: profile.subscription ? {
          ...profile.subscription,
          startDate: profile.subscription.startDate.toISOString(),
          endDate: profile.subscription.endDate.toISOString()
        } : null
      }))
    }

    return NextResponse.json(formattedAccount)
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