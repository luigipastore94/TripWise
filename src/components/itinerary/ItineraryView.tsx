import React, { useState, useId, useRef, useEffect, useCallback } from 'react';
import {
  Plus,
  Map as MapIcon,
  List,
  Columns,
  MapPin,
  Clock,
  CheckCircle2,
  Circle,
  ExternalLink,
  Pencil,
  Trash2,
  Search,
  Loader2,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  CalendarRange,
  Bookmark,
  Crosshair,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Camera
} from 'lucide-react';
import { useTrip, addDaysIso } from '../../context/TripContext';
import type { Activity, ActivityCategory } from '../../types/trip';
import { PLACE_CATEGORY_META } from '../../data/placeCategories';
import { InAppMap } from './InAppMap';
import { ModalDialog } from '../ui/ModalDialog';
import {
  searchPlaces,
  autocompletePlaces,
  resolvePlaceSelection,
  createPlacesSessionToken,
  parseGoogleMapsInput,
  buildExternalMapsUrl,
  fetchPlacePreviewPhotos,
  getDailyQuotaStatus,
  type GeocodedPlace
} from '../../services/geocoding';
import { PlacePhotoPreview } from '../ui/PlacePhotoPreview';
import { formatMoney, parseFlexibleAmount } from '../../utils/currency';
import { NaturalProgramComposer } from '../trips/NaturalProgramComposer';
import type { ParsedItineraryPlan } from '../../utils/naturalItineraryParser';
import { WeatherPreview } from '../weather/WeatherPreview';

type ViewMode = 'split' | 'list' | 'map';

const CATEGORY_META = PLACE_CATEGORY_META;

interface ItineraryViewProps {
  onOpenEditDates?: () => void;
  onOpenPlacesRecap?: () => void;
  focusDayIndex?: number | null;
  onFocusDayHandled?: () => void;
}

function getStoredDayIndex(tripId: string, daysLength: number): number {
  if (daysLength <= 0) return 0;
  try {
    const params = new URLSearchParams(window.location.search);
    const dayParam = params.get('day');
    if (dayParam) {
      const parsed = parseInt(dayParam, 10);
      if (!isNaN(parsed)) {
        const candidate = parsed > 0 ? parsed - 1 : 0;
        if (candidate >= 0 && candidate < daysLength) {
          return candidate;
        }
      }
    }
    const saved = localStorage.getItem(`tripwise_selected_day_${tripId}`);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed < daysLength) {
        return parsed;
      }
    }
  } catch {}
  return 0;
}

