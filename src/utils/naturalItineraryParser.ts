import type { Activity, ActivityCategory, ItineraryDay } from '../types/trip';

export const EXAMPLE_HUMAN_ITINERARY_TEXT = `- 22/11: arrivo a tokyo ore 12.50
- 22-27/11: TOKYO (24/11 Kamakura, 25/11 ore 08:30  teamlab planets)
- 27-28/11 Fujikawaguchiko
- 28/11 trasferimento a Kyoto
- 28/11-02/12: Kyoto (vedere presto la mattina Santuario di Fushimi Inari-taisha, Arashiyama Bamboo Forest,Kiyomizu-dera; inserire gita a Uji e Nara, cerimonia del tè MAIKOYA)
- 02/12 pomeriggio/sera trasferimento a Hiroshima
- 03/12 Hiroshima + Miyajima fino al tramonto e poi rientro a Hiroshima
- 04/12 partenza da Hiroshima per castello di Himeji e poi trasferimento a Osaka
- 04/12-07/12: Osaka (Universal studio 05/12)
- 07/12 volo di rientro da Osaka ore 16`;

export interface ParsedItineraryPlan {
  isValid: boolean;
  startDate: string;
  endDate: string;
  detectedPresetId: string;
  detectedDestination: string;
  detectedEmoji: string;
  detectedCurrency: string;
  detectedExchangeRate: number;
  defaultCenter: [number, number];
  suggestedTitle: string;
  days: ItineraryDay[];
  totalActivities: number;
  geocodedCount: number;
}

interface KnownPlaceEntry {
  keywords: string[];
  canonicalName: string;
  locationName: string;
  lat: number;
  lng: number;
  defaultCategory?: ActivityCategory;
  defaultTime?: string;
  notes?: string;
}

/**
 * Instant offline-ready coordinate & metadata dictionary for popular world & Japan stops,
 * ensuring 0ms pinpoint accuracy even for colloquial queries (e.g. "Universal studio", "MAIKOYA").
 * Any place outside this dictionary is resolved dynamically via OpenStreetMap Photon/Nominatim.
 */
