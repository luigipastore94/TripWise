import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type Auth
} from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  deleteField,
  type Firestore,
  type Unsubscribe
} from 'firebase/firestore';
import type { TripData, UserProfile } from '../types/trip';
import { MEMBER_COLORS } from '../data/presets';

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let firebaseAuth: Auth | null = null;

function getEnvFirebaseConfig() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
  if (!apiKey || !projectId) return null;

  return {
    apiKey: apiKey.trim(),
    authDomain:
      (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined)?.trim() ||
      `${projectId.trim()}.firebaseapp.com`,
    projectId: projectId.trim(),
    storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined)?.trim(),
    messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined)?.trim(),
    appId: (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined)?.trim()
  };
}

export function isCloudReady(): boolean {
  return getEnvFirebaseConfig() !== null;
}

function ensureFirebaseApp(): FirebaseApp | null {
  if (firebaseApp) return firebaseApp;
  const cfg = getEnvFirebaseConfig();
  if (!cfg) return null;
  const existing = getApps();
  firebaseApp = existing.length > 0 ? existing[0] : initializeApp(cfg);
  return firebaseApp;
}

export function initAuthInstance(): Auth | null {
  if (firebaseAuth) return firebaseAuth;
  const app = ensureFirebaseApp();
  if (!app) return null;
  firebaseAuth = getAuth(app);
  return firebaseAuth;
}

export function initFirestoreInstance(): Firestore | null {
  if (firestoreDb) return firestoreDb;
  const app = ensureFirebaseApp();
  if (!app) return null;

  try {
    firestoreDb = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
    return firestoreDb;
  } catch {
    return null;
  }
}

export async function signInWithGoogleAccount(): Promise<{
  ok: boolean;
  user?: UserProfile;
  redirected?: boolean;
  errorMessage?: string;
}> {
  const auth = initAuthInstance();
  if (!auth) {
    return {
      ok: false,
      errorMessage:
        'Il collegamento all’account Google non è ancora attivo in questo ambiente. Puoi continuare subito a usare TripWise e attivare l’accesso Google in qualsiasi momento.'
    };
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    const u = result.user;
    return {
      ok: true,
      user: {
        uid: u.uid,
        displayName: u.displayName || u.email?.split('@')[0] || 'Viaggiatore',
        email: u.email,
        photoURL: u.photoURL
      }
    };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      try {
        await signInWithRedirect(auth, provider);
        return { ok: true, redirected: true };
      } catch {
        return {
          ok: false,
          errorMessage: 'Impossibile completare l’accesso con Google in questo browser.'
        };
      }
    }
    if (code === 'auth/popup-closed-by-user') {
      return { ok: false, errorMessage: 'Accesso annullato.' };
    }
    if (code === 'auth/unauthorized-domain') {
      return {
        ok: false,
        errorMessage: 'Dominio non ancora autorizzato per il login Google.'
      };
    }
    return {
      ok: false,
      errorMessage: 'Impossibile completare l’accesso con Google in questo momento.'
    };
  }
}

export async function signOutAccount(): Promise<void> {
  const auth = initAuthInstance();
  if (auth) {
    await firebaseSignOut(auth);
  }
}

let redirectCheckInitiated = false;

export function subscribeToAuthChanges(
  callback: (user: UserProfile | null) => void
): Unsubscribe | null {
  const auth = initAuthInstance();
  if (!auth) return null;

  // Handle redirect sign-in resolution on mobile platforms once on startup
  if (!redirectCheckInitiated) {
    redirectCheckInitiated = true;
    getRedirectResult(auth)
      .then((res) => {
        if (res?.user) {
          const u = res.user;
          callback({
            uid: u.uid,
            displayName: u.displayName || u.email?.split('@')[0] || 'Viaggiatore',
            email: u.email,
            photoURL: u.photoURL
          });
        }
      })
      .catch((err) => {
        console.warn('Redirect sign-in resolution:', err);
      });
  }

  return onAuthStateChanged(auth, (u) => {
    if (u) {
      callback({
        uid: u.uid,
        displayName: u.displayName || u.email?.split('@')[0] || 'Viaggiatore',
        email: u.email,
        photoURL: u.photoURL
      });
    } else {
      callback(null);
    }
  });
}

export function normalizeInviteCode(code: string): string {
  if (!code) return '';
  let cleaned = code.trim();
  // Extract ?join=... or &join=... if user pasted a full URL
  const urlMatch = cleaned.match(/[?&]join=([a-zA-Z0-9-]+)/i);
  if (urlMatch && urlMatch[1]) {
    cleaned = urlMatch[1];
  } else {
    // If the string contains a TW-XXXX-XXXX token within WhatsApp text or sentence
    const codeMatch = cleaned.match(/\b(TW-[A-Za-z0-9]+-[A-Za-z0-9]+)\b/i);
    if (codeMatch && codeMatch[1]) {
      cleaned = codeMatch[1];
    }
  }
  return cleaned
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '');
}

/**
 * Atomically joins a companion to a shared cloud trip document using updateDoc.
 * Modifies ONLY memberUids, members, and updatedAt so that Firestore security rules
 * (isAuthorizedCompanionJoin) see affectedKeys() matching exactly ['memberUids', 'members', 'updatedAt'].
 */
