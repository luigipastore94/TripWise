import assert from 'node:assert/strict';
import { runEvaluationHarness } from '../scripts/itinerary-training-loop.mjs';

// 1. Flexible Currency Amount Parser (Postel's Law)
function parseFlexibleAmount(raw) {
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d.,-]/g, '').trim();
  if (!cleaned) return 0;
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  let normalized = cleaned;
  if (lastComma > -1 && lastDot > -1) {
    normalized =
      lastComma > lastDot
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '');
  } else if (lastComma > -1) {
    normalized = cleaned.replace(',', '.');
  }
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

assert.equal(parseFlexibleAmount('12,50'), 12.5);
assert.equal(parseFlexibleAmount('1.250,50 €'), 1250.5);
assert.equal(parseFlexibleAmount('1,250.50'), 1250.5);
assert.equal(parseFlexibleAmount('¥3500'), 3500);

// 2. Trip Date Resizing Logic (preserving existing activities)
function addDaysIso(isoDate, offsetDays) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + offsetDays));
  return utc.toISOString().slice(0, 10);
}

function reconcileDaysWithDateRange(existingDays, startDate, endDate) {
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const rawCount = Math.floor((Date.UTC(ey, em - 1, ed) - Date.UTC(sy, sm - 1, sd)) / 86400000) + 1;
  const count = Math.min(Math.max(rawCount || 1, 1), 60);

  const nextDays = [];
  for (let i = 0; i < count; i++) {
    const iso = addDaysIso(startDate, i);
    const prev = existingDays[i];
    if (prev) {
      nextDays.push({
        ...prev,
        dayNumber: i + 1,
        date: iso
      });
    } else {
      nextDays.push({
        id: `day_${i + 1}`,
        dayNumber: i + 1,
        date: iso,
        title: `Giorno ${i + 1}`,
        activities: []
      });
    }
  }
  return nextDays;
}

const initialDays = [
  { id: 'd1', dayNumber: 1, date: '2026-11-19', title: 'Arrivo', activities: [{ id: 'a1' }] },
  { id: 'd2', dayNumber: 2, date: '2026-11-20', title: 'Centro', activities: [] }
];
const shifted = reconcileDaysWithDateRange(initialDays, '2026-11-21', '2026-11-24');
assert.equal(shifted.length, 4);
assert.equal(shifted[0].date, '2026-11-21');
assert.equal(shifted[0].title, 'Arrivo');
assert.equal(shifted[0].activities.length, 1);
assert.equal(shifted[3].date, '2026-11-24');

// 3. Natural Language Itinerary Engine Tests
const { parseNaturalLanguageItinerary, EXAMPLE_HUMAN_ITINERARY_TEXT } = await import(
  '../src/utils/naturalItineraryParser.ts'
);

// Test 3a: Exact user's Japan prompt
const japanPlan = parseNaturalLanguageItinerary(EXAMPLE_HUMAN_ITINERARY_TEXT, {
  referenceYear: 2026,
  enrichFreeDays: true
});

assert.equal(japanPlan.isValid, true);
assert.equal(japanPlan.days.length, 16);
assert.equal(japanPlan.startDate, '2026-11-22');
assert.equal(japanPlan.endDate, '2026-12-07');
assert.equal(japanPlan.detectedPresetId, 'japan');
assert.equal(japanPlan.detectedCurrency, 'JPY');
assert.equal(japanPlan.detectedExchangeRate, 162.5);

// Check Day 1 (22/11): arrival at 12:50
const day1 = japanPlan.days[0];
assert.equal(day1.date, '2026-11-22');
const day1Arrival = day1.activities.find((a) => a.title.includes('Arrivo a Tokyo'));
assert.ok(day1Arrival, 'Should have Tokyo arrival on Day 1');
assert.equal(day1Arrival.time, '12:50');
assert.equal(day1Arrival.category, 'transport');

// Check Day 3 (24/11): Kamakura
const day3 = japanPlan.days[2];
assert.equal(day3.date, '2026-11-24');
assert.ok(
  day3.activities.some((a) => a.title.toLowerCase().includes('kamakura')),
  'Should have Kamakura on 24/11'
);

// Check Day 4 (25/11): teamLab Planets at 08:30
const day4 = japanPlan.days[3];
assert.equal(day4.date, '2026-11-25');
const teamlab = day4.activities.find((a) => a.title.toLowerCase().includes('teamlab'));
assert.ok(teamlab, 'Should have teamLab Planets on 25/11');
assert.equal(teamlab.time, '08:30');

// Check Day 6 (27/11): Fujikawaguchiko
const day6 = japanPlan.days[5];
assert.equal(day6.date, '2026-11-27');
assert.ok(
  day6.activities.some((a) => a.title.toLowerCase().includes('fujikawaguchiko') || a.title.toLowerCase().includes('chureito')),
  'Should be at Fujikawaguchiko on 27/11'
);

// Check Day 7 (28/11): Transfer to Kyoto
const day7 = japanPlan.days[6];
assert.equal(day7.date, '2026-11-28');
assert.ok(
  day7.activities.some((a) => a.title.includes('Trasferimento a Kyoto')),
  'Should have Kyoto transfer on 28/11'
);

// Check Kyoto stay (29/11 - 02/12): Early morning distribution & Uji/Nara day trip & Maikoya
const day8 = japanPlan.days[7]; // 29/11
assert.ok(
  day8.activities.some((a) => a.title.includes('Fushimi Inari') && a.time === '07:30'),
  'Fushimi Inari should be early morning (07:30)'
);
assert.ok(
  day8.activities.some((a) => a.title.toLowerCase().includes('maikoya')),
  'MAIKOYA tea ceremony should be in Kyoto stay'
);

const day9 = japanPlan.days[8]; // 30/11
assert.ok(
  day9.activities.some((a) => a.title.includes('Arashiyama') && a.time === '07:30'),
  'Arashiyama should be early morning (07:30)'
);

const day10 = japanPlan.days[9]; // 01/12
assert.ok(
  day10.activities.some((a) => a.title.includes('Uji')) &&
  day10.activities.some((a) => a.title.includes('Nara')),
  'Day 10 should have excursion to Uji and Nara'
);

const day11 = japanPlan.days[10]; // 02/12
assert.ok(
  day11.activities.some((a) => a.title.includes('Kiyomizu-dera')),
  'Day 11 should have Kiyomizu-dera in morning'
);
assert.ok(
  day11.activities.some((a) => a.title.includes('Hiroshima') && a.category === 'transport'),
  'Day 11 should have afternoon/evening transfer to Hiroshima'
);

// Check Day 12 (03/12): Hiroshima + Miyajima
const day12 = japanPlan.days[11];
assert.equal(day12.date, '2026-12-03');
assert.ok(day12.activities.some((a) => a.title.includes('Hiroshima')));
assert.ok(day12.activities.some((a) => a.title.includes('Miyajima')));
assert.ok(day12.activities.some((a) => a.title.includes('Rientro a Hiroshima')));

// Check Day 13 (04/12): Hiroshima -> Himeji Castle -> Osaka
const day13 = japanPlan.days[12];
assert.equal(day13.date, '2026-12-04');
assert.ok(day13.activities.some((a) => a.title.includes('Himeji')));
assert.ok(day13.activities.some((a) => a.title.includes('Osaka') && a.category === 'transport'));

// Check Day 14 (05/12): Universal Studios
const day14 = japanPlan.days[13];
assert.equal(day14.date, '2026-12-05');
assert.ok(
  day14.activities.some((a) => a.title.toLowerCase().includes('universal')),
  'Universal Studios should be on 05/12'
);

// Check Day 16 (07/12): Return flight at 16:00
const day16 = japanPlan.days[15];
assert.equal(day16.date, '2026-12-07');
const returnFlight = day16.activities.find((a) => a.title.includes('Volo di rientro'));
assert.ok(returnFlight, 'Should have return flight on Day 16');
assert.equal(returnFlight.time, '16:00');

// Coordinates verification: verify high-precision GPS pins are attached
assert.ok(day1Arrival.lat && day1Arrival.lng, 'Day 1 arrival must have GPS coordinates');
assert.ok(teamlab.lat && teamlab.lng, 'teamLab must have GPS coordinates');

// Test 3b: Universal multi-city itinerary (e.g. Portugal)
const portugalPrompt = `- 10/08: arrivo a Lisbona ore 11:15
- 10-13/08: Lisbona (12/08 gita a Sintra)
- 13/08 trasferimento a Porto
- 13-16/08: Porto
- 16/08 volo di rientro da Porto ore 18:30`;

const portugalPlan = parseNaturalLanguageItinerary(portugalPrompt, { referenceYear: 2026 });
assert.equal(portugalPlan.isValid, true);
assert.equal(portugalPlan.days.length, 7);
assert.equal(portugalPlan.startDate, '2026-08-10');
assert.equal(portugalPlan.endDate, '2026-08-16');
assert.equal(portugalPlan.detectedCurrency, 'EUR');
assert.ok(portugalPlan.days[2].activities.some((a) => a.title.includes('Sintra')));

// Test 3c: Complex Hierarchical Bullet Outline (User's 15-day notes with stages, Unicode bullets, Italian days)
const hierarchicalOutline = `
TAPPA 1: Tokyo & Kamakura (5 Notti)
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
○	Cerimonia del tè  MAIKOYA (sede Gion/Kiyomizu) 
●	29 Nov (Dom) – Giorno 8: 
○	Mattina presto (ore 06:30 - 07:00): Kiyomizu-dera. Discesa a piedi attraverso le stradine storiche di Ninenzaka e Sannenzaka.
○	Tarda Mattina: Tempio Kodai-ji e Santuario Yasaka.
○	Pomeriggio: Spostamento a nord-ovest per visitare il Padiglione d'Oro (Kinkaku-ji e il giardino zen di Ryoan-ji.
○	Sera (Light-up): Spettacolare illuminazione serale al Tempio Eikan-do (uno dei luoghi più famosi di Kyoto per il foliage notturno). Spostato a questa sera per logica di percorso.
●	30 Nov (Lun) – Giorno 9: 
○	Intera giornata ad Arashiyama: Foresta di bambù, tempio Tenryu-ji e viaggio sul treno panoramico Sagano Romantic Train.
○	Sera: Spettacolare illuminazione notturna al tempio Eikan-do.
●	01 Dic (Mar) – Giorno 10:
○	Mattina presto (07:00 - 07:30): Santuario Fushimi Inari Taisha (passeggiata sotto i 10.000 torii rossi prima dell'arrivo dei tour).
○	Pomeriggio (Scegliere tra Opzione A o B):
■	Opzione A (Spettacolare foliage): Visita al Tempio Ruriko-in (prenotazione obbligatoria online) preso con il trenetto Eizan.
■	Opzione B (Classica e filassante): Passeggiata lungo il Sentiero della Filosofia con visita al Padiglione d'Argento (Ginkaku-ji)
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
○	Castello di Osaka
`;

