import type { ActivityCategory } from '../types/trip';

export interface KnownPlaceEntry {
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
 * Instant offline-ready coordinate & metadata dictionary for popular global landmarks & stops.
 * Ensures 0ms pinpoint accuracy even for colloquial queries worldwide.
 * Any place outside this catalog is resolved dynamically via OpenStreetMap Photon/Nominatim.
 */
export const KNOWN_PLACES_DB: KnownPlaceEntry[] = [
  // =========================================================================
  // GIAPPONE: Tokyo & Kanto
  // =========================================================================
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
    keywords: ['meigetsu-in', 'meigetsuin'],
    canonicalName: 'Tempio Meigetsu-in (Foliage & Finestra Circolare)',
    locationName: 'Meigetsu-in, Kamakura',
    lat: 35.3347,
    lng: 139.5539,
    defaultCategory: 'sightseeing',
    notes: 'Famosa finestra circolare aperta sul giardino posteriore e foliage tardivo.'
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
    keywords: ['ueno', 'parco ueno'],
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
    keywords: ['statua della libert', 'lungomare odaiba', 'odaiba'],
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
  {
    keywords: ['nikko'],
    canonicalName: 'Santuario Toshogu a Nikko',
    locationName: 'Nikko Toshogu, Nikko',
    lat: 36.7581,
    lng: 139.5989,
    defaultCategory: 'sightseeing'
  },

  // =========================================================================
  // GIAPPONE: Monte Fuji & 5 Laghi
  // =========================================================================
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
    keywords: ['chureito', 'pagoda chureito'],
    canonicalName: 'Pagoda Chureito (Arakurayama Sengen Park)',
    locationName: 'Chureito Pagoda, Fujiyoshida',
    lat: 35.5013,
    lng: 138.8014,
    defaultCategory: 'sightseeing',
    notes: 'Celebre punto panoramico con pagoda a 5 piani e Monte Fuji sullo sfondo.'
  },
  {
    keywords: ['momiji corridor', 'tunnel di aceri', 'momiji kairo'],
    canonicalName: 'Momiji Corridor (Tunnel di Aceri sul Lago Kawaguchiko)',
    locationName: 'Momiji Kairo, Fujikawaguchiko, Yamanashi',
    lat: 35.5268,
    lng: 138.7615,
    defaultCategory: 'sightseeing',
    notes: 'Canale fiancheggiato da aceri centenari che in autunno formano un tunnel rosso fuoco.'
  },

  // =========================================================================
  // GIAPPONE: Kyoto, Uji, Nara
  // =========================================================================
  {
    keywords: ['fushimi inari', 'fushimi inari taisha'],
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
    defaultCategory: 'sightseeing'
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
    keywords: ['kodai-ji', 'kodaiji'],
    canonicalName: 'Tempio Kodai-ji & Boschetto di Bambù',
    locationName: 'Kodai-ji, Higashiyama, Kyoto',
    lat: 35.0003,
    lng: 135.7818,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['yasaka', 'santuario yasaka'],
    canonicalName: 'Santuario Yasaka Jingu',
    locationName: 'Yasaka Shrine, Gion, Kyoto',
    lat: 35.0037,
    lng: 135.7785,
    defaultCategory: 'sightseeing'
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
    keywords: ['ryoan-ji', 'ryoanji', 'giardino zen'],
    canonicalName: 'Tempio Ryoan-ji (Giardino Zen di Rocce)',
    locationName: 'Ryoan-ji, Ukyo, Kyoto',
    lat: 35.0345,
    lng: 135.7182,
    defaultCategory: 'sightseeing'
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
    keywords: ['ruriko-in', 'rurikoin'],
    canonicalName: 'Tempio Ruriko-in (Foliage sul Tavolo Laccato)',
    locationName: 'Ruriko-in, Kamitakano, Sakyo, Kyoto',
    lat: 35.0641,
    lng: 135.8197,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['sentiero della filosofia', 'tetsugaku no michi', 'filosofia'],
    canonicalName: 'Sentiero della Filosofia (Tetsugaku-no-Michi)',
    locationName: 'Philosopher’s Path, Sakyo, Kyoto',
    lat: 35.0232,
    lng: 135.7958,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['ginkaku-ji', 'ginkakuji', 'padiglione d’argento', "padiglione d'argento"],
    canonicalName: 'Ginkaku-ji (Padiglione d’Argento)',
    locationName: 'Ginkaku-ji, Sakyo, Kyoto',
    lat: 35.0272,
    lng: 135.7982,
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
    keywords: ['nishiki', 'mercato di nishiki'],
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
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['nara'],
    canonicalName: 'Parco di Nara & Grande Buddha del Todai-ji',
    locationName: 'Nara Park & Todai-ji, Nara',
    lat: 34.6851,
    lng: 135.843,
    defaultCategory: 'sightseeing'
  },