const KNOWN_PLACES_DB: KnownPlaceEntry[] = [
  // Tokyo & Kanto
  {
    keywords: ['teamlab planets', 'teamlab'],
    canonicalName: 'teamLab Planets TOKYO',
    locationName: 'teamLab Planets, Toyosu, Tokyo',
    lat: 35.6491,
    lng: 139.7898,
    defaultCategory: 'sightseeing',
    notes: 'Museo immersivo digitale a piedi nudi (presentarsi 15 min prima dell’orario prenotato).'
  },
  {
    keywords: ['kamakura'],
    canonicalName: 'Escursione a Kamakura (Grande Buddha & Templi)',
    locationName: 'Kotoku-in (Grande Buddha), Kamakura',
    lat: 35.3167,
    lng: 139.5357,
    defaultCategory: 'sightseeing',
    defaultTime: '09:00',
    notes: 'Visitare il Grande Buddha (Kotoku-in), Hasedera e il santuario Tsurugaoka Hachimangu.'
  },
  {
    keywords: ['senso-ji', 'sensoji', 'asakusa'],
    canonicalName: 'Tempio Senso-ji e Nakamise-dori',
    locationName: 'Asakusa, Tokyo',
    lat: 35.7148,
    lng: 139.7967,
    defaultCategory: 'sightseeing',
    notes: 'Porta Kaminarimon e shopping tradizionale lungo Nakamise-dori.'
  },
  {
    keywords: ['shibuya'],
    canonicalName: 'Shibuya Crossing & Hachiko',
    locationName: 'Shibuya Scramble Crossing, Tokyo',
    lat: 35.6595,
    lng: 139.7004,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['meiji', 'harajuku'],
    canonicalName: 'Santuario Meiji Jingu & Harajuku',
    locationName: 'Meiji Jingu, Shibuya, Tokyo',
    lat: 35.6764,
    lng: 139.6993,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['shinjuku'],
    canonicalName: 'Shinjuku & Omoide Yokocho',
    locationName: 'Shinjuku, Tokyo',
    lat: 35.6938,
    lng: 139.7034,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['akihabara'],
    canonicalName: 'Akihabara Electric Town',
    locationName: 'Akihabara, Tokyo',
    lat: 35.6984,
    lng: 139.7731,
    defaultCategory: 'shopping'
  },
  {
    keywords: ['tsukiji', 'mercato del pesce'],
    canonicalName: 'Mercato Esterno di Tsukiji (Mercato del Pesce)',
    locationName: 'Tsukiji Outer Market, Tokyo',
    lat: 35.6655,
    lng: 139.7707,
    defaultCategory: 'food'
  },
  {
    keywords: ['ueno'],
    canonicalName: 'Parco di Ueno & Ameyoko',
    locationName: 'Ueno Park, Tokyo',
    lat: 35.7146,
    lng: 139.7732,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['ginza'],
    canonicalName: 'Passeggiata a Ginza',
    locationName: 'Ginza, Tokyo',
    lat: 35.6717,
    lng: 139.7649,
    defaultCategory: 'shopping'
  },
  {
    keywords: ['odaiba'],
    canonicalName: 'Baia di Odaiba & Vista Rainbow Bridge',
    locationName: 'Odaiba Marine Park, Tokyo',
    lat: 35.6297,
    lng: 139.7753,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['nikko'],
    canonicalName: 'Santuario Toshogu a Nikko',
    locationName: 'Nikko Toshogu, Nikko',
    lat: 36.7581,
    lng: 139.5989,
    defaultCategory: 'sightseeing'
  },
  // Fuji / Kawaguchiko
  {
    keywords: ['fujikawaguchiko', 'kawaguchiko', 'kawaguchi', 'lago kawaguchi', 'monte fuji', 'mt fuji'],
    canonicalName: 'Lago Kawaguchiko & Vista Monte Fuji',
    locationName: 'Fujikawaguchiko, Yamanashi',
    lat: 35.4982,
    lng: 138.7686,
    defaultCategory: 'sightseeing',
    notes: 'Vista panoramica sul Monte Fuji dal Lago Kawaguchiko / Oishi Park.'
  },
  {
    keywords: ['chureito'],
    canonicalName: 'Pagoda Chureito (Arakurayama Sengen Park)',
    locationName: 'Chureito Pagoda, Fujiyoshida',
    lat: 35.5013,
    lng: 138.8014,
    defaultCategory: 'sightseeing',
    notes: 'Celebre punto panoramico con pagoda a 5 piani e Monte Fuji sullo sfondo.'
  },
  // Kyoto, Uji, Nara
  {
    keywords: ['fushimi inari'],
    canonicalName: 'Santuario di Fushimi Inari-taisha',
    locationName: 'Fushimi Inari-taisha, Kyoto',
    lat: 34.9671,
    lng: 135.7727,
    defaultCategory: 'sightseeing',
    notes: 'Ideale presto la mattina per percorrere i tunnel di torii rossi senza folla.'
  },
  {
    keywords: ['arashiyama', 'bamboo forest', 'foresta di bambu', 'foresta di bambù'],
    canonicalName: 'Arashiyama Bamboo Forest',
    locationName: 'Arashiyama Bamboo Grove, Kyoto',
    lat: 35.0168,
    lng: 135.6713,
    defaultCategory: 'sightseeing',
    notes: 'Arrivare presto la mattina per la luce migliore tra i bambù e proseguire al tempio Tenryu-ji.'
  },
  {
    keywords: ['kiyomizu-dera', 'kiyomizudera', 'kiyomizu'],
    canonicalName: 'Tempio Kiyomizu-dera & Sannenzaka',
    locationName: 'Kiyomizu-dera, Higashiyama, Kyoto',
    lat: 34.9949,
    lng: 135.785,
    defaultCategory: 'sightseeing',
    notes: 'Terrazza panoramica in legno e discesa tra le vie storiche Sannenzaka e Ninenzaka.'
  },
  {
    keywords: ['maikoya', 'cerimonia del tè', 'cerimonia del te'],
    canonicalName: 'Cerimonia del tè tradizionale MAIKOYA',
    locationName: 'MAIKOYA Tea Ceremony, Kyoto',
    lat: 35.0061,
    lng: 135.7647,
    defaultCategory: 'relax',
    notes: 'Esperienza autentica della cerimonia del tè giapponese con preparazione matcha.'
  },
  {
    keywords: ['kinkaku-ji', 'kinkakuji', 'padiglione d’oro', "padiglione d'oro"],
    canonicalName: 'Kinkaku-ji (Padiglione d’Oro)',
    locationName: 'Kinkaku-ji, Kyoto',
    lat: 35.0394,
    lng: 135.7292,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['gion'],
    canonicalName: 'Quartiere storico di Gion & Hanamikoji',
    locationName: 'Gion, Kyoto',
    lat: 35.0037,
    lng: 135.7785,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['nishiki'],
    canonicalName: 'Mercato di Nishiki ("La cucina di Kyoto")',
    locationName: 'Nishiki Market, Kyoto',
    lat: 35.005,
    lng: 135.7649,
    defaultCategory: 'food'
  },
  {
    keywords: ['uji'],
    canonicalName: 'Uji: Tempio Byodo-in & Degustazione Matcha',
    locationName: 'Byodo-in, Uji, Kyoto',
    lat: 34.8893,
    lng: 135.8077,
    defaultCategory: 'sightseeing',
    notes: 'Lungo la linea JR Nara tra Kyoto e Nara; patria del tè verde Matcha pregiato.'
  },
  {
    keywords: ['nara'],
    canonicalName: 'Parco di Nara & Grande Buddha del Todai-ji',
    locationName: 'Nara Park & Todai-ji, Nara',
    lat: 34.6851,
    lng: 135.843,
    defaultCategory: 'sightseeing',
    notes: 'Cervi sacri in libertà, tempio Todai-ji e lanterne di Kasuga Taisha.'
  },
  // Hiroshima, Miyajima, Himeji
  {
    keywords: ['miyajima', 'itsukushima'],
    canonicalName: 'Isola di Miyajima & Santuario di Itsukushima',
    locationName: 'Itsukushima Shrine, Miyajima',
    lat: 34.296,
    lng: 132.3198,
    defaultCategory: 'sightseeing',
    notes: 'Grande Torii galleggiante, Monte Misen e vista magica al tramonto.'
  },
  {
    keywords: ['castello di himeji', 'himeji castle', 'himeji'],
    canonicalName: 'Castello di Himeji (Airone Bianco)',
    locationName: 'Himeji Castle, Himeji',
    lat: 34.8394,
    lng: 134.6939,
    defaultCategory: 'sightseeing',
    notes: 'Capolavoro originale UNESCO lungo la tratta Shinkansen tra Hiroshima e Osaka (deposito bagagli in stazione).'
  },
  // Osaka
  {
    keywords: ['universal studio', 'universal studios', 'usj'],
    canonicalName: 'Universal Studios Japan (USJ)',
    locationName: 'Universal Studios Japan, Osaka',
    lat: 34.6654,
    lng: 135.4323,
    defaultCategory: 'sightseeing',
    defaultTime: '08:30',
    notes: 'Super Nintendo World e Wizarding World of Harry Potter (arrivare prima dell’apertura).'
  },
  {
    keywords: ['dotonbori'],
    canonicalName: 'Dotonbori & Insegna Glico',
    locationName: 'Dotonbori, Namba, Osaka',
    lat: 34.6687,
    lng: 135.5013,
    defaultCategory: 'food',
    notes: 'Takoyaki, okonomiyaki e luci al neon lungo il canale.'
  },
  {
    keywords: ['castello di osaka', 'osaka castle'],
    canonicalName: 'Castello di Osaka & Parco',
    locationName: 'Osaka Castle, Osaka',
    lat: 34.6873,
    lng: 135.5262,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['kuromon'],
    canonicalName: 'Mercato di Kuromon Ichiba',
    locationName: 'Kuromon Market, Osaka',
    lat: 34.6654,
    lng: 135.5065,
    defaultCategory: 'food'
  },
  // Additional Tokyo landmarks
  {
    keywords: ['shinjuku gyoen', 'shinjuku goyen', 'parco foliage'],
    canonicalName: 'Parco Shinjuku Gyoen (Foliage & Giardini)',
    locationName: 'Shinjuku Gyoen National Garden, Tokyo',
    lat: 35.6852,
    lng: 139.7101,
    defaultCategory: 'sightseeing',
    notes: 'Meravigliosi giardini tradizionali, serre botaniche e foliage d’autunno.'
  },
  {
    keywords: ['gatto 3d', 'shinjuku gatto', 'cross shinjuku'],
    canonicalName: 'Cross Shinjuku Vision (Gatto 3D)',
    locationName: 'Cross Shinjuku Vision, Shinjuku East Exit, Tokyo',
    lat: 35.6923,
    lng: 139.7011,
    defaultCategory: 'sightseeing',
    notes: 'Celebre maxischermo 3D con il gatto calico gigante.'
  },
  {
    keywords: ['meigetsu-in', 'meigetsuin'],
    canonicalName: 'Tempio Meigetsu-in (Foliage & Finestra Circolare)',
    locationName: 'Meigetsu-in, Kamakura',
    lat: 35.3347,
    lng: 139.5539,
    defaultCategory: 'sightseeing',
    notes: 'Famosa finestra circolare aperta sul giardino posteriore e foliage tardivo.'
  },
  {
    keywords: ['statua della libert', 'lungomare odaiba'],
    canonicalName: 'Statua della Libertà & Lungomare di Odaiba',
    locationName: 'Odaiba Seaside Park, Minato, Tokyo',
    lat: 35.6288,
    lng: 139.7717,
    defaultCategory: 'sightseeing',
    notes: 'Replica della Statua della Libertà con sfondo sul Rainbow Bridge e skyline.'
  },
  {
    keywords: ['rapponigi', 'roppongi', 'viale luci natale', 'keyakizaka'],
    canonicalName: 'Roppongi Hills & Luminarie Natalizie di Keyakizaka',
    locationName: 'Roppongi Hills, Minato, Tokyo',
    lat: 35.6596,
    lng: 139.7295,
    defaultCategory: 'sightseeing',
    notes: 'Viale illuminato a festa con vista suggestiva sulla Tokyo Tower illuminata.'
  },
  {
    keywords: ['palazzo imperiale', 'kokyo', 'imperial palace'],
    canonicalName: 'Palazzo Imperiale di Tokyo & Giardini Est',
    locationName: 'Tokyo Imperial Palace, Chiyoda, Tokyo',
    lat: 35.6852,
    lng: 139.7528,
    defaultCategory: 'sightseeing',
    notes: 'Residenza ufficiale dell’Imperatore con ponti Nijubashi e ampi giardini storici.'
  },
  {
    keywords: ['sky-tree', 'skytree', 'tokyo sky tree'],
    canonicalName: 'Tokyo Skytree (Torre Panoramica)',
    locationName: 'Tokyo Skytree, Oshiage, Sumida, Tokyo',
    lat: 35.71,
    lng: 139.8107,
    defaultCategory: 'sightseeing',
    notes: 'La torre per telecomunicazioni più alta al mondo (634 m) con vista al tramonto.'
  },
  // Additional Monte Fuji / 5 Laghi landmarks
  {
    keywords: ['momiji corridor', 'tunnel di aceri', 'momiji kairo'],
    canonicalName: 'Momiji Corridor (Tunnel di Aceri sul Lago Kawaguchiko)',
    locationName: 'Momiji Kairo, Fujikawaguchiko, Yamanashi',
    lat: 35.5268,
    lng: 138.7615,
    defaultCategory: 'sightseeing',
    notes: 'Canale fiancheggiato da aceri centenari che in autunno formano un tunnel rosso fuoco.'
  },
  // Additional Kyoto landmarks
  {
    keywords: ['kodai-ji', 'kodaiji'],
    canonicalName: 'Tempio Kodai-ji & Boschetto di Bambù',
    locationName: 'Kodai-ji, Higashiyama, Kyoto',
    lat: 35.0003,
    lng: 135.7818,
    defaultCategory: 'sightseeing',
    notes: 'Fondato nel 1606 con giardini zen e padiglioni del tè.'
  },
  {
    keywords: ['yasaka', 'santuario yasaka'],
    canonicalName: 'Santuario Yasaka Jingu',
    locationName: 'Yasaka Shrine, Gion, Kyoto',
    lat: 35.0037,
    lng: 135.7785,
    defaultCategory: 'sightseeing',
    notes: 'Cuore spirituale di Gion con centinaia di lanterne votive accese alla sera.'
  },
  {
    keywords: ['ryoan-ji', 'ryoanji', 'giardino zen'],
    canonicalName: 'Tempio Ryoan-ji (Giardino Zen di Rocce)',
    locationName: 'Ryoan-ji, Ukyo, Kyoto',
    lat: 35.0345,
    lng: 135.7182,
    defaultCategory: 'sightseeing',
    notes: 'Il più celebre kare-sansui del mondo con 15 pietre disposte su ghiaia rastrellata.'
  },
  {
    keywords: ['eikan-do', 'eikando'],
    canonicalName: 'Tempio Eikan-do Zenrin-ji (Illuminazione Foliage Serale)',
    locationName: 'Eikan-do Zenrin-ji, Sakyo, Kyoto',
    lat: 35.0144,
    lng: 135.7954,
    defaultCategory: 'sightseeing',
    notes: 'Capitale del foliage autunnale a Kyoto con suggestiva illuminazione serale dei ponti e dello stagno.'
  },
  {
    keywords: ['sagano romantic train', 'treno panoramico sagano', 'sagano scenic railway'],
    canonicalName: 'Treno Panoramico Sagano (Sagano Romantic Train)',
    locationName: 'Torokko Saga Station, Arashiyama, Kyoto',
    lat: 35.0182,
    lng: 135.6811,
    defaultCategory: 'transport',
    notes: 'Corsa panoramica sul treno d’epoca lungo la gola del fiume Hozu.'
  },
  {
    keywords: ['tenryu-ji', 'tenryuji'],
    canonicalName: 'Tempio Tenryu-ji & Giardino Sogenchi',
    locationName: 'Tenryu-ji, Arashiyama, Kyoto',
    lat: 35.0158,
    lng: 135.6776,
    defaultCategory: 'sightseeing',
    notes: 'Patrimonio UNESCO con vista incorniciata sulle montagne di Arashiyama.'
  },
  {
    keywords: ['ruriko-in', 'rurikoin'],
    canonicalName: 'Tempio Ruriko-in (Foliage sul Tavolo Laccato)',
    locationName: 'Ruriko-in, Kamitakano, Sakyo, Kyoto',
    lat: 35.0641,
    lng: 135.8197,
    defaultCategory: 'sightseeing',
    notes: 'Famoso per i riflessi spettacolari delle foglie d’acero sul pavimento e tavolo laccato nero.'
  },
  {
    keywords: ['sentiero della filosofia', 'tetsugaku no michi', 'filosofia'],
    canonicalName: 'Sentiero della Filosofia (Tetsugaku-no-Michi)',
    locationName: 'Philosopher’s Path, Sakyo, Kyoto',
    lat: 35.0232,
    lng: 135.7958,
    defaultCategory: 'sightseeing',
    notes: 'Passeggiata lastricata lungo il canale alberato tra alberi di ciliegio e aceri.'
  },
  {
    keywords: ['ginkaku-ji', 'ginkakuji', 'padiglione d’argento', "padiglione d'argento"],
    canonicalName: 'Ginkaku-ji (Padiglione d’Argento)',
    locationName: 'Ginkaku-ji, Sakyo, Kyoto',
    lat: 35.0272,
    lng: 135.7982,
    defaultCategory: 'sightseeing',
    notes: 'Elegante tempio zen con giardino di sabbia a cono lunare e laghetto muschioso.'
  },
  // Additional Hiroshima landmarks
  {
    keywords: ['parco della pace', 'peace memorial', 'cupola della bomba', 'genbaku'],
    canonicalName: 'Parco Memoriale della Pace di Hiroshima & Cupola di Genbaku',
    locationName: 'Peace Memorial Park, Hiroshima',
    lat: 34.3928,
    lng: 132.4526,
    defaultCategory: 'sightseeing',
    notes: 'Monumento commemorativo e Museo della Pace dedicato alla memoria storica.'
  },
  // Additional Osaka landmarks
  {
    keywords: ['minoh park', 'minoh', 'minoo', 'cascata di minoo'],
    canonicalName: 'Parco Naturale di Minoh & Cascata (Foliage & Momiji Tempura)',
    locationName: 'Minoh Park, Minoh, Osaka',
    lat: 34.8496,
    lng: 135.4727,
    defaultCategory: 'sightseeing',
    notes: 'Valle boscosa rinomata per il foliage autunnale, la cascata alta 33m e le foglie d’acero fritte.'
  },
  {
    keywords: ['kaiyukan', 'acquario di osaka', 'osaka aquarium'],
    canonicalName: 'Acquario Kaiyukan di Osaka (Vasca Squali Balena)',
    locationName: 'Osaka Aquarium Kaiyukan, Tempozan, Osaka',
    lat: 34.6545,
    lng: 135.429,
    defaultCategory: 'sightseeing',
    notes: 'Uno dei più grandi acquari al mondo con gigantesca vasca centrale dedicata all’Oceano Pacifico.'
  }
];

