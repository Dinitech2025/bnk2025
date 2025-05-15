import { ClassValue, clsx } from 'clsx'
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