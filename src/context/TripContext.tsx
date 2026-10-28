import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type {
  TripData,
  ItineraryDay,
  Activity,
  SavedPlace,
  Expense,
  Booking,
  ChecklistItem,
  Member,
  UserProfile,
  ColorSchemePreference
} from '../types/trip';
import { DESTINATION_PRESETS, MEMBER_COLORS } from '../data/presets';
import {
  isCloudReady,
  initFirestoreInstance,
  pushTripToCloud,
  fetchUserTripsFromCloud,
  subscribeToUserTrips,
  deleteCloudTrip,
  subscribeToAuthChanges,
  signInWithGoogleAccount,
  signOutAccount,
  normalizeInviteCode,
  joinCloudTrip
} from '../services/firebase';
import { searchPlaces } from '../services/geocoding';
import { subscribeToDailyQuota } from '../services/googleQuotaShield';
import {
  enrichItineraryDaysWithGeocoding
} from '../utils/naturalItineraryParser';
import { mergeTrips } from '../utils/tripMerge';

const LEGACY_TRIPS_STORAGE_KEY = 'tripwise_trips_v1';
const LAST_SYNCED_STORAGE_KEY = 'tripwise_last_synced_trips_v1';

export function getUserTripsStorageKey(uid?: string): string {
  return uid ? `tripwise_trips_${uid}` : LEGACY_TRIPS_STORAGE_KEY;
}

export function getUserActiveTripStorageKey(uid?: string): string {
  return uid ? `tripwise_active_trip_id_${uid}` : 'tripwise_active_trip_id';
}

export function loadUserLocalTrips(uid?: string): TripData[] {
  if (!uid) return [];
  try {
    const raw = localStorage.getItem(getUserTripsStorageKey(uid));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as TripData[];
    }
  } catch {
    // ignore
  }
  return [];
}

export function extractLegacyUnmigratedTrips(): TripData[] {
  try {
    const raw = localStorage.getItem(LEGACY_TRIPS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as TripData[];
      }
    }
  } catch {
    // ignore
  }
  return [];
}

function loadLastSyncedTrips(): Map<string, TripData> {
  const map = new Map<string, TripData>();
  try {
    const raw = localStorage.getItem(LAST_SYNCED_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const t of parsed) {
          if (t?.inviteCode) {
            map.set(normalizeInviteCode(t.inviteCode), t);
          }
        }
      }
    }
  } catch {
    // ignore
  }
  return map;
}

function persistLastSyncedTrips(map: Map<string, TripData>): void {
  try {
    const list = Array.from(map.values());
    localStorage.setItem(LAST_SYNCED_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore quota
  }
}

export interface CreateTripInput {
  title: string;
  destination: string;
  emoji: string;
  coverImage?: string;
  presetId: string;
  startDate: string;
  endDate: string;
  baseCurrency: string;
  destinationCurrency: string;
  exchangeRate: number;
  memberNames: string[];
  includeSampleActivities?: boolean;
  customDays?: ItineraryDay[];
  defaultCenter?: [number, number];
}

export interface UpdateTripDetailsInput {
  title: string;
  destination: string;
  emoji: string;
  coverImage?: string | null;
  startDate: string;
  endDate: string;
  baseCurrency: string;
  destinationCurrency: string;
  exchangeRate: number;
}

interface TripContextValue {
  trips: TripData[];
  activeTrip: TripData | null;
  user: UserProfile | null;
  authLoading: boolean;
  isOnline: boolean;
  isCloudAvailable: boolean;
  syncStatus: 'local' | 'synced' | 'syncing' | 'offline-cached' | 'error';
  colorScheme: ColorSchemePreference;
  setColorScheme: (scheme: ColorSchemePreference) => void;
  pendingInviteCode: string | null;
  dismissPendingInvite: () => void;
  joinNotification: string | null;
  clearJoinNotification: () => void;
  signInWithGoogle: () => Promise<{ ok: boolean; message?: string }>;
  signOut: () => Promise<void>;
  selectTrip: (tripId: string) => void;
  createTrip: (input: CreateTripInput) => TripData;
  joinTripByCode: (inviteCode: string) => Promise<{ ok: boolean; message: string }>;
  deleteTrip: (tripId: string) => void;
  updateTripMeta: (
    patch: Partial<
      Pick<
        TripData,
        | 'title'
        | 'destination'
        | 'emoji'
        | 'coverImage'
        | 'baseCurrency'
        | 'destinationCurrency'
        | 'exchangeRate'
        | 'members'
      >
    >
  ) => void;
  updateTripDatesAndDetails: (input: UpdateTripDetailsInput) => void;
  updateTripCoverImage: (coverImage: string | undefined | null) => void;
  applyGeneratedItinerary: (
    days: ItineraryDay[],
    metaPatch?: Partial<
      Pick<
        TripData,
        | 'title'
        | 'destination'
        | 'emoji'
        | 'destinationCurrency'
        | 'exchangeRate'
        | 'defaultCenter'
      >
    >
  ) => void;
  addDay: (title?: string, date?: string, position?: 'start' | 'end') => void;
  addDayAtStart: (title?: string, date?: string) => void;
  updateDayTitle: (dayId: string, title: string) => void;
  deleteDay: (dayId: string) => void;
  upsertActivity: (dayId: string, activity: Activity) => void;
  toggleActivityCompleted: (dayId: string, activityId: string) => void;
  deleteActivity: (dayId: string, activityId: string) => void;
  moveActivity: (
    sourceDayId: string,
    targetDayId: string,
    activityId: string,
    targetTime?: string
  ) => void;
  upsertSavedPlace: (place: SavedPlace) => void;
  toggleSavedPlaceVisited: (placeId: string) => void;
  deleteSavedPlace: (placeId: string) => void;
  promoteSavedPlaceToDay: (placeId: string, dayId: string, time?: string) => void;
  upsertExpense: (expense: Expense) => void;
  deleteExpense: (expenseId: string) => void;
  upsertBooking: (booking: Booking) => void;
  deleteBooking: (bookingId: string) => void;
  addChecklistItem: (item: Omit<ChecklistItem, 'id'>) => void;
  toggleChecklistItem: (itemId: string) => void;
  deleteChecklistItem: (itemId: string) => void;
  exportActiveTripJson: () => void;
  importTripJson: (jsonText: string) => { ok: boolean; message: string };
}

const TripContext = createContext<TripContextValue | undefined>(undefined);

function generateId(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function generateInviteCode(destination: string): string {
  const slug =
    destination
      .trim()
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 4) || 'TRIP';
  const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);
  return `TW-${slug}-${rand}`;
}

