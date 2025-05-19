import cron from 'node-cron';
import { updateSubscriptionStatuses } from './update-subscription-status';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('Démarrage du planificateur de tâches...');

// Exécuter tous les jours à minuit
cron.schedule('0 0 * * *', async () => {
  console.log(`Exécution programmée de la mise à jour des abonnements : ${new Date().toISOString()}`);
  
  try {
    await updateSubscriptionStatuses();
    console.log('Mise à jour des abonnements terminée avec succès');
  } catch (error) {
    console.error('Erreur lors de la mise à jour des abonnements :', error);
  }
});

// Exécuter aussi la mise à jour au démarrage du script
(async () => {
  console.log('Exécution initiale de la mise à jour des abonnements...');
  
  try {
    await updateSubscriptionStatuses();
    console.log('Mise à jour initiale des abonnements terminée avec succès');
  } catch (error) {
    console.error('Erreur lors de la mise à jour initiale des abonnements :', error);
  }
})();

// Maintenir le processus actif
process.stdin.resume();

console.log('Planificateur de tâches démarré avec succès. Exécution quotidienne à minuit.');
console.log('Appuyez sur Ctrl+C pour arrêter le processus.'); 