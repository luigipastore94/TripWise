import type React from 'react';
import {
  Compass,
  Utensils,
  Train,
  BedDouble,
  ShoppingBag,
  Sparkles,
  Star
} from 'lucide-react';
import type { ActivityCategory } from '../types/trip';

export interface PlaceCategoryMeta {
  label: string;
  shortLabel: string;
  colorHex: string;
  badgeClass: string;
  iconBoxClass: string;
  Icon: React.FC<{ className?: string }>;
}

export const PLACE_CATEGORY_META: Record<ActivityCategory, PlaceCategoryMeta> = {
  sightseeing: {
    label: 'Visita / Attrazione',
    shortLabel: 'Attrazioni',
    colorHex: '#4f46e5',
    badgeClass:
      'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    iconBoxClass:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300',
    Icon: Compass
  },
  food: {
    label: 'Cibo / Ristorante',
    shortLabel: 'Cibo & Locali',
    colorHex: '#f97316',
    badgeClass:
      'bg-orange-50 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 border-orange-200 dark:border-orange-800',
    iconBoxClass:
      'bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300',
    Icon: Utensils
  },
  lodging: {
    label: 'Alloggio / Hotel',
    shortLabel: 'Alloggi',
    colorHex: '#8b5cf6',
    badgeClass:
      'bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border-violet-200 dark:border-violet-800',
    iconBoxClass:
      'bg-violet-100 text-violet-700 dark:bg-violet-950/80 dark:text-violet-300',
    Icon: BedDouble
  },
  shopping: {
    label: 'Shopping / Negozio',
    shortLabel: 'Shopping',
    colorHex: '#ec4899',
    badgeClass:
      'bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    iconBoxClass:
      'bg-pink-100 text-pink-700 dark:bg-pink-950/80 dark:text-pink-300',
    Icon: ShoppingBag
  },
  hidden_gem: {
    label: 'Posto Segreto / Chicca',
    shortLabel: 'Chicche & Preferiti',
    colorHex: '#d97706',
    badgeClass:
      'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    iconBoxClass:
      'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300',
    Icon: Star
  },
  relax: {
    label: 'Relax / Tempo libero',
    shortLabel: 'Relax',
    colorHex: '#10b981',
    badgeClass:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    iconBoxClass:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300',
    Icon: Sparkles
  },
  transport: {
    label: 'Spostamento / Stazione',
    shortLabel: 'Trasporti',
    colorHex: '#0ea5e9',
    badgeClass:
      'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    iconBoxClass:
      'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300',
    Icon: Train
  }
};

export const PLACE_CATEGORY_ORDER: ActivityCategory[] = [
  'sightseeing',
  'food',
  'hidden_gem',
  'shopping',
  'lodging',
  'relax',
  'transport'
];

/**
 * Returns crisp inline SVG markup matching each category's Lucide icon
 * for rendering inside Leaflet `L.divIcon` map pins (when `pinStyle === 'category'`).
 */
export function getCategoryPinSvg(category: ActivityCategory, sizePx = 17): string {
  const attrs = `xmlns="http://www.w3.org/2000/svg" width="${sizePx}" height="${sizePx}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`;

  switch (category) {
    case 'food':
      return `<svg ${attrs}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`;
    case 'lodging':
      return `<svg ${attrs}><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/></svg>`;
    case 'shopping':
      return `<svg ${attrs}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
    case 'hidden_gem':
      return `<svg ${attrs}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="rgba(255,255,255,0.3)"/></svg>`;
    case 'relax':
      return `<svg ${attrs}><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" fill="rgba(255,255,255,0.25)"/></svg>`;
    case 'transport':
      return `<svg ${attrs}><rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h.01"/><path d="M16 15h.01"/></svg>`;
    case 'sightseeing':
    default:
      return `<svg ${attrs}><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="rgba(255,255,255,0.25)"/></svg>`;
  }
}
