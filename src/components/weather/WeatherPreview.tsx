import React, { useState, useEffect } from 'react';
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Droplets,
  Wind,
  Thermometer,
  Umbrella,
  X,
  Calendar,
  Clock
} from 'lucide-react';
import {
  fetchZoneWeather,
  type WeatherInfo,
  type WeatherIconType
} from '../../services/weather';

interface WeatherPreviewProps {
  lat?: number;
  lng?: number;
  date?: string;
  time?: string;
  locationName?: string;
  size?: 'xs' | 'sm' | 'md';
  showLabel?: boolean;
  showMinMax?: boolean;
  className?: string;
}

const ICON_COMPONENTS: Record<WeatherIconType, React.ComponentType<{ className?: string }>> = {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudDrizzle,
  CloudSnow,
  CloudLightning,
  CloudFog
};

/**
 * WeatherPreview Component
 *
 * Implements Jakob's Law (familiar weather preview convention),
 * Hick's Law (clean essential temperature + icon, deep metrics on demand),
 * and Miller's Law (grouped 4-card metric display in details popover).
 */
export const WeatherPreview: React.FC<WeatherPreviewProps> = ({
  lat,
  lng,
  date,
  time,
  locationName,
  size = 'sm',
  showLabel = false,
  showMinMax = false,
  className = ''
}) => {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
      setWeather(null);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetchZoneWeather(lat, lng, date, locationName, time)
      .then((data) => {
        if (isMounted) {
          setWeather(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setWeather(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [lat, lng, date, locationName, time]);

  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return null;
  }

  if (loading && !weather) {
    return (
      <span
        aria-label="Caricamento meteo..."
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 animate-pulse text-slate-400 text-xs ${className}`}
      >
        <span className="w-3.5 h-3.5 rounded-full bg-slate-200 dark:bg-slate-700" />
        <span className="w-8 h-3 rounded bg-slate-200 dark:bg-slate-700" />
      </span>
    );
  }

  if (!weather) {
    return null;
  }

  const IconComponent = ICON_COMPONENTS[weather.condition.icon] || CloudSun;

  const formattedDate = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString('it-IT', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
      })
    : undefined;

  const sizeStyles = {
    xs: {
      btn: 'px-1.5 py-0.5 text-[11px] gap-1',
      icon: 'w-3 h-3'
    },
    sm: {
      btn: 'px-2 py-0.5 text-xs gap-1.5',
      icon: 'w-3.5 h-3.5'
    },
    md: {
      btn: 'px-2.5 py-1 text-xs sm:text-sm gap-2 font-semibold',
      icon: 'w-4 h-4'
    }
  }[size];

  const hasMinMax =
    showMinMax &&
    typeof weather.tempMax === 'number' &&
    typeof weather.tempMin === 'number';

  const tooltipLabel = time
    ? `Meteo ore ${time}: ${weather.condition.label}, ${weather.temperature}°C (clicca per dettagli)`
    : hasMinMax
    ? `Meteo: ${weather.condition.label}, Max ${weather.tempMax}° / Min ${weather.tempMin}° (clicca per dettagli)`
    : `Meteo: ${weather.condition.label}, ${weather.temperature}°C (clicca per dettagli)`;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShowDetails(true);
        }}
        aria-label={tooltipLabel}
        title={tooltipLabel}
        className={`inline-flex items-center rounded-lg border transition-all select-none ${sizeStyles.btn} ${
          size === 'md'
            ? 'bg-amber-50/60 hover:bg-amber-100/70 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/50 text-slate-800 dark:text-slate-100'
            : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200'
        } ${className}`}
      >
        <IconComponent className={`${sizeStyles.icon} shrink-0 ${weather.condition.colorClass}`} />

        {hasMinMax ? (
          <span className="font-extrabold whitespace-nowrap inline-flex items-center gap-0.5 text-[11px] sm:text-xs">
            <span className="text-rose-600 dark:text-rose-400 font-black">↑{weather.tempMax}°</span>
            <span className="text-slate-300 dark:text-slate-600 font-normal">/</span>
            <span className="text-sky-600 dark:text-sky-400 font-black">↓{weather.tempMin}°</span>
          </span>
        ) : (
          <span className="font-bold whitespace-nowrap">{weather.temperature}°</span>
        )}

        {showLabel && (
          <span className="hidden sm:inline font-medium text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
            {weather.condition.label}
          </span>
        )}
      </button>

      {/* Weather Details Popover / Modal (Gestalt Visual Grouping & Miller's Law) */}
      {showDetails && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="weather-modal-title"
          onClick={(e) => {
            e.stopPropagation();
            setShowDetails(false);
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                  {weather.targetTime
                    ? `Previsione Oraria • Ore ${weather.targetTime}`
                    : weather.isForecast
                    ? 'Previsioni Meteo della Giornata'
                    : 'Condizioni Meteo Attuali'}
                </span>
                <h3 id="weather-modal-title" className="text-base font-bold text-slate-900 dark:text-white truncate">
                  {locationName || 'Zona della tappa'}
                </h3>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {formattedDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formattedDate}</span>
                    </span>
                  )}
                  {weather.targetTime && (
                    <span className="flex items-center gap-1 text-brand-600 dark:text-brand-400 font-semibold">
                      <Clock className="w-3 h-3" />
                      <span>Arrivo ore {weather.targetTime}</span>
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetails(false)}
                aria-label="Chiudi dettagli meteo"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Temperature & Condition Card */}
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-slate-800 dark:to-slate-850 p-4 border border-amber-200/60 dark:border-slate-700/80 flex items-center justify-between">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                    {weather.temperature}°
                  </span>
                  <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">C</span>
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1">
                  {weather.condition.label}
                </div>
                {(typeof weather.tempMin === 'number' || typeof weather.tempMax === 'number') && (
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 flex items-center gap-1.5">
                    <span className="text-rose-600 dark:text-rose-400 font-bold">Max {weather.tempMax}°</span>
                    <span>•</span>
                    <span className="text-sky-600 dark:text-sky-400 font-bold">Min {weather.tempMin}°</span>
                  </div>
                )}
              </div>
              <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 shadow-sm border border-amber-100 dark:border-slate-700">
                <IconComponent className={`w-10 h-10 ${weather.condition.colorClass}`} />
              </div>
            </div>

            {/* 4 Grouped Heuristic Metric Cards (Miller's Law) */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
                  <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                  <span>Percepita</span>
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {typeof weather.apparentTemperature === 'number'
                    ? `${weather.apparentTemperature}°C`
                    : `${weather.temperature}°C`}
                </div>
              </div>

              <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
                  <Umbrella className="w-3.5 h-3.5 text-blue-500" />
                  <span>Pioggia</span>
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {typeof weather.precipitationProbability === 'number'
                    ? `${weather.precipitationProbability}%`
                    : 'Bassa (<10%)'}
                </div>
              </div>

              <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
                  <Droplets className="w-3.5 h-3.5 text-sky-500" />
                  <span>Umidità</span>
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {typeof weather.humidity === 'number' ? `${weather.humidity}%` : '--'}
                </div>
              </div>

              <div className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-semibold mb-1">
                  <Wind className="w-3.5 h-3.5 text-teal-500" />
                  <span>Vento</span>
                </div>
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {typeof weather.windSpeed === 'number' ? `${weather.windSpeed} km/h` : '--'}
                </div>
              </div>
            </div>

            {/* Non-intrusive source note */}
            <div className="text-[11px] text-center text-slate-400 dark:text-slate-500 pt-1">
              {weather.targetTime
                ? `Meteo calcolato per l'orario di arrivo delle ${weather.targetTime} (slot ${weather.hourlySlot || weather.targetTime})`
                : weather.isForecast
                ? 'Previsione massima e minima per la data selezionata'
                : 'Meteo in tempo reale per la zona della tappa'}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
