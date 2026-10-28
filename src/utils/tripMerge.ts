import type {
  TripData,
  ItineraryDay,
  Activity,
  SavedPlace,
  Expense,
  Booking,
  ChecklistItem,
  Member
} from '../types/trip';

export type IdentifiableWithTimestamp = {
  id: string;
  updatedAt?: number;
};

/**
 * Structural deep equality comparison for JSON-compatible structures.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key)) return false;
    if (!deepEqual(objA[key], objB[key])) return false;
  }
  return true;
}

/**
 * Compare two items semantically, ignoring their updatedAt timestamp.
 */
export function dataEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  const { updatedAt: _uA, ...restA } = a as Record<string, unknown>;
  const { updatedAt: _uB, ...restB } = b as Record<string, unknown>;
  return deepEqual(restA, restB);
}

/**
 * Resolve conflict between local and remote version of the same item.
 * Cites Tesler's Law & Postel's Law: picks the version with the most recent explicit timestamp,
 * or merges complementary properties without throwing.
 */
function resolveItemConflict<T extends IdentifiableWithTimestamp>(localItem: T, remoteItem: T): T {
  if (dataEqual(localItem, remoteItem)) {
    const localTime = localItem.updatedAt || 0;
    const remoteTime = remoteItem.updatedAt || 0;
    return remoteTime >= localTime ? remoteItem : localItem;
  }

  const localTime = localItem.updatedAt || 0;
  const remoteTime = remoteItem.updatedAt || 0;

  if (localTime > remoteTime) {
    return localItem;
  }
  if (remoteTime > localTime) {
    return remoteItem;
  }

  // If timestamps are equal or missing, prefer remote but preserve local non-empty fields if remote is empty
  const merged: Record<string, unknown> = { ...remoteItem };
  for (const [k, v] of Object.entries(localItem)) {
    if (merged[k] === undefined || merged[k] === null || merged[k] === '') {
      merged[k] = v;
    }
  }
  return merged as T;
}

/**
 * 3-Way Merge for arrays of identifiable items (checklist, expenses, bookings, savedPlaces, activities).
 * - Distinguishes additions from deletions using baseList.
 * - Prevents resurrection of deleted items while preserving concurrent new items.
 * - Falls back to safe union merge if baseList is unavailable.
 */
export function mergeEntityLists<T extends IdentifiableWithTimestamp>(
  baseList: T[] | undefined,
  localList: T[] = [],
  remoteList: T[] = []
): T[] {
  // 2-Way fallback when base snapshot is missing
  if (!baseList) {
    const localMap = new Map(localList.map((item) => [item.id, item]));
    const result: T[] = [];
    const seenIds = new Set<string>();

    for (const remoteItem of remoteList) {
      seenIds.add(remoteItem.id);
      const localItem = localMap.get(remoteItem.id);
      if (!localItem) {
        result.push(remoteItem);
      } else {
        result.push(resolveItemConflict(localItem, remoteItem));
      }
    }

    for (const localItem of localList) {
      if (!seenIds.has(localItem.id)) {
        seenIds.add(localItem.id);
        result.push(localItem);
      }
    }
    return result;
  }

  // 3-Way Merge
  const baseMap = new Map(baseList.map((item) => [item.id, item]));
  const localMap = new Map(localList.map((item) => [item.id, item]));

  const result: T[] = [];
  const processedIds = new Set<string>();

  // 1. Process items in remoteList
  for (const remoteItem of remoteList) {
    const id = remoteItem.id;
    processedIds.add(id);

    const baseItem = baseMap.get(id);
    const localItem = localMap.get(id);

    if (!baseItem) {
      // Item was added after base
      if (!localItem) {
        // Added remotely only
        result.push(remoteItem);
      } else {
        // Added concurrently by both
        result.push(resolveItemConflict(localItem, remoteItem));
      }
    } else {
      // Item existed in base
      if (!localItem) {
        // Item was deleted locally!
        const remoteModified = !dataEqual(baseItem, remoteItem);
        const remoteTime = remoteItem.updatedAt || 0;
        const baseTime = baseItem.updatedAt || 0;
        if (remoteModified && remoteTime > baseTime) {
          // Remote concurrently edited the item that local deleted: keep remote edit to avoid data loss
          result.push(remoteItem);
        } else {
          // Local deleted it, remote didn't modify it: honor deletion
        }
      } else {
        // Exists in base, local, and remote
        const localChanged = !dataEqual(baseItem, localItem);
        const remoteChanged = !dataEqual(baseItem, remoteItem);

        if (!localChanged && !remoteChanged) {
          result.push(remoteItem);
        } else if (localChanged && !remoteChanged) {
          result.push(localItem);
        } else if (!localChanged && remoteChanged) {
          result.push(remoteItem);
        } else {
          // Both changed: resolve item conflict
          result.push(resolveItemConflict(localItem, remoteItem));
        }
      }
    }
  }

  // 2. Process items in localList that were not in remoteList
  for (const localItem of localList) {
    const id = localItem.id;
    if (processedIds.has(id)) continue;
    processedIds.add(id);

    const baseItem = baseMap.get(id);
    if (!baseItem) {
      // Added locally, not in base or remote -> keep!
      result.push(localItem);
    } else {
      // In base and in local, but missing in remote -> remote deleted it!
      const localChanged = !dataEqual(baseItem, localItem);
      const localTime = localItem.updatedAt || 0;
      const baseTime = baseItem.updatedAt || 0;
      if (localChanged && localTime > baseTime) {
        // Locally edited after base -> keep to prevent loss
        result.push(localItem);
      } else {
        // Remote deleted it and local didn't modify -> honor remote deletion
      }
    }
  }

  return result;
}

