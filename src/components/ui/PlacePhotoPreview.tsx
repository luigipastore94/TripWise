import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Camera, ChevronLeft, ChevronRight, X, ZoomIn, Star, ExternalLink } from 'lucide-react';
import type { ActivityCategory } from '../../types/trip';
import { PLACE_CATEGORY_META } from '../../data/placeCategories';
import { fetchPlacePreviewPhotos } from '../../services/geocoding';

export interface PlacePhotoPreviewProps {
  photos?: string[];
  placeName?: string;
  category?: ActivityCategory;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  loading?: boolean;
  isLoading?: boolean;
  autoFetchQuery?: string;
  biasCenter?: [number, number];
  placeId?: string;
  onPhotosResolved?: (photos: string[], rating?: number, userRatingCount?: number) => void;
  size?: 'compact' | 'normal' | 'card' | 'modal';
  layout?: 'grid' | 'cover';
  className?: string;
  showBadge?: boolean;
  onRefreshPhotos?: () => void;
  refreshing?: boolean;
}

export const PlacePhotoPreview: React.FC<PlacePhotoPreviewProps> = ({
  photos = [],
  placeName = 'Luogo',
  category,
  rating,
  userRatingCount,
  googleMapsUri,
  loading = false,
  isLoading = false,
  autoFetchQuery,
  biasCenter,
  placeId,
  onPhotosResolved,
  size = 'normal',
  layout = 'grid',
  className = '',
  showBadge = true,
  onRefreshPhotos,
  refreshing = false
}) => {
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const [errorImages, setErrorImages] = useState<Record<number, boolean>>({});

  const [internalPhotos, setInternalPhotos] = useState<string[]>(photos);
  const [internalRating, setInternalRating] = useState<number | undefined>(rating);
  const [internalCount, setInternalCount] = useState<number | undefined>(userRatingCount);
  const [isAutoFetching, setIsAutoFetching] = useState(false);
  const autoFetchTriggeredRef = useRef(false);

  useEffect(() => {
    if (photos && photos.length > 0) {
      setInternalPhotos(photos);
    }
  }, [photos]);

  useEffect(() => {
    if (typeof rating === 'number') setInternalRating(rating);
  }, [rating]);

  useEffect(() => {
    if (typeof userRatingCount === 'number') setInternalCount(userRatingCount);
  }, [userRatingCount]);

  // Auto-fetch photos on-demand for existing unhydrated places (Tesler's Law)
  useEffect(() => {
    if (
      internalPhotos.length > 0 ||
      !autoFetchQuery ||
      !autoFetchQuery.trim() ||
      autoFetchTriggeredRef.current
    ) {
      return;
    }

    autoFetchTriggeredRef.current = true;
    setIsAutoFetching(true);

    fetchPlacePreviewPhotos({
      query: autoFetchQuery,
      biasCenter,
      placeId
    })
      .then((res) => {
        if (res.photos && res.photos.length > 0) {
          setInternalPhotos(res.photos);
          if (typeof res.rating === 'number') setInternalRating(res.rating);
          if (typeof res.userRatingCount === 'number') setInternalCount(res.userRatingCount);
          onPhotosResolved?.(res.photos, res.rating, res.userRatingCount);
        }
      })
      .catch(() => {
        // silent fallback
      })
      .finally(() => {
        setIsAutoFetching(false);
      });
  }, [autoFetchQuery, biasCenter, placeId, internalPhotos.length, onPhotosResolved]);

  const validPhotos = internalPhotos.filter((url, idx) => !errorImages[idx] && Boolean(url));
  const photoCount = validPhotos.length;
  const isBusy = loading || isLoading || refreshing || isAutoFetching;

  // Handle keyboard navigation & body scroll lock for lightbox
  useEffect(() => {
    if (activeLightboxIndex === null) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveLightboxIndex(null);
      } else if (e.key === 'ArrowRight' && validPhotos.length > 1) {
        setActiveLightboxIndex((prev) =>
          prev !== null ? (prev + 1) % validPhotos.length : 0
        );
      } else if (e.key === 'ArrowLeft' && validPhotos.length > 1) {
        setActiveLightboxIndex((prev) =>
          prev !== null ? (prev - 1 + validPhotos.length) % validPhotos.length : 0
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeLightboxIndex, validPhotos.length]);

  // If loading skeleton
  if (isBusy) {
    if (layout === 'cover') {
      return (
        <div
          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse border border-slate-300/40 dark:border-slate-700/40 shrink-0 ${className}`}
          role="status"
          aria-label="Caricamento foto del luogo..."
        />
      );
    }
    return (
      <div className={`space-y-2 ${className}`} role="status" aria-label="Caricamento foto Google Maps...">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5 font-bold">
            <Camera className="w-3.5 h-3.5 text-brand-600 animate-pulse" aria-hidden="true" />
            <span>Caricamento foto del luogo...</span>
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse border border-slate-300/40 dark:border-slate-700/40"
            />
          ))}
        </div>
      </div>
    );
  }

  // If no photos available
  if (photoCount === 0) {
    return null;
  }

  const isCompact = size === 'compact';
  const isCard = size === 'card';

  // Determine grid columns: 3 photos -> 3 cols, 2 photos -> 2 cols, 1 photo -> 1 col
  const gridClass =
    photoCount >= 3
      ? 'grid-cols-3'
      : photoCount === 2
        ? 'grid-cols-2'
        : 'grid-cols-1';

  const displayRating = typeof internalRating === 'number' ? internalRating : rating;
  const displayCount = typeof internalCount === 'number' ? internalCount : userRatingCount;

  return (
    <>
      {layout === 'cover' ? (
        <div className={`relative shrink-0 ${className}`}>
          <button
            type="button"
            onClick={() => setActiveLightboxIndex(0)}
            aria-label={`Visualizza foto di ${placeName} (${photoCount} foto)`}
            title={`Guarda foto di ${placeName} (${photoCount} foto)`}
            className="group relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800 shrink-0 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-brand-500 block text-left transition-transform active:scale-95"
          >
            {!loadedImages[0] && (
              <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse" />
            )}
            <img
              src={validPhotos[0]}
              alt={`${placeName} - foto principale`}
              loading="lazy"
              decoding="async"
              onLoad={() => setLoadedImages((prev) => ({ ...prev, [0]: true }))}
              onError={() => setErrorImages((prev) => ({ ...prev, [0]: true }))}
              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                loadedImages[0] ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/25 transition-colors flex items-center justify-center pointer-events-none">
              <div className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
              </div>
            </div>
            {photoCount > 1 && (
              <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-[10px] font-extrabold text-white flex items-center gap-1 shadow-sm pointer-events-none">
                <Camera className="w-2.5 h-2.5" aria-hidden="true" />
                <span>{photoCount}</span>
              </span>
            )}
          </button>
        </div>
      ) : (
        <div className={`space-y-1.5 ${className}`}>
          {/* Top Info Bar (Badge + Rating + Google Maps link) */}
          {showBadge && (
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 font-bold text-slate-700 dark:text-slate-300">
                  <Camera className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" aria-hidden="true" />
                  <span>
                    {photoCount === 1 ? '1 foto' : `${photoCount} foto`} da Google Maps
                  </span>
                </span>

                {typeof displayRating === 'number' && (
                  <span className="inline-flex items-center gap-0.5 font-extrabold text-amber-500 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200/70 dark:border-amber-800/70">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-500" aria-hidden="true" />
                    <span>{displayRating.toFixed(1)}</span>
                    {displayCount ? (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium ml-0.5">
                        ({displayCount.toLocaleString('it-IT')})
                      </span>
                    ) : null}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {googleMapsUri && (
                  <a
                    href={googleMapsUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                )}
                {onRefreshPhotos && (
                  <button
                    type="button"
                    onClick={onRefreshPhotos}
                    className="font-medium text-slate-500 hover:text-brand-600 underline"
                  >
                    Aggiorna
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 2 or 3 Photos Thumbnail Grid */}
          <div
            className={`grid ${gridClass} gap-2 ${
              isCompact ? 'max-w-xs' : 'w-full'
            }`}
          >
            {validPhotos.slice(0, 3).map((photoUrl, idx) => {
              const isLoaded = loadedImages[idx];
              const isThirdAndMore = idx === 2 && photoCount > 3;
              return (
                <button
                  key={`${photoUrl}-${idx}`}
                  type="button"
                  onClick={() => setActiveLightboxIndex(idx)}
                  aria-label={`Ingrandisci foto ${idx + 1} di ${photoCount} di ${placeName}`}
                  className={`group relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-brand-500 text-left transition-all ${
                    isCard
                      ? 'aspect-[4/3] max-h-24 sm:max-h-28'
                      : isCompact
                        ? 'aspect-[4/3] max-h-20'
                        : photoCount === 1
                          ? 'aspect-[16/9] max-h-48 sm:max-h-56'
                          : 'aspect-[4/3] max-h-32 sm:max-h-36'
                  }`}
                >
                  {!isLoaded && (
                    <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800 animate-pulse" />
                  )}
                  <img
                    src={photoUrl}
                    alt={`${placeName} - foto ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    onLoad={() => setLoadedImages((prev) => ({ ...prev, [idx]: true }))}
                    onError={() => setErrorImages((prev) => ({ ...prev, [idx]: true }))}
                    className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                      isLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                  />

                  {/* Subtle Hover Zoom Affordance */}
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/25 transition-colors flex items-center justify-center pointer-events-none">
                    <div className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform scale-75 group-hover:scale-100">
                      <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Extra photos badge if more than 3 */}
                  {isThirdAndMore && (
                    <div className="absolute inset-0 bg-black/55 backdrop-blur-2xs flex items-center justify-center text-white font-black text-xs sm:text-sm">
                      +{photoCount - 2}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox Modal Dialog: Mounted to document.body via Portal to escape all parent transforms & overflow clipping */}
      {activeLightboxIndex !== null && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ${activeLightboxIndex + 1} di ${photoCount} - ${placeName}`}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-between p-3 sm:p-6 bg-black/95 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-hidden"
          onClick={() => setActiveLightboxIndex(null)}
        >
          {/* Top Toolbar */}
          <div
            className="w-full max-w-5xl flex items-center justify-between text-white pb-3 shrink-0 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <span className="text-sm sm:text-base font-extrabold truncate">
                {placeName}
              </span>
              <span className="text-xs text-white/70 font-semibold shrink-0">
                ({activeLightboxIndex + 1} di {photoCount})
              </span>
              {category && (
                <span className="hidden sm:inline text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/15 text-white/90">
                  {PLACE_CATEGORY_META[category]?.shortLabel ||
                    PLACE_CATEGORY_META[category]?.label}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {googleMapsUri && (
                <a
                  href={googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors border border-white/15"
                >
                  <span>Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                </a>
              )}

              {/* Prominent High-Contrast Close Button */}
              <button
                type="button"
                onClick={() => setActiveLightboxIndex(null)}
                aria-label="Chiudi visualizzatore foto (Esc)"
                title="Chiudi (Esc)"
                className="min-h-[44px] px-4 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 backdrop-blur-md transition-all border border-white/30 shadow-lg cursor-pointer"
              >
                <X className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>Chiudi</span>
              </button>
            </div>
          </div>

          {/* Main High-Res Image Display Area */}
          <div
            className="relative w-full max-w-5xl flex-1 flex items-center justify-center my-auto min-h-0 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={validPhotos[activeLightboxIndex]}
              alt={`${placeName} - foto ${activeLightboxIndex + 1}`}
              className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl transition-all"
            />

            {/* Prev Button */}
            {validPhotos.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveLightboxIndex(
                    (activeLightboxIndex - 1 + validPhotos.length) % validPhotos.length
                  );
                }}
                aria-label="Foto precedente"
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 min-w-[48px] min-h-[48px] rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all border border-white/20 shadow-xl cursor-pointer"
              >
                <ChevronLeft className="w-6 h-6" aria-hidden="true" />
              </button>
            )}

            {/* Next Button */}
            {validPhotos.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveLightboxIndex((activeLightboxIndex + 1) % validPhotos.length);
                }}
                aria-label="Foto successiva"
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 min-w-[48px] min-h-[48px] rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center transition-all border border-white/20 shadow-xl cursor-pointer"
              >
                <ChevronRight className="w-6 h-6" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip & Dismiss Hint */}
          <div
            className="w-full max-w-5xl flex flex-col items-center gap-1.5 pt-2 shrink-0 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {validPhotos.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {validPhotos.map((url, idx) => (
                  <button
                    key={`thumb-${url}-${idx}`}
                    type="button"
                    onClick={() => setActiveLightboxIndex(idx)}
                    aria-label={`Vai alla foto ${idx + 1}`}
                    className={`w-14 h-11 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      idx === activeLightboxIndex
                        ? 'border-brand-500 scale-105 shadow-md ring-2 ring-brand-500/30'
                        : 'border-white/30 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Miniatura ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
            <p className="text-[11px] text-white/50 hidden sm:block">
              Tocca fuori dall'immagine o premi <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px]">Esc</kbd> per chiudere
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