const outlinePlan = parseNaturalLanguageItinerary(hierarchicalOutline, { referenceYear: 2026 });
assert.equal(outlinePlan.isValid, true);
assert.equal(outlinePlan.days.length, 15);
assert.equal(outlinePlan.startDate, '2026-11-22');
assert.equal(outlinePlan.endDate, '2026-12-06');
assert.ok(outlinePlan.days[0].activities.length >= 2, 'Day 1 should have arrival and Akihabara');
assert.ok(outlinePlan.days[1].activities.length >= 4, 'Day 2 should have Meiji, Shinjuku Gyoen, 3D Cat, Shibuya');
assert.ok(outlinePlan.days[6].activities.some((a) => a.title.toLowerCase().includes('maikoya')), 'Day 7 should include Maikoya tea ceremony');
assert.ok(outlinePlan.days[7].activities.some((a) => a.title.includes('Kiyomizu-dera')), 'Day 8 should include Kiyomizu-dera');
assert.ok(outlinePlan.days[10].activities.some((a) => a.title.includes('Uji')), 'Day 11 should have Uji');
assert.ok(outlinePlan.days[10].activities.some((a) => a.title.includes('Nara')), 'Day 11 should have Nara');
assert.ok(outlinePlan.days[11].activities.some((a) => a.title.includes('Miyajima')), 'Day 12 should have Miyajima');
assert.ok(outlinePlan.days[13].activities.some((a) => a.title.toLowerCase().includes('universal')), 'Day 14 should have Universal');
assert.ok(outlinePlan.days[14].activities.some((a) => a.title.includes('Kaiyukan')), 'Day 15 should have Kaiyukan');

// Verify activity times are staggered (no collision on default 09:00 for all activities)
const day2Times = outlinePlan.days[1].activities.map((a) => a.time).filter(Boolean);
const uniqueTimes = new Set(day2Times);
assert.equal(uniqueTimes.size, day2Times.length, 'Activities on Day 2 must have distinct staggered times');

// 5. Booking PDF Ticket and Attachment Domain Verification
function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

assert.equal(formatFileSize(512), '512 B');
assert.equal(formatFileSize(204800), '200 KB');
assert.equal(formatFileSize(1572864), '1.5 MB');

const samplePdfBooking = {
  id: 'bkg_sample_1',
  type: 'train',
  title: 'Frecciarossa 9612 Milano-Roma',
  provider: 'Trenitalia',
  confirmationCode: 'PNR89K',
  dateTime: '2026-11-23T08:30',
  pdfDataUrl: 'data:application/pdf;base64,JVBERi0xLjQK...',
  pdfFileName: 'Biglietto_Frecciarossa.pdf',
  pdfFileSize: 204800
};

assert.equal(samplePdfBooking.pdfFileName, 'Biglietto_Frecciarossa.pdf');
assert.equal(samplePdfBooking.pdfFileSize, 204800);
assert.ok(samplePdfBooking.pdfDataUrl.startsWith('data:application/pdf;base64,'));

// 5b. Booking QR Code vs Confirmation Code Invariant (QR is NOT always present on tickets)
const { hasBookingQr, normalizePdfFileName } = await import(
  '../src/utils/bookingUtils.ts'
);

// Confirmation codes (PNR, voucher numbers) must NEVER be falsely identified as QR codes
assert.equal(
  hasBookingQr({ confirmationCode: 'PNR89K' }),
  false,
  'Tickets with only confirmation codes must not have QR code'
);
assert.equal(
  hasBookingQr({ confirmationCode: 'HOTEL-ROMA-992' }),
  false,
  'Hotel bookings without QR must not have QR code'
);
assert.equal(
  hasBookingQr({ qrPayload: '   ' }),
  false,
  'Whitespace QR payload must not count as QR code'
);
assert.equal(
  hasBookingQr({ qrPayload: 'https://trenitalia.it/v/XYZ123' }),
  true,
  'Explicit QR payload is recognized'
);
assert.equal(
  hasBookingQr({ qrImageDataUrl: 'data:image/jpeg;base64,abc' }),
  true,
  'Uploaded QR screenshot is recognized'
);
assert.equal(normalizePdfFileName('Biglietto Freccia'), 'Biglietto Freccia.pdf');
assert.equal(normalizePdfFileName('biglietto.pdf'), 'biglietto.pdf');
assert.equal(normalizePdfFileName(''), 'biglietto.pdf');

// 6. Collaborative Concurrent Sync & Array ID Merge Tests
const { mergeTrips, mergeEntityLists, mergeItineraryDays } = await import(
  '../src/utils/tripMerge.ts'
);

// 6a. Concurrent addition on different sections (Checklist + Expense)
const baseTripFixture = {
  id: 'trip_1',
  inviteCode: 'TW-TEST-1234',
  title: 'Tokyo 2026',
  destination: 'Tokyo',
  emoji: '🗼',
  startDate: '2026-11-22',
  endDate: '2026-11-25',
  baseCurrency: 'EUR',
  destinationCurrency: 'JPY',
  exchangeRate: 162.5,
  defaultCenter: [35.6762, 139.6503],
  members: [{ id: 'm1', name: 'Alice', color: '#3B82F6' }],
  memberUids: ['uid_alice'],
  days: [
    {
      id: 'd1',
      dayNumber: 1,
      date: '2026-11-22',
      title: 'Arrivo',
      activities: [{ id: 'act_1', time: '10:00', title: 'Check-in', locationName: 'Hotel', category: 'lodging', completed: false }]
    }
  ],
  savedPlaces: [],
  expenses: [],
  bookings: [],
  checklist: [
    { id: 'chk_1', category: 'documents', text: 'Passaporto', completed: false }
  ],
  updatedAt: 1000
};

// User A checks passport locally
const localTripFixtureA = {
  ...baseTripFixture,
  checklist: [
    { id: 'chk_1', category: 'documents', text: 'Passaporto', completed: true, updatedAt: 2000 }
  ],
  updatedAt: 2000
};

// User B adds an expense remotely
const remoteTripFixtureB = {
  ...baseTripFixture,
  expenses: [
    {
      id: 'exp_b1',
      title: 'Pranzo Ramen',
      amount: 2500,
      currency: 'JPY',
      amountInBase: 15.38,
      paidByMemberId: 'm1',
      splitBetweenMemberIds: ['m1'],
      category: 'food',
      date: '2026-11-22',
      updatedAt: 2001
    }
  ],
  updatedAt: 2001
};

const mergeResult1 = mergeTrips(baseTripFixture, localTripFixtureA, remoteTripFixtureB);
assert.equal(mergeResult1.merged.checklist[0].completed, true, 'User A checklist check must be preserved');
assert.equal(mergeResult1.merged.expenses.length, 1, 'User B expense must be preserved');
assert.equal(mergeResult1.merged.expenses[0].id, 'exp_b1');
assert.equal(mergeResult1.hasLocalChanges, true, 'Local changes relative to remote must flag hasLocalChanges=true');

// 6b. Concurrent expense additions from two users simultaneously
const localWithExpA = {
  ...baseTripFixture,
  expenses: [
    {
      id: 'exp_a1',
      title: 'Metro Tokyo',
      amount: 600,
      currency: 'JPY',
      amountInBase: 3.69,
      paidByMemberId: 'm1',
      splitBetweenMemberIds: ['m1'],
      category: 'transport',
      date: '2026-11-22',
      updatedAt: 2002
    }
  ],
  updatedAt: 2002
};

const mergeResult2 = mergeTrips(baseTripFixture, localWithExpA, remoteTripFixtureB);
assert.equal(mergeResult2.merged.expenses.length, 2, 'Both concurrent expenses must be preserved');
const expenseIds = mergeResult2.merged.expenses.map((e) => e.id);
assert.ok(expenseIds.includes('exp_a1'), 'Local expense A must be present');
assert.ok(expenseIds.includes('exp_b1'), 'Remote expense B must be present');

// 6c. Itinerary activities concurrent merge on Day 1
const localDayWithAct = {
  ...baseTripFixture,
  days: [
    {
      ...baseTripFixture.days[0],
      activities: [
        { ...baseTripFixture.days[0].activities[0], completed: true, updatedAt: 2010 },
        { id: 'act_local', time: '14:00', title: 'Shibuya Sky', locationName: 'Shibuya', category: 'sightseeing', completed: false, updatedAt: 2010 }
      ]
    }
  ],
  updatedAt: 2010
};

const remoteDayWithAct = {
  ...baseTripFixture,
  days: [
    {
      ...baseTripFixture.days[0],
      activities: [
        baseTripFixture.days[0].activities[0],
        { id: 'act_remote', time: '12:00', title: 'Pranzo Sushi', locationName: 'Ginza', category: 'food', completed: false, updatedAt: 2011 }
      ]
    }
  ],
  updatedAt: 2011
};

const mergeResult3 = mergeTrips(baseTripFixture, localDayWithAct, remoteDayWithAct);
assert.equal(mergeResult3.merged.days[0].activities.length, 3, 'All activities from both collaborators must be merged on Day 1');
const actIds = mergeResult3.merged.days[0].activities.map((a) => a.id);
assert.ok(actIds.includes('act_1'));
assert.ok(actIds.includes('act_local'));
assert.ok(actIds.includes('act_remote'));
const mergedAct1 = mergeResult3.merged.days[0].activities.find((a) => a.id === 'act_1');
assert.equal(mergedAct1.completed, true, 'Completed status of act_1 from local must be preserved');

// 6d. Deletion vs Addition: no resurrection of deleted items
const baseWithTwoExpenses = {
  ...baseTripFixture,
  expenses: [
    { id: 'exp_del', title: 'Da cancellare', amount: 10, currency: 'EUR', amountInBase: 10, paidByMemberId: 'm1', splitBetweenMemberIds: ['m1'], category: 'other', date: '2026-11-22' },
    { id: 'exp_keep', title: 'Da tenere', amount: 20, currency: 'EUR', amountInBase: 20, paidByMemberId: 'm1', splitBetweenMemberIds: ['m1'], category: 'other', date: '2026-11-22' }
  ]
};

