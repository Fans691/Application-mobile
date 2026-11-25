import {
  bagHandleOutline,
  cubeOutline,
  idCardOutline,
  keyOutline,
  laptopOutline,
  pawOutline,
  phonePortraitOutline,
  shirtOutline,
  walletOutline,
  watchOutline,
} from 'ionicons/icons'

export interface Categorie {
  id: string
  libelle: string
  icon: string
  teinte: string
}

export const CATEGORIES: Categorie[] = [
  { id: 'telephone', libelle: 'Téléphone', icon: phonePortraitOutline, teinte: '#e8eefc' },
  { id: 'portefeuille', libelle: 'Portefeuille', icon: walletOutline, teinte: '#fbefe4' },
  { id: 'cles', libelle: 'Clés', icon: keyOutline, teinte: '#fdecec' },
  { id: 'sac', libelle: 'Sac', icon: bagHandleOutline, teinte: '#e7f0fb' },
  { id: 'papiers', libelle: 'Papiers', icon: idCardOutline, teinte: '#e6f4ea' },
  { id: 'electronique', libelle: 'Électronique', icon: laptopOutline, teinte: '#ecebfb' },
  { id: 'bijoux', libelle: 'Bijoux, montre', icon: watchOutline, teinte: '#f1f3f6' },
  { id: 'vetements', libelle: 'Vêtements', icon: shirtOutline, teinte: '#f6eefa' },
  { id: 'animal', libelle: 'Animal', icon: pawOutline, teinte: '#fdf1e3' },
  { id: 'autre', libelle: 'Autre', icon: cubeOutline, teinte: '#eef2f7' },
]

export function getCategorie(id?: string): Categorie {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}
