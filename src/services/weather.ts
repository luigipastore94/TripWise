export type WeatherIconType =
  | 'Sun'
  | 'CloudSun'
  | 'Cloud'
  | 'CloudRain'
  | 'CloudDrizzle'
  | 'CloudSnow'
  | 'CloudLightning'
  | 'CloudFog';

export interface WeatherCondition {
  code: number;
  label: string;
  icon: WeatherIconType;
  colorClass: string;
}

export interface WeatherInfo {
  temperature: number;
  apparentTemperature?: number;
  condition: WeatherCondition;
  tempMax?: number;
  tempMin?: number;
  precipitationProbability?: number;
  humidity?: number;
  windSpeed?: number;
  isForecast: boolean;
  targetDate?: string;
  targetTime?: string;
  hourlySlot?: string;
  locationName?: string;
  fetchedAt: number;
}

export const WMO_WEATHER_MAP: Record<
  number,
  { label: string; icon: WeatherIconType; colorClass: string }
> = {
  0: { label: 'Sereno', icon: 'Sun', colorClass: 'text-amber-500' },
  1: { label: 'Prevalentemente sereno', icon: 'Sun', colorClass: 'text-amber-500' },
  2: { label: 'Poco nuvoloso', icon: 'CloudSun', colorClass: 'text-sky-500' },
  3: { label: 'Coperto', icon: 'Cloud', colorClass: 'text-slate-500' },
  45: { label: 'Nebbia', icon: 'CloudFog', colorClass: 'text-slate-400' },
  48: { label: 'Nebbia con brina', icon: 'CloudFog', colorClass: 'text-slate-400' },
  51: { label: 'Pioggerella leggera', icon: 'CloudDrizzle', colorClass: 'text-sky-400' },
  53: { label: 'Pioggerella', icon: 'CloudDrizzle', colorClass: 'text-sky-500' },
  55: { label: 'Pioggerella densa', icon: 'CloudDrizzle', colorClass: 'text-sky-600' },
  56: { label: 'Pioviggine gelata leggera', icon: 'CloudSnow', colorClass: 'text-cyan-400' },
  57: { label: 'Pioviggine gelata', icon: 'CloudSnow', colorClass: 'text-cyan-500' },
  61: { label: 'Pioggia leggera', icon: 'CloudRain', colorClass: 'text-sky-500' },
  63: { label: 'Pioggia moderata', icon: 'CloudRain', colorClass: 'text-blue-500' },
  65: { label: 'Pioggia intensa', icon: 'CloudRain', colorClass: 'text-blue-600' },
  66: { label: 'Pioggia gelata leggera', icon: 'CloudSnow', colorClass: 'text-cyan-500' },
  67: { label: 'Pioggia gelata intensa', icon: 'CloudSnow', colorClass: 'text-cyan-600' },
  71: { label: 'Neve debole', icon: 'CloudSnow', colorClass: 'text-indigo-400' },
  73: { label: 'Neve moderata', icon: 'CloudSnow', colorClass: 'text-indigo-500' },
  75: { label: 'Neve abbondante', icon: 'CloudSnow', colorClass: 'text-indigo-600' },
  77: { label: 'Granelli di neve', icon: 'CloudSnow', colorClass: 'text-indigo-400' },
  80: { label: 'Rovesci isolati', icon: 'CloudRain', colorClass: 'text-sky-500' },
  81: { label: 'Rovesci di pioggia', icon: 'CloudRain', colorClass: 'text-blue-500' },
  82: { label: 'Forti rovesci', icon: 'CloudRain', colorClass: 'text-blue-600' },
  85: { label: 'Rovesci di neve', icon: 'CloudSnow', colorClass: 'text-indigo-400' },
  86: { label: 'Forti rovesci di neve', icon: 'CloudSnow', colorClass: 'text-indigo-600' },
  95: { label: 'Temporale', icon: 'CloudLightning', colorClass: 'text-amber-600' },
  96: { label: 'Temporale con grandine', icon: 'CloudLightning', colorClass: 'text-purple-600' },
  99: { label: 'Forte temporale con grandine', icon: 'CloudLightning', colorClass: 'text-purple-700' }
};

export function getWeatherCondition(code: number): WeatherCondition {
  const match = WMO_WEATHER_MAP[code];
  if (match) {
    return { code, ...match };
  }
  return {
    code,
    label: 'Variabile',
    icon: 'CloudSun',
    colorClass: 'text-sky-500'
  };
}

