import type { ActivityCategory } from '../types/trip';
import {
  getGoogleMapsApiKey,
  hasGoogleMapsApiKey,
  markGoogleMapsAuthFailure
} from './googleMapsLoader';
import {
  canUseGoogleMapsToday,
  recordGoogleMapsUsage,
  getDailyQuotaStatus,
  DAILY_GOOGLE_QUOTA_LIMIT,
  type QuotaStatus
} from './googleQuotaShield';

export { getDailyQuotaStatus, DAILY_GOOGLE_QUOTA_LIMIT, type QuotaStatus };

export interface GooglePlaceReview {
  authorName?: string;
  rating?: number;
  text?: string;
  relativeTimeDescription?: string;
}

export interface GeocodedPlace {
  displayName: string;
  shortName: string;
  lat: number;
  lng: number;
  googlePlaceId?: string;
  sessionToken?: string;
  needsCoordinateLookup?: boolean;
  suggestedCategory?: ActivityCategory;
  provider?: 'google' | 'osm' | 'pasted_link';
  externalUrl?: string;
  rating?: number;
  userRatingCount?: number;
  photoUrl?: string;
  photos?: string[];
  isOpenNow?: boolean;
  websiteUri?: string;
  googleMapsUri?: string;
  reviews?: GooglePlaceReview[];
}

interface PhotonFeature {
  geometry?: {
    coordinates?: [number, number]; // [lng, lat]
  };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    osm_key?: string;
    osm_value?: string;
  };
}

function mapOsmTypeToCategory(key?: string, value?: string): ActivityCategory | undefined {
  if (!key || !value) return undefined;
  if (value === 'restaurant' || value === 'cafe' || value === 'fast_food' || value === 'bar' || value === 'pub') {
    return 'food';
  }
  if (value === 'hotel' || value === 'motel' || value === 'guest_house' || value === 'hostel') {
    return 'lodging';
  }
  if (key === 'shop' || value === 'supermarket' || value === 'mall') {
    return 'shopping';
  }
  if (value === 'station' || value === 'subway' || value === 'bus_stop' || value === 'airport') {
    return 'transport';
  }
  if (value === 'spa' || value === 'park' || value === 'garden') {
    return 'relax';
  }
  if (value === 'attraction' || value === 'museum' || value === 'monument' || value === 'place_of_worship') {
    return 'sightseeing';
  }
  return undefined;
}

function mapGoogleTypesToCategory(types?: string[]): ActivityCategory | undefined {
  if (!types || types.length === 0) return undefined;
  const set = new Set(types);
  if (
    set.has('restaurant') ||
    set.has('food') ||
    set.has('cafe') ||
    set.has('bar') ||
    set.has('bakery') ||
    set.has('meal_takeaway') ||
    set.has('ramen_restaurant') ||
    set.has('sushi_restaurant') ||
    set.has('ice_cream_shop')
  ) {
    return 'food';
  }
  if (set.has('lodging') || set.has('hotel') || set.has('motel') || set.has('guest_house') || set.has('bed_and_breakfast')) {
    return 'lodging';
  }
  if (
    set.has('shopping_mall') ||
    set.has('store') ||
    set.has('clothing_store') ||
    set.has('department_store') ||
    set.has('supermarket') ||
    set.has('convenience_store')
  ) {
    return 'shopping';
  }
  if (
    set.has('subway_station') ||
    set.has('train_station') ||
    set.has('transit_station') ||
    set.has('bus_station') ||
    set.has('airport') ||
    set.has('light_rail_station')
  ) {
    return 'transport';
  }
  if (set.has('spa') || set.has('park') || set.has('hot_spring') || set.has('campground')) {
    return 'relax';
  }
  if (
    set.has('tourist_attraction') ||
    set.has('museum') ||
    set.has('place_of_worship') ||
    set.has('hindu_temple') ||
    set.has('church') ||
    set.has('amusement_park') ||
    set.has('art_gallery') ||
    set.has('historical_landmark')
  ) {
    return 'sightseeing';
  }
  return undefined;
}

