import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { ModalDialog } from '../ui/ModalDialog';
import { useTrip } from '../../context/TripContext';
import { fetchTripFromCloud, normalizeInviteCode } from '../../services/firebase';
import type { TripData } from '../../types/trip';

const GoogleIcon: React.FC = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
    />
  </svg>
);

export const InviteJoinModal: React.FC = () => {
  const { user, pendingInviteCode, dismissPendingInvite, signInWithGoogle, joinTripByCode } = useTrip();
  const [displayName, setDisplayName] = useState<string>(() => user?.displayName || '');
  const [signingIn, setSigningIn] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [tripPreview, setTripPreview] = useState<TripData | null>(null);

  // Sync display name if user logs in during the flow
  useEffect(() => {
    if (user?.displayName && !displayName) {
      setDisplayName(user.displayName);
    }
  }, [user?.displayName, displayName]);

  // Try to fetch trip details for warm preview if cloud is available
  useEffect(() => {
    if (!pendingInviteCode) {
      setTripPreview(null);
      return;
    }
    const clean = normalizeInviteCode(pendingInviteCode);
    if (!clean) return;

    let active = true;
    fetchTripFromCloud(clean)
      .then((preview) => {
        if (active && preview) {
          setTripPreview(preview);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [pendingInviteCode]);

  if (!pendingInviteCode) {
    return null;
  }

  const handleSignIn = async () => {
    setSigningIn(true);
    setErrorMsg(null);
    if (displayName.trim()) {
      try {
        localStorage.setItem('tripwise_pending_join_name', displayName.trim());
      } catch {
        // ignore
      }
    }
    const res = await signInWithGoogle();
    setSigningIn(false);
    if (!res.ok && res.message) {
      setErrorMsg(res.message);
    }
  };

  const handleConfirmJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      await handleSignIn();
      return;
    }
    setIsJoining(true);
    setErrorMsg(null);
    const chosen = displayName.trim() || user.displayName || 'Compagno';
    const res = await joinTripByCode(pendingInviteCode, chosen);
    setIsJoining(false);
    if (res.ok) {
      dismissPendingInvite();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <ModalDialog
      open={Boolean(pendingInviteCode)}
      onClose={dismissPendingInvite}
      title="Invito al Viaggio"
      subtitle={
        tripPreview
          ? `Unisciti a "${tripPreview.title}"`
          : 'Un compagno di viaggio ti ha invitato su TripWise'
      }
      maxWidthClass="max-w-md"
    >
      <form onSubmit={handleConfirmJoin} className="space-y-4 pt-1">
        {tripPreview ? (
          <div className="p-4 rounded-2xl bg-brand-50/80 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-center space-y-2">
            {tripPreview.coverImage ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto shadow-md border border-brand-300 dark:border-brand-700">
                <img src={tripPreview.coverImage} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md text-2xl">
                {tripPreview.emoji || '🌍'}
              </div>
            )}
            <div className="text-base font-extrabold text-slate-900 dark:text-white">
              {tripPreview.title}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              {tripPreview.destination} • {tripPreview.days.length} giorni in programma
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto shadow-md">
              <Users className="w-6 h-6" aria-hidden="true" />
            </div>
            <div className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
              Codice di Invito
            </div>
            <div className="text-xl font-mono font-extrabold text-slate-900 dark:text-white tracking-wider">
              {pendingInviteCode}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto leading-relaxed">
              Visualizza l'itinerario e condividi le spese in tempo reale con i tuoi compagni.
            </p>
          </div>
        )}

        {/* Display name input - Postel's Law (forgiving, prefilled, customizable) */}
        <div className="space-y-1.5 text-left">
          <label htmlFor="join-display-name" className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Nome con cui gli altri ti vedranno
          </label>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Questo è il nome che apparirà ai tuoi compagni nelle spese condivise e nelle tappe.
          </p>
          <input
            id="join-display-name"
            name="display_name"
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={user?.displayName || "Es. Marco, Giulia, Papà..."}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 font-semibold text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
          />
        </div>

        {errorMsg && (
          <p role="status" className="text-xs text-amber-700 dark:text-amber-300 font-medium text-center">
            {errorMsg}
          </p>
        )}

        <div className="space-y-2 pt-2">
          {!user ? (
            <button
              type="button"
              onClick={handleSignIn}
              disabled={signingIn}
              className="w-full min-h-[50px] px-4 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 font-bold text-sm shadow-sm inline-flex items-center justify-center gap-3 transition-colors"
            >
              <GoogleIcon />
              <span>{signingIn ? 'Accesso in corso...' : 'Accedi con Google per Unirti'}</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={isJoining}
              className="w-full min-h-[50px] px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/20 inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              <Users className="w-4 h-4" aria-hidden="true" />
              <span>{isJoining ? 'Unione in corso...' : 'Unisciti al Viaggio'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={dismissPendingInvite}
            className="w-full min-h-[44px] px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Più tardi
          </button>
        </div>
      </form>
    </ModalDialog>
  );
};
