import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Plus,
  MapPin,
  Search,
  Loader2,
  X,
  Crosshair,
  LocateFixed,
  Maximize2,
  Minimize2,
  Focus,
  ChevronLeft,
  ChevronRight,
  Star,
  ExternalLink
} from 'lucide-react';
import type { Activity, ActivityCategory } from '../../types/trip';
import { PLACE_CATEGORY_META, getCategoryPinSvg } from '../../data/placeCategories';
import { WeatherPreview } from '../weather/WeatherPreview';
import { PlacePhotoPreview } from '../ui/PlacePhotoPreview';
import {
  buildExternalMapsUrl,
  autocompletePlaces,
  forwardGeocodeAddress,
  resolvePlaceSelection,
  resolveGooglePoiClick,
  createPlacesSessionToken,
  reverseGeocode,
  type GeocodedPlace
} from '../../services/geocoding';
import {
  hasGoogleMapsApiKey,
  loadGoogleMapsSdk,
  onGoogleMapsAuthFailure,
  buildGoogleActivityPinDataUrl,
  buildGooglePreviewPinDataUrl,
  buildGoogleGpsDotDataUrl,
  type GoogleMapInstance,
  type GoogleMarkerInstance,
  type GoogleInfoWindowInstance,
  type GooglePolylineInstance,
  type GoogleCircleInstance,
  type GoogleMapsNamespace,
  type GoogleMapMouseEvent
} from '../../services/googleMapsLoader';

export type MapTileStyle = 'voyager' | 'osm' | 'satellite';
export type GoogleMapStyle = 'roadmap' | 'hybrid' | 'terrain';

export interface InAppMapProps {
  activities: Activity[];
  defaultCenter: [number, number];
  selectedActivityId?: string | null;
  onSelectActivity?: (activityId: string | null) => void;
  onRequestAddActivity?: () => void;
  onPickLocationFromMap?: (place: GeocodedPlace) => void;
  layoutKey?: string;
  isFullMap?: boolean;
  /** Connect stops with a dashed route line (true for daily itinerary, false for Places Recap & Picker). */
  showRoutePolyline?: boolean;
  /** 'numbered' renders sequential 1..N pins; 'category' renders point-type category SVG icons without numbers. */
  pinStyle?: 'numbered' | 'category';
  /** Start immediately in single-tap crosshair pick mode. */
  initialPickMode?: boolean;
  /** Optional initial focus coordinate [lat, lng] (e.g. when opening modal picker on an existing pin). */
  initialFocusCenter?: [number, number] | null;
  /** Custom CTA label on the picked-point confirmation button. */
  confirmPickLabel?: string;
  /** Custom CTA label for the "+ Nuova Tappa" / "+ Nuovo Preferito" button. */
  addActionLabel?: string;
  /** Target date for weather forecasts (ISO YYYY-MM-DD). */
  date?: string;
  /** Custom CSS height for the map canvas in normal (non-fullscreen) mode. */
  customHeight?: string;
  /** Hide "+ Nuova Tappa" button (e.g. when already inside a creation modal). */
  hideAddButton?: boolean;
  /** Set true when rendered inside a native <dialog> modal so expand mode adjusts height cleanly in-place. */
  insideModal?: boolean;
}

const TILE_LAYERS: Record<
  MapTileStyle,
  {
    label: string;
    short: string;
    url: string;
    attribution: string;
    maxZoom: number;
    subdomains?: string;
  }
> = {
  voyager: {
    label: 'Nitida HD',
    short: 'HD',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 20,
    subdomains: 'abcd'
  },
  osm: {
    label: 'OSM',
    short: 'OSM',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
    subdomains: 'abc'
  },
  satellite: {
    label: 'Satellite',
    short: 'Sat',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    maxZoom: 19
  }
};