export function addDaysIso(isoDate: string, offsetDays: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const utc = new Date(Date.UTC(y, m - 1, d + offsetDays));
  return utc.toISOString().slice(0, 10);
}

function diffDaysInclusive(startIso: string, endIso: string): number {
  const [sy, sm, sd] = startIso.split('-').map(Number);
  const [ey, em, ed] = endIso.split('-').map(Number);
  if (!sy || !ey) return 1;
  const startUtc = Date.UTC(sy, (sm || 1) - 1, sd || 1);
  const endUtc = Date.UTC(ey, (em || 1) - 1, ed || 1);
  return Math.floor((endUtc - startUtc) / 86400000) + 1;
}

export function getLocalTodayIso(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export function reconcileDaysWithDateRange(
  existingDays: ItineraryDay[],
  startDate: string,
  endDate: string
): ItineraryDay[] {
  const fallbackIso = getLocalTodayIso(0);
  const safeStart = startDate || fallbackIso;
  const safeEnd = endDate && endDate >= safeStart ? endDate : safeStart;
  const rawCount = diffDaysInclusive(safeStart, safeEnd);
  const dayCount = Math.min(Math.max(rawCount || 1, 1), 60);

  const nextDays: ItineraryDay[] = [];
  for (let i = 0; i < dayCount; i++) {
    const iso = addDaysIso(safeStart, i);
    const prev = existingDays[i];

    if (prev) {
      nextDays.push({
        ...prev,
        dayNumber: i + 1,
        date: iso
      });
    } else {
      nextDays.push({
        id: generateId('day'),
        dayNumber: i + 1,
        date: iso,
        title: `Giorno ${i + 1}`,
        activities: []
      });
    }
  }
  return nextDays;
}

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isCloudAvailable = isCloudReady();
  const [authLoading, setAuthLoading] = useState<boolean>(() => isCloudAvailable);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [trips, setTrips] = useState<TripData[]>([]);
  const [activeTripId, setActiveTripId] = useState<string>('');

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncStatus, setSyncStatus] = useState<
    'local' | 'synced' | 'syncing' | 'offline-cached' | 'error'
  >('local');

  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);
  const [joinNotification, setJoinNotification] = useState<string | null>(null);

  const dismissPendingInvite = useCallback(() => {
    setPendingInviteCode(null);
    try {
      localStorage.removeItem('tripwise_pending_join_code');
      sessionStorage.removeItem('tripwise_pending_join_code');
    } catch {
      // ignore
    }
  }, []);

  const clearJoinNotification = useCallback(() => {
    setJoinNotification(null);
  }, []);

  const [colorScheme, setColorSchemeState] = useState<ColorSchemePreference>(() => {
    try {
      const saved = localStorage.getItem('color-scheme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'light dark';
  });

  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const lastSyncedTripsRef = useRef<Map<string, TripData>>(loadLastSyncedTrips());

  const getLastSyncedTrip = useCallback((inviteCode: string): TripData | null => {
    return lastSyncedTripsRef.current.get(normalizeInviteCode(inviteCode)) || null;
  }, []);

  const updateLastSyncedTrip = useCallback((trip: TripData) => {
    const key = normalizeInviteCode(trip.inviteCode);
    if (!key) return;
    lastSyncedTripsRef.current.set(key, trip);
    persistLastSyncedTrips(lastSyncedTripsRef.current);
  }, []);

  const activeTrip = trips.find((t) => t.id === activeTripId) ?? trips[0] ?? null;

  const persistTripsLocally = useCallback(
    (nextTrips: TripData[]) => {
      try {
        const key = getUserTripsStorageKey(user?.uid);
        localStorage.setItem(key, JSON.stringify(nextTrips));
      } catch (err) {
        console.warn('LocalStorage quota limit reached:', err);
      }
      broadcastRef.current?.postMessage({ type: 'TRIPS_UPDATED', uid: user?.uid });
    },
    [user?.uid]
  );

  const selectTrip = useCallback(
    (tripId: string) => {
      setActiveTripId(tripId);
      if (user?.uid) {
        localStorage.setItem(getUserActiveTripStorageKey(user.uid), tripId);
      }
    },
    [user?.uid]
  );

  const setColorScheme = useCallback((scheme: ColorSchemePreference) => {
    setColorSchemeState(scheme);
    try {
      if (scheme === 'light dark') {
        localStorage.removeItem('color-scheme');
      } else {
        localStorage.setItem('color-scheme', scheme);
      }
      const meta = document.querySelector('meta[name="color-scheme"]');
      if (meta) {
        meta.setAttribute('content', scheme);
      }
    } catch {
      // ignore
    }
  }, []);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cross-tab instant local sync
  useEffect(() => {
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel('tripwise_local_sync');
      broadcastRef.current = bc;
      bc.onmessage = (ev) => {
        if (ev.data?.type === 'TRIPS_UPDATED' && user?.uid && ev.data?.uid === user.uid) {
          setTrips(loadUserLocalTrips(user.uid));
        }
      };
    }

    const handleStorage = (e: StorageEvent) => {
      if (user?.uid && e.key === getUserTripsStorageKey(user.uid)) {
        setTrips(loadUserLocalTrips(user.uid));
      } else if (e.key === 'color-scheme') {
        const val = e.newValue === 'light' || e.newValue === 'dark' ? e.newValue : 'light dark';
        setColorSchemeState(val);
        const meta = document.querySelector('meta[name="color-scheme"]');
        if (meta) meta.setAttribute('content', val);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      broadcastRef.current?.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, [user?.uid]);

  // Observe Google Auth state & automatically initialize user session
  useEffect(() => {
    if (!isCloudAvailable) {
      setAuthLoading(false);
      return;
    }

    initFirestoreInstance();
    const unsub = subscribeToAuthChanges(async (authUser) => {
      setUser(authUser);
      setAuthLoading(false);

      if (!authUser) {
        setTrips([]);
        setActiveTripId('');
        setSyncStatus('local');
        return;
      }

      setSyncStatus(navigator.onLine ? 'syncing' : 'offline-cached');

      // 0. If the user opened an invite link (?join=TW-XXXX) prior to signing in, redeem it now
      const pendingJoin =
        localStorage.getItem('tripwise_pending_join_code') ||
        sessionStorage.getItem('tripwise_pending_join_code');
      let redeemedTrip: TripData | null = null;
      if (pendingJoin) {
        try {
          localStorage.removeItem('tripwise_pending_join_code');
          sessionStorage.removeItem('tripwise_pending_join_code');
        } catch {
          // ignore
        }
        try {
          redeemedTrip = await joinCloudTrip(pendingJoin, authUser);
          if (redeemedTrip) {
            setJoinNotification(`Ti sei unito al viaggio "${redeemedTrip.title}"!`);
            setTimeout(() => setJoinNotification(null), 4000);
          }
        } catch {
          // ignore
        }
      }

      // 1. Load user's local cached trips
      const cachedTrips = loadUserLocalTrips(authUser.uid);
      const initialMap = new Map<string, TripData>();
      for (const t of cachedTrips) {
        const key = normalizeInviteCode(t.inviteCode);
        if (key) initialMap.set(key, t);
      }

      // 2. Fetch remote trips directly from Cloud Firestore for this user
      try {
        const remoteTrips = await fetchUserTripsFromCloud(authUser.uid);
        for (const rt of remoteTrips) {
          const key = normalizeInviteCode(rt.inviteCode);
          if (key) {
            initialMap.set(key, rt);
            updateLastSyncedTrip(rt);
          }
        }
      } catch (err) {
        console.warn('Initial cloud trips fetch error:', err);
      }

      // 3. Check for legacy pre-login trips to migrate to this user's account
      const legacyTrips = extractLegacyUnmigratedTrips();
      if (legacyTrips.length > 0) {
        for (const lt of legacyTrips) {
          const key = normalizeInviteCode(lt.inviteCode);
          if (!key) continue;
          const uids = new Set(lt.memberUids ?? []);
          uids.add(authUser.uid);
          const migrated: TripData = {
            ...lt,
            memberUids: Array.from(uids),
            updatedAt: Date.now()
          };
          initialMap.set(key, migrated);
          pushTripToCloud(migrated).catch(() => {});
        }
        try {
          localStorage.removeItem(LEGACY_TRIPS_STORAGE_KEY);
        } catch {
          // ignore
        }
      }

      if (redeemedTrip) {
        const rKey = normalizeInviteCode(redeemedTrip.inviteCode);
        if (rKey) initialMap.set(rKey, redeemedTrip);
      }

      const initialList = Array.from(initialMap.values()).sort(
        (a, b) => b.updatedAt - a.updatedAt
      );

      setTrips(initialList);
      persistTripsLocally(initialList);

      const savedActive = localStorage.getItem(getUserActiveTripStorageKey(authUser.uid));
      if (redeemedTrip) {
        selectTrip(redeemedTrip.id);
      } else if (savedActive && initialList.some((t) => t.id === savedActive)) {
        selectTrip(savedActive);
      } else if (initialList[0]) {
        selectTrip(initialList[0].id);
      }
    });

    return () => {
      if (unsub) unsub();
    };
  }, [isCloudAvailable, persistTripsLocally, selectTrip]);

  // Shared Daily Google Quota real-time sync across travel companions
  useEffect(() => {
    const unsub = subscribeToDailyQuota();
    return () => unsub();
  }, [user]);

  // Real-time synchronization of ALL trips for this Google account across all devices (Mobile & Web)
  useEffect(() => {
    if (!isCloudAvailable || !user?.uid) {
      setSyncStatus('local');
      return;
    }

    initFirestoreInstance();
    setSyncStatus(isOnline ? 'syncing' : 'offline-cached');

    const unsub = subscribeToUserTrips(
      user.uid,
      (remoteTrips, fromCache) => {
        setTrips((prev) => {
          const mergedMap = new Map<string, TripData>();

          // Keep current local trips in map
          for (const localTrip of prev) {
            const key = normalizeInviteCode(localTrip.inviteCode);
            if (key) mergedMap.set(key, localTrip);
          }

          const remoteKeys = new Set<string>();

          for (const rt of remoteTrips) {
            const key = normalizeInviteCode(rt.inviteCode);
            if (!key) continue;
            remoteKeys.add(key);

            const existing = mergedMap.get(key);
            if (!existing) {
              mergedMap.set(key, rt);
              updateLastSyncedTrip(rt);
            } else {
              if (fromCache && existing.updatedAt >= rt.updatedAt) {
                continue;
              }
              const baseTrip = getLastSyncedTrip(key);
              const { merged, hasLocalChanges } = mergeTrips(baseTrip, existing, rt);
              mergedMap.set(key, merged);
              updateLastSyncedTrip(hasLocalChanges ? merged : rt);
              if (hasLocalChanges && isOnline && user?.uid) {
                pushTripToCloud(merged).catch(() => {});
              }
            }
          }

          // Handle remote deletions: if a trip was previously synced to cloud and the verified server
          // snapshot confirms it is no longer present in the user's trips, remove it locally.
          for (const [key] of mergedMap.entries()) {
            if (!remoteKeys.has(key)) {
              const wasSynced = getLastSyncedTrip(key);
              if (wasSynced && fromCache === false) {
                mergedMap.delete(key);
              }
            }
          }

          const mergedList = Array.from(mergedMap.values()).sort(
            (a, b) => b.updatedAt - a.updatedAt
          );

          persistTripsLocally(mergedList);

          // If active trip was deleted remotely, switch to the first available trip
          setActiveTripId((currentId) => {
            if (currentId && mergedList.some((t) => t.id === currentId)) {
              return currentId;
            }
            const fallback = mergedList[0]?.id ?? '';
            if (user?.uid) {
              localStorage.setItem(getUserActiveTripStorageKey(user.uid), fallback);
            }
            return fallback;
          });

          return mergedList;
        });

        setSyncStatus(!isOnline || fromCache ? 'offline-cached' : 'synced');
      },
      (error) => {
        console.warn('User trips subscription error:', error);
        setSyncStatus('error');
      }
    );

    return () => {
      if (unsub) unsub();
    };
  }, [
    isCloudAvailable,
    user?.uid,
    isOnline,
    getLastSyncedTrip,
    updateLastSyncedTrip,
    persistTripsLocally
  ]);

  const signInWithGoogle = useCallback(async () => {
    const res = await signInWithGoogleAccount();
    return { ok: res.ok, message: res.errorMessage };
  }, []);

  const signOut = useCallback(async () => {
    await signOutAccount();
    setUser(null);
    setTrips([]);
    setActiveTripId('');
    setSyncStatus('local');
  }, []);

  const mutateActiveTrip = useCallback(
    (updater: (trip: TripData) => TripData) => {
      setTrips((prev) => {
        const current = prev.find((t) => t.id === activeTripId) ?? prev[0];
        if (!current) return prev;
        const uids = new Set(current.memberUids ?? []);
        if (user?.uid) uids.add(user.uid);

        const updated: TripData = {
          ...updater(current),
          memberUids: Array.from(uids),
          updatedAt: Date.now()
        };
        const next = prev.map((t) => (t.id === current.id ? updated : t));
        persistTripsLocally(next);

        if (isCloudAvailable && user?.uid) {
          setSyncStatus(isOnline ? 'syncing' : 'offline-cached');
          pushTripToCloud(updated)
            .then(() => {
              setSyncStatus(isOnline ? 'synced' : 'offline-cached');
              updateLastSyncedTrip(updated);
            })
            .catch(() => setSyncStatus('error'));
        }
        return next;
      });
    },
    [activeTripId, isCloudAvailable, isOnline, persistTripsLocally, updateLastSyncedTrip, user?.uid]
  );

  const createTrip = useCallback(
    (input: CreateTripInput): TripData => {
      const preset =
        DESTINATION_PRESETS.find((p) => p.id === input.presetId) ?? DESTINATION_PRESETS[0];

      const validNames = input.memberNames.map((n) => n.trim()).filter(Boolean);
      const defaultFirst = user?.displayName || 'Viaggiatore 1';
      const namesList = validNames.length > 0 ? validNames : [defaultFirst, 'Viaggiatore 2'];

      const members: Member[] = namesList.map((name, idx) => ({
        id: generateId('mem'),
        name,
        color: MEMBER_COLORS[idx % MEMBER_COLORS.length],
        uid: idx === 0 && user?.uid ? user.uid : undefined,
        photoURL: idx === 0 && user?.photoURL ? user.photoURL : undefined
      }));

      const hasCustomDays = Array.isArray(input.customDays) && input.customDays.length > 0;
      const days = hasCustomDays
        ? input.customDays!
        : reconcileDaysWithDateRange([], input.startDate, input.endDate);

      if (!hasCustomDays && input.includeSampleActivities && preset.sampleActivities && days.length > 0) {
        days[0] = {
          ...days[0],
          title: `Giorno 1 — ${input.destination || preset.name}`,
          activities: preset.sampleActivities.map((sa) => ({
            id: generateId('act'),
            time: sa.time,
            title: sa.title,
            locationName: sa.locationName,
            lat: sa.lat,
            lng: sa.lng,
            category: sa.category,
            notes: sa.notes,
            completed: false
          }))
        };
      }

      const checklist: ChecklistItem[] = preset.checklistItems.map((ci) => ({
        id: generateId('chk'),
        category: ci.category,
        text: ci.text,
        completed: false,
        assignedToMemberId: 'shared'
      }));

      const finalStart = hasCustomDays ? days[0].date || input.startDate : input.startDate;
      const finalEnd = hasCustomDays
        ? days[days.length - 1].date || input.endDate
        : input.endDate >= input.startDate
          ? input.endDate
          : input.startDate;

      const newTrip: TripData = {
        id: generateId('trip'),
        inviteCode: generateInviteCode(input.destination || input.title),
        title: input.title.trim() || 'Nuovo Viaggio',
        destination: input.destination.trim() || preset.destination || 'Mondo',
        emoji: input.emoji || preset.emoji || '🌍',
        coverImage: input.coverImage || preset.coverImage,
        startDate: finalStart,
        endDate: finalEnd,
        baseCurrency: input.baseCurrency.toUpperCase() || 'EUR',
        destinationCurrency: input.destinationCurrency.toUpperCase() || 'EUR',
        exchangeRate: input.exchangeRate > 0 ? input.exchangeRate : 1,
        defaultCenter: input.defaultCenter ?? preset.defaultCenter,
        members,
        memberUids: user?.uid ? [user.uid] : [],
        days,
        expenses: [],
        bookings: [],
        checklist,
        updatedAt: Date.now()
      };

      setTrips((prev) => {
        const next = [newTrip, ...prev];
        persistTripsLocally(next);
        return next;
      });
      selectTrip(newTrip.id);

      if (isCloudAvailable && user?.uid) {
        pushTripToCloud(newTrip).catch(() => setSyncStatus('error'));
      }

      // Background GPS resolution for any custom-generated stop without offline coordinates
      const hasMissingCoords = days.some((d) =>
        d.activities.some((a) => typeof a.lat !== 'number' || typeof a.lng !== 'number')
      );
      if (hasMissingCoords) {
        enrichItineraryDaysWithGeocoding(days, newTrip.defaultCenter)
          .then((enrichedDays) => {
            setTrips((prev) => {
              const next = prev.map((t) =>
                t.id === newTrip.id
                  ? { ...t, days: enrichedDays, updatedAt: Date.now() }
                  : t
              );
              persistTripsLocally(next);
              const updatedTarget = next.find((t) => t.id === newTrip.id);
              if (updatedTarget && isCloudAvailable && user?.uid) {
                pushTripToCloud(updatedTarget).catch(() => {});
              }
              return next;
            });
          })
          .catch(() => {});
      }

      // Auto-center map on destination for custom trips (non-blocking)
      if (
        input.presetId === 'custom' &&
        newTrip.destination &&
        newTrip.destination.toLowerCase() !== 'mondo'
      ) {
        searchPlaces(newTrip.destination)
          .then((matches) => {
            if (matches.length > 0) {
              const center: [number, number] = [matches[0].lat, matches[0].lng];
              setTrips((prev) => {
                const next = prev.map((t) =>
                  t.id === newTrip.id ? { ...t, defaultCenter: center } : t
                );
                persistTripsLocally(next);
                return next;
              });
            }
          })
          .catch(() => {});
      }

      return newTrip;
    },
    [isCloudAvailable, persistTripsLocally, selectTrip, user]
  );

  const joinTripByCode = useCallback(
    async (inviteCode: string): Promise<{ ok: boolean; message: string }> => {
      const normalized = normalizeInviteCode(inviteCode);
      if (!normalized) {
        return { ok: false, message: 'Inserisci un Codice Invito valido (es. TW-GIAP-XXXX).' };
      }

      const localMatch = trips.find((t) => normalizeInviteCode(t.inviteCode) === normalized);
      if (localMatch) {
        selectTrip(localMatch.id);
        return { ok: true, message: `Viaggio "${localMatch.title}" selezionato!` };
      }

      if (!isCloudAvailable) {
        return {
          ok: false,
          message:
            'Sincronizzazione cloud non ancora attiva. Controlla la connessione internet.'
        };
      }

      let activeUser = user;
      if (!activeUser?.uid) {
        try {
          localStorage.setItem('tripwise_pending_join_code', normalized);
          sessionStorage.setItem('tripwise_pending_join_code', normalized);
        } catch {
          // ignore
        }
        const loginRes = await signInWithGoogleAccount();
        if (loginRes.redirected) {
          return { ok: true, message: 'Reindirizzamento all’account Google in corso...' };
        }
        if (!loginRes.ok || !loginRes.user?.uid) {
          return {
            ok: false,
            message:
              loginRes.errorMessage ||
              'Accedi con il tuo account Google per unirti al viaggio condiviso.'
          };
        }
        activeUser = loginRes.user;
        setUser(activeUser);
        try {
          localStorage.removeItem('tripwise_pending_join_code');
          sessionStorage.removeItem('tripwise_pending_join_code');
        } catch {
          // ignore
        }
      }

      try {
        setSyncStatus('syncing');
        const remote = await joinCloudTrip(normalized, activeUser);
        if (!remote) {
          setSyncStatus('local');
          return {
            ok: false,
            message: `Nessun viaggio trovato con il codice "${normalized}". Verifica che chi lo ha condiviso abbia effettuato l’accesso con Google.`
          };
        }

        setTrips((prev) => {
          const filtered = prev.filter((t) => normalizeInviteCode(t.inviteCode) !== normalized);
          const next = [remote, ...filtered];
          persistTripsLocally(next);
          updateLastSyncedTrip(remote);
          return next;
        });
        selectTrip(remote.id);
        setSyncStatus(navigator.onLine ? 'synced' : 'offline-cached');

        return { ok: true, message: `Ti sei unito al viaggio "${remote.title}"!` };
      } catch (err: unknown) {
        console.error('joinTripByCode error:', err);
        setSyncStatus('error');
        return {
          ok: false,
          message: 'Impossibile completare l’unione al viaggio. Riprova tra qualche istante.'
        };
      }
    },
    [trips, selectTrip, isCloudAvailable, user, persistTripsLocally, updateLastSyncedTrip]
  );

  // Capture ?join=TW-XXXX invite parameter or retrieve stored pending invite
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinParam = params.get('join');
    let candidate = '';

    if (joinParam) {
      candidate = normalizeInviteCode(joinParam);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    } else {
      try {
        const stored =
          localStorage.getItem('tripwise_pending_join_code') ||
          sessionStorage.getItem('tripwise_pending_join_code');
        if (stored) {
          candidate = normalizeInviteCode(stored);
        }
      } catch {
        // ignore
      }
    }

    if (candidate) {
      try {
        localStorage.setItem('tripwise_pending_join_code', candidate);
      } catch {
        // ignore
      }
      setPendingInviteCode(candidate);
    }
  }, []);

  // When an authenticated session is active and a pending invite is detected, automatically join
  useEffect(() => {
    if (!user?.uid || !pendingInviteCode) return;
    const codeToJoin = pendingInviteCode;
    dismissPendingInvite();

    joinTripByCode(codeToJoin).then((res) => {
      if (res.ok) {
        setJoinNotification(res.message);
        setTimeout(() => setJoinNotification(null), 4000);
      }
    });
  }, [user?.uid, pendingInviteCode, joinTripByCode, dismissPendingInvite]);

  const deleteTrip = useCallback(
    (tripId: string) => {
      setTrips((prev) => {
        const targetTrip = prev.find((t) => t.id === tripId);
        const next = prev.filter((t) => t.id !== tripId);
        persistTripsLocally(next);
        if (activeTripId === tripId) {
          const fallbackId = next[0]?.id ?? '';
          setActiveTripId(fallbackId);
          if (user?.uid) {
            localStorage.setItem(getUserActiveTripStorageKey(user.uid), fallbackId);
          }
        }
        if (targetTrip && isCloudAvailable && user) {
          deleteCloudTrip(targetTrip, user).catch((err) => {
            console.warn('deleteCloudTrip error:', err);
          });
        }
        return next;
      });
    },
    [activeTripId, isCloudAvailable, persistTripsLocally, user]
  );

  const updateTripMeta: TripContextValue['updateTripMeta'] = useCallback(
    (patch) => {
      mutateActiveTrip((trip) => {
        const next = {
          ...trip,
          ...patch
        };
        if ('coverImage' in patch && !patch.coverImage) {
          delete next.coverImage;
        }
        return next;
      });
    },
    [mutateActiveTrip]
  );

  const updateTripDatesAndDetails = useCallback(
    (input: UpdateTripDetailsInput) => {
      const nextDest = input.destination.trim();
      const prevDest = activeTrip?.destination ?? '';

      mutateActiveTrip((trip) => {
        const safeStart = input.startDate || trip.startDate;
        const safeEnd =
          input.endDate && input.endDate >= safeStart ? input.endDate : safeStart;
        const nextDays = reconcileDaysWithDateRange(trip.days, safeStart, safeEnd);

        const nextTrip: TripData = {
          ...trip,
          title: input.title.trim() || trip.title,
          destination: nextDest || trip.destination,
          emoji: input.emoji || trip.emoji,
          startDate: safeStart,
          endDate: safeEnd,
          baseCurrency: input.baseCurrency.toUpperCase() || trip.baseCurrency,
          destinationCurrency: input.destinationCurrency.toUpperCase() || trip.destinationCurrency,
          exchangeRate: input.exchangeRate > 0 ? input.exchangeRate : trip.exchangeRate,
          days: nextDays
        };

        if ('coverImage' in input) {
          if (input.coverImage) {
            nextTrip.coverImage = input.coverImage;
          } else {
            delete nextTrip.coverImage;
          }
        }

        return nextTrip;
      });

      if (nextDest && nextDest.toLowerCase() !== 'mondo' && nextDest !== prevDest) {
        searchPlaces(nextDest)
          .then((matches) => {
            if (matches.length > 0) {
              mutateActiveTrip((trip) => ({
                ...trip,
                defaultCenter: [matches[0].lat, matches[0].lng]
              }));
            }
          })
          .catch(() => {});
      }
    },
    [activeTrip?.destination, mutateActiveTrip]
  );

  const updateTripCoverImage = useCallback(
    (coverImage: string | undefined | null) => {
      mutateActiveTrip((trip) => {
        const next = { ...trip };
        if (coverImage) {
          next.coverImage = coverImage;
        } else {
          delete next.coverImage;
        }
        return next;
      });
    },
    [mutateActiveTrip]
  );

  const applyGeneratedItinerary: TripContextValue['applyGeneratedItinerary'] = useCallback(
    (days, metaPatch) => {
      if (!days || days.length === 0) return;
      const startIso = days[0].date;
      const endIso = days[days.length - 1].date;

      mutateActiveTrip((trip) => ({
        ...trip,
        ...(metaPatch ?? {}),
        startDate: startIso || trip.startDate,
        endDate: endIso || trip.endDate,
        days
      }));

      const hasMissingCoords = days.some((d) =>
        d.activities.some((a) => typeof a.lat !== 'number' || typeof a.lng !== 'number')
      );
      if (hasMissingCoords) {
        enrichItineraryDaysWithGeocoding(days, metaPatch?.defaultCenter ?? activeTrip?.defaultCenter)
          .then((enrichedDays) => {
            mutateActiveTrip((trip) => ({
              ...trip,
              days: enrichedDays
            }));
          })
          .catch(() => {});
      }
    },
    [activeTrip?.defaultCenter, mutateActiveTrip]
  );

  const addDay = useCallback(
    (title?: string, date?: string, position: 'start' | 'end' = 'end') => {
      mutateActiveTrip((trip) => {
        if (position === 'start') {
          let nextDate = date || '';
          if (!nextDate && trip.days.length > 0) {
            const first = trip.days[0].date || trip.startDate;
            if (first) {
              nextDate = addDaysIso(first, -1);
            }
          }
          if (!nextDate) {
            nextDate = trip.startDate || getLocalTodayIso(0);
          }

          const newDay: ItineraryDay = {
            id: generateId('day'),
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
          // 'end' (default)
          const nextNum = trip.days.length + 1;
          let nextDate = date || '';
          if (!nextDate && trip.days.length > 0) {
            const last = trip.days[trip.days.length - 1].date;
            if (last) {
              nextDate = addDaysIso(last, 1);
            }
          }
          if (!nextDate) {
            nextDate = trip.startDate || getLocalTodayIso(0);
          }
          const newDay: ItineraryDay = {
            id: generateId('day'),
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
      });
    },
    [mutateActiveTrip]
  );

  const addDayAtStart = useCallback(
    (title?: string, date?: string) => {
      addDay(title, date, 'start');
    },
    [addDay]
  );

  const updateDayTitle = useCallback(
    (dayId: string, title: string) => {
      mutateActiveTrip((trip) => ({
        ...trip,
        days: trip.days.map((d) => (d.id === dayId ? { ...d, title } : d))
      }));
    },
    [mutateActiveTrip]
  );

  const deleteDay = useCallback(
    (dayId: string) => {
      mutateActiveTrip((trip) => {
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
      });
    },
    [mutateActiveTrip]
  );

  const upsertActivity = useCallback(
    (dayId: string, activity: Activity) => {
      mutateActiveTrip((trip) => {
        const itemWithTime: Activity = {
          ...activity,
          updatedAt: Date.now()
        };
        return {
          ...trip,
          days: trip.days.map((d) => {
            if (d.id !== dayId) return d;
            const exists = d.activities.some((a) => a.id === activity.id);
            const nextActivities = exists
              ? d.activities.map((a) => (a.id === activity.id ? itemWithTime : a))
              : [...d.activities, itemWithTime];
            nextActivities.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
            return { ...d, activities: nextActivities };
          })
        };
      });
    },
    [mutateActiveTrip]
  );

  const toggleActivityCompleted = useCallback(
    (dayId: string, activityId: string) => {
      mutateActiveTrip((trip) => ({
        ...trip,
        days: trip.days.map((d) =>
          d.id !== dayId
            ? d
            : {
                ...d,
                activities: d.activities.map((a) =>
                  a.id === activityId
                    ? { ...a, completed: !a.completed, updatedAt: Date.now() }
                    : a
                )
              }
        )
      }));
    },
    [mutateActiveTrip]
  );

  const deleteActivity = useCallback(
    (dayId: string, activityId: string) => {
      mutateActiveTrip((trip) => ({
        ...trip,
        days: trip.days.map((d) =>
          d.id !== dayId
            ? d
            : { ...d, activities: d.activities.filter((a) => a.id !== activityId) }
        )
      }));
    },
    [mutateActiveTrip]
  );

  const moveActivity = useCallback(
    (sourceDayId: string, targetDayId: string, activityId: string, targetTime?: string) => {
      mutateActiveTrip((trip) => {
        const sourceDay = trip.days.find((d) => d.id === sourceDayId);
        const targetDay = trip.days.find((d) => d.id === targetDayId);
        if (!sourceDay || !targetDay) return trip;

        const activity = sourceDay.activities.find((a) => a.id === activityId);
        if (!activity) return trip;

        if (sourceDayId === targetDayId) {
          if (targetTime && targetTime !== activity.time) {
            const updated: Activity = { ...activity, time: targetTime, updatedAt: Date.now() };
            const nextActs = sourceDay.activities.map((a) => (a.id === activityId ? updated : a));
            nextActs.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
            return {
              ...trip,
              days: trip.days.map((d) => (d.id === sourceDayId ? { ...d, activities: nextActs } : d))
            };
          }
          return trip;
        }

        const updatedActivity: Activity = {
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

        return {
          ...trip,
          days: trip.days.map((d) => {
            if (d.id === sourceDayId) {
              return { ...d, activities: nextSourceActivities };
            }
            if (d.id === targetDayId) {
              return { ...d, activities: nextTargetActivities };
            }
            return d;
          })
        };
      });
    },
    [mutateActiveTrip]
  );

  const upsertSavedPlace = useCallback(
    (place: SavedPlace) => {
      mutateActiveTrip((trip) => {
        const itemWithTime: SavedPlace = {
          ...place,
          createdAt: place.createdAt || Date.now(),
          updatedAt: Date.now()
        };
        const list = trip.savedPlaces ?? [];
        const exists = list.some((p) => p.id === place.id);
        const nextList = exists
          ? list.map((p) => (p.id === place.id ? itemWithTime : p))
          : [itemWithTime, ...list];
        return { ...trip, savedPlaces: nextList };
      });
    },
    [mutateActiveTrip]
  );

  const toggleSavedPlaceVisited = useCallback(
    (placeId: string) => {
      mutateActiveTrip((trip) => ({
        ...trip,
        savedPlaces: (trip.savedPlaces ?? []).map((p) =>
          p.id === placeId ? { ...p, visited: !p.visited, updatedAt: Date.now() } : p
        )
      }));
    },
    [mutateActiveTrip]
  );

  const deleteSavedPlace = useCallback(
    (placeId: string) => {
      mutateActiveTrip((trip) => ({
        ...trip,
        savedPlaces: (trip.savedPlaces ?? []).filter((p) => p.id !== placeId)
      }));
    },
    [mutateActiveTrip]
  );

  const promoteSavedPlaceToDay = useCallback(
    (placeId: string, dayId: string, time = '11:00') => {
      mutateActiveTrip((trip) => {
        const place = (trip.savedPlaces ?? []).find((p) => p.id === placeId);
        if (!place) return trip;

        const newAct: Activity = {
          id: generateId('act'),
          time,
          title: place.name,
          locationName: place.areaOrAddress || '',
          lat: place.lat,
          lng: place.lng,
          googlePlaceId: place.googlePlaceId,
          mapUrl: place.customUrl,
          category: place.category,
          notes: place.notes,
          completed: Boolean(place.visited),
          photos: place.photos,
          rating: place.rating,
          userRatingCount: place.userRatingCount,
          updatedAt: Date.now()
        };

        return {
          ...trip,
          days: trip.days.map((d) => {
            if (d.id !== dayId) return d;
            const nextActivities = [...d.activities, newAct];
            nextActivities.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
            return { ...d, activities: nextActivities };
          })
        };
      });
    },
    [mutateActiveTrip]
  );

  const upsertExpense = useCallback(
    (expense: Expense) => {
      mutateActiveTrip((trip) => {
        const itemWithTime: Expense = {
          ...expense,
          updatedAt: Date.now()
        };
        const exists = trip.expenses.some((e) => e.id === expense.id);
        const nextExpenses = exists
          ? trip.expenses.map((e) => (e.id === expense.id ? itemWithTime : e))
          : [itemWithTime, ...trip.expenses];
        return { ...trip, expenses: nextExpenses };
      });
    },
    [mutateActiveTrip]
  );

  const deleteExpense = useCallback(
    (expenseId: string) => {
      mutateActiveTrip((trip) => ({
        ...trip,
        expenses: trip.expenses.filter((e) => e.id !== expenseId)
      }));
    },
    [mutateActiveTrip]
  );

  const upsertBooking = useCallback(
    (booking: Booking) => {
      mutateActiveTrip((trip) => {
        const itemWithTime: Booking = {
          ...booking,
          updatedAt: Date.now()
        };
        const exists = trip.bookings.some((b) => b.id === booking.id);
        const nextBookings = exists
          ? trip.bookings.map((b) => (b.id === booking.id ? itemWithTime : b))
          : [itemWithTime, ...trip.bookings];
        return { ...trip, bookings: nextBookings };
      });
    },
    [mutateActiveTrip]
  );

  const deleteBooking = useCallback(
    (bookingId: string) => {
      mutateActiveTrip((trip) => ({
        ...trip,
        bookings: trip.bookings.filter((b) => b.id !== bookingId)
      }));
    },
    [mutateActiveTrip]
  );

  const addChecklistItem = useCallback(
    (item: Omit<ChecklistItem, 'id'>) => {
      mutateActiveTrip((trip) => ({
        ...trip,
        checklist: [
          ...trip.checklist,
          {
            ...item,
            id: generateId('chk'),
            updatedAt: Date.now()
          }
        ]
      }));
    },
    [mutateActiveTrip]
  );

  const toggleChecklistItem = useCallback(
    (itemId: string) => {
      mutateActiveTrip((trip) => ({
        ...trip,
        checklist: trip.checklist.map((c) =>
          c.id === itemId ? { ...c, completed: !c.completed, updatedAt: Date.now() } : c
        )
      }));
    },
    [mutateActiveTrip]
  );

  const deleteChecklistItem = useCallback(
    (itemId: string) => {
      mutateActiveTrip((trip) => ({
        ...trip,
        checklist: trip.checklist.filter((c) => c.id !== itemId)
      }));
    },
    [mutateActiveTrip]
  );

  const exportActiveTripJson = useCallback(() => {
    if (!activeTrip) return;
    const blob = new Blob([JSON.stringify(activeTrip, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tripwise-${activeTrip.inviteCode.toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeTrip]);

  const importTripJson = useCallback(
    (jsonText: string): { ok: boolean; message: string } => {
      try {
        const parsed = JSON.parse(jsonText) as TripData;
        if (!parsed || !parsed.title || !Array.isArray(parsed.days)) {
          return { ok: false, message: 'Formato file non valido.' };
        }
        const uids = new Set(parsed.memberUids ?? []);
        if (user?.uid) uids.add(user.uid);
        const safeTrip: TripData = {
          ...parsed,
          id: parsed.id || generateId('trip'),
          inviteCode: parsed.inviteCode || generateInviteCode(parsed.destination || parsed.title),
          memberUids: Array.from(uids),
          updatedAt: Date.now()
        };
        setTrips((prev) => {
          const exists = prev.some((t) => t.id === safeTrip.id);
          const next = exists
            ? prev.map((t) => (t.id === safeTrip.id ? safeTrip : t))
            : [safeTrip, ...prev];
          persistTripsLocally(next);
          return next;
        });
        selectTrip(safeTrip.id);
        if (isCloudAvailable && user?.uid) {
          pushTripToCloud(safeTrip).catch(() => setSyncStatus('error'));
        }
        return { ok: true, message: `Viaggio "${safeTrip.title}" importato!` };
      } catch {
        return { ok: false, message: 'Impossibile aprire il file selezionato.' };
      }
    },
    [isCloudAvailable, persistTripsLocally, selectTrip, user?.uid]
  );

  return (
    <TripContext.Provider
      value={{
        trips,
        activeTrip,
        user,
        authLoading,
        isOnline,
        isCloudAvailable,
        syncStatus,
        colorScheme,
        setColorScheme,
        pendingInviteCode,
        dismissPendingInvite,
        joinNotification,
        clearJoinNotification,
        signInWithGoogle,
        signOut,
        selectTrip,
        createTrip,
        joinTripByCode,
        deleteTrip,
        updateTripMeta,
        updateTripDatesAndDetails,
        updateTripCoverImage,
        applyGeneratedItinerary,
        addDay,
        addDayAtStart,
        updateDayTitle,
        deleteDay,
        upsertActivity,
        toggleActivityCompleted,
        deleteActivity,
        moveActivity,
        upsertSavedPlace,
        toggleSavedPlaceVisited,
        deleteSavedPlace,
        promoteSavedPlaceToDay,
        upsertExpense,
        deleteExpense,
        upsertBooking,
        deleteBooking,
        addChecklistItem,
        toggleChecklistItem,
        deleteChecklistItem,
        exportActiveTripJson,
        importTripJson
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export function useTrip() {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used inside TripProvider');
  return ctx;
}
