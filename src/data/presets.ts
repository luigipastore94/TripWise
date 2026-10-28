import type { DestinationPreset } from '../types/trip';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  defaultRateFromEur: number;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'EUR', symbol: '€', name: 'Euro', defaultRateFromEur: 1, decimals: 2 },
  { code: 'JPY', symbol: '¥', name: 'Yen Giapponese', defaultRateFromEur: 162.5, decimals: 0 },
  { code: 'USD', symbol: '$', name: 'Dollaro USA', defaultRateFromEur: 1.08, decimals: 2 },
  { code: 'GBP', symbol: '£', name: 'Sterlina Britannica', defaultRateFromEur: 0.84, decimals: 2 },
  { code: 'CHF', symbol: 'CHF', name: 'Franco Svizzero', defaultRateFromEur: 0.94, decimals: 2 },
  { code: 'THB', symbol: '฿', name: 'Baht Thailandese', defaultRateFromEur: 37.2, decimals: 0 },
  { code: 'ISK', symbol: 'kr', name: 'Corona Islandese', defaultRateFromEur: 149.0, decimals: 0 },
  { code: 'CAD', symbol: 'CA$', name: 'Dollaro Canadese', defaultRateFromEur: 1.5, decimals: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Dollaro Australiano', defaultRateFromEur: 1.65, decimals: 2 },
  { code: 'KRW', symbol: '₩', name: 'Won Sudcoreano', defaultRateFromEur: 1480.0, decimals: 0 },
  { code: 'MAD', symbol: 'DH', name: 'Dirham Marocchino', defaultRateFromEur: 10.7, decimals: 2 },
  { code: 'NOK', symbol: 'kr', name: 'Corona Norvegese', defaultRateFromEur: 11.7, decimals: 2 }
];

export const MEMBER_COLORS = [
  '#4f46e5', // Indigo
  '#0ea5e9', // Sky
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6'  // Violet
];