export async function joinCloudTrip(
  inviteCode: string,
  user: UserProfile
): Promise<TripData | null> {
  const db = initFirestoreInstance();
  if (!db) throw new Error('Servizio cloud non disponibile');
  const code = normalizeInviteCode(inviteCode);
  if (!code) throw new Error('Codice invito non valido');

  const ref = doc(db, 'trips', code);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const remote = snap.data() as TripData;

  const currentUids: string[] = Array.isArray(remote.memberUids) ? remote.memberUids : [];
  const currentMembers = Array.isArray(remote.members) ? remote.members : [];

  const isAlreadyMember = currentUids.includes(user.uid);
  const updatedUids = isAlreadyMember ? currentUids : [...currentUids, user.uid];

  let updatedMembers = [...currentMembers];
  const existingMember = updatedMembers.find(
    (m) => m.uid === user.uid || (user.displayName && m.name === user.displayName)
  );
  if (!existingMember) {
    const memberColor = MEMBER_COLORS[updatedMembers.length % MEMBER_COLORS.length];
    updatedMembers.push({
      id: `mem_${Date.now().toString(36)}`,
      name: user.displayName || 'Compagno',
      color: memberColor,
      uid: user.uid,
      photoURL: user.photoURL || undefined,
      updatedAt: Date.now()
    });
  }

  const now = Date.now();
  if (!isAlreadyMember || updatedMembers.length !== currentMembers.length) {
    await updateDoc(ref, {
      memberUids: updatedUids,
      members: updatedMembers,
      updatedAt: now
    });
  }

  return {
    ...remote,
    memberUids: updatedUids,
    members: updatedMembers,
    updatedAt: now
  };
}

export async function pushTripToCloud(trip: TripData): Promise<void> {
  const db = initFirestoreInstance();
  if (!db) return;
  const code = normalizeInviteCode(trip.inviteCode);
  if (!code) return;
  const ref = doc(db, 'trips', code);
  let cleanPayload = JSON.parse(JSON.stringify({ ...trip, inviteCode: code })) as TripData;

  // Protect against Firestore 1MB document limit when PDF tickets or heavy data are attached
  try {
    const jsonStr = JSON.stringify(cleanPayload);
    if (jsonStr.length > 950_000 && cleanPayload.bookings) {
      cleanPayload = {
        ...cleanPayload,
        bookings: cleanPayload.bookings.map((b) => {
          if (b.pdfDataUrl && b.pdfDataUrl.length > 300_000) {
            const { pdfDataUrl, ...rest } = b;
            return rest;
          }
          return b;
        })
      };
    }
  } catch {
    // Keep cleanPayload as-is if guard check fails
  }

  const finalPayload: Record<string, unknown> = { ...cleanPayload };
  if (!trip.coverImage) {
    finalPayload.coverImage = deleteField();
  }

  await setDoc(ref, finalPayload, { merge: true });
}

export async function fetchTripFromCloud(inviteCode: string): Promise<TripData | null> {
  const db = initFirestoreInstance();
  if (!db) return null;
  const code = normalizeInviteCode(inviteCode);
  if (!code) return null;
  const snap = await getDoc(doc(db, 'trips', code));
  if (!snap.exists()) return null;
  return snap.data() as TripData;
}

export async function fetchUserTripsFromCloud(uid: string): Promise<TripData[]> {
  const db = initFirestoreInstance();
  if (!db || !uid) return [];
  try {
    const q = query(collection(db, 'trips'), where('memberUids', 'array-contains', uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as TripData);
  } catch {
    return [];
  }
}

export function subscribeToCloudTrip(
  inviteCode: string,
  onRemoteData: (trip: TripData, fromCache: boolean) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  const db = initFirestoreInstance();
  if (!db) return null;
  const code = normalizeInviteCode(inviteCode);
  if (!code) return null;

  const ref = doc(db, 'trips', code);
  return onSnapshot(
    ref,
    { includeMetadataChanges: true },
    (snapshot) => {
      if (snapshot.exists()) {
        onRemoteData(snapshot.data() as TripData, snapshot.metadata.fromCache);
      }
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for ALL trips belonging to the authenticated user.
 * Guarantees zero asymmetry between mobile and web devices: any creation, update,
 * or deletion occurring on one device immediately reflects across all active devices.
 */
export function subscribeToUserTrips(
  uid: string,
  onTripsUpdated: (trips: TripData[], fromCache: boolean) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  const db = initFirestoreInstance();
  if (!db || !uid) return null;

  const q = query(collection(db, 'trips'), where('memberUids', 'array-contains', uid));
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const trips = snapshot.docs.map((d) => d.data() as TripData);
      onTripsUpdated(trips, snapshot.metadata.fromCache);
    },
    (error) => {
      if (onError) onError(error);
    }
  );
}

/**
 * Safely removes a trip from Cloud Firestore.
 * If the user is the only member or only UID in memberUids, the document is permanently deleted.
 * If shared with other companions, the user's UID and membership are removed so the trip remains
 * for the remaining participants, and automatically disappears from the user's account view.
 */
export async function deleteCloudTrip(trip: TripData, user: UserProfile): Promise<void> {
  const db = initFirestoreInstance();
  if (!db || !user?.uid) return;
  const code = normalizeInviteCode(trip.inviteCode);
  if (!code) return;

  const ref = doc(db, 'trips', code);
  const remainingUids = (trip.memberUids ?? []).filter((u) => u !== user.uid);

  if (remainingUids.length === 0) {
    try {
      await deleteDoc(ref);
    } catch (err) {
      console.warn('Failed to delete cloud trip document:', err);
    }
    return;
  }

  const remainingMembers = (trip.members ?? []).filter(
    (m) => m.uid !== user.uid && m.name !== user.displayName
  );

  try {
    await updateDoc(ref, {
      memberUids: remainingUids,
      members: remainingMembers,
      updatedAt: Date.now()
    });
  } catch (err) {
    console.warn('Failed to disassociate user from cloud trip:', err);
  }
}
