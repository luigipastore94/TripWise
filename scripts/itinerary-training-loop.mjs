/**
 * TripWise Travel Generator - Evaluation & Training Loop
 * 
 * Runs a rigorous benchmark of 20 diverse, real-world travel itineraries across 5 continents,
 * different formats (Markdown, Unicode bullets, raw notes, conversational prose, date ranges),
 * and validates:
 * 1. Date Extraction & Span (startDate, endDate, dayCount)
 * 2. Country / Preset / Currency detection
 * 3. Activity Extraction & Chronological Scheduling (no collision at 10:00)
 * 4. Key Landmark Identification & Category classification (sightseeing, food, transport, lodging, relax)
 * 5. Geocoding readiness (GPS coordinates presence)
 */

import assert from 'node:assert/strict';
import { parseNaturalLanguageItinerary } from '../src/utils/naturalItineraryParser.ts';

export const BENCHMARK_CASES = [
  // 1. Japan 15 days hierarchical outline (User's original prompt)
  {
    id: 'jp-15d-hierarchical',
    name: 'Giappone 15gg: Tappe, Unicode Bullets & Note Orarie',
    region: 'Asia',
    text: `TAPPA 1: Tokyo & Kamakura (5 Notti)
●	22 Nov (Dom) – Giorno 1: Arrivo a Tokyo
○	Atterraggio alle 12:00. Trasferimento in hotel a Tokyo.
○	Sera: Akihabara (elettronica + manga).
●	23 Nov (Lun) – Giorno 2: 
○	Santuario Meiji 
○	Shinjuku Goyen (parco foliage)
○	Shinjuku (gatto 3D)
○	Shibuya (incrocio)
●	24 Nov (Mar) – Giorno 3: Gita a Kamakura
○	In giornata: Treno per Kamakura. Foliage tardivo costiero al tempio Meigetsu-in e Grande Buddha. Sera a Tokyo.
●	25 Nov (Mer) – Giorno 4: 
○	Mattina: ore 08.30 teamlab Planet
○	Statua della libertà e lungomare
○	Ginza.
○	Mercato del Pesce.
○	Rapponigi (viale luci Natale)
●	26 Nov (Gio) - Giorno 5: Tokyo Moderna & Tramonto
○	Palazzo Imperiale
○	Parco Ueno.
○	Senso-ji
○	Tokyo sky-tree
TAPPA 2: Monte Fuji / 5 Laghi (1 Notte)
●	27 Nov (Ven) – Giorno 6: Il tunnel di aceri e il Ryokan
○	Nota: Spedisci i bagagli grandi dall'hotel di Tokyo direttamente a quello di Kyoto. Viaggia solo con uno zaino.
○	Mattina: Bus o treno presto da Tokyo al Lago Kawaguchi.
○	Pomeriggio: Passeggiata nel Momiji Corridor e salita alla Pagoda Chureito per la foto simbolo con il Fuji e le foglie rosse.
○	Decidere se prenotare cena in hotel o no
TAPPA 3: Kyoto (4 Notti)
●	28 Nov (Sab) – Giorno 7: Benvenuti a Kyoto
○	Mattina: Treno dal Fuji verso Kyoto
○	Pomeriggio: quartiere storico di Gion, tra le vie Hanamikoji e Pontocho.
○	Cerimonia del tè MAIKOYA (sede Gion/Kiyomizu) 
●	29 Nov (Dom) – Giorno 8: 
○	Mattina presto (ore 06:30 - 07:00): Kiyomizu-dera. Discesa a piedi attraverso le stradine storiche di Ninenzaka e Sannenzaka.
○	Tarda Mattina: Tempio Kodai-ji e Santuario Yasaka.
○	Pomeriggio: Spostamento a nord-ovest per visitare il Padiglione d'Oro (Kinkaku-ji e il giardino zen di Ryoan-ji.
○	Sera (Light-up): Spettacolare illuminazione serale al Tempio Eikan-do.
●	30 Nov (Lun) – Giorno 9: 
○	Intera giornata ad Arashiyama: Foresta di bambù, tempio Tenryu-ji e viaggio sul treno panoramico Sagano Romantic Train.
○	Sera: Spettacolare illuminazione notturna al tempio Eikan-do.
●	01 Dic (Mar) – Giorno 10:
○	Mattina presto (07:00 - 07:30): Santuario Fushimi Inari Taisha.
○	Pomeriggio: Passeggiata lungo il Sentiero della Filosofia con visita al Padiglione d'Argento (Ginkaku-ji)
●	02 Dic (Mer) – Giorno 11: 
○	Uji
○	Nara
○	Trasferimento Hiroshima
TAPPA 4: Hiroshima (2 Notti)
●	3 Dic (Gio) – Giorno 12: 
○	Mattina: Parco della pace
○	Pomeriggio: Isola Miyajima fino al tramonto
TAPPA 5: Osaka (3 Notti)
●	4 Dic (Ven) – Giorno 13: 
○	Mattina: Castello di Himeji
○	Trasferimento Osaka
●	5 Dic (Sab) – Giorno 14: 
○	Universal Studio Osaka
●	6 Dic (Dom) – Giorno 15: 
○	Minoh Park
○	Kaiyukan
○	Castello di Osaka`,
    options: { referenceYear: 2026 },
    expected: {
      startDate: '2026-11-22',
      endDate: '2026-12-06',
      dayCount: 15,
      presetId: 'japan',
      currency: 'JPY',
      minActivities: 35,
      keyLandmarks: [
        { term: 'Meiji', requiresCoords: true },
        { term: 'teamlab', requiresCoords: true },
        { term: 'Chureito', requiresCoords: true },
        { term: 'Maikoya', expectedCategory: 'relax', requiresCoords: true },
        { term: 'Kiyomizu', requiresCoords: true },
        { term: 'Fushimi Inari', requiresCoords: true },
        { term: 'Arashiyama', requiresCoords: true },
        { term: 'Miyajima', requiresCoords: true },
        { term: 'Himeji', requiresCoords: true },
        { term: 'Universal', requiresCoords: true },
        { term: 'Kaiyukan', requiresCoords: true }
      ]
    }
  },

  // 2. Italia Classica: Roma, Firenze e Venezia con treni alta velocità
  {
    id: 'it-classic-train',
    name: 'Italia: Roma, Firenze e Venezia in Frecciarossa (7 Giorni)',
    region: 'Europa',
    text: `- 10/05: Arrivo a Roma Termini ore 11:30. Check-in alloggio.
- 10-12/05: Roma (Pomeriggio: Colosseo e Fori Imperiali, Fontana di Trevi, Pantheon; Sera: Cena a Trastevere; 11/05 ore 09:00 Musei Vaticani e Basilica di San Pietro)
- 12/05: Frecciarossa da Roma Termini a Firenze Santa Maria Novella ore 09:10
- 12-14/05: Firenze (12/05 ore 14:30 Galleria degli Uffizi e Ponte Vecchio; 13/05 Duomo di Firenze e tramonto a Piazzale Michelangelo)
- 14/05: Treno alta velocità per Venezia Santa Lucia ore 10:00
- 14-16/05: Venezia (Piazza San Marco, Palazzo Ducale, giro in gondola sul Canal Grande, Ponte di Rialto)
- 16/05: Volo di rientro da Venezia Marco Polo ore 18:45`,
    options: { referenceYear: 2026 },
    expected: {
      startDate: '2026-05-10',
      endDate: '2026-05-16',
      dayCount: 7,
      presetId: 'europe',
      currency: 'EUR',
      minActivities: 14,
      keyLandmarks: [
        { term: 'Colosseo', expectedCategory: 'sightseeing', requiresCoords: true },
        { term: 'Trevi', requiresCoords: true },
        { term: 'Vatican', requiresCoords: true },
        { term: 'Uffizi', requiresCoords: true },
        { term: 'Piazzale Michelangelo', requiresCoords: true },
        { term: 'San Marco', requiresCoords: true },
        { term: 'Rialto', requiresCoords: true }
      ]
    }
  },

  // 3. Islanda Ring Road & Circolo d'Oro
  {
    id: 'is-ring-road',
    name: "Islanda: Ring Road & Circolo d'Oro (6 Giorni)",
    region: 'Europa',
    text: `15-20 Giugno: Viaggio in Islanda
- 15/06: Atterraggio all'aeroporto di Keflavik ore 13:40. Ritiro auto a noleggio 4x4. Bagno rigenerante alla Blue Lagoon. Notte a Reykjavik.
- 16/06: Circolo d'Oro: Parco Nazionale di Thingvellir, Geysir e la potente cascata Gullfoss.
- 17/06: Costa Sud: cascata Seljalandsfoss, cascata Skogafoss e spiaggia nera di Reynisfjara. Notte a Vik.
- 18/06: Laguna glaciale di Jokulsarlon e Diamond Beach tra gli iceberg.
- 19/06: Rientro verso ovest, passeggiata a Reykjavik tra via Laugavegur e chiesa Hallgrimskirkja. Cena a base di salmone e zuppa di pesce.
- 20/06: Riconsegna auto a Keflavik e volo di rientro ore 15:30.`,
    options: { referenceYear: 2026 },
    expected: {
      startDate: '2026-06-15',
      endDate: '2026-06-20',
      dayCount: 6,
      currency: 'ISK',
      minActivities: 12,
      keyLandmarks: [
        { term: 'Blue Lagoon', expectedCategory: 'relax', requiresCoords: true },
        { term: 'Gullfoss', requiresCoords: true },
        { term: 'Geysir', requiresCoords: true },
        { term: 'Skogafoss', requiresCoords: true },
        { term: 'Reynisfjara', requiresCoords: true },
        { term: 'Jokulsarlon', requiresCoords: true },
        { term: 'Hallgrimskirkja', requiresCoords: true }
      ]
    }
  },

  // 4. USA West Coast Road Trip
  {
    id: 'us-west-coast',
    name: 'USA: California, Parchi e Las Vegas (8 Giorni)',
    region: 'Americhe',
    text: `01/09 - 08/09: USA West Coast Tour
- 01/09: Volo e arrivo a San Francisco ore 14:20. Ritiro auto. Tramonto al Golden Gate Bridge.
- 02/09: San Francisco: Fisherman's Wharf, Cable Car e traghetto per Alcatraz ore 10:30.
- 03/09: Partenza presto per il Parco Nazionale di Yosemite (cascate e El Capitan). Notte nei dintorni.
- 04/09: Attraversamento del passo Tioga e Death Valley verso Las Vegas.
- 05/09: Giornata a Las Vegas: passeggiata lungo la Strip, fontane del Bellagio e spettacoli serali.
- 06/09: Spostamento verso il Grand Canyon South Rim. Tramonto panoramico sul canyon.
- 07/09: Alba al Grand Canyon, poi viaggio verso Los Angeles.
- 08/09: Santa Monica Pier e volo di rientro da Los Angeles LAX ore 19:45.`,
    options: { referenceYear: 2026 },
    expected: {
      startDate: '2026-09-01',
      endDate: '2026-09-08',
      dayCount: 8,
      presetId: 'usa',
      currency: 'USD',
      minActivities: 12,
      keyLandmarks: [
        { term: 'Golden Gate', requiresCoords: true },
        { term: 'Alcatraz', requiresCoords: true },
        { term: 'Yosemite', requiresCoords: true },
        { term: 'Las Vegas', requiresCoords: true },
        { term: 'Grand Canyon', requiresCoords: true },
        { term: 'Santa Monica', requiresCoords: true }
      ]
    }
  },

  // 5. New York City 5 Giorni
  {
    id: 'us-nyc-5d',
    name: 'USA: New York City Iconica (5 Giorni)',
    region: 'Americhe',
    text: `12-16 Ottobre: New York City
- 12/10: Arrivo a New York JFK ore 13:15. AirTrain e check-in hotel a Manhattan. Serata a Times Square.
- 13/10: Mattina ore 09:00 traghetto per la Statua della Libertà ed Ellis Island. Pomeriggio: Wall Street e Memoriale dell'11 Settembre.
- 14/10: Passeggiata a Central Park, visita al Metropolitan Museum of Art (Met). Tardo pomeriggio: salita all'Empire State Building per il tramonto.
- 15/10: Passeggiata sulla High Line e quartiere Chelsea Market. Attraversamento a piedi del Ponte di Brooklyn fino a DUMBO. Sera: Musical a Broadway ore 20:00.
- 16/10: Shopping lungo la Fifth Avenue, Rockefeller Center e volo di rientro da JFK ore 18:30.`,
    options: { referenceYear: 2026 },
    expected: {
      startDate: '2026-10-12',
      endDate: '2026-10-16',
      dayCount: 5,
      presetId: 'usa',
      currency: 'USD',
      minActivities: 11,
      keyLandmarks: [
        { term: 'Times Square', requiresCoords: true },
        { term: 'Statua della Libert', requiresCoords: true },
        { term: 'Central Park', requiresCoords: true },
        { term: 'Empire State', requiresCoords: true },
        { term: 'Ponte di Brooklyn', requiresCoords: true },
        { term: 'Rockefeller', requiresCoords: true }
      ]
    }
  },

  // 6. Francia: Parigi & Castelli della Loira
  {
    id: 'fr-paris-loire',
    name: 'Francia: Parigi & Castelli della Loira (6 Giorni)',
    region: 'Europa',
    text: `20-25 Aprile: Parigi e Castelli
- 20/04: Arrivo all'aeroporto Parigi Charles de Gaulle ore 10:00. Salita sulla Tour Eiffel ore 14:00. Crociera sulla Senna al tramonto.
- 21/04: Mattina presto Museo del Louvre (ore 09:00). Pomeriggio passeggiata a Montmartre e Basilica del Sacro Cuore.
- 22/04: Escursione in RER alla Reggia di Versailles (Giardini e Sala degli Specchi). Rientro a Parigi per cena a Saint-Germain-des-Prés.
- 23/04: Ritiro auto e trasferimento nella Valle della Loira. Visita al maestoso Castello di Chambord. Notte a Blois.
- 24/04: Visita al favoloso Castello di Chenonceau (il castello sul fiume Cher) e degustazione vini a Vouvray.
- 25/04: Rientro verso Parigi e volo di ritorno ore 19:15.`,
    options: { referenceYear: 2026 },
    expected: {
      startDate: '2026-04-20',
      endDate: '2026-04-25',
      dayCount: 6,
      presetId: 'europe',
      currency: 'EUR',
      minActivities: 11,
      keyLandmarks: [
        { term: 'Tour Eiffel', requiresCoords: true },
        { term: 'Louvre', requiresCoords: true },
        { term: 'Sacr', requiresCoords: true },
        { term: 'Versailles', requiresCoords: true },
        { term: 'Chambord', requiresCoords: true },
        { term: 'Chenonceau', requiresCoords: true }
      ]
    }
  },

  // 7. Spagna: Andalusia (Siviglia, Cordoba, Granada)
  {
    id: 'es-andalusia',
    name: 'Spagna: Andalusia classica (5 Giorni)',
    region: 'Europa',
    text: `10-14 Ottobre: Andalusia
- 10/10: Arrivo a Siviglia ore 11:45. Pomeriggio: Cattedrale di Siviglia e Giralda. Tramonto spettacolare a Plaza de España. Sera tapas a Triana.
- 11/10: Visita ai giardini e palazzi del Real Alcázar di Siviglia ore 09:30. Quartiere Santa Cruz.
- 12/10: Treno veloce per Cordoba ore 09:00. Visita alla splendida Mezquita di Cordoba e passeggiata nel quartiere ebraico (Judería).
- 13/10: Treno per Granada. Visita imperdibile all'Alhambra e Generalife ore 14:00. Tramonto al Mirador de San Nicolás sull'Albayzín.
- 14/10: Mattina centro storico di Granada e volo di rientro ore 17:30.`,
    options: { referenceYear: 2026 },
    expected: {
      startDate: '2026-10-10',
      endDate: '2026-10-14',
      dayCount: 5,
      presetId: 'europe',
      currency: 'EUR',
      minActivities: 10,
      keyLandmarks: [
        { term: 'Plaza de Espa', requiresCoords: true },
        { term: 'Alc', requiresCoords: true },
        { term: 'Mezquita', requiresCoords: true },
        { term: 'Alhambra', requiresCoords: true }
      ]
    }
  },

  // 8. Regno Unito: Londra & Scozia
  {
    id: 'uk-london-scotland',
    name: 'Regno Unito: Londra & Scozia (7 Giorni)',
    region: 'Europa',
    text: `05-11 Luglio: Gran Bretagna
- 05/07: Volo per Londra Stansted ore 10:15. Trasferimento e check-in. Pomeriggio: Big Ben, Abbazia di Westminster e ruota panoramica London Eye.
- 06/07: Mattina al British Museum, pomeriggio a Tower Bridge e Torre di Londra.
- 07/07: Treno veloce LNER da Londra King's Cross a Edimburgo Waverley ore 09:30. Pomeriggio: passeggiata lungo il Royal Mile fino al Castello di Edimburgo.
- 08/07: Tour di un giorno nelle Highlands scozzesi: lago di Loch Ness, castello di Urquhart e valle di Glencoe.
- 09/07: Salita ad Arthur's Seat per vista panoramica su Edimburgo e visita a Calton Hill.
- 10/07: Gita all'isola di Skye o villaggi storici dei pescatori.
- 11/07: Volo di rientro da Edimburgo ore 18:00.`,
    options: { referenceYear: 2026 },
    expected: {
      startDate: '2026-07-05',
      endDate: '2026-07-11',
      dayCount: 7,
      presetId: 'uk',
      currency: 'GBP',
      minActivities: 11,
      keyLandmarks: [
        { term: 'Big Ben', requiresCoords: true },
        { term: 'British Museum', requiresCoords: true },
        { term: 'Tower Bridge', requiresCoords: true },
        { term: 'Castello di Edimburgo', requiresCoords: true },
        { term: 'Loch Ness', requiresCoords: true }
      ]
    }
  },

  // 9. Thailandia: Bangkok, Chiang Mai & Mare
  {
    id: 'th-thailand-tour',
    name: 'Thailandia: Bangkok, Templi & Isole (8 Giorni)',
    region: 'Asia',
    text: `10-17 Novembre: Viaggio in Thailandia
- 10/11: Arrivo a Bangkok Suvarnabhumi ore 09:30. Battello sul fiume Chao Phraya e visita al tempio Wat Arun.
- 11/11: Gran Palazzo Reale (Wat Phra Kaew), tempio del Buddha Sdraiato (Wat Pho) e street food serale a Chinatown (Yaowarat).
- 12/11: Volo interno mattutino per Chiang Mai. Visita al tempio dorato Wat Phra That Doi Suthep sulla montagna.
- 13/11: Giornata in un santuario etico per la cura degli elefanti a Chiang Mai.
- 14/11: Volo interno per Phuket o Koh Samui. Check-in resort fronte mare e relax al tramonto.
- 15/11: Escursione in barca alle isole Phi Phi e Maya Bay (snorkeling).
- 16/11: Giornata di relax in spiaggia, massaggio tradizionale thai e cena a base di pad thai e cocco fresco.
- 17/11: Volo di rientro per l'Italia ore 19:00.`,
    options: { referenceYear: 2026 },
    expected: {
      startDate: '2026-11-10',
      endDate: '2026-11-17',
      dayCount: 8,
      currency: 'THB',
      minActivities: 12,
      keyLandmarks: [
        { term: 'Wat Arun', requiresCoords: true },
        { term: 'Palazzo Reale', requiresCoords: true },
        { term: 'Wat Pho', requiresCoords: true },
        { term: 'Doi Suthep', requiresCoords: true },
        { term: 'Phi Phi', requiresCoords: true }
      ]
    }
  },

  // 10. Grecia: Atene & Santorini
  {
    id: 'gr-athens-santorini',
    name: 'Grecia: Atene & Cicladi (5 Giorni)',
    region: 'Europa',
    text: `18-22 Giugno: Grecia
- 18/06: Arrivo all'aeroporto di Atene ore 10:45. Visita all'Acropoli di Atene e al Partenone ore 15:00. Sera cena tipica tra le viuzze di Plaka.
- 19/06: Museo dell'Acropoli la mattina, poi trasferimento al porto del Pireo e traghetto per Santorini. Arrivo a Fira e sistemazione.
- 20/06: Mattina relax alla Spiaggia Rossa di Akrotiri. Tardo pomeriggio passeggiata a Oia per assistere al celebre tramonto.
- 21/06: Gita in barca nella Caldera di Santorini, salita al vulcano e sorgenti termali calde.
- 22/06: Souvenir a Fira e volo di ritorno per Roma ore 16:20.`,
    options: { referenceYear: 2026 },
    expected: {
      startDate: '2026-06-18',
      endDate: '2026-06-22',
      dayCount: 5,
      presetId: 'europe',
      currency: 'EUR',
      minActivities: 9,
      keyLandmarks: [
        { term: 'Acropoli', requiresCoords: true },
        { term: 'Partenone', requiresCoords: true },
        { term: 'Plaka', requiresCoords: true },
        { term: 'Oia', requiresCoords: true },
        { term: 'Caldera', requiresCoords: true }
      ]
    }
  },

  // 11. Norvegia: Fiordi & Bergen
  {
    id: 'no-fjords',
    name: 'Norvegia: Oslo, Treno Panoramico & Fiordi (5 Giorni)',
    region: 'Europa',
    text: `14-18 Agosto: Norvegia
- 14/08: Arrivo a Oslo Gardermoen ore 11:20. Parco delle sculture di Vigeland e Teatro dell'Opera sul fiordo.
- 15/08: Treno scenografico da Oslo a Myrdal, poi ferrovia panoramica Flåmsbana fino a Flåm. Crociera nel fiordo Nærøyfjord (UNESCO). Notte a Gudvangen.
- 16/08: Bus e treno per Bergen. Quartiere anseatico storico di Bryggen (patrimonio UNESCO) e mercato del pesce.
- 17/08: Salita in funicolare sul Monte Fløyen per vista sui fiordi e sentieri nel bosco.
- 18/08: Volo di rientro da Bergen Flesland ore 16:40.`,
    options: { referenceYear: 2026 },
    expected: {
      startDate: '2026-08-14',
      endDate: '2026-08-18',
      dayCount: 5,
      currency: 'NOK',
      minActivities: 9,
      keyLandmarks: [
        { term: 'Vigeland', requiresCoords: true },
        { term: 'Flåm', requiresCoords: true },
        { term: 'Bryggen', requiresCoords: true },
        { term: 'Fløyen', requiresCoords: true }
      ]
    }
  },

  // 12. Weekend Relax & Terme in Toscana
  {
    id: 'it-tuscany-spa',
    name: "Italia: Val d'Orcia, Terme di Saturnia & Chianti (3 Giorni)",
    region: 'Europa',
    text: `23-25 Ottobre: Weekend in Toscana
- 23/10: Arrivo a Siena ore 10:30. Piazza del Campo, Palazzo Pubblico e Duomo di Siena. Pranzo con pici al ragù di cinghiale. Pomeriggio verso San Gimignano e le sue torri medievali.
- 24/10: Tour della Val d'Orcia: Pienza (degustazione pecorino) e cappella di Vitaleta. Pomeriggio relax completo alle Cascate del Mulino a Saturnia (acque termali sulfuree calde).
- 25/10: Montalcino: visita alla fortezza e degustazione di vino Brunello di Montalcino in cantina. Rientro a casa verso le 19:00.`,
    options: { referenceYear: 2026 },
    expected: {
      startDate: '2026-10-23',
      endDate: '2026-10-25',
      dayCount: 3,
      presetId: 'europe',
      currency: 'EUR',
      minActivities: 7,
      keyLandmarks: [
        { term: 'Piazza del Campo', requiresCoords: true },
        { term: 'Pienza', requiresCoords: true },
        { term: 'Saturnia', expectedCategory: 'relax', requiresCoords: true },
        { term: 'Montalcino', requiresCoords: true }
      ]
    }
  },

  // 13. Dolomiti & Laghi Alpini
  {
    id: 'it-dolomites',
    name: 'Italia: Dolomiti, Lago di Braies & Tre Cime (4 Giorni)',
    region: 'Europa',
    text: `Giorno 1: Arrivo in Val Pusteria, check-in hotel e passeggiata panoramica attorno al Lago di Braies (giro in barca di legno).
Giorno 2: Escursione ad anello alle Tre Cime di Lavaredo partendo dal Rifugio Auronzo fino al Rifugio Locatelli. Vista mozzafiato.
Giorno 3: Val Gardena: salita in cabinovia al Seceda per ammirare le creste del gruppo Odle, poi relax sui prati dell'Alpe di Siusi.
Giorno 4: Sosta fotografica al Lago di Carezza con riflesso del Latemar e rientro nel pomeriggio.`,
    options: { referenceStartDate: '2026-07-10' },
    expected: {
      startDate: '2026-07-10',
      endDate: '2026-07-13',
      dayCount: 4,
      presetId: 'europe',
      currency: 'EUR',
      minActivities: 6,
      keyLandmarks: [
        { term: 'Braies', requiresCoords: true },
        { term: 'Tre Cime', requiresCoords: true },
        { term: 'Seceda', requiresCoords: true },
        { term: 'Carezza', requiresCoords: true }
      ]
    }
  },

  // 14. Perù: Cusco & Machu Picchu
  {
    id: 'pe-machu-picchu',
    name: 'Perù: Valle Sacra & Machu Picchu (5 Giorni)',
    region: 'Americhe',
    text: `15-19 Maggio: Perù
- 15/05: Arrivo a Cusco (3400m slm). Riposo per acclimatamento, passeggiata in Plaza de Armas e visita al tempio solare del Qorikancha.
- 16/05: Escursione nella Valle Sacra degli Incas: fortezza di Ollantaytambo e mercato artigianale di Pisac.
- 17/05: Treno panoramico PeruRail lungo la gola dell'Urubamba fino ad Aguas Calientes. Visita guidata alla cittadella di Machu Picchu ore 10:00.
- 18/05: Salita all'alba per vedere Machu Picchu tra le nuvole e rientro in treno a Cusco.
- 19/05: Salina di Maras e terrazze circolari di Moray, volo di rientro ore 18:00.`,
    options: { referenceYear: 2026 },
    expected: {
      startDate: '2026-05-15',
      endDate: '2026-05-19',
      dayCount: 5,
      minActivities: 9,
      keyLandmarks: [
        { term: 'Cusco', requiresCoords: true },
        { term: 'Machu Picchu', requiresCoords: true },
        { term: 'Ollantaytambo', requiresCoords: true },
        { term: 'Maras', requiresCoords: true }
      ]
    }
  },

  // 15. Marocco: Marrakech & Deserto di Merzouga
  {
    id: 'ma-marrakech-desert',
    name: 'Marocco: Marrakech, Kasbah & Deserto (5 Giorni)',
    region: 'Africa',
    text: `02-06 Novembre: Viaggio in Marocco
- 02/11: Volo e arrivo a Marrakech Menara ore 12:30. Sistemazione in Riad. Tardo pomeriggio e serata nella magica Piazza Jemaa el-Fna tra incantatori e bancarelle.
- 03/11: Mattina Jardin Majorelle e Museo Yves Saint Laurent. Pomeriggio: Palazzo Bahia e Tombe Saadiane.
- 04/11: Partenza in 4x4 attraverso l'Alto Atlante (passo Tizi n'Tichka), visita alla kasbah Patrimonio UNESCO di Ait Ben Haddou e Gole del Dades.
- 05/11: Arrivo alle maestose dune dorate dell'Erg Chebbi a Merzouga. Cammellata al tramonto e notte magica in accampamento berbero sotto le stelle.
- 06/11: Alba nel deserto e rientro a Marrakech per volo di ritorno ore 20:15.`,
    options: { referenceYear: 2026 },
    expected: {
      startDate: '2026-11-02',
      endDate: '2026-11-06',
      dayCount: 5,
      currency: 'MAD',
      minActivities: 9,
      keyLandmarks: [
        { term: 'Jemaa', requiresCoords: true },
        { term: 'Majorelle', requiresCoords: true },
        { term: 'Ait Ben Haddou', requiresCoords: true },
        { term: 'Merzouga', requiresCoords: true }
      ]
    }
  },

  // 16. Germania: Weekend a Berlino
  {
    id: 'de-berlin',
    name: 'Germania: Weekend Storico a Berlino (3 Giorni)',
    region: 'Europa',
    text: `06-08 Novembre: Berlino
- 06/11: Arrivo all'aeroporto di Berlino Brandeburgo (BER) ore 10:40. Treno in centro. Porta di Brandeburgo, cupola in vetro del Reichstag e Memoriale per gli ebrei assassinati d'Europa.
- 07/11: Isola dei Musei (Museo di Pergamo e Neues Museum), Checkpoint Charlie e passeggiata lungo i murales della East Side Gallery (Muro di Berlino).
- 08/11: Alexanderplatz, torre della televisione Fernsehturm, Duomo di Berlino e volo di rientro ore 19:30.`,
    options: { referenceYear: 2026 },
    expected: {
      startDate: '2026-11-06',
      endDate: '2026-11-08',
      dayCount: 3,
      presetId: 'europe',
      currency: 'EUR',
      minActivities: 8,
      keyLandmarks: [
        { term: 'Brandeburgo', requiresCoords: true },
        { term: 'Reichstag', requiresCoords: true },
        { term: 'East Side Gallery', requiresCoords: true },
        { term: 'Alexanderplatz', requiresCoords: true }
      ]
    }
  },

  // 17. Australia: Sydney & Grande Barriera Corallina
  {
    id: 'au-sydney-reef',
    name: 'Australia: Sydney & Grande Barriera Corallina (6 Giorni)',
    region: 'Oceania',
    text: `10-15 Gennaio: Australia Highlights
- 10/01: Arrivo a Sydney Kingsford Smith ore 08:30. Check-in e passeggiata all'iconica Sydney Opera House e vista sull'Harbour Bridge.
- 11/01: Passeggiata costiera mozzafiato da Bondi Beach a Coogee Beach. Pranzo con vista oceano.
- 12/01: Volo interno per Cairns. Arrivo nella zona tropicale e sistemazione in hotel.
- 13/01: Intera giornata di escursione in catamarano alla Grande Barriera Corallina (snorkeling e immersioni subacquee).
- 14/01: Escursione nella foresta pluviale di Daintree e Cape Tribulation.
- 15/01: Volo di rientro per Sydney e coincidenza internazionale ore 19:00.`,
    options: { referenceYear: 2026 },
    expected: {
      startDate: '2026-01-10',
      endDate: '2026-01-15',
      dayCount: 6,
      currency: 'AUD',
      minActivities: 8,
      keyLandmarks: [
        { term: 'Opera House', requiresCoords: true },
        { term: 'Harbour Bridge', requiresCoords: true },
        { term: 'Bondi', requiresCoords: true },
        { term: 'Barriera Corallina', requiresCoords: true }
      ]
    }
  },

  // 18. Olanda in Prosa Libera e Informale (WhatsApp Style)
  {
    id: 'nl-amsterdam-chat',
    name: 'Olanda: Amsterdam in Prosa Libera WhatsApp (4 Giorni)',
    region: 'Europa',
    text: `Ciao ragazzi! Ecco la nostra bozza per Amsterdam dal 4 al 7 maggio:
04/05 partiamo con volo EasyJet da Milano Malpensa ore 08:20, arrivo a Schiphol ore 10:15. Check-in all'hotel e poi subito Museo Van Gogh ore 14:00 e crociera sui canali.
05/05 noleggio bici, visita alla Casa di Anne Frank la mattina presto e pomeriggio nel quartiere Jordaan.
Il 06/05 vorremmo fare una gita ai mulini di Zaanse Schans e al parco dei tulipani di Keukenhof.
Il 07/05 mercato dei fiori Bloemenmarkt, Rijksmuseum e volo di ritorno alle 20:45.`,
    options: { referenceYear: 2026 },
    expected: {
      startDate: '2026-05-04',
      endDate: '2026-05-07',
      dayCount: 4,
      presetId: 'europe',
      currency: 'EUR',
      minActivities: 8,
      keyLandmarks: [
        { term: 'Van Gogh', requiresCoords: true },
        { term: 'Anne Frank', requiresCoords: true },
        { term: 'Keukenhof', requiresCoords: true },
        { term: 'Zaanse Schans', requiresCoords: true },
        { term: 'Rijksmuseum', requiresCoords: true }
      ]
    }
  },

  // 19. Formato Markdown con Headings (# Giorno 1, ## Giorno 2)
  {
    id: 'md-headings-rome',
    name: 'Markdown con Headings (# Giorno 1, ## Giorno 2, checkbox)',
    region: 'Europa',
    text: `# Programma Viaggio Roma (15-18 Settembre)

## Giorno 1 - 15/09: Roma Antica
* Ore 10:30 Arrivo Stazione Termini
* Colosseo e Foro Romano
* Bocca della Verità
* Cena tipica a Trastevere

## Giorno 2 - 16/09: Il Vaticano
* Ore 09:00 Musei Vaticani e Cappella Sistina
* Basilica di San Pietro e Salita sulla Cupola
* Castel Sant'Angelo al tramonto

## Giorno 3 - 17/09: Centro Storico & Barocco
* Piazza Navona e Fontana dei Quattro Fiumi
* Pantheon
* Fontana di Trevi (lancio della monetina)
* Piazza di Spagna e Trinità dei Monti

## Giorno 4 - 18/09: Villa Borghese e Rientro
* Galleria Borghese ore 10:00
* Passeggiata nel parco di Villa Borghese
* Volo di rientro ore 18:30`,
    options: { referenceYear: 2026 },
    expected: {
      startDate: '2026-09-15',
      endDate: '2026-09-18',
      dayCount: 4,
      presetId: 'europe',
      currency: 'EUR',
      minActivities: 11,
      keyLandmarks: [
        { term: 'Colosseo', requiresCoords: true },
        { term: 'Vatican', requiresCoords: true },
        { term: 'Pantheon', requiresCoords: true },
        { term: 'Trevi', requiresCoords: true },
        { term: 'Spagna', requiresCoords: true },
        { term: 'Borghese', requiresCoords: true }
      ]
    }
  },

  // 20. Portogallo Coast to Coast: Lisbona, Sintra & Porto
  {
    id: 'pt-coast-to-coast',
    name: 'Portogallo: Lisbona, Sintra & Porto (6 Giorni)',
    region: 'Europa',
    text: `08/09 - 13/09: Portogallo
- 08/09: Arrivo a Lisbona ore 11:15. Tram 28 attraverso il quartiere Alfama, Castello di São Jorge e vista panoramica al tramonto.
- 09/09: Torre di Belém, Monastero dos Jerónimos e assaggio dei celebri pastéis de nata a Pastéis de Belém.
- 10/09: Gita di una giornata a Sintra: favoloso Palácio da Pena fiabesco e giardini esoterici di Quinta da Regaleira.
- 11/09: Treno veloce Alfa Pendular per Porto. Pomeriggio: quartiere Ribeira lungo il fiume Douro e Ponte Dom Luís I.
- 12/09: Libreria Lello, Torre dos Clérigos e visita con degustazione alle cantine storiche di vino a Vila Nova de Gaia.
- 13/09: Passeggiata finale a Porto e volo di rientro ore 18:30.`,
    options: { referenceYear: 2026 },
    expected: {
      startDate: '2026-09-08',
      endDate: '2026-09-13',
      dayCount: 6,
      presetId: 'europe',
      currency: 'EUR',
      minActivities: 10,
      keyLandmarks: [
        { term: 'Torre di Bel', requiresCoords: true },
        { term: 'Pena', requiresCoords: true },
        { term: 'Ribeira', requiresCoords: true },
        { term: 'Lello', requiresCoords: true },
        { term: 'Gaia', requiresCoords: true }
      ]
    }
  }
];