// Local user deletes exp_del
const localDeleted = {
  ...baseWithTwoExpenses,
  expenses: [baseWithTwoExpenses.expenses[1]],
  updatedAt: 3000
};

// Remote user adds exp_new
const remoteAdded = {
  ...baseWithTwoExpenses,
  expenses: [
    ...baseWithTwoExpenses.expenses,
    { id: 'exp_new', title: 'Nuovo remoto', amount: 30, currency: 'EUR', amountInBase: 30, paidByMemberId: 'm1', splitBetweenMemberIds: ['m1'], category: 'other', date: '2026-11-22', updatedAt: 3001 }
  ],
  updatedAt: 3001
};

const mergeResult4 = mergeTrips(baseWithTwoExpenses, localDeleted, remoteAdded);
const finalExpIds = mergeResult4.merged.expenses.map((e) => e.id);
assert.ok(!finalExpIds.includes('exp_del'), 'Deleted item must NOT be resurrected');
assert.ok(finalExpIds.includes('exp_keep'), 'Existing item must remain');
assert.ok(finalExpIds.includes('exp_new'), 'Newly added remote item must be included');

// 6e. 2-way merge fallback without base
const twoWayMerge = mergeEntityLists(undefined, [{ id: '1', val: 'a' }], [{ id: '2', val: 'b' }]);
assert.equal(twoWayMerge.length, 2);
assert.equal(twoWayMerge.find((x) => x.id === '1').val, 'a');
assert.equal(twoWayMerge.find((x) => x.id === '2').val, 'b');

// 6f. Trip cover image metadata merge (Tesler's Law & Postel's Law)
const localTripWithCover = {
  ...baseTripFixture,
  coverImage: 'data:image/jpeg;base64,localCoverImage123'
};
const mergeResultCover = mergeTrips(baseTripFixture, localTripWithCover, remoteTripFixtureB);
assert.equal(mergeResultCover.merged.coverImage, 'data:image/jpeg;base64,localCoverImage123', 'Local cover photo must be merged');
assert.equal(mergeResultCover.hasLocalChanges, true);

// 6g. Cover image removal invariant: removing cover image must not resurrect remote cover
const baseWithCover = {
  ...baseTripFixture,
  coverImage: 'data:image/jpeg;base64,originalPhoto'
};
const localWithoutCover = {
  ...baseWithCover,
  updatedAt: baseWithCover.updatedAt + 100
};
delete localWithoutCover.coverImage;

const remoteStillWithCover = {
  ...baseWithCover,
  updatedAt: baseWithCover.updatedAt + 50
};

const mergeResultRemoval = mergeTrips(baseWithCover, localWithoutCover, remoteStillWithCover);
assert.equal(mergeResultRemoval.merged.coverImage, undefined, 'Removed cover image must NOT be resurrected by remote');
assert.equal('coverImage' in mergeResultRemoval.merged, false, 'coverImage property must be deleted from merged object');
assert.equal(mergeResultRemoval.hasLocalChanges, true, 'Removal must flag local changes');

// 7. Trip Deletion Domain Invariants
function computeNextTripsState(currentTrips, tripIdToDelete, currentActiveTripId) {
  const nextTrips = currentTrips.filter((t) => t.id !== tripIdToDelete);
  let nextActiveId = currentActiveTripId;
  if (currentActiveTripId === tripIdToDelete) {
    nextActiveId = nextTrips[0]?.id ?? '';
  }
  return { nextTrips, nextActiveId };
}

const tripList = [
  { id: 'trip_alpha', title: 'Giappone Autunno' },
  { id: 'trip_beta', title: 'Portogallo Estate' },
  { id: 'trip_gamma', title: 'Islanda Inverno' }
];

// Deleting non-active trip preserves active ID
const deleteBeta = computeNextTripsState(tripList, 'trip_beta', 'trip_alpha');
assert.equal(deleteBeta.nextTrips.length, 2);
assert.equal(deleteBeta.nextActiveId, 'trip_alpha');
assert.ok(!deleteBeta.nextTrips.some((t) => t.id === 'trip_beta'));

// Deleting currently active trip falls back to first remaining trip
const deleteAlpha = computeNextTripsState(tripList, 'trip_alpha', 'trip_alpha');
assert.equal(deleteAlpha.nextTrips.length, 2);
assert.equal(deleteAlpha.nextActiveId, 'trip_beta');

// Deleting the last remaining trip yields empty list and empty active ID
const deleteLast = computeNextTripsState([{ id: 'trip_only', title: 'Solo' }], 'trip_only', 'trip_only');
assert.equal(deleteLast.nextTrips.length, 0);
assert.equal(deleteLast.nextActiveId, '');

// 8. Move Activity Between Days Domain Invariants
function moveActivityBetweenDays(days, sourceDayId, targetDayId, activityId, targetTime) {
  const sourceDay = days.find((d) => d.id === sourceDayId);
  const targetDay = days.find((d) => d.id === targetDayId);
  if (!sourceDay || !targetDay) return days;

  const activity = sourceDay.activities.find((a) => a.id === activityId);
  if (!activity) return days;

  if (sourceDayId === targetDayId) {
    if (targetTime && targetTime !== activity.time) {
      const updated = { ...activity, time: targetTime, updatedAt: Date.now() };
      const nextActs = sourceDay.activities.map((a) => (a.id === activityId ? updated : a));
      nextActs.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
      return days.map((d) => (d.id === sourceDayId ? { ...d, activities: nextActs } : d));
    }
    return days;
  }

  const updatedActivity = {
    ...activity,
    time: targetTime || activity.time,
    updatedAt: Date.now()
  };

  const nextSourceActivities = sourceDay.activities.filter((a) => a.id !== activityId);
  const nextTargetActivities = [
    ...targetDay.activities.filter((a) => a.id !== activityId),
    updatedActivity
  ];
  nextTargetActivities.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

  return days.map((d) => {
    if (d.id === sourceDayId) return { ...d, activities: nextSourceActivities };
    if (d.id === targetDayId) return { ...d, activities: nextTargetActivities };
    return d;
  });
}

const sampleDays = [
  {
    id: 'day_1',
    dayNumber: 1,
    date: '2026-10-27',
    title: 'Giorno 1',
    activities: [
      { id: 'act_colosseo', time: '09:30', title: 'Colosseo', category: 'sightseeing', completed: false, lat: 41.8902, lng: 12.4922 },
      { id: 'act_pranzo', time: '13:00', title: 'Trattoria Romana', category: 'food', completed: false }
    ]
  },
  {
    id: 'day_2',
    dayNumber: 2,
    date: '2026-10-28',
    title: 'Giorno 2',
    activities: [
      { id: 'act_vaticano', time: '10:00', title: 'Musei Vaticani', category: 'sightseeing', completed: false }
    ]
  }
];

// Test 8a: Move Colosseo from Day 1 to Day 2 at 15:30
const movedResult = moveActivityBetweenDays(sampleDays, 'day_1', 'day_2', 'act_colosseo', '15:30');
const resDay1 = movedResult.find((d) => d.id === 'day_1');
const resDay2 = movedResult.find((d) => d.id === 'day_2');

assert.equal(resDay1.activities.length, 1);
assert.equal(resDay1.activities[0].id, 'act_pranzo');

assert.equal(resDay2.activities.length, 2);
// Chronological sort: 10:00 Vaticani first, 15:30 Colosseo second
assert.equal(resDay2.activities[0].id, 'act_vaticano');
assert.equal(resDay2.activities[1].id, 'act_colosseo');
assert.equal(resDay2.activities[1].time, '15:30');
assert.equal(resDay2.activities[1].lat, 41.8902);
assert.ok(resDay2.activities[1].updatedAt > 0);

// Test 8b: Move activity to earlier time in Day 2
const movedEarlier = moveActivityBetweenDays(sampleDays, 'day_1', 'day_2', 'act_colosseo', '08:30');
const earlierDay2 = movedEarlier.find((d) => d.id === 'day_2');
assert.equal(earlierDay2.activities[0].id, 'act_colosseo');
assert.equal(earlierDay2.activities[1].id, 'act_vaticano');

// Test 8c: Same day time change
const reorderedDay1 = moveActivityBetweenDays(sampleDays, 'day_1', 'day_1', 'act_pranzo', '08:00');
const resSameDay = reorderedDay1.find((d) => d.id === 'day_1');
assert.equal(resSameDay.activities[0].id, 'act_pranzo');
assert.equal(resSameDay.activities[1].id, 'act_colosseo');

// Test 8d: Invalid IDs return days safely
const untouched = moveActivityBetweenDays(sampleDays, 'day_invalid', 'day_2', 'act_colosseo');
assert.equal(untouched, sampleDays);

// 9. Weather Service Helpers (Quantization, Code Mapping & Date Matching)
function quantizeCoord(coord) {
  return Math.round(coord * 40) / 40;
}

// Colosseum (41.8902, 12.4922) vs Roman Forum (41.8925, 12.4853) within ~600m
assert.equal(quantizeCoord(41.8902), 41.9);
assert.equal(quantizeCoord(41.8925), 41.9);
assert.equal(quantizeCoord(12.4922), 12.5);
assert.equal(quantizeCoord(12.4853), 12.475);

const WMO_MAP = {
  0: { label: 'Sereno', icon: 'Sun' },
  1: { label: 'Prevalentemente sereno', icon: 'Sun' },
  2: { label: 'Poco nuvoloso', icon: 'CloudSun' },
  3: { label: 'Coperto', icon: 'Cloud' },
  61: { label: 'Pioggia leggera', icon: 'CloudRain' },
  71: { label: 'Neve debole', icon: 'CloudSnow' },
  95: { label: 'Temporale', icon: 'CloudLightning' }
};

function getWeatherCondition(code) {
  return WMO_MAP[code] || { label: 'Variabile', icon: 'CloudSun' };
}

assert.equal(getWeatherCondition(0).label, 'Sereno');
assert.equal(getWeatherCondition(0).icon, 'Sun');
assert.equal(getWeatherCondition(2).label, 'Poco nuvoloso');
assert.equal(getWeatherCondition(61).label, 'Pioggia leggera');
assert.equal(getWeatherCondition(95).label, 'Temporale');
assert.equal(getWeatherCondition(999).label, 'Variabile');