interface CityInfo {
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

const CITY_CATALOG: Record<string, CityInfo> = {
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
        category: 'sightseeing',
        notes: 'Passeggiata nel bosco sacro e Takeshita Street.'
      },
      {
        time: '18:00',
        title: 'Shibuya Crossing & Vista serale',
        locationName: 'Shibuya Scramble Crossing, Tokyo',
        lat: 35.6595,
        lng: 139.7004,
        category: 'sightseeing'
      },
      {
        time: '09:30',
        title: 'Mercato Esterno di Tsukiji',
        locationName: 'Tsukiji Outer Market, Tokyo',
        lat: 35.6655,
        lng: 139.7707,
        category: 'food',
        notes: 'Colazione/brunch tra sushi fresco, tamagoyaki e matcha.'
      },
      {
        time: '14:00',
        title: 'Parco di Ueno & Akihabara Electric Town',
        locationName: 'Akihabara, Tokyo',
        lat: 35.6984,
        lng: 139.7731,
        category: 'shopping'
      },
      {
        time: '19:30',
        title: 'Serata tra i vicoli di Shinjuku (Omoide Yokocho)',
        locationName: 'Shinjuku, Tokyo',
        lat: 35.6938,
        lng: 139.7034,
        category: 'hidden_gem'
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
    lng: 138.7686,
    freeDaySuggestions: [
      {
        time: '11:30',
        title: 'Pagoda Chureito (Vista iconica Monte Fuji)',
        locationName: 'Arakurayama Sengen Park, Fujiyoshida',
        lat: 35.5013,
        lng: 138.8014,
        category: 'sightseeing',
        notes: 'Salita panoramica con vista sul Monte Fuji.'
      },
      {
        time: '15:00',
        title: 'Passeggiata lungo il Lago Kawaguchiko & Oishi Park',
        locationName: 'Oishi Park, Fujikawaguchiko',
        lat: 35.523,
        lng: 138.7458,
        category: 'relax'
      }
    ]
  },
  kyoto: {
    canonical: 'Kyoto',
    countryPresetId: 'japan',
    countryName: 'Giappone',
    emoji: '🇯🇵',
    currency: 'JPY',
    rateFromEur: 162.5,
    lat: 34.9858,
    lng: 135.7588,
    freeDaySuggestions: [
      {
        time: '10:00',
        title: 'Mercato di Nishiki & Centro storico',
        locationName: 'Nishiki Market, Kyoto',
        lat: 35.005,
        lng: 135.7649,
        category: 'food'
      },
      {
        time: '17:30',
        title: 'Passeggiata serale a Gion & Pontocho',
        locationName: 'Gion, Kyoto',
        lat: 35.0037,
        lng: 135.7785,
        category: 'hidden_gem'
      }
    ]
  },
  hiroshima: {
    canonical: 'Hiroshima',
    countryPresetId: 'japan',
    countryName: 'Giappone',
    emoji: '🇯🇵',
    currency: 'JPY',
    rateFromEur: 162.5,
    lat: 34.3955,
    lng: 132.4536,
    freeDaySuggestions: [
      {
        time: '09:00',
        title: 'Parco Commemorativo della Pace & Atomic Bomb Dome',
        locationName: 'Hiroshima Peace Memorial Park, Hiroshima',
        lat: 34.3955,
        lng: 132.4536,
        category: 'sightseeing'
      }
    ]
  },
  osaka: {
    canonical: 'Osaka',
    countryPresetId: 'japan',
    countryName: 'Giappone',
    emoji: '🇯🇵',
    currency: 'JPY',
    rateFromEur: 162.5,
    lat: 34.6937,
    lng: 135.5023,
    freeDaySuggestions: [
      {
        time: '09:30',
        title: 'Castello di Osaka & Giardini',
        locationName: 'Osaka Castle, Osaka',
        lat: 34.6873,
        lng: 135.5262,
        category: 'sightseeing'
      },
      {
        time: '13:00',
        title: 'Pranzo street food al Mercato di Kuromon',
        locationName: 'Kuromon Market, Osaka',
        lat: 34.6654,
        lng: 135.5065,
        category: 'food'
      },
      {
        time: '18:30',
        title: 'Serata a Dotonbori & Namba',
        locationName: 'Dotonbori, Osaka',
        lat: 34.6687,
        lng: 135.5013,
        category: 'sightseeing',
        notes: 'Luci sul canale, insegna Glico Man, takoyaki e okonomiyaki.'
      }
    ]
  },
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

const MONTH_NAMES: Record<string, number> = {
  gen: 1,
  gennaio: 1,
  jan: 1,
  feb: 2,
  febbraio: 2,
  mar: 3,
  marzo: 3,
  apr: 4,
  aprile: 4,
  mag: 5,
  maggio: 5,
  may: 5,
  giu: 6,
  giugno: 6,
  jun: 6,
  lug: 7,
  luglio: 7,
  jul: 7,
  ago: 8,
  agosto: 8,
  aug: 8,
  set: 9,
  settembre: 9,
  sep: 9,
  ott: 10,
  ottobre: 10,
  oct: 10,
  nov: 11,
  novembre: 11,
  dic: 12,
  dicembre: 12,
  dec: 12
};

let seqCounter = 0;
function makeId(prefix: string): string {
  seqCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${seqCounter.toString(36)}`;
}

function toIsoDate(year: number, month: number, day: number): string {
  const utc = new Date(Date.UTC(year, month - 1, day));
  return utc.toISOString().slice(0, 10);
}

function addDaysIso(isoDate: string, offsetDays: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + offsetDays));
  return utc.toISOString().slice(0, 10);
}

function enumerateIsoRange(startIso: string, endIso: string): string[] {
  const [sy, sm, sd] = startIso.split('-').map(Number);
  const [ey, em, ed] = endIso.split('-').map(Number);
  const startUtc = Date.UTC(sy, sm - 1, sd);
  const endUtc = Date.UTC(ey, em - 1, ed);
  const count = Math.min(Math.max(Math.floor((endUtc - startUtc) / 86400000) + 1, 1), 60);
  const list: string[] = [];
  for (let i = 0; i < count; i++) {
    list.push(addDaysIso(startIso, i));
  }
  return list;
}

function smartTitleCase(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  if (trimmed === trimmed.toUpperCase() && trimmed.length <= 18) {
    return trimmed
      .toLowerCase()
      .replace(/\b\p{L}/gu, (ch) => ch.toUpperCase());
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function lookupCityInfo(rawName: string): CityInfo | undefined {
  const key = rawName.trim().toLowerCase();
  if (CITY_CATALOG[key]) return CITY_CATALOG[key];
  for (const [k, info] of Object.entries(CITY_CATALOG)) {
    if (key.includes(k)) return info;
  }
  return undefined;
}

function lookupKnownPlace(rawText: string): KnownPlaceEntry | undefined {
  const lower = rawText.trim().toLowerCase();
  let bestMatch: KnownPlaceEntry | undefined;
  let bestLen = 0;

  for (const entry of KNOWN_PLACES_DB) {
    for (const kw of entry.keywords) {
      const isShort = kw.length <= 4;
      const re = isShort
        ? new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
        : new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      if (re.test(lower)) {
        if (kw.length > bestLen) {
          bestLen = kw.length;
          bestMatch = entry;
        }
      }
    }
  }
  return bestMatch;
}

/**
 * Extracts explicit HH:MM or semantic time hints ("ore 12.50", "ore 08:30", "ore 16", "presto la mattina", "pomeriggio/sera")
 * and returns both the normalized HH:MM and the cleaned remaining text.
 */
function extractTimeAndCleanText(raw: string): {
  explicitTime?: string;
  timeBucket?: 'early_morning' | 'morning' | 'late_morning' | 'afternoon' | 'late_afternoon' | 'sunset' | 'evening';
  cleanedText: string;
  extraNote?: string;
} {
  let working = raw.trim();
  let explicitTime: string | undefined;
  let timeBucket:
    | 'early_morning'
    | 'morning'
    | 'late_morning'
    | 'afternoon'
    | 'late_afternoon'
    | 'sunset'
    | 'evening'
    | undefined;
  let extraNote: string | undefined;

  // 1. Time range with prefix e.g. "ore 06:30 - 07:00" or "07:00 - 07:30"
  const rangeTimeRe = /\b(?:ore\s*)?(\d{1,2}[:.]\d{2})\s*(?:-|–|—)\s*(\d{1,2}[:.]\d{2})\b/i;
  const rm = working.match(rangeTimeRe);
  if (rm) {
    const rawStart = rm[1].replace('.', ':');
    const [hh, mm] = rawStart.split(':').map(Number);
    explicitTime = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    extraNote = `Fascia consigliata: ${rm[1]} - ${rm[2]}`;
    working = working.replace(rangeTimeRe, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  // 2. Explicit time with prefix: "ore 12.50", "ore 08:30", "ore 16", "alle 9:15", "h 14.00"
  if (!explicitTime) {
    const prefixedTimeRe = /\b(?:ore|alle|h)\s*(\d{1,2})(?:[:.](\d{2}))?\b/i;
    const pm = working.match(prefixedTimeRe);
    if (pm) {
      const hh = Math.min(Math.max(Number(pm[1]), 0), 23);
      const mm = pm[2] ? Math.min(Math.max(Number(pm[2]), 0), 59) : 0;
      explicitTime = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      working = working.replace(prefixedTimeRe, ' ').replace(/\s{2,}/g, ' ').trim();
    } else {
      // Standalone HH:MM with colon (avoiding DD/MM dates)
      const colonTimeRe = /\b([01]?\d|2[0-3]):([0-5]\d)\b/;
      const cm = working.match(colonTimeRe);
      if (cm) {
        explicitTime = `${String(Number(cm[1])).padStart(2, '0')}:${cm[2]}`;
        working = working.replace(colonTimeRe, ' ').replace(/\s{2,}/g, ' ').trim();
      }
    }
  }

  // 3. Semantic time-of-day hints
  if (/\b(?:presto\s+la\s+mattina|mattina\s+presto|all['’]alba)\b/i.test(working)) {
    timeBucket = 'early_morning';
    working = working
      .replace(/\b(?:vedere\s+)?(?:presto\s+la\s+mattina|mattina\s+presto|all['’]alba)\b/gi, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  } else if (/\btarda\s+mattina\b/i.test(working)) {
    timeBucket = 'late_morning';
    working = working.replace(/\btarda\s+mattina\b/gi, ' ').replace(/\s{2,}/g, ' ').trim();
  } else if (/\bin\s+giornata\b/i.test(working)) {
    timeBucket = 'morning';
    working = working.replace(/\bin\s+giornata\b/gi, ' ').replace(/\s{2,}/g, ' ').trim();
  } else if (/\bpomeriggio\s*\/\s*sera\b/i.test(working)) {
    timeBucket = 'late_afternoon';
    working = working.replace(/\bpomeriggio\s*\/\s*sera\b/gi, ' ').replace(/\s{2,}/g, ' ').trim();
  } else if (/\bfino\s+al\s+tramonto\b/i.test(working)) {
    timeBucket = 'sunset';
    extraNote = extraNote ? `${extraNote}; Fino al tramonto.` : 'Permanenza fino al tramonto.';
    working = working.replace(/\bfino\s+al\s+tramonto\b/gi, ' ').replace(/\s{2,}/g, ' ').trim();
  } else if (/\b(?:nel\s+)?pomeriggio\b/i.test(working)) {
    timeBucket = 'afternoon';
    working = working.replace(/\b(?:nel\s+)?pomeriggio\b/gi, ' ').replace(/\s{2,}/g, ' ').trim();
  } else if (/\b(?:in\s+|di\s+)?sera(?:ta)?(?:\s*\(light-up\))?|light-up\b/i.test(working)) {
    timeBucket = 'evening';
    working = working
      .replace(/\b(?:in\s+|di\s+)?sera(?:ta)?(?:\s*\(light-up\))?|light-up\b/gi, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  } else if (/\b(?:di\s+|la\s+)?mattina\b/i.test(working)) {
    timeBucket = 'morning';
    working = working.replace(/\b(?:di\s+|la\s+)?mattina\b/gi, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  working = working.replace(/^[,;:\-–—\s]+|[,;:\-–—\s]+$/g, '').trim();
  return { explicitTime, timeBucket, cleanedText: working, extraNote };
}

function inferCategory(text: string, fallback: ActivityCategory = 'sightseeing'): ActivityCategory {
  const lower = text.toLowerCase();
  if (
    /\b(arrivo|volo|aeroporto|rientro|trasferimento|partenza\s+da|spostamento|treno|shinkansen|traghetto|bus)\b/.test(
      lower
    )
  ) {
    return 'transport';
  }
  if (/\b(cerimonia\s+del\s+t[eè]|maikoya|onsen|terme|spa|relax|spiaggia)\b/.test(lower)) {
    return 'relax';
  }
  if (/\b(pranzo|cena|colazione|mercato|ramen|sushi|street\s*food|ristorante|degustazione)\b/.test(lower)) {
    return 'food';
  }
  if (/\b(hotel|check-in|check-out|ryokan|alloggio)\b/.test(lower)) {
    return 'lodging';
  }
  if (/\b(shopping|acquisto|pokemon|nintendo|souvenir)\b/.test(lower)) {
    return 'shopping';
  }
  return fallback;
}

interface RawLineRule {
  startDay: number;
  startMonth: number;
  startYear?: number;
  endDay: number;
  endMonth: number;
  endYear?: number;
  isRange: boolean;
  isRelativeDay?: boolean;
  mainBody: string;
  parenBody: string;
}

const BULLET_PREFIX_RE = /^[\s\t]*[●○■□◆◇▪▫▶➔•*\-–—]+[\s\t]*/u;

const DAY_OF_WEEK_PAT =
  '(?:\\(?(?:dom(?:enica)?|lun(?:ed[ìi])?|mar(?:ted[ìi])?|mer(?:coled[ìi])?|gio(?:ved[ìi])?|ven(?:erd[ìi])?|sab(?:ato)?|sun(?:day)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?)\\.?[)\\s]*)';

export function cleanBulletPrefix(line: string): string {
  return line
    .replace(BULLET_PREFIX_RE, '')
    .replace(/^[\s\t]*\d+[\.\)][\s\t]*/, '')
    .trim();
}

export type LeadingDateResult =
  | { kind: 'stage'; stageIndex?: number; stageName: string; stageCity?: string }
  | {
      kind: 'date';
      spec: Omit<RawLineRule, 'mainBody' | 'parenBody'>;
      dayNumber?: number;
      rest: string;
    };

function parseLeadingDateSpec(line: string): LeadingDateResult | null {
  const cleaned = cleanBulletPrefix(line);
  if (!cleaned) return null;

  // 0. Stage header e.g. "TAPPA 1: Tokyo & Kamakura (5 Notti)"
  const stageMatch = cleaned.match(/^(?:tappa|fase|stage|leg|parte)\s*(\d+)?\s*[:\-–—]\s*(.+)$/i);
  if (stageMatch) {
    const rawStageText = stageMatch[2].trim();
    // Inferred city from stage text
    const matchedCity = lookupCityInfo(rawStageText) ||
      Object.values(CITY_CATALOG).find((ci) =>
        rawStageText.toLowerCase().includes(ci.canonical.toLowerCase())
      );
    return {
      kind: 'stage',
      stageIndex: stageMatch[1] ? Number(stageMatch[1]) : undefined,
      stageName: rawStageText,
      stageCity: matchedCity?.canonical
    };
  }

  const monthNamesPattern = Object.keys(MONTH_NAMES).join('|');

  // 1. Cross-month words: "28 Nov - 02 Dic: Kyoto" or "28 nov – 2 dic"
  const crossMonthWordsRe = new RegExp(
    `^(?:dal\\s+)?(\\d{1,2})\\s+(${monthNamesPattern})\\s*(?:-|–|—|\\s+al?\\s+)\\s*(\\d{1,2})\\s+(${monthNamesPattern})(?:\\s+(\\d{4}))?` +
      `(?:\\s*${DAY_OF_WEEK_PAT})*` +
      `(?:\\s*(?:-|–|—|:)?\\s*(?:giorno|day|g)\\s*(\\d{1,2}))?` +
      `(?:\\s*[:\\-–—]?\\s*(.*)|$)`,
    'i'
  );
  const cmw = cleaned.match(crossMonthWordsRe);
  if (cmw) {
    const sd = Number(cmw[1]);
    const sm = MONTH_NAMES[cmw[2].toLowerCase()];
    const ed = Number(cmw[3]);
    const em = MONTH_NAMES[cmw[4].toLowerCase()];
    const y = cmw[5] ? Number(cmw[5]) : undefined;
    const dayNum = cmw[6] ? Number(cmw[6]) : undefined;
    if (sm && em && sd >= 1 && sd <= 31 && ed >= 1 && ed <= 31) {
      return {
        kind: 'date',
        spec: {
          startDay: sd,
          startMonth: sm,
          startYear: y,
          endDay: ed,
          endMonth: em,
          endYear: y,
          isRange: true
        },
        dayNumber: dayNum,
        rest: (cmw[7] || '').trim()
      };
    }
  }

  // 2. Month-word range or single date with optional day-of-week & optional day label
  // e.g. "22 Nov (Dom) – Giorno 1: Arrivo a Tokyo" or "3 Dic (Gio) - Giorno 12:" or "10-15 agosto: Mare"
  const wordDateWithDayLabelRe = new RegExp(
    `^(?:dal\\s+)?(\\d{1,2})(?:\\s*(?:-|–|—|\\s+al?\\s+)\\s*(\\d{1,2}))?\\s+(${monthNamesPattern})(?:\\s+(\\d{4}))?` +
      `(?:\\s*${DAY_OF_WEEK_PAT})*` +
      `(?:\\s*(?:-|–|—|:)?\\s*(?:giorno|day|g)\\s*(\\d{1,2}))?` +
      `(?:\\s*[:\\-–—]?\\s*(.*)|$)`,
    'i'
  );
  const wm = cleaned.match(wordDateWithDayLabelRe);
  if (wm) {
    const sd = Number(wm[1]);
    const ed = wm[2] ? Number(wm[2]) : sd;
    const m = MONTH_NAMES[wm[3].toLowerCase()];
    const y = wm[4] ? Number(wm[4]) : undefined;
    const dayNum = wm[5] ? Number(wm[5]) : undefined;
    if (m && sd >= 1 && sd <= 31 && ed >= 1 && ed <= 31) {
      return {
        kind: 'date',
        spec: {
          startDay: sd,
          startMonth: m,
          startYear: y,
          endDay: ed,
          endMonth: m,
          endYear: y,
          isRange: sd !== ed
        },
        dayNumber: dayNum,
        rest: (wm[6] || '').trim()
      };
    }
  }

  // 3. Cross-month numeric range: "28/11-02/12: ..." or "04/12-07/12 ..."
  const crossMonthRe =
    /^(?:dal\s+)?(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{2,4}))?\s*(?:-|–|—|\s+al?\s+|\s+to\s+)\s*(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{2,4}))?(?:\s*[:\-–—]?\s*(.*)|$)/i;
  const cm = cleaned.match(crossMonthRe);
  if (cm) {
    const sd = Number(cm[1]);
    const sm = Number(cm[2]);
    const sy = cm[3] ? (cm[3].length === 2 ? 2000 + Number(cm[3]) : Number(cm[3])) : undefined;
    const ed = Number(cm[4]);
    const em = Number(cm[5]);
    const ey = cm[6] ? (cm[6].length === 2 ? 2000 + Number(cm[6]) : Number(cm[6])) : sy;
    if (sd >= 1 && sd <= 31 && sm >= 1 && sm <= 12 && ed >= 1 && ed <= 31 && em >= 1 && em <= 12) {
      return {
        kind: 'date',
        spec: {
          startDay: sd,
          startMonth: sm,
          startYear: sy,
          endDay: ed,
          endMonth: em,
          endYear: ey,
          isRange: sd !== ed || sm !== em
        },
        rest: (cm[7] || '').trim()
      };
    }
  }

  // 4. Same-month numeric range: "22-27/11: ..." or "27-28/11 ..."
  const sameMonthRe =
    /^(?:dal\s+)?(\d{1,2})\s*(?:-|–|—|\s+al?\s+)\s*(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{2,4}))?(?:\s*[:\-–—]?\s*(.*)|$)/i;
  const smMatch = cleaned.match(sameMonthRe);
  if (smMatch) {
    const sd = Number(smMatch[1]);
    const ed = Number(smMatch[2]);
    const m = Number(smMatch[3]);
    const y = smMatch[4]
      ? smMatch[4].length === 2
        ? 2000 + Number(smMatch[4])
        : Number(smMatch[4])
      : undefined;
    if (sd >= 1 && sd <= 31 && ed >= 1 && ed <= 31 && m >= 1 && m <= 12) {
      return {
        kind: 'date',
        spec: {
          startDay: sd,
          startMonth: m,
          startYear: y,
          endDay: ed,
          endMonth: m,
          endYear: y,
          isRange: sd !== ed
        },
        rest: (smMatch[5] || '').trim()
      };
    }
  }

  // 5. Single numeric DD/MM(/YYYY) with optional day of week & optional day label
  // e.g. "22/11: arrivo...", "22/11 (Dom) – Giorno 1: ...", "07/12 volo di rientro da Osaka ore 16"
  const singleDateRe = new RegExp(
    `^(\\d{1,2})\\s*\\/\\s*(\\d{1,2})(?:\\s*\\/\\s*(\\d{2,4}))?` +
      `(?:\\s*${DAY_OF_WEEK_PAT})*` +
      `(?:\\s*(?:-|–|—|:)?\\s*(?:giorno|day|g)\\s*(\\d{1,2}))?` +
      `(?:\\s*[:\\-–—]?\\s*(.*)|$)`,
    'i'
  );
  const single = cleaned.match(singleDateRe);
  if (single) {
    const d = Number(single[1]);
    const m = Number(single[2]);
    const y = single[3]
      ? single[3].length === 2
        ? 2000 + Number(single[3])
        : Number(single[3])
      : undefined;
    const dayNum = single[4] ? Number(single[4]) : undefined;
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      return {
        kind: 'date',
        spec: {
          startDay: d,
          startMonth: m,
          startYear: y,
          endDay: d,
          endMonth: m,
          endYear: y,
          isRange: false
        },
        dayNumber: dayNum,
        rest: (single[5] || '').trim()
      };
    }
  }

  // 6. Relative "Giorno 1: ..." / "Day 1-3: ..."
  const relDayRe =
    /^(?:giorno|day|g)\s*(\d{1,2})(?:\s*(?:-|–|—|\s+al?\s+)\s*(\d{1,2}))?(?:\s*[:\-–—]?\s*(.*)|$)/i;
  const rel = cleaned.match(relDayRe);
  if (rel) {
    const sIdx = Math.max(Number(rel[1]), 1);
    const eIdx = rel[2] ? Math.max(Number(rel[2]), sIdx) : sIdx;
    return {
      kind: 'date',
      spec: {
        startDay: sIdx,
        startMonth: 0,
        endDay: eIdx,
        endMonth: 0,
        isRange: eIdx > sIdx,
        isRelativeDay: true
      },
      dayNumber: sIdx,
      rest: (rel[3] || '').trim()
    };
  }

  return null;
}

function splitOuterParentheses(text: string): { mainBody: string; parenBody: string } {
  const firstOpen = text.indexOf('(');
  const lastClose = text.lastIndexOf(')');
  if (firstOpen !== -1 && lastClose > firstOpen) {
    const mainBody = (text.slice(0, firstOpen) + ' ' + text.slice(lastClose + 1))
      .replace(/\s{2,}/g, ' ')
      .replace(/^[,;:\-–—\s]+|[,;:\-–—\s]+$/g, '')
      .trim();
    const parenBody = text.slice(firstOpen + 1, lastClose).trim();
    return { mainBody, parenBody };
  }
  return { mainBody: text.trim(), parenBody: '' };
}

function buildActivityFromDescription(
  rawDesc: string,
  baseCity: string,
  options?: {
    overrideTime?: string;
    overrideCategory?: ActivityCategory;
    extraNotes?: string;
  }
): Activity {
  const { explicitTime, timeBucket, cleanedText, extraNote } = extractTimeAndCleanText(rawDesc);
  const cleanLabel = cleanedText.replace(/^(?:vedere|visitare|inserire|fare)\s+/i, '').trim();

  const known = lookupKnownPlace(cleanLabel);
  const cityInfo = lookupCityInfo(baseCity);

  let defaultTime = known?.defaultTime || '10:00';
  if (timeBucket === 'early_morning') defaultTime = '07:30';
  else if (timeBucket === 'morning') defaultTime = '09:30';
  else if (timeBucket === 'late_morning') defaultTime = '11:30';
  else if (timeBucket === 'afternoon') defaultTime = '14:30';
  else if (timeBucket === 'sunset') defaultTime = '13:30';
  else if (timeBucket === 'late_afternoon') defaultTime = '16:45';
  else if (timeBucket === 'evening') defaultTime = '19:30';

  const finalTime = options?.overrideTime || explicitTime || defaultTime;

  // Handle option pairs: "Opzione A (Spettacolare foliage): ..." vs "Opzione B (Classica e rilassante): ..."
  const optMatch = cleanLabel.match(/^opzione\s+([A-Z])\s*(?:\(([^)]+)\))?\s*[:\-–—]\s*(.+)$/i);
  if (optMatch) {
    const optLetter = optMatch[1];
    const optTag = optMatch[2] ? `[Opzione ${optLetter} — ${optMatch[2]}]` : `[Opzione ${optLetter}]`;
    const optBody = optMatch[3].trim();
    const optKnown = lookupKnownPlace(optBody);
    return {
      id: makeId('act'),
      time: options?.overrideTime || explicitTime || (optLetter === 'A' ? '14:30' : '16:30'),
      title: `${optTag} ${optKnown?.canonicalName || smartTitleCase(optBody.split('.')[0])}`,
      locationName: optKnown?.locationName || (cityInfo ? `${cityInfo.canonical}` : optBody),
      lat: optKnown?.lat,
      lng: optKnown?.lng,
      category: optKnown?.defaultCategory || 'sightseeing',
      notes: optBody,
      completed: false
    };
  }

  // Handle baggage shipping notes: "Nota: Spedisci i bagagli..."
  if (/^(?:nota\s*:\s*)?spedisc[a-z]*\s+i?\s*bagagli/i.test(cleanLabel)) {
    return {
      id: makeId('act'),
      time: options?.overrideTime || explicitTime || '08:00',
      title: 'Spedizione bagagli grandi (Yamato Transport / Takkyubin)',
      locationName: cityInfo ? `${cityInfo.canonical}` : 'Hotel',
      category: 'transport',
      notes: cleanLabel,
      completed: false
    };
  }

  // Handle hotel dinner decision reminder
  if (/decidere\s+se\s+prenotare\s+cena/i.test(cleanLabel)) {
    return {
      id: makeId('act'),
      time: options?.overrideTime || explicitTime || '20:00',
      title: 'Cena in Ryokan / Alloggio (da decidere)',
      locationName: cityInfo ? `${cityInfo.canonical}` : 'Alloggio',
      category: 'food',
      notes: 'Valutare se prenotare cena kaiseki tradizionale in struttura o cenare nei dintorni.',
      completed: false
    };
  }

  // Handle semantic transport phrases cleanly ("atterraggio alle 12:00", "arrivo a tokyo", "trasferimento a Kyoto", "volo di rientro da Osaka")
  const isArrival = /^(?:atterraggio|arrivo(?:\s+del\s+volo)?)\b/i.test(cleanLabel);
  if (isArrival) {
    const cityInText = lookupCityInfo(cleanLabel) || lookupCityInfo(baseCity);
    const destCanonical = cityInText?.canonical || (baseCity ? smartTitleCase(baseCity) : 'Tokyo');
    return {
      id: makeId('act'),
      time: explicitTime || options?.overrideTime || '12:00',
      title: `Arrivo a ${destCanonical}`,
      locationName: cityInText ? `${cityInText.canonical}, ${cityInText.countryName}` : destCanonical,
      lat: cityInText?.lat,
      lng: cityInText?.lng,
      category: 'transport',
      notes: extraNote || 'Arrivo, ritiro bagagli/pass trasporti e check-in in alloggio.',
      completed: false
    };
  }

  const returnFlightMatch = cleanLabel.match(
    /^(?:volo\s+di\s+rientro|rientro|volo\s+ritorno|partenza\s+volo)(?:\s+da\s+(.+))?$/i
  );
  if (returnFlightMatch) {
    const originName = smartTitleCase(returnFlightMatch[1] || baseCity || '');
    const originCity = lookupCityInfo(originName);
    const isOsaka = originName.toLowerCase().includes('osaka');
    return {
      id: makeId('act'),
      time: explicitTime || options?.overrideTime || '16:00',
      title: originName ? `Volo di rientro da ${originCity?.canonical || originName}` : 'Volo di rientro',
      locationName: isOsaka
        ? 'Kansai International Airport (KIX), Osaka'
        : originCity
          ? `Aeroporto di ${originCity.canonical}`
          : originName,
      lat: isOsaka ? 34.432 : originCity?.lat,
      lng: isOsaka ? 135.2304 : originCity?.lng,
      category: 'transport',
      notes: 'Raggiungere il terminal con congruo anticipo per controlli e imbarco.',
      completed: false
    };
  }

  const returnToCityMatch = cleanLabel.match(/^rientro\s+(?:a|in)\s+(.+)$/i);
  if (returnToCityMatch) {
    const targetName = smartTitleCase(returnToCityMatch[1]);
    const targetCity = lookupCityInfo(targetName);
    return {
      id: makeId('act'),
      time: explicitTime || options?.overrideTime || '18:15',
      title: `Rientro a ${targetCity?.canonical || targetName}`,
      locationName: targetCity ? `${targetCity.canonical}, ${targetCity.countryName}` : targetName,
      lat: targetCity?.lat,
      lng: targetCity?.lng,
      category: 'transport',
      completed: false
    };
  }

  if (known) {
    const mergedNotes = [options?.extraNotes, extraNote, known.notes].filter(Boolean).join(' ');
    return {
      id: makeId('act'),
      time: finalTime,
      title: known.canonicalName,
      locationName: known.locationName,
      lat: known.lat,
      lng: known.lng,
      category: options?.overrideCategory || known.defaultCategory || inferCategory(cleanLabel),
      notes: mergedNotes || undefined,
      completed: false
    };
  }

  const isSightseeingVisit = /\bper\s+(?:visitare|vedere)\b/i.test(cleanLabel);
  const transferMatch = !isSightseeingVisit
    ? cleanLabel.match(/^(?:trasferimento|spostamento|treno|partenza)\s+(?:da\s+(.+?)\s+)?(?:(?:a|per|verso|in)\s+)?(.+)$/i)
    : null;

  if (transferMatch) {
    const rawFrom = transferMatch[1]?.trim();
    const rawTo = transferMatch[2]?.split('.')[0].trim();
    const toCity = lookupCityInfo(rawTo);
    const fromCity = rawFrom ? lookupCityInfo(rawFrom) : undefined;
    const destLabel = toCity?.canonical || smartTitleCase(rawTo);
    const title = fromCity
      ? `Treno da ${fromCity.canonical} a ${destLabel}`
      : `Trasferimento a ${destLabel}`;

    return {
      id: makeId('act'),
      time:
        explicitTime ||
        options?.overrideTime ||
        (timeBucket === 'morning'
          ? '09:30'
          : timeBucket === 'late_afternoon'
            ? '16:45'
            : timeBucket === 'afternoon'
              ? '15:00'
              : '10:30'),
      title,
      locationName: toCity ? `Stazione ${toCity.canonical}` : destLabel,
      lat: toCity?.lat,
      lng: toCity?.lng,
      category: 'transport',
      notes: extraNote || options?.extraNotes,
      completed: false
    };
  }

  // Check if the label itself is simply a known city name (e.g. "Hiroshima" in "Hiroshima + Miyajima")
  const standaloneCity = lookupCityInfo(cleanLabel);
  if (standaloneCity && cleanLabel.split(/\s+/).length <= 2) {
    const firstSuggestion = standaloneCity.freeDaySuggestions?.[0];
    if (firstSuggestion) {
      return {
        id: makeId('act'),
        time: explicitTime || options?.overrideTime || firstSuggestion.time,
        title: firstSuggestion.title,
        locationName: firstSuggestion.locationName,
        lat: firstSuggestion.lat,
        lng: firstSuggestion.lng,
        category: firstSuggestion.category,
        notes: [options?.extraNotes, extraNote, firstSuggestion.notes].filter(Boolean).join(' ') || undefined,
        completed: false
      };
    }
    return {
      id: makeId('act'),
      time: finalTime,
      title: `Visita di ${standaloneCity.canonical}`,
      locationName: `${standaloneCity.canonical}, ${standaloneCity.countryName}`,
      lat: standaloneCity.lat,
      lng: standaloneCity.lng,
      category: 'sightseeing',
      completed: false
    };
  }

  const displayTitle = smartTitleCase(cleanLabel || rawDesc);
  const locationContext =
    cityInfo && !displayTitle.toLowerCase().includes(cityInfo.canonical.toLowerCase())
      ? `${displayTitle}, ${cityInfo.canonical}`
      : displayTitle;

  return {
    id: makeId('act'),
    time: finalTime,
    title: displayTitle,
    locationName: locationContext,
    category: options?.overrideCategory || inferCategory(cleanLabel),
    notes: [options?.extraNotes, extraNote].filter(Boolean).join(' ') || undefined,
    completed: false
  };
}

/**
 * Expands a single-day multi-step chain such as:
 * - "Hiroshima + Miyajima fino al tramonto e poi rientro a Hiroshima"
 * - "partenza da Hiroshima per castello di Himeji e poi trasferimento a Osaka"
 */
function expandSingleDayChain(rawText: string, baseCity: string): Activity[] {
  const parts = rawText
    .split(/\s+e\s+poi\s+|\s+poi\s+|\s*(?:->|→|⇒)\s*|\s+\+\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const activities: Activity[] = [];
  const chainSlots = ['09:00', '13:00', '17:30', '20:00'];

  parts.forEach((part) => {
    // Special pattern: "partenza da X per Y"
    const depForMatch = part.match(/^partenza\s+da\s+(.+?)\s+(?:per|verso)\s+(.+)$/i);
    if (depForMatch) {
      const fromCityRaw = smartTitleCase(depForMatch[1].trim());
      const toStopRaw = depForMatch[2].trim();
      const fromCity = lookupCityInfo(fromCityRaw);

      activities.push({
        id: makeId('act'),
        time: '08:30',
        title: `Partenza da ${fromCity?.canonical || fromCityRaw}`,
        locationName: fromCity ? `Stazione ${fromCity.canonical}` : fromCityRaw,
        lat: fromCity?.lat,
        lng: fromCity?.lng,
        category: 'transport',
        completed: false
      });

      activities.push(
        buildActivityFromDescription(toStopRaw, baseCity, {
          overrideTime: '10:15'
        })
      );
      return;
    }

    const { explicitTime, timeBucket } = extractTimeAndCleanText(part);
    const slotFallback =
      !explicitTime && !timeBucket && parts.length > 1
        ? chainSlots[Math.min(activities.length, chainSlots.length - 1)]
        : undefined;

    activities.push(
      buildActivityFromDescription(part, baseCity, {
        overrideTime: slotFallback
      })
    );
  });

  return activities;
}

/**
 * Staggers un-timed activities across realistic daytime hours (09:00 - 19:30)
 * so that multiple stops on the same day never collapse onto the same time.
 */
function staggerActivities(activities: Activity[]): Activity[] {
  if (activities.length <= 1) return activities;

  const defaultSlotPacks: Record<number, string[]> = {
    2: ['10:00', '15:00'],
    3: ['09:30', '13:30', '16:30'],
    4: ['09:30', '12:00', '14:45', '17:30'],
    5: ['09:00', '11:15', '13:30', '15:45', '18:00'],
    6: ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'],
    7: ['08:30', '10:15', '12:00', '13:45', '15:30', '17:15', '19:00']
  };

  const pack = defaultSlotPacks[Math.min(activities.length, 7)] || defaultSlotPacks[7];

  activities.forEach((act, idx) => {
    // If activity was assigned default '10:00', distribute it across staggered slots
    if (act.time === '10:00') {
      act.time = pack[Math.min(idx, pack.length - 1)];
    }
  });

  const toMins = (t: string) => {
    const [h, m] = (t || '10:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const toTimeStr = (mins: number) => {
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  let prevMins = -1;
  for (let i = 0; i < activities.length; i++) {
    const curMins = toMins(activities[i].time);
    if (curMins <= prevMins) {
      const bumped = Math.min(prevMins + 75, 21 * 60);
      activities[i].time = toTimeStr(bumped);
      prevMins = bumped;
      continue;
    }
    prevMins = toMins(activities[i].time);
  }

  activities.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
  return activities;
}

/**
 * Parses a human-written itinerary outline into a complete structured TripWise plan.
 */
export function parseNaturalLanguageItinerary(
  rawText: string,
  options?: {
    referenceYear?: number;
    referenceStartDate?: string;
    enrichFreeDays?: boolean;
  }
): ParsedItineraryPlan {
  const enrichFreeDays = options?.enrichFreeDays ?? true;
  const now = new Date();
  const baseDefaultYear = options?.referenceYear ?? now.getFullYear();

  const rawLines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  interface DayNode {
    spec: Omit<RawLineRule, 'mainBody' | 'parenBody'>;
    dayNumber?: number;
    stageCity?: string;
    dayTitle?: string;
    childLines: string[];
  }

  const dayNodes: DayNode[] = [];
  const rawStayRules: RawLineRule[] = [];
  let unassignedNotes: string[] = [];
  let currentStageCity = '';
  let currentDayNode: DayNode | null = null;

  for (const line of rawLines) {
    const match = parseLeadingDateSpec(line);
    if (match?.kind === 'stage') {
      currentStageCity = match.stageCity || '';
      continue;
    }

    if (match?.kind === 'date') {
      const { mainBody, parenBody } = splitOuterParentheses(match.rest);
      if (match.spec.isRange && !match.dayNumber) {
        // Multi-day stay range rule e.g. "22-27/11: TOKYO (...)"
        rawStayRules.push({
          ...match.spec,
          mainBody,
          parenBody
        });
        currentDayNode = null;
      } else {
        // Single day or numbered day e.g. "22 Nov (Dom) – Giorno 1: Arrivo a Tokyo" or "- 22/11: arrivo a tokyo..."
        currentDayNode = {
          spec: match.spec,
          dayNumber: match.dayNumber,
          stageCity: currentStageCity,
          dayTitle: mainBody || undefined,
          childLines: []
        };
        if (parenBody) {
          currentDayNode.childLines.push(parenBody);
        }
        dayNodes.push(currentDayNode);
      }
    } else {
      // Child sub-bullet or unassigned line
      if (currentDayNode) {
        currentDayNode.childLines.push(line);
      } else {
        const cleanedBullet = cleanBulletPrefix(line);
        if (cleanedBullet) unassignedNotes.push(cleanedBullet);
      }
    }
  }

  // Fallback if user wrote plain comma/newline stops without any dates
  if (dayNodes.length === 0 && rawStayRules.length === 0) {
    const fallbackStart =
      options?.referenceStartDate ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')}`;

    const day1Activities = unassignedNotes.map((note) =>
      buildActivityFromDescription(note, '')
    );
    staggerActivities(day1Activities);

    return {
      isValid: day1Activities.length > 0,
      startDate: fallbackStart,
      endDate: fallbackStart,
      detectedPresetId: 'custom',
      detectedDestination: 'Mondo',
      detectedEmoji: '🌍',
      detectedCurrency: 'EUR',
      detectedExchangeRate: 1,
      defaultCenter: [41.9028, 12.4964],
      suggestedTitle: 'Nuovo Viaggio Personalizzato',
      days: [
        {
          id: makeId('day'),
          dayNumber: 1,
          date: fallbackStart,
          title: 'Giorno 1',
          activities: day1Activities
        }
      ],
      totalActivities: day1Activities.length,
      geocodedCount: day1Activities.filter((a) => typeof a.lat === 'number').length
    };
  }