/**
 * Quantize coordinate to ~2.5km grid to maximize cache hits
 * across nearby stops and avoid redundant API requests.
 */
export function quantizeCoord(coord: number): number {
  return Math.round(coord * 40) / 40;
}

/**
 * Rounds an arrival time string (e.g. "12:50" or "09:15") to the nearest integer hour (0-23).
 */
export function getNearestHour(timeStr: string): number {
  const parts = timeStr.trim().split(':');
  if (parts.length === 0) return 12;
  const h = parseInt(parts[0], 10);
  if (isNaN(h)) return 12;
  const m = parts.length > 1 ? parseInt(parts[1], 10) : 0;
  const rounded = m >= 30 ? h + 1 : h;
  return Math.min(Math.max(rounded, 0), 23);
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const memoryCache = new Map<string, { data: WeatherInfo; expiresAt: number }>();
const rawApiCache = new Map<string, { data: OpenMeteoResponse; expiresAt: number }>();
const inFlightRawRequests = new Map<string, Promise<OpenMeteoResponse | null>>();

function getCacheKey(lat: number, lng: number, targetDate?: string, targetTime?: string): string {
  const qLat = quantizeCoord(lat);
  const qLng = quantizeCoord(lng);
  const timeKey = targetTime ? `_${targetTime.replace(':', '')}` : '';
  return `tw_wx_${qLat.toFixed(3)}_${qLng.toFixed(3)}_${targetDate || 'cur'}${timeKey}`;
}

function getRawCacheKey(lat: number, lng: number): string {
  const qLat = quantizeCoord(lat);
  const qLng = quantizeCoord(lng);
  return `tw_raw_${qLat.toFixed(3)}_${qLng.toFixed(3)}`;
}

function readFromStorage(key: string): WeatherInfo | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const item = JSON.parse(raw);
    if (Date.now() > item.expiresAt) {
      sessionStorage.removeItem(key);
      return null;
    }
    return item.data;
  } catch {
    return null;
  }
}

function writeToStorage(key: string, data: WeatherInfo): void {
  try {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        data,
        expiresAt: Date.now() + CACHE_TTL_MS
      })
    );
  } catch {
    // Ignore storage quota errors
  }
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m: number;
    relative_humidity_2m?: number;
    apparent_temperature?: number;
    weather_code: number;
    wind_speed_10m?: number;
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max?: number[];
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    apparent_temperature?: number[];
    precipitation_probability?: number[];
    relative_humidity_2m?: number[];
    wind_speed_10m?: number[];
  };
}

/**
 * Fetches the raw weather dataset from Open-Meteo including current, 16-day daily, and hourly forecasts.
 * Multiple stops in the same area share a single HTTP request via deduplication and caching.
 */
