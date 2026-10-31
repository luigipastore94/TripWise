import type { ActivityCategory } from '../types/trip';

export interface CityInfo {
  canonical: string;
  countryPresetId: string;
  countryName: string;
  emoji: string;
  currency: string;
  rateFromEur: number;
  lat: number;
  lng: number;
  stationOrAirportLat?: number;
  stationOrAirportLng?: number;
  freeDaySuggestions?: Array<{
    time: string;
    title: string;
    locationName: string;
    lat: number;
    lng: number;
    category: ActivityCategory;
    notes?: string;
  }>;
}

export const CITY_CATALOG: Record<string, CityInfo> = {
  // =========================================================================
  // GIAPPONE
  // =========================================================================
  tokyo: {
    canonical: 'Tokyo',
    countryPresetId: 'japan',
    countryName: 'Giappone',
    emoji: '🇯🇵',
    currency: 'JPY',
    rateFromEur: 162.5,
    lat: 35.6812,
    lng: 139.7671,
    freeDaySuggestions: [
      {
        time: '09:15',
        title: 'Tempio Senso-ji e Nakamise-dori',
        locationName: 'Asakusa, Tokyo',
        lat: 35.7148,
        lng: 139.7967,
        category: 'sightseeing',
        notes: 'Porta Kaminarimon e botteghe storiche di Asakusa.'
      },
      {
        time: '13:30',
        title: 'Santuario Meiji Jingu & Harajuku',
        locationName: 'Meiji Jingu, Shibuya, Tokyo',
        lat: 35.6764,
        lng: 139.6993,
        category: 'sightseeing'
      },
      {
        time: '18:00',
        title: 'Shibuya Crossing & Vista serale',
        locationName: 'Shibuya Scramble Crossing, Tokyo',
        lat: 35.6595,
        lng: 139.7004,
        category: 'sightseeing'
      }
    ]
  },
  fujikawaguchiko: {
    canonical: 'Fujikawaguchiko',
    countryPresetId: 'japan',
    countryName: 'Giappone',
    emoji: '🇯🇵',
    currency: 'JPY',
    rateFromEur: 162.5,
    lat: 35.4982,
    lng: 138.7686
  },
  kyoto: {
    canonical: 'Kyoto',
    countryPresetId: 'japan',
    countryName: 'Giappone',
    emoji: '🇯🇵',
    currency: 'JPY',
    rateFromEur: 162.5,
    lat: 34.9858,
    lng: 135.7588
  },
  hiroshima: {
    canonical: 'Hiroshima',
    countryPresetId: 'japan',
    countryName: 'Giappone',
    emoji: '🇯🇵',
    currency: 'JPY',
    rateFromEur: 162.5,
    lat: 34.3955,
    lng: 132.4536
  },
  osaka: {
    canonical: 'Osaka',
    countryPresetId: 'japan',
    countryName: 'Giappone',
    emoji: '🇯🇵',
    currency: 'JPY',
    rateFromEur: 162.5,
    lat: 34.6937,
    lng: 135.5023
  },
  matsumoto: {
    canonical: 'Matsumoto',
    countryPresetId: 'japan',
    countryName: 'Giappone',
    emoji: '🇯🇵',
    currency: 'JPY',
    rateFromEur: 162.5,
    lat: 36.2388,
    lng: 137.9691
  },
  takayama: {
    canonical: 'Takayama',
    countryPresetId: 'japan',
    countryName: 'Giappone',
    emoji: '🇯🇵',
    currency: 'JPY',
    rateFromEur: 162.5,
    lat: 36.1458,
    lng: 137.2533
  },
  'shirakawa-go': {
    canonical: 'Shirakawa-go',
    countryPresetId: 'japan',
    countryName: 'Giappone',
    emoji: '🇯🇵',
    currency: 'JPY',
    rateFromEur: 162.5,
    lat: 36.2577,
    lng: 136.9064
  },
  kanazawa: {
    canonical: 'Kanazawa',
    countryPresetId: 'japan',
    countryName: 'Giappone',
    emoji: '🇯🇵',
    currency: 'JPY',
    rateFromEur: 162.5,
    lat: 36.5613,
    lng: 136.6562
  },
  nagano: {
    canonical: 'Nagano',
    countryPresetId: 'japan',
    countryName: 'Giappone',
    emoji: '🇯🇵',
    currency: 'JPY',
    rateFromEur: 162.5,
    lat: 36.6486,
    lng: 138.1948
  },
  giappone: {
    canonical: 'Giappone',
    countryPresetId: 'japan',
    countryName: 'Giappone',
    emoji: '🇯🇵',
    currency: 'JPY',
    rateFromEur: 162.5,
    lat: 35.6812,
    lng: 139.7671
  },

  // =========================================================================
  // ITALIA
  // =========================================================================
  roma: {
    canonical: 'Roma',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 41.9028,
    lng: 12.4964,
    freeDaySuggestions: [
      {
        time: '09:30',
        title: 'Colosseo & Fori Imperiali',
        locationName: 'Piazza del Colosseo, Roma',
        lat: 41.8902,
        lng: 12.4922,
        category: 'sightseeing'
      },
      {
        time: '14:30',
        title: 'Fontana di Trevi & Pantheon',
        locationName: 'Piazza della Rotonda, Roma',
        lat: 41.8986,
        lng: 12.4769,
        category: 'sightseeing'
      },
      {
        time: '19:30',
        title: 'Cena a Trastevere',
        locationName: 'Trastevere, Roma',
        lat: 41.8893,
        lng: 12.4705,
        category: 'food'
      }
    ]
  },
  firenze: {
    canonical: 'Firenze',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 43.7696,
    lng: 11.2558
  },
  venezia: {
    canonical: 'Venezia',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 45.4408,
    lng: 12.3155
  },
  milano: {
    canonical: 'Milano',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 45.4642,
    lng: 9.19
  },
  napoli: {
    canonical: 'Napoli',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 40.8518,
    lng: 14.2681
  },
  siena: {
    canonical: 'Siena',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 43.3188,
    lng: 11.3308
  },
  lucca: {
    canonical: 'Lucca',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 43.8429,
    lng: 10.5027
  },
  pisa: {
    canonical: 'Pisa',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 43.7228,
    lng: 10.4017
  },
  volterra: {
    canonical: 'Volterra',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 43.4025,
    lng: 10.8606
  },
  'san gimignano': {
    canonical: 'San Gimignano',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 43.4677,
    lng: 11.0436
  },
  toscana: {
    canonical: 'Toscana',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 43.4167,
    lng: 11.15
  },
  "val d'orcia": {
    canonical: "Val d'Orcia",
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 43.0167,
    lng: 11.6167
  },
  dolomiti: {
    canonical: 'Dolomiti',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 46.4102,
    lng: 11.844
  },
  'val pusteria': {
    canonical: 'Val Pusteria',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 46.7381,
    lng: 11.9378
  },
  'val gardena': {
    canonical: 'Val Gardena',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 46.556,
    lng: 11.724
  },
  cortina: {
    canonical: "Cortina d'Ampezzo",
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 46.5405,
    lng: 12.1357
  },
  catania: {
    canonical: 'Catania',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 37.5079,
    lng: 15.0873,
    freeDaySuggestions: [
      {
        time: '09:30',
        title: 'Piazza del Duomo & Cattedrale di Sant’Agata',
        locationName: 'Piazza del Duomo, Catania',
        lat: 37.5025,
        lng: 15.0871,
        category: 'sightseeing',
        notes: 'Fontana dell’Elefante e barocco catanese.'
      },
      {
        time: '13:00',
        title: 'Pranzo e street food alla Pescheria di Catania',
        locationName: 'Pescheria di Catania',
        lat: 37.5019,
        lng: 15.0863,
        category: 'food',
        notes: 'Storico mercato del pesce con degustazione di pesce fresco.'
      }
    ]
  },
  siracusa: {
    canonical: 'Siracusa',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 37.0755,
    lng: 15.2866,
    freeDaySuggestions: [
      {
        time: '10:00',
        title: 'Isola di Ortigia e Duomo di Siracusa',
        locationName: 'Piazza Duomo, Ortigia, Siracusa',
        lat: 37.0596,
        lng: 15.2933,
        category: 'sightseeing',
        notes: 'Piazza Duomo, Fonte Aretusa e vicoli storici.'
      }
    ]
  },
  taormina: {
    canonical: 'Taormina',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 37.8516,
    lng: 15.2853,
    freeDaySuggestions: [
      {
        time: '10:00',
        title: 'Teatro Antico di Taormina',
        locationName: 'Via del Teatro Greco, Taormina',
        lat: 37.8524,
        lng: 15.2922,
        category: 'sightseeing',
        notes: 'Teatro greco-romano con panorama sull’Etna e sul Mar Ionio.'
      }
    ]
  },
  noto: {
    canonical: 'Noto',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 36.8916,
    lng: 15.0704
  },
  ragusa: {
    canonical: 'Ragusa',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 36.9269,
    lng: 14.7306
  },
  agrigento: {
    canonical: 'Agrigento',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 37.3111,
    lng: 13.5765
  },
  palermo: {
    canonical: 'Palermo',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 38.1157,
    lng: 13.3615
  },
  sicilia: {
    canonical: 'Sicilia',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 37.5999,
    lng: 14.0154
  },
  italia: {
    canonical: 'Italia',
    countryPresetId: 'europe',
    countryName: 'Italia',
    emoji: '🇮🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 41.9028,
    lng: 12.4964
  },

  // =========================================================================
  // ISLANDA
  // =========================================================================
  islanda: {
    canonical: 'Islanda',
    countryPresetId: 'europe',
    countryName: 'Islanda',
    emoji: '🇮🇸',
    currency: 'ISK',
    rateFromEur: 149.0,
    lat: 64.9631,
    lng: -19.0208
  },
  reykjavik: {
    canonical: 'Reykjavik',
    countryPresetId: 'europe',
    countryName: 'Islanda',
    emoji: '🇮🇸',
    currency: 'ISK',
    rateFromEur: 149.0,
    lat: 64.1466,
    lng: -21.9426
  },
  keflavik: {
    canonical: 'Keflavik',
    countryPresetId: 'europe',
    countryName: 'Islanda',
    emoji: '🇮🇸',
    currency: 'ISK',
    rateFromEur: 149.0,
    lat: 64.0028,
    lng: -22.5606
  },
  vik: {
    canonical: 'Vik',
    countryPresetId: 'europe',
    countryName: 'Islanda',
    emoji: '🇮🇸',
    currency: 'ISK',
    rateFromEur: 149.0,
    lat: 63.4186,
    lng: -19.006
  },

  // =========================================================================
  // STATI UNITI
  // =========================================================================
  'new york': {
    canonical: 'New York',
    countryPresetId: 'usa',
    countryName: 'Stati Uniti',
    emoji: '🇺🇸',
    currency: 'USD',
    rateFromEur: 1.08,
    lat: 40.7128,
    lng: -74.006
  },
  'san francisco': {
    canonical: 'San Francisco',
    countryPresetId: 'usa',
    countryName: 'Stati Uniti',
    emoji: '🇺🇸',
    currency: 'USD',
    rateFromEur: 1.08,
    lat: 37.7749,
    lng: -122.4194
  },
  'los angeles': {
    canonical: 'Los Angeles',
    countryPresetId: 'usa',
    countryName: 'Stati Uniti',
    emoji: '🇺🇸',
    currency: 'USD',
    rateFromEur: 1.08,
    lat: 34.0522,
    lng: -118.2437
  },
  'las vegas': {
    canonical: 'Las Vegas',
    countryPresetId: 'usa',
    countryName: 'Stati Uniti',
    emoji: '🇺🇸',
    currency: 'USD',
    rateFromEur: 1.08,
    lat: 36.1699,
    lng: -115.1398
  },
  'grand canyon': {
    canonical: 'Grand Canyon',
    countryPresetId: 'usa',
    countryName: 'Stati Uniti',
    emoji: '🇺🇸',
    currency: 'USD',
    rateFromEur: 1.08,
    lat: 36.0544,
    lng: -112.1401
  },
  yosemite: {
    canonical: 'Yosemite',
    countryPresetId: 'usa',
    countryName: 'Stati Uniti',
    emoji: '🇺🇸',
    currency: 'USD',
    rateFromEur: 1.08,
    lat: 37.8651,
    lng: -119.5383
  },
  zion: {
    canonical: 'Zion',
    countryPresetId: 'usa',
    countryName: 'Stati Uniti',
    emoji: '🇺🇸',
    currency: 'USD',
    rateFromEur: 1.08,
    lat: 37.2982,
    lng: -113.0263
  },
  springdale: {
    canonical: 'Springdale',
    countryPresetId: 'usa',
    countryName: 'Stati Uniti',
    emoji: '🇺🇸',
    currency: 'USD',
    rateFromEur: 1.08,
    lat: 37.1889,
    lng: -112.9986
  },
  bryce: {
    canonical: 'Bryce Canyon',
    countryPresetId: 'usa',
    countryName: 'Stati Uniti',
    emoji: '🇺🇸',
    currency: 'USD',
    rateFromEur: 1.08,
    lat: 37.593,
    lng: -112.1871
  },
  'bryce canyon': {
    canonical: 'Bryce Canyon',
    countryPresetId: 'usa',
    countryName: 'Stati Uniti',
    emoji: '🇺🇸',
    currency: 'USD',
    rateFromEur: 1.08,
    lat: 37.593,
    lng: -112.1871
  },
  page: {
    canonical: 'Page',
    countryPresetId: 'usa',
    countryName: 'Stati Uniti',
    emoji: '🇺🇸',
    currency: 'USD',
    rateFromEur: 1.08,
    lat: 36.9147,
    lng: -111.4558
  },
  'monument valley': {
    canonical: 'Monument Valley',
    countryPresetId: 'usa',
    countryName: 'Stati Uniti',
    emoji: '🇺🇸',
    currency: 'USD',
    rateFromEur: 1.08,
    lat: 36.998,
    lng: -110.0985
  },
  usa: {
    canonical: 'Stati Uniti',
    countryPresetId: 'usa',
    countryName: 'Stati Uniti',
    emoji: '🇺🇸',
    currency: 'USD',
    rateFromEur: 1.08,
    lat: 39.8283,
    lng: -98.5795
  },
  'stati uniti': {
    canonical: 'Stati Uniti',
    countryPresetId: 'usa',
    countryName: 'Stati Uniti',
    emoji: '🇺🇸',
    currency: 'USD',
    rateFromEur: 1.08,
    lat: 39.8283,
    lng: -98.5795
  },

  // =========================================================================
  // FRANCIA
  // =========================================================================
  parigi: {
    canonical: 'Parigi',
    countryPresetId: 'europe',
    countryName: 'Francia',
    emoji: '🇫🇷',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 48.8566,
    lng: 2.3522
  },
  loira: {
    canonical: 'Valle della Loira',
    countryPresetId: 'europe',
    countryName: 'Francia',
    emoji: '🇫🇷',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 47.3941,
    lng: 0.6848
  },
  francia: {
    canonical: 'Francia',
    countryPresetId: 'europe',
    countryName: 'Francia',
    emoji: '🇫🇷',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 48.8566,
    lng: 2.3522
  },

  // =========================================================================
  // SPAGNA
  // =========================================================================
  barcellona: {
    canonical: 'Barcellona',
    countryPresetId: 'europe',
    countryName: 'Spagna',
    emoji: '🇪🇸',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 41.3874,
    lng: 2.1686
  },
  madrid: {
    canonical: 'Madrid',
    countryPresetId: 'europe',
    countryName: 'Spagna',
    emoji: '🇪🇸',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 40.4168,
    lng: -3.7038
  },
  siviglia: {
    canonical: 'Siviglia',
    countryPresetId: 'europe',
    countryName: 'Spagna',
    emoji: '🇪🇸',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 37.3891,
    lng: -5.9845
  },
  cordoba: {
    canonical: 'Cordoba',
    countryPresetId: 'europe',
    countryName: 'Spagna',
    emoji: '🇪🇸',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 37.8882,
    lng: -4.7794
  },
  granada: {
    canonical: 'Granada',
    countryPresetId: 'europe',
    countryName: 'Spagna',
    emoji: '🇪🇸',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 37.1773,
    lng: -3.5986
  },
  andalusia: {
    canonical: 'Andalusia',
    countryPresetId: 'europe',
    countryName: 'Spagna',
    emoji: '🇪🇸',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 37.3891,
    lng: -5.9845
  },
  spagna: {
    canonical: 'Spagna',
    countryPresetId: 'europe',
    countryName: 'Spagna',
    emoji: '🇪🇸',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 40.4168,
    lng: -3.7038
  },

  // =========================================================================
  // REGNO UNITO & SCOZIA
  // =========================================================================
  londra: {
    canonical: 'Londra',
    countryPresetId: 'uk',
    countryName: 'Regno Unito',
    emoji: '🇬🇧',
    currency: 'GBP',
    rateFromEur: 0.84,
    lat: 51.5074,
    lng: -0.1278
  },
  edimburgo: {
    canonical: 'Edimburgo',
    countryPresetId: 'uk',
    countryName: 'Regno Unito',
    emoji: '🇬🇧',
    currency: 'GBP',
    rateFromEur: 0.84,
    lat: 55.9533,
    lng: -3.1883
  },
  scozia: {
    canonical: 'Scozia',
    countryPresetId: 'uk',
    countryName: 'Regno Unito',
    emoji: '🇬🇧',
    currency: 'GBP',
    rateFromEur: 0.84,
    lat: 56.4907,
    lng: -4.2026
  },
  'regno unito': {
    canonical: 'Regno Unito',
    countryPresetId: 'uk',
    countryName: 'Regno Unito',
    emoji: '🇬🇧',
    currency: 'GBP',
    rateFromEur: 0.84,
    lat: 51.5074,
    lng: -0.1278
  },
  'gran bretagna': {
    canonical: 'Regno Unito',
    countryPresetId: 'uk',
    countryName: 'Regno Unito',
    emoji: '🇬🇧',
    currency: 'GBP',
    rateFromEur: 0.84,
    lat: 51.5074,
    lng: -0.1278
  },
  uk: {
    canonical: 'Regno Unito',
    countryPresetId: 'uk',
    countryName: 'Regno Unito',
    emoji: '🇬🇧',
    currency: 'GBP',
    rateFromEur: 0.84,
    lat: 51.5074,
    lng: -0.1278
  },

  // =========================================================================
  // THAILANDIA
  // =========================================================================
  bangkok: {
    canonical: 'Bangkok',
    countryPresetId: 'custom',
    countryName: 'Thailandia',
    emoji: '🇹🇭',
    currency: 'THB',
    rateFromEur: 37.2,
    lat: 13.7563,
    lng: 100.5018
  },
  'chiang mai': {
    canonical: 'Chiang Mai',
    countryPresetId: 'custom',
    countryName: 'Thailandia',
    emoji: '🇹🇭',
    currency: 'THB',
    rateFromEur: 37.2,
    lat: 18.7883,
    lng: 98.9853
  },
  phuket: {
    canonical: 'Phuket',
    countryPresetId: 'custom',
    countryName: 'Thailandia',
    emoji: '🇹🇭',
    currency: 'THB',
    rateFromEur: 37.2,
    lat: 7.8804,
    lng: 98.3923
  },
  thailandia: {
    canonical: 'Thailandia',
    countryPresetId: 'custom',
    countryName: 'Thailandia',
    emoji: '🇹🇭',
    currency: 'THB',
    rateFromEur: 37.2,
    lat: 15.87,
    lng: 100.9925
  },

  // =========================================================================
  // GRECIA
  // =========================================================================
  atene: {
    canonical: 'Atene',
    countryPresetId: 'europe',
    countryName: 'Grecia',
    emoji: '🇬🇷',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 37.9838,
    lng: 23.7275
  },
  santorini: {
    canonical: 'Santorini',
    countryPresetId: 'europe',
    countryName: 'Grecia',
    emoji: '🇬🇷',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 36.3932,
    lng: 25.4615
  },
  grecia: {
    canonical: 'Grecia',
    countryPresetId: 'europe',
    countryName: 'Grecia',
    emoji: '🇬🇷',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 39.0742,
    lng: 21.8243
  },

  // =========================================================================
  // NORVEGIA
  // =========================================================================
  oslo: {
    canonical: 'Oslo',
    countryPresetId: 'custom',
    countryName: 'Norvegia',
    emoji: '🇳🇴',
    currency: 'NOK',
    rateFromEur: 11.7,
    lat: 59.9139,
    lng: 10.7522
  },
  bergen: {
    canonical: 'Bergen',
    countryPresetId: 'custom',
    countryName: 'Norvegia',
    emoji: '🇳🇴',
    currency: 'NOK',
    rateFromEur: 11.7,
    lat: 60.3913,
    lng: 5.3221
  },
  norvegia: {
    canonical: 'Norvegia',
    countryPresetId: 'custom',
    countryName: 'Norvegia',
    emoji: '🇳🇴',
    currency: 'NOK',
    rateFromEur: 11.7,
    lat: 60.472,
    lng: 8.4689
  },

  // =========================================================================
  // PAESI BASSI
  // =========================================================================
  amsterdam: {
    canonical: 'Amsterdam',
    countryPresetId: 'europe',
    countryName: 'Paesi Bassi',
    emoji: '🇳🇱',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 52.3676,
    lng: 4.9041
  },
  olanda: {
    canonical: 'Paesi Bassi',
    countryPresetId: 'europe',
    countryName: 'Paesi Bassi',
    emoji: '🇳🇱',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 52.1326,
    lng: 5.2913
  },
  'paesi bassi': {
    canonical: 'Paesi Bassi',
    countryPresetId: 'europe',
    countryName: 'Paesi Bassi',
    emoji: '🇳🇱',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 52.1326,
    lng: 5.2913
  },

  // =========================================================================
  // GERMANIA
  // =========================================================================
  berlino: {
    canonical: 'Berlino',
    countryPresetId: 'europe',
    countryName: 'Germania',
    emoji: '🇩🇪',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 52.52,
    lng: 13.405
  },
  germania: {
    canonical: 'Germania',
    countryPresetId: 'europe',
    countryName: 'Germania',
    emoji: '🇩🇪',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 51.1657,
    lng: 10.4515
  },

  // =========================================================================
  // MITTELEUROPA (AUSTRIA, REPUBBLICA CECA, UNGHERIA)
  // =========================================================================
  vienna: {
    canonical: 'Vienna',
    countryPresetId: 'europe',
    countryName: 'Austria',
    emoji: '🇦🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 48.2082,
    lng: 16.3738,
    stationOrAirportLat: 48.1853,
    stationOrAirportLng: 16.3764
  },
  austria: {
    canonical: 'Austria',
    countryPresetId: 'europe',
    countryName: 'Austria',
    emoji: '🇦🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 47.5162,
    lng: 14.5501
  },
  praga: {
    canonical: 'Praga',
    countryPresetId: 'europe',
    countryName: 'Repubblica Ceca',
    emoji: '🇨🇿',
    currency: 'CZK',
    rateFromEur: 25.2,
    lat: 50.0755,
    lng: 14.4378,
    stationOrAirportLat: 50.0831,
    stationOrAirportLng: 14.4353
  },
  'repubblica ceca': {
    canonical: 'Repubblica Ceca',
    countryPresetId: 'europe',
    countryName: 'Repubblica Ceca',
    emoji: '🇨🇿',
    currency: 'CZK',
    rateFromEur: 25.2,
    lat: 49.8175,
    lng: 15.473
  },
  budapest: {
    canonical: 'Budapest',
    countryPresetId: 'europe',
    countryName: 'Ungheria',
    emoji: '🇭🇺',
    currency: 'HUF',
    rateFromEur: 400.0,
    lat: 47.4979,
    lng: 19.0402,
    stationOrAirportLat: 47.5108,
    stationOrAirportLng: 19.0573
  },
  ungheria: {
    canonical: 'Ungheria',
    countryPresetId: 'europe',
    countryName: 'Ungheria',
    emoji: '🇭🇺',
    currency: 'HUF',
    rateFromEur: 400.0,
    lat: 47.1625,
    lng: 19.5033
  },

  // =========================================================================
  // SCANDINAVIA (SVEZIA, DANIMARCA)
  // =========================================================================
  stoccolma: {
    canonical: 'Stoccolma',
    countryPresetId: 'europe',
    countryName: 'Svezia',
    emoji: '🇸🇪',
    currency: 'SEK',
    rateFromEur: 11.4,
    lat: 59.3293,
    lng: 18.0686,
    stationOrAirportLat: 59.3308,
    stationOrAirportLng: 18.0583
  },
  svezia: {
    canonical: 'Svezia',
    countryPresetId: 'europe',
    countryName: 'Svezia',
    emoji: '🇸🇪',
    currency: 'SEK',
    rateFromEur: 11.4,
    lat: 60.1282,
    lng: 18.6435
  },
  copenaghen: {
    canonical: 'Copenaghen',
    countryPresetId: 'europe',
    countryName: 'Danimarca',
    emoji: '🇩🇰',
    currency: 'DKK',
    rateFromEur: 7.46,
    lat: 55.6761,
    lng: 12.5683,
    stationOrAirportLat: 55.6728,
    stationOrAirportLng: 12.5647
  },
  copenhagen: {
    canonical: 'Copenaghen',
    countryPresetId: 'europe',
    countryName: 'Danimarca',
    emoji: '🇩🇰',
    currency: 'DKK',
    rateFromEur: 7.46,
    lat: 55.6761,
    lng: 12.5683,
    stationOrAirportLat: 55.6728,
    stationOrAirportLng: 12.5647
  },
  danimarca: {
    canonical: 'Danimarca',
    countryPresetId: 'europe',
    countryName: 'Danimarca',
    emoji: '🇩🇰',
    currency: 'DKK',
    rateFromEur: 7.46,
    lat: 56.2639,
    lng: 9.5018
  },

  // =========================================================================
  // INDONESIA & BALI
  // =========================================================================
  bali: {
    canonical: 'Bali',
    countryPresetId: 'custom',
    countryName: 'Indonesia',
    emoji: '🇮🇩',
    currency: 'IDR',
    rateFromEur: 17200,
    lat: -8.4095,
    lng: 115.1889
  },
  indonesia: {
    canonical: 'Indonesia',
    countryPresetId: 'custom',
    countryName: 'Indonesia',
    emoji: '🇮🇩',
    currency: 'IDR',
    rateFromEur: 17200,
    lat: -0.7893,
    lng: 113.9213
  },
  ubud: {
    canonical: 'Ubud',
    countryPresetId: 'custom',
    countryName: 'Indonesia',
    emoji: '🇮🇩',
    currency: 'IDR',
    rateFromEur: 17200,
    lat: -8.5069,
    lng: 115.2625
  },
  denpasar: {
    canonical: 'Denpasar',
    countryPresetId: 'custom',
    countryName: 'Indonesia',
    emoji: '🇮🇩',
    currency: 'IDR',
    rateFromEur: 17200,
    lat: -8.6705,
    lng: 115.2126,
    stationOrAirportLat: -8.7482,
    stationOrAirportLng: 115.1672
  },
  seminyak: {
    canonical: 'Seminyak',
    countryPresetId: 'custom',
    countryName: 'Indonesia',
    emoji: '🇮🇩',
    currency: 'IDR',
    rateFromEur: 17200,
    lat: -8.6913,
    lng: 115.1682
  },
  sanur: {
    canonical: 'Sanur',
    countryPresetId: 'custom',
    countryName: 'Indonesia',
    emoji: '🇮🇩',
    currency: 'IDR',
    rateFromEur: 17200,
    lat: -8.6738,
    lng: 115.2627
  },

  // =========================================================================
  // PERÙ
  // =========================================================================
  cusco: {
    canonical: 'Cusco',
    countryPresetId: 'custom',
    countryName: 'Perù',
    emoji: '🇵🇪',
    currency: 'USD',
    rateFromEur: 1.08,
    lat: -13.5319,
    lng: -71.9675
  },
  lima: {
    canonical: 'Lima',
    countryPresetId: 'custom',
    countryName: 'Perù',
    emoji: '🇵🇪',
    currency: 'USD',
    rateFromEur: 1.08,
    lat: -12.0464,
    lng: -77.0428
  },
  'machu picchu': {
    canonical: 'Machu Picchu',
    countryPresetId: 'custom',
    countryName: 'Perù',
    emoji: '🇵🇪',
    currency: 'USD',
    rateFromEur: 1.08,
    lat: -13.1631,
    lng: -72.545
  },
  peru: {
    canonical: 'Perù',
    countryPresetId: 'custom',
    countryName: 'Perù',
    emoji: '🇵🇪',
    currency: 'USD',
    rateFromEur: 1.08,
    lat: -9.19,
    lng: -75.0152
  },
  'perù': {
    canonical: 'Perù',
    countryPresetId: 'custom',
    countryName: 'Perù',
    emoji: '🇵🇪',
    currency: 'USD',
    rateFromEur: 1.08,
    lat: -9.19,
    lng: -75.0152
  },

  // =========================================================================
  // MAROCCO
  // =========================================================================
  marrakech: {
    canonical: 'Marrakech',
    countryPresetId: 'custom',
    countryName: 'Marocco',
    emoji: '🇲🇦',
    currency: 'MAD',
    rateFromEur: 10.7,
    lat: 31.6295,
    lng: -7.9811
  },
  marocco: {
    canonical: 'Marocco',
    countryPresetId: 'custom',
    countryName: 'Marocco',
    emoji: '🇲🇦',
    currency: 'MAD',
    rateFromEur: 10.7,
    lat: 31.7917,
    lng: -7.0926
  },

  // =========================================================================
  // AUSTRALIA
  // =========================================================================
  sydney: {
    canonical: 'Sydney',
    countryPresetId: 'custom',
    countryName: 'Australia',
    emoji: '🇦🇺',
    currency: 'AUD',
    rateFromEur: 1.65,
    lat: -33.8688,
    lng: 151.2093
  },
  cairns: {
    canonical: 'Cairns',
    countryPresetId: 'custom',
    countryName: 'Australia',
    emoji: '🇦🇺',
    currency: 'AUD',
    rateFromEur: 1.65,
    lat: -16.9186,
    lng: 145.7781
  },
  melbourne: {
    canonical: 'Melbourne',
    countryPresetId: 'custom',
    countryName: 'Australia',
    emoji: '🇦🇺',
    currency: 'AUD',
    rateFromEur: 1.65,
    lat: -37.8136,
    lng: 144.9631,
    stationOrAirportLat: -37.669,
    stationOrAirportLng: 144.841
  },
  sintra: {
    canonical: 'Sintra',
    countryPresetId: 'europe',
    countryName: 'Portogallo',
    emoji: '🇵🇹',
    currency: 'EUR',
    rateFromEur: 1.0,
    lat: 38.7987,
    lng: -9.3881
  },
  merzouga: {
    canonical: 'Merzouga',
    countryPresetId: 'custom',
    countryName: 'Marocco',
    emoji: '🇲🇦',
    currency: 'MAD',
    rateFromEur: 11.0,
    lat: 31.0993,
    lng: -4.0119
  },
  australia: {
    canonical: 'Australia',
    countryPresetId: 'custom',
    countryName: 'Australia',
    emoji: '🇦🇺',
    currency: 'AUD',
    rateFromEur: 1.65,
    lat: -25.2744,
    lng: 133.7751
  },

  // =========================================================================
  // PORTOGALLO
  // =========================================================================
  lisbona: {
    canonical: 'Lisbona',
    countryPresetId: 'europe',
    countryName: 'Portogallo',
    emoji: '🇵🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 38.7223,
    lng: -9.1393
  },
  porto: {
    canonical: 'Porto',
    countryPresetId: 'europe',
    countryName: 'Portogallo',
    emoji: '🇵🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 41.1579,
    lng: -8.6291
  },
  portogallo: {
    canonical: 'Portogallo',
    countryPresetId: 'europe',
    countryName: 'Portogallo',
    emoji: '🇵🇹',
    currency: 'EUR',
    rateFromEur: 1,
    lat: 39.3999,
    lng: -8.2245
  },

  // =========================================================================
  // COREA DEL SUD
  // =========================================================================
  seoul: {
    canonical: 'Seoul',
    countryPresetId: 'custom',
    countryName: 'Corea del Sud',
    emoji: '🇰🇷',
    currency: 'KRW',
    rateFromEur: 1480,
    lat: 37.5665,
    lng: 126.978
  }
};