  // Resolve ISO dates (including cross-year rollover e.g. Dec -> Jan)
  const allSpecs = [...dayNodes.map((d) => d.spec), ...rawStayRules];
  const firstRule = allSpecs[0];
  let anchorYear = firstRule.startYear ?? baseDefaultYear;
  if (!firstRule.startYear && !firstRule.isRelativeDay && !options?.referenceYear) {
    const candidateUtc = Date.UTC(anchorYear, firstRule.startMonth - 1, firstRule.startDay);
    const fortyFiveDaysAgo = Date.now() - 45 * 86400000;
    if (candidateUtc < fortyFiveDaysAgo) {
      anchorYear += 1;
    }
  }

  const relativeBaseIso =
    options?.referenceStartDate ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;

  const anchorMonth = firstRule.startMonth || 1;
  const resolveMonthDayToIso = (day: number, month: number, explicitYear?: number): string => {
    if (explicitYear) return toIsoDate(explicitYear, month, day);
    const yr = month < anchorMonth ? anchorYear + 1 : anchorYear;
    return toIsoDate(yr, month, day);
  };

  interface ResolvedStayRule {
    startIso: string;
    endIso: string;
    isRange: boolean;
    mainBody: string;
    parenBody: string;
  }

  const stayRules: ResolvedStayRule[] = rawStayRules.map((r) => {
    const sIso = r.isRelativeDay
      ? addDaysIso(relativeBaseIso, r.startDay - 1)
      : resolveMonthDayToIso(r.startDay, r.startMonth, r.startYear);
    let eIso = r.isRelativeDay
      ? addDaysIso(relativeBaseIso, r.endDay - 1)
      : resolveMonthDayToIso(r.endDay, r.endMonth, r.endYear);
    if (eIso < sIso) {
      eIso = toIsoDate(anchorYear + 1, r.endMonth, r.endDay);
    }
    return {
      startIso: sIso,
      endIso: eIso,
      isRange: true,
      mainBody: r.mainBody,
      parenBody: r.parenBody
    };
  });

