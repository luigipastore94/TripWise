import type { Expense } from '../types/trip';

export type SyncStatusValue = 'local' | 'synced' | 'syncing' | 'offline-cached' | 'error';

export interface CloudSnapshotMeta {
  fromCache: boolean;
  hasPendingWrites: boolean;
  pendingDocIds: string[];
}

export interface SyncStatusInputs {
  isCloudAvailable: boolean;
  hasUser: boolean;
  isOnline: boolean;
  syncError: boolean;
  inFlightCloudOps: number;
  parentSnapInitialized: boolean;
  parentFromCache: boolean;
  parentHasPendingWrites: boolean;
  pendingExpenseCount: number;
}

/**
 * Pure state machine for cloud sync status.
 * Guarantees 'synced' is returned ONLY when authenticated, online, error-free,
 * zero in-flight operations, server-verified snapshot (!fromCache), and zero pending writes.
 */
export function deriveTruthfulSyncStatus(inputs: SyncStatusInputs): SyncStatusValue {
  if (!inputs.isCloudAvailable || !inputs.hasUser) {
    return 'local';
  }
  if (!inputs.isOnline) {
    return 'offline-cached';
  }
  if (inputs.syncError) {
    return 'error';
  }
  if (
    inputs.inFlightCloudOps > 0 ||
    inputs.parentHasPendingWrites ||
    inputs.pendingExpenseCount > 0 ||
    !inputs.parentSnapInitialized
  ) {
    return 'syncing';
  }
  if (inputs.parentFromCache) {
    return 'offline-cached';
  }
  return 'synced';
}