  // =========================================================================
  // GIAPPONE: Hiroshima, Miyajima, Himeji, Osaka
  // =========================================================================
  {
    keywords: ['parco della pace', 'peace memorial', 'cupola della bomba', 'genbaku'],
    canonicalName: 'Parco Memoriale della Pace di Hiroshima & Cupola di Genbaku',
    locationName: 'Peace Memorial Park, Hiroshima',
    lat: 34.3928,
    lng: 132.4526,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['miyajima', 'itsukushima'],
    canonicalName: 'Isola di Miyajima & Santuario di Itsukushima',
    locationName: 'Itsukushima Shrine, Miyajima',
    lat: 34.296,
    lng: 132.3198,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['castello di himeji', 'himeji castle', 'himeji'],
    canonicalName: 'Castello di Himeji (Airone Bianco)',
    locationName: 'Himeji Castle, Himeji',
    lat: 34.8394,
    lng: 134.6939,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['universal studio', 'universal studios', 'usj'],
    canonicalName: 'Universal Studios Japan (USJ)',
    locationName: 'Universal Studios Japan, Osaka',
    lat: 34.6654,
    lng: 135.4323,
    defaultCategory: 'sightseeing',
    defaultTime: '08:30'
  },
  {
    keywords: ['dotonbori'],
    canonicalName: 'Dotonbori & Insegna Glico',
    locationName: 'Dotonbori, Namba, Osaka',
    lat: 34.6687,
    lng: 135.5013,
    defaultCategory: 'food'
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
  {
    keywords: ['minoh park', 'minoh', 'minoo', 'cascata di minoo'],
    canonicalName: 'Parco Naturale di Minoh & Cascata',
    locationName: 'Minoh Park, Minoh, Osaka',
    lat: 34.8496,
    lng: 135.4727,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['kaiyukan', 'acquario di osaka', 'osaka aquarium'],
    canonicalName: 'Acquario Kaiyukan di Osaka (Vasca Squali Balena)',
    locationName: 'Osaka Aquarium Kaiyukan, Tempozan, Osaka',
    lat: 34.6545,
    lng: 135.429,
    defaultCategory: 'sightseeing'
  },

  // =========================================================================
  // ITALIA: Roma, Firenze, Venezia, Toscana, Dolomiti, Milano
  // =========================================================================
  {
    keywords: ['colosseo e fori imperiali', 'colosseo e foro romano', 'colosseo', 'foro romano', 'fori imperiali'],
    canonicalName: 'Colosseo & Fori Imperiali',
    locationName: 'Piazza del Colosseo, Roma',
    lat: 41.8902,
    lng: 12.4922,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['fontana di trevi', 'trevi'],
    canonicalName: 'Fontana di Trevi',
    locationName: 'Piazza di Trevi, Roma',
    lat: 41.9009,
    lng: 12.4833,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['pantheon'],
    canonicalName: 'Pantheon',
    locationName: 'Piazza della Rotonda, Roma',
    lat: 41.8986,
    lng: 12.4769,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['piazza navona', 'fontana dei quattro fiumi'],
    canonicalName: 'Piazza Navona & Fontana dei Quattro Fiumi',
    locationName: 'Piazza Navona, Roma',
    lat: 41.8992,
    lng: 12.4731,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['piazza di spagna', 'trinità dei monti', 'scalinata di trinità dei monti'],
    canonicalName: 'Piazza di Spagna & Scalinata di Trinità dei Monti',
    locationName: 'Piazza di Spagna, Roma',
    lat: 41.906,
    lng: 12.4828,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['musei vaticani', 'cappella sistina', 'vatican'],
    canonicalName: 'Musei Vaticani & Cappella Sistina',
    locationName: 'Viale Vaticano, Roma',
    lat: 41.9067,
    lng: 12.4536,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['basilica di san pietro', 'san pietro in vaticano'],
    canonicalName: 'Basilica di San Pietro in Vaticano',
    locationName: 'Piazza San Pietro, Città del Vaticano',
    lat: 41.9022,
    lng: 12.4539,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ["castel sant'angelo", 'castel santangelo'],
    canonicalName: "Castel Sant'Angelo",
    locationName: 'Lungotevere Castello, Roma',
    lat: 41.9031,
    lng: 12.4663,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['galleria borghese', 'villa borghese'],
    canonicalName: 'Galleria Borghese & Villa Borghese',
    locationName: 'Piazzale Scipione Borghese, Roma',
    lat: 41.9142,
    lng: 12.4921,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['trastevere'],
    canonicalName: 'Quartiere Trastevere (Cena Tipica)',
    locationName: 'Trastevere, Roma',
    lat: 41.8893,
    lng: 12.4705,
    defaultCategory: 'food'
  },
  {
    keywords: ['bocca della verit', 'bocca della verità'],
    canonicalName: 'Bocca della Verità',
    locationName: 'Piazza Bocca della Verità, Roma',
    lat: 41.8882,
    lng: 12.4815,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['roma termini', 'stazione termini'],
    canonicalName: 'Stazione Roma Termini',
    locationName: 'Piazza dei Cinquecento, Roma',
    lat: 41.9014,
    lng: 12.5015,
    defaultCategory: 'transport'
  },
  {
    keywords: ['galleria degli uffizi', 'uffizi'],
    canonicalName: 'Galleria degli Uffizi',
    locationName: 'Piazzale degli Uffizi, Firenze',
    lat: 43.7678,
    lng: 11.2553,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['ponte vecchio'],
    canonicalName: 'Ponte Vecchio',
    locationName: 'Ponte Vecchio, Firenze',
    lat: 43.768,
    lng: 11.2531,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['duomo di firenze', 'santa maria del fiore', 'cupola del brunelleschi'],
    canonicalName: 'Duomo di Firenze (Santa Maria del Fiore)',
    locationName: 'Piazza del Duomo, Firenze',
    lat: 43.7731,
    lng: 11.256,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['piazzale michelangelo'],
    canonicalName: 'Piazzale Michelangelo (Vista Panoramica)',
    locationName: 'Piazzale Michelangelo, Firenze',
    lat: 43.7629,
    lng: 11.2651,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['firenze santa maria novella', 'firenze smn'],
    canonicalName: 'Stazione Firenze Santa Maria Novella',
    locationName: 'Piazza della Stazione, Firenze',
    lat: 43.7765,
    lng: 11.2479,
    defaultCategory: 'transport'
  },
  {
    keywords: ['piazza san marco', 'basilica di san marco'],
    canonicalName: 'Piazza San Marco & Basilica',
    locationName: 'Piazza San Marco, Venezia',
    lat: 45.4342,
    lng: 12.3385,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['palazzo ducale', 'ponte dei sospiri'],
    canonicalName: 'Palazzo Ducale & Ponte dei Sospiri',
    locationName: 'San Marco, Venezia',
    lat: 45.4337,
    lng: 12.3404,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['ponte di rialto', 'rialto'],
    canonicalName: 'Ponte di Rialto',
    locationName: 'Ponte di Rialto, Venezia',
    lat: 45.438,
    lng: 12.3359,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['canal grande', 'gondola', 'giro in gondola'],
    canonicalName: 'Canal Grande & Giro in Gondola',
    locationName: 'Canal Grande, Venezia',
    lat: 45.4371,
    lng: 12.3326,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['venezia santa lucia'],
    canonicalName: 'Stazione Venezia Santa Lucia',
    locationName: 'Fondamenta Santa Lucia, Venezia',
    lat: 45.4411,
    lng: 12.321,
    defaultCategory: 'transport'
  },
  {
    keywords: ['venezia marco polo'],
    canonicalName: 'Aeroporto di Venezia Marco Polo',
    locationName: 'Tessera, Venezia',
    lat: 45.5053,
    lng: 12.3519,
    defaultCategory: 'transport'
  },
  {
    keywords: ['piazza del campo', 'palazzo pubblico'],
    canonicalName: 'Piazza del Campo & Palazzo Pubblico',
    locationName: 'Piazza del Campo, Siena',
    lat: 43.3184,
    lng: 11.3316,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['duomo di siena'],
    canonicalName: 'Duomo di Siena (Cattedrale di Santa Maria Assunta)',
    locationName: 'Piazza del Duomo, Siena',
    lat: 43.3177,
    lng: 11.3289,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['san gimignano'],
    canonicalName: 'San Gimignano & Torri Medievali',
    locationName: 'San Gimignano, Siena',
    lat: 43.4678,
    lng: 11.0433,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['pienza'],
    canonicalName: 'Pienza (Città Ideale & Degustazione Pecorino)',
    locationName: 'Pienza, Siena',
    lat: 43.0766,
    lng: 11.6789,
    defaultCategory: 'food'
  },
  {
    keywords: ['terme di saturnia', 'cascate del mulino', 'saturnia'],
    canonicalName: 'Terme di Saturnia & Cascate del Mulino',
    locationName: 'Saturnia, Manciano, Grosseto',
    lat: 42.6493,
    lng: 11.5126,
    defaultCategory: 'relax'
  },
  {
    keywords: ['montalcino'],
    canonicalName: 'Montalcino & Degustazione Brunello in Cantina',
    locationName: 'Montalcino, Siena',
    lat: 43.0573,
    lng: 11.4889,
    defaultCategory: 'food'
  },
  {
    keywords: ['lago di braies', 'braies'],
    canonicalName: 'Lago di Braies (Giro ad Anello & Barca in Legno)',
    locationName: 'Lago di Braies, Bolzano',
    lat: 46.6946,
    lng: 12.0854,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['tre cime di lavaredo', 'tre cime', 'rifugio auronzo', 'rifugio locatelli'],
    canonicalName: 'Tre Cime di Lavaredo (Rifugio Auronzo - Rifugio Locatelli)',
    locationName: 'Tre Cime di Lavaredo, Belluno/Bolzano',
    lat: 46.6187,
    lng: 12.3028,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['seceda'],
    canonicalName: 'Seceda (Cabinovia & Creste delle Odle)',
    locationName: 'Seceda, Ortisei, Val Gardena',
    lat: 46.5985,
    lng: 11.7247,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['alpe di siusi'],
    canonicalName: 'Alpe di Siusi (Altopiano Panoramico)',
    locationName: 'Alpe di Siusi, Bolzano',
    lat: 46.5414,
    lng: 11.6192,
    defaultCategory: 'relax'
  },
  {
    keywords: ['lago di carezza', 'carezza'],
    canonicalName: 'Lago di Carezza & Riflesso del Latemar',
    locationName: 'Nova Levante, Bolzano',
    lat: 46.4093,
    lng: 11.5751,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['duomo di milano'],
    canonicalName: 'Duomo di Milano & Terrazze',
    locationName: 'Piazza del Duomo, Milano',
    lat: 45.4642,
    lng: 9.1919,
    defaultCategory: 'sightseeing'
  },

  // =========================================================================
  // ISLANDA
  // =========================================================================
  {
    keywords: ['blue lagoon'],
    canonicalName: 'Blue Lagoon Geothermal Spa',
    locationName: 'Grindavík, Reykjanes Peninsula',
    lat: 63.8804,
    lng: -22.4495,
    defaultCategory: 'relax'
  },
  {
    keywords: ['thingvellir', 'þingvellir', "circolo d'oro", 'golden circle'],
    canonicalName: 'Parco Nazionale di Thingvellir (Circolo d’Oro)',
    locationName: 'Thingvellir National Park, Islanda',
    lat: 64.2559,
    lng: -21.1299,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['geysir', 'strokkur'],
    canonicalName: 'Area Geotermale di Geysir & Strokkur',
    locationName: 'Haukadalur, Golden Circle',
    lat: 64.3104,
    lng: -20.3024,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['gullfoss', 'cascata gullfoss'],
    canonicalName: 'Cascata Gullfoss',
    locationName: 'Gullfoss, Golden Circle',
    lat: 64.3271,
    lng: -20.1199,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['seljalandsfoss', 'cascata seljalandsfoss'],
    canonicalName: 'Cascata Seljalandsfoss (Sentiero Dietro il Salto)',
    locationName: 'South Coast, Islanda',
    lat: 63.6156,
    lng: -19.9886,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['skogafoss', 'cascata skogafoss', 'skógafoss'],
    canonicalName: 'Cascata Skógafoss',
    locationName: 'Skógar, South Coast, Islanda',
    lat: 63.5321,
    lng: -19.5113,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['reynisfjara', 'spiaggia nera'],
    canonicalName: 'Spiaggia Nera di Reynisfjara & Colonne di Basalto',
    locationName: 'Vík í Mýrdal, Islanda',
    lat: 63.4044,
    lng: -19.0494,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['jokulsarlon', 'jökulsárlón', 'laguna glaciale'],
    canonicalName: 'Laguna Glaciale di Jökulsárlón',
    locationName: 'Vatnajökull National Park, Islanda',
    lat: 64.0784,
    lng: -16.2306,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['diamond beach'],
    canonicalName: 'Diamond Beach (Spiaggia degli Iceberg)',
    locationName: 'Breiðamerkursandur, Islanda',
    lat: 64.0448,
    lng: -16.1778,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['hallgrimskirkja', 'chiesa hallgrimskirkja'],
    canonicalName: 'Chiesa Hallgrímskirkja',
    locationName: 'Reykjavik, Islanda',
    lat: 64.1417,
    lng: -21.9266,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['keflavik', 'aeroporto di keflavik'],
    canonicalName: 'Aeroporto Internazionale di Keflavík (KEF)',
    locationName: 'Keflavík, Islanda',
    lat: 63.985,
    lng: -22.6056,
    defaultCategory: 'transport'
  },

  // =========================================================================
  // STATI UNITI: New York, California, Parchi, Las Vegas
  // =========================================================================
  {
    keywords: ['times square'],
    canonicalName: 'Times Square & Broadway',
    locationName: 'Manhattan, New York',
    lat: 40.758,
    lng: -73.9855,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['statua della libert', 'statua della libertà', 'ellis island'],
    canonicalName: 'Statua della Libertà ed Ellis Island',
    locationName: 'New York Harbor, New York',
    lat: 40.6892,
    lng: -74.0445,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['central park'],
    canonicalName: 'Central Park',
    locationName: 'Manhattan, New York',
    lat: 40.7851,
    lng: -73.9683,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['empire state', 'empire state building'],
    canonicalName: 'Empire State Building (Osservatorio Panoramico)',
    locationName: '350 5th Ave, New York',
    lat: 40.7484,
    lng: -73.9857,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['high line', 'chelsea market'],
    canonicalName: 'The High Line & Chelsea Market',
    locationName: 'Meatpacking District, New York',
    lat: 40.748,
    lng: -74.0048,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['ponte di brooklyn', 'dumbo'],
    canonicalName: 'Ponte di Brooklyn & DUMBO',
    locationName: 'Brooklyn Bridge, New York',
    lat: 40.7061,
    lng: -73.9969,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['broadway'],
    canonicalName: 'Teatro di Broadway (Musical)',
    locationName: 'Theater District, New York',
    lat: 40.759,
    lng: -73.9845,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['rockefeller', 'top of the rock'],
    canonicalName: 'Rockefeller Center & Top of the Rock',
    locationName: 'Rockefeller Plaza, New York',
    lat: 40.7587,
    lng: -73.9787,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['metropolitan museum', 'met'],
    canonicalName: 'The Metropolitan Museum of Art (Met)',
    locationName: '1000 5th Ave, New York',
    lat: 40.7794,
    lng: -73.9632,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['wall street', '11 settembre', 'ground zero'],
    canonicalName: 'Wall Street & Memoriale 11 Settembre (Ground Zero)',
    locationName: 'Financial District, New York',
    lat: 40.7115,
    lng: -74.0134,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['golden gate', 'golden gate bridge'],
    canonicalName: 'Golden Gate Bridge',
    locationName: 'San Francisco, California',
    lat: 37.8199,
    lng: -122.4783,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['alcatraz'],
    canonicalName: 'Isola di Alcatraz (Ex-Carcere Federale)',
    locationName: 'San Francisco Bay, California',
    lat: 37.8267,
    lng: -122.423,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ["fisherman's wharf", 'cable car', 'fishermans wharf'],
    canonicalName: "Fisherman's Wharf & Cable Car",
    locationName: 'San Francisco, California',
    lat: 37.808,
    lng: -122.4177,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['yosemite', 'parco nazionale di yosemite', 'el capitan'],
    canonicalName: 'Parco Nazionale di Yosemite (El Capitan & Cascate)',
    locationName: 'Yosemite National Park, California',
    lat: 37.8651,
    lng: -119.5383,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['death valley', 'valle della morte'],
    canonicalName: 'Parco Nazionale della Death Valley',
    locationName: 'Death Valley, California',
    lat: 36.5323,
    lng: -116.9325,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['las vegas', 'bellagio', 'strip'],
    canonicalName: 'Las Vegas Strip & Fontane del Bellagio',
    locationName: 'Las Vegas Boulevard, Nevada',
    lat: 36.1126,
    lng: -115.1767,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['grand canyon', 'grand canyon south rim'],
    canonicalName: 'Parco Nazionale del Grand Canyon (South Rim)',
    locationName: 'Grand Canyon Village, Arizona',
    lat: 36.0544,
    lng: -112.1401,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['santa monica', 'santa monica pier'],
    canonicalName: 'Santa Monica Pier & Spiaggia',
    locationName: 'Santa Monica, California',
    lat: 34.0099,
    lng: -118.4965,
    defaultCategory: 'sightseeing'
  },

  // =========================================================================
  // FRANCIA: Parigi & Loira
  // =========================================================================
  {
    keywords: ['tour eiffel', 'torre eiffel'],
    canonicalName: 'Tour Eiffel',
    locationName: 'Champ de Mars, Parigi',
    lat: 48.8584,
    lng: 2.2945,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['louvre', 'museo del louvre'],
    canonicalName: 'Museo del Louvre & Piramide di Vetro',
    locationName: 'Rue de Rivoli, Parigi',
    lat: 48.8606,
    lng: 2.3376,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['montmartre', 'sacro cuore', 'sacré-cœur', 'sacre coeur'],
    canonicalName: 'Montmartre & Basilica del Sacré-Cœur',
    locationName: 'Montmartre, Parigi',
    lat: 48.8867,
    lng: 2.3431,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['notre-dame', 'notre dame'],
    canonicalName: 'Cattedrale di Notre-Dame de Paris',
    locationName: 'Île de la Cité, Parigi',
    lat: 48.853,
    lng: 2.3499,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['senna', 'crociera sulla senna', 'bateaux-mouches'],
    canonicalName: 'Crociera sui Bateaux-Mouches lungo la Senna',
    locationName: 'Senna, Parigi',
    lat: 48.8617,
    lng: 2.3082,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['reggia di versailles', 'versailles'],
    canonicalName: 'Reggia di Versailles & Giardini',
    locationName: 'Versailles, Île-de-France',
    lat: 48.8049,
    lng: 2.1204,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['castello di chambord', 'chambord'],
    canonicalName: 'Castello di Chambord (Valle della Loira)',
    locationName: 'Chambord, Francia',
    lat: 47.6161,
    lng: 1.5172,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['castello di chenonceau', 'chenonceau'],
    canonicalName: 'Castello di Chenonceau (Il Castello sul Fiume Cher)',
    locationName: 'Chenonceaux, Francia',
    lat: 47.3249,
    lng: 1.0703,
    defaultCategory: 'sightseeing'
  },

  // =========================================================================
  // SPAGNA: Andalusia & Barcellona
  // =========================================================================
  {
    keywords: ['sagrada familia', 'sagrada família'],
    canonicalName: 'Basilica della Sagrada Família',
    locationName: 'Barcellona, Catalogna',
    lat: 41.4036,
    lng: 2.1744,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['park güell', 'park guell'],
    canonicalName: 'Park Güell',
    locationName: 'Barcellona, Catalogna',
    lat: 41.4145,
    lng: 2.1527,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['alhambra', 'generalife', 'palacios nazaríes'],
    canonicalName: "L'Alhambra, Palacios Nazaríes & Generalife",
    locationName: 'Granada, Andalusia',
    lat: 37.1761,
    lng: -3.5881,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['real alcázar', 'real alcazar', 'alcázar', 'alcazar'],
    canonicalName: 'Real Alcázar di Siviglia',
    locationName: 'Patio de Banderas, Siviglia',
    lat: 37.3838,
    lng: -5.9912,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['plaza de españa', 'plaza de espana'],
    canonicalName: 'Plaza de España & Parco Maria Luisa',
    locationName: 'Siviglia, Andalusia',
    lat: 37.3772,
    lng: -5.9869,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['cattedrale di siviglia', 'giralda'],
    canonicalName: 'Cattedrale di Siviglia & Torre della Giralda',
    locationName: 'Siviglia, Andalusia',
    lat: 37.3858,
    lng: -5.9931,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['mezquita', 'mezquita di cordoba'],
    canonicalName: 'La Mezquita-Cattedrale di Cordova',
    locationName: 'Cordoba, Andalusia',
    lat: 37.8789,
    lng: -4.7794,
    defaultCategory: 'sightseeing'
  },

  // =========================================================================
  // REGNO UNITO & SCOZIA
  // =========================================================================
  {
    keywords: ['big ben', 'westminster', 'abbazia di westminster'],
    canonicalName: 'Big Ben & Abbazia di Westminster',
    locationName: 'Westminster, Londra',
    lat: 51.5007,
    lng: -0.1246,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['british museum'],
    canonicalName: 'British Museum',
    locationName: 'Great Russell St, Londra',
    lat: 51.5194,
    lng: -0.127,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['tower bridge'],
    canonicalName: 'Tower Bridge',
    locationName: 'Tower Bridge Rd, Londra',
    lat: 51.5055,
    lng: -0.0754,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['london eye'],
    canonicalName: 'London Eye (Ruota Panoramica)',
    locationName: 'South Bank, Londra',
    lat: 51.5033,
    lng: -0.1195,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['castello di edimburgo'],
    canonicalName: 'Castello di Edimburgo',
    locationName: 'Castlehill, Edimburgo',
    lat: 55.9486,
    lng: -3.1999,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['royal mile'],
    canonicalName: 'Royal Mile',
    locationName: 'Old Town, Edimburgo',
    lat: 55.9505,
    lng: -3.1878,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['loch ness', 'urquhart'],
    canonicalName: 'Lago di Loch Ness & Castello di Urquhart',
    locationName: 'Loch Ness, Highlands Scozzesi',
    lat: 57.3241,
    lng: -4.4423,
    defaultCategory: 'sightseeing'
  },

  // =========================================================================
  // THAILANDIA
  // =========================================================================
  {
    keywords: ['wat arun'],
    canonicalName: "Tempio dell'Alba (Wat Arun)",
    locationName: 'Bangkok Yai, Bangkok',
    lat: 13.7437,
    lng: 100.4888,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['palazzo reale', 'gran palazzo reale', 'wat phra kaew'],
    canonicalName: 'Gran Palazzo Reale & Wat Phra Kaew (Buddha di Smeraldo)',
    locationName: 'Phra Nakhon, Bangkok',
    lat: 13.75,
    lng: 100.4913,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['wat pho'],
    canonicalName: 'Wat Pho (Tempio del Buddha Sdraiato)',
    locationName: 'Phra Nakhon, Bangkok',
    lat: 13.7466,
    lng: 100.4933,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['doi suthep', 'wat phra that doi suthep'],
    canonicalName: 'Wat Phra That Doi Suthep',
    locationName: 'Chiang Mai, Thailandia',
    lat: 18.8048,
    lng: 98.9216,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['phi phi', 'maya bay'],
    canonicalName: 'Isole Phi Phi & Maya Bay',
    locationName: 'Mare delle Andamane, Krabi',
    lat: 7.7407,
    lng: 98.7784,
    defaultCategory: 'sightseeing'
  },

  // =========================================================================
  // GRECIA
  // =========================================================================
  {
    keywords: ['acropoli di atene', 'acropoli'],
    canonicalName: 'Acropoli di Atene',
    locationName: 'Atene, Grecia',
    lat: 37.9715,
    lng: 23.7257,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['partenone'],
    canonicalName: 'Il Partenone',
    locationName: 'Acropoli, Atene',
    lat: 37.9715,
    lng: 23.7266,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['plaka'],
    canonicalName: 'Quartiere Storico di Plaka',
    locationName: 'Plaka, Atene',
    lat: 37.973,
    lng: 23.7297,
    defaultCategory: 'food'
  },
  {
    keywords: ['oia'],
    canonicalName: 'Villaggio di Oia (Tramonto Panoramico sulla Caldera)',
    locationName: 'Oia, Santorini',
    lat: 36.4618,
    lng: 25.3753,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['caldera', 'vulcano nea kameni'],
    canonicalName: 'Crociera nella Caldera di Santorini & Vulcano',
    locationName: 'Caldera, Santorini',
    lat: 36.405,
    lng: 25.396,
    defaultCategory: 'sightseeing'
  },

  // =========================================================================
  // NORVEGIA
  // =========================================================================
  {
    keywords: ['vigeland', 'parco vigeland'],
    canonicalName: 'Parco delle Sculture di Vigeland (Frogner Park)',
    locationName: 'Oslo, Norvegia',
    lat: 59.927,
    lng: 10.7008,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['flam', 'flåm', 'flamsbana', 'flåmsbana'],
    canonicalName: 'Ferrovia Panoramica Flåmsbana & Flåm',
    locationName: 'Flåm, Aurland, Norvegia',
    lat: 60.8608,
    lng: 7.1136,
    defaultCategory: 'transport'
  },
  {
    keywords: ['bryggen'],
    canonicalName: 'Quartiere Anseatico di Bryggen (Patrimonio UNESCO)',
    locationName: 'Bergen, Norvegia',
    lat: 60.3975,
    lng: 5.3244,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['fløyen', 'floyen', 'fløibanen'],
    canonicalName: 'Funicolare Fløibanen & Belvedere del Monte Fløyen',
    locationName: 'Bergen, Norvegia',
    lat: 60.3948,
    lng: 5.3333,
    defaultCategory: 'sightseeing'
  },

  // =========================================================================
  // PAESI BASSI: Amsterdam & Dintorni
  // =========================================================================
  {
    keywords: ['van gogh', 'museo van gogh'],
    canonicalName: 'Museo Van Gogh',
    locationName: 'Museumplein 6, Amsterdam',
    lat: 52.3584,
    lng: 4.8811,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['anne frank', 'casa di anne frank'],
    canonicalName: 'Casa di Anne Frank',
    locationName: 'Prinsengracht 263-267, Amsterdam',
    lat: 52.3752,
    lng: 4.884,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['keukenhof', 'parco dei tulipani'],
    canonicalName: 'Parco dei Tulipani di Keukenhof',
    locationName: 'Lisse, Paesi Bassi',
    lat: 52.2703,
    lng: 4.5463,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['zaanse schans', 'mulini di zaanse schans'],
    canonicalName: 'Mulini a Vento Storici di Zaanse Schans',
    locationName: 'Zaandam, Paesi Bassi',
    lat: 52.4729,
    lng: 4.8164,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['rijksmuseum'],
    canonicalName: 'Rijksmuseum',
    locationName: 'Museumstraat 1, Amsterdam',
    lat: 52.36,
    lng: 4.8852,
    defaultCategory: 'sightseeing'
  },

  // =========================================================================
  // GERMANIA: Berlino
  // =========================================================================
  {
    keywords: ['brandeburgo', 'porta di brandeburgo'],
    canonicalName: 'Porta di Brandeburgo',
    locationName: 'Pariser Platz, Berlino',
    lat: 52.5163,
    lng: 13.3777,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['reichstag', 'cupola del reichstag'],
    canonicalName: 'Palazzo del Reichstag & Cupola di Vetro',
    locationName: 'Platz der Republik 1, Berlino',
    lat: 52.5186,
    lng: 13.3762,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['east side gallery', 'muro di berlino'],
    canonicalName: 'East Side Gallery (Muro di Berlino Dipinto)',
    locationName: 'Mühlenstraße, Berlino',
    lat: 52.505,
    lng: 13.4397,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['alexanderplatz', 'fernsehturm'],
    canonicalName: 'Alexanderplatz & Fernsehturm (Torre della TV)',
    locationName: 'Alexanderplatz, Berlino',
    lat: 52.5219,
    lng: 13.4132,
    defaultCategory: 'sightseeing'
  },

  // =========================================================================
  // PERÙ: Cusco & Machu Picchu
  // =========================================================================
  {
    keywords: ['machu picchu'],
    canonicalName: 'Cittadella Inca di Machu Picchu',
    locationName: 'Machu Picchu, Cusco',
    lat: -13.1631,
    lng: -72.545,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['cusco', 'plaza de armas'],
    canonicalName: 'Plaza de Armas di Cusco',
    locationName: 'Cusco, Perù',
    lat: -13.5168,
    lng: -71.9788,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['ollantaytambo'],
    canonicalName: 'Fortezza Inca di Ollantaytambo (Valle Sacra)',
    locationName: 'Ollantaytambo, Urubamba',
    lat: -13.2583,
    lng: -72.2633,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['maras', 'saline di maras'],
    canonicalName: 'Saline di Maras',
    locationName: 'Maras, Valle Sacra, Cusco',
    lat: -13.3039,
    lng: -72.1558,
    defaultCategory: 'sightseeing'
  },

  // =========================================================================
  // MAROCCO: Marrakech & Deserto
  // =========================================================================
  {
    keywords: ['jemaa', 'jemaa el-fna'],
    canonicalName: 'Piazza Jemaa el-Fna',
    locationName: 'Medina di Marrakech, Marocco',
    lat: 31.6258,
    lng: -7.9891,
    defaultCategory: 'food'
  },
  {
    keywords: ['majorelle', 'jardin majorelle'],
    canonicalName: 'Jardin Majorelle & Museo Yves Saint Laurent',
    locationName: 'Rue Yves Saint Laurent, Marrakech',
    lat: 31.6416,
    lng: -8.0033,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['ait ben haddou', 'aït-ben-haddou'],
    canonicalName: 'Ksar di Ait Ben Haddou (Patrimonio UNESCO)',
    locationName: 'Ait Ben Haddou, Ouarzazate',
    lat: 31.047,
    lng: -7.1319,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['merzouga', 'erg chebbi', 'deserto di merzouga'],
    canonicalName: 'Dune di Erg Chebbi & Notte nel Deserto di Merzouga',
    locationName: 'Merzouga, Sahara',
    lat: 31.0993,
    lng: -4.0119,
    defaultCategory: 'relax'
  },

  // =========================================================================
  // AUSTRALIA: Sydney & Barriera Corallina
  // =========================================================================
  {
    keywords: ['opera house', 'sydney opera house'],
    canonicalName: 'Sydney Opera House',
    locationName: 'Bennelong Point, Sydney',
    lat: -33.8568,
    lng: 151.2153,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['harbour bridge', 'sydney harbour bridge'],
    canonicalName: 'Sydney Harbour Bridge',
    locationName: 'Sydney Harbour, Sydney',
    lat: -33.8523,
    lng: 151.2108,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['bondi', 'bondi beach'],
    canonicalName: 'Bondi Beach & Coastal Walk',
    locationName: 'Bondi Beach, Sydney',
    lat: -33.8915,
    lng: 151.2767,
    defaultCategory: 'relax'
  },
  {
    keywords: ['barriera corallina', 'grande barriera corallina', 'great barrier reef'],
    canonicalName: 'Grande Barriera Corallina (Snorkeling & Diving)',
    locationName: 'Great Barrier Reef, Cairns',
    lat: -16.85,
    lng: 146.2,
    defaultCategory: 'sightseeing'
  },

  // =========================================================================
  // PORTOGALLO: Lisbona, Sintra & Porto
  // =========================================================================
  {
    keywords: ['torre di bel', 'torre di belém', 'torre de belém'],
    canonicalName: 'Torre di Belém',
    locationName: 'Belém, Lisbona',
    lat: 38.6916,
    lng: -9.216,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['palácio da pena', 'palacio da pena', 'pena'],
    canonicalName: 'Palácio Nacional da Pena',
    locationName: 'Sintra, Portogallo',
    lat: 38.7876,
    lng: -9.3906,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['ribeira', 'quartiere ribeira'],
    canonicalName: 'Quartiere Storico di Ribeira & Fiume Douro',
    locationName: 'Ribeira, Porto',
    lat: 41.1408,
    lng: -8.6133,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['libreria lello', 'livraria lello', 'lello'],
    canonicalName: 'Livraria Lello',
    locationName: 'Rua das Carmelitas 144, Porto',
    lat: 41.1468,
    lng: -8.6148,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['gaia', 'cantine di vino', 'vila nova de gaia', 'cantine storiche'],
    canonicalName: 'Cantine Storiche del Vino di Porto (Vila Nova de Gaia)',
    locationName: 'Vila Nova de Gaia, Porto',
    lat: 41.1375,
    lng: -8.6142,
    defaultCategory: 'food'
  },
  {
    keywords: ['são jorge', 'sao jorge', 'castello di são jorge', 'castello di sao jorge'],
    canonicalName: 'Castello di São Jorge & Miradouro',
    locationName: 'Castelo de São Jorge, Lisbona',
    lat: 38.7139,
    lng: -9.1334,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['jeronimos', 'jerónimos', 'monastero dos jerónimos', 'monastero di jeronimos'],
    canonicalName: 'Monastero dos Jerónimos',
    locationName: 'Praça do Império, Belém, Lisbona',
    lat: 38.6979,
    lng: -9.2067,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['pastéis de belém', 'pasteis de belem', 'pasteis de nata', 'pastéis de nata'],
    canonicalName: 'Antiga Confeitaria de Belém (Pastéis de Nata)',
    locationName: 'Rua de Belém 84-92, Lisbona',
    lat: 38.6975,
    lng: -9.2032,
    defaultCategory: 'food'
  },
  {
    keywords: ['quinta da regaleira', 'regaleira', 'pozzo iniziatico'],
    canonicalName: 'Quinta da Regaleira & Pozzo Iniziatico',
    locationName: 'Sintra, Portogallo',
    lat: 38.7963,
    lng: -9.396,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['dom luís', 'dom luis', 'ponte dom luis', 'ponte dom luís', 'ponte luís i'],
    canonicalName: 'Ponte Dom Luís I (Fiume Douro)',
    locationName: 'Ponte Luís I, Porto',
    lat: 41.14,
    lng: -8.6095,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['clérigos', 'clerigos', 'torre dos clérigos', 'torre dei clerici'],
    canonicalName: 'Torre dos Clérigos',
    locationName: 'Rua de São Filipe de Nery, Porto',
    lat: 41.1458,
    lng: -8.6144,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['tram 28', 'alfama', 'quartiere alfama'],
    canonicalName: 'Tram 28 & Quartiere Storico di Alfama',
    locationName: 'Alfama, Lisbona',
    lat: 38.7118,
    lng: -9.1299,
    defaultCategory: 'sightseeing'
  },

  // PERÙ
  {
    keywords: ['qorikancha', 'coricancha', 'tempio solare', 'tempio del sole'],
    canonicalName: 'Qorikancha (Tempio del Sole Inca)',
    locationName: 'Santo Domingo, Cusco',
    lat: -13.5181,
    lng: -71.9753,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['pisac', 'mercato di pisac', 'mercato artigianale di pisac'],
    canonicalName: 'Mercato Artigianale & Rovine di Pisac',
    locationName: 'Valle Sacra degli Incas, Pisac',
    lat: -13.4228,
    lng: -71.8486,
    defaultCategory: 'shopping'
  },
  {
    keywords: ['moray', 'terrazze di moray', 'terrazze circolari'],
    canonicalName: 'Terrazze Circolari di Moray',
    locationName: 'Maras, Valle Sacra, Cusco',
    lat: -13.3298,
    lng: -72.1969,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['aguas calientes', 'machu picchu pueblo', 'perurail'],
    canonicalName: 'Aguas Calientes (Machu Picchu Pueblo)',
    locationName: 'Aguas Calientes, Cusco',
    lat: -13.1547,
    lng: -72.5254,
    defaultCategory: 'transport'
  },

  // PAESI BASSI / AMSTERDAM
  {
    keywords: ['bloemenmarkt', 'mercato dei fiori', 'fiori di amsterdam'],
    canonicalName: 'Bloemenmarkt (Mercato Galleggiante dei Fiori)',
    locationName: 'Singel, Amsterdam',
    lat: 52.3668,
    lng: 4.8913,
    defaultCategory: 'shopping'
  },
  {
    keywords: ['jordaan', 'quartiere jordaan'],
    canonicalName: 'Passeggiata nel Quartiere Jordaan',
    locationName: 'Jordaan, Amsterdam',
    lat: 52.3752,
    lng: 4.8814,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['crociera sui canali', 'canali di amsterdam', 'giro in battello', 'grachten'],
    canonicalName: 'Crociera Panoramica sui Canali di Amsterdam',
    locationName: 'Canali di Amsterdam, Amsterdam',
    lat: 52.3765,
    lng: 4.898,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['noleggio bici', 'bici ad amsterdam', 'bike rental'],
    canonicalName: 'Noleggio Biciclette & Giro in Città',
    locationName: 'Centraal Station, Amsterdam',
    lat: 52.378,
    lng: 4.9,
    defaultCategory: 'relax'
  },

  // AUSTRALIA
  {
    keywords: ['daintree', 'cape tribulation', 'foresta pluviale'],
    canonicalName: 'Foresta Pluviale di Daintree & Cape Tribulation',
    locationName: 'Daintree National Park, Queensland',
    lat: -16.0833,
    lng: 145.45,
    defaultCategory: 'sightseeing'
  },

  // MAROCCO
  {
    keywords: ['palazzo bahia', 'palais bahia'],
    canonicalName: 'Palazzo Bahia',
    locationName: 'Medina, Marrakech',
    lat: 31.6217,
    lng: -7.9825,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['tombe saadiane', 'saadian tombs'],
    canonicalName: 'Tombe Saadiane',
    locationName: 'Kasbah, Marrakech',
    lat: 31.6175,
    lng: -7.989,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['gole del dades', 'dades', 'valle del dades'],
    canonicalName: 'Gole del Dades',
    locationName: 'Valle del Dades, Tinghir',
    lat: 31.5894,
    lng: -5.9922,
    defaultCategory: 'sightseeing'
  }
];
