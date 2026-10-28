import type { ActivityCategory } from '../types/trip';

export interface GoogleLatLngLiteral {
  lat: number;
  lng: number;
}

export interface GoogleLatLng {
  lat(): number;
  lng(): number;
}

export interface GoogleMapMouseEvent {
  latLng?: GoogleLatLng | null;
  placeId?: string;
  stop?: () => void;
  domEvent?: {
    preventDefault?: () => void;
    stopPropagation?: () => void;
  } | MouseEvent | Event;
}

export interface GoogleLatLngBounds {
  extend(point: GoogleLatLngLiteral | GoogleLatLng): void;
  isEmpty(): boolean;
}

export interface GoogleMapsListener {
  remove(): void;
}

export interface GoogleMapInstance {
  setCenter(latlng: GoogleLatLngLiteral): void;
  panTo(latlng: GoogleLatLngLiteral): void;
  setZoom(zoom: number): void;
  getZoom(): number | undefined;
  getCenter(): GoogleLatLng | undefined;
  setMapTypeId(mapTypeId: 'roadmap' | 'hybrid' | 'terrain'): void;
  fitBounds(
    bounds: GoogleLatLngBounds,
    padding?: number | { top: number; right: number; bottom: number; left: number }
  ): void;
  setOptions(options: Record<string, unknown>): void;
  addListener(eventName: string, handler: (e: GoogleMapMouseEvent) => void): GoogleMapsListener;
}

export interface GoogleMarkerInstance {
  setMap(map: GoogleMapInstance | null): void;
  getPosition(): GoogleLatLng | undefined;
  addListener(eventName: string, handler: () => void): GoogleMapsListener;
}

export interface GoogleInfoWindowInstance {
  setContent(html: string): void;
  open(options: { map: GoogleMapInstance; anchor: GoogleMarkerInstance }): void;
  close(): void;
}

export interface GooglePolylineInstance {
  setMap(map: GoogleMapInstance | null): void;
}

export interface GoogleCircleInstance {
  setMap(map: GoogleMapInstance | null): void;
}

export interface GoogleMapsNamespace {
  Map: new (el: HTMLElement, opts: Record<string, unknown>) => GoogleMapInstance;
  Marker: new (opts: Record<string, unknown>) => GoogleMarkerInstance;
  InfoWindow: new (opts?: Record<string, unknown>) => GoogleInfoWindowInstance;
  Polyline: new (opts: Record<string, unknown>) => GooglePolylineInstance;
  Circle: new (opts: Record<string, unknown>) => GoogleCircleInstance;
  LatLngBounds: new () => GoogleLatLngBounds;
  Size: new (width: number, height: number) => unknown;
  Point: new (x: number, y: number) => unknown;
  event: {
    trigger(instance: unknown, eventName: string): void;
    clearInstanceListeners(instance: unknown): void;
  };
}

declare global {
  interface Window {
    google?: {
      maps?: GoogleMapsNamespace;
    };
    gm_authFailure?: () => void;
    __tripwiseInitGoogleMaps?: () => void;
  }
}

let runtimeAuthFailed = false;
let sdkPromise: Promise<GoogleMapsNamespace | null> | null = null;
const failureSubscribers = new Set<() => void>();

export function getGoogleMapsApiKey(): string {
  const raw = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  return (raw ?? '').trim();
}

export function hasGoogleMapsApiKey(): boolean {
  return getGoogleMapsApiKey().length > 10 && !runtimeAuthFailed;
}

export function isGoogleMapsAuthFailed(): boolean {
  return runtimeAuthFailed;
}

export function markGoogleMapsAuthFailure(): void {
  if (runtimeAuthFailed) return;
  runtimeAuthFailed = true;
  failureSubscribers.forEach((cb) => {
    try {
      cb();
    } catch {
      // Ignore subscriber errors
    }
  });
}

export function onGoogleMapsAuthFailure(callback: () => void): () => void {
  failureSubscribers.add(callback);
  return () => {
    failureSubscribers.delete(callback);
  };
}

/**
 * Loads the official Google Maps JavaScript API (`v=weekly`, `loading=async`, Italian UI)
 * once per browser session. Automatically catches `gm_authFailure` (e.g. if billing or Maps JS API
 * is not enabled yet) and triggers clean fallback to OpenStreetMap without showing developer errors.
 */
