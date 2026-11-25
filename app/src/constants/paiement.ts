import type { MethodePaiement } from '@/types/models'

export const FRAIS_DECLARATION_DEFAUT = 2000

export const METHODES_PAIEMENT: { id: MethodePaiement; libelle: string; detail: string }[] = [
  { id: 'mvola', libelle: 'MVola', detail: 'Numéro 034 / 038' },
  { id: 'orange_money', libelle: 'Orange Money', detail: 'Numéro 032 / 037' },
  { id: 'airtel_money', libelle: 'Airtel Money', detail: 'Numéro 033' },
  { id: 'carte', libelle: 'Carte bancaire', detail: 'Visa, Mastercard' },
]

export function libelleMethode(id?: string): string {
  return METHODES_PAIEMENT.find((m) => m.id === id)?.libelle ?? 'Autre'
}