  const collectedIsos: string[] = [];
  for (const dn of dayNodes) {
    const sIso = dn.spec.isRelativeDay
      ? addDaysIso(relativeBaseIso, dn.spec.startDay - 1)
      : resolveMonthDayToIso(dn.spec.startDay, dn.spec.startMonth, dn.spec.startYear);
    collectedIsos.push(sIso);
  }
  for (const sr of stayRules) {
    collectedIsos.push(sr.startIso, sr.endIso);
  }

  collectedIsos.sort();
  const minIso = collectedIsos[0];
  const maxIso = collectedIsos[collectedIsos.length - 1];
  const tripDates = enumerateIsoRange(minIso, maxIso);

  // Build Day Buckets
  interface DayBucket {
    date: string;
    baseCity: string;
    previousCity?: string;
    dayTitleOverride?: string;
    activities: Activity[];
    hasExplicitDayTrip: boolean;
  }

  const dayMap = new Map<string, DayBucket>();
  for (const iso of tripDates) {
    dayMap.set(iso, {
      date: iso,
      baseCity: '',
      activities: [],
      hasExplicitDayTrip: false
    });
  }

  // 1. Process Multi-Day Stay Ranges FIRST to establish baseCity per day (respecting check-out transitions)
  const stayStartIsos = new Set(stayRules.map((s) => s.startIso));

