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
    keywords: ['tsukiji', 'mercato di tsukiji', 'mercato del pesce di tokyo', 'tsukiji fish market'],
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
  {
    keywords: ['castello di matsumoto', 'matsumoto castle', 'corvo nero', 'castello corvo nero'],
    canonicalName: 'Castello di Matsumoto (il Corvo Nero)',
    locationName: 'Marunouchi 4-1, Matsumoto, Nagano',
    lat: 36.2388,
    lng: 137.9691,
    defaultCategory: 'sightseeing',
    defaultTime: '11:00'
  },
  {
    keywords: ['miyagawa', 'mercati mattutini di takayama', 'miyagawa morning market', 'sanmachi suji', 'sanmachi'],
    canonicalName: 'Mercato Mattutino Miyagawa & Sanmachi Suji',
    locationName: 'Shimosannomachi, Takayama, Gifu',
    lat: 36.1439,
    lng: 137.2588,
    defaultCategory: 'sightseeing',
    defaultTime: '09:00'
  },
  {
    keywords: ['hida no sato', 'villaggio museo hida', 'hida folk village'],
    canonicalName: 'Villaggio Museo Hida no Sato (Folk Village)',
    locationName: 'Kamiokamotomachi 1-590, Takayama',
    lat: 36.1328,
    lng: 137.2346,
    defaultCategory: 'sightseeing',
    defaultTime: '14:30'
  },
  {
    keywords: ['takayama matsuri yatai kaikan', 'museo dei carri'],
    canonicalName: 'Museo dei Carri Storici (Takayama Matsuri Yatai Kaikan)',
    locationName: 'Sakuramachi 178, Takayama',
    lat: 36.1478,
    lng: 137.2608,
    defaultCategory: 'sightseeing',
    defaultTime: '15:30'
  },
  {
    keywords: ['shirakawa-go', 'shirakawago', 'ogimachi', 'gassho-zukuri', 'case gassho-zukuri'],
    canonicalName: 'Villaggio Gassho-zukuri di Ogimachi (Shirakawa-go)',
    locationName: 'Ogimachi, Shirakawa-mura, Gifu',
    lat: 36.2577,
    lng: 136.9064,
    defaultCategory: 'sightseeing',
    defaultTime: '10:30'
  },
  {
    keywords: ['shiroyama', 'belvedere di shiroyama', 'punto panoramico shiroyama'],
    canonicalName: 'Belvedere Panoramico Shiroyama (Shirakawa-go)',
    locationName: 'Ogimachi, Shirakawa-mura, Gifu',
    lat: 36.2625,
    lng: 136.9082,
    defaultCategory: 'sightseeing',
    defaultTime: '13:30'
  },
  {
    keywords: ['kenroku-en', 'kenrokuen', 'giardino kenroku-en', 'seisonkaku', 'villa seisonkaku'],
    canonicalName: 'Giardino Kenroku-en & Villa Seisonkaku',
    locationName: 'Kenrokumachi 1, Kanazawa, Ishikawa',
    lat: 36.5621,
    lng: 136.6625,
    defaultCategory: 'sightseeing',
    defaultTime: '09:00'
  },
  {
    keywords: ['nagamachi', 'casa nomura', 'quartiere dei samurai', 'quartiere dei samurai di nagamachi'],
    canonicalName: 'Quartiere dei Samurai di Nagamachi (Residenza Nomura)',
    locationName: 'Nagamachi, Kanazawa, Ishikawa',
    lat: 36.5638,
    lng: 136.6506,
    defaultCategory: 'sightseeing',
    defaultTime: '13:30'
  },
  {
    keywords: ['higashi chaya', 'distretto delle geishe higashi chaya', 'higashi chaya district'],
    canonicalName: 'Distretto delle Geishe Higashi Chaya (Tè Matcha & Foglia d’Oro)',
    locationName: 'Higashiyama, Kanazawa, Ishikawa',
    lat: 36.5724,
    lng: 136.6668,
    defaultCategory: 'sightseeing',
    defaultTime: '15:30'
  },
  {
    keywords: ['omicho', 'mercato omicho', 'omicho market'],
    canonicalName: 'Mercato Storico Omicho (Sashimi & Street Food)',
    locationName: 'Kamiomicho 50, Kanazawa',
    lat: 36.5714,
    lng: 136.6565,
    defaultCategory: 'food',
    defaultTime: '12:00'
  },
  {
    keywords: ['museo xxi secolo', "museo d'arte contemporanea del xxi secolo", 'piscina di leandro erlich', '21st century museum'],
    canonicalName: 'Museo d’Arte Contemporanea del XXI Secolo',
    locationName: 'Hirosaka 1-2-1, Kanazawa',
    lat: 36.5609,
    lng: 136.6582,
    defaultCategory: 'sightseeing',
    defaultTime: '14:30'
  },
  {
    keywords: ['haneda', 'aeroporto di tokyo haneda', 'tokyo haneda'],
    canonicalName: 'Aeroporto di Tokyo Haneda (HND)',
    locationName: 'Ota City, Tokyo',
    lat: 35.5494,
    lng: 139.7798,
    defaultCategory: 'transport'
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
  {
    keywords: ['catania fontanarossa', 'aeroporto di catania', 'fontanarossa'],
    canonicalName: 'Aeroporto di Catania Fontanarossa (CTA)',
    locationName: 'Via Fontanarossa, Catania',
    lat: 37.4668,
    lng: 15.0664,
    defaultCategory: 'transport'
  },
  {
    keywords: ['piazza del duomo a catania', 'piazza del duomo di catania', 'duomo di catania', 'cattedrale di sant\'agata', 'cattedrale di sant agata'],
    canonicalName: 'Piazza del Duomo & Cattedrale di Sant’Agata',
    locationName: 'Piazza del Duomo, Catania',
    lat: 37.5025,
    lng: 15.0871,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['savia', 'pasticceria savia', 'arancino da savia'],
    canonicalName: 'Pasticceria Savia (Arancini & Pasticceria Catanese)',
    locationName: 'Via Etnea 300, Catania',
    lat: 37.5098,
    lng: 15.0863,
    defaultCategory: 'food',
    defaultTime: '13:00',
    notes: 'Arancini tradizionali e pasticceria tipica dal 1897.'
  },
  {
    keywords: ['pescheria', 'pescheria di catania', 'mercato del pesce', 'mercato del pesce di catania'],
    canonicalName: 'Storico Mercato del Pesce di Catania (Pescheria)',
    locationName: 'Piazza Alonzo di Benedetto, Catania',
    lat: 37.5019,
    lng: 15.0863,
    defaultCategory: 'food',
    defaultTime: '11:00',
    notes: 'Folcloristico mercato storico del pesce sotto le mura cinquecentesche.'
  },
  {
    keywords: ['etna', 'crateri silvestri', 'rifugio sapienza', 'monte etna'],
    canonicalName: 'Parco dell’Etna & Crateri Silvestri',
    locationName: 'Piazzale Rifugio Sapienza, Nicolosi (CT)',
    lat: 37.7003,
    lng: 15.0006,
    defaultCategory: 'sightseeing',
    defaultTime: '09:00',
    notes: 'Escursione tra i paesaggi vulcanici e sentieri panoramici.'
  },
  {
    keywords: ['teatro antico', 'teatro greco di taormina', 'teatro antico di taormina', 'teatro di taormina'],
    canonicalName: 'Teatro Antico di Taormina',
    locationName: 'Via del Teatro Greco 1, Taormina',
    lat: 37.8524,
    lng: 15.2922,
    defaultCategory: 'sightseeing',
    defaultTime: '16:00',
    notes: 'Straordinario teatro greco-romano affacciato sulla baia di Naxos e sull’Etna.'
  },
  {
    keywords: ['ortigia', 'isola di ortigia', 'visita di ortigia'],
    canonicalName: 'Isola di Ortigia (Centro Storico di Siracusa)',
    locationName: 'Ortigia, Siracusa',
    lat: 37.0601,
    lng: 15.2936,
    defaultCategory: 'sightseeing',
    defaultTime: '11:00',
    notes: 'Vicoli barocchi sul mare, Fonte Aretusa e Piazza Duomo.'
  },
  {
    keywords: ['duomo di siracusa', 'piazza duomo di siracusa'],
    canonicalName: 'Duomo di Siracusa (Tempio di Atena)',
    locationName: 'Piazza Duomo, Ortigia, Siracusa',
    lat: 37.0596,
    lng: 15.2933,
    defaultCategory: 'sightseeing',
    defaultTime: '12:00'
  },
  {
    keywords: ['palazzo nicolaci'],
    canonicalName: 'Palazzo Nicolaci di Villadorata',
    locationName: 'Via Corrado Nicolaci, Noto',
    lat: 36.8926,
    lng: 15.0706,
    defaultCategory: 'sightseeing',
    defaultTime: '11:30'
  },
  {
    keywords: ['cattedrale di san nicolo', 'cattedrale di noto', 'duomo di noto'],
    canonicalName: 'Cattedrale di San Nicolò a Noto',
    locationName: 'Piazza Municipio, Noto',
    lat: 36.8916,
    lng: 15.0704,
    defaultCategory: 'sightseeing',
    defaultTime: '10:30'
  },
  {
    keywords: ['spiaggia di calamosche', 'calamosche'],
    canonicalName: 'Spiaggia di Calamosche (Oasi di Vendicari)',
    locationName: 'Riserva Naturale Vendicari, Noto',
    lat: 36.8242,
    lng: 15.0931,
    defaultCategory: 'relax',
    defaultTime: '15:00'
  },
  {
    keywords: ['ragusa ibla', 'borgo di ragusa ibla'],
    canonicalName: 'Ragusa Ibla (Borgo Barocco)',
    locationName: 'Ragusa Ibla, Ragusa',
    lat: 36.9269,
    lng: 14.7306,
    defaultCategory: 'sightseeing',
    defaultTime: '10:30'
  },
  {
    keywords: ['modica', 'cioccolato di modica', 'cioccolato artigianale'],
    canonicalName: 'Modica & Tradizione del Cioccolato',
    locationName: 'Corso Umberto I, Modica',
    lat: 36.8588,
    lng: 14.7629,
    defaultCategory: 'food',
    defaultTime: '16:00',
    notes: 'Degustazione del celebre cioccolato lavorato a freddo di origine azteca.'
  },
  {
    keywords: ['valle dei templi', 'valle dei templi ad agrigento', 'valle dei templi di agrigento'],
    canonicalName: 'Parco Archeologico della Valle dei Templi',
    locationName: 'Valle dei Templi, Agrigento',
    lat: 37.2903,
    lng: 13.5857,
    defaultCategory: 'sightseeing',
    defaultTime: '10:00',
    notes: 'Area archeologica ellenica patrimonio mondiale UNESCO.'
  },
  {
    keywords: ['tempio della concordia'],
    canonicalName: 'Tempio della Concordia',
    locationName: 'Valle dei Templi, Agrigento',
    lat: 37.2897,
    lng: 13.5925,
    defaultCategory: 'sightseeing',
    defaultTime: '17:30',
    notes: 'Uno dei templi dorici meglio conservati al mondo, suggestivo al tramonto.'
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
    keywords: ['harry reid', 'aeroporto di las vegas', 'las vegas harry reid'],
    canonicalName: 'Aeroporto di Las Vegas Harry Reid (LAS)',
    locationName: '5757 Wayne Newton Blvd, Las Vegas, NV',
    lat: 36.084,
    lng: -115.1537,
    defaultCategory: 'transport'
  },
  {
    keywords: ['zion', 'the narrows', 'angels landing', 'parco nazionale di zion'],
    canonicalName: 'Parco Nazionale di Zion (The Narrows & Angels Landing)',
    locationName: 'Springdale, Utah',
    lat: 37.2982,
    lng: -113.0263,
    defaultCategory: 'sightseeing',
    defaultTime: '09:00'
  },
  {
    keywords: ['bryce canyon', 'bryce', 'hoodoos', 'sunset point', 'sunrise point'],
    canonicalName: 'Parco Nazionale del Bryce Canyon (Sunrise & Sunset Point)',
    locationName: 'Bryce Canyon, Utah',
    lat: 37.6225,
    lng: -112.1661,
    defaultCategory: 'sightseeing',
    defaultTime: '10:00'
  },
  {
    keywords: ['horseshoe bend'],
    canonicalName: 'Horseshoe Bend (Affaccio sul Fiume Colorado)',
    locationName: 'Mile Marker 545, Hwy 89, Page, AZ',
    lat: 36.879,
    lng: -111.5104,
    defaultCategory: 'sightseeing',
    defaultTime: '15:30'
  },
  {
    keywords: ['antelope canyon', 'antelope canyon lower', 'antelope canyon upper'],
    canonicalName: 'Antelope Canyon Lower (Gole di Roccia Rossa)',
    locationName: 'Indn Route 222, Page, AZ',
    lat: 36.8619,
    lng: -111.3743,
    defaultCategory: 'sightseeing',
    defaultTime: '09:30'
  },
  {
    keywords: ['monument valley', 'the view', 'monoliti navajo'],
    canonicalName: 'Monument Valley Navajo Tribal Park & The View',
    locationName: 'Monument Valley, Utah/Arizona',
    lat: 36.9832,
    lng: -110.1118,
    defaultCategory: 'sightseeing',
    defaultTime: '16:00'
  },
  {
    keywords: ['grand canyon', 'grand canyon south rim', 'mather point', 'rim trail', 'elicottero sul grand canyon'],
    canonicalName: 'Parco Nazionale del Grand Canyon (South Rim & Mather Point)',
    locationName: 'Grand Canyon Village, Arizona',
    lat: 36.0544,
    lng: -112.1401,
    defaultCategory: 'sightseeing',
    defaultTime: '10:00'
  },
  {
    keywords: ['route 66', 'seligman'],
    canonicalName: 'Storica Route 66 & Seligman',
    locationName: 'Seligman, Arizona',
    lat: 35.3256,
    lng: -112.8763,
    defaultCategory: 'sightseeing',
    defaultTime: '14:00'
  },
  {
    keywords: ['las vegas strip', 'bellagio', 'strip di las vegas', 'strip'],
    canonicalName: 'Las Vegas Strip & Fontane del Bellagio',
    locationName: 'Las Vegas Boulevard, Nevada',
    lat: 36.1126,
    lng: -115.1767,
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
  // MITTELEUROPA: VIENNA, PRAGA, BUDAPEST
  // =========================================================================
  {
    keywords: ['vienna schwechat', 'aeroporto di vienna', 'schwechat'],
    canonicalName: 'Aeroporto di Vienna-Schwechat (VIE)',
    locationName: 'Flughafen Wien-Schwechat, Vienna',
    lat: 48.1103,
    lng: 16.5697,
    defaultCategory: 'transport'
  },
  {
    keywords: ['duomo di santo stefano', 'stephansdom', 'santo stefano a vienna'],
    canonicalName: 'Duomo di Santo Stefano (Stephansdom)',
    locationName: 'Stephansplatz, Vienna',
    lat: 48.2085,
    lng: 16.3738,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['demel', 'pasticceria demel', 'sacher torte', 'hotel sacher'],
    canonicalName: 'Pasticceria Demel & Tradizione Sacher',
    locationName: 'Kohlmarkt 14, Vienna',
    lat: 48.2086,
    lng: 16.3672,
    defaultCategory: 'food',
    defaultTime: '16:00'
  },
  {
    keywords: ['schonbrunn', 'schönbrunn', 'castello di schonbrunn', 'castello di schönbrunn', 'giardini di schonbrunn', 'giardini di schönbrunn'],
    canonicalName: 'Castello e Giardini di Schönbrunn',
    locationName: 'Schönbrunner Schloßstraße 47, Vienna',
    lat: 48.1848,
    lng: 16.3122,
    defaultCategory: 'sightseeing',
    defaultTime: '09:30'
  },
  {
    keywords: ['belvedere', 'palazzo del belvedere', 'museo di klimt', 'klimt al belvedere'],
    canonicalName: 'Palazzo del Belvedere & Museo di Klimt',
    locationName: 'Prinz-Eugen-Straße 27, Vienna',
    lat: 48.1915,
    lng: 16.3809,
    defaultCategory: 'sightseeing',
    defaultTime: '14:30'
  },
  {
    keywords: ['wien hauptbahnhof', 'wien hbf', 'stazione centrale di vienna'],
    canonicalName: 'Stazione Vienna Centrale (Wien Hauptbahnhof)',
    locationName: 'Am Hauptbahnhof 1, Vienna',
    lat: 48.1853,
    lng: 16.3764,
    defaultCategory: 'transport'
  },
  {
    keywords: ['praha hlavni nadrazi', 'praha hlavní nádraží', 'praha hl.n.', 'praha hl n', 'stazione centrale di praga'],
    canonicalName: 'Stazione Praga Centrale (Praha hl.n.)',
    locationName: 'Wilsonova 8, Praga',
    lat: 50.0831,
    lng: 14.4353,
    defaultCategory: 'transport'
  },
  {
    keywords: ['piazza della citta vecchia', 'orologio astronomico', 'staromestske namesti', 'orologio astronomico di praga'],
    canonicalName: 'Piazza Città Vecchia & Orologio Astronomico',
    locationName: 'Staroměstské náměstí, Praga',
    lat: 50.0875,
    lng: 14.4213,
    defaultCategory: 'sightseeing',
    defaultTime: '14:00'
  },
  {
    keywords: ['ponte carlo', 'karluv most', 'tramonto su ponte carlo'],
    canonicalName: 'Ponte Carlo (Karlův most)',
    locationName: 'Karlův most, Praga',
    lat: 50.0865,
    lng: 14.4114,
    defaultCategory: 'sightseeing',
    defaultTime: '18:00'
  },
  {
    keywords: ['castello di praga', 'prazsky hrad', 'pražský hrad', 'cattedrale di san vito', 'vicolo d oro', "vicolo d'oro"],
    canonicalName: 'Castello di Praga & Cattedrale di San Vito',
    locationName: 'Hradčany, Praga',
    lat: 50.091,
    lng: 14.4016,
    defaultCategory: 'sightseeing',
    defaultTime: '09:30'
  },
  {
    keywords: ['josefov', 'quartiere ebraico di praga', 'sinagoghe storiche'],
    canonicalName: 'Quartiere Ebraico di Josefov',
    locationName: 'Josefov, Praga',
    lat: 50.0898,
    lng: 14.4187,
    defaultCategory: 'sightseeing',
    defaultTime: '14:30'
  },
  {
    keywords: ['budapest nyugati', 'stazione budapest nyugati', 'nyugati palyaudvar'],
    canonicalName: 'Stazione Budapest Nyugati',
    locationName: 'Teréz krt. 55, Budapest',
    lat: 47.5108,
    lng: 19.0573,
    defaultCategory: 'transport'
  },
  {
    keywords: ['terme szechenyi', 'terme széchenyi', 'szechenyi baths', 'bagno termale'],
    canonicalName: 'Terme Széchenyi (Bagno Termale)',
    locationName: 'Állatkerti krt. 9-11, Budapest',
    lat: 47.5188,
    lng: 19.0824,
    defaultCategory: 'relax',
    defaultTime: '16:00'
  },
  {
    keywords: ['bastione dei pescatori', 'halaszbastya'],
    canonicalName: 'Bastione dei Pescatori (Halászbástya)',
    locationName: 'Szentháromság tér, Budapest',
    lat: 47.5022,
    lng: 19.0348,
    defaultCategory: 'sightseeing',
    defaultTime: '09:30'
  },
  {
    keywords: ['chiesa di mattia', 'matyas templom'],
    canonicalName: 'Chiesa di Mattia sulla Collina di Buda',
    locationName: 'Szentháromság tér 2, Budapest',
    lat: 47.5019,
    lng: 19.0342,
    defaultCategory: 'sightseeing',
    defaultTime: '11:00'
  },
  {
    keywords: ['parlamento di budapest', 'orszaghaz', 'palazzo del parlamento a budapest'],
    canonicalName: 'Parlamento di Budapest lungo il Danubio',
    locationName: 'Kossuth Lajos tér 1-3, Budapest',
    lat: 47.5072,
    lng: 19.0456,
    defaultCategory: 'sightseeing',
    defaultTime: '14:30'
  },
  {
    keywords: ['crociera sul danubio', 'crociera serale sul danubio', 'danubio'],
    canonicalName: 'Crociera Panoramica sul Danubio',
    locationName: 'Danubio, Budapest',
    lat: 47.498,
    lng: 19.045,
    defaultCategory: 'sightseeing',
    defaultTime: '20:00'
  },
  {
    keywords: ['mercato centrale di budapest', 'nagyvasarcsarnok', 'nagyvásárcsarnok'],
    canonicalName: 'Mercato Centrale di Budapest (Nagyvásárcsarnok)',
    locationName: 'Vámház krt. 1-3, Budapest',
    lat: 47.4871,
    lng: 19.0585,
    defaultCategory: 'food',
    defaultTime: '10:30'
  },
  {
    keywords: ['budapest liszt ferenc', 'aeroporto di budapest', 'liszt ferenc'],
    canonicalName: 'Aeroporto di Budapest Liszt Ferenc (BUD)',
    locationName: 'Budapest Liszt Ferenc International Airport',
    lat: 47.4369,
    lng: 19.2556,
    defaultCategory: 'transport'
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
    keywords: ['noleggio bici ad amsterdam', 'bici ad amsterdam', 'bike rental amsterdam'],
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
  },

  // =========================================================================
  // SCANDINAVIA (STOCCOLMA & COPENAGHEN)
  // =========================================================================
  {
    keywords: ['gamla stan', 'citta vecchia di stoccolma', 'città vecchia di stoccolma', 'stortorget'],
    canonicalName: 'Gamla Stan (Città Vecchia di Stoccolma)',
    locationName: 'Gamla Stan, Stoccolma, Svezia',
    lat: 59.3257,
    lng: 18.0711,
    defaultCategory: 'sightseeing',
    defaultTime: '09:30'
  },
  {
    keywords: ['palazzo reale di stoccolma', 'kungliga slottet', 'palazzo reale stoccolma'],
    canonicalName: 'Palazzo Reale di Stoccolma (Kungliga Slottet)',
    locationName: 'Gamla Stan, Stoccolma, Svezia',
    lat: 59.3268,
    lng: 18.0717,
    defaultCategory: 'sightseeing',
    defaultTime: '11:00'
  },
  {
    keywords: ['cafe chokladkoppen', 'café chokladkoppen', 'chokladkoppen'],
    canonicalName: 'Café Chokladkoppen (Pausa Fika & Kanelbulle)',
    locationName: 'Stortorget 18, Gamla Stan, Stoccolma',
    lat: 59.3252,
    lng: 18.0706,
    defaultCategory: 'food',
    defaultTime: '12:00'
  },
  {
    keywords: ['museo vasa', 'vasamuseet', 'vasa museum', 'galeone seicentesco', 'galeone vasa'],
    canonicalName: 'Museo Vasa (Vasamuseet)',
    locationName: 'Galärvarvsvägen 14, Djurgården, Stoccolma',
    lat: 59.328,
    lng: 18.0914,
    defaultCategory: 'sightseeing',
    defaultTime: '14:30'
  },
  {
    keywords: ['arlanda express', 'stoccolma arlanda', 'aeroporto arlanda', 'arlanda'],
    canonicalName: 'Aeroporto di Stoccolma Arlanda (ARN)',
    locationName: 'Arlanda, Sigtuna, Svezia',
    lat: 59.6498,
    lng: 17.9238,
    defaultCategory: 'transport'
  },
  {
    keywords: ['stoccolma centralen', 'stockholm centralen', 'stazione centrale di stoccolma'],
    canonicalName: 'Stazione Centrale di Stoccolma (Stockholm Centralen)',
    locationName: 'Centralplan 15, Norrmalm, Stoccolma',
    lat: 59.3308,
    lng: 18.0583,
    defaultCategory: 'transport'
  },
  {
    keywords: ['ponte di oresund', 'ponte di øresund', 'oresundsbron', 'øresundsbron'],
    canonicalName: 'Ponte di Øresund (Øresundsbron)',
    locationName: 'Ponte di Øresund, Danimarca / Svezia',
    lat: 55.5781,
    lng: 12.8315,
    defaultCategory: 'transport'
  },
  {
    keywords: ['copenaghen stazione centrale', 'kobenhavn h', 'københavn h', 'stazione centrale di copenaghen'],
    canonicalName: 'Stazione Centrale di Copenaghen (København H)',
    locationName: 'Bernstorffsgade 16, Copenaghen',
    lat: 55.6728,
    lng: 12.5647,
    defaultCategory: 'transport'
  },
  {
    keywords: ['nyhavn', 'casette colorate di nyhavn', 'porto nuovo di copenaghen'],
    canonicalName: 'Nyhavn (Porto Nuovo)',
    locationName: 'Nyhavn, Copenaghen, Danimarca',
    lat: 55.6795,
    lng: 12.591,
    defaultCategory: 'sightseeing',
    defaultTime: '15:00'
  },
  {
    keywords: ['sirenetta', 'statua della sirenetta', 'den lille havfrue'],
    canonicalName: 'Statua della Sirenetta (Den Lille Havfrue)',
    locationName: 'Langelinie, Copenaghen, Danimarca',
    lat: 55.6929,
    lng: 12.5993,
    defaultCategory: 'sightseeing',
    defaultTime: '16:30'
  },
  {
    keywords: ['palazzo di amalienborg', 'amalienborg', 'cambio della guardia ad amalienborg'],
    canonicalName: 'Palazzo di Amalienborg & Cambio della Guardia',
    locationName: 'Amalienborg Slotsplads, Copenaghen',
    lat: 55.6841,
    lng: 12.5932,
    defaultCategory: 'sightseeing',
    defaultTime: '11:45'
  },
  {
    keywords: ['christianshavn', 'quartiere di christianshavn', 'canali di christianshavn'],
    canonicalName: 'Quartiere di Christianshavn & Canali',
    locationName: 'Christianshavn, Copenaghen, Danimarca',
    lat: 55.6726,
    lng: 12.5932,
    defaultCategory: 'sightseeing',
    defaultTime: '13:30'
  },
  {
    keywords: ['giardini di tivoli', 'tivoli gardens', 'parco tivoli', 'parco divertimenti giardini di tivoli', 'tivoli'],
    canonicalName: 'Giardini di Tivoli (Tivoli Gardens)',
    locationName: 'Vesterbrogade 3, Copenaghen, Danimarca',
    lat: 55.6737,
    lng: 12.5683,
    defaultCategory: 'sightseeing',
    defaultTime: '15:30'
  },
  {
    keywords: ['castello di rosenborg', 'rosenborg slot', 'gioielli della corona', 'rosenborg'],
    canonicalName: 'Castello di Rosenborg & Gioielli della Corona',
    locationName: 'Øster Voldgade 4A, Copenaghen, Danimarca',
    lat: 55.6858,
    lng: 12.5773,
    defaultCategory: 'sightseeing',
    defaultTime: '10:00'
  },
  {
    keywords: ['copenaghen kastrup', 'aeroporto di copenaghen kastrup', 'aeroporto kastrup', 'kastrup', 'aeroporto cph'],
    canonicalName: 'Aeroporto di Copenaghen Kastrup (CPH)',
    locationName: 'Lufthavnsboulevarden 6, Kastrup, Danimarca',
    lat: 55.618,
    lng: 12.6508,
    defaultCategory: 'transport'
  },

  // =========================================================================
  // INDONESIA & BALI
  // =========================================================================
  {
    keywords: ['ngurah rai', 'aeroporto di denpasar', 'denpasar dps', 'aeroporto denpasar'],
    canonicalName: 'Aeroporto Internazionale Ngurah Rai (DPS)',
    locationName: 'Tuban, Kuta, Bali',
    lat: -8.7482,
    lng: 115.1672,
    defaultCategory: 'transport'
  },
  {
    keywords: ['mercato tradizionale di ubud', 'mercato di ubud', 'ubud market'],
    canonicalName: 'Mercato Tradizionale di Ubud (Pasar Seni Ubud)',
    locationName: 'Jl. Raya Ubud, Ubud, Gianyar, Bali',
    lat: -8.5069,
    lng: 115.2625,
    defaultCategory: 'shopping',
    defaultTime: '18:00'
  },
  {
    keywords: ['monte batur', 'batur', 'trekking all\'alba sul monte batur', 'gunung batur'],
    canonicalName: 'Trekking all’Alba sul Monte Batur & Caldera',
    locationName: 'Kintamani, Bangli Regency, Bali',
    lat: -8.2421,
    lng: 115.3753,
    defaultCategory: 'sightseeing',
    defaultTime: '04:00'
  },
  {
    keywords: ['foresta delle scimmie', 'monkey forest', 'sacred monkey forest', 'foresta delle scimmie sacre di ubud'],
    canonicalName: 'Foresta delle Scimmie Sacre di Ubud (Mandala Suci Wenara Wana)',
    locationName: 'Jl. Monkey Forest, Ubud, Gianyar, Bali',
    lat: -8.5194,
    lng: 115.2606,
    defaultCategory: 'sightseeing',
    defaultTime: '14:30'
  },
  {
    keywords: ['tegallalang', 'risaie di tegallalang', 'risaie a terrazza di tegallalang', 'terrazze di riso di tegallalang'],
    canonicalName: 'Risaie a Terrazza di Tegallalang & Altalena Panoramica',
    locationName: 'Jl. Raya Tegallalang, Gianyar, Bali',
    lat: -8.4347,
    lng: 115.2789,
    defaultCategory: 'sightseeing',
    defaultTime: '09:30'
  },
  {
    keywords: ['tanah lot', 'tempio di tanah lot', 'pura tanah lot'],
    canonicalName: 'Tempio di Tanah Lot al Tramonto',
    locationName: 'Beraban, Kediri, Tabanan, Bali',
    lat: -8.6212,
    lng: 115.0868,
    defaultCategory: 'sightseeing',
    defaultTime: '17:30'
  },
  {
    keywords: ['sanur', 'porto di sanur', 'motoscafo da sanur'],
    canonicalName: 'Porto di Sanur (Imbarco Veloce)',
    locationName: 'Sanur Kaja, Denpasar Selatan, Bali',
    lat: -8.6738,
    lng: 115.2627,
    defaultCategory: 'transport',
    defaultTime: '08:00'
  },
  {
    keywords: ['nusa penida', 'porto di nusa penida', 'toyapakeh', 'banjar nyuh'],
    canonicalName: 'Isola di Nusa Penida (Porto di Arrivo)',
    locationName: 'Nusa Penida, Klungkung Regency, Bali',
    lat: -8.7278,
    lng: 115.5444,
    defaultCategory: 'transport'
  },
  {
    keywords: ['kelingking beach', 'kelingking', 'crystal bay', 'spiaggia di kelingking'],
    canonicalName: 'Nusa Penida: Kelingking Beach & Crystal Bay',
    locationName: 'Nusa Penida, Klungkung Regency, Bali',
    lat: -8.7508,
    lng: 115.4744,
    defaultCategory: 'sightseeing',
    defaultTime: '10:30'
  },
  {
    keywords: ['seminyak', 'massaggio balinese a seminyak', 'relax a seminyak'],
    canonicalName: 'Seminyak & Massaggio Tradizionale Balinese',
    locationName: 'Seminyak, Kuta, Badung, Bali',
    lat: -8.6913,
    lng: 115.1682,
    defaultCategory: 'relax',
    defaultTime: '10:00'
  },

  // =========================================================================
  // TOSCANA: Lucca, Pisa, Volterra
  // =========================================================================
  {
    keywords: ['mura di lucca', 'passeggiata sulle mura di lucca', 'mura cinquecentesche'],
    canonicalName: 'Passeggiata sulle Mura Cinquecentesche di Lucca',
    locationName: 'Passeggiata delle Mura Urbane, Lucca',
    lat: 43.8429,
    lng: 10.5027,
    defaultCategory: 'sightseeing',
    defaultTime: '11:00'
  },
  {
    keywords: ['osteria baralla', 'baralla'],
    canonicalName: 'Osteria Baralla (Tortelli Lucchesi Tradizionali)',
    locationName: 'Via Anfiteatro 5/9, Lucca',
    lat: 43.8458,
    lng: 10.5057,
    defaultCategory: 'food',
    defaultTime: '13:00'
  },
  {
    keywords: ['torre di pisa', 'torre pendente', 'torre pendente di pisa', 'piazza dei miracoli'],
    canonicalName: 'Torre Pendente di Pisa & Piazza dei Miracoli',
    locationName: 'Piazza del Duomo, Pisa',
    lat: 43.7228,
    lng: 10.3966,
    defaultCategory: 'sightseeing',
    defaultTime: '17:30'
  },
  {
    keywords: ['museo etrusco guarnacci', 'guarnacci', 'museo guarnacci'],
    canonicalName: 'Museo Etrusco Guarnacci',
    locationName: 'Via Don Giovanni Minzoni 15, Volterra',
    lat: 43.4022,
    lng: 10.8624,
    defaultCategory: 'sightseeing',
    defaultTime: '11:00'
  },
  {
    keywords: ['gelateria dondoli', 'dondoli'],
    canonicalName: 'Gelateria Dondoli (Gelato Campione del Mondo)',
    locationName: 'Piazza della Cisterna 4, San Gimignano',
    lat: 43.4674,
    lng: 11.0433,
    defaultCategory: 'food',
    defaultTime: '16:00'
  },

  // =========================================================================
  // AUSTRALIA (SYDNEY, MELBOURNE, GREAT OCEAN ROAD)
  // =========================================================================
  {
    keywords: ['circular quay', 'porto di sydney'],
    canonicalName: 'Circular Quay & Sydney Cove',
    locationName: 'Circular Quay, Sydney NSW',
    lat: -33.8614,
    lng: 151.2108,
    defaultCategory: 'sightseeing'
  },
  {
    keywords: ['royal botanic garden', 'royal botanic garden sydney'],
    canonicalName: 'Royal Botanic Garden Sydney',
    locationName: 'Mrs Macquaries Rd, Sydney NSW',
    lat: -33.8642,
    lng: 151.2166,
    defaultCategory: 'sightseeing',
    defaultTime: '11:00'
  },
  {
    keywords: ['blue mountains', 'three sisters', 'scenic world'],
    canonicalName: 'Blue Mountains: Three Sisters & Scenic World',
    locationName: 'Echo Point Rd, Katoomba NSW',
    lat: -33.7321,
    lng: 150.3121,
    defaultCategory: 'sightseeing',
    defaultTime: '10:00'
  },
  {
    keywords: ['the rocks', 'quartiere the rocks'],
    canonicalName: 'Quartiere Storico The Rocks',
    locationName: 'The Rocks, Sydney NSW',
    lat: -33.8587,
    lng: 151.2088,
    defaultCategory: 'sightseeing',
    defaultTime: '19:30'
  },
  {
    keywords: ['mrs macquarie\'s chair', 'mrs macquaries chair', 'fuochi di capodanno'],
    canonicalName: 'Mrs Macquarie’s Chair (Punto Panoramico Baia di Sydney)',
    locationName: '1D Mrs Macquaries Rd, Sydney NSW',
    lat: -33.8598,
    lng: 151.2223,
    defaultCategory: 'sightseeing',
    defaultTime: '16:00'
  },
  {
    keywords: ['sydney kingsford smith', 'aeroporto di sydney', 'aeroporto sydney', 'syd'],
    canonicalName: 'Aeroporto Internazionale di Sydney Kingsford Smith (SYD)',
    locationName: 'Mascot, Sydney NSW',
    lat: -33.9399,
    lng: 151.1753,
    defaultCategory: 'transport'
  },
  {
    keywords: ['melbourne tullamarine', 'aeroporto di melbourne', 'aeroporto melbourne', 'mel'],
    canonicalName: 'Aeroporto di Melbourne Tullamarine (MEL)',
    locationName: 'Departure Dr, Melbourne Airport VIC',
    lat: -37.669,
    lng: 144.841,
    defaultCategory: 'transport'
  },
  {
    keywords: ['hosier lane', 'street art di melbourne', 'laneway di melbourne'],
    canonicalName: 'Hosier Lane (Street Art & Laneways di Melbourne)',
    locationName: 'Hosier Ln, Melbourne VIC',
    lat: -37.8164,
    lng: 144.9691,
    defaultCategory: 'sightseeing',
    defaultTime: '18:00'
  },
  {
    keywords: ['great ocean road', 'twelve apostles', '12 apostles', 'loch ard gorge'],
    canonicalName: 'Great Ocean Road: Twelve Apostles & Loch Ard Gorge',
    locationName: 'Great Ocean Rd, Princetown VIC',
    lat: -38.6629,
    lng: 143.1051,
    defaultCategory: 'sightseeing',
    defaultTime: '11:00'
  },
  {
    keywords: ['queen victoria market', 'mercato queen victoria'],
    canonicalName: 'Queen Victoria Market',
    locationName: 'Queen St, Melbourne VIC',
    lat: -37.8076,
    lng: 144.9568,
    defaultCategory: 'shopping',
    defaultTime: '11:30'
  },
  {
    keywords: ['national gallery of victoria', 'ngv melbourne'],
    canonicalName: 'National Gallery of Victoria (NGV)',
    locationName: '180 St Kilda Rd, Melbourne VIC',
    lat: -37.8226,
    lng: 144.9689,
    defaultCategory: 'sightseeing',
    defaultTime: '14:30'
  }
];