// Forecast target date matching logic
function extractForecastForDate(dailyData, targetDate) {
  if (!dailyData || !Array.isArray(dailyData.time)) return null;
  const idx = dailyData.time.indexOf(targetDate);
  if (idx === -1) return null;
  return {
    code: dailyData.weather_code[idx],
    max: Math.round(dailyData.temperature_2m_max[idx]),
    min: Math.round(dailyData.temperature_2m_min[idx]),
    rainProb: dailyData.precipitation_probability_max[idx]
  };
}

const mockDaily = {
  time: ['2026-10-27', '2026-10-28', '2026-10-29'],
  weather_code: [0, 2, 61],
  temperature_2m_max: [21.4, 19.8, 16.2],
  temperature_2m_min: [11.2, 10.1, 9.0],
  precipitation_probability_max: [5, 15, 80]
};

const forecast28 = extractForecastForDate(mockDaily, '2026-10-28');
assert.deepEqual(forecast28, { code: 2, max: 20, min: 10, rainProb: 15 });
assert.equal(extractForecastForDate(mockDaily, '2026-11-15'), null);

// Hourly Arrival Time Parsing & Matching
function getNearestHour(timeStr) {
  const parts = timeStr.trim().split(':');
  if (parts.length === 0) return 12;
  const h = parseInt(parts[0], 10);
  if (isNaN(h)) return 12;
  const m = parts.length > 1 ? parseInt(parts[1], 10) : 0;
  const rounded = m >= 30 ? h + 1 : h;
  return Math.min(Math.max(rounded, 0), 23);
}

assert.equal(getNearestHour('12:50'), 13);
assert.equal(getNearestHour('16:15'), 16);
assert.equal(getNearestHour('09:30'), 10);
assert.equal(getNearestHour('00:05'), 0);
assert.equal(getNearestHour('23:45'), 23);

function extractHourlyForecast(hourlyData, targetDate, arrivalTime) {
  if (!hourlyData || !Array.isArray(hourlyData.time)) return null;
  const nearestHour = getNearestHour(arrivalTime);
  const hourPad = String(nearestHour).padStart(2, '0');
  const targetIsoHour = `${targetDate}T${hourPad}:00`;
  const idx = hourlyData.time.indexOf(targetIsoHour);
  if (idx === -1) return null;
  return {
    hourSlot: `${hourPad}:00`,
    temp: Math.round(hourlyData.temperature_2m[idx]),
    code: hourlyData.weather_code[idx]
  };
}

const mockHourly = {
  time: ['2026-10-27T11:00', '2026-10-27T12:00', '2026-10-27T13:00'],
  temperature_2m: [17.8, 18.9, 19.4],
  weather_code: [1, 2, 61]
};

const arrivalAt1250 = extractHourlyForecast(mockHourly, '2026-10-27', '12:50');
assert.deepEqual(arrivalAt1250, { hourSlot: '13:00', temp: 19, code: 61 });

// 10. Add Day At Beginning & End Invariants
function addDayToTrip(trip, title, date, position = 'end') {
  if (position === 'start') {
    let nextDate = date || '';
    if (!nextDate && trip.days.length > 0) {
      const first = trip.days[0].date || trip.startDate;
      if (first) {
        nextDate = addDaysIso(first, -1);
      }
    }
    if (!nextDate) {
      nextDate = trip.startDate || '2026-10-27';
    }

    const newDay = {
      id: `day_${Date.now()}_start`,
      dayNumber: 1,
      date: nextDate,
      title: title?.trim() || 'Giorno 1',
      activities: []
    };

    const shiftedDays = trip.days.map((d, idx) => {
      const newNum = idx + 2;
      const isDefaultTitle = !d.title || d.title.trim() === `Giorno ${d.dayNumber}`;
      return {
        ...d,
        dayNumber: newNum,
        title: isDefaultTitle ? `Giorno ${newNum}` : d.title
      };
    });

    const safeStartDate = nextDate || trip.startDate;
    const safeEndDate =
      trip.endDate || (trip.days.length > 0 ? trip.days[trip.days.length - 1].date : nextDate);

    return {
      ...trip,
      days: [newDay, ...shiftedDays],
      startDate: safeStartDate,
      endDate: safeEndDate
    };
  } else {
    const nextNum = trip.days.length + 1;
    let nextDate = date || '';
    if (!nextDate && trip.days.length > 0) {
      const last = trip.days[trip.days.length - 1].date;
      if (last) {
        nextDate = addDaysIso(last, 1);
      }
    }
    if (!nextDate) {
      nextDate = trip.startDate || '2026-10-27';
    }
    const newDay = {
      id: `day_${Date.now()}_end`,
      dayNumber: nextNum,
      date: nextDate,
      title: title?.trim() || `Giorno ${nextNum}`,
      activities: []
    };
    return {
      ...trip,
      days: [...trip.days, newDay],
      startDate: trip.startDate || nextDate,
      endDate: nextDate || trip.endDate
    };
  }
}

function deleteDayFromTrip(trip, dayId) {
  if (trip.days.length <= 1) return trip;
  const filtered = trip.days
    .filter((d) => d.id !== dayId)
    .map((d, idx) => {
      const newNum = idx + 1;
      const isDefaultTitle = !d.title || d.title.trim() === `Giorno ${d.dayNumber}`;
      return {
        ...d,
        dayNumber: newNum,
        title: isDefaultTitle ? `Giorno ${newNum}` : d.title
      };
    });
  const newStart = filtered[0]?.date || trip.startDate;
  const newEnd = filtered[filtered.length - 1]?.date || trip.endDate;
  return { ...trip, days: filtered, startDate: newStart, endDate: newEnd };
}

const tripForDayTests = {
  id: 'trip_test_days',
  startDate: '2026-11-22',
  endDate: '2026-11-23',
  days: [
    {
      id: 'd1',
      dayNumber: 1,
      date: '2026-11-22',
      title: 'Arrivo a Tokyo',
      activities: [{ id: 'act1', title: 'Check-in hotel' }]
    },
    {
      id: 'd2',
      dayNumber: 2,
      date: '2026-11-23',
      title: 'Giorno 2',
      activities: [{ id: 'act2', title: 'Shibuya Sky' }]
    }
  ]
};

// Test 10a: Add day at beginning prepends Day 1, computes 2026-11-21, updates startDate, preserves custom titles and activities
const prependedTrip = addDayToTrip(tripForDayTests, undefined, undefined, 'start');
assert.equal(prependedTrip.days.length, 3);
assert.equal(prependedTrip.startDate, '2026-11-21');
assert.equal(prependedTrip.endDate, '2026-11-23');

// New Day 1
assert.equal(prependedTrip.days[0].dayNumber, 1);
assert.equal(prependedTrip.days[0].date, '2026-11-21');
assert.equal(prependedTrip.days[0].title, 'Giorno 1');
assert.equal(prependedTrip.days[0].activities.length, 0);

// Shifted Day 2 (former Day 1): custom title "Arrivo a Tokyo" preserved
assert.equal(prependedTrip.days[1].id, 'd1');
assert.equal(prependedTrip.days[1].dayNumber, 2);
assert.equal(prependedTrip.days[1].date, '2026-11-22');
assert.equal(prependedTrip.days[1].title, 'Arrivo a Tokyo');
assert.equal(prependedTrip.days[1].activities.length, 1);
assert.equal(prependedTrip.days[1].activities[0].id, 'act1');

// Shifted Day 3 (former Day 2): default title updated to "Giorno 3"
assert.equal(prependedTrip.days[2].id, 'd2');
assert.equal(prependedTrip.days[2].dayNumber, 3);
assert.equal(prependedTrip.days[2].date, '2026-11-23');
assert.equal(prependedTrip.days[2].title, 'Giorno 3');
assert.equal(prependedTrip.days[2].activities.length, 1);

// Test 10b: Add day at beginning across month boundary (2026-03-01 -> 2026-02-28)
const marchTrip = {
  startDate: '2026-03-01',
  endDate: '2026-03-02',
  days: [{ id: 'm1', dayNumber: 1, date: '2026-03-01', title: 'Giorno 1', activities: [] }]
};
const febTrip = addDayToTrip(marchTrip, undefined, undefined, 'start');
assert.equal(febTrip.startDate, '2026-02-28');
assert.equal(febTrip.days[0].date, '2026-02-28');
assert.equal(febTrip.days[0].dayNumber, 1);
assert.equal(febTrip.days[1].dayNumber, 2);

// Test 10c: Add day at end appends Day 3 with 2026-11-24, updates endDate
const appendedTrip = addDayToTrip(tripForDayTests, undefined, undefined, 'end');
assert.equal(appendedTrip.days.length, 3);
assert.equal(appendedTrip.startDate, '2026-11-22');
assert.equal(appendedTrip.endDate, '2026-11-24');
assert.equal(appendedTrip.days[2].dayNumber, 3);
assert.equal(appendedTrip.days[2].date, '2026-11-24');
assert.equal(appendedTrip.days[2].title, 'Giorno 3');

// Test 10d: Delete first day updates startDate and renumbers remaining days
const deletedFirst = deleteDayFromTrip(prependedTrip, prependedTrip.days[0].id);
assert.equal(deletedFirst.days.length, 2);
assert.equal(deletedFirst.startDate, '2026-11-22');
assert.equal(deletedFirst.days[0].dayNumber, 1);
assert.equal(deletedFirst.days[0].title, 'Arrivo a Tokyo');
assert.equal(deletedFirst.days[1].dayNumber, 2);
assert.equal(deletedFirst.days[1].title, 'Giorno 2');

// 11. Auth Gate & Mobile-Web Parity Sync Invariants
// Test 11a: User-scoped storage keys prevent cross-account data leakage
function getUserTripsStorageKey(uid) {
  return uid ? `tripwise_trips_${uid}` : 'tripwise_trips_v1';
}
function getUserActiveTripStorageKey(uid) {
  return uid ? `tripwise_active_trip_id_${uid}` : 'tripwise_active_trip_id';
}

const keyUserA = getUserTripsStorageKey('uid_alice');
const keyUserB = getUserTripsStorageKey('uid_bob');
assert.notEqual(keyUserA, keyUserB, 'Different users must have strictly distinct storage keys');
assert.equal(keyUserA, 'tripwise_trips_uid_alice');
assert.equal(getUserActiveTripStorageKey('uid_alice'), 'tripwise_active_trip_id_uid_alice');

