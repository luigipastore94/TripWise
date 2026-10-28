import React, { useId, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Bookmark,
  MapPin,
  PinOff,
  Search,
  Loader2,
  ExternalLink,
  Pencil,
  Trash2,
  CheckCircle2,
  Circle,
  CalendarPlus,
  ArrowRight,
  Map as MapIcon,
  ChevronLeft,
  ChevronRight,
  Link2,
  Crosshair,
  ArrowLeft,
  Camera
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import type { Activity, ActivityCategory, SavedPlace } from '../../types/trip';
import { PLACE_CATEGORY_META, PLACE_CATEGORY_ORDER } from '../../data/placeCategories';
import { InAppMap } from '../itinerary/InAppMap';
import { ModalDialog } from '../ui/ModalDialog';
import { WeatherPreview } from '../weather/WeatherPreview';
import {
  autocompletePlaces,
  resolvePlaceSelection,
  parseGoogleMapsInput,
  createPlacesSessionToken,
  buildExternalMapsUrl,
  fetchPlacePreviewPhotos,
  getDailyQuotaStatus,
  type GeocodedPlace
} from '../../services/geocoding';
import { PlacePhotoPreview } from '../ui/PlacePhotoPreview';

interface PlacesRecapViewProps {
  onJumpToDay?: (dayIndex: number) => void;
}

type SourceFilter = 'all' | 'itinerary' | 'favorites' | 'offmap';

interface UnifiedPlaceItem {
  uid: string;
  source: 'itinerary' | 'favorite';
  title: string;
  subtitle: string;
  category: ActivityCategory;
  hasCoords: boolean;
  lat?: number;
  lng?: number;
  customUrl?: string;
  notes?: string;
  photos?: string[];
  rating?: number;
  userRatingCount?: number;
  completed: boolean;
  dayId?: string;
  dayIndex?: number;
  dayNumber?: number;
  dayTitle?: string;
  time?: string;
  activityId?: string;
  savedPlace?: SavedPlace;
}

export const PlacesRecapView: React.FC<PlacesRecapViewProps> = ({ onJumpToDay }) => {
  const {
    activeTrip,
    toggleActivityCompleted,
    upsertActivity,
    upsertSavedPlace,
    toggleSavedPlaceVisited,
    deleteSavedPlace,
    promoteSavedPlaceToDay
  } = useTrip();

  const idPrefix = useId();
  const catStripRef = useRef<HTMLDivElement>(null);

  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<ActivityCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [showOverviewMap, setShowOverviewMap] = useState(false);
  const [selectedMapPinId, setSelectedMapPinId] = useState<string | null>(null);

  // Add / Edit Favorite Place Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<SavedPlace | null>(null);
  const [placeName, setPlaceName] = useState('');
  const [placeCategory, setPlaceCategory] = useState<ActivityCategory>('hidden_gem');
  const [placeArea, setPlaceArea] = useState('');
  const [placeLat, setPlaceLat] = useState('');
  const [placeLng, setPlaceLng] = useState('');
  const [placeGooglePlaceId, setPlaceGooglePlaceId] = useState<string | undefined>(undefined);
  const [placeUrl, setPlaceUrl] = useState('');
  const [placeNotes, setPlaceNotes] = useState('');
  const [placePhotos, setPlacePhotos] = useState<string[]>([]);
  const [placeRating, setPlaceRating] = useState<number | undefined>(undefined);
  const [placeUserRatingCount, setPlaceUserRatingCount] = useState<number | undefined>(undefined);
  const [fetchingPhotos, setFetchingPhotos] = useState(false);

  const favSessionTokenRef = useRef<string>(createPlacesSessionToken());

  // Optional map lookup & full-size interactive map picker inside Favorite Place Modal
  const [geoResults, setGeoResults] = useState<GeocodedPlace[]>([]);
  const [searchingGeo, setSearchingGeo] = useState(false);
  const [geoMessage, setGeoMessage] = useState('');
  const [modalMapPickerOpen, setModalMapPickerOpen] = useState(false);

  // Promote Favorite to Itinerary Day Modal state
  const [promoteTarget, setPromoteTarget] = useState<SavedPlace | null>(null);
  const [promoteDayId, setPromoteDayId] = useState('');
  const [promoteTime, setPromoteTime] = useState('12:30');
  const [promoteToast, setPromoteToast] = useState('');

  const allItems = useMemo<UnifiedPlaceItem[]>(() => {
    if (!activeTrip) return [];

    const items: UnifiedPlaceItem[] = [];

    // 1. Saved Favorite Places (including off-map gems)
    for (const sp of activeTrip.savedPlaces ?? []) {
      const hasCoords =
        typeof sp.lat === 'number' &&
        Number.isFinite(sp.lat) &&
        typeof sp.lng === 'number' &&
        Number.isFinite(sp.lng);

      items.push({
        uid: `fav_${sp.id}`,
        source: 'favorite',
        title: sp.name,
        subtitle: sp.areaOrAddress || '',
        category: sp.category || 'hidden_gem',
        hasCoords,
        lat: sp.lat,
        lng: sp.lng,
        customUrl: sp.customUrl,
        notes: sp.notes,
        photos: sp.photos && sp.photos.length > 0 ? sp.photos : sp.photoUrl ? [sp.photoUrl] : undefined,
        rating: sp.rating,
        userRatingCount: sp.userRatingCount,
        completed: Boolean(sp.visited),
        savedPlace: sp
      });
    }

    // 2. All Places added across Itinerary Days
    activeTrip.days.forEach((day, dIdx) => {
      day.activities.forEach((act) => {
        const hasCoords =
          typeof act.lat === 'number' &&
          Number.isFinite(act.lat) &&
          typeof act.lng === 'number' &&
          Number.isFinite(act.lng);

        items.push({
          uid: `act_${act.id}`,
          source: 'itinerary',
          title: act.title,
          subtitle: act.locationName || '',
          category: act.category || 'sightseeing',
          hasCoords,
          lat: act.lat,
          lng: act.lng,
          customUrl: act.mapUrl,
          notes: act.notes,
          photos: act.photos,
          rating: act.rating,
          userRatingCount: act.userRatingCount,
          completed: act.completed,
          dayId: day.id,
          dayIndex: dIdx,
          dayNumber: day.dayNumber,
          dayTitle: day.title,
          time: act.time,
          activityId: act.id
        });
      });
    });

    return items;
  }, [activeTrip]);

  const counts = useMemo(() => {
    const byCategory: Record<string, number> = {};
    let itinerary = 0;
    let favorites = 0;
    let offmap = 0;
    let onmap = 0;

    for (const item of allItems) {
      byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
      if (item.source === 'itinerary') itinerary++;
      else favorites++;
      if (item.hasCoords) onmap++;
      else offmap++;
    }

    return {
      total: allItems.length,
      itinerary,
      favorites,
      offmap,
      onmap,
      byCategory
    };
  }, [allItems]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems.filter((item) => {
      if (sourceFilter === 'itinerary' && item.source !== 'itinerary') return false;
      if (sourceFilter === 'favorites' && item.source !== 'favorite') return false;
      if (sourceFilter === 'offmap' && item.hasCoords) return false;
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

      if (q) {
        const haystack = [
          item.title,
          item.subtitle,
          item.notes || '',
          item.dayNumber ? `giorno ${item.dayNumber}` : '',
          PLACE_CATEGORY_META[item.category]?.label || ''
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [allItems, sourceFilter, categoryFilter, query]);

  // Convert filtered geocoded items into map markers for the Global Overview Map
  const overviewMapActivities = useMemo<Activity[]>(() => {
    return filteredItems
      .filter((item) => item.hasCoords && typeof item.lat === 'number' && typeof item.lng === 'number')
      .map((item) => ({
        id: item.uid,
        time: item.source === 'itinerary' ? `Giorno ${item.dayNumber}` : '★ Preferito',
        title: item.title,
        locationName: item.subtitle,
        lat: item.lat,
        lng: item.lng,
        mapUrl: item.customUrl,
        category: item.category,
        notes: item.notes,
        photos: item.photos,
        rating: item.rating,
        userRatingCount: item.userRatingCount,
        completed: item.completed
      }));
  }, [filteredItems]);

  if (!activeTrip) return null;

  const openAddFavoriteModal = (prefillPlace?: GeocodedPlace) => {
    favSessionTokenRef.current = createPlacesSessionToken();
    setEditingPlace(null);
    setPlaceName(prefillPlace ? prefillPlace.shortName.split(',')[0].trim() : '');
    setPlaceCategory(prefillPlace?.suggestedCategory || 'hidden_gem');
    setPlaceArea(prefillPlace ? prefillPlace.displayName || prefillPlace.shortName : '');
    setPlaceLat(prefillPlace && prefillPlace.lat ? prefillPlace.lat.toFixed(6) : '');
    setPlaceLng(prefillPlace && prefillPlace.lng ? prefillPlace.lng.toFixed(6) : '');
    setPlaceGooglePlaceId(prefillPlace?.googlePlaceId);
    setPlaceUrl(prefillPlace?.externalUrl || '');
    setPlaceNotes('');
    const initialPhotos =
      prefillPlace?.photos && prefillPlace.photos.length > 0
        ? prefillPlace.photos
        : prefillPlace?.photoUrl
          ? [prefillPlace.photoUrl]
          : [];
    setPlacePhotos(initialPhotos);
    setPlaceRating(prefillPlace?.rating);
    setPlaceUserRatingCount(prefillPlace?.userRatingCount);
    setFetchingPhotos(false);
    if (initialPhotos.length === 0 && prefillPlace && (prefillPlace.googlePlaceId || prefillPlace.shortName)) {
      setFetchingPhotos(true);
      fetchPlacePreviewPhotos({
        query: prefillPlace.displayName || prefillPlace.shortName,
        biasCenter: [prefillPlace.lat, prefillPlace.lng],
        placeId: prefillPlace.googlePlaceId
      })
        .then((preview) => {
          if (preview.photos && preview.photos.length > 0) setPlacePhotos(preview.photos);
          if (preview.rating) setPlaceRating(preview.rating);
          if (preview.userRatingCount) setPlaceUserRatingCount(preview.userRatingCount);
        })
        .catch(() => {})
        .finally(() => setFetchingPhotos(false));
    }
    setGeoResults([]);
    setGeoMessage('');
    setModalMapPickerOpen(false);
    setModalOpen(true);
  };

  const openEditFavoriteModal = (sp: SavedPlace) => {
    favSessionTokenRef.current = createPlacesSessionToken();
    setEditingPlace(sp);
    setPlaceName(sp.name);
    setPlaceCategory(sp.category);
    setPlaceArea(sp.areaOrAddress || '');
    setPlaceLat(typeof sp.lat === 'number' ? String(sp.lat) : '');
    setPlaceLng(typeof sp.lng === 'number' ? String(sp.lng) : '');
    setPlaceGooglePlaceId(sp.googlePlaceId);
    setPlaceUrl(sp.customUrl || '');
    setPlaceNotes(sp.notes || '');
    const initialPhotos =
      sp.photos && sp.photos.length > 0
        ? sp.photos
        : sp.photoUrl
          ? [sp.photoUrl]
          : [];
    setPlacePhotos(initialPhotos);
    setPlaceRating(sp.rating);
    setPlaceUserRatingCount(sp.userRatingCount);
    setFetchingPhotos(false);
    if (initialPhotos.length === 0 && (sp.googlePlaceId || sp.areaOrAddress || sp.name)) {
      setFetchingPhotos(true);
      fetchPlacePreviewPhotos({
        query: sp.areaOrAddress || sp.name,
        biasCenter:
          typeof sp.lat === 'number' && typeof sp.lng === 'number'
            ? [sp.lat, sp.lng]
            : activeTrip.defaultCenter,
        placeId: sp.googlePlaceId
      })
        .then((preview) => {
          if (preview.photos && preview.photos.length > 0) setPlacePhotos(preview.photos);
          if (preview.rating) setPlaceRating(preview.rating);
          if (preview.userRatingCount) setPlaceUserRatingCount(preview.userRatingCount);
        })
        .catch(() => {})
        .finally(() => setFetchingPhotos(false));
    }
    setGeoResults([]);
    setGeoMessage('');
    setModalMapPickerOpen(false);
    setModalOpen(true);
  };

  const handleSmartPasteDetect = (text: string) => {
    const parsed = parseGoogleMapsInput(text);
    if (parsed) {
      if (!placeName.trim() || placeName === 'Nuovo posto') {
        setPlaceName(parsed.shortName);
      }
      setPlaceArea(parsed.displayName || parsed.shortName);
      setPlaceLat(parsed.lat.toFixed(6));
      setPlaceLng(parsed.lng.toFixed(6));
      if (parsed.externalUrl) {
        setPlaceUrl(parsed.externalUrl);
      }
      setGeoMessage('✓ Posizione rilevata dal link Google Maps!');
      setGeoResults([]);
      return true;
    }
    return false;
  };

  const handleOptionalGeocode = async () => {
    const q = placeArea.trim() || placeName.trim();
    if (!q) {
      setGeoMessage('Scrivi prima il nome o la zona se vuoi provare a cercarlo su mappa.');
      return;
    }

    if (handleSmartPasteDetect(q)) {
      return;
    }

    setSearchingGeo(true);
    setGeoMessage('');
    try {
      const matches = await autocompletePlaces(q, activeTrip.defaultCenter, favSessionTokenRef.current);
      setGeoResults(matches);
      if (matches.length === 0) {
        setGeoMessage(
          'Nessun pin trovato sulle mappe: nessun problema! Puoi salvarlo direttamente come posto fuori mappa.'
        );
      }
    } catch {
      setGeoMessage('Ricerca mappa non disponibile: puoi comunque salvare il posto liberamente.');
    } finally {
      setSearchingGeo(false);
    }
  };

  const handleSelectGeoResult = async (g: GeocodedPlace) => {
    let resolved = g;
    if (g.needsCoordinateLookup) {
      setSearchingGeo(true);
      try {
        resolved = await resolvePlaceSelection(g);
        favSessionTokenRef.current = createPlacesSessionToken();
      } finally {
        setSearchingGeo(false);
      }
    }
    setPlaceArea(resolved.displayName || resolved.shortName);
    setPlaceLat(resolved.lat.toFixed(6));
    setPlaceLng(resolved.lng.toFixed(6));
    setPlaceGooglePlaceId(resolved.googlePlaceId);
    if (!placeName.trim()) {
      setPlaceName(resolved.shortName.split(',')[0].trim());
    }
    if (resolved.suggestedCategory) {
      setPlaceCategory(resolved.suggestedCategory);
    }
    if (resolved.photos && resolved.photos.length > 0) {
      setPlacePhotos(resolved.photos);
      setPlaceRating(resolved.rating);
      setPlaceUserRatingCount(resolved.userRatingCount);
    } else {
      setFetchingPhotos(true);
      fetchPlacePreviewPhotos({
        query: resolved.displayName || resolved.shortName,
        biasCenter: [resolved.lat, resolved.lng],
        placeId: resolved.googlePlaceId
      })
        .then((preview) => {
          if (preview.photos && preview.photos.length > 0) setPlacePhotos(preview.photos);
          if (preview.rating) setPlaceRating(preview.rating);
          if (preview.userRatingCount) setPlaceUserRatingCount(preview.userRatingCount);
        })
        .catch(() => {})
        .finally(() => setFetchingPhotos(false));
    }
    setGeoResults([]);
    setGeoMessage('');
  };

  const handleSaveFavorite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeName.trim()) return;

    let parsedLat = placeLat.trim() ? Number.parseFloat(placeLat.replace(',', '.')) : undefined;
    let parsedLng = placeLng.trim() ? Number.parseFloat(placeLng.replace(',', '.')) : undefined;

    // Check if placeArea or placeUrl has a Google Maps link that wasn't submitted yet
    if (typeof parsedLat !== 'number' || typeof parsedLng !== 'number') {
      const parsedFromArea = parseGoogleMapsInput(placeArea);
      const parsedFromUrl = parseGoogleMapsInput(placeUrl);
      const hit = parsedFromArea || parsedFromUrl;
      if (hit) {
        parsedLat = hit.lat;
        parsedLng = hit.lng;
      }
    }

    let normalizedUrl = placeUrl.trim();
    if (normalizedUrl && !/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    const payload: SavedPlace = {
      id:
        editingPlace?.id ??
        `plc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: placeName.trim(),
      category: placeCategory,
      areaOrAddress: placeArea.trim() || undefined,
      lat: typeof parsedLat === 'number' && Number.isFinite(parsedLat) ? parsedLat : undefined,
      lng: typeof parsedLng === 'number' && Number.isFinite(parsedLng) ? parsedLng : undefined,
      googlePlaceId: placeGooglePlaceId || editingPlace?.googlePlaceId,
      customUrl: normalizedUrl || undefined,
      notes: placeNotes.trim() || undefined,
      photos: placePhotos.length > 0 ? placePhotos : (editingPlace?.photos ?? undefined),
      photoUrl: placePhotos.length > 0 ? placePhotos[0] : editingPlace?.photoUrl,
      rating: placeRating ?? editingPlace?.rating,
      userRatingCount: placeUserRatingCount ?? editingPlace?.userRatingCount,
      visited: editingPlace?.visited ?? false,
      createdAt: editingPlace?.createdAt ?? Date.now()
    };

    upsertSavedPlace(payload);
    if (typeof payload.lat === 'number' && typeof payload.lng === 'number') {
      setSelectedMapPinId(`fav_${payload.id}`);
    }
    setModalMapPickerOpen(false);
    setModalOpen(false);
  };

  const handleConfirmPromote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoteTarget || !promoteDayId) return;
    promoteSavedPlaceToDay(promoteTarget.id, promoteDayId, promoteTime);
    const chosenDay = activeTrip.days.find((d) => d.id === promoteDayId);
    setPromoteToast(
      `"${promoteTarget.name}" aggiunto a ${chosenDay ? `Giorno ${chosenDay.dayNumber}` : 'Itinerario'}!`
    );
    setPromoteTarget(null);
    window.setTimeout(() => setPromoteToast(''), 3200);
  };

  return (
    <section aria-label="Recap Luoghi e Posti Preferiti" className="space-y-4">
      {/* Top Recap Summary & Primary CTA */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
              <span>Recap Luoghi & Posti Preferiti</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Tutti i posti inseriti nelle tappe giornaliere più i tuoi luoghi preferiti o segreti (anche fuori mappa).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              aria-pressed={showOverviewMap}
              onClick={() => setShowOverviewMap((v) => !v)}
              className={`min-h-[46px] px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border inline-flex items-center gap-1.5 transition-colors ${
                showOverviewMap
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-brand-500'
              }`}
            >
              <MapIcon className="w-4 h-4" aria-hidden="true" />
              <span>{showOverviewMap ? 'Nascondi Mappa' : `Mappa Globale (${counts.onmap})`}</span>
            </button>

            <button
              type="button"
              onClick={() => openAddFavoriteModal()}
              className="min-h-[46px] px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-brand-600/20 inline-flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Aggiungi Posto Preferito</span>
            </button>
          </div>
        </div>

        {/* KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200/70 dark:border-slate-700/60">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Totale Posti
            </div>
            <div className="text-xl font-black mt-0.5">{counts.total}</div>
          </div>
          <div className="rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 p-3 border border-indigo-200/60 dark:border-indigo-900/50">
            <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              Nelle Tappe
            </div>
            <div className="text-xl font-black text-indigo-900 dark:text-indigo-100 mt-0.5">
              {counts.itinerary}
            </div>
          </div>
          <div className="rounded-xl bg-amber-50/70 dark:bg-amber-950/30 p-3 border border-amber-200/60 dark:border-amber-900/50">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
              Preferiti Extra
            </div>
            <div className="text-xl font-black text-amber-900 dark:text-amber-100 mt-0.5">
              {counts.favorites}
            </div>
          </div>
          <div className="rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 p-3 border border-emerald-200/60 dark:border-emerald-900/50">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 truncate">
              Fuori Mappa
            </div>
            <div className="text-xl font-black text-emerald-900 dark:text-emerald-100 mt-0.5">
              {counts.offmap}
            </div>
          </div>
        </div>

        {promoteToast && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3.5 py-2.5 text-xs font-bold text-emerald-800 dark:text-emerald-200"
          >
            ✓ {promoteToast}
          </div>
        )}
      </div>

      {/* Filters Bar: Source + Scrollable Category Icons + Instant Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div
            role="group"
            aria-label="Filtra per origine del luogo"
            className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 overflow-x-auto no-scrollbar max-w-full"
          >
            {(
              [
                { id: 'all', label: `Tutti (${counts.total})` },
                { id: 'itinerary', label: `Dalle Tappe (${counts.itinerary})` },
                { id: 'favorites', label: `Preferiti (${counts.favorites})` },
                { id: 'offmap', label: `Fuori Mappa (${counts.offmap})` }
              ] as Array<{ id: SourceFilter; label: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSourceFilter(tab.id)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  sourceFilter === tab.id
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <search className="relative flex-1 min-w-[190px] max-w-sm">
            <label htmlFor={`${idPrefix}-filter-q`} className="visually-hidden">
              Cerca tra i tuoi luoghi salvati
            </label>
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id={`${idPrefix}-filter-q`}
              name="places_filter"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="Cerca per nome, quartiere o nota..."
              style={{ minHeight: '42px' }}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-base sm:text-sm"
            />
          </search>
        </div>

        {/* Category Strip with Desktop < / > Scroll Arrows + Wheel Support */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => catStripRef.current?.scrollBy({ left: -240, behavior: 'smooth' })}
            aria-label="Scorri categorie a sinistra"
            className="hidden sm:inline-flex min-w-[34px] min-h-[40px] items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 shrink-0"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>

          <div
            ref={catStripRef}
            onWheel={(e) => {
              if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && catStripRef.current) {
                catStripRef.current.scrollLeft += e.deltaY;
              }
            }}
            className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
          >
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`shrink-0 min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                categoryFilter === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent'
                  : 'bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="hidden sm:inline">Tutti i tipi</span>
              <span className="sm:hidden">Tutti</span>
            </button>

            {PLACE_CATEGORY_ORDER.map((catKey) => {
              const meta = PLACE_CATEGORY_META[catKey];
              const Icon = meta.Icon;
              const count = counts.byCategory[catKey] ?? 0;
              const active = categoryFilter === catKey;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setCategoryFilter(active ? 'all' : catKey)}
                  className={`shrink-0 min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 transition-all ${
                    active
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-brand-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{meta.shortLabel}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      active
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => catStripRef.current?.scrollBy({ left: 240, behavior: 'smooth' })}
            aria-label="Scorri categorie a destra"
            className="hidden sm:inline-flex min-w-[34px] min-h-[40px] items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 shrink-0"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Optional Global Overview Map: Category-Icon Pins & Zero Connecting Route Lines */}
      {showOverviewMap && (
        <div className="space-y-1.5">
          <InAppMap
            activities={overviewMapActivities}
            defaultCenter={activeTrip.defaultCenter}
            selectedActivityId={selectedMapPinId}
            onSelectActivity={(id) => setSelectedMapPinId(id)}
            onRequestAddActivity={() => openAddFavoriteModal()}
            onPickLocationFromMap={(place) => openAddFavoriteModal(place)}
            layoutKey="places-recap-overview"
            showRoutePolyline={false}
            pinStyle="category"
            confirmPickLabel="Salva nei Preferiti qui"
            addActionLabel="Nuovo Preferito"
            customHeight="min(68dvh, 600px)"
          />
          {counts.offmap > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 px-1">
              Nota: oltre ai {overviewMapActivities.length} pin con icona di categoria visibili sulla mappa, hai{' '}
              <strong>{counts.offmap}</strong> {counts.offmap === 1 ? 'posto salvato' : 'posti salvati'}{' '}
              senza coordinate («Fuori mappa») elencati qui sotto.
            </p>
          )}
        </div>
      )}

      {/* Places Recap Grid */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-10 text-center bg-white/60 dark:bg-slate-900/50">
          <Bookmark className="w-10 h-10 mx-auto text-brand-500 mb-2" aria-hidden="true" />
          <h3 className="text-base font-bold">Nessun luogo da mostrare con questi filtri</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Aggiungi un posto preferito — ad esempio un ristorante consigliato, un vicolo nascosto o un negozio che non compare sulle mappe!
          </p>
          <button
            type="button"
            onClick={() => openAddFavoriteModal()}
            className="mt-4 min-h-[48px] px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm inline-flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Salva Posto Preferito</span>
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3.5">
          {filteredItems.map((item) => {
            const meta = PLACE_CATEGORY_META[item.category] || PLACE_CATEGORY_META.sightseeing;
            const CategoryIcon = meta.Icon;
            const isSelectedPin = selectedMapPinId === item.uid;
            const externalUrl =
              item.customUrl ||
              (item.hasCoords || item.subtitle
                ? buildExternalMapsUrl({
                    locationName: item.subtitle || item.title,
                    lat: item.lat,
                    lng: item.lng
                  })
                : '');

            return (
              <li
                key={item.uid}
                onClick={() => {
                  if (item.hasCoords && showOverviewMap) {
                    setSelectedMapPinId(item.uid);
                  }
                }}
                className={`rounded-2xl bg-white dark:bg-slate-900 p-4 border flex flex-col justify-between gap-3 transition-all ${
                  item.hasCoords && showOverviewMap ? 'cursor-pointer' : ''
                } ${
                  isSelectedPin
                    ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
                } ${item.completed ? 'opacity-75' : ''}`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Distinct Point-Type Icon Avatar */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${meta.iconBoxClass}`}
                    title={meta.label}
                  >
                    <CategoryIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Top Badges: Category + Source + Map Status */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${meta.badgeClass}`}
                      >
                        {meta.label}
                      </span>

                      {item.source === 'itinerary' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                          Giorno {item.dayNumber}
                          {item.time ? ` • ${item.time}` : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100/80 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300">
                          ★ Preferito
                        </span>
                      )}

                      {item.hasCoords ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          <MapPin className="w-3 h-3" aria-hidden="true" />
                          <span>Su mappa</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          <PinOff className="w-3 h-3" aria-hidden="true" />
                          <span>Fuori mappa</span>
                        </span>
                      )}

                      {item.hasCoords && typeof item.lat === 'number' && typeof item.lng === 'number' && (
                        <WeatherPreview
                          lat={item.lat}
                          lng={item.lng}
                          date={item.source === 'itinerary' && item.dayNumber ? activeTrip.days[item.dayNumber - 1]?.date : undefined}
                          locationName={item.title}
                          size="xs"
                        />
                      )}
                    </div>

                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={`text-base font-extrabold leading-snug ${
                          item.completed ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {item.title}
                      </h3>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.source === 'itinerary' && item.dayId && item.activityId) {
                            toggleActivityCompleted(item.dayId, item.activityId);
                          } else if (item.savedPlace) {
                            toggleSavedPlaceVisited(item.savedPlace.id);
                          }
                        }}
                        aria-label={item.completed ? 'Segna da visitare' : 'Segna come visitato'}
                        className="p-1 -mr-1 rounded-full text-slate-400 hover:text-emerald-600 shrink-0"
                      >
                        {item.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" aria-hidden="true" />
                        ) : (
                          <Circle className="w-5 h-5" aria-hidden="true" />
                        )}
                      </button>
                    </div>

                    {item.subtitle && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        📍 {item.subtitle}
                      </p>
                    )}

                    {((item.photos && item.photos.length > 0) || item.subtitle || item.title) && (
                      <div className="mt-2.5">
                        <PlacePhotoPreview
                          photos={item.photos}
                          placeName={item.title}
                          category={item.category}
                          rating={item.rating}
                          userRatingCount={item.userRatingCount}
                          autoFetchQuery={item.subtitle || item.title}
                          biasCenter={
                            typeof item.lat === 'number' && typeof item.lng === 'number'
                              ? [item.lat, item.lng]
                              : activeTrip.defaultCenter
                          }
                          onPhotosResolved={(resolvedPhotos, resolvedRating, resolvedCount) => {
                            if (item.source === 'itinerary' && item.dayId && item.activityId) {
                              const targetDay = activeTrip.days.find((d) => d.id === item.dayId);
                              const targetAct = targetDay?.activities.find((a) => a.id === item.activityId);
                              if (targetDay && targetAct) {
                                upsertActivity(targetDay.id, {
                                  ...targetAct,
                                  photos: resolvedPhotos,
                                  rating: resolvedRating ?? targetAct.rating,
                                  userRatingCount: resolvedCount ?? targetAct.userRatingCount
                                });
                              }
                            } else if (item.savedPlace) {
                              upsertSavedPlace({
                                ...item.savedPlace,
                                photos: resolvedPhotos,
                                photoUrl: resolvedPhotos[0],
                                rating: resolvedRating ?? item.savedPlace.rating,
                                userRatingCount: resolvedCount ?? item.savedPlace.userRatingCount
                              });
                            }
                          }}
                          size="card"
                          showBadge={false}
                        />
                      </div>
                    )}

                    {item.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5">
                        {item.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {externalUrl && (
                      <a
                        href={externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline py-1"
                      >
                        {item.customUrl ? (
                          <>
                            <Link2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Apri link</span>
                          </>
                        ) : (
                          <>
                            <span>Naviga</span>
                            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                          </>
                        )}
                      </a>
                    )}
                  </div>

                  {item.source === 'itinerary' ? (
                    onJumpToDay &&
                    typeof item.dayIndex === 'number' && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onJumpToDay(item.dayIndex!);
                        }}
                        className="min-h-[36px] px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-950/50 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-brand-600 inline-flex items-center gap-1 transition-colors"
                      >
                        <span>Vai al Giorno {item.dayNumber}</span>
                        <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )
                  ) : (
                    item.savedPlace && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPromoteTarget(item.savedPlace!);
                            setPromoteDayId(activeTrip.days[0]?.id ?? '');
                            setPromoteTime('12:30');
                          }}
                          className="min-h-[36px] px-2.5 py-1 rounded-xl bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 text-brand-700 dark:text-brand-300 text-xs font-bold inline-flex items-center gap-1 transition-colors"
                        >
                          <CalendarPlus className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Inserisci in Giorno</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditFavoriteModal(item.savedPlace!);
                          }}
                          aria-label={`Modifica ${item.title}`}
                          className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Pencil className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSavedPlace(item.savedPlace!.id);
                          }}
                          aria-label={`Elimina ${item.title}`}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    )
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Modal: Add / Edit Favorite Place (with wide HD Interactive Map Picker + Off-Map support) */}
      <ModalDialog
        open={modalOpen}
        onClose={() => {
          setModalMapPickerOpen(false);
          setModalOpen(false);
        }}
        maxWidthClass={modalMapPickerOpen ? 'max-w-5xl' : 'max-w-lg'}
        title={
          modalMapPickerOpen
            ? 'Scegli il posto sulla mappa'
            : editingPlace
              ? 'Modifica Posto Preferito'
              : 'Nuovo Posto Preferito'
        }
        subtitle={
          modalMapPickerOpen
            ? 'Cerca un indirizzo, usa il GPS o clicca direttamente il punto desiderato sulla mappa'
            : 'Salva locali consigliati, posti segreti o idee di viaggio — anche se non sono presenti sulle mappe!'
        }
      >
        {modalMapPickerOpen ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setModalMapPickerOpen(false)}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold inline-flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Torna alla scheda del posto</span>
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                I pin esistenti mostrano l’icona del tipo di posto senza linee di percorso
              </span>
            </div>

            <InAppMap
              activities={overviewMapActivities}
              defaultCenter={activeTrip.defaultCenter}
              initialFocusCenter={
                placeLat &&
                placeLng &&
                Number.isFinite(Number.parseFloat(placeLat)) &&
                Number.isFinite(Number.parseFloat(placeLng))
                  ? [Number.parseFloat(placeLat), Number.parseFloat(placeLng)]
                  : null
              }
              showRoutePolyline={false}
              pinStyle="category"
              initialPickMode={true}
              hideAddButton={true}
              insideModal={true}
              confirmPickLabel="Usa questo punto"
              customHeight="min(62dvh, 540px)"
              layoutKey="modal-favorite-picker"
              onPickLocationFromMap={(picked) => {
                setPlaceArea(picked.shortName);
                setPlaceLat(picked.lat.toFixed(6));
                setPlaceLng(picked.lng.toFixed(6));
                if (!placeName.trim()) {
                  setPlaceName(picked.shortName.split(',')[0].trim());
                }
                setGeoResults([]);
                setGeoMessage('');
                setModalMapPickerOpen(false);
              }}
            />
          </div>
        ) : (
          <form onSubmit={handleSaveFavorite} className="space-y-4">
            <fieldset className="space-y-2">
              <legend className="text-sm font-semibold">Tipo di punto (icona) *</legend>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PLACE_CATEGORY_ORDER.map((catKey) => {
                  const meta = PLACE_CATEGORY_META[catKey];
                  const Icon = meta.Icon;
                  const selected = placeCategory === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setPlaceCategory(catKey)}
                      className={`min-h-[46px] px-3 py-2 rounded-xl border text-left text-xs font-bold flex items-center gap-2 transition-all ${
                        selected
                          ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${meta.iconBoxClass}`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="leading-tight">{meta.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label htmlFor={`${idPrefix}-fav-name`} className="block text-sm font-semibold mb-1">
                Nome del posto *
              </label>
              <input
                id={`${idPrefix}-fav-name`}
                name="place_name"
                type="text"
                required
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                placeholder="Es. Izakaya segreta sotto i binari, Belvedere panoramico..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
              />
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <label htmlFor={`${idPrefix}-fav-area`} className="block text-sm font-semibold">
                  Zona, Quartiere o Posizione su mappa
                </label>
                {placeLat && placeLng ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <span>✓ Pin mappa collegato</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPlaceLat('');
                        setPlaceLng('');
                      }}
                      className="underline font-normal ml-1"
                    >
                      rendi fuori mappa
                    </button>
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    Senza pin (Fuori mappa)
                  </span>
                )}
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <input
                  id={`${idPrefix}-fav-area`}
                  name="area_or_address"
                  type="text"
                  value={placeArea}
                  onChange={(e) => setPlaceArea(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return;
                      void handleOptionalGeocode();
                    }
                  }}
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Es. Vicino uscita Est stazione, 2° vicolo..."
                  className="flex-1 min-w-[180px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-base sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => void handleOptionalGeocode()}
                  disabled={searchingGeo}
                  title="Cerca per testo sulle mappe"
                  className="min-h-[48px] px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-brand-500 font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 shrink-0"
                >
                  {searchingGeo ? (
                    <Loader2 className="w-4 h-4 animate-spin text-brand-600" aria-hidden="true" />
                  ) : (
                    <Search className="w-4 h-4 text-brand-600" aria-hidden="true" />
                  )}
                  <span>Cerca</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalMapPickerOpen(true)}
                  title="Apri mappa ampia per scegliere visivamente il punto"
                  className="min-h-[48px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <Crosshair className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Scegli in mappa</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Usa <strong>«Scegli in mappa»</strong> per puntare il luogo a schermo ampio, oppure lascia il testo libero per i posti fuori mappa.
              </p>

              {geoMessage && (
                <p role="status" aria-live="polite" className="text-xs text-slate-600 dark:text-slate-300">
                  {geoMessage}
                </p>
              )}

              {geoResults.length > 0 && (
                <ul className="divide-y divide-slate-200 dark:divide-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden max-h-48 overflow-y-auto">
                  {geoResults.map((g, idx) => (
                    <li key={`${g.googlePlaceId || g.lat}-${g.lng}-${idx}`}>
                      <button
                        type="button"
                        onClick={() => void handleSelectGeoResult(g)}
                        className="w-full min-h-[46px] text-left px-3 py-2 hover:bg-brand-50 dark:hover:bg-brand-950/40"
                      >
                        <div className="text-sm font-semibold text-brand-600 dark:text-brand-400 flex items-center justify-between">
                          <span>📍 {g.shortName}</span>
                          {g.suggestedCategory && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {PLACE_CATEGORY_META[g.suggestedCategory]?.shortLabel}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{g.displayName}</div>
                      </button>
                    </li>
                  ))}
                  {geoResults[0]?.provider === 'google' ? (
                    <li className="px-3 py-1 text-[10px] text-slate-400 dark:text-slate-500 font-semibold text-right bg-slate-50/70 dark:bg-slate-800/50">
                      Powered by Google
                    </li>
                  ) : (
                    getDailyQuotaStatus().isExceeded && (
                      <li className="px-3 py-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium text-right bg-amber-50/60 dark:bg-amber-950/30">
                        Quota giornaliera Google raggiunta (300/300) • Ricerca OpenStreetMap attiva
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>

            {(placePhotos.length > 0 || fetchingPhotos) && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-brand-500" aria-hidden="true" />
                    <span>Anteprima Luogo ({placePhotos.length || 0} {placePhotos.length === 1 ? 'foto' : 'foto'})</span>
                  </span>
                  {placePhotos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setPlacePhotos([]);
                        setPlaceRating(undefined);
                        setPlaceUserRatingCount(undefined);
                      }}
                      className="text-[11px] text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Rimuovi foto
                    </button>
                  )}
                </div>
                <PlacePhotoPreview
                  photos={placePhotos}
                  placeName={placeName || placeArea || 'Anteprima luogo'}
                  rating={placeRating}
                  userRatingCount={placeUserRatingCount}
                  isLoading={fetchingPhotos}
                  size="modal"
                />
              </div>
            )}

            <div>
              <label htmlFor={`${idPrefix}-fav-url`} className="block text-sm font-semibold mb-1">
                Link esterno (Opzionale — es. post Instagram, articolo, sito)
              </label>
              <input
                id={`${idPrefix}-fav-url`}
                name="custom_url"
                type="text"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                value={placeUrl}
                onChange={(e) => setPlaceUrl(e.target.value)}
                placeholder="Es. instagram.com/... o sito del locale"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-base sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor={`${idPrefix}-fav-notes`} className="block text-sm font-semibold mb-1">
                Note e consigli
              </label>
              <textarea
                id={`${idPrefix}-fav-notes`}
                name="notes"
                rows={2}
                value={placeNotes}
                onChange={(e) => setPlaceNotes(e.target.value)}
                placeholder="Cosa assaggiare, chi lo ha consigliato, orari o giorni di chiusura..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-h-[48px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-sm"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="min-h-[48px] px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm"
              >
                Salva nei Preferiti
              </button>
            </div>
          </form>
        )}
      </ModalDialog>

      {/* Modal: Promote Favorite Place into an Itinerary Day */}
      <ModalDialog
        open={Boolean(promoteTarget)}
        onClose={() => setPromoteTarget(null)}
        title="Inserisci Posto nell’Itinerario"
        subtitle={
          promoteTarget
            ? `Scegli in quale giornata aggiungere "${promoteTarget.name}"`
            : undefined
        }
      >
        <form onSubmit={handleConfirmPromote} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor={`${idPrefix}-prom-day`} className="block text-sm font-semibold mb-1">
                Giornata del viaggio
              </label>
              <select
                id={`${idPrefix}-prom-day`}
                name="target_day"
                value={promoteDayId}
                onChange={(e) => setPromoteDayId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
              >
                {activeTrip.days.map((d) => (
                  <option key={d.id} value={d.id}>
                    Giorno {d.dayNumber} — {d.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${idPrefix}-prom-time`} className="block text-sm font-semibold mb-1">
                Orario indicativo
              </label>
              <input
                id={`${idPrefix}-prom-time`}
                name="target_time"
                type="time"
                value={promoteTime}
                onChange={(e) => setPromoteTime(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPromoteTarget(null)}
              className="min-h-[48px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-sm"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="min-h-[48px] px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm"
            >
              Aggiungi alla Giornata
            </button>
          </div>
        </form>
      </ModalDialog>
    </section>
  );
};
