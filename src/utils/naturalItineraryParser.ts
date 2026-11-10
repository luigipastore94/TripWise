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

import { KNOWN_PLACES_DB, type KnownPlaceEntry } from '../data/knownPlaces.ts';
import { CITY_CATALOG, type CityInfo } from '../data/cityCatalog.ts';

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
  const trimmed = (text || '').trim();
  if (!trimmed) return '';
  if (trimmed === trimmed.toUpperCase() && trimmed.length <= 18) {
    return trimmed
      .toLowerCase()
      .replace(/\b\p{L}/gu, (ch) => ch.toUpperCase());
  }
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function lookupCityInfo(rawName: string): CityInfo | undefined {
  if (!rawName) return undefined;
  const key = rawName.trim().toLowerCase();
  if (CITY_CATALOG[key]) return CITY_CATALOG[key];

  let bestMatch: CityInfo | undefined;
  let bestLen = 0;
  for (const [k, info] of Object.entries(CITY_CATALOG)) {
    // Avoid false matching 'porto' when used as Italian noun (harbor/port)
    if (k === 'porto') {
      const isHarborNoun =
        /\b(?:lungo\s+il|al|del|nel|dal|sul|in|di)\s+porto\b/i.test(key) ||
        /\bporto\s+(?:turistico|canale|vecchio|antico|mercantile|passeggeri)\b/i.test(key) ||
        /\b(?:porto|porto\s+di)\s+(?:catania|napoli|palermo|ancona|genova|livorno|civitavecchia|brindisi|bari|trieste|venezia)\b/i.test(key);
      if (isHarborNoun && !/\bportogallo\b/i.test(key)) {
        continue;
      }
    }

    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b${escaped}\\b`, 'i');
    if (re.test(key)) {
      if (k.length > bestLen) {
        bestLen = k.length;
        bestMatch = info;
      }
    }
  }
  return bestMatch;
}

export function normalizeDiacritics(str: string): string {
  return str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

export function lookupKnownPlace(
  rawText: string,
  context?: string | { baseCity?: string; countryPresetId?: string }
): KnownPlaceEntry | undefined {
  if (!rawText) return undefined;

  const ctxObj = typeof context === 'string' ? { baseCity: context } : context;

  // Filter out negation, past comparison, and distance backdrop phrases
  const sanitized = rawText
    .replace(/\([^)]*(?:senza\s+(?:entrare|visitare)|avendo\s+gi[àa]\s+visitato|gi[àa]\s+visto|rispetto\s+a)[^)]*\)/gi, ' ')
    .replace(/\b(?:senza\s+(?:entrare|visitare)|avendo\s+gi[àa]\s+visitato|gi[àa]\s+visto)\s+[^,.;()]+/gi, ' ')
    .replace(/\b(?:sagoma|profilo|vista|sfondo)\s+(?:del\s+)?(?:monte\s+fuji|fuji)\b/gi, ' ');

  const lower = sanitized.trim().toLowerCase();
  const normText = normalizeDiacritics(lower);
  let bestMatch: KnownPlaceEntry | undefined;
  let bestScore = -Infinity;

  const targetPreset =
    ctxObj?.countryPresetId ||
    (ctxObj?.baseCity ? lookupCityInfo(ctxObj.baseCity)?.countryPresetId : undefined);
  const targetCityNorm = ctxObj?.baseCity ? normalizeDiacritics(ctxObj.baseCity.toLowerCase()) : undefined;

  const GENERIC_KEYWORDS = new Set([
    'mercato del pesce',
    'mercato',
    'centro storico',
    'lungomare',
    'porto',
    'castello',
    'palazzo reale',
    'cattedrale',
    'duomo',
    'parco',
    'giardino',
    'teatro',
    'spiaggia',
    'noleggio bici',
    'noleggio biciclette',
    'bici'
  ]);

  for (const entry of KNOWN_PLACES_DB) {
    for (const kw of entry.keywords) {
      const isShort = kw.length <= 4;
      const normKw = normalizeDiacritics(kw);

      const reLower = isShort
        ? new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
        : new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

      const reNorm = isShort
        ? new RegExp(`\\b${normKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
        : new RegExp(normKw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

      if (reLower.test(lower) || reNorm.test(normText)) {
        // If keyword is generic, guard against cross-country/city hallucination
        if (GENERIC_KEYWORDS.has(kw.toLowerCase()) && targetCityNorm) {
          const entryLoc = normalizeDiacritics(entry.locationName || '');
          const entryCan = normalizeDiacritics(entry.canonicalName || '');
          const entryCity = entry.city ? normalizeDiacritics(entry.city) : '';
          if (
            !entryLoc.includes(targetCityNorm) &&
            !entryCan.includes(targetCityNorm) &&
            entryCity !== targetCityNorm
          ) {
            continue;
          }
        }

        let score = kw.length;
        if (targetPreset) {
          if (entry.countryPresetId === targetPreset) {
            score += 1000;
          } else if (entry.countryPresetId && entry.countryPresetId !== targetPreset) {
            score -= 5000;
          }
        }
        if (targetCityNorm) {
          const locNorm = normalizeDiacritics(entry.locationName.toLowerCase());
          const cityNorm = entry.city ? normalizeDiacritics(entry.city.toLowerCase()) : '';
          if (locNorm.includes(targetCityNorm) || cityNorm === targetCityNorm) {
            score += 500;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestMatch = entry;
        }
      }
    }
  }
  return bestMatch;
}

const INVISIBLE_CHARS_RE = /[\u200B-\u200D\u2060\uFEFF\u00AD]/g;

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
  let working = raw.replace(INVISIBLE_CHARS_RE, '').trim();
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

  // 0. Pipe syntax e.g. "<TimeOrRange> | <Content>"
  const pipeIdx = working.indexOf('|');
  if (pipeIdx > 0 && pipeIdx < 45) {
    const timePortion = working.slice(0, pipeIdx).trim();
    const rightPortion = working.slice(pipeIdx + 1).trim();

    // Range with optional parens/slashes or sunset: "09:00 – 11:30", "13:20 (o 14:20) – 17:30/18:30", "12:30 – Tramonto"
    const rangeMatch = timePortion.match(
      /^(?:dalle?\s+)?([0-2]?\d[:.][0-5]\d)(?:\s*\([^)]*\))?\s*(?:-|–|—)\s*([0-2]?\d[:.][0-5]\d(?:(?:\/|\s*o\s*)[0-2]?\d[:.][0-5]\d)?|tramonto)$/i
    );
    if (rangeMatch) {
      const rawStart = rangeMatch[1].replace('.', ':');
      const [hh, mm] = rawStart.split(':').map(Number);
      explicitTime = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      if (rangeMatch[2].toLowerCase() === 'tramonto') {
        timeBucket = 'sunset';
        extraNote = `Permanenza: ${timePortion}`;
      } else {
        extraNote = `Fascia consigliata: ${timePortion}`;
      }
      working = rightPortion;
    } else {
      // Single explicit time e.g. "12:00", "Dalle 16:30", "ore 08:30"
      const singleMatch = timePortion.match(/^(?:dalle?\s+|ore\s+|alle\s+|h\s*)?([0-2]?\d)[:.]([0-5]\d)$/i);
      if (singleMatch) {
        const hh = Number(singleMatch[1]);
        const mm = Number(singleMatch[2]);
        explicitTime = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
        working = rightPortion;
      } else if (/^intera\s+giornata$/i.test(timePortion)) {
        timeBucket = 'morning';
        extraNote = 'Intera giornata dedicata.';
        working = rightPortion;
      } else if (/^tarda\s+mattina\s*(?:-|–|—)\s*pomeriggio$/i.test(timePortion)) {
        timeBucket = 'late_morning';
        working = rightPortion;
      } else if (/^pomeriggio\s+e\s+tramonto$/i.test(timePortion)) {
        timeBucket = 'afternoon';
        working = rightPortion;
      } else if (/^mattina$/i.test(timePortion)) {
        timeBucket = 'morning';
        working = rightPortion;
      } else if (/^pomeriggio$/i.test(timePortion)) {
        timeBucket = 'afternoon';
        working = rightPortion;
      } else if (/^sera(?:ta)?$/i.test(timePortion)) {
        timeBucket = 'evening';
        working = rightPortion;
      }
    }
  }

  // 1. Time range with prefix e.g. "ore 06:30 - 07:00" or "07:00 - 07:30"
  if (!explicitTime) {
    const rangeTimeRe = /\b(?:ore\s*)?([0-2]?\d[:.][0-5]\d)\s*(?:-|–|—)\s*([0-2]?\d[:.][0-5]\d)\b/i;
    const rm = working.match(rangeTimeRe);
    if (rm && rm.index !== undefined) {
      const beforeMatch = working.slice(0, rm.index);
      const isInsideParens = (beforeMatch.split('(').length - 1) > (beforeMatch.split(')').length - 1);
      const isDeadline = /\b(?:chiude\s+alle|ultimo\s+ingresso\s+(?:ore|alle)?|entro\s+le|fino\s+alle|apertura\s+ore|aperti\s+dalle)\s*$/i.test(beforeMatch);
      if (!isInsideParens && !isDeadline) {
        const rawStart = rm[1].replace('.', ':');
        const [hh, mm] = rawStart.split(':').map(Number);
        explicitTime = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
        extraNote = `Fascia consigliata: ${rm[1]} - ${rm[2]}`;
        working = working.replace(rangeTimeRe, ' ').replace(/\s{2,}/g, ' ').trim();
      }
    }
  }

  // 2. Explicit time with prefix: "dalle 16:30", "ore 12.50", "ore 08:30", "ore 16", "alle 9:15", "h 14.00", "per le 11:00", "verso le 20:30"
  if (!explicitTime) {
    const prefixedTimeRe = /\b(?:con\s+arrivo\s+)?(?:dalle?\s+|ore\s+|alle\s+|h\s*|per\s+le\s+|verso\s+le\s+|intorno\s+alle\s+|circa\s+alle\s+)([0-2]?\d)(?:[:.]([0-5]\d))?\b/i;
    const pm = working.match(prefixedTimeRe);
    if (pm && pm.index !== undefined) {
      const beforeMatch = working.slice(0, pm.index);
      const isInsideParens = (beforeMatch.split('(').length - 1) > (beforeMatch.split(')').length - 1);
      const isDeadline = /\b(?:chiude\s+alle|ultimo\s+ingresso\s+(?:ore|alle)?|entro\s+le|fino\s+alle|apertura\s+ore|aperti\s+dalle)\s*$/i.test(beforeMatch);
      if (!isInsideParens && !isDeadline) {
        const hh = Math.min(Math.max(Number(pm[1]), 0), 23);
        const mm = pm[2] ? Math.min(Math.max(Number(pm[2]), 0), 59) : 0;
        explicitTime = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
        working = working.replace(prefixedTimeRe, ' ').replace(/\s{2,}/g, ' ').trim();
      }
    } else {
      // Standalone HH:MM with colon (avoiding DD/MM dates and parens)
      const colonTimeRe = /\b([01]?\d|2[0-3]):([0-5]\d)\b/;
      const cm = working.match(colonTimeRe);
      if (cm && cm.index !== undefined) {
        const beforeMatch = working.slice(0, cm.index);
        const isInsideParens = (beforeMatch.split('(').length - 1) > (beforeMatch.split(')').length - 1);
        const isDeadline = /\b(?:chiude\s+alle|ultimo\s+ingresso\s+(?:ore|alle)?|entro\s+le|fino\s+alle|apertura\s+ore|aperti\s+dalle)\s*$/i.test(beforeMatch);
        if (!isInsideParens && !isDeadline) {
          explicitTime = `${String(Number(cm[1])).padStart(2, '0')}:${cm[2]}`;
          working = working.replace(colonTimeRe, ' ').replace(/\s{2,}/g, ' ').trim();
        }
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
  } else if (/\b(?:nel\s+)?tardo\s+pomeriggio\b/i.test(working)) {
    timeBucket = 'late_afternoon';
    working = working.replace(/\b(?:nel\s+)?tardo\s+pomeriggio\b/gi, ' ').replace(/\s{2,}/g, ' ').trim();
  } else if (/\b(?:nel\s+)?pomeriggio\b/i.test(working)) {
    timeBucket = 'afternoon';
    working = working.replace(/\b(?:nel\s+)?pomeriggio\b/gi, ' ').replace(/\s{2,}/g, ' ').trim();
  } else if (/\b(?:in\s+|di\s+)?sera(?:ta|le)?(?:\s*\(light-up\))?|light-up\b/i.test(working)) {
    timeBucket = 'evening';
    working = working
      .replace(/\b(?:in\s+|di\s+)?sera(?:ta|le)?(?:\s*\(light-up\))?|light-up\b/gi, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  } else if (/\b(?:di\s+|la\s+)?mattina\b/i.test(working)) {
    timeBucket = 'morning';
    working = working.replace(/\b(?:di\s+|la\s+)?mattina\b/gi, ' ').replace(/\s{2,}/g, ' ').trim();
  }

  working = working
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/\(\s*\)/g, '')
    .replace(/\b(?:con\s+arrivo|arrivo\s+previsto|arrivo)?\s*(?:per\s+le|verso\s+le|alle|ore|h)\s*$/i, '')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/^[|,:;\-–—\s.]+|[|,:;\-–—\s.]+$/g, '')
    .trim();
  return { explicitTime, timeBucket, cleanedText: working, extraNote };
}

function inferCategory(text: string, fallback: ActivityCategory = 'sightseeing'): ActivityCategory {
  const lower = text.toLowerCase();
  // Strip "al volo" (on the fly) to prevent false transport matching with "volo" (flight)
  const lowerWithoutFalseTransport = lower.replace(/\b(?:al\s+volo|un\s+salto\s+al\s+volo)\b/gi, ' ');

  // Prioritize food when explicit culinary terms are present
  if (
    /\b(arancin[oi]|cannol[oi]|pizza|pizze|cioccolat[oa]|assaggio|degustazione|pranzo|cena|colazione|aperitivo|street\s*food|ristorante|trattoria|osteria|pasticceria|bar|vino|cantina|tapas|pici|bistecca|pecorino|paella|pad\s+thai|ramen|sushi|bloemenmarkt|fika|kanelbulle|smørrebrød|smorrebrod|birra|pilsner|birreria|café|caffè|merenda|snack|torta|gelato|gelateria|bistrot|bebek\s+betutu|tortelli)\b/i.test(
      lower
    )
  ) {
    if (!/\b(?:volo\s+di\s+rientro|volo\s+di\s+ritorno|atterraggio|partenza\s+volo)\b/i.test(lowerWithoutFalseTransport)) {
      return 'food';
    }
  }

  if (
    /\b(arrivo|atterraggio|volo|aeroporto|airtrain|rientro|ritorno|trasferimento|partenza|spostamento|treno|frecciarossa|lner|alfa\s+pendular|shinkansen|traghetto|ferry|battello|motoscafo|speed\s*boat|bus|navetta|noleggio\s+auto|4x4|auto\s+a\s+noleggio|riconsegna\s+auto|crociera|funicolare|funivia|cabinovia|gondola|arlanda\s+express|sj|railjet|eurocity|eurostar)\b/i.test(
      lowerWithoutFalseTransport
    )
  ) {
    return 'transport';
  }
  if (
    /\b(hotel|check-in|check-out|ryokan|alloggio|notte\s+(?:a|in)|pernottamento|riad|resort|accampamento|b&b|ostello|guesthouse|albergo|pensione)\b/i.test(
      lower
    )
  ) {
    return 'lodging';
  }
  if (
    /\b(cerimonia\s+del\s+t[eè]|maikoya|onsen|terme|spa|saturnia|blue\s+lagoon|massaggio|sorgenti\s+termali|bagno|relax|spiaggia|cammellata|altalena)\b/i.test(
      lower
    )
  ) {
    return 'relax';
  }
  if (
    /\b(pranzo|cena|colazione|mercato|ramen|sushi|street\s*food|ristorante|trattoria|osteria|degustazione|vino|cantina|tapas|pici|bistecca|pecorino|paella|pad\s+thai|bloemenmarkt|fika|kanelbulle|smørrebrød|smorrebrod|birra|pilsner|birreria|café|caffè|merenda|snack|torta|gelato|gelateria|bistrot|bebek\s+betutu|tortelli)\b/i.test(
      lower
    )
  ) {
    return 'food';
  }
  if (
    /\b(shopping|acquisto|pokemon|nintendo|souvenir|fifth\s+avenue|suk|souk|boutique|centro\s+commerciale)\b/i.test(
      lower
    )
  ) {
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

export function sanitizeInputText(text: string): string {
  if (!text) return '';
  // 1. Remove zero-width & invisible formatting characters:
  let cleaned = text.replace(INVISIBLE_CHARS_RE, '');

  // 2. Convert non-breaking spaces to standard space
  cleaned = cleaned.replace(/[\u00A0\u202F\u2007]/g, ' ');

  // 3. Normalize Unicode line breaks to \n
  cleaned = cleaned.replace(/\r\n|\r|\u2028|\u2029/g, '\n');

  // 4. Flattened line recovery before stage or day headers
  cleaned = cleaned.replace(/(.)(?=(?:TAPPA|FASE|STAGE|LEG)\s+\d+[:\-–—])/gi, '$1\n');
  cleaned = cleaned.replace(
    /(.)(?=\b\d{1,2}\s+(?:gen|feb|mar|apr|mag|giu|lug|ago|set|ott|nov|dic)[a-z]*\s*(?:\([^)]+\))?\s*(?:-|–|—)\s*(?:giorno|day|g)\s*\d+[:\-–—]?)/gi,
    '$1\n'
  );

  return cleaned;
}

export interface ProgramHeaderResult {
  suggestedTitle: string;
  startDay?: number;
  startMonth?: number;
  endDay?: number;
  endMonth?: number;
  year?: number;
}

export function parseProgramHeader(line: string): ProgramHeaderResult | null {
  const cleaned = cleanBulletPrefix(line);
  if (!cleaned) return null;

  const headerMatch = cleaned.match(
    /^(?:#+\s*)?(?:programma(?:\s+definitivo)?|itinerario(?:\s+definitivo)?|piano\s+(?:di\s+)?viaggio|proposta\s+viaggio)\s*[:\-–—]\s*(.+)$/i
  );
  if (!headerMatch) return null;

  const rawTitle = headerMatch[1].trim();
  const monthNamesPattern = Object.keys(MONTH_NAMES).join('|');

  const wordRangeInParens = new RegExp(
    `\\((?:dal\\s+)?(\\d{1,2})\\s+(${monthNamesPattern})\\s*(?:-|–|—|\\s+al?\\s+)\\s*(\\d{1,2})\\s+(${monthNamesPattern})(?:\\s+(\\d{4}))?\\)`,
    'i'
  );
  const wm = rawTitle.match(wordRangeInParens);
  if (wm) {
    const sd = Number(wm[1]);
    const sm = MONTH_NAMES[wm[2].toLowerCase()];
    const ed = Number(wm[3]);
    const em = MONTH_NAMES[wm[4].toLowerCase()];
    const y = wm[5] ? Number(wm[5]) : undefined;
    const cleanTitle = rawTitle.replace(wordRangeInParens, '').trim().replace(/^[:\-–—\s]+|[:\-–—\s]+$/g, '');
    return {
      suggestedTitle: cleanTitle || rawTitle,
      startDay: sd,
      startMonth: sm,
      endDay: ed,
      endMonth: em,
      year: y
    };
  }

  const numRangeInParens =
    /\((?:dal\s+)?(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{2,4}))?\s*(?:-|–|—|\s+al?\\s+)\s*(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*(\d{2,4}))?\)/i;
  const nm = rawTitle.match(numRangeInParens);
  if (nm) {
    const sd = Number(nm[1]);
    const sm = Number(nm[2]);
    const ed = Number(nm[4]);
    const em = Number(nm[5]);
    const y = nm[6] ? (nm[6].length === 2 ? 2000 + Number(nm[6]) : Number(nm[6])) : undefined;
    const cleanTitle = rawTitle.replace(numRangeInParens, '').trim().replace(/^[:\-–—\s]+|[:\-–—\s]+$/g, '');
    return {
      suggestedTitle: cleanTitle || rawTitle,
      startDay: sd,
      startMonth: sm,
      endDay: ed,
      endMonth: em,
      year: y
    };
  }

  return { suggestedTitle: rawTitle };
}

const DAY_OF_WEEK_PAT =
  '(?:\\((?:dom(?:enica)?|lun(?:ed[ìi])?|mar(?:ted[ìi])?|mer(?:coled[ìi])?|gio(?:ved[ìi])?|ven(?:erd[ìi])?|sab(?:ato)?|sun(?:day)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?)[^)]*\\)|\\b(?:dom(?:enica)?|lun(?:ed[ìi])?|mar(?:ted[ìi])?|mer(?:coled[ìi])?|gio(?:ved[ìi])?|ven(?:erd[ìi])?|sab(?:ato)?|sun(?:day)?|mon(?:day)?|tue(?:sday)?|wed(?:nesday)?|thu(?:rsday)?|fri(?:day)?|sat(?:urday)?)\\.?)';

export function cleanBulletPrefix(line: string): string {
  let cleaned = line.replace(INVISIBLE_CHARS_RE, '').trim();
  cleaned = cleaned.replace(/^>+\s*/, '');
  cleaned = cleaned.replace(
    /^[\s\t]*[#●○■□◆◇▪▫▶➔•*\-–—~_+|>\u2022\u25E6\u25AA\u25AB\u25CF\u25CB\u25B6\u25B8\u25BA\u25BB]+[\s\t]*/u,
    ''
  );
  cleaned = cleaned.replace(/^[\p{Extended_Pictographic}\p{Emoji_Presentation}\uFE0F\s]+/u, '');
  cleaned = cleaned.replace(/^[\s\t]*\d+[\.\)][\s\t]*/, '').trim();
  cleaned = cleaned.replace(/^\*\*|^\*|^__|^\b_|\*\*$/g, '').trim();
  cleaned = cleaned.replace(/^(?:in\s+data\s+|il\s+giorno\s+|il\s+di\s+|il\s+)/i, '').trim();
  return cleaned;
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
    const baseStageName = rawStageText.replace(/\([^)]*\)/g, '').trim();
    const primaryPart = baseStageName.split(/\s*(?:&|\/|\+|\be\b)\s*/)[0].trim();
    const matchedCity =
      lookupCityInfo(primaryPart) ||
      lookupCityInfo(baseStageName) ||
      Object.values(CITY_CATALOG).find((ci) =>
        baseStageName.toLowerCase().includes(ci.canonical.toLowerCase())
      );
    return {
      kind: 'stage',
      stageIndex: stageMatch[1] ? Number(stageMatch[1]) : undefined,
      stageName: rawStageText,
      stageCity: matchedCity?.canonical
    };
  }

  const monthNamesPattern = Object.keys(MONTH_NAMES)
    .sort((a, b) => b.length - a.length)
    .join('|');

  // 0b. Explicit Day label with attached date:
  // e.g. "Giorno 1 - 15/09: Roma Antica", "Giorno 1 (15/09): ...", "Giorno 1 (10/05): ...", "Giorno 1 - 15 Ottobre: ..."
  const dayLabelWithDateRe = new RegExp(
    `^(?:giorno|day|g)\\s*(\\d{1,2})\\s*(?:-|–|—|:|\\()\\s*` +
      `(?:(\\d{1,2})\\s*\\/\\s*(\\d{1,2})(?:\\s*\\/\\s*(\\d{2,4}))?|(\\d{1,2})\\s+(${monthNamesPattern})(?:\\s+(\\d{4}))?)` +
      `\\)?(?:\\s*[:\\-–—]?\\s*(.*)|$)`,
    'i'
  );
  const dldm = cleaned.match(dayLabelWithDateRe);
  if (dldm) {
    const dayNum = Number(dldm[1]);
    let sd = 0;
    let sm = 0;
    let sy: number | undefined;
    if (dldm[2] && dldm[3]) {
      sd = Number(dldm[2]);
      sm = Number(dldm[3]);
      sy = dldm[4] ? (dldm[4].length === 2 ? 2000 + Number(dldm[4]) : Number(dldm[4])) : undefined;
    } else if (dldm[5] && dldm[6]) {
      sd = Number(dldm[5]);
      sm = MONTH_NAMES[dldm[6].toLowerCase()] || 0;
      sy = dldm[7] ? Number(dldm[7]) : undefined;
    }
    if (sd >= 1 && sd <= 31 && sm >= 1 && sm <= 12) {
      return {
        kind: 'date',
        spec: {
          startDay: sd,
          startMonth: sm,
          startYear: sy,
          endDay: sd,
          endMonth: sm,
          endYear: sy,
          isRange: false
        },
        dayNumber: dayNum,
        rest: (dldm[8] || '').trim()
      };
    }
  }

  // 1. Cross-month words: "28 Nov - 02 Dic: Kyoto" or "28 nov – 2 dic"
  const crossMonthWordsRe = new RegExp(
    `^(?:${DAY_OF_WEEK_PAT}\\s*,?\\s*)?(?:dal\\s+)?(\\d{1,2})\\s+(${monthNamesPattern})\\s*(?:-|–|—|\\s+al?\\s+)\\s*(\\d{1,2})\\s+(${monthNamesPattern})(?:\\s+(\\d{4}))?` +
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
    `^(?:${DAY_OF_WEEK_PAT}\\s*,?\\s*)?(?:dal\\s+)?(\\d{1,2})(?:\\s*(?:-|–|—|\\s+al?\\s+)\\s*(\\d{1,2}))?\\s+(${monthNamesPattern})(?:\\s+(\\d{4}))?` +
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
  const crossMonthRe = new RegExp(
    `^(?:${DAY_OF_WEEK_PAT}\\s*,?\\s*)?(?:dal\\s+)?(\\d{1,2})\\s*\\/\\s*(\\d{1,2})(?:\\s*\\/\\s*(\\d{2,4}))?\\s*(?:-|–|—|\\s+al?\\s+|\\s+to\\s+)\\s*(\\d{1,2})\\s*\\/\\s*(\\d{1,2})(?:\\s*\\/\\s*(\\d{2,4}))?(?:\\s*[:\\-–—]?\\s*(.*)|$)`,
    'i'
  );
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
  const sameMonthRe = new RegExp(
    `^(?:${DAY_OF_WEEK_PAT}\\s*,?\\s*)?(?:dal\\s+)?(\\d{1,2})\\s*(?:-|–|—|\\s+al?\\s+)\\s*(\\d{1,2})\\s*\\/\\s*(\\d{1,2})(?:\\s*\\/\\s*(\\d{2,4}))?(?:\\s*[:\\-–—]?\\s*(.*)|$)`,
    'i'
  );
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
    `^(?:${DAY_OF_WEEK_PAT}\\s*,?\\s*)?(\\d{1,2})\\s*\\/\\s*(\\d{1,2})(?:\\s*\\/\\s*(\\d{2,4}))?` +
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
  const strippedPrefix = cleanedText
    .replace(/^[|:\-–—\s]+|[|:\-–—\s]+$/g, '')
    .replace(/^(?:vedere|visitare|inserire|fare)\s+/i, '')
    .trim();

  let candidateTitle = strippedPrefix;
  let candidateDesc: string | undefined = options?.extraNotes || extraNote;

  const colonMatch = strippedPrefix.match(/^([^:]{2,60})\s*:\s*(.+)$/);
  if (colonMatch && !/^(?:opzione\s+[A-Z]|nota\b)/i.test(strippedPrefix)) {
    candidateTitle = colonMatch[1].trim();
    const rightDesc = colonMatch[2].trim();
    candidateDesc = candidateDesc ? `${candidateDesc} — ${rightDesc}` : rightDesc;
  }

  const cleanLabel = candidateTitle;
  const cityInfo = lookupCityInfo(baseCity);
  const placeContext = { baseCity, countryPresetId: cityInfo?.countryPresetId };
  const known =
    lookupKnownPlace(candidateTitle, placeContext) ||
    lookupKnownPlace(strippedPrefix, placeContext);

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
    const optKnown = lookupKnownPlace(optBody, placeContext);
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

  // Handle lodging check-in / sistemazione
  if (/^(?:check-in|sistemazione(?:\s+in\s+alloggio|\s+in\s+hotel|\s+in\s+riad)?)\b/i.test(cleanLabel)) {
    const locMatch = cleanLabel.match(/^(?:check-in|sistemazione)\s+(?:in\s+alloggio|in\s+hotel|in\s+riad|all['’]hotel|al\s+resort)?\s*(?:a|in)\s+(.+)$/i);
    const targetPlace = locMatch ? locMatch[1].trim() : '';
    const placeKnown = targetPlace ? lookupKnownPlace(targetPlace, placeContext) : undefined;
    const placeCity = targetPlace ? lookupCityInfo(targetPlace) : undefined;

    return {
      id: makeId('act'),
      time: options?.overrideTime || explicitTime || '13:30',
      title: placeKnown?.canonicalName
        ? `Check-in hotel a ${placeKnown.canonicalName}`
        : placeCity
          ? `Check-in hotel a ${placeCity.canonical}`
          : 'Check-in in alloggio / hotel',
      locationName: placeKnown?.locationName || (placeCity ? `${placeCity.canonical}, ${placeCity.countryName}` : (cityInfo ? `${cityInfo.canonical}` : 'Alloggio')),
      lat: placeKnown?.lat ?? placeCity?.lat,
      lng: placeKnown?.lng ?? placeCity?.lng,
      category: 'lodging',
      notes: candidateDesc || 'Posare i bagagli e rinfrescarsi prima delle visite.',
      completed: false
    };
  }

  // Handle semantic transport phrases cleanly ("atterraggio alle 12:00", "arrivo a tokyo", "trasferimento a Kyoto", "volo di rientro da Osaka")
  const isArrival = /^(?:atterraggio|arrivo(?:\s+del\s+volo)?)\b/i.test(cleanLabel);
  if (isArrival) {
    if (known && known.lat && known.lng) {
      const airportPrefix = /aeroporto/i.test(known.canonicalName) ? "all'" : ': ';
      return {
        id: makeId('act'),
        time: explicitTime || options?.overrideTime || '12:00',
        title: `Arrivo ${airportPrefix}${known.canonicalName}`,
        locationName: known.locationName,
        lat: known.lat,
        lng: known.lng,
        category: 'transport',
        notes: [candidateDesc, known.notes].filter(Boolean).join(' ') || 'Arrivo a destinazione e sistemazione.',
        completed: false
      };
    }

    const cityInText = lookupCityInfo(cleanLabel) || lookupCityInfo(baseCity);
    const destMatch = cleanLabel.match(
      /^(?:atterraggio|arrivo(?:\s+del\s+volo)?)\s+(?:all['’]aeroporto\s+(?:di\s+)?|all[eoa’']|a|in|ad|agli|ai|al)\s*([^,.;]+)/i
    );
    const rawDest = destMatch
      ? destMatch[1].replace(/^(?:l['’]|il\s+|lo\s+|la\s+|gli\s+|le\s+)/i, '').trim()
      : undefined;
    const inferredDest = rawDest ? smartTitleCase(rawDest) : undefined;
    const destCanonical =
      cityInText?.canonical || inferredDest || (baseCity ? smartTitleCase(baseCity) : 'Destinazione');
    return {
      id: makeId('act'),
      time: explicitTime || options?.overrideTime || '12:00',
      title: `Arrivo a ${destCanonical}`,
      locationName: cityInText ? `${cityInText.canonical}, ${cityInText.countryName}` : destCanonical,
      lat: cityInText?.lat,
      lng: cityInText?.lng,
      category: 'transport',
      notes: candidateDesc || 'Arrivo, ritiro bagagli/pass trasporti e check-in in alloggio.',
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
      notes: candidateDesc || 'Raggiungere il terminal con congruo anticipo per controlli e imbarco.',
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

  const isSightseeingVisit = /\bper\s+(?:visitare|vedere|ammirare|assistere|godersi)\b/i.test(cleanLabel);
  const transferMatch = !isSightseeingVisit
    ? cleanLabel.match(
        /^(?:(trasferimento|spostamento|partenza)(?:\s+in\s+(?:auto|macchina|bus|pullman|treno))?|(?:(?:(?:escursione|gita|tour|viaggio)\s+(?:in|con)\s+)?(treno|shinkansen|motoscafo|battello|traghetto|ferry|aliscafo|barca)(?:\s+(?:veloce|rapido|diretto|notturno|regionale|panoramico|ad\s+alta\s+velocit[aà]))?(?:\s+(arlanda\s+express|sj|railjet|eurocity|eurostar|frecciarossa|frecciargento|frecciabianca|italo|shinkansen|ice|tgv|lner|alfa\s+pendular|kagayaki|nozomi|hikari|kodama|hayabusa))?(?:\s+(?:veloce|rapido|diretto|notturno|regionale|panoramico|ad\s+alta\s+velocit[aà]))?))\s+(?:da\s+(.+?)\s+(?:a|per|verso|in)\s+(.+)|da\s+(.+)|(?:(?:a|per|verso|in)\s+)?(.+))$/i
      )
    : null;

  if (transferMatch) {
    const isGenericTransfer = !!transferMatch[1];
    const rawBrand = transferMatch[3]?.trim();
    const transType = (transferMatch[2] || '').toLowerCase();
    const trainBrand = rawBrand
      ? smartTitleCase(rawBrand)
      : transType === 'shinkansen'
        ? 'Shinkansen'
        : undefined;

    const rawFrom = transferMatch[4]?.trim() || transferMatch[6]?.trim();
    let cleanedTo = (transferMatch[5] || transferMatch[7] || '').replace(/\.\s*$/, '').trim();
    let routeNote: string | undefined;
    const routeMatch = cleanedTo.match(/\s+(?:attraverso|passando\s+per|via)\s+(.+)$/i);
    if (routeMatch) {
      routeNote = `Percorso ${routeMatch[0].trim()}.`;
      cleanedTo = cleanedTo.slice(0, routeMatch.index).trim();
    }
    const rawTo = cleanedTo;

    const toCity = lookupCityInfo(rawTo);
    const fromCity = rawFrom ? lookupCityInfo(rawFrom) : undefined;
    const toKnown = lookupKnownPlace(rawTo, {
      baseCity: toCity?.canonical || baseCity,
      countryPresetId: toCity?.countryPresetId || cityInfo?.countryPresetId
    });
    const fromKnown = rawFrom
      ? lookupKnownPlace(rawFrom, {
          baseCity: fromCity?.canonical || baseCity,
          countryPresetId: fromCity?.countryPresetId || cityInfo?.countryPresetId
        })
      : undefined;

    const destLabel = toKnown?.canonicalName || toCity?.canonical || (rawTo ? smartTitleCase(rawTo) : 'Destinazione');
    const fromLabel =
      fromKnown?.canonicalName ||
      fromCity?.canonical ||
      (rawFrom ? smartTitleCase(rawFrom) : undefined);

    let title: string;
    if (!rawTo && rawFrom) {
      title = `Partenza da ${fromLabel}`;
    } else if (isGenericTransfer) {
      title = fromLabel
        ? `Trasferimento da ${fromLabel} a ${destLabel}`
        : `Trasferimento a ${destLabel}`;
    } else if (transType === 'motoscafo' || transType === 'battello' || transType === 'traghetto' || transType === 'ferry' || transType === 'aliscafo' || transType === 'barca') {
      const vehicle = smartTitleCase(transType);
      title = fromLabel
        ? `${vehicle} da ${fromLabel} a ${destLabel}`
        : `${vehicle} per ${destLabel}`;
    } else if (trainBrand === 'Arlanda Express') {
      title = fromLabel
        ? `Treno Arlanda Express da ${fromLabel} a ${destLabel}`
        : `Arlanda Express per ${destLabel}`;
    } else {
      title = trainBrand
        ? fromLabel
          ? `Treno ${trainBrand} da ${fromLabel} a ${destLabel}`
          : `Treno ${trainBrand} per ${destLabel}`
        : fromLabel
          ? `Treno da ${fromLabel} a ${destLabel}`
          : `Treno per ${destLabel}`;
    }

    const locName = !rawTo && rawFrom
      ? (fromKnown?.locationName || (fromCity ? `${fromCity.canonical}, ${fromCity.countryName}` : fromLabel!))
      : (toKnown?.locationName || (toCity ? `Stazione ${toCity.canonical}` : destLabel));
    const lat = !rawTo && rawFrom
      ? (fromKnown?.lat ?? fromCity?.stationOrAirportLat ?? fromCity?.lat)
      : (toKnown?.lat ?? toCity?.stationOrAirportLat ?? toCity?.lat);
    const lng = !rawTo && rawFrom
      ? (fromKnown?.lng ?? fromCity?.stationOrAirportLng ?? fromCity?.lng)
      : (toKnown?.lng ?? toCity?.stationOrAirportLng ?? toCity?.lng);

    const mergedNotes = [candidateDesc, routeNote].filter(Boolean).join(' ');

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
      locationName: locName,
      lat,
      lng,
      category: 'transport',
      notes: mergedNotes || undefined,
      completed: false
    };
  }

  if (known) {
    const inferred = inferCategory(cleanLabel);
    const isFoodActivityInSightseeingCity =
      inferred === 'food' &&
      known.defaultCategory === 'sightseeing' &&
      /\b(degustazione|pranzo|cena|aperitivo|assaggio|colazione|mangiare|pizza|vino|birra|panino)\b/i.test(
        cleanLabel
      );

    const mergedNotes = [candidateDesc, known.notes].filter(Boolean).join(' ');
    return {
      id: makeId('act'),
      time: finalTime,
      title: isFoodActivityInSightseeingCity ? smartTitleCase(cleanLabel) : known.canonicalName,
      locationName: known.locationName,
      lat: known.lat,
      lng: known.lng,
      category: isFoodActivityInSightseeingCity
        ? 'food'
        : options?.overrideCategory || known.defaultCategory || inferred,
      notes: mergedNotes || undefined,
      completed: false
    };
  }

  // Check if the label itself is simply a known city name (e.g. "Hiroshima" in "Hiroshima + Miyajima")
  const standaloneCity = lookupCityInfo(cleanLabel);
  if (standaloneCity && cleanLabel.split(/\s+/).length <= 2) {
    const isPrepCity = /^(?:a|in|ad)\s+/i.test(cleanLabel);
    if (!isPrepCity) {
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
          notes: [candidateDesc, firstSuggestion.notes].filter(Boolean).join(' ') || undefined,
          completed: false
        };
      }
    }
    const titleVerb =
      timeBucket === 'afternoon' || timeBucket === 'late_afternoon'
        ? `Pomeriggio a ${standaloneCity.canonical}`
        : timeBucket === 'evening'
          ? `Serata a ${standaloneCity.canonical}`
          : `Visita di ${standaloneCity.canonical}`;
    return {
      id: makeId('act'),
      time: finalTime,
      title: titleVerb,
      locationName: `${standaloneCity.canonical}, ${standaloneCity.countryName}`,
      lat: standaloneCity.lat,
      lng: standaloneCity.lng,
      category: 'sightseeing',
      notes: candidateDesc || undefined,
      completed: false
    };
  }

  const displayTitle = smartTitleCase(candidateTitle || rawDesc);
  const locationContext =
    cityInfo && !displayTitle.toLowerCase().includes(cityInfo.canonical.toLowerCase())
      ? `${displayTitle}, ${cityInfo.canonical}`
      : displayTitle;

  return {
    id: makeId('act'),
    time: finalTime,
    title: displayTitle,
    locationName: locationContext,
    category: options?.overrideCategory || inferCategory(candidateTitle),
    notes: candidateDesc || undefined,
    completed: false
  };
}

function splitIgnoringParentheses(text: string, sep: RegExp): string[] {
  const result: string[] = [];
  let depth = 0;
  let lastIndex = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '(' || ch === '[' || ch === '{') {
      depth++;
    } else if (ch === ')' || ch === ']' || ch === '}') {
      if (depth > 0) depth--;
    } else if (depth === 0) {
      const sub = text.slice(i);
      const m = sub.match(sep);
      if (m && m.index === 0) {
        result.push(text.slice(lastIndex, i).trim());
        i += m[0].length - 1;
        lastIndex = i + 1;
      }
    }
  }
  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex).trim());
  }
  return result.filter(Boolean);
}

/**
 * Intelligently segments a descriptive line into sequential travel activities.
 * Handles:
 * 1. Time-of-day blocks ("Mattina: ... Pomeriggio: ... Sera: ...")
 * 2. Structured lines ("<Time/Range> | <Title>: <Description>")
 * 3. Sentences (". " followed by capital letters or verbs)
 * 4. Semicolons ("; ")
 * 5. Distinct known POIs separated by commas or conjunctions ("Colosseo, Trevi, Pantheon")
 */
function segmentLineIntoActivities(rawText: string, baseCity: string): Activity[] {
  const trimmed = rawText.replace(INVISIBLE_CHARS_RE, '').trim();
  if (!trimmed) return [];

  // Special pattern: "partenza da X per Y"
  const depForMatch = trimmed.match(/^partenza\s+da\s+(.+?)\s+(?:per|verso)\s+(.+)$/i);
  if (depForMatch) {
    const fromCityRaw = smartTitleCase(depForMatch[1].trim());
    const toStopRaw = depForMatch[2].trim();
    const fromCity = lookupCityInfo(fromCityRaw);
    const act1: Activity = {
      id: makeId('act'),
      time: '08:30',
      title: `Partenza da ${fromCity?.canonical || fromCityRaw}`,
      locationName: fromCity ? `Stazione ${fromCity.canonical}` : fromCityRaw,
      lat: fromCity?.lat,
      lng: fromCity?.lng,
      category: 'transport',
      completed: false
    };
    const subsequentActivities = segmentPhrases(toStopRaw, baseCity);
    if (subsequentActivities.length > 0 && (subsequentActivities[0].time === '10:00' || !subsequentActivities[0].time)) {
      subsequentActivities[0].time = '10:15';
    }
    return [act1, ...subsequentActivities];
  }

  // Structured pipe pattern: "<TimeOrBucket> | <Title>: <Description>" OR "<TimeOrBucket> | <Title>"
  if (trimmed.includes('|')) {
    const pipeIdx = trimmed.indexOf('|');
    const leftTime = trimmed.slice(0, pipeIdx).trim();
    const rightContent = trimmed.slice(pipeIdx + 1).trim();
    const timeInfo = extractTimeAndCleanText(leftTime);

    // Check if rightContent has a Title : Description structure
    const colonMatch = rightContent.match(/^([^:]{2,60})\s*:\s*(.+)$/);
    if (colonMatch) {
      const rawTitle = colonMatch[1].trim();
      const rawDesc = colonMatch[2].trim();

      // Check if rawTitle joins two distinct known POIs e.g. "Tempio Kodai-ji e Santuario Yasaka" or "Ueno e Asakusa"
      const andParts = rawTitle.split(/\s+(?:e|ed|and|&|\+)\s+/i).map((s) => s.trim()).filter(Boolean);
      if (andParts.length === 2) {
        const p1 = lookupKnownPlace(andParts[0], { baseCity });
        const p2 = lookupKnownPlace(andParts[1], { baseCity });
        if (p1 && p2) {
          const startTime = timeInfo.explicitTime || (timeInfo.timeBucket === 'afternoon' ? '14:30' : '10:00');
          const [sh, sm] = startTime.split(':').map(Number);
          const secondMins = Math.min(sh * 60 + sm + 75, 21 * 60);
          const secondTime = `${String(Math.floor(secondMins / 60)).padStart(2, '0')}:${String(secondMins % 60).padStart(2, '0')}`;

          const act1 = buildActivityFromDescription(andParts[0], baseCity, {
            overrideTime: startTime,
            extraNotes: [timeInfo.extraNote, rawDesc].filter(Boolean).join(' ') || undefined
          });
          const act2 = buildActivityFromDescription(andParts[1], baseCity, {
            overrideTime: secondTime,
            extraNotes: [timeInfo.extraNote, rawDesc].filter(Boolean).join(' ') || undefined
          });
          return [act1, act2];
        }
      }

      const act = buildActivityFromDescription(rawTitle, baseCity, {
        overrideTime: timeInfo.explicitTime,
        extraNotes: [timeInfo.extraNote, rawDesc].filter(Boolean).join(' ') || undefined
      });
      return [act];
    } else {
      const act = buildActivityFromDescription(rightContent, baseCity, {
        overrideTime: timeInfo.explicitTime,
        extraNotes: timeInfo.extraNote
      });
      return [act];
    }
  }

  // 1. Check for time-of-day sections:
  // e.g. "Mattina ore 09:00 traghetto... Pomeriggio: Wall Street... Sera: Broadway"
  const timeBlockRegex =
    /(?:^|[.;\n])\s*(?:(?:nel|in|di)\s+)?\b(mattina\s+presto|tarda\s+mattina|mattina|pranzo|nel\s+pomeriggio|tardo\s+pomeriggio|pomeriggio|tramonto|al\s+tramonto|sera|serata|cena|notte)\s*[:\-–—]\s*/gi;

  const matches = [...trimmed.matchAll(timeBlockRegex)];
  if (matches.length >= 2) {
    const activities: Activity[] = [];
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const timeHeader = match[1];
      const startIdx = (match.index ?? 0) + match[0].length;
      const endIdx = i + 1 < matches.length ? (matches[i + 1].index ?? trimmed.length) : trimmed.length;
      const blockText = trimmed.slice(startIdx, endIdx).replace(/^[,;.\-–—\s]+|[,;.\-–—\s]+$/g, '').trim();
      if (!blockText) continue;

      const subActivities = segmentPhrases(blockText, baseCity, timeHeader);
      activities.push(...subActivities);
    }
    if (activities.length > 0) return activities;
  }

  return segmentPhrases(trimmed, baseCity);
}