// Test 11b: Legacy trip migration assigns caller UID and prepares for cloud sync
const legacySample = [
  { id: 'trip_legacy_1', inviteCode: 'TW-ROMA-1234', title: 'Roma', memberUids: [] }
];
const migrated = legacySample.map((t) => ({
  ...t,
  memberUids: Array.from(new Set([...(t.memberUids || []), 'uid_alice']))
}));
assert.deepEqual(migrated[0].memberUids, ['uid_alice'], 'Legacy trip must be adopted by authenticated user');

// Test 11c: Real-time collection synchronization reconciles remote additions and deletions
function reconcileRemoteUserTrips(localTrips, remoteTrips, currentUid, lastSyncedMap) {
  const mergedMap = new Map();
  for (const lt of localTrips) {
    mergedMap.set(lt.inviteCode, lt);
  }

  const remoteKeys = new Set();
  for (const rt of remoteTrips) {
    remoteKeys.add(rt.inviteCode);
    mergedMap.set(rt.inviteCode, rt);
  }

  // Handle deletions: if a trip was previously synced but is absent from remote query, delete it locally
  for (const [key, existing] of mergedMap.entries()) {
    if (!remoteKeys.has(key)) {
      if (lastSyncedMap.has(key) || existing.memberUids?.includes(currentUid)) {
        mergedMap.delete(key);
      }
    }
  }

  return Array.from(mergedMap.values());
}

const mockLocal = [
  { id: 't1', inviteCode: 'TW-JAPA-1111', title: 'Giappone', memberUids: ['uid_alice'] },
  { id: 't2', inviteCode: 'TW-PARI-2222', title: 'Parigi', memberUids: ['uid_alice'] }
];
const lastSynced = new Map([
  ['TW-JAPA-1111', mockLocal[0]],
  ['TW-PARI-2222', mockLocal[1]]
]);

// Remote snapshot on mobile where 'TW-PARI-2222' was deleted on web
const remoteAfterDeletionOnWeb = [
  { id: 't1', inviteCode: 'TW-JAPA-1111', title: 'Giappone Modificato', memberUids: ['uid_alice'] }
];
const reconciledOnMobile = reconcileRemoteUserTrips(mockLocal, remoteAfterDeletionOnWeb, 'uid_alice', lastSynced);
assert.equal(reconciledOnMobile.length, 1, 'Mobile must immediately remove deleted trip when Web deletes it');
assert.equal(reconciledOnMobile[0].inviteCode, 'TW-JAPA-1111');
assert.equal(reconciledOnMobile[0].title, 'Giappone Modificato');

// Test 11d: Cloud trip deletion invariants (single-member delete vs multi-member leave)
function planCloudTripDeletion(trip, userUid) {
  const remainingUids = (trip.memberUids || []).filter((u) => u !== userUid);
  if (remainingUids.length === 0) {
    return { action: 'DELETE_DOC', inviteCode: trip.inviteCode };
  }
  return { action: 'UPDATE_DOC', inviteCode: trip.inviteCode, remainingUids };
}

const soloTrip = { inviteCode: 'TW-SOLO-1111', memberUids: ['uid_alice'] };
assert.deepEqual(planCloudTripDeletion(soloTrip, 'uid_alice'), {
  action: 'DELETE_DOC',
  inviteCode: 'TW-SOLO-1111'
});

const sharedTrip = { inviteCode: 'TW-COUPLE-2222', memberUids: ['uid_alice', 'uid_bob'] };
assert.deepEqual(planCloudTripDeletion(sharedTrip, 'uid_alice'), {
  action: 'UPDATE_DOC',
  inviteCode: 'TW-COUPLE-2222',
  remainingUids: ['uid_bob']
});

// Test 11d-2: Tombstone invariant prevents resurrection of locally deleted trips
function reconcileWithTombstones(localTrips, remoteTrips, tombstonesMap) {
  const mergedMap = new Map();
  for (const lt of localTrips) {
    if (!tombstonesMap.has(lt.inviteCode)) {
      mergedMap.set(lt.inviteCode, lt);
    }
  }

  for (const rt of remoteTrips) {
    const deletedAt = tombstonesMap.get(rt.inviteCode);
    if (deletedAt && (!rt.updatedAt || rt.updatedAt <= deletedAt)) {
      continue; // Block resurrection of locally deleted trip
    }
    mergedMap.set(rt.inviteCode, rt);
  }

  return Array.from(mergedMap.values());
}

// User deletes TW-PARI-2222 on mobile at timestamp 5000:
const tombstones = new Map([['TW-PARI-2222', 5000]]);
const staleRemoteSnapshot = [
  { id: 't1', inviteCode: 'TW-JAPA-1111', title: 'Giappone', updatedAt: 4000 },
  { id: 't2', inviteCode: 'TW-PARI-2222', title: 'Parigi (in-flight snapshot)', updatedAt: 4500 }
];
const localAfterDeletion = [
  { id: 't1', inviteCode: 'TW-JAPA-1111', title: 'Giappone', updatedAt: 4000 }
];

const protectedTrips = reconcileWithTombstones(localAfterDeletion, staleRemoteSnapshot, tombstones);
assert.equal(protectedTrips.length, 1, 'Tombstoned trip must NEVER be resurrected by in-flight or cached remote query');
assert.equal(protectedTrips[0].inviteCode, 'TW-JAPA-1111');

// Test 11e: Instant Mobile Reload Hydration Invariants (eliminates unauthenticated flash)
const mockStorage = new Map();
const fakeLocalStorage = {
  getItem: (k) => mockStorage.get(k) || null,
  setItem: (k, v) => mockStorage.set(k, String(v)),
  removeItem: (k) => mockStorage.delete(k)
};

const USER_CACHE_STORAGE_KEY = 'tripwise_auth_user_cache_v1';
function simulatePersistCachedUser(user) {
  if (user) {
    fakeLocalStorage.setItem(USER_CACHE_STORAGE_KEY, JSON.stringify(user));
  } else {
    fakeLocalStorage.removeItem(USER_CACHE_STORAGE_KEY);
  }
}