function formatPhotonFeature(f: PhotonFeature): GeocodedPlace | null {
  const coords = f.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const [lng, lat] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const p = f.properties ?? {};
  const streetPart = [p.street, p.housenumber].filter(Boolean).join(' ');
  const locality = p.city || p.town || p.village || p.district || '';
  const primary = p.name || streetPart || locality || p.country || 'Posizione';

  const parts = [p.name, streetPart, p.district, p.city || p.town || p.village, p.state, p.country]
    .filter((v): v is string => Boolean(v && v.trim()))
    .filter((v, idx, arr) => arr.indexOf(v) === idx);

  const shortParts = [primary, locality !== primary ? locality : p.country].filter(Boolean);

  return {
    shortName: shortParts.join(', '),
    displayName: parts.join(', ') || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
    lat,
    lng,
    suggestedCategory: mapOsmTypeToCategory(p.osm_key, p.osm_value),
    provider: 'osm',
    needsCoordinateLookup: false
  };
}

/**
 * Creates a unique session token for Google Places Autocomplete (New).
 * Bundles intermediate keystrokes at $0.00, billing only the concluding Place Details request.
 */
export function createPlacesSessionToken(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `ses_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Instantly parses pasted Google Maps URLs, mobile share links, or raw coordinates (Postel's Law).
 * Returns a fully resolved GeocodedPlace at $0.00 with 0ms latency.
 */
export function parseGoogleMapsInput(input: string): GeocodedPlace | null {
  const raw = input.trim();
  if (!raw) return null;

  // 1. Raw coordinate pair: "35.6585, 139.7454" or "35.6585,139.7454"
  const rawCoordsMatch = raw.match(/^[-+]?([1-8]?\d(?:\.\d+)?|90(?:\.0+)?)[,\s]+[-+]?(180(?:\.0+)?|(?:1[0-7]\d|[1-9]?\d)(?:\.\d+)?)$/);
  if (rawCoordsMatch) {
    const lat = Number.parseFloat(rawCoordsMatch[1]);
    const lng = Number.parseFloat(rawCoordsMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      const coordStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      return {
        shortName: `Punto GPS (${coordStr})`,
        displayName: coordStr,
        lat,
        lng,
        provider: 'pasted_link',
        needsCoordinateLookup: false
      };
    }
  }

  // 2. Google Maps URL parsing
  const isGoogleMaps = /google\.[a-z.]+\/maps|maps\.app\.goo\.gl|maps\.google\./i.test(raw);
  if (!isGoogleMaps) return null;

  let lat: number | undefined;
  let lng: number | undefined;
  let extractedTitle: string | undefined;

  // Pattern A: /place/Title/@lat,lng,zoom/
  const atMatch = raw.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    lat = Number.parseFloat(atMatch[1]);
    lng = Number.parseFloat(atMatch[2]);
  }

  // Pattern B: ?q=lat,lng or &ll=lat,lng
  if (!lat || !lng) {
    const qMatch = raw.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      lat = Number.parseFloat(qMatch[1]);
      lng = Number.parseFloat(qMatch[2]);
    }
  }

  // Extract place title from URL path: /place/Place+Name/
  const placePathMatch = raw.match(/\/place\/([^/@?]+)/);
  if (placePathMatch) {
    try {
      extractedTitle = decodeURIComponent(placePathMatch[1].replace(/\+/g, ' ')).trim();
    } catch {
      extractedTitle = placePathMatch[1].replace(/\+/g, ' ').trim();
    }
  }

  // Extract leading title from mobile shared text (e.g. "Ramen Nagi\nhttps://maps.app.goo.gl/...")
  if (!extractedTitle) {
    const lines = raw.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
    const textBeforeUrl = lines.find((l) => !l.startsWith('http'));
    if (textBeforeUrl && textBeforeUrl.length > 1 && textBeforeUrl.length < 80) {
      extractedTitle = textBeforeUrl;
    }
  }

  // Extract raw URL
  const urlMatch = raw.match(/https?:\/\/[^\s]+/i);
  const cleanUrl = urlMatch ? urlMatch[0] : raw.startsWith('http') ? raw : undefined;

  if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
    const shortName = extractedTitle || `Luogo Google Maps (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
    return {
      shortName,
      displayName: extractedTitle ? `${extractedTitle} (${lat.toFixed(5)}, ${lng.toFixed(5)})` : `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      lat,
      lng,
      externalUrl: cleanUrl,
      provider: 'pasted_link',
      needsCoordinateLookup: false
    };
  }

  return null;
}

/**
 * Autocomplete places search (Google Places API New when configured, with seamless OSM fallback).
 * Uses session tokens so keystrokes remain $0.00, billing only when the user selects a place.
 */
export async function autocompletePlaces(
  query: string,
  biasCenter?: [number, number],
  sessionToken?: string
): Promise<GeocodedPlace[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  // 1. Instant check for pasted Google Maps URLs or coordinates ($0.00, 0ms)
  const pasted = parseGoogleMapsInput(trimmed);
  if (pasted) {
    return [pasted];
  }

  // 2. Google Places API (New) with Session Token (when API key is set, working, and within daily 300 quota)
  if (hasGoogleMapsApiKey() && canUseGoogleMapsToday()) {
    const apiKey = getGoogleMapsApiKey();
    try {
      const body: Record<string, unknown> = {
        input: trimmed,
        languageCode: 'it',
        regionCode: 'IT'
      };

      if (sessionToken) {
        body.sessionToken = sessionToken;
      }

      if (biasCenter && Number.isFinite(biasCenter[0]) && Number.isFinite(biasCenter[1])) {
        body.locationBias = {
          circle: {
            center: { latitude: biasCenter[0], longitude: biasCenter[1] },
            radius: 50000.0 // 50km proximity bias
          }
        };
      }

      const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const json = (await res.json()) as {
          suggestions?: Array<{
            placePrediction?: {
              placeId?: string;
              text?: { text?: string };
              structuredFormat?: {
                mainText?: { text?: string };
                secondaryText?: { text?: string };
              };
              types?: string[];
            };
          }>;
        };

        const list: GeocodedPlace[] = [];
        for (const s of json.suggestions ?? []) {
          const p = s.placePrediction;
          if (!p || !p.placeId) continue;

          const mainText = p.structuredFormat?.mainText?.text || p.text?.text || 'Luogo';
          const secondaryText = p.structuredFormat?.secondaryText?.text || '';
          const displayName = [mainText, secondaryText].filter(Boolean).join(', ');

          list.push({
            shortName: mainText,
            displayName,
            lat: 0,
            lng: 0,
            googlePlaceId: p.placeId,
            sessionToken,
            needsCoordinateLookup: true,
            suggestedCategory: mapGoogleTypesToCategory(p.types),
            provider: 'google'
          });
        }

        if (list.length > 0) {
          void recordGoogleMapsUsage();
          return list;
        }
      } else if (res.status === 403) {
        // Billing not yet activated or Maps API not enabled -> smoothly fall through to OSM without crashing
        markGoogleMapsAuthFailure();
      }
    } catch {
      // Network or CORS error -> fall through to OSM
    }
  }

  // 3. Fallback: Komoot Photon API (OpenStreetMap data, fuzzy & multilingual)
  try {
    const photonUrl = new URL('https://photon.komoot.io/api/');
    photonUrl.searchParams.set('q', trimmed);
    photonUrl.searchParams.set('limit', '6');
    photonUrl.searchParams.set('lang', 'en');
    if (biasCenter && Number.isFinite(biasCenter[0]) && Number.isFinite(biasCenter[1])) {
      photonUrl.searchParams.set('lat', String(biasCenter[0]));
      photonUrl.searchParams.set('lon', String(biasCenter[1]));
    }

    const res = await fetch(photonUrl.toString(), {
      headers: { Accept: 'application/json' }
    });

    if (res.ok) {
      const json = (await res.json()) as { features?: PhotonFeature[] };
      const mapped = (json.features ?? [])
        .map(formatPhotonFeature)
        .filter((x): x is GeocodedPlace => x !== null);
      if (mapped.length > 0) {
        return mapped;
      }
    }
  } catch {
    // Proceed to Nominatim fallback
  }

  // 4. Fallback: OpenStreetMap Nominatim
  const nomUrl = new URL('https://nominatim.openstreetmap.org/search');
  nomUrl.searchParams.set('q', trimmed);
  nomUrl.searchParams.set('format', 'jsonv2');
  nomUrl.searchParams.set('limit', '6');
  nomUrl.searchParams.set('accept-language', 'it,en');

  const response = await fetch(nomUrl.toString(), {
    headers: { Accept: 'application/json' }
  });

  if (!response.ok) {
    throw new Error('Ricerca luogo non riuscita');
  }

  const data = (await response.json()) as Array<{
    display_name: string;
    name?: string;
    lat: string;
    lon: string;
  }>;

  return data.map((item) => {
    const parts = item.display_name.split(',').map((p) => p.trim());
    const shortName = item.name
      ? [item.name, parts[1] || parts[0]].filter((v, i, a) => v && a.indexOf(v) === i).join(', ')
      : parts.slice(0, 2).join(', ');
    return {
      displayName: item.display_name,
      shortName,
      lat: Number.parseFloat(item.lat),
      lng: Number.parseFloat(item.lon),
      provider: 'osm',
      needsCoordinateLookup: false
    };
  });
}

/**
 * Resolves coordinates for a selected autocomplete prediction.
 * Uses Google Places Details Essentials (`X-Goog-FieldMask: id,location`)
 * to close the Autocomplete session at the lowest cost tier (10,000 free/month, $5/1k after).
 */
export async function resolvePlaceSelection(place: GeocodedPlace): Promise<GeocodedPlace> {
  if (!place.needsCoordinateLookup || !place.googlePlaceId || !hasGoogleMapsApiKey() || !canUseGoogleMapsToday()) {
    return place;
  }

  const apiKey = getGoogleMapsApiKey();
  try {
    const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(place.googlePlaceId)}`);
    url.searchParams.set('languageCode', 'it');
    if (place.sessionToken) {
      url.searchParams.set('sessionToken', place.sessionToken);
    }

    const res = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'id,displayName,formattedAddress,location,primaryType,types,rating,userRatingCount,regularOpeningHours,photos,googleMapsUri,websiteUri'
      }
    });

    if (res.ok) {
      const data = (await res.json()) as {
        id?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        location?: { latitude?: number; longitude?: number };
        primaryType?: string;
        types?: string[];
        rating?: number;
        userRatingCount?: number;
        regularOpeningHours?: { openNow?: boolean };
        photos?: Array<{ name?: string }>;
        googleMapsUri?: string;
        websiteUri?: string;
      };

      const lat = data.location?.latitude;
      const lng = data.location?.longitude;
      if (typeof lat === 'number' && typeof lng === 'number' && Number.isFinite(lat) && Number.isFinite(lng)) {
        void recordGoogleMapsUsage();

        const photoNames = (data.photos ?? [])
          .map((p) => p.name)
          .filter((n): n is string => Boolean(n))
          .slice(0, 3);

        const photos = photoNames.map(
          (name) => `https://places.googleapis.com/v1/${name}/media?maxHeightPx=360&maxWidthPx=480&key=${apiKey}`
        );
        const photoUrl = photos[0];
        const allTypes = [data.primaryType, ...(data.types || [])].filter((t): t is string => Boolean(t));

        return {
          ...place,
          lat,
          lng,
          shortName: data.displayName?.text || place.shortName,
          displayName: data.formattedAddress || place.displayName,
          suggestedCategory: mapGoogleTypesToCategory(allTypes) || place.suggestedCategory,
          rating: data.rating,
          userRatingCount: data.userRatingCount,
          isOpenNow: data.regularOpeningHours?.openNow,
          photoUrl,
          photos: photos.length > 0 ? photos : undefined,
          googleMapsUri: data.googleMapsUri,
          websiteUri: data.websiteUri,
          needsCoordinateLookup: false,
          sessionToken: undefined
        };
      }
    }
  } catch {
    // Fall back to OSM coordinates search if Google fails
  }

  // Fallback coordinate resolution via Photon
  try {
    const osmMatches = await autocompletePlaces(place.shortName);
    const firstResolved = osmMatches.find((m) => !m.needsCoordinateLookup && m.lat !== 0 && m.lng !== 0);
    if (firstResolved) {
      return {
        ...place,
        lat: firstResolved.lat,
        lng: firstResolved.lng,
        needsCoordinateLookup: false,
        sessionToken: undefined
      };
    }
  } catch {
    // Ignore fallback errors
  }

  return {
    ...place,
    needsCoordinateLookup: false,
    sessionToken: undefined
  };
}

