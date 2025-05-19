import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Vérifier le nombre total de profils
    const totalCount = await prisma.accountProfile.count();
    console.log(`Total des AccountProfiles dans la base : ${totalCount}`);

    // Récupérer tous les accountProfiles avec les informations nécessaires
    const profiles = await prisma.accountProfile.findMany({
      include: {
        account: {
          include: {
            platform: true
          },
        },
        subscription: {
          select: {
            id: true,
            status: true,
            startDate: true,
            endDate: true
          }
        }
      }
    });

    // Log pour le débogage
    console.log(`Récupération de ${profiles.length} profils de compte`);

    // Vérifier et corriger les données
    const validProfiles = profiles.filter(profile => 
      profile && profile.account && profile.account.platform
    );

    console.log(`Nombre de profils valides : ${validProfiles.length}`);
    
    if (validProfiles.length < profiles.length) {
      console.warn(`${profiles.length - validProfiles.length} profils ont été filtrés car ils étaient invalides ou incomplets`);
    }

    // Convertir les dates en chaînes de caractères pour JSON
    const formattedProfiles = validProfiles.map(profile => {
      try {
        return {
          id: profile.id,
          accountId: profile.accountId,
          name: profile.name,
          profileSlot: profile.profileSlot,
          pin: profile.pin,
          isAssigned: profile.isAssigned,
          subscriptionId: profile.subscriptionId,
          account: {
            id: profile.account.id,
            username: profile.account.username,
            platform: {
              id: profile.account.platform.id,
              name: profile.account.platform.name,
              logo: profile.account.platform.logo,
              maxProfilesPerAccount: profile.account.platform.maxProfilesPerAccount
            }
          },
          subscription: profile.subscription ? {
            id: profile.subscription.id,
            status: profile.subscription.status,
            startDate: profile.subscription.startDate.toISOString(),
            endDate: profile.subscription.endDate.toISOString()
          } : null
        };
      } catch (error) {
        console.error('Erreur lors du formatage du profil:', error);
        return null;
      }
    }).filter(Boolean);

    console.log(`Renvoi de ${formattedProfiles.length} profils formatés`);

    return NextResponse.json(formattedProfiles);
  } catch (error) {
    console.error('Erreur lors de la récupération des profils:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des profils', details: String(error) },
      { status: 500 }
    );
  }
} 