/**
 * Merge itinerary days and their nested activities.
 */
export function mergeItineraryDays(
  baseDays: ItineraryDay[] | undefined,
  localDays: ItineraryDay[] = [],
  remoteDays: ItineraryDay[] = []
): ItineraryDay[] {
  const baseMap = new Map((baseDays || []).map((d) => [d.id, d]));
  const localMap = new Map(localDays.map((d) => [d.id, d]));

  const baseByDate = new Map((baseDays || []).filter((d) => d.date).map((d) => [d.date, d]));
  const localByDate = new Map(localDays.filter((d) => d.date).map((d) => [d.date, d]));
  const remoteByDate = new Map(remoteDays.filter((d) => d.date).map((d) => [d.date, d]));

  const resultDays: ItineraryDay[] = [];
  const processedDayIds = new Set<string>();

  for (const remoteDay of remoteDays) {
    processedDayIds.add(remoteDay.id);
    const baseDay =
      baseMap.get(remoteDay.id) || (remoteDay.date ? baseByDate.get(remoteDay.date) : undefined);
    const localDay =
      localMap.get(remoteDay.id) || (remoteDay.date ? localByDate.get(remoteDay.date) : undefined);

    if (!localDay) {
      if (!baseDay) {
        // Added remotely
        resultDays.push(remoteDay);
      } else {
        // Was in base, missing in local. Check if remote modified activities
        const baseActs = baseDay.activities || [];
        const remoteActs = remoteDay.activities || [];
        if (!dataEqual(baseActs, remoteActs)) {
          resultDays.push(remoteDay);
        }
      }
    } else {
      // Day present in both local and remote
      const baseActivities = baseDay?.activities || [];
      const mergedActivities = mergeEntityLists<Activity>(
        baseActivities,
        localDay.activities || [],
        remoteDay.activities || []
      );
      mergedActivities.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));

      let finalTitle = remoteDay.title;
      if (baseDay) {
        const localTitleChanged = localDay.title !== baseDay.title;
        const remoteTitleChanged = remoteDay.title !== baseDay.title;
        if (localTitleChanged && !remoteTitleChanged) {
          finalTitle = localDay.title;
        }
      }

      resultDays.push({
        ...remoteDay,
        id: localDay.id || remoteDay.id,
        title: finalTitle,
        activities: mergedActivities
      });
    }
  }

  for (const localDay of localDays) {
    if (processedDayIds.has(localDay.id)) continue;
    if (localDay.date && remoteByDate.has(localDay.date)) continue;

    processedDayIds.add(localDay.id);
    const baseDay =
      baseMap.get(localDay.id) || (localDay.date ? baseByDate.get(localDay.date) : undefined);

    if (!baseDay) {
      resultDays.push(localDay);
    } else {
      if (!dataEqual(baseDay.activities, localDay.activities)) {
        resultDays.push(localDay);
      }
    }
  }

  resultDays.sort((a, b) => {
    if (a.date && b.date) {
      return a.date.localeCompare(b.date);
    }
    return (a.dayNumber || 0) - (b.dayNumber || 0);
  });

  return resultDays.map((d, idx) => ({
    ...d,
    dayNumber: idx + 1
  }));
}

