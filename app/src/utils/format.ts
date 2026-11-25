import type { Timestamp } from 'firebase/firestore'
import type { StatutObjet, StatutPrime } from '@/types/models'

const nombre = new Intl.NumberFormat('fr-FR')

export function formatAriary(montant: number): string {
  return `${nombre.format(montant || 0)} Ar`
}

export function formatNombre(valeur: number): string {
  return nombre.format(valeur || 0)
}

export function formatDate(value?: Timestamp | string | null): string {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value.toDate()
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateHeure(value?: Timestamp | null): string {
  if (!value) return ''
  return value.toDate().toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelatif(value?: Timestamp | null): string {
  if (!value) return ''
  const secondes = (Date.now() - value.toMillis()) / 1000
  if (secondes < 60) return "À l'instant"
  if (secondes < 3600) return `Il y a ${Math.floor(secondes / 60)} min`
  if (secondes < 86400) return `Il y a ${Math.floor(secondes / 3600)} h`
  if (secondes < 86400 * 7) return `Il y a ${Math.floor(secondes / 86400)} j`
  return formatDate(value)
}

export const STATUT_LABEL: Record<StatutObjet, string> = {
  perdu: 'Perdu',
  trouve: 'En restitution',
  recupere: 'Récupéré',
}

export const PRIME_LABEL: Record<StatutPrime, string> = {
  aucune: 'Sans prime',
  due: 'Prime due',
  payee: 'Prime payée',
}

export function erreurMessage(error: unknown, defaut = 'Une erreur est survenue.'): string {
  if (error instanceof Error && error.message) return error.message
  return defaut
}

export function initiales(nom: string): string {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .map((mot) => mot[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
