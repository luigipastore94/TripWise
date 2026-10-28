import {
  doc,
  setDoc,
  onSnapshot,
  increment,
  type Unsubscribe
} from 'firebase/firestore';
import { initFirestoreInstance, initAuthInstance, isCloudReady } from './firebase';

export const DAILY_GOOGLE_QUOTA_LIMIT = 300;

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getStorageKey(dateStr: string): string {
  return `tripwise_shared_quota_${dateStr}`;
}

export interface QuotaStatus {
  count: number;
  limit: number;
  remaining: number;
  isExceeded: boolean;
  date: string;
}

/**
 * Returns current known usage for today (local cache + synced from Firestore).
 */
export function getDailyQuotaStatus(): QuotaStatus {
  const dateStr = getTodayDateString();
  let count = 0;
  try {
    const raw = localStorage.getItem(getStorageKey(dateStr));
    count = raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    count = 0;
  }

  const limit = DAILY_GOOGLE_QUOTA_LIMIT;
  const isExceeded = count >= limit;
  const remaining = Math.max(0, limit - count);

  return {
    count,
    limit,
    remaining,
    isExceeded,
    date: dateStr
  };
}

/**
 * Checks if Google Maps API calls are currently permitted today under the 300-call limit.
 */
export function canUseGoogleMapsToday(): boolean {
  return !getDailyQuotaStatus().isExceeded;
}

function notifyQuotaChanged(status: QuotaStatus) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('tripwise:quota_changed', {
        detail: status
      })
    );
  }
}

/**
 * Increments the daily Google Maps usage counter across all collaborating devices.
 * 1. Optimistically updates local cache in 0ms.
 * 2. Asynchronously synchronizes with Firestore using atomic increment(1).
 */
export async function recordGoogleMapsUsage(): Promise<QuotaStatus> {
  const dateStr = getTodayDateString();
  const storageKey = getStorageKey(dateStr);

  let currentCount = 0;
  try {
    const raw = localStorage.getItem(storageKey);
    currentCount = raw ? parseInt(raw, 10) || 0 : 0;
  } catch {
    currentCount = 0;
  }

  const nextCount = currentCount + 1;
  try {
    localStorage.setItem(storageKey, String(nextCount));
  } catch {
    // LocalStorage quota or private mode fallback
  }

  const status: QuotaStatus = {
    count: nextCount,
    limit: DAILY_GOOGLE_QUOTA_LIMIT,
    remaining: Math.max(0, DAILY_GOOGLE_QUOTA_LIMIT - nextCount),
    isExceeded: nextCount >= DAILY_GOOGLE_QUOTA_LIMIT,
    date: dateStr
  };

  notifyQuotaChanged(status);

  // Sync to Firestore if authenticated & cloud ready
  if (isCloudReady()) {
    try {
      const db = initFirestoreInstance();
      const auth = initAuthInstance();
      if (db && auth?.currentUser) {
        const quotaRef = doc(db, 'daily_quotas', dateStr);
        await setDoc(
          quotaRef,
          {
            count: increment(1),
            updatedAt: Date.now()
          },
          { merge: true }
        );
      }
    } catch {
      // Offline or network error: local optimistic count remains authoritative
    }
  }

  return status;
}

/**
 * Real-time listener for the shared daily quota document in Firestore.
 * Updates local cache whenever any travel companion makes a Google Maps search.
 */
export function subscribeToDailyQuota(onChange?: (status: QuotaStatus) => void): Unsubscribe {
  const dateStr = getTodayDateString();
  const storageKey = getStorageKey(dateStr);

  const handleCustomEvent = (e: Event) => {
    const custom = e as CustomEvent<QuotaStatus>;
    if (custom.detail && onChange) {
      onChange(custom.detail);
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('tripwise:quota_changed', handleCustomEvent);
  }

  let firestoreUnsub: Unsubscribe = () => {};

  if (isCloudReady()) {
    const db = initFirestoreInstance();
    const auth = initAuthInstance();
    if (db && auth?.currentUser) {
      try {
        const quotaRef = doc(db, 'daily_quotas', dateStr);
        firestoreUnsub = onSnapshot(
          quotaRef,
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              const cloudCount = typeof data?.count === 'number' ? data.count : 0;

              let localCount = 0;
              try {
                const raw = localStorage.getItem(storageKey);
                localCount = raw ? parseInt(raw, 10) || 0 : 0;
              } catch {
                localCount = 0;
              }

              const resolvedCount = Math.max(localCount, cloudCount);
              try {
                localStorage.setItem(storageKey, String(resolvedCount));
              } catch {
                // Ignore
              }

              const status: QuotaStatus = {
                count: resolvedCount,
                limit: DAILY_GOOGLE_QUOTA_LIMIT,
                remaining: Math.max(0, DAILY_GOOGLE_QUOTA_LIMIT - resolvedCount),
                isExceeded: resolvedCount >= DAILY_GOOGLE_QUOTA_LIMIT,
                date: dateStr
              };

              notifyQuotaChanged(status);
              onChange?.(status);
            }
          },
          () => {
            // Firestore error or permissions issue: rely on local count
          }
        );
      } catch {
        // Fallback
      }
    }
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('tripwise:quota_changed', handleCustomEvent);
    }
    firestoreUnsub();
  };
}
