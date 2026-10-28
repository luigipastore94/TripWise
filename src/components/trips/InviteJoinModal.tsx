import React, { useState } from 'react';
import { Users } from 'lucide-react';
import { ModalDialog } from '../ui/ModalDialog';
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

export const InviteJoinModal: React.FC = () => {
  const { user, pendingInviteCode, dismissPendingInvite, signInWithGoogle } = useTrip();
  const [signingIn, setSigningIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!pendingInviteCode || user) {
    return null;
  }

  const handleSignInAndJoin = async () => {
    setSigningIn(true);
    setErrorMsg(null);
    const res = await signInWithGoogle();
    setSigningIn(false);
    if (!res.ok && res.message) {
      setErrorMsg(res.message);
    }
  };

  return (
    <ModalDialog
      open={Boolean(pendingInviteCode && !user)}
      onClose={dismissPendingInvite}
      title="Invito al Viaggio"
      subtitle="Un compagno di viaggio ti ha invitato su TripWise"
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4 pt-1">
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
            Accedi con il tuo account Google per unirti all'itinerario e visualizzare la mappa e le spese in tempo reale.
          </p>
        </div>

        {errorMsg && (
          <p role="status" className="text-xs text-amber-700 dark:text-amber-300 font-medium text-center">
            {errorMsg}
          </p>
        )}

        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={handleSignInAndJoin}
            disabled={signingIn}
            className="w-full min-h-[50px] px-4 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 font-bold text-sm shadow-sm inline-flex items-center justify-center gap-3 transition-colors"
          >
            <GoogleIcon />
            <span>{signingIn ? 'Accesso in corso...' : 'Accedi con Google per Unirti'}</span>
          </button>

          <button
            type="button"
            onClick={dismissPendingInvite}
            className="w-full min-h-[44px] px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Più tardi
          </button>
        </div>
      </div>
    </ModalDialog>
  );
};