function segmentPhrases(blockText: string, baseCity: string, inheritedTimeHeader?: string): Activity[] {
  // Split on semicolons or chain arrows/words
  const rawParts = blockText
    .split(/\s*;\s*|\s+e\s+poi\s+|\s+poi\s+|\s*(?:->|→|⇒)\s*|\s+\+\s+|\s+prima\s+(?:del?|di)\s+(?=(?:volo|partenza|rientro|treno|traghetto|aeroporto))/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const activities: Activity[] = [];

  for (const part of rawParts) {
    // Split sentences inside part: ". " followed by capital letter or keyword, ignoring parenthetical periods
    const sentences = splitIgnoringParentheses(
      part,
      /\.\s+(?=[A-ZÀ-Ú0-9]|Mattina|Pomeriggio|Sera|Notte|Poi|Per\s+|Check-in|Volo|Treno|Ritiro|Bagno|Salita|Visita|Passeggiata|Escursione|Piazza|Santuario|Tempio|Castello|Parco|Museo|Crociera|Teatro)/
    );

    for (const sent of sentences) {
      // Handle change of mind / plan correction within a sentence: e.g. "panino veloce..., anzi no facciamo una sosta con degustazione..."
      let effectiveSent = sent;
      const correctionMatch = sent.match(
        /^(.+?)\s*,\s*(?:anzi\s+no|oppure\s+no|invece)\s*[,;:]?\s*(?:facciamo|andiamo|preferiamo|meglio|optiamo\s+per)?\s*(.+)$/i
      );
      if (correctionMatch) {
        effectiveSent = correctionMatch[2].trim();
      }

      // Check if sentence lists multiple known POIs separated by commas or " e "
      const poiSplits = splitSentenceByKnownPOIs(effectiveSent);
      if (poiSplits.length > 1) {
        for (const piece of poiSplits) {
          const textWithTime = inheritedTimeHeader && !extractTimeAndCleanText(piece).timeBucket && !extractTimeAndCleanText(piece).explicitTime
            ? `${inheritedTimeHeader}: ${piece}`
            : piece;
          activities.push(buildActivityFromDescription(textWithTime, baseCity));
        }
      } else {
        const textWithTime = inheritedTimeHeader && !extractTimeAndCleanText(effectiveSent).timeBucket && !extractTimeAndCleanText(effectiveSent).explicitTime
          ? `${inheritedTimeHeader}: ${effectiveSent}`
          : effectiveSent;
        activities.push(buildActivityFromDescription(textWithTime, baseCity));
      }
    }
  }

  return activities;
}

function isRecognizedActivityFragment(fragment: string): boolean {
  const trimmed = fragment.trim();
  if (!trimmed) return false;
  // 1. Known POI
  if (lookupKnownPlace(trimmed)) return true;
  // 2. Known City
  if (lookupCityInfo(trimmed)) return true;
  // 3. Explicit time or time bucket
  const timeInfo = extractTimeAndCleanText(trimmed);
  if (timeInfo.explicitTime || timeInfo.timeBucket) return true;
  // 4. Action keywords
  const actionRe =
    /\b(arrivo|atterraggio|volo|rientro|ritorno|partenza|trasferimento|spostamento|treno|tram|bus|shinkansen|traghetto|ferry|battello|motoscafo|crociera|cabinovia|funivia|funicolare|check-in|sistemazione|alloggio|hotel|riad|ryokan|noleggio|bici|auto|4x4|passeggiata|visita|escursione|salita|camminata|degustazione|pranzo|cena|aperitivo|colazione|mercato|tempio|santuario|castello|parco|museo|chiesa|cattedrale|basilica|piazza|palazzo|giardino|giardini|spiaggia|dune|deserto|terme|laguna|cascata|lago|torre|ponte|strada|quartiere|teatro|monastero|sosta|pausa|fotografia|foto|statua|caldera|altalena|mura)\b/i;
  if (actionRe.test(trimmed)) return true;
  return false;
}

function splitRespectingParentheses(
  str: string,
  delimiterType: 'comma' | 'conjunction' = 'comma'
): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth = Math.max(0, depth - 1);

    if (depth === 0) {
      if (delimiterType === 'comma' && (ch === ',' || ch === ';')) {
        if (current.trim()) parts.push(current.trim());
        current = '';
        continue;
      } else if (delimiterType === 'conjunction') {
        const remaining = str.slice(i);
        const conjMatch = remaining.match(/^(\s+(?:e|ed|and|\+)\s+)/i);
        if (conjMatch) {
          if (current.trim()) parts.push(current.trim());
          current = '';
          i += conjMatch[1].length - 1;
          continue;
        }
      }
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function shouldProtectFromConjunctionSplit(text: string): boolean {
  if (
    /\b(?:volo|partenza)\s+(?:e|ed)\s+(?:arrivo|atterraggio)\b/i.test(
      text
    )
  ) {
    return true;
  }
  if (
    /\b(?:mattina|pomeriggio|serata|giornata)\s+di\s+[a-zà-ú']+\s+(?:e|ed)\s+(?:picnic|relax|visite?|passeggiata|shopping)\b/i.test(
      text
    )
  ) {
    return true;
  }
  if (
    /\b(?:castello|palazzo|villa|reggia)\s+(?:[a-zà-ú']+\s+)*(?:e|ed)\s+(?:gioielli|tesoro|parco|giardini|museo|fontane)\b/i.test(
      text
    )
  ) {
    return true;
  }
  if (
    /\b(?:piazza|chiesa|cattedrale|basilica)\s+(?:e|ed)\s+(?:campanile|cupola|battistero)\s+(?:di|del|della)\b/i.test(
      text
    )
  ) {
    return true;
  }
  if (
    /\b(?:risaie|terrazze)\s+(?:[a-zà-ú']+\s+)*(?:e|ed)\s+(?:altalena|swing)\b/i.test(
      text
    )
  ) {
    return true;
  }
  return false;
}

function isDescriptiveApposition(text: string): boolean {
  const lower = text.trim().toLowerCase();
  if (/^(?:splendid[oa]|suggestiv[oa]|famos[oa]|not[oa]|incantevole|caratteristic[oa]|bellissim[oa]|meraviglios[oa]|storico|storica|antico|antica)\b/i.test(lower)) {
    return true;
  }
  if (/^(?:patrimonio\s+(?:mondiale\s+)?unesco|sito\s+unesco|patrimonio\s+dell['’]umanit[aà])\b/i.test(lower)) {
    return true;
  }
  if (/^(?:capitale\s+del|cuore\s+(?:antico|storico|pulsante)|borgo\s+(?:arroccato|medievale|marinaro|storico))\b/i.test(lower)) {
    return true;
  }
  if (/^(?:il\s+centro\s+storico|centro\s+storico)\s+(?:su|di|tra|nel|dell|sull)\b/i.test(lower)) {
    return true;
  }
  if (/^(?:perla\s+del|gioiello\s+del|immerso\s+nel|affacciat[oa]\s+sul?)\b/i.test(lower)) {
    return true;
  }
  return false;
}

function splitSentenceByKnownPOIs(sentence: string): string[] {
  // If sentence has an introductory theme before a colon (e.g. "Gita a Sintra: ...", "Escursione: ...")
  // Guard against colons inside times like 11:00 or 08:30
  const colonMatch = sentence.match(/^([^:]{3,48}?[^:\d])\s*:\s*(?!\d{2}\b)(.+)$/);
  if (colonMatch) {
    const rightSide = colonMatch[2].trim();
    const rightSplits = splitSentenceByKnownPOIs(rightSide);
    if (rightSplits.length > 1) {
      return rightSplits;
    }
  }

  // Split on commas outside parentheses, merging descriptive appositions into the preceding element
  const rawParts = splitRespectingParentheses(sentence, 'comma');
  const commaParts: string[] = [];
  for (const part of rawParts) {
    const { mainBody, parenBody } = splitOuterParentheses(part);
    if (parenBody) {
      const subPieces = parenBody
        .split(/\s+(?:e|ed|and|\+)\s+|,\s*/i)
        .map((p) => p.replace(/^(?:e|ed|and)\s+/i, '').trim())
        .filter(Boolean);
      const recognizedSubs = subPieces.filter(isRecognizedActivityFragment);
      if (
        recognizedSubs.length >= 2 ||
        (recognizedSubs.length >= 1 && isDescriptiveApposition(mainBody))
      ) {
        if (mainBody && !isDescriptiveApposition(mainBody)) {
          commaParts.push(mainBody);
        }
        commaParts.push(...subPieces);
        continue;
      }
    }

    if (commaParts.length > 0 && isDescriptiveApposition(part)) {
      commaParts[commaParts.length - 1] = `${commaParts[commaParts.length - 1]} (${part})`;
    } else {
      commaParts.push(part);
    }
  }

  const result: string[] = [];

  for (const cp of commaParts) {
    if (shouldProtectFromConjunctionSplit(cp)) {
      result.push(cp.replace(/^(?:e|ed|and)\s+/i, '').trim());
      continue;
    }

    // Inside each comma part, split on conjunctions OUTSIDE parentheses
    const andPieces = splitRespectingParentheses(cp, 'conjunction')
      .map((p) => p.replace(/^(?:e|ed|and)\s+/i, '').trim())
      .filter(Boolean);

    if (andPieces.length > 1) {
      const recognizedCount = andPieces.filter(isRecognizedActivityFragment).length;
      if (recognizedCount === andPieces.length) {
        const resolvedNames = andPieces
          .map((p) => lookupKnownPlace(p)?.canonicalName)
          .filter(Boolean);
        if (resolvedNames.length > 1 && new Set(resolvedNames).size === 1) {
          result.push(cp.replace(/^(?:e|ed|and)\s+/i, '').trim());
          continue;
        }
        result.push(...andPieces);
        continue;
      }
    }

    result.push(cp.replace(/^(?:e|ed|and)\s+/i, '').trim());
  }

  if (result.length > 1 && result.some(isRecognizedActivityFragment)) {
    return result;
  }

  // If no commas, check if sentence has conjunctions connecting multiple activities
  if (shouldProtectFromConjunctionSplit(sentence)) {
    return [sentence];
  }
  const andPieces = splitRespectingParentheses(sentence, 'conjunction')
    .map((p) => p.replace(/^(?:e|ed|and)\s+/i, '').trim())
    .filter(Boolean);
  if (andPieces.length > 1) {
    const recognizedCount = andPieces.filter(isRecognizedActivityFragment).length;
    if (recognizedCount === andPieces.length) {
      const resolvedNames = andPieces
        .map((p) => lookupKnownPlace(p)?.canonicalName)
        .filter(Boolean);
      if (resolvedNames.length > 1 && new Set(resolvedNames).size === 1) {
        return [sentence];
      }
      return andPieces;
    }
  }

  return [sentence];
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

  const sanitized = sanitizeInputText(rawText);
  const rawLines = sanitized
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
  let programHeaderInfo: ProgramHeaderResult | null = null;

  for (const line of rawLines) {
    if (/^(?:ciao\b|buongiorno\b|ecco\s+(?:la\s+nostra\s+|il\s+nostro\s+)?bozza|bozza\b|note\s+di\s+viaggio)/i.test(line)) {
      continue;
    }

    const header = parseProgramHeader(line);
    if (header) {
      if (!programHeaderInfo) {
        programHeaderInfo = header;
      }
      continue;
    }

    const match = parseLeadingDateSpec(line);
    if (match?.kind === 'stage') {
      currentStageCity = match.stageCity || '';
      currentDayNode = null;
      continue;
    }

    if (match?.kind === 'date') {
      if (match.spec.isRange && !match.dayNumber) {
        // Multi-day stay range rule e.g. "22-27/11: TOKYO (...)"
        const { mainBody, parenBody } = splitOuterParentheses(match.rest);
        rawStayRules.push({
          ...match.spec,
          mainBody,
          parenBody
        });
        currentDayNode = null;
      } else {
        // Single day or numbered day e.g. "22 Nov (Dom) – Giorno 1: Arrivo a Tokyo" or "- 22/11: arrivo a tokyo..."
        const formattedDayTitle = match.dayNumber && match.rest
          ? (/^giorno\s*\d+/i.test(match.rest) ? match.rest : `Giorno ${match.dayNumber}: ${smartTitleCase(match.rest)}`)
          : (match.rest.trim() || undefined);

        currentDayNode = {
          spec: match.spec,
          dayNumber: match.dayNumber,
          stageCity: currentStageCity,
          dayTitle: formattedDayTitle,
          childLines: []
        };
        if (currentStageCity && unassignedNotes.length > 0) {
          currentDayNode.childLines.unshift(...unassignedNotes);
          unassignedNotes = [];
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
    const isMultiCityHeader =
      stay.mainBody
        .split(/\s*,\s*|\s+(?:e|ed|and|&)\s+/i)
        .filter((w) => !!lookupCityInfo(w)).length >= 2;
    const isEntireTripHeader =
      stay.startIso === minIso &&
      stay.endIso === maxIso &&
      dayNodes.length >= 2 &&
      (!cityInfo || isMultiCityHeader);
    if (isEntireTripHeader) {
      continue;
    }

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
        const generated = segmentLineIntoActivities(dn.dayTitle, bucket.baseCity);
        bucket.activities.push(...generated);
      } else {
        bucket.dayTitleOverride = dn.dayTitle;
        // If dayTitle was an arrival and childLines do not mention arrival/atterraggio, generate arrival
        if (/\barrivo\b/i.test(dn.dayTitle) && !dn.childLines.some((c) => /atterraggio|arrivo/i.test(c))) {
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

      const isContinuation =
        /^(?:se\s+il\s+giorno\s+\d+|se\s+la\s+giornata|con\s+il\s+kimono|senza\s+kimono|quale\s+sede|cosa\s+assaggiare|cosa\s+mangiare|consigli?\s+(?:gastronomic[oi]|util[ei])|bus\s+espresso|da\s+mishima|da\s+l[ìi]|da\s+qui|check-in\s+in\s+hotel)/i.test(
          clean
        );

      if (isContinuation && bucket.activities.length > 0) {
        const lastAct = bucket.activities[bucket.activities.length - 1];
        lastAct.notes = [lastAct.notes, clean].filter(Boolean).join('\n');
        continue;
      }

      const generated = segmentLineIntoActivities(clean, bucket.baseCity);
      bucket.activities.push(...generated);
    }

    if (bucket.activities.length > 1) {
      staggerActivities(bucket.activities);
    }
  }

  // Propagate baseCity for single-day legs that still lack baseCity
  let lastKnownCity = '';
  for (const dn of dayNodes) {
    const iso = dn.spec.isRelativeDay
      ? addDaysIso(relativeBaseIso, dn.spec.startDay - 1)
      : resolveMonthDayToIso(dn.spec.startDay, dn.spec.startMonth, dn.spec.startYear);
    const bucket = dayMap.get(iso);
    if (!bucket) continue;

    if (!bucket.baseCity) {
      if (dn.dayTitle) {
        const possibleCity = lookupCityInfo(dn.dayTitle);
        if (possibleCity) bucket.baseCity = possibleCity.canonical;
      }
      if (!bucket.baseCity && bucket.activities.length > 0) {
        for (const act of bucket.activities) {
          const actCity = lookupCityInfo(act.locationName || '') || lookupCityInfo(act.title || '');
          if (actCity) {
            bucket.baseCity = actCity.canonical;
            break;
          }
        }
      }
      if (!bucket.baseCity && lastKnownCity) {
        bucket.baseCity = lastKnownCity;
      }
    }
    if (bucket.baseCity) {
      lastKnownCity = bucket.baseCity;
    }
  }

  // 3. Process Parenthetical Sub-Plans inside Multi-Day Stay Ranges!
  for (const stay of stayRules) {
    if (!stay.parenBody) continue;
    const cityRaw = stay.mainBody.replace(/^[:\-–—\s]+/, '').trim();
    const cityInfo = lookupCityInfo(cityRaw);
    const isMultiCityHeader =
      stay.mainBody
        .split(/\s*,\s*|\s+(?:e|ed|and|&)\s+/i)
        .filter((w) => !!lookupCityInfo(w)).length >= 2;
    const isEntireTripHeader =
      stay.startIso === minIso &&
      stay.endIso === maxIso &&
      dayNodes.length >= 2 &&
      (!cityInfo || isMultiCityHeader);
    if (isEntireTripHeader) {
      continue;
    }

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

      // If the parenthetical is a list of destination cities (e.g. "Mitteleuropa (Vienna, Praga, Budapest)" or "(Stoccolma e Copenaghen)")
      // do not treat them as individual activity stops!
      const candidatePlaces = strippedGroup
        .split(/\s*,\s*|\s+(?:e|ed|and|&)\s+/i)
        .map((c) => c.replace(/^(?:vedere|visitare|inserire)\s+/i, '').trim())
        .filter(Boolean);

      const isPureCityList =
        candidatePlaces.length >= 2 &&
        candidatePlaces.every((item) => !!lookupCityInfo(item));

      if (isPureCityList) {
        continue;
      }

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
    programHeaderInfo?.suggestedTitle ||
    (primaryCountry && distinctCityNames.length >= 2
      ? `${primaryCountry.countryName}: ${citySummary}`
      : distinctCityNames.length >= 1
        ? `Viaggio: ${citySummary}`
        : `Viaggio in ${detectedDestination}`);

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