export const DESTINATION_PRESETS: DestinationPreset[] = [
  {
    id: 'custom',
    name: 'Destinazione Libera / Universale',
    destination: '',
    emoji: '🌍',
    description: 'Configura qualsiasi paese, valuta e tappe nel mondo con checklist universale.',
    destinationCurrency: 'EUR',
    defaultExchangeRateFromEur: 1,
    defaultCenter: [41.9028, 12.4964],
    checklistItems: [
      { category: 'documents', text: 'Documento d’identità o Passaporto in corso di validità' },
      { category: 'documents', text: 'Assicurazione sanitaria / viaggio salvata offline' },
      { category: 'documents', text: 'Biglietti aerei/treni e conferme alloggi' },
      { category: 'electronics', text: 'Powerbank carico e cavi di ricarica' },
      { category: 'electronics', text: 'eSIM internazionale o verifica piano roaming' },
      { category: 'electronics', text: 'Adattatore universale da viaggio' },
      { category: 'money', text: 'Carta prepagata/multivaluta senza commissioni estero' },
      { category: 'health', text: 'Kit medicinali base da viaggio' },
      { category: 'luggage', text: 'Controllo franchigia peso e misure bagaglio' }
    ]
  },
  {
    id: 'japan',
    name: 'Giappone',
    destination: 'Giappone',
    emoji: '🇯🇵',
    description: 'Valuta JPY, coordinate Tokyo/Kyoto e checklist dedicata (Visit Japan Web, Suica, Tipo A).',
    destinationCurrency: 'JPY',
    defaultExchangeRateFromEur: 162.5,
    defaultCenter: [35.6762, 139.6503],
    checklistItems: [
      { category: 'documents', text: 'Passaporto valido per tutta la durata del soggiorno' },
      { category: 'documents', text: 'Registrazione Visit Japan Web (generare QR Code Immigrazione & Dogana)' },
      { category: 'documents', text: 'Assicurazione sanitaria massimale elevato' },
      { category: 'electronics', text: 'eSIM dati Giappone o prenotazione Pocket Wi-Fi' },
      { category: 'electronics', text: 'Adattatore presa elettrica Tipo A (2 lamelle piatte, 100V)' },
      { category: 'electronics', text: 'Powerbank capiente (indispensabile per mappe e traduttore)' },
      { category: 'electronics', text: 'Carta IC Suica / Pasmo / Icoca su Wallet o acquisto in aeroporto' },
      { category: 'money', text: 'Contanti in Yen / Carta multivaluta (Revolut/Wise) per prelievi ATM 7-Eleven' },
      { category: 'health', text: 'Kit medicinali personali (verificare restrizioni sostanze in Giappone)' },
      { category: 'luggage', text: 'Scarpe comode facili da togliere/rimettere (templi e ryokan)' },
      { category: 'luggage', text: 'Sacchetti per piccoli rifiuti (pochi cestini pubblici in strada)' },
      { category: 'luggage', text: 'Piccolo asciugamano tascabile per bagni pubblici' }
    ],
    sampleActivities: [
      {
        time: '09:30',
        title: 'Tempio Senso-ji e Nakamise-dori',
        locationName: 'Asakusa, Tokyo',
        lat: 35.7148,
        lng: 139.7967,
        category: 'sightseeing',
        notes: 'Passare dalla porta Kaminarimon e provare street food lungo la via.'
      },
      {
        time: '13:00',
        title: 'Pranzo Ramen / Sushi a Ueno o Akihabara',
        locationName: 'Akihabara, Tokyo',
        lat: 35.6984,
        lng: 139.7731,
        category: 'food',
        notes: 'Esplorare Electric Town nel pomeriggio.'
      },
      {
        time: '18:00',
        title: 'Tramonto e Shibuya Crossing',
        locationName: 'Shibuya Scramble Crossing, Tokyo',
        lat: 35.6595,
        lng: 139.7004,
        category: 'sightseeing',
        notes: 'Statua di Hachiko e vista panoramica da Shibuya Sky.'
      }
    ]
  },
  {
    id: 'usa',
    name: 'Stati Uniti',
    destination: 'Stati Uniti',
    emoji: '🇺🇸',
    description: 'Valuta USD, checklist ESTA, patente internazionale/noleggio e prese Tipo A/B.',
    destinationCurrency: 'USD',
    defaultExchangeRateFromEur: 1.08,
    defaultCenter: [40.7128, -74.006],
    checklistItems: [
      { category: 'documents', text: 'Passaporto elettronico valido' },
      { category: 'documents', text: 'Autorizzazione ESTA approvata (almeno 72h prima)' },
      { category: 'documents', text: 'Assicurazione sanitaria USA con massimale illimitato' },
      { category: 'documents', text: 'Patente + Carta di Credito intestata al guidatore (se auto a noleggio)' },
      { category: 'electronics', text: 'Adattatore presa Tipo A/B + eSIM USA' },
      { category: 'money', text: 'Sblocco utilizzo geografico carte di pagamento fuori Europa' },
      { category: 'health', text: 'Farmaci personali e kit primo soccorso da viaggio' }
    ]
  },
  {
    id: 'europe',
    name: 'Europa / City Break',
    destination: 'Europa',
    emoji: '🇪🇺',
    description: 'Ideale per weekend lunghi, road trip europei o capitali con bagaglio leggero.',
    destinationCurrency: 'EUR',
    defaultExchangeRateFromEur: 1,
    defaultCenter: [48.8566, 2.3522],
    checklistItems: [
      { category: 'documents', text: 'Carta d’identità valida per l’espatrio o Passaporto (es. UK)' },
      { category: 'documents', text: 'Tessera Sanitaria Europea (TEAM)' },
      { category: 'documents', text: 'Carte d’imbarco scaricate offline' },
      { category: 'electronics', text: 'Powerbank e caricabatterie' },
      { category: 'money', text: 'Carta di pagamento abilitata ai prelievi/pagamenti UE' },
      { category: 'health', text: 'Kit medicinali base da viaggio' },
      { category: 'luggage', text: 'Liquidi nel bagaglio a mano in bustina trasparente max 100ml' }
    ]
  },
  {
    id: 'uk',
    name: 'Regno Unito',
    destination: 'Regno Unito',
    emoji: '🇬🇧',
    description: 'Valuta Sterlina (GBP), ETA UK, passaporto e adattatore presa Tipo G.',
    destinationCurrency: 'GBP',
    defaultExchangeRateFromEur: 0.84,
    defaultCenter: [51.5074, -0.1278],
    checklistItems: [
      { category: 'documents', text: 'Passaporto obbligatorio + Autorizzazione elettronica ETA UK' },
      { category: 'electronics', text: 'Adattatore presa inglese Tipo G (3 poli rettangolari)' },
      { category: 'money', text: 'Carta contactless abilitata per trasporti pubblici (Tube/Bus)' },
      { category: 'health', text: 'Kit medicinali base e farmaci personali' }
    ]
  }
];