  for (const stay of stayRules) {
    const cityRaw = stay.mainBody.replace(/^[:\-–—\s]+/, '').trim();
    const cityInfo = lookupCityInfo(cityRaw);
    const cleanCity = cityInfo?.canonical || smartTitleCase(cityRaw);
    const rangeIsos = enumerateIsoRange(stay.startIso, stay.endIso);

    rangeIsos.forEach((iso, idx) => {
      const bucket = dayMap.get(iso);
      if (!bucket) return;
      const isLastDayOfStay = idx === rangeIsos.length - 1 && rangeIsos.length > 1;
      const anotherStayStartsHere = stayStartIsos.has(iso) && stay.startIso !== iso;

      if (isLastDayOfStay && anotherStayStartsHere) {
        bucket.previousCity = bucket.baseCity || cleanCity;
      } else {
        if (bucket.baseCity && bucket.baseCity !== cleanCity) {
          bucket.previousCity = bucket.baseCity;
        }
        bucket.baseCity = cleanCity;
      }
    });
  }

  // 2. Process Day Nodes (both flat lines and day headers with sub-lists)
  for (const dn of dayNodes) {
    const iso = dn.spec.isRelativeDay
      ? addDaysIso(relativeBaseIso, dn.spec.startDay - 1)
      : resolveMonthDayToIso(dn.spec.startDay, dn.spec.startMonth, dn.spec.startYear);

    const bucket = dayMap.get(iso);
    if (!bucket) continue;

    if (dn.stageCity && !bucket.baseCity) {
      bucket.baseCity = dn.stageCity;
    }

    if (dn.dayTitle) {
      if (dn.childLines.length === 0) {
        // Flat format single-day chain (e.g. "arrivo a tokyo ore 12.50" or "partenza da Hiroshima...")
        const generated = expandSingleDayChain(dn.dayTitle, bucket.baseCity);
        bucket.activities.push(...generated);
      } else {
        bucket.dayTitleOverride = dn.dayTitle;
        // If dayTitle was an arrival and childLines do not mention arrival/atterraggio, generate arrival
        if (/^arrivo\b/i.test(dn.dayTitle) && !dn.childLines.some((c) => /atterraggio|arrivo/i.test(c))) {
          bucket.activities.push(buildActivityFromDescription(dn.dayTitle, bucket.baseCity));
        }
      }
    }

    // Process Child Lines
    for (const rawChild of dn.childLines) {
      const clean = cleanBulletPrefix(rawChild);
      if (!clean) continue;
      // Skip option picker header lines e.g. "Pomeriggio (Scegliere tra Opzione A o B):"
      if (/^pomeriggio\s*\(?scegliere\s+tra\s+opzione/i.test(clean)) {
        continue;
      }
      bucket.activities.push(buildActivityFromDescription(clean, bucket.baseCity));
    }

    if (dn.childLines.length > 0) {
      staggerActivities(bucket.activities);
    }
  }

  // Propagate baseCity for single-day legs that still lack baseCity
  for (const dn of dayNodes) {
    const iso = dn.spec.isRelativeDay
      ? addDaysIso(relativeBaseIso, dn.spec.startDay - 1)
      : resolveMonthDayToIso(dn.spec.startDay, dn.spec.startMonth, dn.spec.startYear);
    const bucket = dayMap.get(iso);
    if (!bucket || bucket.baseCity) continue;
    if (dn.dayTitle) {
      const possibleCity = lookupCityInfo(dn.dayTitle);
      if (possibleCity) bucket.baseCity = possibleCity.canonical;
    }
  }

  // 3. Process Parenthetical Sub-Plans inside Multi-Day Stay Ranges!
  for (const stay of stayRules) {
    if (!stay.parenBody) continue;
    const cityInfo = lookupCityInfo(stay.mainBody);
    const stayCity = cityInfo?.canonical || smartTitleCase(stay.mainBody);

    // Effective days belonging to this stay
    const stayRangeIsos = enumerateIsoRange(stay.startIso, stay.endIso).filter((iso, idx, arr) => {
      if (idx === arr.length - 1 && arr.length > 1 && stayStartIsos.has(iso) && stay.startIso !== iso) {
        return false;
      }
      return true;
    });

    interface WishlistItem {
      raw: string;
      earlyMorning: boolean;
      isExcursion: boolean;
      excursionPlaces: string[];
    }

    const wishlist: WishlistItem[] = [];

    // Split by ";" first so group modifiers like "vedere presto la mattina X, Y, Z" apply to X, Y, and Z!
    const semicolonGroups = stay.parenBody
      .split(';')
      .map((g) => g.trim())
      .filter(Boolean);

    for (const group of semicolonGroups) {
      const groupEarlyMorning = /\b(?:presto\s+la\s+mattina|mattina\s+presto|all['’]alba)\b/i.test(
        group
      );
      const strippedGroup = group
        .replace(
          /^(?:vedere\s+presto\s+la\s+mattina|presto\s+la\s+mattina|mattina\s+presto|inserire|vedere|visitare)\s+/i,
          ''
        )
        .trim();

      const commaItems = strippedGroup
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      for (const item of commaItems) {
        const cleanedItem = item.replace(/^(?:inserire|vedere|visitare)\s+/i, '').trim();
        if (!cleanedItem) continue;

        // Check if item carries an embedded specific date (at start: "24/11 Kamakura" OR at end: "Universal studio 05/12")
        const inlineDateRe = /(?:^|\s)(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{2,4}))?(?:\s|$)/;
        const dm = cleanedItem.match(inlineDateRe);
        if (dm) {
          const d = Number(dm[1]);
          const m = Number(dm[2]);
          const y = dm[3]
            ? dm[3].length === 2
              ? 2000 + Number(dm[3])
              : Number(dm[3])
            : undefined;
          const targetIso = resolveMonthDayToIso(d, m, y);
          const descWithoutDate = cleanedItem
            .replace(inlineDateRe, ' ')
            .replace(/^[:\-–—\s]+|[:\-–—\s]+$/g, '')
            .replace(/\s{2,}/g, ' ')
            .trim();

          const targetBucket = dayMap.get(targetIso);
          if (targetBucket && descWithoutDate) {
            const act = buildActivityFromDescription(descWithoutDate, stayCity, {
              overrideTime: groupEarlyMorning ? '07:30' : undefined
            });
            targetBucket.activities.push(act);

            const lowerDesc = descWithoutDate.toLowerCase();
            if (
              lowerDesc.includes('kamakura') ||
              lowerDesc.includes('nikko') ||
              lowerDesc.includes('gita') ||
              lowerDesc.includes('escursione')
            ) {
              targetBucket.hasExplicitDayTrip = true;
              targetBucket.dayTitleOverride = `${stayCity} — ${act.title}`;
            } else if (lowerDesc.includes('universal')) {
              targetBucket.hasExplicitDayTrip = true;
              targetBucket.dayTitleOverride = `${stayCity} — Universal Studios Japan`;
            }
          }
          continue;
        }

        // Otherwise it's an undated item for this stay's wishlist pool!
        const excursionMatch = cleanedItem.match(/^(?:gita|escursione)\s+(?:a|in)\s+(.+)$/i);
        if (excursionMatch) {
          const places = excursionMatch[1]
            .split(/\s+e\s+|\s*\+\s*|\s*\/\s*/i)
            .map((p) => p.trim())
            .filter(Boolean);
          wishlist.push({
            raw: cleanedItem,
            earlyMorning: false,
            isExcursion: true,
            excursionPlaces: places
          });
        } else {
          wishlist.push({
            raw: cleanedItem,
            earlyMorning: groupEarlyMorning,
            isExcursion: false,
            excursionPlaces: []
          });
        }
      }
    }

    if (wishlist.length > 0 && stayRangeIsos.length > 0) {
      // Prefer full stay days (excluding arrival/transfer-in first day if >1 days, and afternoon-departure last day if needed)
      const fullStayIsos =
        stayRangeIsos.length > 2
          ? stayRangeIsos.slice(1)
          : stayRangeIsos;

      // A) Schedule Excursions first on a dedicated full day (preferring middle/later full day)
      const excursions = wishlist.filter((w) => w.isExcursion);
      for (const exc of excursions) {
        const candidateIso =
          [...fullStayIsos]
            .reverse()
            .find((iso) => {
              const b = dayMap.get(iso);
              return b && !b.hasExplicitDayTrip && b.activities.length === 0;
            }) || fullStayIsos[Math.min(fullStayIsos.length - 1, 1)] || stayRangeIsos[0];

        const excBucket = dayMap.get(candidateIso);
        if (excBucket) {
          excBucket.hasExplicitDayTrip = true;
          const placeLabels = exc.excursionPlaces.map(smartTitleCase).join(' e ');
          excBucket.dayTitleOverride = `Escursione a ${placeLabels}`;

          exc.excursionPlaces.forEach((placeName, pIdx) => {
            excBucket.activities.push(
              buildActivityFromDescription(placeName, stayCity, {
                overrideTime: pIdx === 0 ? '09:00' : '13:45'
              })
            );
          });
        }
      }

      // Non-excursion candidate days in this stay
      const regularStayIsos = fullStayIsos.filter((iso) => !dayMap.get(iso)?.hasExplicitDayTrip);
      const targetPoolIsos = regularStayIsos.length > 0 ? regularStayIsos : stayRangeIsos;

      // B) Distribute "presto la mattina" items across distinct mornings first!
      const earlyItems = wishlist.filter((w) => !w.isExcursion && w.earlyMorning);
      earlyItems.forEach((item, idx) => {
        const targetIso = targetPoolIsos[idx % targetPoolIsos.length];
        const bucket = dayMap.get(targetIso);
        if (!bucket) return;
        const alreadyHasEarly = bucket.activities.some((a) => (a.time || '') <= '08:00');
        bucket.activities.push(
          buildActivityFromDescription(item.raw, stayCity, {
            overrideTime: alreadyHasEarly ? '10:30' : '07:30',
            extraNotes: alreadyHasEarly ? undefined : 'Visita presto la mattina per evitare la folla.'
          })
        );
      });

      // C) Distribute remaining wishlist items across least-loaded regular days
      const regularItems = wishlist.filter((w) => !w.isExcursion && !w.earlyMorning);
      for (const item of regularItems) {
        const bestIso = [...targetPoolIsos].sort((a, b) => {
          const lenA = dayMap.get(a)?.activities.length ?? 0;
          const lenB = dayMap.get(b)?.activities.length ?? 0;
          return lenA - lenB;
        })[0];
        const bucket = dayMap.get(bestIso);
        if (bucket) {
          const slotTime = bucket.activities.length === 0 ? '10:00' : bucket.activities.length === 1 ? '14:30' : '16:00';
          bucket.activities.push(
            buildActivityFromDescription(item.raw, stayCity, {
              overrideTime: slotTime
            })
          );
        }
      }
    }
  }

  // 4. Transition Transfers & Optional City Highlights Enrichment + Chronological Sorting & Day Titles
  const citySuggestionCursors = new Map<string, number>();
  const usedTitlesInTrip = new Set<string>();

  const finalDays: ItineraryDay[] = tripDates.map((iso, idx) => {
    const bucket = dayMap.get(iso)!;
    const cityKey = bucket.baseCity.toLowerCase();
    const cityInfo = lookupCityInfo(bucket.baseCity);

    // If traveler changed stay city today (e.g. Tokyo -> Fujikawaguchiko on 27/11) and no transport is listed yet, add transfer stop!
    if (
      bucket.previousCity &&
      bucket.baseCity &&
      bucket.previousCity !== bucket.baseCity &&
      !bucket.activities.some((a) => a.category === 'transport')
    ) {
      bucket.activities.unshift({
        id: makeId('act'),
        time: '09:00',
        title: `Trasferimento da ${bucket.previousCity} a ${bucket.baseCity}`,
        locationName: cityInfo ? `${cityInfo.canonical}, ${cityInfo.countryName}` : bucket.baseCity,
        lat: cityInfo?.lat,
        lng: cityInfo?.lng,
        category: 'transport',
        completed: false
      });
    }

    // Track already used titles to avoid duplicates when enriching free days
    for (const act of bucket.activities) {
      usedTitlesInTrip.add(act.title.toLowerCase());
    }

    // Optionally enrich open/light city days so every day on the map has meaningful pins
    if (enrichFreeDays && !bucket.hasExplicitDayTrip && cityInfo?.freeDaySuggestions) {
      const suggestions = cityInfo.freeDaySuggestions;
      let cursor = citySuggestionCursors.get(cityKey) ?? 0;

      // Determine how many suggestions fit comfortably without crowding explicit events
      const arrivalAct = bucket.activities.find((a) => /^arrivo\s+/i.test(a.title));
      const returnFlightAct = bucket.activities.find((a) =>
        a.title.toLowerCase().includes('volo di rientro')
      );
      const hasMorningEvent = bucket.activities.some((a) => (a.time || '99:99') < '12:00');
      const hasAfternoonTransfer = bucket.activities.some(
        (a) => a.category === 'transport' && (a.time || '00:00') >= '14:00'
      );

      let targetMinCount = 2;
      if (bucket.activities.length === 0) targetMinCount = 3;
      if (returnFlightAct) {
        targetMinCount = (returnFlightAct.time || '16:00') <= '12:30' ? 1 : 2;
      }
      if (arrivalAct) {
        targetMinCount = (arrivalAct.time || '12:00') >= '19:00' ? 1 : 2;
      }

      while (bucket.activities.length < targetMinCount && cursor < suggestions.length) {
        const cand = suggestions[cursor];
        cursor += 1;
        if (usedTitlesInTrip.has(cand.title.toLowerCase())) continue;

        let adjustedTime = cand.time;
        if (arrivalAct) {
          const arrHour = Number.parseInt((arrivalAct.time || '12:00').slice(0, 2), 10) || 12;
          const minHourAfterArrival = Math.min(arrHour + 4, 20);
          const minTimeStr = `${String(minHourAfterArrival).padStart(2, '0')}:30`;
          if (adjustedTime < minTimeStr) {
            adjustedTime = minTimeStr;
          }
        } else if (returnFlightAct) {
          adjustedTime = '09:30';
        } else if (hasAfternoonTransfer && adjustedTime >= '14:00') {
          adjustedTime = '10:00';
        } else if (hasMorningEvent && adjustedTime < '12:00') {
          adjustedTime = '14:30';
        }

        // Prevent time clash
        if (bucket.activities.some((a) => a.time === adjustedTime)) {
          continue;
        }

        usedTitlesInTrip.add(cand.title.toLowerCase());
        bucket.activities.push({
          id: makeId('act'),
          time: adjustedTime,
          title: cand.title,
          locationName: cand.locationName,
          lat: cand.lat,
          lng: cand.lng,
          category: cand.category,
          notes: cand.notes,
          completed: false
        });
      }

      citySuggestionCursors.set(cityKey, cursor);
    }

    // Fallback single city pin if day is still completely empty
    if (bucket.activities.length === 0 && bucket.baseCity) {
      bucket.activities.push({
        id: makeId('act'),
        time: '10:00',
        title: `Esplorazione di ${bucket.baseCity}`,
        locationName: cityInfo
          ? `${cityInfo.canonical}, ${cityInfo.countryName}`
          : bucket.baseCity,
        lat: cityInfo?.lat,
        lng: cityInfo?.lng,
        category: 'sightseeing',
        completed: false
      });
    }

    // Sort activities chronologically
    bucket.activities.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

    // Craft expressive Day Title
    let dayTitle = `Giorno ${idx + 1}`;
    if (bucket.dayTitleOverride) {
      dayTitle = bucket.dayTitleOverride;
    } else {
      const headlineStops = bucket.activities
        .map((a) =>
          a.title
            .replace(/^Tempio\s+|^Santuario\s+(?:di\s+)?|^Visita\s+di\s+/i, '')
            .split('(')[0]
            .trim()
        )
        .filter(Boolean);

      if (bucket.baseCity && headlineStops.length > 0) {
        const concise = headlineStops[0];
        dayTitle = concise.toLowerCase().includes(bucket.baseCity.toLowerCase())
          ? concise
          : `${bucket.baseCity} — ${concise}`;
      } else if (bucket.baseCity) {
        dayTitle = bucket.baseCity;
      } else if (headlineStops[0]) {
        dayTitle = headlineStops[0];
      }
    }

    return {
      id: makeId('day'),
      dayNumber: idx + 1,
      date: iso,
      title: dayTitle,
      activities: bucket.activities
    };
  });

  // 5. Infer Overall Destination, Currency, Preset & Suggested Title
  const detectedCities: CityInfo[] = [];
  const distinctCityNames: string[] = [];

  for (const d of finalDays) {
    const b = dayMap.get(d.date);
    if (b?.baseCity && !distinctCityNames.includes(b.baseCity)) {
      distinctCityNames.push(b.baseCity);
      const ci = lookupCityInfo(b.baseCity);
      if (ci) detectedCities.push(ci);
    }
  }

  // Also inspect all activity titles if no stay range matched catalog
  if (detectedCities.length === 0) {
    for (const d of finalDays) {
      for (const a of d.activities) {
        const ci = lookupCityInfo(`${a.title} ${a.locationName}`);
        if (ci) {
          detectedCities.push(ci);
          break;
        }
      }
    }
  }

  const primaryCountry = detectedCities[0];
  const detectedPresetId = primaryCountry?.countryPresetId || 'custom';
  const detectedDestination =
    primaryCountry?.countryName || distinctCityNames[0] || 'Destinazione Personalizzata';
  const detectedEmoji = primaryCountry?.emoji || '🌍';
  const detectedCurrency = primaryCountry?.currency || 'EUR';
  const detectedExchangeRate = primaryCountry?.rateFromEur || 1;
  const defaultCenter: [number, number] = primaryCountry
    ? [primaryCountry.lat, primaryCountry.lng]
    : [41.9028, 12.4964];

  const citySummary =
    distinctCityNames.length > 0
      ? distinctCityNames.slice(0, 4).join(', ')
      : detectedDestination;
  const suggestedTitle =
    primaryCountry && distinctCityNames.length >= 2
      ? `${primaryCountry.countryName}: ${citySummary}`
      : distinctCityNames.length >= 1
        ? `Viaggio: ${citySummary}`
        : `Viaggio in ${detectedDestination}`;

  const totalActivities = finalDays.reduce((acc, d) => acc + d.activities.length, 0);
  const geocodedCount = finalDays.reduce(
    (acc, d) =>
      acc + d.activities.filter((a) => typeof a.lat === 'number' && typeof a.lng === 'number').length,
    0
  );

  return {
    isValid: finalDays.length > 0 && totalActivities > 0,
    startDate: minIso,
    endDate: maxIso,
    detectedPresetId,
    detectedDestination,
    detectedEmoji,
    detectedCurrency,
    detectedExchangeRate,
    defaultCenter,
    suggestedTitle,
    days: finalDays,
    totalActivities,
    geocodedCount
  };
}

/**
 * Resolves GPS coordinates via OpenStreetMap Photon/Nominatim for any generated stop
 * not already present in the instant offline dictionary (works for any destination worldwide).
 */
export async function enrichItineraryDaysWithGeocoding(
  days: ItineraryDay[],
  biasCenter?: [number, number]
): Promise<ItineraryDay[]> {
  const { searchPlaces } = await import('../services/geocoding');
  const cache = new Map<string, { lat: number; lng: number; shortName: string } | null>();
  const cloned: ItineraryDay[] = days.map((d) => ({
    ...d,
    activities: d.activities.map((a) => ({ ...a }))
  }));

  for (const day of cloned) {
    for (const act of day.activities) {
      if (typeof act.lat === 'number' && typeof act.lng === 'number') continue;
      const query = (act.locationName || act.title || '').trim();
      if (query.length < 2) continue;

      const key = query.toLowerCase();
      if (!cache.has(key)) {
        try {
          const matches = await searchPlaces(query, biasCenter);
          cache.set(
            key,
            matches[0]
              ? { lat: matches[0].lat, lng: matches[0].lng, shortName: matches[0].shortName }
              : null
          );
        } catch {
          cache.set(key, null);
        }
      }

      const hit = cache.get(key);
      if (hit) {
        act.lat = hit.lat;
        act.lng = hit.lng;
        if (!act.locationName) {
          act.locationName = hit.shortName;
        }
      }
    }
  }

  return cloned;
}