export function sanitizeExpenseId(rawId: string): string {
  const cleaned = (rawId || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100);
  return cleaned || `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Sanitizes an Expense object to strictly conform to /trips/{inviteCode}/expenses/{expenseId}
 * Firestore Security Rules (`isValidExpenseData`).
 */
export function sanitizeExpenseForCloud(expense: Expense): Expense & { updatedAt: number } {
  const safeId = sanitizeExpenseId(expense.id);
  const safeTitle = (expense.title || 'Spesa').trim().slice(0, 200) || 'Spesa';
  const safeAmount =
    typeof expense.amount === 'number' && Number.isFinite(expense.amount) && expense.amount >= 0
      ? Math.min(expense.amount, 1_000_000_000)
      : 0;
  const safeAmountInBase =
    typeof expense.amountInBase === 'number' &&
    Number.isFinite(expense.amountInBase) &&
    expense.amountInBase >= 0
      ? Math.min(expense.amountInBase, 1_000_000_000)
      : 0;
  const safeCurrency = (expense.currency || 'EUR').trim().toUpperCase().slice(0, 10) || 'EUR';
  const safePaidBy =
    typeof expense.paidByMemberId === 'string' ? expense.paidByMemberId.slice(0, 100) : '';
  const safeSplit = Array.isArray(expense.splitBetweenMemberIds)
    ? expense.splitBetweenMemberIds
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.slice(0, 100))
        .slice(0, 50)
    : [];
  const safeCategory = ((expense.category || 'other').slice(0, 40) || 'other') as Expense['category'];
  const safeDate = typeof expense.date === 'string' ? expense.date.slice(0, 30) : '';
  const safeUpdatedAt =
    typeof expense.updatedAt === 'number' &&
    Number.isFinite(expense.updatedAt) &&
    expense.updatedAt > 0
      ? Math.min(Math.floor(expense.updatedAt), 99_999_999_999_999)
      : Date.now();

  const sanitized: Expense & { updatedAt: number } = {
    id: safeId,
    title: safeTitle,
    amount: safeAmount,
    currency: safeCurrency,
    amountInBase: safeAmountInBase,
    paidByMemberId: safePaidBy,
    splitBetweenMemberIds: safeSplit,
    category: safeCategory,
    date: safeDate,
    updatedAt: safeUpdatedAt
  };

  if (typeof expense.notes === 'string' && expense.notes.trim().length > 0) {
    sanitized.notes = expense.notes.trim().slice(0, 2000);
  }

  return sanitized;
}

export function sortExpensesDeterministically(expenses: Expense[]): Expense[] {
  return [...expenses].sort((a, b) => {
    const dateCmp = (b.date || '').localeCompare(a.date || '');
    if (dateCmp !== 0) return dateCmp;
    const timeDiff = (b.updatedAt || 0) - (a.updatedAt || 0);
    if (timeDiff !== 0) return timeDiff;
    return b.id.localeCompare(a.id);
  });
}

export function mergeExpenseCollections(
  primarySubcollection: Expense[],
  legacyParent: Expense[] = []
): Expense[] {
  const byId = new Map<string, Expense>();
  for (const leg of legacyParent) {
    if (leg?.id) {
      byId.set(leg.id, leg);
    }
  }
  for (const sub of primarySubcollection) {
    if (!sub?.id) continue;
    const existing = byId.get(sub.id);
    if (!existing || (sub.updatedAt || 0) >= (existing.updatedAt || 0)) {
      byId.set(sub.id, sub);
    }
  }
  return sortExpensesDeterministically(Array.from(byId.values()));
}

export interface ReconcileSubcollectionInput {
  currentLocalExpenses: Expense[];
  remoteSubcollectionExpenses: Expense[];
  meta: CloudSnapshotMeta;
  knownCloudIds: Set<string>;
  pendingLocalUpserts: Map<string, Expense>;
  locallyDeletedIds: Set<string>;
}

export interface ReconcileSubcollectionResult {
  reconciledExpenses: Expense[];
  nextKnownCloudIds: Set<string>;
  knownCloudIdsChanged: boolean;
  unpushedLocalExpenses: Expense[];
  confirmedUpsertIds: string[];
  confirmedDeletedIds: string[];
}

/**
 * Reconciles a `/trips/{inviteCode}/expenses` snapshot against local trip expenses:
 * - Honors remote collaborator additions, edits, and deletions instantaneously.
 * - Preserves unconfirmed local upserts (`pendingLocalUpserts`) and local offline expenses
 *   never yet confirmed in `knownCloudIds` (returning them in `unpushedLocalExpenses` once `!meta.fromCache`).
 * - Prevents premature deletions while `meta.fromCache === true` (e.g. cold cache before server stream).
 */
export function reconcileSubcollectionSnapshot(
  input: ReconcileSubcollectionInput
): ReconcileSubcollectionResult {
  const {
    currentLocalExpenses,
    remoteSubcollectionExpenses,
    meta,
    knownCloudIds,
    pendingLocalUpserts,
    locallyDeletedIds
  } = input;

  const pendingDocSet = new Set(meta.pendingDocIds);
  const remoteMap = new Map<string, Expense>();
  for (const exp of remoteSubcollectionExpenses) {
    if (exp?.id && !locallyDeletedIds.has(exp.id)) {
      remoteMap.set(exp.id, exp);
    }
  }

  // Case 1: Cached snapshot before server handshake — merge conservatively without pruning or mutating knownCloudIds
  if (meta.fromCache) {
    const byId = new Map<string, Expense>(remoteMap);
    for (const [id, pendingExp] of pendingLocalUpserts.entries()) {
      if (locallyDeletedIds.has(id)) continue;
      const existing = byId.get(id);
      if (!existing || (pendingExp.updatedAt || 0) >= (existing.updatedAt || 0)) {
        byId.set(id, pendingExp);
      }
    }
    for (const loc of currentLocalExpenses) {
      if (!loc?.id || locallyDeletedIds.has(loc.id)) continue;
      if (!byId.has(loc.id)) {
        byId.set(loc.id, loc);
      }
    }
    return {
      reconciledExpenses: sortExpensesDeterministically(Array.from(byId.values())),
      nextKnownCloudIds: new Set(knownCloudIds),
      knownCloudIdsChanged: false,
      unpushedLocalExpenses: [],
      confirmedUpsertIds: [],
      confirmedDeletedIds: []
    };
  }

  // Case 2: Server-backed snapshot (!meta.fromCache)
  const byId = new Map<string, Expense>(remoteMap);
  const nextKnownCloudIds = new Set<string>();
  const confirmedUpsertIds: string[] = [];
  const confirmedDeletedIds: string[] = [];
  const unpushedLocalExpenses: Expense[] = [];

  for (const exp of remoteSubcollectionExpenses) {
    if (exp?.id && !pendingDocSet.has(exp.id)) {
      nextKnownCloudIds.add(exp.id);
    }
  }
  // Keep pendingDocSet IDs that were already known on cloud (e.g. local edit of an existing cloud expense)
  for (const pendingId of pendingDocSet) {
    if (knownCloudIds.has(pendingId)) {
      nextKnownCloudIds.add(pendingId);
    }
  }

  // Overlay in-flight local upserts and check which ones are now server-confirmed
  for (const [id, pendingExp] of pendingLocalUpserts.entries()) {
    if (locallyDeletedIds.has(id)) continue;
    const remoteExp = remoteMap.get(id);
    if (
      remoteExp &&
      !pendingDocSet.has(id) &&
      (remoteExp.updatedAt || 0) >= (pendingExp.updatedAt || 0)
    ) {
      confirmedUpsertIds.push(id);
      byId.set(id, remoteExp);
    } else if (!remoteExp || (pendingExp.updatedAt || 0) >= (remoteExp.updatedAt || 0)) {
      byId.set(id, pendingExp);
    }
  }

  // Inspect local expenses missing from remote subcollection
  for (const loc of currentLocalExpenses) {
    if (!loc?.id || locallyDeletedIds.has(loc.id) || byId.has(loc.id)) continue;

    if (knownCloudIds.has(loc.id)) {
      // Previously confirmed in cloud subcollection and now absent from verified server snapshot -> remote deletion!
      continue;
    }

    // Never confirmed in cloud subcollection -> preserve locally and queue push to subcollection
    byId.set(loc.id, loc);
    if (!pendingLocalUpserts.has(loc.id)) {
      unpushedLocalExpenses.push(loc);
    }
  }

  // Clear tombstones once confirmed absent on the server
  const rawRemoteIds = new Set(remoteSubcollectionExpenses.map((e) => e.id));
  for (const delId of locallyDeletedIds) {
    if (!rawRemoteIds.has(delId)) {
      confirmedDeletedIds.push(delId);
    }
  }

  let knownCloudIdsChanged = nextKnownCloudIds.size !== knownCloudIds.size;
  if (!knownCloudIdsChanged) {
    for (const id of nextKnownCloudIds) {
      if (!knownCloudIds.has(id)) {
        knownCloudIdsChanged = true;
        break;
      }
    }
  }

  return {
    reconciledExpenses: sortExpensesDeterministically(Array.from(byId.values())),
    nextKnownCloudIds,
    knownCloudIdsChanged,
    unpushedLocalExpenses,
    confirmedUpsertIds,
    confirmedDeletedIds
  };
}