export const ItineraryView: React.FC<ItineraryViewProps> = ({
  onOpenEditDates,
  onOpenPlacesRecap,
  focusDayIndex,
  onFocusDayHandled
}) => {
  const {
    activeTrip,
    addDay,
    addDayAtStart,
    updateDayTitle,
    deleteDay,
    upsertActivity,
    toggleActivityCompleted,
    deleteActivity,
    moveActivity,
    applyGeneratedItinerary
  } = useTrip();

  const [selectedDayIndex, setSelectedDayIndex] = useState(() =>
    activeTrip ? getStoredDayIndex(activeTrip.id, activeTrip.days.length) : 0
  );
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try {
      const saved = localStorage.getItem('tripwise_itinerary_view_mode');
      if (saved === 'list' || saved === 'split' || saved === 'map') return saved;
    } catch {}
    return 'split';
  });
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [expandDaysGrid, setExpandDaysGrid] = useState(false);
  const [addDayMenuOpen, setAddDayMenuOpen] = useState(false);
  const addDayMenuRef = useRef<HTMLDivElement>(null);

  const handleSelectDay = useCallback(
    (idx: number) => {
      setSelectedDayIndex(idx);
      setSelectedActivityId(null);
      if (!activeTrip) return;
      try {
        localStorage.setItem(`tripwise_selected_day_${activeTrip.id}`, String(idx));
        const params = new URLSearchParams(window.location.search);
        const currentTab = params.get('tab');
        if (!currentTab || currentTab === 'itinerary') {
          params.set('day', String(idx + 1));
          const newQuery = params.toString();
          const newUrl = newQuery ? `${window.location.pathname}?${newQuery}` : window.location.pathname;
          window.history.replaceState(null, '', newUrl);
        }
      } catch {}
    },
    [activeTrip]
  );

  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem('tripwise_itinerary_view_mode', mode);
    } catch {}
  };

  useEffect(() => {
    if (!addDayMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (addDayMenuRef.current && !addDayMenuRef.current.contains(e.target as Node)) {
        setAddDayMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAddDayMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [addDayMenuOpen]);

  // Natural Language Program modal state
  const [naturalProgramModalOpen, setNaturalProgramModalOpen] = useState(false);
  const [naturalText, setNaturalText] = useState('');
  const [enrichFreeDays, setEnrichFreeDays] = useState(true);
  const [parsedPlan, setParsedPlan] = useState<ParsedItineraryPlan | null>(null);

  const dayStripRef = useRef<HTMLDivElement>(null);
  const dayButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // Activity modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [actDayId, setActDayId] = useState<string>('');
  const [actTime, setActTime] = useState('09:30');
  const [actTitle, setActTitle] = useState('');
  const [actCategory, setActCategory] = useState<ActivityCategory>('sightseeing');
  const [actLocation, setActLocation] = useState('');
  const [actLat, setActLat] = useState<string>('');
  const [actLng, setActLng] = useState<string>('');
  const [actGooglePlaceId, setActGooglePlaceId] = useState<string | undefined>(undefined);
  const [actMapUrl, setActMapUrl] = useState<string | undefined>(undefined);
  const [actCost, setActCost] = useState('');
  const [actNotes, setActNotes] = useState('');
  const [actPhotos, setActPhotos] = useState<string[]>([]);
  const [actRating, setActRating] = useState<number | undefined>(undefined);
  const [actUserRatingCount, setActUserRatingCount] = useState<number | undefined>(undefined);
  const [fetchingPhotos, setFetchingPhotos] = useState(false);
  const actSessionTokenRef = useRef<string>(createPlacesSessionToken());

  // Geocoding search state (integrated live autocomplete + interactive map picker + auto-pin on save)
  const [placeResults, setPlaceResults] = useState<GeocodedPlace[]>([]);
  const [searchingPlaces, setSearchingPlaces] = useState(false);
  const [placeError, setPlaceError] = useState('');
  const [savingActivity, setSavingActivity] = useState(false);
  const [modalMapPickerOpen, setModalMapPickerOpen] = useState(false);
  const suppressLocationAutocompleteRef = useRef(false);

  // Day rename modal
  const [editingDayTitleOpen, setEditingDayTitleOpen] = useState(false);
  const [dayTitleDraft, setDayTitleDraft] = useState('');

  const formIdPrefix = useId();

  const safeDayIdx = activeTrip
    ? Math.min(selectedDayIndex, Math.max(activeTrip.days.length - 1, 0))
    : 0;

  const currentDay = activeTrip ? activeTrip.days[safeDayIdx] : undefined;

  const dayBiasCenter: [number, number] | undefined = (() => {
    if (!activeTrip) return undefined;
    const lastGeo = [...(currentDay?.activities ?? [])]
      .reverse()
      .find((a) => typeof a.lat === 'number' && typeof a.lng === 'number');
    if (lastGeo && typeof lastGeo.lat === 'number' && typeof lastGeo.lng === 'number') {
      return [lastGeo.lat, lastGeo.lng];
    }
    return activeTrip.defaultCenter;
  })();

  const dayWeatherLocation = (() => {
    if (!activeTrip || !currentDay) return undefined;
    const firstGeo = currentDay.activities.find(
      (a) => typeof a.lat === 'number' && typeof a.lng === 'number'
    );
    if (firstGeo && typeof firstGeo.lat === 'number' && typeof firstGeo.lng === 'number') {
      return {
        lat: firstGeo.lat,
        lng: firstGeo.lng,
        name: firstGeo.locationName || currentDay.title
      };
    }
    if (activeTrip.defaultCenter && activeTrip.defaultCenter.length === 2) {
      return {
        lat: activeTrip.defaultCenter[0],
        lng: activeTrip.defaultCenter[1],
        name: activeTrip.destination || currentDay.title
      };
    }
    return undefined;
  })();

  // Jump to requested day when navigating from Places Recap
  useEffect(() => {
    if (typeof focusDayIndex === 'number' && focusDayIndex >= 0) {
      handleSelectDay(focusDayIndex);
      onFocusDayHandled?.();
    }
  }, [focusDayIndex, onFocusDayHandled, handleSelectDay]);

  // Synchronize stored day if active trip changes
  useEffect(() => {
    if (activeTrip) {
      const savedDay = getStoredDayIndex(activeTrip.id, activeTrip.days.length);
      setSelectedDayIndex(savedDay);
    }
  }, [activeTrip?.id]);

  // Keep URL ?day= aligned with current safeDayIdx
  useEffect(() => {
    if (!activeTrip) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const currentTab = params.get('tab');
      if (!currentTab || currentTab === 'itinerary') {
        const currentDayParam = params.get('day');
        const expected = String(safeDayIdx + 1);
        if (currentDayParam !== expected) {
          params.set('day', expected);
          const newUrl = `${window.location.pathname}?${params.toString()}`;
          window.history.replaceState(null, '', newUrl);
        }
      }
    } catch {}
  }, [activeTrip, safeDayIdx]);

  // Keep selected day scrolled nicely into view without clipping
  useEffect(() => {
    const btn = dayButtonRefs.current[safeDayIdx];
    if (btn && !expandDaysGrid) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [safeDayIdx, expandDaysGrid]);

  const priorDateIso = activeTrip?.days[0]?.date
    ? addDaysIso(activeTrip.days[0].date, -1)
    : '';
  const formattedPriorDate = priorDateIso
    ? new Date(`${priorDateIso}T00:00:00`).toLocaleDateString('it-IT', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
      })
    : '';
  const compactPriorDate = priorDateIso
    ? new Date(`${priorDateIso}T00:00:00`).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short'
      })
    : '';

  const lastDayDate = activeTrip?.days[activeTrip.days.length - 1]?.date;
  const nextDateIso = lastDayDate ? addDaysIso(lastDayDate, 1) : '';
  const formattedNextDate = nextDateIso
    ? new Date(`${nextDateIso}T00:00:00`).toLocaleDateString('it-IT', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
      })
    : '';
  const compactNextDate = nextDateIso
    ? new Date(`${nextDateIso}T00:00:00`).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short'
      })
    : '';

  const handleAddDayAtStart = () => {
    setAddDayMenuOpen(false);
    addDayAtStart();
    handleSelectDay(0);
    if (dayStripRef.current) {
      dayStripRef.current.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  const handleAddDayAtEnd = () => {
    setAddDayMenuOpen(false);
    addDay();
    if (activeTrip) {
      handleSelectDay(activeTrip.days.length);
    } else {
      setSelectedActivityId(null);
    }
    setTimeout(() => {
      if (dayStripRef.current) {
        dayStripRef.current.scrollTo({ left: dayStripRef.current.scrollWidth, behavior: 'smooth' });
      }
    }, 50);
  };

  // Smart detect Google Maps pasted URLs or coordinates (0ms, $0.00 cost)
  const handleSmartPasteDetect = (text: string): boolean => {
    const parsed = parseGoogleMapsInput(text);
    if (parsed) {
      suppressLocationAutocompleteRef.current = true;
      if (!actTitle.trim()) {
        setActTitle(parsed.shortName.split(',')[0].trim() || 'Nuova tappa');
      }
      setActLocation(parsed.displayName || parsed.shortName);
      setActLat(parsed.lat.toFixed(6));
      setActLng(parsed.lng.toFixed(6));
      if (parsed.googlePlaceId) {
        setActGooglePlaceId(parsed.googlePlaceId);
      }
      if (parsed.externalUrl) {
        setActMapUrl(parsed.externalUrl);
      }
      if (parsed.suggestedCategory) {
        setActCategory(parsed.suggestedCategory);
      }
      setPlaceResults([]);
      setPlaceError('✓ Posizione rilevata dal link Google Maps!');
      return true;
    }
    return false;
  };

  // Live debounced autocomplete directly on "Luogo / Indirizzo" inside Activity modal
  useEffect(() => {
    if (!modalOpen) return;
    if (suppressLocationAutocompleteRef.current) {
      suppressLocationAutocompleteRef.current = false;
      return;
    }

    const q = actLocation.trim();
    if (q.length < 2) {
      setPlaceResults([]);
      setPlaceError('');
      return;
    }

    if (handleSmartPasteDetect(q)) {
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearchingPlaces(true);
      setPlaceError('');
      try {
        const results = await autocompletePlaces(q, dayBiasCenter, actSessionTokenRef.current);
        setPlaceResults(results);
      } catch {
        // Silent during live typing; explicit button/Enter reports error
      } finally {
        setSearchingPlaces(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actLocation, modalOpen]);

  if (!activeTrip) return null;

  const completedCount = currentDay?.activities.filter((a) => a.completed).length ?? 0;
  const totalCount = currentDay?.activities.length ?? 0;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const scrollDayStrip = (delta: number) => {
    dayStripRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const suggestNextTime = (): string => {
    const lastWithTime = [...(currentDay?.activities ?? [])]
      .reverse()
      .find((a) => /^\d{2}:\d{2}$/.test(a.time || ''));
    if (!lastWithTime?.time) return '10:00';
    const [hh, mm] = lastWithTime.time.split(':').map(Number);
    const nextH = Math.min((hh || 10) + 2, 22);
    return `${String(nextH).padStart(2, '0')}:${String(mm || 0).padStart(2, '0')}`;
  };

  const openAddModal = () => {
    actSessionTokenRef.current = createPlacesSessionToken();
    suppressLocationAutocompleteRef.current = true;
    setEditingActivity(null);
    setActDayId(currentDay?.id ?? '');
    setActTime(suggestNextTime());
    setActTitle('');
    setActCategory('sightseeing');
    setActLocation('');
    setActLat('');
    setActLng('');
    setActGooglePlaceId(undefined);
    setActMapUrl(undefined);
    setActCost('');
    setActNotes('');
    setActPhotos([]);
    setActRating(undefined);
    setActUserRatingCount(undefined);
    setFetchingPhotos(false);
    setPlaceResults([]);
    setPlaceError('');
    setModalMapPickerOpen(false);
    setModalOpen(true);
  };

  const openAddModalFromPlace = (place: GeocodedPlace) => {
    actSessionTokenRef.current = createPlacesSessionToken();
    suppressLocationAutocompleteRef.current = true;
    setEditingActivity(null);
    setActDayId(currentDay?.id ?? '');
    setActTime(suggestNextTime());
    setActTitle(place.shortName.split(',')[0].trim() || 'Nuova tappa');
    setActCategory(place.suggestedCategory || 'sightseeing');
    setActLocation(place.displayName || place.shortName);
    setActLat(place.lat.toFixed(6));
    setActLng(place.lng.toFixed(6));
    setActGooglePlaceId(place.googlePlaceId);
    setActMapUrl(place.externalUrl);
    setActCost('');
    setActNotes('');
    const initialPhotos =
      place.photos && place.photos.length > 0
        ? place.photos
        : place.photoUrl
          ? [place.photoUrl]
          : [];
    setActPhotos(initialPhotos);
    setActRating(place.rating);
    setActUserRatingCount(place.userRatingCount);
    setFetchingPhotos(false);
    if (initialPhotos.length === 0 && (place.googlePlaceId || place.shortName)) {
      setFetchingPhotos(true);
      fetchPlacePreviewPhotos({
        query: place.displayName || place.shortName,
        biasCenter: [place.lat, place.lng],
        placeId: place.googlePlaceId
      })
        .then((preview) => {
          if (preview.photos && preview.photos.length > 0) setActPhotos(preview.photos);
          if (preview.rating) setActRating(preview.rating);
          if (preview.userRatingCount) setActUserRatingCount(preview.userRatingCount);
        })
        .catch(() => {})
        .finally(() => setFetchingPhotos(false));
    }
    setPlaceResults([]);
    setPlaceError('');
    setModalMapPickerOpen(false);
    setModalOpen(true);
  };

  const openEditModal = (act: Activity) => {
    actSessionTokenRef.current = createPlacesSessionToken();
    suppressLocationAutocompleteRef.current = true;
    setEditingActivity(act);
    setActDayId(currentDay?.id ?? '');
    setActTime(act.time || '');
    setActTitle(act.title);
    setActCategory(act.category);
    setActLocation(act.locationName || '');
    setActLat(typeof act.lat === 'number' ? String(act.lat) : '');
    setActLng(typeof act.lng === 'number' ? String(act.lng) : '');
    setActGooglePlaceId(act.googlePlaceId);
    setActMapUrl(act.mapUrl);
    setActCost(act.estimatedCost ? String(act.estimatedCost) : '');
    setActNotes(act.notes || '');
    setActPhotos(act.photos || []);
    setActRating(act.rating);
    setActUserRatingCount(act.userRatingCount);
    setFetchingPhotos(false);
    if (
      (!act.photos || act.photos.length === 0) &&
      (act.googlePlaceId || act.locationName || act.title)
    ) {
      setFetchingPhotos(true);
      fetchPlacePreviewPhotos({
        query: act.locationName || act.title,
        biasCenter:
          typeof act.lat === 'number' && typeof act.lng === 'number'
            ? [act.lat, act.lng]
            : dayBiasCenter,
        placeId: act.googlePlaceId
      })
        .then((preview) => {
          if (preview.photos && preview.photos.length > 0) setActPhotos(preview.photos);
          if (preview.rating) setActRating(preview.rating);
          if (preview.userRatingCount) setActUserRatingCount(preview.userRatingCount);
        })
        .catch(() => {})
        .finally(() => setFetchingPhotos(false));
    }
    setPlaceResults([]);
    setPlaceError('');
    setModalMapPickerOpen(false);
    setModalOpen(true);
  };

  const handleGeocodeSearch = async () => {
    const q = actLocation.trim() || actTitle.trim();
    if (!q) {
      setPlaceError('Scrivi un luogo, incolla un link Google Maps o il titolo della tappa per cercarlo.');
      return;
    }
    if (handleSmartPasteDetect(q)) {
      return;
    }
    setSearchingPlaces(true);
    setPlaceError('');
    try {
      const results = await autocompletePlaces(q, dayBiasCenter, actSessionTokenRef.current);
      setPlaceResults(results);
      if (results.length === 0) {
        setPlaceError('Nessun risultato trovato. Prova ad aggiungere il nome della città o incolla il link Google Maps.');
      }
    } catch {
      setPlaceError('Impossibile contattare il servizio mappe in questo momento.');
    } finally {
      setSearchingPlaces(false);
    }
  };

  const applyGeocodedPlace = async (place: GeocodedPlace) => {
    suppressLocationAutocompleteRef.current = true;
    let resolved = place;
    if (place.needsCoordinateLookup) {
      setSearchingPlaces(true);
      try {
        resolved = await resolvePlaceSelection(place);
        actSessionTokenRef.current = createPlacesSessionToken();
      } catch {
        // Fallback to place
      } finally {
        setSearchingPlaces(false);
      }
    }

    setActLocation(resolved.displayName || resolved.shortName);
    setActLat(resolved.lat.toFixed(6));
    setActLng(resolved.lng.toFixed(6));
    setActGooglePlaceId(resolved.googlePlaceId);
    if (resolved.externalUrl) {
      setActMapUrl(resolved.externalUrl);
    }
    if (resolved.suggestedCategory) {
      setActCategory(resolved.suggestedCategory);
    }
    if (!actTitle.trim()) {
      setActTitle(resolved.shortName.split(',')[0].trim());
    }
    setPlaceResults([]);
    setPlaceError('');

    if (resolved.photos && resolved.photos.length > 0) {
      setActPhotos(resolved.photos);
      setActRating(resolved.rating);
      setActUserRatingCount(resolved.userRatingCount);
    } else {
      setFetchingPhotos(true);
      fetchPlacePreviewPhotos({
        query: resolved.displayName || resolved.shortName,
        biasCenter: [resolved.lat, resolved.lng],
        placeId: resolved.googlePlaceId
      })
        .then((preview) => {
          if (preview.photos && preview.photos.length > 0) setActPhotos(preview.photos);
          if (preview.rating) setActRating(preview.rating);
          if (preview.userRatingCount) setActUserRatingCount(preview.userRatingCount);
        })
        .catch(() => {})
        .finally(() => setFetchingPhotos(false));
    }
  };

  const handleSaveActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDay || !actTitle.trim() || savingActivity) return;

    let finalLat = actLat.trim() ? Number.parseFloat(actLat.replace(',', '.')) : undefined;
    let finalLng = actLng.trim() ? Number.parseFloat(actLng.replace(',', '.')) : undefined;
    let finalLocation = actLocation.trim();
    let finalGooglePlaceId = actGooglePlaceId;
    let finalMapUrl = actMapUrl;
    let finalPhotos = actPhotos.length > 0 ? actPhotos : editingActivity?.photos;
    let finalRating = actRating ?? editingActivity?.rating;
    let finalUserRatingCount = actUserRatingCount ?? editingActivity?.userRatingCount;

    // Check if user pasted a Google Maps link or GPS coords directly without selecting from dropdown
    if (typeof finalLat !== 'number' || typeof finalLng !== 'number') {
      const parsed = parseGoogleMapsInput(finalLocation);
      if (parsed) {
        finalLat = parsed.lat;
        finalLng = parsed.lng;
        finalLocation = parsed.displayName || parsed.shortName;
        if (parsed.googlePlaceId) finalGooglePlaceId = parsed.googlePlaceId;
        if (parsed.externalUrl) finalMapUrl = parsed.externalUrl;
      }
    }

    // Auto-geocode fallback (Tesler's Law & Postel's Law): if user typed a place/title and hit Save directly without picking from dropdown, resolve coordinates automatically!
    const hasValidCoords =
      typeof finalLat === 'number' &&
      Number.isFinite(finalLat) &&
      typeof finalLng === 'number' &&
      Number.isFinite(finalLng);

    if (!hasValidCoords && (finalLocation.length >= 2 || actTitle.trim().length >= 3)) {
      setSavingActivity(true);
      try {
        const autoQuery = finalLocation || actTitle.trim();
        const matches = await searchPlaces(autoQuery, dayBiasCenter);
        if (matches.length > 0) {
          finalLat = matches[0].lat;
          finalLng = matches[0].lng;
          if (!finalLocation) {
            finalLocation = matches[0].shortName;
          }
          if (matches[0].googlePlaceId) {
            finalGooglePlaceId = matches[0].googlePlaceId;
          }
          if ((!finalPhotos || finalPhotos.length === 0) && matches[0].photos && matches[0].photos.length > 0) {
            finalPhotos = matches[0].photos;
            if (matches[0].rating) finalRating = matches[0].rating;
            if (matches[0].userRatingCount) finalUserRatingCount = matches[0].userRatingCount;
          }
        }
      } catch {
        // Offline or network error: still save stop locally without blocking
      } finally {
        setSavingActivity(false);
      }
    }

    const parsedCost = actCost.trim() ? parseFlexibleAmount(actCost) : undefined;

    const payload: Activity = {
      id:
        editingActivity?.id ??
        `act_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      time: actTime,
      title: actTitle.trim(),
      locationName: finalLocation,
      lat: typeof finalLat === 'number' && Number.isFinite(finalLat) ? finalLat : undefined,
      lng: typeof finalLng === 'number' && Number.isFinite(finalLng) ? finalLng : undefined,
      googlePlaceId: finalGooglePlaceId,
      mapUrl: finalMapUrl,
      category: actCategory,
      estimatedCost: parsedCost && parsedCost > 0 ? parsedCost : undefined,
      notes: actNotes.trim() || undefined,
      photos: finalPhotos && finalPhotos.length > 0 ? finalPhotos : undefined,
      rating: finalRating,
      userRatingCount: finalUserRatingCount,
      completed: editingActivity?.completed ?? false
    };

    const targetDayId = actDayId || currentDay.id;
    if (editingActivity && targetDayId !== currentDay.id) {
      moveActivity(currentDay.id, targetDayId, payload.id, payload.time, payload);
      const targetIdx = activeTrip.days.findIndex((d) => d.id === targetDayId);
      if (targetIdx >= 0) {
        handleSelectDay(targetIdx);
      }
    } else {
      upsertActivity(targetDayId, payload);
      if (targetDayId !== currentDay.id) {
        const targetIdx = activeTrip.days.findIndex((d) => d.id === targetDayId);
        if (targetIdx >= 0) {
          handleSelectDay(targetIdx);
        }
      }
    }

    setSelectedActivityId(payload.id);
    setModalOpen(false);
  };

  return (
    <section aria-label="Itinerario e Mappa" className="space-y-4">
      {/* Day Navigation Bar with Scroll Arrows + Wrap Toggle + Edit Dates Button */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
            <span className="shrink-0">
              {activeTrip.days.length}{' '}
              {activeTrip.days.length === 1 ? 'giorno' : 'giorni'}
              <span className="hidden sm:inline"> in programma</span>
            </span>
            {onOpenEditDates && (
              <button
                type="button"
                onClick={onOpenEditDates}
                title="Modifica date e dettagli viaggio"
                aria-label="Modifica date viaggio"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/60 transition-colors"
              >
                <CalendarRange className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Modifica date</span>
              </button>
            )}
            {onOpenPlacesRecap && (
              <button
                type="button"
                onClick={onOpenPlacesRecap}
                title="Apri Recap Luoghi e Preferiti"
                aria-label="Recap Luoghi e Preferiti"
                className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors"
              >
                <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Recap Luoghi</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setNaturalText('');
                setNaturalProgramModalOpen(true);
              }}
              title="Inserisci o aggiorna l'itinerario incollando il testo degli appunti"
              aria-label="Programma da testo"
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">Programma da testo</span>
              <span className="sm:hidden text-[11px] font-bold">Importa</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {activeTrip.days.length > 5 && (
              <button
                type="button"
                onClick={() => setExpandDaysGrid((v) => !v)}
                aria-label={expandDaysGrid ? 'Compatta barra giorni' : 'Mostra tutti i giorni in griglia'}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 border transition-colors ${
                  expandDaysGrid
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{expandDaysGrid ? 'Compatta barra' : 'Mostra tutti'}</span>
                <span className="sm:hidden">{expandDaysGrid ? 'Compatta' : 'Griglia'}</span>
              </button>
            )}
            <div className="relative" ref={addDayMenuRef}>
              <button
                type="button"
                onClick={() => setAddDayMenuOpen((v) => !v)}
                aria-expanded={addDayMenuOpen}
                aria-haspopup="menu"
                title="Aggiungi una giornata all'itinerario"
                className="px-2.5 py-1 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 inline-flex items-center gap-1 text-xs font-bold transition-colors bg-white dark:bg-slate-900"
              >
                <CalendarPlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>+ Giorno</span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 transition-transform ${addDayMenuOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {addDayMenuOpen && (
                <div
                  role="menu"
                  aria-label="Opzioni aggiunta giorno"
                  className="absolute right-0 mt-1.5 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-30 py-1 overflow-hidden"
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80">
                    Dove aggiungere il giorno?
                  </div>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleAddDayAtStart}
                    className="w-full text-left px-3 py-2.5 hover:bg-brand-50/60 dark:hover:bg-slate-800/80 flex items-start gap-2.5 transition-colors group"
                  >
                    <div className="p-1.5 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 mt-0.5 shrink-0 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/60">
                      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
                        <span>All'inizio del viaggio</span>
                        <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/80 px-1.5 py-0.5 rounded">
                          Giorno 1
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {formattedPriorDate ? `Anticipa al ${formattedPriorDate}` : 'Anticipa la partenza di 1 giorno'}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleAddDayAtEnd}
                    className="w-full text-left px-3 py-2.5 hover:bg-emerald-50/60 dark:hover:bg-slate-800/80 flex items-start gap-2.5 transition-colors group border-t border-slate-100 dark:border-slate-800/60"
                  >
                    <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 mt-0.5 shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60">
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
                        <span>Alla fine del viaggio</span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded">
                          Giorno {activeTrip.days.length + 1}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {formattedNextDate ? `Estendi al ${formattedNextDate}` : 'Estendi il viaggio di 1 giorno'}
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {expandDaysGrid ? (
          /* Expanded Multi-Row Grid: zero horizontal clipping regardless of trip length */
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 xl:grid-cols-10 gap-2 pt-1">
            {/* Direct affordance: Add Day At Start */}
            <button
              type="button"
              onClick={handleAddDayAtStart}
              title={formattedPriorDate ? `Aggiungi Giorno 1 all'inizio (${formattedPriorDate})` : "Aggiungi giorno all'inizio del viaggio"}
              aria-label="Aggiungi giorno all'inizio del viaggio"
              className="min-h-[52px] px-2.5 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 text-slate-500 dark:text-slate-400 flex flex-col justify-center items-center text-center transition-all bg-slate-50/50 dark:bg-slate-800/40 hover:bg-brand-50/50 dark:hover:bg-brand-950/20 group"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold group-hover:text-brand-600 dark:group-hover:text-brand-400">
                <Plus className="w-3.5 h-3.5 text-brand-500" aria-hidden="true" />
                <span>+ Inizio</span>
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-full">
                {compactPriorDate || 'Giorno 1'}
              </div>
            </button>

            {activeTrip.days.map((day, idx) => {
              const isSelected = idx === safeDayIdx;
              const formattedDate = day.date
                ? new Date(`${day.date}T00:00:00`).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: 'short'
                  })
                : '';
              return (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => handleSelectDay(idx)}
                  aria-current={isSelected ? 'page' : undefined}
                  aria-selected={isSelected}
                  className={`min-h-[52px] px-3 py-2 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/25 ring-2 ring-brand-500/30'
                      : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-brand-400'
                  }`}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider opacity-85">
                    Giorno {day.dayNumber}
                  </div>
                  <div className="text-xs font-bold truncate">{formattedDate || day.title}</div>
                </button>
              );
            })}

            {/* Direct affordance: Add Day At End */}
            <button
              type="button"
              onClick={handleAddDayAtEnd}
              title={formattedNextDate ? `Aggiungi Giorno ${activeTrip.days.length + 1} alla fine (${formattedNextDate})` : "Aggiungi giorno alla fine del viaggio"}
              aria-label="Aggiungi giorno alla fine del viaggio"
              className="min-h-[52px] px-2.5 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 text-slate-500 dark:text-slate-400 flex flex-col justify-center items-center text-center transition-all bg-slate-50/50 dark:bg-slate-800/40 hover:bg-brand-50/50 dark:hover:bg-brand-950/20 group"
            >
              <div className="flex items-center gap-1 text-[11px] font-bold group-hover:text-brand-600 dark:group-hover:text-brand-400">
                <Plus className="w-3.5 h-3.5 text-brand-500" aria-hidden="true" />
                <span>+ Fine</span>
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-full">
                {compactNextDate || `Giorno ${activeTrip.days.length + 1}`}
              </div>
            </button>
          </div>
        ) : (
          /* Scrollable Strip with Desktop Left/Right Arrow Controls & Wheel Support */
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollDayStrip(-280)}
              aria-label="Scorri giorni a sinistra"
              className="hidden sm:inline-flex min-w-[38px] min-h-[48px] items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>

            <div
              ref={dayStripRef}
              onWheel={(e) => {
                if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && dayStripRef.current) {
                  dayStripRef.current.scrollLeft += e.deltaY;
                }
              }}
              className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5"
            >
              {/* Direct affordance: Add Day At Start (before Day 1) */}
              <button
                type="button"
                onClick={handleAddDayAtStart}
                title={formattedPriorDate ? `Aggiungi Giorno 1 all'inizio (${formattedPriorDate})` : "Aggiungi giorno all'inizio del viaggio"}
                aria-label="Aggiungi giorno all'inizio del viaggio"
                className="shrink-0 min-h-[52px] min-w-[80px] px-2.5 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 text-slate-500 dark:text-slate-400 flex flex-col justify-center items-center text-center transition-all bg-slate-50/50 dark:bg-slate-800/40 hover:bg-brand-50/50 dark:hover:bg-brand-950/20 group"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold group-hover:text-brand-600 dark:group-hover:text-brand-400">
                  <Plus className="w-3.5 h-3.5 text-brand-500" aria-hidden="true" />
                  <span>Inizio</span>
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  {compactPriorDate || '+ Giorno 1'}
                </div>
              </button>

              {activeTrip.days.map((day, idx) => {
                const isSelected = idx === safeDayIdx;
                const formattedDate = day.date
                  ? new Date(`${day.date}T00:00:00`).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'short'
                    })
                  : '';
                return (
                  <button
                    key={day.id}
                    ref={(el) => {
                      dayButtonRefs.current[idx] = el;
                    }}
                    type="button"
                    onClick={() => handleSelectDay(idx)}
                    aria-current={isSelected ? 'page' : undefined}
                    aria-selected={isSelected}
                    className={`shrink-0 min-h-[52px] min-w-[96px] px-3.5 py-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-600/25 ring-2 ring-brand-500/30'
                        : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-brand-400'
                    }`}
                  >
                    <div className="text-[11px] font-bold uppercase tracking-wider opacity-85">
                      Giorno {day.dayNumber}
                    </div>
                    <div className="text-sm font-bold whitespace-nowrap">
                      {formattedDate || day.title}
                    </div>
                  </button>
                );
              })}

              {/* Direct affordance: Add Day At End (after last day) */}
              <button
                type="button"
                onClick={handleAddDayAtEnd}
                title={formattedNextDate ? `Aggiungi Giorno ${activeTrip.days.length + 1} alla fine (${formattedNextDate})` : "Aggiungi giorno alla fine del viaggio"}
                aria-label="Aggiungi giorno alla fine del viaggio"
                className="shrink-0 min-h-[52px] min-w-[80px] px-2.5 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 text-slate-500 dark:text-slate-400 flex flex-col justify-center items-center text-center transition-all bg-slate-50/50 dark:bg-slate-800/40 hover:bg-brand-50/50 dark:hover:bg-brand-950/20 group"
              >
                <div className="flex items-center gap-1 text-[11px] font-bold group-hover:text-brand-600 dark:group-hover:text-brand-400">
                  <Plus className="w-3.5 h-3.5 text-brand-500" aria-hidden="true" />
                  <span>Fine</span>
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  {compactNextDate || `+ Giorno ${activeTrip.days.length + 1}`}
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => scrollDayStrip(280)}
              aria-label="Scorri giorni a destra"
              className="hidden sm:inline-flex min-w-[38px] min-h-[48px] items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {currentDay && (
        <>
          {/* Day Header + Zeigarnik Progress + View Switcher */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
              <div className="flex items-center justify-between gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <h2 className="text-base sm:text-xl font-extrabold truncate">{currentDay.title}</h2>
                  {currentDay.date && (
                    <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                      {new Date(`${currentDay.date}T00:00:00`).toLocaleDateString('it-IT', {
                        weekday: 'short',
                        day: '2-digit',
                        month: 'short'
                      })}
                    </span>
                  )}
                  {dayWeatherLocation && (
                    <WeatherPreview
                      lat={dayWeatherLocation.lat}
                      lng={dayWeatherLocation.lng}
                      date={currentDay.date}
                      locationName={dayWeatherLocation.name}
                      size="sm"
                      showLabel={true}
                      showMinMax={true}
                    />
                  )}
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setDayTitleDraft(currentDay.title);
                      setEditingDayTitleOpen(true);
                    }}
                    aria-label="Rinomina giornata"
                    title="Rinomina giornata"
                    className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Pencil className="w-4 h-4" aria-hidden="true" />
                  </button>
                  {activeTrip.days.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          currentDay.activities.length > 0 &&
                          !window.confirm(
                            `Eliminare "${currentDay.title}" e le sue ${currentDay.activities.length} ${
                              currentDay.activities.length === 1 ? 'tappa' : 'tappe'
                            }?`
                          )
                        ) {
                          return;
                        }
                        deleteDay(currentDay.id);
                        handleSelectDay(Math.max(0, safeDayIdx - 1));
                      }}
                      aria-label="Elimina giornata"
                      title="Elimina giornata"
                      className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              {/* View Mode Toggle: Lista / Mappa + Lista / Solo Mappa */}
              <div
                role="group"
                aria-label="Modalità visualizzazione itinerario"
                className="w-full sm:w-auto inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 shrink-0"
              >
                <button
                  type="button"
                  onClick={() => handleSetViewMode('list')}
                  aria-pressed={viewMode === 'list'}
                  className={`flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <List className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Lista</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetViewMode('split')}
                  aria-pressed={viewMode === 'split'}
                  className={`flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                    viewMode === 'split'
                      ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Mappa + Lista</span>
                  <span className="sm:hidden">Mappa</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSetViewMode('map')}
                  aria-pressed={viewMode === 'map'}
                  className={`flex-1 sm:flex-initial justify-center px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                    viewMode === 'map'
                      ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <MapIcon className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Solo Mappa</span>
                </button>
              </div>
            </div>

            {totalCount > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span>
                    Tappe completate:{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {completedCount} di {totalCount}
                    </strong>
                  </span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Fluid Widescreen Content Grid */}
          <div
            className={
              viewMode === 'split'
                ? 'grid grid-cols-1 xl:grid-cols-12 gap-5 items-start'
                : 'space-y-4'
            }
          >
            {(viewMode === 'map' || viewMode === 'split') && (
              <div className={viewMode === 'split' ? 'xl:col-span-7 xl:sticky xl:top-6' : 'w-full'}>
                <InAppMap
                  activities={currentDay.activities}
                  defaultCenter={activeTrip.defaultCenter}
                  selectedActivityId={selectedActivityId}
                  onSelectActivity={(id) => setSelectedActivityId(id)}
                  onRequestAddActivity={openAddModal}
                  onPickLocationFromMap={openAddModalFromPlace}
                  layoutKey={`${viewMode}-${currentDay.id}`}
                  isFullMap={viewMode === 'map'}
                  date={currentDay.date}
                />
              </div>
            )}

            {(viewMode === 'list' || viewMode === 'split') && (
              <div className={viewMode === 'split' ? 'xl:col-span-5 space-y-3' : 'space-y-3'}>
                {currentDay.activities.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white/60 dark:bg-slate-900/50">
                    <MapPin className="w-10 h-10 mx-auto text-brand-500 mb-2" aria-hidden="true" />
                    <h3 className="text-base font-bold">Nessuna tappa pianificata</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      Aggiungi luoghi da visitare, ristoranti o spostamenti. Cercando il luogo, apparirà direttamente sulla mappa integrata!
                    </p>
                    <button
                      type="button"
                      onClick={openAddModal}
                      className="mt-4 min-h-[48px] px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold inline-flex items-center gap-2 shadow-sm transition-colors"
                    >
                      <Plus className="w-5 h-5" aria-hidden="true" />
                      <span>Aggiungi prima tappa</span>
                    </button>
                  </div>
                ) : (
                  <ol
                    className={
                      viewMode === 'list'
                        ? 'grid grid-cols-1 lg:grid-cols-2 gap-3'
                        : 'space-y-3'
                    }
                  >
                    {currentDay.activities.map((act, idx) => {
                      const meta = CATEGORY_META[act.category] || CATEGORY_META.sightseeing;
                      const CategoryIcon = meta.Icon;
                      const isSelected = selectedActivityId === act.id;
                      const hasCoords = typeof act.lat === 'number' && typeof act.lng === 'number';
                      const externalNavUrl = buildExternalMapsUrl({
                        locationName: act.locationName || act.title,
                        lat: act.lat,
                        lng: act.lng,
                        googlePlaceId: act.googlePlaceId,
                        customUrl: act.mapUrl
                      });

                      return (
                        <li
                          key={act.id}
                          onClick={() => {
                            setSelectedActivityId((prev) => (prev === act.id ? null : act.id));
                          }}
                          aria-selected={isSelected}
                          className={`rounded-2xl bg-white dark:bg-slate-900 p-4 border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                              : 'border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
                          } ${act.completed ? 'opacity-75' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleActivityCompleted(currentDay.id, act.id);
                              }}
                              aria-label={
                                act.completed ? 'Segna come da fare' : 'Segna come completata'
                              }
                              className="mt-0.5 min-w-[36px] min-h-[36px] -ml-1 inline-flex items-center justify-center rounded-full text-slate-400 hover:text-emerald-600 transition-colors"
                            >
                              {act.completed ? (
                                <CheckCircle2
                                  className="w-6 h-6 text-emerald-500"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Circle className="w-6 h-6" aria-hidden="true" />
                              )}
                            </button>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-extrabold">
                                  {idx + 1}
                                </span>
                                {act.time && (
                                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                    <Clock className="w-3 h-3" aria-hidden="true" />
                                    {act.time}
                                  </span>
                                )}
                                <span
                                  className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md border ${meta.badgeClass}`}
                                >
                                  <CategoryIcon className="w-3 h-3" />
                                  {meta.label}
                                </span>
                                {hasCoords && typeof act.lat === 'number' && typeof act.lng === 'number' && (
                                  <WeatherPreview
                                    lat={act.lat}
                                    lng={act.lng}
                                    date={currentDay.date}
                                    time={act.time}
                                    locationName={act.locationName || act.title}
                                    size="xs"
                                  />
                                )}
                              </div>

                              <h3
                                className={`text-base font-bold ${
                                  act.completed ? 'line-through text-slate-400' : ''
                                }`}
                              >
                                {act.title}
                              </h3>

                              {act.locationName && (
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1">
                                  <MapPin
                                    className="w-3.5 h-3.5 shrink-0 text-brand-500"
                                    aria-hidden="true"
                                  />
                                  <span className="truncate">{act.locationName}</span>
                                  {hasCoords && (
                                    <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                      Su mappa
                                    </span>
                                  )}
                                </p>
                              )}

                              {((act.photos && act.photos.length > 0) || act.locationName || act.title) && (
                                <div className="mt-2.5">
                                  <PlacePhotoPreview
                                    photos={act.photos}
                                    placeName={act.title}
                                    category={act.category}
                                    rating={act.rating}
                                    userRatingCount={act.userRatingCount}
                                    autoFetchQuery={act.locationName || act.title}
                                    biasCenter={
                                      typeof act.lat === 'number' && typeof act.lng === 'number'
                                        ? [act.lat, act.lng]
                                        : dayBiasCenter
                                    }
                                    placeId={act.googlePlaceId}
                                    onPhotosResolved={(resolvedPhotos, resolvedRating, resolvedCount) => {
                                      upsertActivity(currentDay.id, {
                                        ...act,
                                        photos: resolvedPhotos,
                                        rating: resolvedRating ?? act.rating,
                                        userRatingCount: resolvedCount ?? act.userRatingCount
                                      });
                                    }}
                                    size="card"
                                    showBadge={false}
                                  />
                                </div>
                              )}

                              {act.notes && (
                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5">
                                  {act.notes}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                  {(act.locationName || hasCoords) && (
                                    <a
                                      href={externalNavUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline py-1"
                                    >
                                      <span>Naviga</span>
                                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                                    </a>
                                  )}
                                  {act.estimatedCost && act.estimatedCost > 0 && (
                                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                      • Stima:{' '}
                                      {formatMoney(
                                        act.estimatedCost,
                                        activeTrip.destinationCurrency
                                      )}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditModal(act);
                                    }}
                                    aria-label={`Modifica ${act.title}`}
                                    title="Modifica tappa"
                                    className="p-2 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  >
                                    <Pencil className="w-4 h-4" aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteActivity(currentDay.id, act.id);
                                    }}
                                    aria-label={`Elimina ${act.title}`}
                                    title="Elimina tappa"
                                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                  >
                                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}

                <button
                  type="button"
                  onClick={openAddModal}
                  className="w-full min-h-[52px] rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-600/20 inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" aria-hidden="true" />
                  <span>Aggiungi Tappa</span>
                  <span className="hidden sm:inline"> a {currentDay.title}</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add / Edit Activity Modal (with wide HD Interactive Map Picker) */}
      <ModalDialog
        open={modalOpen}
        onClose={() => {
          setModalMapPickerOpen(false);
          setModalOpen(false);
        }}
        maxWidthClass={modalMapPickerOpen ? 'max-w-5xl' : 'max-w-lg'}
        title={
          modalMapPickerOpen
            ? 'Scegli il luogo della tappa sulla mappa'
            : editingActivity
              ? 'Modifica Tappa'
              : 'Nuova Tappa Itinerario'
        }
        subtitle={
          modalMapPickerOpen
            ? 'Cerca un indirizzo, usa il GPS o clicca il punto desiderato sulla mappa ad alta definizione'
            : 'Scrivi il nome del luogo oppure sceglilo direttamente dalla mappa'
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
                <span>Torna ai dettagli della tappa</span>
              </button>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                Clicca o tocca il punto desiderato e premi «Usa questo punto»
              </span>
            </div>

            <InAppMap
              activities={currentDay?.activities ?? []}
              defaultCenter={dayBiasCenter ?? activeTrip.defaultCenter}
              initialFocusCenter={
                actLat &&
                actLng &&
                Number.isFinite(Number.parseFloat(actLat)) &&
                Number.isFinite(Number.parseFloat(actLng))
                  ? [Number.parseFloat(actLat), Number.parseFloat(actLng)]
                  : dayBiasCenter ?? null
              }
              showRoutePolyline={true}
              pinStyle="numbered"
              initialPickMode={true}
              hideAddButton={true}
              insideModal={true}
              confirmPickLabel="Usa questo punto"
              customHeight="min(62dvh, 540px)"
              layoutKey={`modal-activity-picker-${currentDay?.id ?? 'day'}`}
              onPickLocationFromMap={(picked) => {
                applyGeocodedPlace(picked);
                setModalMapPickerOpen(false);
              }}
            />
          </div>
        ) : (
          <form onSubmit={handleSaveActivity} className="space-y-4">
            {activeTrip.days.length > 1 && (
              <div>
                <label
                  htmlFor={`${formIdPrefix}-day-select`}
                  className="block text-sm font-semibold mb-1 text-slate-900 dark:text-slate-100 flex items-center justify-between"
                >
                  <span>Giorno dell'itinerario</span>
                  <span className="text-xs text-brand-600 dark:text-brand-400 font-normal">
                    (Cambia giorno per spostare la tappa)
                  </span>
                </label>
                <select
                  id={`${formIdPrefix}-day-select`}
                  name="dayId"
                  value={actDayId}
                  onChange={(e) => setActDayId(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm font-semibold text-slate-900 dark:text-slate-100"
                >
                  {activeTrip.days.map((d, idx) => {
                    const dateStr = d.date
                      ? new Date(`${d.date}T00:00:00`).toLocaleDateString('it-IT', {
                          weekday: 'short',
                          day: '2-digit',
                          month: 'short'
                        })
                      : '';
                    return (
                      <option key={d.id} value={d.id}>
                        Giorno {idx + 1} {dateStr ? `(${dateStr})` : ''} — {d.title || `Giorno ${idx + 1}`}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor={`${formIdPrefix}-time`} className="block text-sm font-semibold mb-1">
                  Orario
                </label>
                <input
                  id={`${formIdPrefix}-time`}
                  name="time"
                  type="time"
                  value={actTime}
                  onChange={(e) => setActTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor={`${formIdPrefix}-cat`} className="block text-sm font-semibold mb-1">
                  Categoria
                </label>
                <select
                  id={`${formIdPrefix}-cat`}
                  name="category"
                  value={actCategory}
                  onChange={(e) => setActCategory(e.target.value as ActivityCategory)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
                >
                  {Object.entries(CATEGORY_META).map(([key, val]) => (
                    <option key={key} value={key}>
                      {val.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor={`${formIdPrefix}-title`} className="block text-sm font-semibold mb-1">
                Titolo tappa *
              </label>
              <input
                id={`${formIdPrefix}-title`}
                name="title"
                type="text"
                required
                value={actTitle}
                onChange={(e) => setActTitle(e.target.value)}
                placeholder="Es. Visita museo, Pranzo tipico, Check-in hotel..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
              />
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200 dark:border-slate-700 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <label htmlFor={`${formIdPrefix}-loc`} className="block text-sm font-semibold">
                  Luogo / Indirizzo su mappa
                </label>
                {actLat && actLng && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                    <span>✓ Posizionato su mappa</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActLat('');
                        setActLng('');
                      }}
                      className="underline font-normal opacity-80 hover:opacity-100 ml-1"
                    >
                      rimuovi pin
                    </button>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                <input
                  id={`${formIdPrefix}-loc`}
                  name="location"
                  type="search"
                  value={actLocation}
                  onChange={(e) => {
                    setActLocation(e.target.value);
                    if (actLat || actLng) {
                      setActLat('');
                      setActLng('');
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (e.nativeEvent.isComposing || e.nativeEvent.keyCode === 229) return;
                      void handleGeocodeSearch();
                    } else if (e.key === 'Escape') {
                      setPlaceResults([]);
                    }
                  }}
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  enterKeyHint="search"
                  aria-expanded={placeResults.length > 0}
                  aria-controls={`${formIdPrefix}-loc-results`}
                  placeholder="Cerca luogo, hotel o incolla link Maps..."
                  className="flex-1 min-w-[180px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-base sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => void handleGeocodeSearch()}
                  disabled={searchingPlaces}
                  className="min-h-[48px] px-3.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs sm:text-sm inline-flex items-center gap-1.5 shrink-0"
                >
                  {searchingPlaces ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Search className="w-4 h-4" aria-hidden="true" />
                  )}
                  <span>Cerca</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalMapPickerOpen(true)}
                  title="Apri mappa ampia per scegliere visivamente il luogo"
                  className="min-h-[48px] px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-sm shrink-0"
                >
                  <Crosshair className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Scegli in mappa</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Digita l’indirizzo, incolla un link Google Maps, usa <strong>«Scegli in mappa»</strong> a schermo ampio, oppure salva subito.
              </p>

              {placeError && (
                <p role="status" aria-live="polite" className="text-xs text-amber-600 dark:text-amber-400">
                  {placeError}
                </p>
              )}

              {placeResults.length > 0 && (
                <ul
                  id={`${formIdPrefix}-loc-results`}
                  role="listbox"
                  aria-label="Suggerimenti luoghi"
                  className="divide-y divide-slate-200 dark:divide-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden max-h-56 overflow-y-auto"
                >
                  {placeResults.map((p, idx) => (
                    <li key={`${p.googlePlaceId || p.lat}-${p.lng}-${idx}`} role="option" aria-selected={false}>
                      <button
                        type="button"
                        onClick={() => void applyGeocodedPlace(p)}
                        className="w-full min-h-[48px] text-left px-3 py-2.5 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-colors"
                      >
                        <div className="text-sm font-semibold text-brand-600 dark:text-brand-400 flex items-center justify-between">
                          <span>📍 {p.shortName}</span>
                          {p.suggestedCategory && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {CATEGORY_META[p.suggestedCategory]?.shortLabel || CATEGORY_META[p.suggestedCategory]?.label}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {p.displayName}
                        </div>
                      </button>
                    </li>
                  ))}
                  {placeResults[0]?.provider === 'google' ? (
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

            {(actPhotos.length > 0 || fetchingPhotos) && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-brand-500" aria-hidden="true" />
                    <span>Anteprima Luogo ({actPhotos.length || 0} {actPhotos.length === 1 ? 'foto' : 'foto'})</span>
                  </span>
                  {actPhotos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActPhotos([]);
                        setActRating(undefined);
                        setActUserRatingCount(undefined);
                      }}
                      className="text-[11px] text-slate-400 hover:text-red-500 transition-colors"
                    >
                      Rimuovi foto
                    </button>
                  )}
                </div>
                <PlacePhotoPreview
                  photos={actPhotos}
                  placeName={actTitle || actLocation || 'Anteprima luogo'}
                  rating={actRating}
                  userRatingCount={actUserRatingCount}
                  isLoading={fetchingPhotos}
                  size="modal"
                />
              </div>
            )}

            <details className="rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2.5">
              <summary className="text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer">
                Coordinate manuali e Costo stimato {actLat && actLng ? '✓' : '(Opzionale)'}
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                <div>
                  <label htmlFor={`${formIdPrefix}-lat`} className="block text-xs font-semibold mb-1">
                    Latitudine
                  </label>
                  <input
                    id={`${formIdPrefix}-lat`}
                    name="lat"
                    type="text"
                    inputMode="decimal"
                    value={actLat}
                    onChange={(e) => setActLat(e.target.value)}
                    placeholder="Es. 41.8902"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor={`${formIdPrefix}-lng`} className="block text-xs font-semibold mb-1">
                    Longitudine
                  </label>
                  <input
                    id={`${formIdPrefix}-lng`}
                    name="lng"
                    type="text"
                    inputMode="decimal"
                    value={actLng}
                    onChange={(e) => setActLng(e.target.value)}
                    placeholder="Es. 12.4922"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor={`${formIdPrefix}-cost`} className="block text-xs font-semibold mb-1">
                    Costo ({activeTrip.destinationCurrency})
                  </label>
                  <input
                    id={`${formIdPrefix}-cost`}
                    name="estimated_cost"
                    type="text"
                    inputMode="decimal"
                    value={actCost}
                    onChange={(e) => setActCost(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
                  />
                </div>
              </div>
            </details>

            <div>
              <label htmlFor={`${formIdPrefix}-notes`} className="block text-sm font-semibold mb-1">
                Note utili
              </label>
              <textarea
                id={`${formIdPrefix}-notes`}
                name="notes"
                rows={2}
                value={actNotes}
                onChange={(e) => setActNotes(e.target.value)}
                placeholder="Orari apertura, uscita metro consigliata, biglietti..."
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
                disabled={savingActivity}
                className="min-h-[48px] px-6 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold text-sm inline-flex items-center gap-2"
              >
                {savingActivity && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                <span>{savingActivity ? 'Posizionamento...' : 'Salva Tappa'}</span>
              </button>
            </div>
          </form>
        )}
      </ModalDialog>

      {/* Rename Day Modal */}
      <ModalDialog
        open={editingDayTitleOpen}
        onClose={() => setEditingDayTitleOpen(false)}
        title="Rinomina Giornata"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (currentDay && dayTitleDraft.trim()) {
              updateDayTitle(currentDay.id, dayTitleDraft.trim());
            }
            setEditingDayTitleOpen(false);
          }}
          className="space-y-4"
        >
          <div>
            <label htmlFor={`${formIdPrefix}-daytitle`} className="block text-sm font-semibold mb-1">
              Titolo giornata (es. Città o quartiere)
            </label>
            <input
              id={`${formIdPrefix}-daytitle`}
              name="day_title"
              type="text"
              required
              value={dayTitleDraft}
              onChange={(e) => setDayTitleDraft(e.target.value)}
              placeholder="Es. Giorno 1 — Centro Storico"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingDayTitleOpen(false)}
              className="min-h-[48px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-sm"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="min-h-[48px] px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm"
            >
              Aggiorna
            </button>
          </div>
        </form>
      </ModalDialog>

      {/* Modal Genera/Aggiorna Programma da Testo in Linguaggio Naturale */}
      <ModalDialog
        open={naturalProgramModalOpen}
        onClose={() => setNaturalProgramModalOpen(false)}
        maxWidthClass="max-w-3xl"
        title="Genera o Aggiorna Programma da Testo"
        subtitle="Incolla o modifica il tuo itinerario in linguaggio naturale per rigenerare o aggiornare le giornate"
      >
        <div className="space-y-4">
          <NaturalProgramComposer
            value={naturalText}
            onChange={setNaturalText}
            enrichFreeDays={enrichFreeDays}
            onEnrichFreeDaysChange={setEnrichFreeDays}
            onPlanParsed={setParsedPlan}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setNaturalProgramModalOpen(false)}
              className="min-h-[44px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-xs"
            >
              Annulla
            </button>
            <button
              type="button"
              disabled={!parsedPlan || parsedPlan.days.length === 0}
              onClick={() => {
                if (parsedPlan && parsedPlan.days.length > 0) {
                  applyGeneratedItinerary(parsedPlan.days, {
                    title: parsedPlan.suggestedTitle,
                    destination: parsedPlan.detectedDestination,
                    emoji: parsedPlan.detectedEmoji,
                    destinationCurrency: parsedPlan.detectedCurrency,
                    exchangeRate: parsedPlan.detectedExchangeRate,
                    defaultCenter: parsedPlan.defaultCenter
                  });
                  handleSelectDay(0);
                  setNaturalProgramModalOpen(false);
                }
              }}
              className="min-h-[44px] px-5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>
                {parsedPlan
                  ? `Applica ${parsedPlan.days.length} ${
                      parsedPlan.days.length === 1 ? 'giorno' : 'giorni'
                    } a ${activeTrip.title}`
                  : 'Inserisci testo per generare'}
              </span>
            </button>
          </div>
        </div>
      </ModalDialog>
    </section>
  );
};