export function runEvaluationHarness() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                      TRIPWISE TRAVEL GENERATOR EVALUATION LOOP                       ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════════════╝\n');

  let passedCases = 0;
  const failureReports = [];

  BENCHMARK_CASES.forEach((bCase, index) => {
    const caseNum = `[${String(index + 1).padStart(2, '0')}/${BENCHMARK_CASES.length}]`;
    const plan = parseNaturalLanguageItinerary(bCase.text, bCase.options);
    const issues = [];

    // 1. Valid plan check
    if (!plan.isValid) {
      issues.push('Plan returned isValid = false');
    }

    // 2. Date checks
    if (bCase.expected.startDate && plan.startDate !== bCase.expected.startDate) {
      issues.push(`Start date mismatch: expected ${bCase.expected.startDate}, got ${plan.startDate}`);
    }
    if (bCase.expected.endDate && plan.endDate !== bCase.expected.endDate) {
      issues.push(`End date mismatch: expected ${bCase.expected.endDate}, got ${plan.endDate}`);
    }
    if (plan.days.length !== bCase.expected.dayCount) {
      issues.push(`Day count mismatch: expected ${bCase.expected.dayCount}, got ${plan.days.length}`);
    }

    // 3. Preset & Currency checks
    if (bCase.expected.presetId && plan.detectedPresetId !== bCase.expected.presetId) {
      issues.push(`Preset mismatch: expected ${bCase.expected.presetId}, got ${plan.detectedPresetId}`);
    }
    if (bCase.expected.currency && plan.detectedCurrency !== bCase.expected.currency) {
      issues.push(`Currency mismatch: expected ${bCase.expected.currency}, got ${plan.detectedCurrency}`);
    }

    // 4. Minimum activities count
    const totalActs = plan.days.reduce((acc, d) => acc + d.activities.length, 0);
    if (totalActs < bCase.expected.minActivities) {
      issues.push(`Too few activities: expected >= ${bCase.expected.minActivities}, got ${totalActs}`);
    }

    // 5. Check no empty days
    const emptyDays = plan.days.filter((d) => d.activities.length === 0);
    if (emptyDays.length > 0) {
      issues.push(`${emptyDays.length} day(s) have 0 activities (${emptyDays.map((d) => d.date).join(', ')})`);
    }

    // 6. Check time staggering (no 3+ items identical time on same day unless specified)
    plan.days.forEach((day) => {
      const times = day.activities.map((a) => a.time).filter(Boolean);
      const timeCounts = new Map();
      times.forEach((t) => timeCounts.set(t, (timeCounts.get(t) || 0) + 1));
      for (const [t, count] of timeCounts.entries()) {
        if (count >= 3 && t === '10:00') {
          issues.push(`Day ${day.dayNumber} (${day.date}) has ${count} activities all colliding at ${t}`);
        }
      }
    });

    // 7. Landmark checks
    const strip = (s) => (s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
    const allActivities = plan.days.flatMap((d) => d.activities);
    for (const lm of bCase.expected.keyLandmarks) {
      const match = allActivities.find((a) =>
        strip(a.title).includes(strip(lm.term)) ||
        strip(a.locationName).includes(strip(lm.term))
      );
      if (!match) {
        issues.push(`Missing key landmark: "${lm.term}"`);
      } else {
        if (lm.expectedCategory && match.category !== lm.expectedCategory) {
          issues.push(`Landmark "${lm.term}" category mismatch: expected ${lm.expectedCategory}, got ${match.category}`);
        }
        if (lm.requiresCoords && (typeof match.lat !== 'number' || typeof match.lng !== 'number')) {
          issues.push(`Landmark "${lm.term}" is missing GPS coordinates`);
        }
      }
    }

    if (issues.length === 0) {
      passedCases += 1;
      const geocodedPct = Math.round((plan.geocodedCount / Math.max(totalActs, 1)) * 100);
      console.log(`${caseNum}  PASS  ${bCase.name.padEnd(58)} (${totalActs} tappe, ${geocodedPct}% GPS)`);
    } else {
      console.log(`${caseNum}  FAIL  ${bCase.name}`);
      issues.forEach((err) => console.log(`        - ${err}`));
      failureReports.push(`[${bCase.id}] ${bCase.name}:\n` + issues.map((i) => `  * ${i}`).join('\n'));
    }
  });

  const precisionScore = Math.round((passedCases / BENCHMARK_CASES.length) * 100);
  console.log('\n────────────────────────────────────────────────────────────────────────────────────────');
  console.log(`BENCHMARK RESULT: ${passedCases}/${BENCHMARK_CASES.length} passed (${precisionScore}% Precision Score)`);
  console.log('────────────────────────────────────────────────────────────────────────────────────────\n');

  if (failureReports.length > 0) {
    console.log('SUMMARY OF GAPS TO TRAIN / IMPROVE:');
    failureReports.forEach((rep) => console.log(rep + '\n'));
  }

  return { passedCases, totalCases: BENCHMARK_CASES.length, precisionScore, failureReports };
}

// Auto-run if executed directly via node
if (process.argv[1]?.endsWith('itinerary-training-loop.mjs')) {
  const result = runEvaluationHarness();
  if (result.precisionScore < 100) {
    process.exitCode = 1;
  }
}