const GOOGLE_STYLES: Record<GoogleMapStyle, { label: string; short: string }> = {
  roadmap: { label: 'Mappa', short: 'Mappa' },
  hybrid: { label: 'Satellite', short: 'Sat' },
  terrain: { label: 'Rilievo', short: 'Ril.' }
};

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export const InAppMap: React.FC<InAppMapProps> = ({
  activities,
  defaultCenter,
  selectedActivityId,
  onSelectActivity,
  onRequestAddActivity,
  onPickLocationFromMap,
  layoutKey = 'split',
  isFullMap = false,
  showRoutePolyline = true,
  pinStyle = 'numbered',
  initialPickMode = false,
  initialFocusCenter = null,
  confirmPickLabel = 'Aggiungi Tappa qui',
  addActionLabel = 'Nuova Tappa',
  customHeight,
  hideAddButton = false,
  insideModal = false,
  date
}) => {
  const idPrefix = useId();
  const searchInputId = `${idPrefix}-map-search`;
  const searchListboxId = `${idPrefix}-map-results`;

  const containerRef = useRef<HTMLDivElement>(null);
  const quickStripRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Engine state: Google Maps (if configured) or Leaflet HD fallback
  const [useGoogle, setUseGoogle] = useState<boolean>(hasGoogleMapsApiKey());
  const [googleSdk, setGoogleSdk] = useState<GoogleMapsNamespace | null>(null);

  // Leaflet refs
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const previewLayerRef = useRef<L.LayerGroup | null>(null);
  const userLocLayerRef = useRef<L.LayerGroup | null>(null);
  const markerByIdRef = useRef<Map<string, L.Marker>>(new Map());

  // Google Maps refs
  const googleMapRef = useRef<GoogleMapInstance | null>(null);
  const googleMarkersRef = useRef<GoogleMarkerInstance[]>([]);
  const googlePolylineRef = useRef<GooglePolylineInstance | null>(null);
  const googlePreviewMarkerRef = useRef<GoogleMarkerInstance | null>(null);
  const googleUserCircleRef = useRef<GoogleCircleInstance | null>(null);
  const googleUserMarkerRef = useRef<GoogleMarkerInstance | null>(null);
  const googleInfoWindowRef = useRef<GoogleInfoWindowInstance | null>(null);

  const lastFittedLayoutKeyRef = useRef<string>('');
  const lastPannedActivityIdRef = useRef<string | null>(null);
  const sessionTokenRef = useRef<string>(createPlacesSessionToken());

  // Layer style state
  const [tileStyle, setTileStyle] = useState<MapTileStyle>('voyager');
  const [googleStyle, setGoogleStyle] = useState<GoogleMapStyle>('roadmap');

  const [isExpanded, setIsExpanded] = useState(false);
  const [mapQuery, setMapQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodedPlace[]>([]);
  const [searchingMap, setSearchingMap] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [pickMode, setPickMode] = useState(initialPickMode);
  const [locatingGps, setLocatingGps] = useState(false);
  const [pickedState, setPickedState] = useState<{
    loading: boolean;
    place: GeocodedPlace;
  } | null>(null);

  const pickModeRef = useRef(initialPickMode);
  const lastPickTimestampRef = useRef(0);
  const reverseReqIdRef = useRef(0);
  const suppressNextDebounceRef = useRef(false);

  // Subscribe to Google Maps auth failures for instant graceful fallback to Leaflet
  useEffect(() => {
    const unsub = onGoogleMapsAuthFailure(() => {
      setUseGoogle(false);
      setGoogleSdk(null);
    });
    return unsub;
  }, []);

  // Try loading Google Maps SDK when configured
  useEffect(() => {
    let active = true;
    if (hasGoogleMapsApiKey()) {
      loadGoogleMapsSdk().then((sdk) => {
        if (!active) return;
        if (sdk) {
          setGoogleSdk(sdk);
          setUseGoogle(true);
        } else {
          setUseGoogle(false);
        }
      });
    } else {
      setUseGoogle(false);
    }
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setPickMode(initialPickMode);
  }, [initialPickMode]);

  useEffect(() => {
    pickModeRef.current = pickMode;
    const el = containerRef.current;
    if (el) {
      el.classList.toggle('tripwise-pick-mode', pickMode);
    }
  }, [pickMode]);

  useEffect(() => {
    if (!isExpanded || insideModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isExpanded, insideModal]);

  const geoActivities = useMemo(
    () =>
      activities
        .map((act, idx) => ({ act, order: idx + 1 }))
        .filter(
          (item): item is { act: Activity & { lat: number; lng: number }; order: number } =>
            typeof item.act.lat === 'number' &&
            Number.isFinite(item.act.lat) &&
            typeof item.act.lng === 'number' &&
            Number.isFinite(item.act.lng)
        ),
    [activities]
  );

  const fitLeafletStops = (map: L.Map, allowWorldSpan = false) => {
    const el = containerRef.current;
    if (!el || el.clientWidth === 0 || el.clientHeight === 0) return;

    if (initialFocusCenter && !allowWorldSpan) {
      map.setView(initialFocusCenter, 15);
      return;
    }

    if (geoActivities.length === 0) {
      map.setView(defaultCenter, 13);
      return;
    }

    if (geoActivities.length === 1) {
      map.setView([geoActivities[0].act.lat, geoActivities[0].act.lng], 15);
      return;
    }

    const lats = geoActivities.map((g) => g.act.lat);
    const lngs = geoActivities.map((g) => g.act.lng);
    const latSpan = Math.max(...lats) - Math.min(...lats);
    const lngSpan = Math.max(...lngs) - Math.min(...lngs);

    if (!allowWorldSpan && (latSpan > 8 || lngSpan > 12)) {
      map.setView([geoActivities[0].act.lat, geoActivities[0].act.lng], 13);
      return;
    }

    const bounds = L.latLngBounds(geoActivities.map((g) => [g.act.lat, g.act.lng]));
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
    }
  };

  const fitGoogleStops = (gMap: GoogleMapInstance, sdk: GoogleMapsNamespace, allowWorldSpan = false) => {
    const el = containerRef.current;
    if (!el || el.clientWidth === 0 || el.clientHeight === 0) return;

    if (initialFocusCenter && !allowWorldSpan) {
      gMap.setCenter({ lat: initialFocusCenter[0], lng: initialFocusCenter[1] });
      gMap.setZoom(15);
      return;
    }

    if (geoActivities.length === 0) {
      gMap.setCenter({ lat: defaultCenter[0], lng: defaultCenter[1] });
      gMap.setZoom(13);
      return;
    }

    if (geoActivities.length === 1) {
      gMap.setCenter({ lat: geoActivities[0].act.lat, lng: geoActivities[0].act.lng });
      gMap.setZoom(15);
      return;
    }

    const bounds = new sdk.LatLngBounds();
    geoActivities.forEach((g) => bounds.extend({ lat: g.act.lat, lng: g.act.lng }));
    if (!bounds.isEmpty()) {
      gMap.fitBounds(bounds, 48);
    }
  };

  const handleCoordinatePick = async (lat: number, lng: number) => {
    const now = Date.now();
    if (now - lastPickTimestampRef.current < 350) return;
    lastPickTimestampRef.current = now;

    if (!initialPickMode) {
      setPickMode(false);
    }
    setSearchResults([]);
    setSearchError('');
    onSelectActivity?.(null);

    const reqId = ++reverseReqIdRef.current;

    // Immediate visual feedback (<16ms — Doherty Threshold)
    setPickedState({
      loading: true,
      place: {
        shortName: 'Rilevamento indirizzo...',
        displayName: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lat,
        lng
      }
    });

    if (useGoogle && googleMapRef.current) {
      googleMapRef.current.panTo({ lat, lng });
    } else if (mapRef.current) {
      mapRef.current.panTo([lat, lng], { animate: true });
    }

    const resolved = await reverseGeocode(lat, lng);
    if (reqId === reverseReqIdRef.current) {
      setPickedState({
        loading: false,
        place: resolved
      });
    }
  };

  const handleCoordinatePickRef = useRef(handleCoordinatePick);
  handleCoordinatePickRef.current = handleCoordinatePick;

  /**
   * Click handler for native clickable Google POI icons on the map (restaurants, shops, temples, hotels)
   */
  const handleGooglePoiClick = async (placeId: string, lat: number, lng: number) => {
    setPickMode(false);
    setSearchResults([]);
    setSearchError('');
    onSelectActivity?.(null);
    const reqId = ++reverseReqIdRef.current;

    setPickedState({
      loading: true,
      place: {
        shortName: 'Caricamento luogo Google...',
        displayName: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lat,
        lng,
        googlePlaceId: placeId,
        provider: 'google'
      }
    });

    googleMapRef.current?.panTo({ lat, lng });

    const resolved = await resolveGooglePoiClick(placeId, lat, lng);
    if (reqId === reverseReqIdRef.current) {
      setPickedState({
        loading: false,
        place: resolved
      });
    }
  };

  const handleGooglePoiClickRef = useRef(handleGooglePoiClick);
  handleGooglePoiClickRef.current = handleGooglePoiClick;

  const handleRightClickPick = async (lat: number, lng: number) => {
    setPickMode(false);
    setSearchResults([]);
    setSearchError('');
    onSelectActivity?.(null);
    const reqId = ++reverseReqIdRef.current;

    // Focus camera immediately on right-clicked location
    if (useGoogle && googleMapRef.current) {
      googleMapRef.current.panTo({ lat, lng });
    } else if (mapRef.current) {
      mapRef.current.panTo([lat, lng], { animate: true });
    }

    setPickedState({
      loading: true,
      place: {
        shortName: 'Rilevamento indirizzo...',
        displayName: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
        lat,
        lng
      }
    });

    const resolved = await reverseGeocode(lat, lng);
    if (reqId === reverseReqIdRef.current) {
      setPickedState({
        loading: false,
        place: resolved
      });
    }
  };

  const handleRightClickPickRef = useRef(handleRightClickPick);
  handleRightClickPickRef.current = handleRightClickPick;

  const createTileLayer = (styleKey: MapTileStyle): L.TileLayer => {
    const cfg = TILE_LAYERS[styleKey];
    const opts: L.TileLayerOptions = {
      maxZoom: cfg.maxZoom,
      attribution: cfg.attribution
    };
    if (cfg.subdomains) {
      opts.subdomains = cfg.subdomains;
    }
    return L.tileLayer(cfg.url, opts);
  };

  // Initialize Map Engine: Google Maps (if active) OR Leaflet HD
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const startCenter = initialFocusCenter ?? defaultCenter;
    const startZoom = initialFocusCenter ? 15 : 13;

    if (useGoogle && googleSdk) {
      // 1. Google Maps Engine
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const gMap = new googleSdk.Map(el, {
        center: { lat: startCenter[0], lng: startCenter[1] },
        zoom: startZoom,
        mapTypeId: googleStyle,
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        zoomControl: true,
        clickableIcons: true // Native POIs are clickable!
      });

      googleMapRef.current = gMap;
      googleInfoWindowRef.current = new googleSdk.InfoWindow();

      gMap.addListener('click', (e: GoogleMapMouseEvent) => {
        setSearchResults([]);
        searchInputRef.current?.blur();
        if (e.placeId) {
          if (typeof e.stop === 'function') e.stop();
          const lat = e.latLng?.lat() ?? 0;
          const lng = e.latLng?.lng() ?? 0;
          void handleGooglePoiClickRef.current(e.placeId, lat, lng);
        } else if (e.latLng) {
          void handleCoordinatePickRef.current(e.latLng.lat(), e.latLng.lng());
        }
      });

      gMap.addListener('rightclick', (e: GoogleMapMouseEvent) => {
        if (e.domEvent && typeof e.domEvent.preventDefault === 'function') {
          e.domEvent.preventDefault();
        }
        searchInputRef.current?.blur();
        if (e.placeId) {
          const lat = e.latLng?.lat() ?? 0;
          const lng = e.latLng?.lng() ?? 0;
          void handleGooglePoiClickRef.current(e.placeId, lat, lng);
        } else if (e.latLng) {
          void handleRightClickPickRef.current(e.latLng.lat(), e.latLng.lng());
        }
      });

      const ro = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          if (googleMapRef.current && googleSdk?.event) {
            googleSdk.event.trigger(googleMapRef.current, 'resize');
          }
        });
      });
      ro.observe(el);

      return () => {
        ro.disconnect();
        googleMapRef.current = null;
        googleMarkersRef.current = [];
        googlePolylineRef.current = null;
        googlePreviewMarkerRef.current = null;
        googleUserCircleRef.current = null;
        googleUserMarkerRef.current = null;
        googleInfoWindowRef.current = null;
      };
    } else {
      // 2. Leaflet HD Fallback Engine
      if (googleMapRef.current) {
        googleMapRef.current = null;
      }
      if (mapRef.current) return;

      const map = L.map(el, {
        center: startCenter,
        zoom: startZoom,
        zoomControl: true
      });

      const initialTiles = createTileLayer(tileStyle).addTo(map);
      const layerGroup = L.layerGroup().addTo(map);
      const previewGroup = L.layerGroup().addTo(map);
      const userLocGroup = L.layerGroup().addTo(map);

      mapRef.current = map;
      tileLayerRef.current = initialTiles;
      markersLayerRef.current = layerGroup;
      previewLayerRef.current = previewGroup;
      userLocLayerRef.current = userLocGroup;

      map.on('contextmenu', (e: L.LeafletMouseEvent) => {
        if (e.originalEvent && typeof e.originalEvent.preventDefault === 'function') {
          e.originalEvent.preventDefault();
        }
        searchInputRef.current?.blur();
        void handleRightClickPickRef.current(e.latlng.lat, e.latlng.lng);
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        setSearchResults([]);
        searchInputRef.current?.blur();
        if (e.latlng) {
          void handleCoordinatePickRef.current(e.latlng.lat, e.latlng.lng);
        }
      });

      let holdTimer: number | null = null;
      let startX = 0;
      let startY = 0;

      const clearHold = () => {
        if (holdTimer !== null) {
          window.clearTimeout(holdTimer);
          holdTimer = null;
        }
      };

      const onTouchStart = (ev: TouchEvent) => {
        if (ev.touches.length !== 1) {
          clearHold();
          return;
        }
        const target = ev.target as HTMLElement | null;
        if (target?.closest('.leaflet-marker-icon, .leaflet-popup, .leaflet-control')) {
          return;
        }

        const touch = ev.touches[0];
        startX = touch.clientX;
        startY = touch.clientY;

        clearHold();
        holdTimer = window.setTimeout(() => {
          holdTimer = null;
          const rect = el.getBoundingClientRect();
          const pt = L.point(startX - rect.left, startY - rect.top);
          const latlng = map.containerPointToLatLng(pt);
          if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
            navigator.vibrate(35);
          }
          void handleCoordinatePickRef.current(latlng.lat, latlng.lng);
        }, 500);
      };

      const onTouchMove = (ev: TouchEvent) => {
        if (holdTimer === null) return;
        if (ev.touches.length !== 1) {
          clearHold();
          return;
        }
        const touch = ev.touches[0];
        if (Math.hypot(touch.clientX - startX, touch.clientY - startY) > 10) {
          clearHold();
        }
      };

      el.addEventListener('touchstart', onTouchStart, { passive: true });
      el.addEventListener('touchmove', onTouchMove, { passive: true });
      el.addEventListener('touchend', clearHold, { passive: true });
      el.addEventListener('touchcancel', clearHold, { passive: true });

      const ro = new ResizeObserver(() => {
        requestAnimationFrame(() => {
          map.invalidateSize({ animate: false });
        });
      });
      ro.observe(el);

      return () => {
        clearHold();
        el.removeEventListener('touchstart', onTouchStart);
        el.removeEventListener('touchmove', onTouchMove);
        el.removeEventListener('touchend', clearHold);
        el.removeEventListener('touchcancel', clearHold);
        ro.disconnect();
        map.remove();
        mapRef.current = null;
        tileLayerRef.current = null;
        markersLayerRef.current = null;
        previewLayerRef.current = null;
        userLocLayerRef.current = null;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useGoogle, googleSdk]);

  // Sync Google Map style (Roadmap / Satellite / Terrain)
  useEffect(() => {
    if (useGoogle && googleMapRef.current) {
      googleMapRef.current.setMapTypeId(googleStyle);
    }
  }, [googleStyle, useGoogle]);

  // Sync Leaflet tile style (Voyager HD / OSM / Satellite)
  useEffect(() => {
    if (!useGoogle && mapRef.current) {
      if (tileLayerRef.current) {
        mapRef.current.removeLayer(tileLayerRef.current);
      }
      const nextTiles = createTileLayer(tileStyle).addTo(mapRef.current);
      tileLayerRef.current = nextTiles;
    }
  }, [tileStyle, useGoogle]);

  // Resize and camera invalidation on layout changes
  useEffect(() => {
    const layoutChanged = lastFittedLayoutKeyRef.current !== layoutKey;
    lastFittedLayoutKeyRef.current = layoutKey;

    if (useGoogle && googleMapRef.current && googleSdk) {
      const gMap = googleMapRef.current;
      googleSdk.event.trigger(gMap, 'resize');
      if (layoutChanged && !selectedActivityId && !pickedState) {
        fitGoogleStops(gMap, googleSdk, false);
      }
    } else if (mapRef.current) {
      const map = mapRef.current;
      map.invalidateSize({ animate: false });
      if (layoutChanged && !selectedActivityId && !pickedState) {
        fitLeafletStops(map, false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey, isFullMap, isExpanded, useGoogle]);

  // Render Activity Markers & Polyline (dual engine support)
  useEffect(() => {
    // A) Google Maps Engine
    if (useGoogle && googleMapRef.current && googleSdk) {
      const gMap = googleMapRef.current;
      googleMarkersRef.current.forEach((m) => m.setMap(null));
      googleMarkersRef.current = [];
      if (googlePolylineRef.current) {
        googlePolylineRef.current.setMap(null);
        googlePolylineRef.current = null;
      }

      if (geoActivities.length === 0) return;

      const path: Array<{ lat: number; lng: number }> = [];

      geoActivities.forEach(({ act, order }) => {
        const catKey: ActivityCategory = act.category || 'sightseeing';
        const catMeta = PLACE_CATEGORY_META[catKey] || PLACE_CATEGORY_META.sightseeing;
        const color = catMeta.colorHex;
        const isSelected = act.id === selectedActivityId;
        const isFavoritePin = act.id.startsWith('fav_');
        const size = pinStyle === 'category' ? (isSelected ? 42 : 36) : isSelected ? 38 : 32;

        const iconUrl = buildGoogleActivityPinDataUrl({
          size,
          fillHex: act.completed ? '#10b981' : color,
          pinStyle,
          order,
          category: catKey,
          isFavorite: isFavoritePin
        });

        const marker = new googleSdk.Marker({
          position: { lat: act.lat, lng: act.lng },
          map: gMap,
          icon: {
            url: iconUrl,
            scaledSize: new googleSdk.Size(size, size),
            anchor: new googleSdk.Point(size / 2, size / 2)
          },
          title: act.title,
          zIndex: isSelected ? 999 : 100
        });

        const navUrl = buildExternalMapsUrl({
          locationName: act.locationName || act.title,
          lat: act.lat,
          lng: act.lng,
          googlePlaceId: act.googlePlaceId,
          customUrl: act.mapUrl
        });

        const headerBadgeText =
          pinStyle === 'category'
            ? `${escapeHtml(catMeta.label)}${act.time ? ` • ${escapeHtml(act.time)}` : ''}`
            : `Tappa #${order}${act.time ? ` • ${escapeHtml(act.time)}` : ''}`;

        const popupHtml = `
          <div style="min-width: 200px; max-width: 260px; font-family: system-ui, -apple-system, sans-serif; padding: 4px;">
            <div style="font-size: 11px; font-weight: 700; color: ${color}; text-transform: uppercase; letter-spacing: 0.04em;">
              ${headerBadgeText}
            </div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">
              ${escapeHtml(act.title)}
            </div>
            ${
              act.locationName
                ? `<div style="font-size: 12px; color: #475569; margin-top: 2px;">📍 ${escapeHtml(act.locationName)}</div>`
                : ''
            }
            ${
              act.notes
                ? `<div style="font-size: 12px; color: #64748b; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 5px;">${escapeHtml(act.notes)}</div>`
                : ''
            }
            <a
              href="${escapeHtml(navUrl)}"
              target="_blank"
              rel="noopener noreferrer"
              style="
                display: inline-flex;
                align-items: center;
                gap: 4px;
                margin-top: 8px;
                padding: 6px 12px;
                border-radius: 8px;
                background: #4f46e5;
                color: #ffffff;
                font-size: 12px;
                font-weight: 600;
                text-decoration: none;
              "
            >
              Navigazione / Scheda ↗
            </a>
          </div>
        `;

        marker.addListener('click', () => {
          onSelectActivity?.(act.id);
          if (googleInfoWindowRef.current) {
            googleInfoWindowRef.current.setContent(popupHtml);
            googleInfoWindowRef.current.open({ map: gMap, anchor: marker });
          }
        });

        googleMarkersRef.current.push(marker);
        path.push({ lat: act.lat, lng: act.lng });
      });

      if (showRoutePolyline && path.length >= 2) {
        googlePolylineRef.current = new googleSdk.Polyline({
          path,
          geodesic: true,
          strokeOpacity: 0,
          icons: [
            {
              icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.85, strokeColor: '#4f46e5', scale: 3 },
              offset: '0',
              repeat: '14px'
            }
          ],
          map: gMap
        });
      }
      return;
    }

    // B) Leaflet Engine
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    markerByIdRef.current.clear();

    if (geoActivities.length === 0) {
      map.invalidateSize({ animate: false });
      return;
    }

    const latLngs: L.LatLngExpression[] = [];

    for (const { act, order } of geoActivities) {
      const catKey: ActivityCategory = act.category || 'sightseeing';
      const catMeta = PLACE_CATEGORY_META[catKey] || PLACE_CATEGORY_META.sightseeing;
      const color = catMeta.colorHex;
      const isSelected = act.id === selectedActivityId;
      const isFavoritePin = act.id.startsWith('fav_');
      const size = pinStyle === 'category' ? (isSelected ? 42 : 36) : isSelected ? 38 : 32;

      const innerContent =
        pinStyle === 'category'
          ? getCategoryPinSvg(catKey, isSelected ? 20 : 17)
          : String(order);

      const shadowRing = isFavoritePin
        ? '0 0 0 2.5px #f59e0b, 0 5px 14px rgba(15, 23, 42, 0.38)'
        : '0 4px 12px rgba(15, 23, 42, 0.35)';

      const icon = L.divIcon({
        className: 'tripwise-pin',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -size / 2],
        html: `
          <div style="
            width: ${size}px;
            height: ${size}px;
            border-radius: 9999px;
            background: ${act.completed ? '#10b981' : color};
            color: #ffffff;
            font-weight: 800;
            font-size: 13px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid #ffffff;
            box-shadow: ${shadowRing};
            transform: ${isSelected ? 'scale(1.12)' : 'scale(1)'};
            transition: transform 0.2s ease;
          " title="${escapeHtml(catMeta.label)}">
            ${innerContent}
          </div>
        `
      });

      const navUrl = buildExternalMapsUrl({
        locationName: act.locationName || act.title,
        lat: act.lat,
        lng: act.lng,
        googlePlaceId: act.googlePlaceId,
        customUrl: act.mapUrl
      });

      const headerBadgeText =
        pinStyle === 'category'
          ? `${escapeHtml(catMeta.label)}${act.time ? ` • ${escapeHtml(act.time)}` : ''}`
          : `Tappa #${order}${act.time ? ` • ${escapeHtml(act.time)}` : ''}`;

      const popupHtml = `
        <div style="min-width: 200px; max-width: 260px;">
          <div style="font-size: 11px; font-weight: 700; color: ${color}; text-transform: uppercase; letter-spacing: 0.04em;">
            ${headerBadgeText}
          </div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">
            ${escapeHtml(act.title)}
          </div>
          ${
            act.locationName
              ? `<div style="font-size: 12px; color: #475569; margin-top: 2px;">📍 ${escapeHtml(act.locationName)}</div>`
              : ''
          }
          ${
            act.notes
              ? `<div style="font-size: 12px; color: #64748b; margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 5px;">${escapeHtml(act.notes)}</div>`
              : ''
          }
          <a
            href="${escapeHtml(navUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            style="
              display: inline-flex;
              align-items: center;
              gap: 4px;
              margin-top: 8px;
              padding: 5px 10px;
              border-radius: 8px;
              background: #4f46e5;
              color: #ffffff;
              font-size: 12px;
              font-weight: 600;
              text-decoration: none;
            "
          >
            Navigazione / Scheda ↗
          </a>
        </div>
      `;

      const marker = L.marker([act.lat, act.lng], { icon }).bindPopup(popupHtml);
      marker.on('click', () => {
        onSelectActivity?.(act.id);
      });

      marker.addTo(layer);
      markerByIdRef.current.set(act.id, marker);
      latLngs.push([act.lat, act.lng]);
    }

    if (showRoutePolyline && latLngs.length >= 2) {
      L.polyline(latLngs, {
        color: '#4f46e5',
        weight: 3,
        opacity: 0.75,
        dashArray: '7, 7'
      }).addTo(layer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, defaultCenter, selectedActivityId, showRoutePolyline, pinStyle, useGoogle, googleSdk]);

  // Preview Pin for searched or clicked spot
  useEffect(() => {
    if (useGoogle && googleMapRef.current && googleSdk) {
      if (googlePreviewMarkerRef.current) {
        googlePreviewMarkerRef.current.setMap(null);
        googlePreviewMarkerRef.current = null;
      }
      if (!pickedState) return;

      const { lat, lng } = pickedState.place;
      if (lat === 0 && lng === 0) return;

      googlePreviewMarkerRef.current = new googleSdk.Marker({
        position: { lat, lng },
        map: googleMapRef.current,
        clickable: false,
        icon: {
          url: buildGooglePreviewPinDataUrl(),
          scaledSize: new googleSdk.Size(44, 44),
          anchor: new googleSdk.Point(22, 22)
        },
        zIndex: 1000
      });
      return;
    }

    const previewLayer = previewLayerRef.current;
    if (!previewLayer) return;

    previewLayer.clearLayers();
    if (!pickedState) return;

    const { lat, lng } = pickedState.place;
    if (lat === 0 && lng === 0) return;

    const previewIcon = L.divIcon({
      className: 'tripwise-pin pointer-events-none',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      html: `
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 9999px;
          background: #059669;
          color: #ffffff;
          font-weight: 900;
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #ffffff;
          box-shadow: 0 0 0 7px rgba(16, 185, 129, 0.28), 0 6px 18px rgba(15, 23, 42, 0.45);
        ">
          +
        </div>
      `
    });

    L.marker([lat, lng], { icon: previewIcon, interactive: false }).addTo(previewLayer);
  }, [pickedState, useGoogle, googleSdk]);

  // Fly to selected activity only when selectedActivityId changes to a new non-null stop
  useEffect(() => {
    if (!selectedActivityId) {
      lastPannedActivityIdRef.current = null;
      return;
    }

    if (lastPannedActivityIdRef.current === selectedActivityId) {
      return;
    }
    lastPannedActivityIdRef.current = selectedActivityId;

    const target = geoActivities.find((g) => g.act.id === selectedActivityId);
    if (!target) return;

    if (useGoogle && googleMapRef.current) {
      googleMapRef.current.panTo({ lat: target.act.lat, lng: target.act.lng });
      if ((googleMapRef.current.getZoom() ?? 12) < 15) {
        googleMapRef.current.setZoom(15);
      }
    } else if (mapRef.current) {
      const marker = markerByIdRef.current.get(selectedActivityId);
      if (marker) {
        mapRef.current.flyTo(marker.getLatLng(), Math.max(mapRef.current.getZoom(), 15), { duration: 0.55 });
        marker.openPopup();
      }
    }
  }, [selectedActivityId, useGoogle, geoActivities]);

  const runMapSearch = async (query: string, silentEmpty = false) => {
    const q = query.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchError('');
      return;
    }

    setSearchingMap(true);
    setSearchError('');
    try {
      let bias: [number, number] = defaultCenter;
      if (useGoogle && googleMapRef.current) {
        const center = googleMapRef.current.getCenter();
        if (center) bias = [center.lat(), center.lng()];
      } else if (mapRef.current) {
        const center = mapRef.current.getCenter();
        if (center) bias = [center.lat, center.lng];
      }

      const results = await autocompletePlaces(q, bias, sessionTokenRef.current);
      setSearchResults(results);
      if (results.length === 0 && !silentEmpty) {
        setSearchError('Nessun luogo trovato. Prova con un nome di via, locale o città.');
      }
    } catch {
      if (!silentEmpty) {
        setSearchError('Servizio di ricerca temporaneamente non raggiungibile.');
      }
    } finally {
      setSearchingMap(false);
    }
  };

  useEffect(() => {
    if (suppressNextDebounceRef.current) {
      suppressNextDebounceRef.current = false;
      return;
    }

    const q = mapQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchError('');
      return;
    }

    const timer = window.setTimeout(() => {
      void runMapSearch(q, true);
    }, 320);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapQuery]);

  const handleSelectMapResult = async (place: GeocodedPlace) => {
    searchInputRef.current?.blur();
    suppressNextDebounceRef.current = true;
    setMapQuery(place.shortName);
    setSearchResults([]);
    setSearchError('');
    if (!initialPickMode) {
      setPickMode(false);
    }
    // Deselect any previous itinerary stop so camera focus stays entirely on searched place
    onSelectActivity?.(null);

    // Immediate camera focus if coordinates are already known
    if (place.lat !== 0 && place.lng !== 0) {
      if (useGoogle && googleMapRef.current) {
        googleMapRef.current.setZoom(16);
        googleMapRef.current.setCenter({ lat: place.lat, lng: place.lng });
        googleMapRef.current.panTo({ lat: place.lat, lng: place.lng });
      } else if (mapRef.current) {
        mapRef.current.setView([place.lat, place.lng], 16, { animate: true });
      }
    }

    setPickedState({
      loading: true,
      place
    });

    let finalPlace = place;
    // If it has a googlePlaceId, fetch full rich details (photos, rating, coordinates)
    if (place.googlePlaceId) {
      finalPlace = await resolveGooglePoiClick(place.googlePlaceId, place.lat, place.lng);
    } else if (place.needsCoordinateLookup) {
      finalPlace = await resolvePlaceSelection(place);
      sessionTokenRef.current = createPlacesSessionToken();
    }

    setPickedState({ loading: false, place: finalPlace });

    // Focus camera unconditionally on resolved final coordinates
    if (finalPlace.lat !== 0 && finalPlace.lng !== 0) {
      if (useGoogle && googleMapRef.current) {
        googleMapRef.current.setZoom(16);
        googleMapRef.current.setCenter({ lat: finalPlace.lat, lng: finalPlace.lng });
        googleMapRef.current.panTo({ lat: finalPlace.lat, lng: finalPlace.lng });
      } else if (mapRef.current) {
        mapRef.current.setView([finalPlace.lat, finalPlace.lng], 16, { animate: true });
      }
    }
  };

  const handleSearchSubmit = async () => {
    searchInputRef.current?.blur();
    onSelectActivity?.(null);
    const q = mapQuery.trim();
    if (q.length < 2) return;
    setSearchingMap(true);
    setSearchError('');
    try {
      let bias: [number, number] = defaultCenter;
      if (useGoogle && googleMapRef.current) {
        const center = googleMapRef.current.getCenter();
        if (center) bias = [center.lat(), center.lng()];
      } else if (mapRef.current) {
        const center = mapRef.current.getCenter();
        if (center) bias = [center.lat, center.lng];
      }

      // 1. Try Autocomplete
      const results = await autocompletePlaces(q, bias, sessionTokenRef.current);
      if (results.length > 0) {
        setSearchResults([]);
        await handleSelectMapResult(results[0]);
        return;
      }

      // 2. Direct Address Geocoding fallback
      const direct = await forwardGeocodeAddress(q, bias);
      if (direct) {
        setSearchResults([]);
        await handleSelectMapResult(direct);
        return;
      }

      setSearchError('Nessun luogo trovato. Prova con un nome di via, locale o città.');
    } catch {
      setSearchError('Servizio di ricerca temporaneamente non raggiungibile.');
    } finally {
      setSearchingMap(false);
    }
  };

  const handleLocateMe = () => {
    onSelectActivity?.(null);
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setSearchError('Posizione GPS non supportata su questo browser.');
      return;
    }

    setLocatingGps(true);
    setSearchError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingGps(false);
        const { latitude, longitude, accuracy } = pos.coords;

        if (useGoogle && googleMapRef.current && googleSdk) {
          const gMap = googleMapRef.current;
          if (googleUserCircleRef.current) googleUserCircleRef.current.setMap(null);
          if (googleUserMarkerRef.current) googleUserMarkerRef.current.setMap(null);

          googleUserCircleRef.current = new googleSdk.Circle({
            center: { lat: latitude, lng: longitude },
            radius: Math.min(Math.max(accuracy || 30, 15), 250),
            strokeColor: '#2563eb',
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
            strokeWeight: 1,
            map: gMap
          });

          googleUserMarkerRef.current = new googleSdk.Marker({
            position: { lat: latitude, lng: longitude },
            map: gMap,
            icon: {
              url: buildGoogleGpsDotDataUrl(),
              scaledSize: new googleSdk.Size(28, 28),
              anchor: new googleSdk.Point(14, 14)
            },
            title: 'Sei qui'
          });

          gMap.panTo({ lat: latitude, lng: longitude });
          gMap.setZoom(15);
        } else if (mapRef.current) {
          const locLayer = userLocLayerRef.current;
          if (locLayer) {
            locLayer.clearLayers();
            L.circle([latitude, longitude], {
              radius: Math.min(Math.max(accuracy || 30, 15), 250),
              color: '#2563eb',
              fillColor: '#3b82f6',
              fillOpacity: 0.14,
              weight: 1
            }).addTo(locLayer);

            const gpsIcon = L.divIcon({
              className: 'tripwise-gps-dot',
              iconSize: [20, 20],
              iconAnchor: [10, 10],
              html: `<div style="width:20px;height:20px;border-radius:9999px;background:#2563eb;border:3px solid #ffffff;box-shadow:0 0 0 4px rgba(37,99,235,0.28),0 2px 8px rgba(15,23,42,0.35);"></div>`
            });
            L.marker([latitude, longitude], { icon: gpsIcon })
              .bindPopup('<strong>📍 Sei qui</strong>')
              .addTo(locLayer);
          }
          mapRef.current.flyTo([latitude, longitude], 16, { duration: 0.65 });
        }
      },
      () => {
        setLocatingGps(false);
        setSearchError('Attiva il permesso GPS del dispositivo per mostrare la tua posizione.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const isFullscreenOverlay = isExpanded && !insideModal;

  const canvasStyle: React.CSSProperties = isFullscreenOverlay
    ? { flex: '1 1 auto', minHeight: '360px', width: '100%' }
    : isExpanded && insideModal
      ? { height: '70dvh', minHeight: '440px', width: '100%' }
      : isFullMap
        ? { height: 'calc(100dvh - 250px)', minHeight: '520px', width: '100%' }
        : {
            height: customHeight || '520px',
            minHeight: '400px',
            width: '100%'
          };

  return (
    <>
      {isFullscreenOverlay && (
        <div
          aria-hidden="true"
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 z-40 bg-slate-950/65 backdrop-blur-sm"
        />
      )}

      <div
        className={
          isFullscreenOverlay
            ? 'fixed inset-2 sm:inset-4 z-50 flex flex-col rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-2xl bg-white dark:bg-slate-900'
            : 'relative flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900'
        }
      >
        {/* Top Control Bar OUTSIDE the Map Canvas */}
        <div className="relative z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2 sm:p-3 space-y-2">
          {/* Global Place Search with Live Autocomplete & Instant Center on Enter */}
          <search className="relative w-full flex items-center gap-1.5">
            <label htmlFor={searchInputId} className="visually-hidden">
              Cerca un luogo sulla mappa
            </label>
            <div className="relative flex-1 flex items-center">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none"
                aria-hidden="true"
              />
              <input
                ref={searchInputRef}
                id={searchInputId}
                name="map_place_search"
                type="text"
                inputMode="search"
                value={mapQuery}
                onFocus={() => {
                  if (selectedActivityId) {
                    onSelectActivity?.(null);
                  }
                }}
                onChange={(e) => setMapQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return;
                    void handleSearchSubmit();
                  } else if (e.key === 'Escape') {
                    setSearchResults([]);
                  }
                }}
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                enterKeyHint="search"
                aria-expanded={searchResults.length > 0}
                aria-controls={searchListboxId}
                placeholder="Cerca luogo o incolla link..."
                style={{ minHeight: '44px' }}
                className="w-full pl-9 pr-9 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
              />
              {searchingMap ? (
                <Loader2
                  className="w-4 h-4 text-brand-600 animate-spin absolute right-3"
                  aria-hidden="true"
                />
              ) : (
                mapQuery.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setMapQuery('');
                      setSearchResults([]);
                      setSearchError('');
                      searchInputRef.current?.focus();
                    }}
                    aria-label="Cancella ricerca mappa"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 absolute right-1.5"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )
              )}
            </div>

            <button
              type="button"
              onClick={() => void handleSearchSubmit()}
              disabled={searchingMap || mapQuery.trim().length < 2}
              aria-label="Cerca e centra sulla mappa"
              title="Cerca e centra sulla mappa"
              className="min-h-[44px] min-w-[44px] px-3 sm:px-3.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs inline-flex items-center justify-center gap-1.5 shrink-0 hover:bg-slate-800 dark:hover:bg-slate-200 disabled:opacity-50 transition-colors"
            >
              {searchingMap ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : (
                <Search className="w-4 h-4" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">Cerca</span>
            </button>

            {searchResults.length > 0 && (
              <ul
                id={searchListboxId}
                role="listbox"
                aria-label="Risultati ricerca sulla mappa"
                className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl"
              >
                {searchResults.map((place, idx) => (
                  <li key={`${place.googlePlaceId || place.lat}-${place.lng}-${idx}`} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onClick={() => void handleSelectMapResult(place)}
                      className="w-full min-h-[48px] text-left px-3.5 py-2.5 hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors"
                    >
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" aria-hidden="true" />
                        <span className="truncate">{place.shortName}</span>
                        {place.suggestedCategory && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ml-auto shrink-0">
                            {PLACE_CATEGORY_META[place.suggestedCategory]?.shortLabel}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate pl-5">
                        {place.displayName}
                      </div>
                    </button>
                  </li>
                ))}
                {searchResults[0]?.provider === 'google' && (
                  <li className="px-3.5 py-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-semibold text-right bg-slate-50/70 dark:bg-slate-800/50">
                    Powered by Google
                  </li>
                )}
              </ul>
            )}
          </search>

          {searchError && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-xl bg-amber-50 dark:bg-amber-950 px-3 py-2 text-xs font-medium text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800 shadow-sm"
            >
              {searchError}
            </div>
          )}

          {/* Quick Map Controls Row */}
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap justify-between w-full pt-0.5">
            <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
              {/* 1-Tap Reverse Geocoding Toggle */}
              <button
                type="button"
                aria-pressed={pickMode}
                onClick={() => {
                  onSelectActivity?.(null);
                  setPickMode((v) => !v);
                }}
                title="Attiva per cliccare o toccare un punto qualsiasi sulla mappa"
                className={`min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all shrink-0 ${
                  pickMode
                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/60'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:border-brand-500'
                }`}
              >
                <Crosshair className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">{pickMode ? 'Tocca mappa...' : 'Scegli punto'}</span>
                <span className="sm:hidden">{pickMode ? 'Tocca...' : 'Punto'}</span>
              </button>

              {/* Live GPS Position */}
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={locatingGps}
                aria-label="Mostra la mia posizione attuale sulla mappa"
                title="Centra sulla tua posizione GPS attuale"
                className="min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-xs font-bold inline-flex items-center gap-1.5 transition-all shrink-0"
              >
                {locatingGps ? (
                  <Loader2 className="w-4 h-4 text-brand-600 animate-spin shrink-0" aria-hidden="true" />
                ) : (
                  <LocateFixed className="w-4 h-4 text-brand-600 shrink-0" aria-hidden="true" />
                )}
                <span className="hidden sm:inline">Posizione</span>
              </button>

              {/* Map Style Switcher (Roadmap/Satellite/Terrain for Google; Voyager/OSM/Satellite for Leaflet) */}
              <div
                role="group"
                aria-label="Stile mappa"
                className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-0.5 sm:p-1 border border-slate-200/80 dark:border-slate-700/80 shrink-0"
              >
                {useGoogle
                  ? (['roadmap', 'hybrid', 'terrain'] as GoogleMapStyle[]).map((key) => {
                      const active = googleStyle === key;
                      const meta = GOOGLE_STYLES[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setGoogleStyle(key)}
                          className={`min-h-[32px] sm:min-h-[34px] px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                            active
                              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          <span className="hidden sm:inline">{meta.label}</span>
                          <span className="sm:hidden">{meta.short}</span>
                        </button>
                      );
                    })
                  : (['voyager', 'osm', 'satellite'] as MapTileStyle[]).map((key) => {
                      const active = tileStyle === key;
                      const meta = TILE_LAYERS[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setTileStyle(key)}
                          className={`min-h-[32px] sm:min-h-[34px] px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                            active
                              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          <span className="hidden sm:inline">{meta.label}</span>
                          <span className="sm:hidden">{meta.short}</span>
                        </button>
                      );
                    })}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {geoActivities.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (useGoogle && googleMapRef.current && googleSdk) {
                      fitGoogleStops(googleMapRef.current, googleSdk, true);
                    } else if (mapRef.current) {
                      fitLeafletStops(mapRef.current, true);
                    }
                  }}
                  title="Inquadra tutti i pin sulla mappa"
                  aria-label="Inquadra tutti i pin sulla mappa"
                  className="min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-xs font-bold inline-flex items-center gap-1 shrink-0"
                >
                  <Focus className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="hidden md:inline">Inquadra</span>
                </button>
              )}

              {/* Fullscreen / Expand Map Toggle */}
              <button
                type="button"
                aria-pressed={isExpanded}
                onClick={() => setIsExpanded((v) => !v)}
                title={isExpanded ? 'Riduci dimensione mappa' : 'Ingrandisci mappa a schermo intero'}
                aria-label={isExpanded ? 'Riduci mappa' : 'Espandi mappa a schermo intero'}
                className={`min-h-[40px] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors shrink-0 ${
                  isExpanded
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 hover:bg-brand-100'
                }`}
              >
                {isExpanded ? (
                  <>
                    <Minimize2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="hidden sm:inline">Riduci</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="hidden sm:inline">Schermo intero</span>
                  </>
                )}
              </button>

              {isFullMap && !hideAddButton && onRequestAddActivity && (
                <button
                  type="button"
                  onClick={onRequestAddActivity}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm inline-flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{addActionLabel}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Map Canvas */}
        <div className="relative flex-1 w-full bg-slate-200 dark:bg-slate-800">
          <div ref={containerRef} onContextMenu={(e) => e.preventDefault()} style={canvasStyle} />

          {pickMode && (
            <div
              role="status"
              aria-live="polite"
              className="pointer-events-none absolute top-2.5 left-1/2 -translate-x-1/2 z-20 max-w-[calc(100%-6rem)]"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600/95 text-white px-3.5 py-1 text-xs font-bold shadow-lg whitespace-nowrap">
                🎯 Tocca o clicca qualsiasi punto o locale sulla mappa
              </span>
            </div>
          )}
        </div>

        {/* Rich Place Card / Panel */}
        {pickedState ? (
          <div
            role="region"
            aria-live="polite"
            aria-label="Dettagli luogo selezionato sulla mappa"
            className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-2xl transition-all"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              {/* Photo & Main Place Info */}
              <div className="flex items-start gap-3 min-w-0 flex-1">
                {((pickedState.place.photos && pickedState.place.photos.length > 0) || pickedState.place.photoUrl) ? (
                  <PlacePhotoPreview
                    photos={pickedState.place.photos || (pickedState.place.photoUrl ? [pickedState.place.photoUrl] : [])}
                    placeName={pickedState.place.shortName}
                    category={pickedState.place.suggestedCategory}
                    rating={pickedState.place.rating}
                    userRatingCount={pickedState.place.userRatingCount}
                    googleMapsUri={pickedState.place.googleMapsUri || pickedState.place.externalUrl}
                    layout="cover"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 shadow-xs border border-brand-200/50 dark:border-brand-800/50">
                    {pickedState.loading ? (
                      <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
                    ) : (
                      <MapPin className="w-6 h-6" aria-hidden="true" />
                    )}
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-1">
                  {/* Title */}
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-1 sm:line-clamp-2">
                    {pickedState.place.shortName}
                  </h4>

                  {/* Metadata Row: Category + Opening Status + Rating (harmonious single row) */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    {pickedState.place.suggestedCategory && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {PLACE_CATEGORY_META[pickedState.place.suggestedCategory]?.label ||
                          PLACE_CATEGORY_META[pickedState.place.suggestedCategory]?.shortLabel}
                      </span>
                    )}

                    {pickedState.place.isOpenNow !== undefined && (
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          pickedState.place.isOpenNow
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        }`}
                      >
                        {pickedState.place.isOpenNow ? '🟢 Aperto' : '🔴 Chiuso'}
                      </span>
                    )}

                    {typeof pickedState.place.rating === 'number' && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-md border border-amber-200/80 dark:border-amber-800/80">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" aria-hidden="true" />
                        <span>{pickedState.place.rating.toFixed(1)}</span>
                        {pickedState.place.userRatingCount ? (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium ml-0.5">
                            ({pickedState.place.userRatingCount.toLocaleString('it-IT')})
                          </span>
                        ) : null}
                      </span>
                    )}
                  </div>

                  {/* Address */}
                  {pickedState.place.displayName && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 flex items-center gap-1 pt-0.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                      <span className="truncate">{pickedState.place.displayName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                {(pickedState.place.googleMapsUri || pickedState.place.externalUrl) && (
                  <a
                    href={pickedState.place.googleMapsUri || pickedState.place.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Vedi su Google Maps"
                    className="min-h-[44px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-brand-600 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setPickedState(null)}
                  aria-label="Chiudi scheda luogo"
                  className="min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Annulla
                </button>

                <button
                  type="button"
                  disabled={pickedState.loading}
                  onClick={() => {
                    const chosen = pickedState.place;
                    setPickedState(null);
                    if (isFullscreenOverlay) {
                      setIsExpanded(false);
                    }
                    if (onPickLocationFromMap) {
                      onPickLocationFromMap(chosen);
                    } else {
                      onRequestAddActivity?.();
                    }
                  }}
                  className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs sm:text-sm font-bold shadow-md inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>{confirmPickLabel}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 px-3 py-2 space-y-2">
            {selectedActivityId && (() => {
              const sel = geoActivities.find((g) => g.act.id === selectedActivityId);
              if (!sel || typeof sel.act.lat !== 'number' || typeof sel.act.lng !== 'number') return null;
              return (
                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-brand-200/80 dark:border-slate-700 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[10px] font-bold inline-flex items-center justify-center shrink-0">
                      {sel.order}
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {sel.act.title}
                    </span>
                    {sel.act.locationName && (
                      <span className="hidden sm:inline text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        • {sel.act.locationName}
                      </span>
                    )}
                  </div>
                  <WeatherPreview
                    lat={sel.act.lat}
                    lng={sel.act.lng}
                    date={date}
                    time={sel.act.time}
                    locationName={sel.act.locationName || sel.act.title}
                    size="xs"
                    showLabel={true}
                  />
                </div>
              );
            })()}
            {(isFullMap || isExpanded) && geoActivities.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => quickStripRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
                  aria-label="Scorri luoghi a sinistra"
                  className="hidden sm:inline-flex min-w-[32px] min-h-[36px] items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0"
                >
                  <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <div
                  ref={quickStripRef}
                  onWheel={(e) => {
                    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && quickStripRef.current) {
                      quickStripRef.current.scrollLeft += e.deltaY;
                    }
                  }}
                  className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth"
                >
                  {geoActivities.map(({ act, order }) => {
                    const catMeta =
                      PLACE_CATEGORY_META[act.category] || PLACE_CATEGORY_META.sightseeing;
                    const CatIcon = catMeta.Icon;
                    const active = selectedActivityId === act.id;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => onSelectActivity?.(act.id)}
                        className={`shrink-0 min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 border ${
                          active
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-brand-400'
                        }`}
                      >
                        {pinStyle === 'category' ? (
                          <CatIcon className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <span className="w-4 h-4 rounded-full bg-brand-600 text-white text-[10px] inline-flex items-center justify-center">
                            {order}
                          </span>
                        )}
                        <span className="truncate max-w-[150px]">{act.title}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => quickStripRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
                  aria-label="Scorri luoghi a destra"
                  className="hidden sm:inline-flex min-w-[32px] min-h-[36px] items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0"
                >
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>
                <span className="hidden sm:inline">
                  {useGoogle ? (
                    <>
                      💡 Clicca <strong>qualsiasi negozio, ristorante o attrazione</strong> sulla mappa per selezionarlo, oppure fai <strong>clic destro</strong>.
                    </>
                  ) : (
                    <>
                      💡 Clicca <strong>«Scegli punto»</strong> oppure fai <strong>clic destro</strong> su qualsiasi via o edificio per selezionarlo.
                    </>
                  )}
                </span>
                <span className="sm:hidden">
                  💡 Tocca un locale sulla mappa, premi <strong>«Scegli punto»</strong> o <strong>tieni premuto</strong> per selezionare un punto.
                </span>
              </span>
              {!hideAddButton && geoActivities.length === 0 && onRequestAddActivity && (
                <button
                  type="button"
                  onClick={onRequestAddActivity}
                  className="min-h-[32px] px-2.5 py-1 rounded-lg bg-brand-600 text-white font-bold text-xs shrink-0"
                >
                  + {addActionLabel}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