/**
 * Resolves place details when a user clicks a native POI icon directly on the Google Map canvas.
 * Uses Place Details Pro to retrieve official name, address, coordinates, and category.
 */
export async function resolveGooglePoiClick(
  placeId: string,
  fallbackLat: number,
  fallbackLng: number
): Promise<GeocodedPlace> {
  if (!hasGoogleMapsApiKey() || !canUseGoogleMapsToday()) {
    return reverseGeocode(fallbackLat, fallbackLng);
  }

  const apiKey = getGoogleMapsApiKey();
  try {
    const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
    url.searchParams.set('languageCode', 'it');

    const res = await fetch(url.toString(), {
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask':
          'id,displayName,formattedAddress,location,primaryType,types,rating,userRatingCount,regularOpeningHours,photos,googleMapsUri,websiteUri,reviews'
      }
    });

    if (res.ok) {
      void recordGoogleMapsUsage();
      const data = (await res.json()) as {
        id?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        location?: { latitude?: number; longitude?: number };
        primaryType?: string;
        types?: string[];
        rating?: number;
        userRatingCount?: number;
        regularOpeningHours?: { openNow?: boolean };
        photos?: Array<{ name?: string }>;
        googleMapsUri?: string;
        websiteUri?: string;
        reviews?: Array<{
          authorAttribution?: { displayName?: string };
          rating?: number;
          text?: { text?: string };
          relativePublishTimeDescription?: string;
        }>;
      };

      const title = data.displayName?.text || 'Luogo selezionato';
      const address = data.formattedAddress || '';
      const lat = typeof data.location?.latitude === 'number' ? data.location.latitude : fallbackLat;
      const lng = typeof data.location?.longitude === 'number' ? data.location.longitude : fallbackLng;
      const allTypes = [data.primaryType, ...(data.types || [])].filter((t): t is string => Boolean(t));
      const photoNames = (data.photos ?? [])
        .map((p) => p.name)
        .filter((n): n is string => Boolean(n))
        .slice(0, 3);

      const photos = photoNames.map(
        (name) => `https://places.googleapis.com/v1/${name}/media?maxHeightPx=360&maxWidthPx=480&key=${apiKey}`
      );
      const photoUrl = photos[0];

      const reviews: GooglePlaceReview[] = (data.reviews ?? []).slice(0, 3).map((r) => ({
        authorName: r.authorAttribution?.displayName || 'Utente Google',
        rating: r.rating,
        text: r.text?.text,
        relativeTimeDescription: r.relativePublishTimeDescription
      }));

      return {
        shortName: title,
        displayName: address ? `${title}, ${address}` : title,
        lat,
        lng,
        googlePlaceId: placeId,
        suggestedCategory: mapGoogleTypesToCategory(allTypes),
        provider: 'google',
        needsCoordinateLookup: false,
        rating: data.rating,
        userRatingCount: data.userRatingCount,
        photoUrl,
        photos: photos.length > 0 ? photos : undefined,
        isOpenNow: data.regularOpeningHours?.openNow,
        websiteUri: data.websiteUri,
        googleMapsUri: data.googleMapsUri,
        reviews: reviews.length > 0 ? reviews : undefined
      };
    }
  } catch {
    // Fall back to reverse geocode
  }

  return reverseGeocode(fallbackLat, fallbackLng);
}

