import React, { useState } from 'react';
import { Compass, Wallet, QrCode, Wifi, Cloud, AlertCircle, Loader2, Users } from 'lucide-react';
import { useTrip } from '../../context/TripContext';

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

export const AuthGate: React.FC = () => {
  const { signInWithGoogle, pendingInviteCode, isOnline } = useTrip();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const res = await signInWithGoogle();
      if (!res.ok && res.message) {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage('Impossibile completare l’accesso in questo momento. Riprova tra qualche istante.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/icon.svg" alt="TripWise" width={36} height={36} className="w-9 h-9 rounded-xl shadow-sm" />
          <span className="text-xl font-black tracking-tight">TripWise</span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800/60 px-3 py-1 rounded-full">
          <Cloud className="w-3.5 h-3.5 text-brand-500" aria-hidden="true" />
          <span>Cloud Sync</span>
        </span>
      </div>

      {/* Main Auth Card (Hick's & Fitts's Laws) */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200/80 dark:border-slate-800/80 shadow-xl space-y-6">
          {/* Contextual Invite Banner (if user opened an invite link) */}
          {pendingInviteCode && (
            <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-900/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
                <Users className="w-4 h-4" aria-hidden="true" />
              </div>
              <div className="text-xs space-y-0.5">
                <div className="font-extrabold text-brand-900 dark:text-brand-200">
                  Invito a un viaggio condiviso
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  Codice <code className="font-mono font-bold text-brand-700 dark:text-brand-300">{pendingInviteCode}</code>. Accedi per unirti subito ai tuoi compagni di viaggio.
                </div>
              </div>
            </div>
          )}

          {/* Hero Welcome Text */}
          <div className="space-y-2 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
              {pendingInviteCode ? 'Accedi per iniziare' : 'Tutti i tuoi viaggi, ovunque tu sia'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Accedi con il tuo account Google per ritrovare i tuoi viaggi, tappe e spese sincronizzati in tempo reale tra mobile e desktop.
            </p>
          </div>

          {/* Value Highlights (Miller's Law - 4 clear chunks) */}
          <div className="grid grid-cols-2 gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Compass className="w-4 h-4 text-brand-500 shrink-0" aria-hidden="true" />
              <span className="truncate">Mappa & Tappe</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-500 shrink-0" aria-hidden="true" />
              <span className="truncate">Spese & Pareggio</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
              <span className="truncate">Pass & Biglietti QR</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Wifi className="w-4 h-4 text-sky-500 shrink-0" aria-hidden="true" />
              <span className="truncate">100% Offline-Ready</span>
            </div>
          </div>

          {/* Offline Warning (if device has no network during initial unauthenticated visit) */}
          {!isOnline && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong>Connessione assente:</strong> Per effettuare il primo accesso è necessaria una connessione internet. Una volta effettuato l'accesso, TripWise funzionerà anche completamente offline.
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div role="alert" className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Primary Action Button (Fitts's Law >= 48px, Jakob's Law Google Sign-In) */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleSignIn}
              disabled={isSigningIn || !isOnline}
              className="w-full min-h-[50px] px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 text-slate-800 dark:text-slate-100 font-extrabold text-sm flex items-center justify-center gap-3 shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-brand-600" aria-hidden="true" />
                  <span>Accesso con Google in corso...</span>
                </>
              ) : (
                <>
                  <GoogleIcon />
                  <span>Accedi con Google</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-500 dark:text-slate-400">
              I tuoi dati sono protetti e sincronizzati in modo sicuro con il tuo account Google.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="w-full max-w-md mx-auto text-center text-xs text-slate-400 dark:text-slate-500">
        TripWise • Compagno di viaggio universale
      </div>
    </div>
  );
};