export function loadGoogleMapsSdk(): Promise<GoogleMapsNamespace | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey || runtimeAuthFailed) return Promise.resolve(null);

  if (window.google?.maps?.Map) {
    return Promise.resolve(window.google.maps);
  }

  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<GoogleMapsNamespace | null>((resolve) => {
    let settled = false;
    const finish = (val: GoogleMapsNamespace | null) => {
      if (settled) return;
      settled = true;
      resolve(val);
    };

    const prevAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      if (typeof prevAuthFailure === 'function') {
        prevAuthFailure();
      }
      markGoogleMapsAuthFailure();
      finish(null);
    };

    window.__tripwiseInitGoogleMaps = () => {
      if (runtimeAuthFailed || !window.google?.maps?.Map) {
        finish(null);
      } else {
        finish(window.google.maps);
      }
    };

    const existing = document.getElementById('tripwise-google-maps-sdk') as HTMLScriptElement | null;
    if (existing) {
      if (window.google?.maps?.Map) {
        finish(window.google.maps);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'tripwise-google-maps-sdk';
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&v=weekly&language=it&region=IT&loading=async&callback=__tripwiseInitGoogleMaps`;
    script.onerror = () => {
      sdkPromise = null;
      finish(null);
    };

    const timeoutId = window.setTimeout(() => {
      if (!settled) {
        sdkPromise = null;
        finish(null);
      }
    }, 10000);

    const origFinish = finish;
    window.__tripwiseInitGoogleMaps = () => {
      window.clearTimeout(timeoutId);
      if (runtimeAuthFailed || !window.google?.maps?.Map) {
        origFinish(null);
      } else {
        origFinish(window.google.maps);
      }
    };

    document.head.appendChild(script);
  });

  return sdkPromise;
}

function getCategoryInnerSvgPaths(category: ActivityCategory): string {
  switch (category) {
    case 'food':
      return `<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>`;
    case 'lodging':
      return `<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/>`;
    case 'shopping':
      return `<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>`;
    case 'hidden_gem':
      return `<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill="rgba(255,255,255,0.35)"/>`;
    case 'relax':
      return `<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" fill="rgba(255,255,255,0.3)"/>`;
    case 'transport':
      return `<rect width="16" height="16" x="4" y="3" rx="2"/><path d="M4 11h16"/><path d="M12 3v8"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><path d="M8 15h.01"/><path d="M16 15h.01"/>`;
    case 'sightseeing':
    default:
      return `<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="rgba(255,255,255,0.3)"/>`;
  }
}

/**
 * Generates a Retina-crisp SVG Data-URI pin for `google.maps.Marker`
 * (works immediately without requiring a Cloud Console Vector `mapId`).
 */
export function buildGoogleActivityPinDataUrl(params: {
  size: number;
  fillHex: string;
  pinStyle: 'numbered' | 'category';
  order: number;
  category: ActivityCategory;
  isFavorite?: boolean;
}): string {
  const { size, fillHex, pinStyle, order, category, isFavorite } = params;
  const cx = size / 2;
  const r = cx - 3;
  const outerRing = isFavorite
    ? `<circle cx="${cx}" cy="${cx}" r="${cx - 1}" fill="none" stroke="#f59e0b" stroke-width="2"/>`
    : '';

  const innerMarkup =
    pinStyle === 'category'
      ? `<g transform="translate(${cx - 8.5}, ${cx - 8.5}) scale(0.71)" fill="none" stroke="#ffffff" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round">${getCategoryInnerSvgPaths(
          category
        )}</g>`
      : `<text x="${cx}" y="${cx}" dominant-baseline="central" text-anchor="middle" fill="#ffffff" font-family="system-ui,-apple-system,sans-serif" font-weight="800" font-size="13">${order}</text>`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${outerRing}<circle cx="${cx}" cy="${cx}" r="${r}" fill="${fillHex}" stroke="#ffffff" stroke-width="3"/>${innerMarkup}</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function buildGooglePreviewPinDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="20" fill="rgba(16,185,129,0.28)"/><circle cx="22" cy="22" r="15" fill="#059669" stroke="#ffffff" stroke-width="3"/><path d="M22 16v12M16 22h12" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export function buildGoogleGpsDotDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="rgba(37,99,235,0.26)"/><circle cx="14" cy="14" r="8" fill="#2563eb" stroke="#ffffff" stroke-width="3"/></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