export interface MergeTripsResult {
  merged: TripData;
  hasLocalChanges: boolean;
}

/**
 * Full 3-Way Trip Merge.
 * Cites Jakob's Law & Tesler's Law: guarantees concurrent collaborator edits
 * on different sections (expenses, checklist, itinerary) never overwrite each other.
 */
export function mergeTrips(
  baseTrip: TripData | null | undefined,
  localTrip: TripData,
  remoteTrip: TripData
): MergeTripsResult {
  if (deepEqual(localTrip, remoteTrip)) {
    return { merged: remoteTrip, hasLocalChanges: false };
  }

  const metadataKeys: Array<
    keyof Pick<
      TripData,
      | 'title'
      | 'destination'
      | 'emoji'
      | 'coverImage'
      | 'startDate'
      | 'endDate'
      | 'baseCurrency'
      | 'destinationCurrency'
      | 'exchangeRate'
      | 'defaultCenter'
    >
  > = [
    'title',
    'destination',
    'emoji',
    'coverImage',
    'startDate',
    'endDate',
    'baseCurrency',
    'destinationCurrency',
    'exchangeRate',
    'defaultCenter'
  ];

  const mergedMeta: Partial<TripData> = {};

  for (const key of metadataKeys) {
    const baseVal = baseTrip ? baseTrip[key] : undefined;
    const localVal = localTrip[key];
    const remoteVal = remoteTrip[key];

    if (baseTrip) {
      const localChanged = !deepEqual(baseVal, localVal);
      const remoteChanged = !deepEqual(baseVal, remoteVal);

      if (localChanged && !remoteChanged) {
        mergedMeta[key] = localVal as never;
      } else if (!localChanged && remoteChanged) {
        mergedMeta[key] = remoteVal as never;
      } else if (localChanged && remoteChanged) {
        mergedMeta[key] = (localTrip.updatedAt > remoteTrip.updatedAt ? localVal : remoteVal) as never;
      } else {
        mergedMeta[key] = remoteVal as never;
      }
    } else {
      mergedMeta[key] = (localTrip.updatedAt > remoteTrip.updatedAt ? localVal : remoteVal) as never;
    }
  }

  // Merge memberUids (union of all collaborating Firebase UIDs)
  const allUids = new Set<string>([
    ...(remoteTrip.memberUids || []),
    ...(localTrip.memberUids || []),
    ...(baseTrip?.memberUids || [])
  ]);
  const mergedMemberUids = Array.from(allUids);

  // Merge entities
  const mergedMembers = mergeEntityLists<Member>(
    baseTrip?.members,
    localTrip.members || [],
    remoteTrip.members || []
  );
  const mergedDays = mergeItineraryDays(baseTrip?.days, localTrip.days || [], remoteTrip.days || []);
  const mergedExpenses = mergeEntityLists<Expense>(
    baseTrip?.expenses,
    localTrip.expenses || [],
    remoteTrip.expenses || []
  );
  const mergedBookings = mergeEntityLists<Booking>(
    baseTrip?.bookings,
    localTrip.bookings || [],
    remoteTrip.bookings || []
  );
  const mergedChecklist = mergeEntityLists<ChecklistItem>(
    baseTrip?.checklist,
    localTrip.checklist || [],
    remoteTrip.checklist || []
  );
  const mergedSavedPlaces = mergeEntityLists<SavedPlace>(
    baseTrip?.savedPlaces,
    localTrip.savedPlaces || [],
    remoteTrip.savedPlaces || []
  );

  // Check if merged result contains changes that are NOT yet in remoteTrip
  const isIdenticalToRemote =
    deepEqual(remoteTrip.title, mergedMeta.title ?? remoteTrip.title) &&
    deepEqual(remoteTrip.destination, mergedMeta.destination ?? remoteTrip.destination) &&
    deepEqual(remoteTrip.emoji, mergedMeta.emoji ?? remoteTrip.emoji) &&
    deepEqual(remoteTrip.coverImage, mergedMeta.coverImage) &&
    deepEqual(remoteTrip.startDate, mergedMeta.startDate ?? remoteTrip.startDate) &&
    deepEqual(remoteTrip.endDate, mergedMeta.endDate ?? remoteTrip.endDate) &&
    deepEqual(remoteTrip.baseCurrency, mergedMeta.baseCurrency ?? remoteTrip.baseCurrency) &&
    deepEqual(
      remoteTrip.destinationCurrency,
      mergedMeta.destinationCurrency ?? remoteTrip.destinationCurrency
    ) &&
    deepEqual(remoteTrip.exchangeRate, mergedMeta.exchangeRate ?? remoteTrip.exchangeRate) &&
    deepEqual(remoteTrip.defaultCenter, mergedMeta.defaultCenter ?? remoteTrip.defaultCenter) &&
    deepEqual(remoteTrip.memberUids || [], mergedMemberUids) &&
    deepEqual(remoteTrip.members || [], mergedMembers) &&
    deepEqual(remoteTrip.days || [], mergedDays) &&
    deepEqual(remoteTrip.expenses || [], mergedExpenses) &&
    deepEqual(remoteTrip.bookings || [], mergedBookings) &&
    deepEqual(remoteTrip.checklist || [], mergedChecklist) &&
    deepEqual(remoteTrip.savedPlaces || [], mergedSavedPlaces);

  const hasLocalChanges = !isIdenticalToRemote;

  const mergedUpdatedAt = hasLocalChanges
    ? Math.max(Date.now(), remoteTrip.updatedAt + 1)
    : remoteTrip.updatedAt;

  const merged: TripData = {
    ...remoteTrip,
    id: localTrip.id || remoteTrip.id,
    inviteCode: remoteTrip.inviteCode || localTrip.inviteCode,
    title: (mergedMeta.title ?? remoteTrip.title) as string,
    destination: (mergedMeta.destination ?? remoteTrip.destination) as string,
    emoji: (mergedMeta.emoji ?? remoteTrip.emoji) as string,
    startDate: (mergedMeta.startDate ?? remoteTrip.startDate) as string,
    endDate: (mergedMeta.endDate ?? remoteTrip.endDate) as string,
    baseCurrency: (mergedMeta.baseCurrency ?? remoteTrip.baseCurrency) as string,
    destinationCurrency: (mergedMeta.destinationCurrency ?? remoteTrip.destinationCurrency) as string,
    exchangeRate: (mergedMeta.exchangeRate ?? remoteTrip.exchangeRate) as number,
    defaultCenter: (mergedMeta.defaultCenter ?? remoteTrip.defaultCenter) as [number, number],
    memberUids: mergedMemberUids,
    members: mergedMembers,
    days: mergedDays,
    expenses: mergedExpenses,
    bookings: mergedBookings,
    checklist: mergedChecklist,
    savedPlaces: mergedSavedPlaces,
    updatedAt: mergedUpdatedAt
  };

  if (mergedMeta.coverImage) {
    merged.coverImage = mergedMeta.coverImage;
  } else {
    delete merged.coverImage;
  }

  return {
    merged,
    hasLocalChanges
  };
}