async function fetchRawOpenMeteo(lat: number, lng: number): Promise<OpenMeteoResponse | null> {
  const rawKey = getRawCacheKey(lat, lng);

  // Check in-memory raw cache
  const cached = rawApiCache.get(rawKey);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }

  // Check in-flight raw request
  const inFlight = inFlightRawRequests.get(rawKey);
  if (inFlight) {
    return inFlight;
  }

  const promise = (async (): Promise<OpenMeteoResponse | null> => {
    const qLat = quantizeCoord(lat);
    const qLng = quantizeCoord(lng);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 4500);

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${qLat}&longitude=${qLng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&hourly=temperature_2m,weather_code,apparent_temperature,precipitation_probability,relative_humidity_2m,wind_speed_10m&forecast_days=16&timezone=auto`;

      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });

      if (!response.ok) {
        return null;
      }

      const json: OpenMeteoResponse = await response.json();
      rawApiCache.set(rawKey, { data: json, expiresAt: Date.now() + CACHE_TTL_MS });
      return json;
    } catch {
      return null;
    } finally {
      window.clearTimeout(timeoutId);
      inFlightRawRequests.delete(rawKey);
    }
  })();

  inFlightRawRequests.set(rawKey, promise);
  return promise;
}

/**
 * Fetches lightweight, keyless weather forecast or current weather from Open-Meteo.
 * Supports:
 * 1. Day overview with min/max temperatures and general day condition.
 * 2. Stop-specific hourly forecast matching the exact arrival time of the activity.
 */
export async function fetchZoneWeather(
  lat: number,
  lng: number,
  targetDate?: string,
  locationName?: string,
  targetTime?: string
): Promise<WeatherInfo | null> {
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return null;
  }

  const cacheKey = getCacheKey(lat, lng, targetDate, targetTime);

  // 1. Check in-memory cache
  const memCached = memoryCache.get(cacheKey);
  if (memCached && Date.now() < memCached.expiresAt) {
    return memCached.data;
  }

  // 2. Check sessionStorage
  const sessionCached = readFromStorage(cacheKey);
  if (sessionCached) {
    memoryCache.set(cacheKey, { data: sessionCached, expiresAt: Date.now() + CACHE_TTL_MS });
    return sessionCached;
  }

  // 3. Fetch or reuse raw dataset
  const rawData = await fetchRawOpenMeteo(lat, lng);
  if (!rawData) {
    return null;
  }

  const current = rawData.current;
  const daily = rawData.daily;
  const hourly = rawData.hourly;

  let isForecast = false;
  let weatherCode = current?.weather_code ?? 0;
  let temperature = current ? Math.round(current.temperature_2m) : 20;
  let apparentTemp = current?.apparent_temperature ? Math.round(current.apparent_temperature) : undefined;
  let humidity = current?.relative_humidity_2m ? Math.round(current.relative_humidity_2m) : undefined;
  let windSpeed = current?.wind_speed_10m ? Math.round(current.wind_speed_10m) : undefined;
  let tempMax: number | undefined;
  let tempMin: number | undefined;
  let precipProb: number | undefined;
  let hourlySlot: string | undefined;

  // 1. Resolve Day Min / Max & daily precipitation
  if (targetDate && daily && Array.isArray(daily.time)) {
    const dateIdx = daily.time.indexOf(targetDate);
    if (dateIdx !== -1) {
      isForecast = true;
      weatherCode = daily.weather_code[dateIdx];
      tempMax = Math.round(daily.temperature_2m_max[dateIdx]);
      tempMin = Math.round(daily.temperature_2m_min[dateIdx]);
      if (daily.precipitation_probability_max) {
        precipProb = daily.precipitation_probability_max[dateIdx];
      }
      temperature = tempMax;
    }
  }

  // 2. Resolve Hourly Weather corresponding to Arrival Time (if provided)
  if (targetDate && targetTime && hourly && Array.isArray(hourly.time)) {
    const nearestHour = getNearestHour(targetTime);
    const hourPad = String(nearestHour).padStart(2, '0');
    const targetIsoHour = `${targetDate}T${hourPad}:00`;
    const hourlyIdx = hourly.time.indexOf(targetIsoHour);

    if (hourlyIdx !== -1) {
      isForecast = true;
      hourlySlot = `${hourPad}:00`;
      temperature = Math.round(hourly.temperature_2m[hourlyIdx]);
      weatherCode = hourly.weather_code[hourlyIdx];
      if (typeof hourly.apparent_temperature?.[hourlyIdx] === 'number') {
        apparentTemp = Math.round(hourly.apparent_temperature[hourlyIdx]);
      }
      if (typeof hourly.precipitation_probability?.[hourlyIdx] === 'number') {
        precipProb = hourly.precipitation_probability[hourlyIdx];
      }
      if (typeof hourly.relative_humidity_2m?.[hourlyIdx] === 'number') {
        humidity = Math.round(hourly.relative_humidity_2m[hourlyIdx]);
      }
      if (typeof hourly.wind_speed_10m?.[hourlyIdx] === 'number') {
        windSpeed = Math.round(hourly.wind_speed_10m[hourlyIdx]);
      }
    }
  }

  // If today and no specific time, use current real-time observations
  const todayIso = new Date().toISOString().slice(0, 10);
  if (!targetTime && targetDate === todayIso && current) {
    temperature = Math.round(current.temperature_2m);
    weatherCode = current.weather_code;
  }

  // Fallback to today daily min/max if not yet set
  if (tempMax === undefined && daily && daily.temperature_2m_max?.length) {
    tempMax = Math.round(daily.temperature_2m_max[0]);
    tempMin = Math.round(daily.temperature_2m_min[0]);
    if (precipProb === undefined && daily.precipitation_probability_max) {
      precipProb = daily.precipitation_probability_max[0];
    }
  }

  const condition = getWeatherCondition(weatherCode);

  const result: WeatherInfo = {
    temperature,
    apparentTemperature: apparentTemp,
    condition,
    tempMax,
    tempMin,
    precipitationProbability: precipProb,
    humidity,
    windSpeed,
    isForecast,
    targetDate,
    targetTime,
    hourlySlot,
    locationName,
    fetchedAt: Date.now()
  };

  // Cache final resolved weather object
  memoryCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
  writeToStorage(cacheKey, result);

  return result;
}