export interface PlacePreviewResult {
  photos: string[];
  rating?: number;
  userRatingCount?: number;
  googlePlaceId?: string;
  googleMapsUri?: string;
}

const placePreviewCache = new Map<string, Promise<PlacePreviewResult>>();

/**
 * Fetches 2-3 preview photos and ratings from Google Maps for any place or search query.
 * Features graceful fallback to Wikipedia/Wikimedia Commons if Google is unavailable or has no photos.
 * Includes module-level cache and in-flight deduplication to minimize network requests.
 */
export async function fetchPlacePreviewPhotos(params: {
  query?: string;
  biasCenter?: [number, number];
  placeId?: string;
}): Promise<PlacePreviewResult> {
  const { query, biasCenter, placeId } = params;
  const cleanQuery = (query || '').trim();

  const cacheKey = placeId
    ? `id_${placeId}`
    : `q_${cleanQuery.toLowerCase()}_${biasCenter ? biasCenter.map((n) => n.toFixed(3)).join(',') : ''}`;

  if (placePreviewCache.has(cacheKey)) {
    return placePreviewCache.get(cacheKey)!;
  }

  const promise = (async (): Promise<PlacePreviewResult> => {
    // 1. If we have a Google Place ID
    if (placeId && hasGoogleMapsApiKey() && canUseGoogleMapsToday()) {
      const apiKey = getGoogleMapsApiKey();
      try {
        const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
        url.searchParams.set('languageCode', 'it');

        const res = await fetch(url.toString(), {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'id,photos,rating,userRatingCount,googleMapsUri'
          }
        });

        if (res.ok) {
          void recordGoogleMapsUsage();
          const data = (await res.json()) as {
            id?: string;
            photos?: Array<{ name?: string }>;
            rating?: number;
            userRatingCount?: number;
            googleMapsUri?: string;
          };

          const photoNames = (data.photos ?? [])
            .map((p) => p.name)
            .filter((n): n is string => Boolean(n))
            .slice(0, 3);

          const photos = photoNames.map(
            (name) => `https://places.googleapis.com/v1/${name}/media?maxHeightPx=360&maxWidthPx=480&key=${apiKey}`
          );

          if (photos.length > 0) {
            return {
              photos,
              rating: data.rating,
              userRatingCount: data.userRatingCount,
              googlePlaceId: data.id || placeId,
              googleMapsUri: data.googleMapsUri
            };
          }
        }
      } catch {
        // Fall through to text search / Wikipedia
      }
    }

    // 2. If we have a query string
    if (cleanQuery && hasGoogleMapsApiKey() && canUseGoogleMapsToday()) {
      const apiKey = getGoogleMapsApiKey();
      try {
        const body: Record<string, unknown> = {
          textQuery: cleanQuery,
          languageCode: 'it',
          regionCode: 'IT'
        };

        if (biasCenter && Number.isFinite(biasCenter[0]) && Number.isFinite(biasCenter[1])) {
          body.locationBias = {
            circle: {
              center: { latitude: biasCenter[0], longitude: biasCenter[1] },
              radius: 50000.0
            }
          };
        }

        const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask':
              'places.id,places.photos,places.rating,places.userRatingCount,places.googleMapsUri'
          },
          body: JSON.stringify(body)
        });

        if (res.ok) {
          void recordGoogleMapsUsage();
          const json = (await res.json()) as {
            places?: Array<{
              id?: string;
              photos?: Array<{ name?: string }>;
              rating?: number;
              userRatingCount?: number;
              googleMapsUri?: string;
            }>;
          };

          const top = json.places?.[0];
          if (top) {
            const photoNames = (top.photos ?? [])
              .map((p) => p.name)
              .filter((n): n is string => Boolean(n))
              .slice(0, 3);

            const photos = photoNames.map(
              (name) => `https://places.googleapis.com/v1/${name}/media?maxHeightPx=360&maxWidthPx=480&key=${apiKey}`
            );

            if (photos.length > 0) {
              return {
                photos,
                rating: top.rating,
                userRatingCount: top.userRatingCount,
                googlePlaceId: top.id,
                googleMapsUri: top.googleMapsUri
              };
            }
          }
        }
      } catch {
        // Fall through to Wikipedia
      }
    }

    // 3. Wikipedia Fallback (0 auth, 0 latency, high quality encyclopedic photos)
    if (cleanQuery) {
      const topic = cleanQuery.split(/[,(]/)[0].trim();
      if (topic.length >= 2) {
        try {
          const resIt = await fetch(
            `https://it.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`
          );
          if (resIt.ok) {
            const dataIt = (await resIt.json()) as {
              thumbnail?: { source?: string };
              originalimage?: { source?: string };
            };
            const photo = dataIt.originalimage?.source || dataIt.thumbnail?.source;
            if (photo) {
              return { photos: [photo] };
            }
          }

          const resEn = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`
          );
          if (resEn.ok) {
            const dataEn = (await resEn.json()) as {
              thumbnail?: { source?: string };
              originalimage?: { source?: string };
            };
            const photo = dataEn.originalimage?.source || dataEn.thumbnail?.source;
            if (photo) {
              return { photos: [photo] };
            }
          }
        } catch {
          // Fallback
        }
      }
    }

    return { photos: [] };
  })();

  placePreviewCache.set(cacheKey, promise);
  return promise;
}

/**
 * Backward-compatible place search for automated planners and one-shot lookups
 * (used by naturalItineraryParser.ts and auto-geocoding on Save).
 * Guaranteed to return GeocodedPlace items with resolved coordinates.
 */
export async function searchPlaces(
  query: string,
  biasCenter?: [number, number]
): Promise<GeocodedPlace[]> {
  const token = createPlacesSessionToken();
  const rawList = await autocompletePlaces(query, biasCenter, token);
  if (rawList.length === 0) return [];

  // Automatically resolve the first candidate if it came from Google Autocomplete
  if (rawList[0].needsCoordinateLookup) {
    const resolved = await resolvePlaceSelection(rawList[0]);
    return [resolved, ...rawList.slice(1)];
  }

  return rawList;
}

/**
 * Direct forward geocoding for full street addresses or landmarks.
 * Useful when autocomplete does not return an exact house number or full address.
 */
export async function forwardGeocodeAddress(
  address: string,
  biasCenter?: [number, number]
): Promise<GeocodedPlace | null> {
  const trimmed = address.trim();
  if (trimmed.length < 2) return null;

  // 1. Google Geocoding API if configured and quota permitted
  if (hasGoogleMapsApiKey() && canUseGoogleMapsToday()) {
    const apiKey = getGoogleMapsApiKey();
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('address', trimmed);
      url.searchParams.set('language', 'it');
      url.searchParams.set('key', apiKey);
      if (biasCenter && Number.isFinite(biasCenter[0]) && Number.isFinite(biasCenter[1])) {
        url.searchParams.set(
          'bounds',
          `${biasCenter[0] - 0.5},${biasCenter[1] - 0.5}|${biasCenter[0] + 0.5},${biasCenter[1] + 0.5}`
        );
      }

      const res = await fetch(url.toString());
      if (res.ok) {
        const json = (await res.json()) as {
          status?: string;
          results?: Array<{
            formatted_address?: string;
            place_id?: string;
            types?: string[];
            geometry?: {
              location?: { lat: number; lng: number };
            };
            address_components?: Array<{
              long_name?: string;
              types?: string[];
            }>;
          }>;
        };

        if (json.status === 'OK' && json.results && json.results.length > 0) {
          void recordGoogleMapsUsage();
          const top = json.results[0];
          const lat = top.geometry?.location?.lat;
          const lng = top.geometry?.location?.lng;
          if (typeof lat === 'number' && typeof lng === 'number') {
            const comps = top.address_components || [];
            const street = comps.find((c) => c.types?.includes('route'))?.long_name;
            const streetNum = comps.find((c) => c.types?.includes('street_number'))?.long_name;
            const locality = comps.find((c) => c.types?.includes('locality'))?.long_name;
            const poi = comps.find((c) => c.types?.includes('point_of_interest') || c.types?.includes('establishment'))?.long_name;

            const streetPart = [street, streetNum].filter(Boolean).join(' ');
            const title = poi || streetPart || locality || trimmed;
            const subtitle = top.formatted_address || [title, locality].filter(Boolean).join(', ');

            return {
              shortName: title,
              displayName: subtitle,
              lat,
              lng,
              googlePlaceId: top.place_id,
              suggestedCategory: mapGoogleTypesToCategory(top.types),
              provider: 'google',
              needsCoordinateLookup: false
            };
          }
        }
      }
    } catch {
      // Fall through to Nominatim
    }
  }

  // 2. OpenStreetMap Nominatim forward search fallback
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', trimmed);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    url.searchParams.set('accept-language', 'it,en');

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' }
    });

    if (res.ok) {
      const data = (await res.json()) as Array<{
        lat: string;
        lon: string;
        name?: string;
        display_name?: string;
      }>;

      if (data && data.length > 0) {
        const top = data[0];
        const lat = parseFloat(top.lat);
        const lng = parseFloat(top.lon);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          return {
            shortName: top.name || trimmed,
            displayName: top.display_name || trimmed,
            lat,
            lng,
            provider: 'osm',
            needsCoordinateLookup: false
          };
        }
      }
    }
  } catch {
    // Ignore fallback errors
  }

  return null;
}

/**
 * Reverse Geocoding from GPS coordinates.
 * Resolves street, landmark, neighborhood, and city via Google Geocoding (with OSM fallback).
 */
export async function reverseGeocode(lat: number, lng: number): Promise<GeocodedPlace> {
  const coordFallback = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  // 1. Google Geocoding API if configured
  if (hasGoogleMapsApiKey() && canUseGoogleMapsToday()) {
    const apiKey = getGoogleMapsApiKey();
    try {
      const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
      url.searchParams.set('latlng', `${lat},${lng}`);
      url.searchParams.set('language', 'it');
      url.searchParams.set('key', apiKey);

      const res = await fetch(url.toString());
      if (res.ok) {
        const json = (await res.json()) as {
          status?: string;
          results?: Array<{
            formatted_address?: string;
            place_id?: string;
            types?: string[];
            address_components?: Array<{
              long_name?: string;
              types?: string[];
            }>;
          }>;
        };

        if (json.status === 'OK' && json.results && json.results.length > 0) {
          void recordGoogleMapsUsage();
          const top = json.results[0];
          const comps = top.address_components || [];
          const street = comps.find((c) => c.types?.includes('route'))?.long_name;
          const streetNum = comps.find((c) => c.types?.includes('street_number'))?.long_name;
          const neighborhood = comps.find((c) => c.types?.includes('sublocality') || c.types?.includes('neighborhood'))?.long_name;
          const locality = comps.find((c) => c.types?.includes('locality'))?.long_name;
          const poi = comps.find((c) => c.types?.includes('point_of_interest') || c.types?.includes('establishment'))?.long_name;

          const streetPart = [street, streetNum].filter(Boolean).join(' ');
          const title = poi || streetPart || neighborhood || locality || 'Punto su mappa';
          const subtitle = top.formatted_address || [title, locality].filter(Boolean).join(', ');

          return {
            shortName: title,
            displayName: subtitle,
            lat,
            lng,
            googlePlaceId: top.place_id,
            suggestedCategory: mapGoogleTypesToCategory(top.types),
            provider: 'google',
            needsCoordinateLookup: false
          };
        }
      }
    } catch {
      // Fall through to Nominatim
    }
  }

  // 2. OpenStreetMap Nominatim fallback
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(lat));
    url.searchParams.set('lon', String(lng));
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('zoom', '18');
    url.searchParams.set('accept-language', 'it,en');

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' }
    });

    if (res.ok) {
      const data = (await res.json()) as {
        name?: string;
        display_name?: string;
        address?: {
          tourism?: string;
          amenity?: string;
          historic?: string;
          shop?: string;
          building?: string;
          road?: string;
          house_number?: string;
          suburb?: string;
          neighbourhood?: string;
          quarter?: string;
          city?: string;
          town?: string;
          village?: string;
          country?: string;
        };
      };

      const a = data.address ?? {};
      const poi = data.name || a.tourism || a.historic || a.amenity || a.shop || a.building;
      const road = [a.road, a.house_number].filter(Boolean).join(' ');
      const area = a.neighbourhood || a.quarter || a.suburb || '';
      const city = a.city || a.town || a.village || '';

      const title = poi || road || area || city || 'Punto su mappa';
      const subtitleParts = [road !== title ? road : '', area !== title ? area : '', city]
        .filter(Boolean)
        .filter((v, i, arr) => arr.indexOf(v) === i);

      return {
        shortName: [title, subtitleParts[0] || city].filter(Boolean).join(', '),
        displayName: data.display_name || [title, ...subtitleParts].join(', ') || coordFallback,
        lat,
        lng,
        provider: 'osm',
        needsCoordinateLookup: false
      };
    }
  } catch {
    // Try Photon reverse fallback
  }

  try {
    const photonRev = new URL('https://photon.komoot.io/reverse');
    photonRev.searchParams.set('lat', String(lat));
    photonRev.searchParams.set('lon', String(lng));
    photonRev.searchParams.set('lang', 'en');
    const res = await fetch(photonRev.toString(), {
      headers: { Accept: 'application/json' }
    });
    if (res.ok) {
      const json = (await res.json()) as { features?: PhotonFeature[] };
      const first = json.features?.[0] ? formatPhotonFeature(json.features[0]) : null;
      if (first) {
        return { ...first, lat, lng };
      }
    }
  } catch {
    // Offline fallback
  }

  return {
    shortName: `Punto selezionato (${coordFallback})`,
    displayName: coordFallback,
    lat,
    lng,
    provider: 'osm',
    needsCoordinateLookup: false
  };
}

/**
 * Builds an external turn-by-turn navigation URL (Google Maps universal cross-platform link).
 * When `googlePlaceId` is provided, opens the official Google Maps place card directly with
 * photos, opening hours, and reviews at $0.00.
 */
export function buildExternalMapsUrl(params: {
  locationName?: string;
  lat?: number;
  lng?: number;
  googlePlaceId?: string;
  customUrl?: string;
}): string {
  if (params.customUrl && params.customUrl.trim().startsWith('http')) {
    return params.customUrl.trim();
  }
  if (params.googlePlaceId) {
    const q = params.locationName
      ? encodeURIComponent(params.locationName)
      : typeof params.lat === 'number' && typeof params.lng === 'number'
        ? `${params.lat},${params.lng}`
        : '';
    return `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=${encodeURIComponent(params.googlePlaceId)}`;
  }
  if (typeof params.lat === 'number' && typeof params.lng === 'number') {
    const q = params.locationName
      ? `${encodeURIComponent(params.locationName)}@${params.lat},${params.lng}`
      : `${params.lat},${params.lng}`;
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }
  if (params.locationName) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(params.locationName)}`;
  }
  return 'https://www.google.com/maps';
}