function simulateLoadCachedUser() {
  const raw = fakeLocalStorage.getItem(USER_CACHE_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.uid === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

// 1. Authenticated user saves profile to fast cache
const aliceProfile = {
  uid: 'uid_alice',
  displayName: 'Alice Viaggiatrice',
  email: 'alice@example.com',
  photoURL: 'https://example.com/avatar.jpg'
};
simulatePersistCachedUser(aliceProfile);
assert.deepEqual(simulateLoadCachedUser(), aliceProfile, 'Cached user profile must be synchronously recoverable');

// 2. Mock trip saved under Alice's storage key
const aliceTripsKey = getUserTripsStorageKey(aliceProfile.uid);
const aliceTrip = {
  id: 'trip_alice_japan',
  inviteCode: 'TW-JAPA-9999',
  title: 'Viaggio in Giappone',
  destination: 'Tokyo & Kyoto',
  emoji: '🌸',
  days: [{ id: 'd1', dayNumber: 1, date: '2026-11-22', title: 'Arrivo', activities: [] }],
  expenses: [],
  bookings: [],
  checklist: [],
  members: [],
  updatedAt: Date.now()
};
fakeLocalStorage.setItem(aliceTripsKey, JSON.stringify([aliceTrip]));
fakeLocalStorage.setItem(getUserActiveTripStorageKey(aliceProfile.uid), aliceTrip.id);

// 3. Hydration check on page reload (Frame 0 before network or Firebase SDK response)
const rehydratedUser = simulateLoadCachedUser();
assert.ok(rehydratedUser, 'User must not be null on initial frame');
assert.equal(rehydratedUser.uid, 'uid_alice');

const rehydratedTrips = JSON.parse(fakeLocalStorage.getItem(getUserTripsStorageKey(rehydratedUser.uid)));
assert.equal(rehydratedTrips.length, 1, 'Trips must be immediately present from local storage cache');

const rehydratedActiveId = fakeLocalStorage.getItem(getUserActiveTripStorageKey(rehydratedUser.uid));
const activeTripInstance = rehydratedTrips.find((t) => t.id === rehydratedActiveId);
assert.ok(activeTripInstance, 'Active trip must be resolved on Frame 0 so mobile never flashes unauthenticated/onboarding view');
assert.equal(activeTripInstance.title, 'Viaggio in Giappone');

// 4. Sign-out clears the cache
simulatePersistCachedUser(null);
assert.equal(simulateLoadCachedUser(), null, 'Signing out must purge the cached user profile');

// Test 11f: Auth readiness gate prevents premature 'null' emission during startup (FOUC prevention)
async function simulateAuthSubscription({ hasPersistedSession, currentUser }) {
  const events = [];
  let isCancelled = false;
  let authListener = null;

  // Simulate Firebase Auth instance
  const auth = {
    currentUser: hasPersistedSession ? currentUser : null,
    authStateReady: async () => {
      // Simulate asynchronous IndexedDB check delay
      await new Promise((r) => setTimeout(r, 10));
    },
    onAuthStateChanged: (cb) => {
      authListener = cb;
      // Immediately invokes with settled currentUser
      setTimeout(() => {
        if (!isCancelled) cb(auth.currentUser);
      }, 0);
      return () => { authListener = null; };
    }
  };

  const callback = (u) => {
    events.push(u ? u.uid : null);
  };

  // Modern auth subscription with authStateReady gate
  await auth.authStateReady();
  if (!isCancelled) {
    auth.onAuthStateChanged((u) => {
      if (!isCancelled) callback(u);
    });
  }

  // Wait for initial microtask / listener invocation
  await new Promise((r) => setTimeout(r, 20));

  return { events, unsubscribe: () => { isCancelled = true; } };
}

const authReadyResult = await simulateAuthSubscription({
  hasPersistedSession: true,
  currentUser: { uid: 'uid_alice', displayName: 'Alice' }
});
assert.deepEqual(authReadyResult.events, ['uid_alice'], 'Auth observer must NEVER emit a premature null while session is restoring');

const unauthReadyResult = await simulateAuthSubscription({
  hasPersistedSession: false,
  currentUser: null
});
assert.deepEqual(unauthReadyResult.events, [null], 'Unauthenticated state must cleanly emit single null without glitch');

// 12. Cross-Device PDF Attachment & Companion Data Preservation Invariants (Tesler's Law)
// Test 12a: resolveItemConflict preserves local cached pdfDataUrl and qrImageDataUrl even if remote is newer
const localBookingWithDataUrl = {
  id: 'bkg_freccia_1',
  title: 'Frecciarossa 9612',
  type: 'train',
  pdfDataUrl: 'data:application/pdf;base64,JVBERi0xLjQK...',
  pdfFileName: 'Frecciarossa.pdf',
  hasPdf: true,
  updatedAt: 1000
};

const remoteBookingOffloaded = {
  id: 'bkg_freccia_1',
  title: 'Frecciarossa 9612 Modificato',
  type: 'train',
  hasPdf: true,
  pdfFileName: 'Frecciarossa.pdf',
  updatedAt: 2000 // Remote is newer but has stripped pdfDataUrl because it's in subcollection
};

const mergedBooking = mergeEntityLists(undefined, [localBookingWithDataUrl], [remoteBookingOffloaded]);
assert.equal(mergedBooking.length, 1);
assert.equal(mergedBooking[0].title, 'Frecciarossa 9612 Modificato', 'Remote newer title must win');
assert.equal(mergedBooking[0].hasPdf, true, 'hasPdf flag must remain true');
assert.equal(mergedBooking[0].pdfDataUrl, 'data:application/pdf;base64,JVBERi0xLjQK...', 'Local cached PDF dataUrl must NOT be lost');

// Test 12b: Companion added expense on Device B, Companion added PDF ticket on Device A
const tripDeviceA = {
  ...baseTripFixture,
  bookings: [localBookingWithDataUrl],
  updatedAt: 1500
};

const tripDeviceB = {
  ...baseTripFixture,
  expenses: [
    {
      id: 'exp_companion_1',
      title: 'Cena Sushi a Shinjuku',
      amount: 4500,
      currency: 'JPY',
      amountInBase: 27.69,
      paidByMemberId: 'm2',
      splitBetweenMemberIds: ['m1', 'm2'],
      category: 'food',
      date: '2026-11-22',
      updatedAt: 1600
    }
  ],
  updatedAt: 1600
};

const unifiedTrip = mergeTrips(baseTripFixture, tripDeviceA, tripDeviceB);
assert.equal(unifiedTrip.merged.bookings.length, 1, 'Device A booking must be preserved');
assert.equal(unifiedTrip.merged.bookings[0].hasPdf, true);
assert.equal(unifiedTrip.merged.expenses.length, 1, 'Device B expense must be preserved');
assert.equal(unifiedTrip.merged.expenses[0].id, 'exp_companion_1');

// 13. Checklist Category Separation & Legacy Migration Invariants (Miller's Law & Postel's Law)
function normalizeChecklistCategory(category, text = '') {
  if (category === 'health_money') {
    const isHealth = /medic|farmac|salut|sanit|cerott|vaccin|pronto soccorso|visita|polizza|tampon|occhial/i.test(text);
    return isHealth ? 'health' : 'money';
  }
  const validCategories = new Set(['documents', 'electronics', 'luggage', 'health', 'money', 'other']);
  return validCategories.has(category) ? category : 'other';
}

// 13a. Legacy 'health_money' item mapping
assert.equal(
  normalizeChecklistCategory('health_money', 'Kit medicinali base da viaggio'),
  'health',
  'Health items must be categorized into health'
);
assert.equal(
  normalizeChecklistCategory('health_money', 'Farmaci personali con ricetta'),
  'health',
  'Prescription medicines must be categorized into health'
);
assert.equal(
  normalizeChecklistCategory('health_money', 'Carta prepagata/multivaluta senza commissioni estero'),
  'money',
  'Payment cards must be categorized into money'
);
assert.equal(
  normalizeChecklistCategory('health_money', 'Contanti in Yen / Carta multivaluta per prelievi ATM'),
  'money',
  'Foreign currency and ATM withdrawals must be categorized into money'
);

// 13b. Standard categories remain untouched
assert.equal(normalizeChecklistCategory('documents', 'Passaporto'), 'documents');
assert.equal(normalizeChecklistCategory('electronics', 'Powerbank'), 'electronics');
assert.equal(normalizeChecklistCategory('luggage', 'K-Way'), 'luggage');
assert.equal(normalizeChecklistCategory('health', 'Cerotti'), 'health');
assert.equal(normalizeChecklistCategory('money', 'Carta di credito'), 'money');
assert.equal(normalizeChecklistCategory('other', 'Biglietti da visita'), 'other');
assert.equal(normalizeChecklistCategory('unknown_xyz', 'Random'), 'other');

// 13c. Custom checklist categories resolution
function resolveCategoryWithCustom(category, text = '', customIds = []) {
  if (category === 'health_money') {
    const isHealth = /medic|farmac|salut|sanit|cerott|vaccin|pronto soccorso|visita|polizza|tampon|occhial/i.test(text);
    return isHealth ? 'health' : 'money';
  }
  const standard = new Set(['documents', 'electronics', 'luggage', 'health', 'money', 'other']);
  if (standard.has(category)) return category;
  if (customIds.includes(category)) return category;
  return 'other';
}

assert.equal(
  resolveCategoryWithCustom('cat_food_1', 'Biscotti', ['cat_food_1']),
  'cat_food_1',
  'Custom category must be resolved if known'
);
assert.equal(
  resolveCategoryWithCustom('cat_deleted', 'Biscotti', ['cat_food_1']),
  'other',
  'Unrecognized or deleted custom category must gracefully fall back to other'
);

// 13d. Collaborative 3-Way Merge of customChecklistCategories
const baseTripWithCat = {
  ...baseTripFixture,
  customChecklistCategories: [
    { id: 'cat_food', label: 'Cibo & Snack', icon: 'Utensils', updatedAt: 1000 }
  ]
};
const userATripWithCat = {
  ...baseTripWithCat,
  customChecklistCategories: [
    { id: 'cat_food', label: 'Cibo & Snack Modificato', icon: 'Utensils', updatedAt: 2000 },
    { id: 'cat_trekking', label: 'Trekking', icon: 'Mountain', updatedAt: 2000 }
  ]
};
const userBTripWithCat = {
  ...baseTripWithCat,
  customChecklistCategories: [
    { id: 'cat_food', label: 'Cibo & Snack', icon: 'Utensils', updatedAt: 1000 },
    { id: 'cat_photo', label: 'Foto & Video', icon: 'Camera', updatedAt: 2001 }
  ]
};

const mergedCustomCats = mergeEntityLists(
  baseTripWithCat.customChecklistCategories,
  userATripWithCat.customChecklistCategories,
  userBTripWithCat.customChecklistCategories
);

assert.equal(mergedCustomCats.length, 3, 'Both user additions (Trekking + Photo) and modified Food must be preserved');
const foodCat = mergedCustomCats.find((c) => c.id === 'cat_food');
assert.equal(foodCat.label, 'Cibo & Snack Modificato', 'User A newer update must win');
assert.ok(mergedCustomCats.some((c) => c.id === 'cat_trekking'));
assert.ok(mergedCustomCats.some((c) => c.id === 'cat_photo'));

// 14. Local Storage Attachment Stripping & Instant Offline Indicator Invariants (Tesler's Law & Doherty Threshold)
function stripHeavyAttachmentsForStorage(trips) {
  return trips.map((t) => ({
    ...t,
    bookings: (t.bookings || []).map((b) => {
      if (b.pdfDataUrl) {
        const { pdfDataUrl: _omitted, ...rest } = b;
        return {
          ...rest,
          hasPdf: true
        };
      }
      return {
        ...b,
        hasPdf: Boolean(b.hasPdf || b.pdfDataUrl || b.pdfFileName)
      };
    })
  }));
}

const tripToSave = [{
  id: 'trip_1',
  bookings: [
    {
      id: 'bkg_1',
      title: 'Italo Roma-Milano',
      pdfDataUrl: 'data:application/pdf;base64,QUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo=',
      pdfFileName: 'Italo_Roma_Milano.pdf',
      pdfFileSize: 512000
    }
  ]
}];

const sanitized = stripHeavyAttachmentsForStorage(tripToSave);
assert.equal(sanitized[0].bookings[0].pdfDataUrl, undefined, 'pdfDataUrl must be stripped from local storage to prevent 5MB quota errors');
assert.equal(sanitized[0].bookings[0].hasPdf, true, 'hasPdf must be true so the PDF strip and open button render immediately on reload');
assert.equal(sanitized[0].bookings[0].pdfFileName, 'Italo_Roma_Milano.pdf', 'pdfFileName must be preserved');
assert.equal(sanitized[0].bookings[0].pdfFileSize, 512000, 'pdfFileSize must be preserved');

// 15. Companion Join with Custom Display Name & Slot Claiming Invariants (Jakob's & Postel's Laws)
function computeJoinedMembers(currentMembers, currentUids, user, customDisplayName) {
  const isAlreadyMember = currentUids.includes(user.uid);
  const updatedUids = isAlreadyMember ? currentUids : [...currentUids, user.uid];

  const trimmedCustom = customDisplayName?.trim();
  const chosenName = trimmedCustom || user.displayName || 'Compagno';

  let updatedMembers = [...currentMembers];
  let existingIndex = updatedMembers.findIndex((m) => m.uid === user.uid);

  if (existingIndex === -1) {
    existingIndex = updatedMembers.findIndex(
      (m) =>
        !m.uid &&
        (m.name.trim().toLowerCase() === chosenName.toLowerCase() ||
          (user.displayName && m.name.trim().toLowerCase() === user.displayName.trim().toLowerCase()))
    );
  }

  if (existingIndex >= 0) {
    const prev = updatedMembers[existingIndex];
    updatedMembers[existingIndex] = {
      ...prev,
      name: chosenName,
      uid: user.uid,
      photoURL: user.photoURL || prev.photoURL,
      updatedAt: Date.now()
    };
  } else {
    updatedMembers.push({
      id: `mem_${Date.now()}`,
      name: chosenName,
      color: '#4f46e5',
      uid: user.uid,
      photoURL: user.photoURL || undefined,
      updatedAt: Date.now()
    });
  }

  return { updatedUids, updatedMembers };
}

// 15a: Appending new member with custom chosen name
const initialTripMembers = [
  { id: 'm1', name: 'Lorenzo', uid: 'uid_lorenzo', color: '#4f46e5' }
];
const joinRes1 = computeJoinedMembers(
  initialTripMembers,
  ['uid_lorenzo'],
  { uid: 'uid_marco', displayName: 'Marco Rossi', photoURL: null },
  'Mark'
);
assert.equal(joinRes1.updatedMembers.length, 2, 'New member must be added');
assert.equal(joinRes1.updatedMembers[1].name, 'Mark', 'Display name must match custom name entered by user');
assert.equal(joinRes1.updatedMembers[1].uid, 'uid_marco');
assert.deepEqual(joinRes1.updatedUids, ['uid_lorenzo', 'uid_marco']);

// 15b: Claiming an unassigned member placeholder slot created by trip organizer
const tripWithPlaceholder = [
  { id: 'm1', name: 'Lorenzo', uid: 'uid_lorenzo', color: '#4f46e5' },
  { id: 'm2', name: 'Chiara', color: '#ec4899' } // placeholder with no uid
];
const joinRes2 = computeJoinedMembers(
  tripWithPlaceholder,
  ['uid_lorenzo'],
  { uid: 'uid_chiara', displayName: 'Chiara B.', photoURL: 'https://photo.url' },
  'Chiara'
);
assert.equal(joinRes2.updatedMembers.length, 2, 'Placeholder member slot must be claimed, not duplicated');
assert.equal(joinRes2.updatedMembers[1].id, 'm2');
assert.equal(joinRes2.updatedMembers[1].name, 'Chiara');
assert.equal(joinRes2.updatedMembers[1].uid, 'uid_chiara');
assert.equal(joinRes2.updatedMembers[1].photoURL, 'https://photo.url');

// 15c: Existing member updating their display name in the trip
const joinRes3 = computeJoinedMembers(
  joinRes2.updatedMembers,
  joinRes2.updatedUids,
  { uid: 'uid_chiara', displayName: 'Chiara B.' },
  'Chiaretta'
);
assert.equal(joinRes3.updatedMembers.length, 2);
assert.equal(joinRes3.updatedMembers[1].name, 'Chiaretta', 'Existing participant name must be updated');
assert.equal(joinRes3.updatedMembers[1].uid, 'uid_chiara');

// 15d: Empty custom name fallback to user.displayName or Compagno
const joinRes4 = computeJoinedMembers(
  initialTripMembers,
  ['uid_lorenzo'],
  { uid: 'uid_guest', displayName: 'Giulia' },
  '   '
);
assert.equal(joinRes4.updatedMembers[1].name, 'Giulia', 'Whitespace custom name must fall back to user displayName');

// 16. Tab Navigation, URL Aliases & Selection Persistence Invariants (Jakob's Law & Postel's Law)
function normalizeTabParam(raw) {
  if (!raw) return null;
  const clean = String(raw).trim().toLowerCase();
  if (clean === 'itinerary' || clean === 'itinerario' || clean === 'map' || clean === 'mappa') return 'itinerary';
  if (clean === 'places' || clean === 'luoghi' || clean === 'preferiti') return 'places';
  if (clean === 'expenses' || clean === 'spese' || clean === 'pareggio') return 'expenses';
  if (clean === 'bookings' || clean === 'biglietti' || clean === 'tickets' || clean === 'prenotazioni') return 'bookings';
  if (clean === 'checklist' || clean === 'todo') return 'checklist';
  return null;
}

function resolveActiveTab(urlSearch, urlHash, localStorageValue) {
  const params = new URLSearchParams(urlSearch || '');
  const fromQuery = normalizeTabParam(params.get('tab'));
  if (fromQuery) return fromQuery;

  const cleanHash = (urlHash || '').replace(/^#/, '');
  const fromHash = normalizeTabParam(cleanHash);
  if (fromHash) return fromHash;

  const fromStorage = normalizeTabParam(localStorageValue);
  if (fromStorage) return fromStorage;

  return 'itinerary';
}

function resolveDayIndex(urlSearch, localStorageValue, daysLength) {
  if (daysLength <= 0) return 0;
  const params = new URLSearchParams(urlSearch || '');
  const dayParam = params.get('day');
  if (dayParam) {
    const parsed = parseInt(dayParam, 10);
    if (!isNaN(parsed)) {
      const candidate = parsed > 0 ? parsed - 1 : 0;
      if (candidate >= 0 && candidate < daysLength) return candidate;
    }
  }
  if (localStorageValue) {
    const parsed = parseInt(localStorageValue, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed < daysLength) return parsed;
  }
  return 0;
}

// 16a: Normalization of Italian and English aliases
assert.equal(normalizeTabParam('bookings'), 'bookings');
assert.equal(normalizeTabParam('biglietti'), 'bookings');
assert.equal(normalizeTabParam('tickets'), 'bookings');
assert.equal(normalizeTabParam('prenotazioni'), 'bookings');
assert.equal(normalizeTabParam('spese'), 'expenses');
assert.equal(normalizeTabParam('expenses'), 'expenses');
assert.equal(normalizeTabParam('itinerario'), 'itinerary');
assert.equal(normalizeTabParam('itinerary'), 'itinerary');
assert.equal(normalizeTabParam('luoghi'), 'places');
assert.equal(normalizeTabParam('preferiti'), 'places');
assert.equal(normalizeTabParam('checklist'), 'checklist');
assert.equal(normalizeTabParam('unknown_tab'), null);

// 16b: URL Query priority on page reload (stay on tickets view on F5)
assert.equal(resolveActiveTab('?tab=bookings', '', 'itinerary'), 'bookings', 'URL ?tab=bookings must keep user on bookings view upon page refresh');
assert.equal(resolveActiveTab('?tab=biglietti', '', 'itinerary'), 'bookings', 'Italian alias ?tab=biglietti must resolve to bookings');
assert.equal(resolveActiveTab('?tab=spese', '', 'itinerary'), 'expenses');
assert.equal(resolveActiveTab('', '#checklist', 'itinerary'), 'checklist');
assert.equal(resolveActiveTab('', '', 'bookings'), 'bookings', 'LocalStorage must preserve last active tab when URL param is missing');
assert.equal(resolveActiveTab('', '', null), 'itinerary', 'Fallback must be itinerary when neither URL nor storage is set');

// 16c: Day index selection & persistence invariants
assert.equal(resolveDayIndex('?day=3', null, 5), 2, 'Day 3 in 1-based URL must resolve to index 2 (0-based)');
assert.equal(resolveDayIndex('?day=1', null, 5), 0);
assert.equal(resolveDayIndex('?day=99', '1', 5), 1, 'Out of bounds URL day must fall back to valid stored day');
assert.equal(resolveDayIndex('', '3', 5), 3, 'Stored day index 3 must be respected when no URL day is present');

// 17. 20-Tour Global Itinerary Training Loop & Precision Benchmark (100% Score)
const benchmarkResult = runEvaluationHarness();
assert.equal(benchmarkResult.passedCases, benchmarkResult.totalCases, 'All 20 global itinerary benchmark tours must pass');
assert.equal(benchmarkResult.precisionScore, 100, 'Evaluation harness must achieve 100% precision score');

// 18. Audit Verification: Sync, Merge, Loading, Delete & Add Edge Cases
// 18a: mergeItineraryDays duplicate day prevention when days match by date
const baseMergeDays = [
  { id: 'd_base_1', dayNumber: 1, date: '2026-11-20', title: 'Giorno 1', activities: [] }
];
const localMergeDays = [
  { id: 'd_local_1', dayNumber: 1, date: '2026-11-20', title: 'Roma Antica', activities: [{ id: 'a_colosseo', title: 'Colosseo' }] }
];
const remoteMergeDays = [
  { id: 'd_remote_1', dayNumber: 1, date: '2026-11-20', title: 'Roma Centro', activities: [{ id: 'a_pantheon', title: 'Pantheon' }] }
];
const reconciledDays = mergeItineraryDays(baseMergeDays, localMergeDays, remoteMergeDays);
assert.equal(reconciledDays.length, 1, 'Matching date days must NOT be duplicated');
assert.equal(reconciledDays[0].activities.length, 2, 'Activities from both local and remote must be merged');
assert.ok(reconciledDays[0].activities.some((a) => a.id === 'a_colosseo'));
assert.ok(reconciledDays[0].activities.some((a) => a.id === 'a_pantheon'));

// 18b: mergeItineraryDays day rename preservation during concurrent deletion
const baseDayForRename = [
  { id: 'd_1', dayNumber: 1, date: '2026-11-20', title: 'Giorno 1', activities: [] }
];
const localRenamedDay = [
  { id: 'd_1', dayNumber: 1, date: '2026-11-20', title: 'Arrivo a Kyoto', activities: [] }
];
const remoteDeletedDay = []; // Remote collaborator deleted day 1
const mergedRenamedDay = mergeItineraryDays(baseDayForRename, localRenamedDay, remoteDeletedDay);
assert.equal(mergedRenamedDay.length, 1, 'Local rename on deleted day must be preserved to prevent accidental data loss');
assert.equal(mergedRenamedDay[0].title, 'Arrivo a Kyoto');

// 18c: mergeTrips 3-way memberUids reconciliation without resurrecting deleted companion UIDs
const baseTripWithUids = {
  ...baseTripFixture,
  memberUids: ['uid_owner', 'uid_companion_to_remove'],
  members: [
    { id: 'mem_1', name: 'Io', color: '#4f46e5', uid: 'uid_owner' },
    { id: 'mem_2', name: 'Ex Compagno', color: '#0ea5e9', uid: 'uid_companion_to_remove' }
  ]
};
const localTripRemovedCompanion = {
  ...baseTripWithUids,
  memberUids: ['uid_owner'],
  members: [{ id: 'mem_1', name: 'Io', color: '#4f46e5', uid: 'uid_owner' }],
  updatedAt: 2000
};
const remoteTripUntouched = {
  ...baseTripWithUids,
  updatedAt: 1000
};
const mergeResultUid = mergeTrips(baseTripWithUids, localTripRemovedCompanion, remoteTripUntouched);
assert.ok(!mergeResultUid.merged.memberUids.includes('uid_companion_to_remove'), 'Deleted companion UID must NOT be resurrected by baseTrip');
assert.equal(mergeResultUid.merged.members.length, 1);
assert.equal(mergeResultUid.merged.members[0].uid, 'uid_owner');

// 18d: Safe Attachment Hydration does not overwrite newer activities or expenses
const staleHydratedTrip = {
  id: 'trip_1',
  bookings: [{ id: 'b_1', title: 'Volo', pdfDataUrl: 'data:application/pdf;base64,hydrated' }],
  expenses: [],
  days: [{ id: 'd_1', activities: [] }]
};
const currentTripWithNewEdits = {
  id: 'trip_1',
  bookings: [{ id: 'b_1', title: 'Volo' }], // missing pdfDataUrl
  expenses: [{ id: 'exp_new', title: 'Pranzo', amount: 25 }], // newly added expense
  days: [{ id: 'd_1', activities: [{ id: 'act_new', title: 'Museo' }] }] // newly added activity
};

function safeHydrate(currentTrips, hydratedTrips) {
  return currentTrips.map((currentTrip) => {
    const match = hydratedTrips.find((h) => h.id === currentTrip.id);
    if (!match || !match.bookings) return currentTrip;
    let changed = false;
    const nextBookings = (currentTrip.bookings || []).map((b) => {
      if (b.pdfDataUrl) return b;
      const hydratedBooking = match.bookings?.find((hb) => hb.id === b.id);
      if (hydratedBooking?.pdfDataUrl) {
        changed = true;
        return {
          ...b,
          pdfDataUrl: hydratedBooking.pdfDataUrl,
          hasPdf: true
        };
      }
      return b;
    });
    return changed ? { ...currentTrip, bookings: nextBookings } : currentTrip;
  });
}

const safelyHydrated = safeHydrate([currentTripWithNewEdits], [staleHydratedTrip]);
assert.equal(safelyHydrated[0].bookings[0].pdfDataUrl, 'data:application/pdf;base64,hydrated', 'PDF attachment must be injected');
assert.equal(safelyHydrated[0].expenses.length, 1, 'Newly added expense must NOT be wiped out by async attachment hydration');
assert.equal(safelyHydrated[0].expenses[0].id, 'exp_new');
assert.equal(safelyHydrated[0].days[0].activities.length, 1, 'Newly added activity must NOT be wiped out');
assert.equal(safelyHydrated[0].days[0].activities[0].id, 'act_new');

// 19. Bugfix Invariants: Expense Deletion Honors Remote Sync & Sanitized Cloud Payloads
// 19a. Expense deletion with existing local baseline: remote deletion must NOT be resurrected even if baseTrip was not previously cached
const tripWithExpenseA = {
  ...baseTripFixture,
  expenses: [{ id: 'exp_to_delete', title: 'Pizza', amount: 15 }]
};
const remoteTripDeletedExpense = {
  ...baseTripFixture,
  expenses: [] // Remote companion deleted it
};
// If baseTrip was null previously, fallback to existing local trip prevents resurrection:
const resolvedDeletionMerge = mergeTrips(tripWithExpenseA, tripWithExpenseA, remoteTripDeletedExpense);
assert.equal(resolvedDeletionMerge.merged.expenses.length, 0, 'Expense deleted on remote companion device must be honored without resurrection');

// 19b. Payload sanitization for cloud push: empty customChecklistCategories stripped, non-empty preserved
function sanitizeTripForCloud(trip) {
  const finalPayload = { ...trip };
  if (Array.isArray(finalPayload.customChecklistCategories) && finalPayload.customChecklistCategories.length === 0) {
    delete finalPayload.customChecklistCategories;
  }
  return finalPayload;
}
const sanitizedEmpty = sanitizeTripForCloud({ ...baseTripFixture, customChecklistCategories: [] });
assert.equal(sanitizedEmpty.customChecklistCategories, undefined, 'Empty customChecklistCategories must be omitted so rules do not reject write');

const sanitizedWithCategories = sanitizeTripForCloud({ ...baseTripFixture, customChecklistCategories: [{ id: 'cat_1', label: 'Trekking' }] });
assert.equal(sanitizedWithCategories.customChecklistCategories.length, 1, 'Non-empty customChecklistCategories must be preserved');

// 20. Bugfix Invariants: Concurrent Expense Collaboration & React 18 Reducer Idempotency
// 20a. Multi-pass Reducer Idempotency: Remote expense addition MUST NEVER be obliterated on double invocation
const localTripNoExpenses = {
  ...baseTripFixture,
  expenses: []
};
const remoteTripWithNewExpense = {
  ...baseTripFixture,
  expenses: [{ id: 'exp_companion_1', title: 'Pranzo Ramen', amount: 24, paidById: 'mem_companion', splitWith: ['mem_companion', 'mem_user'], currency: 'EUR', date: '2026-11-01', category: 'food' }]
};

// Snapshot base taken BEFORE reducer execution:
const baseTripsSnapshotMap = new Map();
baseTripsSnapshotMap.set(baseTripFixture.inviteCode, { ...baseTripFixture, expenses: [] });

// Pass 1:
const base1 = baseTripsSnapshotMap.get(baseTripFixture.inviteCode) || null;
const pass1Result = mergeTrips(base1, localTripNoExpenses, remoteTripWithNewExpense);
assert.equal(pass1Result.merged.expenses.length, 1, 'Pass 1 must retain the new remote expense');
assert.equal(pass1Result.merged.expenses[0].id, 'exp_companion_1');

// Pass 2 (Simulating React 18 updater re-running before commit):
// In the fixed architecture, baseTripsSnapshotMap was NOT mutated during Pass 1
const base2 = baseTripsSnapshotMap.get(baseTripFixture.inviteCode) || null;
const pass2Result = mergeTrips(base2, localTripNoExpenses, remoteTripWithNewExpense);
assert.equal(pass2Result.merged.expenses.length, 1, 'Pass 2 must STILL retain the new remote expense and not treat it as a deletion');
assert.equal(pass2Result.merged.expenses[0].id, 'exp_companion_1');

// 20b. Bidirectional Sync Safety: Concurrent local and remote expenses preserved without loss
const localWithMyExpense = {
  ...baseTripFixture,
  expenses: [{ id: 'exp_my_coffee', title: 'Caffè', amount: 3, paidById: 'mem_user', splitWith: ['mem_user'], currency: 'EUR', date: '2026-11-01', category: 'food' }]
};
const bidirectionalMerge = mergeTrips(base1, localWithMyExpense, remoteTripWithNewExpense);
assert.equal(bidirectionalMerge.merged.expenses.length, 2, 'Bidirectional sync must preserve both local and remote concurrent expenses');
assert.ok(bidirectionalMerge.merged.expenses.some((e) => e.id === 'exp_my_coffee'), 'Local expense preserved');
assert.ok(bidirectionalMerge.merged.expenses.some((e) => e.id === 'exp_companion_1'), 'Remote expense preserved');
assert.equal(bidirectionalMerge.hasLocalChanges, true, 'Resulting merge has local changes to safely push to cloud');

// 21. Bugfix Invariant: Consecutive Remote Expense Synchronization (Expense 1, then Expense 2, then Expense 3)
// Simulates sequential snapshot arrivals on Device 1 when Device 2 adds consecutive expenses in the same session
let currentDevice1Trip = { ...baseTripFixture, expenses: [] };
let lastSyncedTripDevice1 = { ...baseTripFixture, expenses: [] };

// Step 1: Device 2 adds Expense 1
const expSnap1 = { id: 'exp_seq_1', title: 'Pranzo', amount: 30, paidById: 'mem_2', splitWith: ['mem_1', 'mem_2'], currency: 'EUR', date: '2026-11-01', category: 'food', updatedAt: 1000 };
const remoteSnap1 = { ...baseTripFixture, expenses: [expSnap1], updatedAt: 1000 };

const mergeStep1 = mergeTrips(lastSyncedTripDevice1, currentDevice1Trip, remoteSnap1);
assert.equal(mergeStep1.merged.expenses.length, 1, 'Step 1: Device 1 must receive Expense 1');
assert.equal(mergeStep1.merged.expenses[0].id, 'exp_seq_1');
currentDevice1Trip = mergeStep1.merged;
lastSyncedTripDevice1 = remoteSnap1;

// Step 2: Device 2 adds Expense 2 (consecutive write without full reload)
const expSnap2 = { id: 'exp_seq_2', title: 'Metro', amount: 5, paidById: 'mem_2', splitWith: ['mem_1', 'mem_2'], currency: 'EUR', date: '2026-11-01', category: 'transport', updatedAt: 1100 };
const remoteSnap2 = { ...baseTripFixture, expenses: [expSnap2, expSnap1], updatedAt: 1100 };

const mergeStep2 = mergeTrips(lastSyncedTripDevice1, currentDevice1Trip, remoteSnap2);
assert.equal(mergeStep2.merged.expenses.length, 2, 'Step 2: Device 1 must receive Expense 2 and retain Expense 1');
assert.ok(mergeStep2.merged.expenses.some(e => e.id === 'exp_seq_1'), 'Expense 1 must still be present in Step 2');
assert.ok(mergeStep2.merged.expenses.some(e => e.id === 'exp_seq_2'), 'Expense 2 must be present in Step 2');
currentDevice1Trip = mergeStep2.merged;
lastSyncedTripDevice1 = remoteSnap2;

// Step 3: Device 2 adds Expense 3
const expSnap3 = { id: 'exp_seq_3', title: 'Museo', amount: 15, paidById: 'mem_2', splitWith: ['mem_1', 'mem_2'], currency: 'EUR', date: '2026-11-01', category: 'sightseeing', updatedAt: 1200 };
const remoteSnap3 = { ...baseTripFixture, expenses: [expSnap3, expSnap2, expSnap1], updatedAt: 1200 };

const mergeStep3 = mergeTrips(lastSyncedTripDevice1, currentDevice1Trip, remoteSnap3);
assert.equal(mergeStep3.merged.expenses.length, 3, 'Step 3: Device 1 must receive Expense 3 and retain all prior expenses');
assert.equal(mergeStep3.hasLocalChanges, false, 'No local changes expected on purely incoming remote stream');

console.log('✓ Domain tests passed (Currency parser + Date reconciliation + Natural Itinerary Engine + Hierarchical Outlines + 20-Tour Evaluation Loop + PDF Bookings + Collaborative 3-Way Array ID Merging + Cover Photo Metadata Merge + Trip Deletion Invariants + Move Activity Invariants + Weather Engine, Clustering & Hourly Arrival Timing + Add Day Start/End + Auth Gate & Cross-Device Cloud Parity + PDF Attachment Preservation + Checklist Category Separation & Custom Categories + LocalStorage Quota Shield + Custom Companion Display Name + Tab & Selection State Invariants + Audit Verification: Sync, Merge, Loading, Delete & Add Edge Cases + Expense Deletion & Cloud Sanitization Invariants + React 18 Reducer Idempotency & Expense Sync Parity + Consecutive Remote Expense Synchronization)');
