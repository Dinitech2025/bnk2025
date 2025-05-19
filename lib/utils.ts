import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Convertit une chaîne en format slug (minuscules, sans accents, avec des tirets)
 */
export function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '') // Supprime les caractères spéciaux
    .replace(/\s+/g, '-') // Remplace les espaces par des tirets
}

/**
 * Génère un numéro de commande au format CMD-ANNÉE-NNNN
 * @param lastOrderNumber Le dernier numéro de commande (optionnel)
 * @returns Un nouveau numéro de commande
 */
export function generateOrderNumber(lastOrderNumber?: string | null): string {
  const currentYear = new Date().getFullYear();
  const prefix = `CMD-${currentYear}-`;
  
  // Si aucun numéro précédent n'existe, commencer à 0001
  if (!lastOrderNumber) {
    return `${prefix}0001`;
  }
  
  // Extraire le numéro séquentiel du dernier numéro de commande
  const match = lastOrderNumber.match(/CMD-\d{4}-(\d{4})/);
  if (!match) {
    return `${prefix}0001`;
  }
  
  // Incrémenter le numéro et ajouter des zéros au début si nécessaire
  const nextNumber = parseInt(match[1], 10) + 1;
  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Formate une date en utilisant la localisation française
 */
export function formatDate(date: string | Date | null | undefined, formatStr: string = 'PPP') {
  if (!date) return 'Non spécifié'
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return format(dateObj, formatStr, { locale: fr })
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error)
    return String(date)
  }
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
}

/**
 * Formate une durée selon son unité (jour, semaine, mois, année)
 */
export function formatDuration(duration: number, unit: string): string {
  const unitMap: Record<string, string> = {
    DAY: "jour",
    WEEK: "semaine",
    MONTH: "mois", 
    YEAR: "année"
  };
  
  const unitLabel = unitMap[unit] || unit.toLowerCase();
  
  // Le mot "mois" reste invariable au pluriel en français
  if (unit === "MONTH") {
    return `${duration} ${unitLabel}`;
  }
  
  return `${duration} ${unitLabel}${duration > 1 ? "s" : ""}`;
} 