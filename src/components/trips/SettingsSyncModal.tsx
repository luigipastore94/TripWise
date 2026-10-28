import React, { useState, useId } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Check,
  Trash2,
  Users,
  Share2,
  Copy,
  LogOut,
  Cloud,
  Loader2,
  GitMerge,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { ModalDialog } from '../ui/ModalDialog';
import { useTrip } from '../../context/TripContext';
import { MEMBER_COLORS } from '../../data/presets';
import type { ColorSchemePreference } from '../../types/trip';

interface SettingsSyncModalProps {
  open: boolean;
  onClose: () => void;
}

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

export const SettingsSyncModal: React.FC<SettingsSyncModalProps> = ({ open, onClose }) => {
  const {
    activeTrip,
    user,
    isOnline,
    syncStatus,
    signInWithGoogle,
    signOut,
    colorScheme,
    setColorScheme,
    updateTripMeta,
    retryCloudSync,
    mergeTripByCode
  } = useTrip();

  const idPrefix = useId();
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [syncingNow, setSyncingNow] = useState(false);
  const [mergeCode, setMergeCode] = useState('');
  const [isMerging, setIsMerging] = useState(false);
  const [mergeFeedback, setMergeFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const handleManualSync = async () => {
    setSyncingNow(true);
    await retryCloudSync();
    setSyncingNow(false);
  };

  const handleMergeTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mergeCode.trim()) return;
    setIsMerging(true);
    setMergeFeedback(null);
    const res = await mergeTripByCode(mergeCode);
    setIsMerging(false);
    setMergeFeedback({ ok: res.ok, message: res.message });
    if (res.ok) {
      setMergeCode('');
    }
  };

  const handleGoogleLogin = async () => {
    setSigningIn(true);
    setAuthMessage(null);
    const res = await signInWithGoogle();
    setSigningIn(false);
    if (!res.ok && res.message) {
      setAuthMessage(res.message);
    }
  };

  const handleShareInvite = async () => {
    if (!activeTrip) return;

    if (!user) {
      setAuthMessage('Accedi con Google per caricare il viaggio sul cloud e condividerlo.');
      await handleGoogleLogin();
      return;
    }

    setSharing(true);
    try {
      await retryCloudSync();
    } catch {
      // Non-blocking if offline
    } finally {
      setSharing(false);
    }

    const shareUrl = `${window.location.origin}${window.location.pathname}?join=${encodeURIComponent(
      activeTrip.inviteCode
    )}`;
    const shareText = `Unisciti al nostro viaggio "${activeTrip.title}" su TripWise! Codice invito: ${activeTrip.inviteCode}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `TripWise — ${activeTrip.title}`,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // ignore
    }
  };

  const handleCopyCode = async () => {
    if (!activeTrip) return;

    if (!user) {
      setAuthMessage('Accedi con Google per abilitare la condivisione del codice sul cloud.');
      await handleGoogleLogin();
      return;
    }

    try {
      await retryCloudSync();
    } catch {
      // ignore
    }

    try {
      await navigator.clipboard.writeText(activeTrip.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTrip || !newMemberName.trim()) return;
    const nextMembers = [
      ...activeTrip.members,
      {
        id: `mem_${Date.now().toString(36)}`,
        name: newMemberName.trim(),
        color: MEMBER_COLORS[activeTrip.members.length % MEMBER_COLORS.length]
      }
    ];
    updateTripMeta({ members: nextMembers });
    setNewMemberName('');
  };

  const themeOptions: Array<{
    value: ColorSchemePreference;
    label: string;
    Icon: React.FC<{ className?: string }>;
  }> = [
    { value: 'light dark', label: 'Automatico', Icon: Monitor },
    { value: 'light', label: 'Chiaro', Icon: Sun },
    { value: 'dark', label: 'Scuro', Icon: Moon }
  ];

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title="Account, Condivisione & Preferenze"
      subtitle="Accedi con Google per ritrovare i tuoi viaggi su ogni telefono e computer"
    >
      <div className="space-y-6">
        {/* Consumer Google Account Card */}
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Il tuo Account
          </div>

          {user ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    width={44}
                    height={44}
                    className="w-11 h-11 rounded-full border border-slate-200 dark:border-slate-700"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-brand-600 text-white font-bold flex items-center justify-center text-base">
                    {user.displayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-bold truncate">{user.displayName}</div>
                  {user.email && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </div>
                  )}
                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ✓ Sincronizzazione automatica attiva
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={syncingNow || !isOnline}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {syncingNow ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  ) : syncStatus === 'error' ? (
                    <RefreshCw className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                  )}
                  <span>{syncingNow ? 'In corso...' : 'Sincronizza ora'}</span>
                </button>

                <button
                  type="button"
                  onClick={signOut}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Esci</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Accedi con il tuo profilo Google per salvare in automatico i tuoi viaggi e sincronizzarli in tempo reale tra smartphone e computer.
              </p>
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={signingIn}
                className="w-full min-h-[50px] px-4 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-950 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 font-bold text-sm shadow-sm inline-flex items-center justify-center gap-3 transition-colors"
              >
                <GoogleIcon />
                <span>{signingIn ? 'Accesso in corso...' : 'Continua con Google'}</span>
              </button>
              {authMessage && (
                <p role="status" className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  {authMessage}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Simple Consumer Invite Section */}
        {activeTrip && (
          <div className="space-y-2.5 pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Invita un compagno in "{activeTrip.title}"
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Invia il link diretto su WhatsApp o Telegram: chi lo apre vede lo stesso itinerario e le spese aggiornate in tempo reale.
            </p>

            {!user && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                Accedi con Google qui sopra per salvare questo viaggio sul cloud e consentire ai tuoi compagni di visualizzarlo.
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleShareInvite}
                disabled={sharing}
                className="flex-1 min-h-[48px] px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-75"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>Link copiato negli appunti!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4" aria-hidden="true" />
                    <span>
                      {sharing
                        ? 'Sincronizzazione in corso...'
                        : !user
                        ? 'Accedi con Google per Condividere'
                        : 'Condividi Link di Invito'}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyCode}
                title="Copia codice invito"
                className="min-h-[48px] px-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold inline-flex items-center gap-1.5"
              >
                <span>{activeTrip.inviteCode}</span>
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Smart Merge / Recupero dati dal compagno */}
        {activeTrip && user && (
          <div className="rounded-2xl bg-brand-50/60 dark:bg-brand-950/30 p-4 border border-brand-200 dark:border-brand-900/60 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
              <GitMerge className="w-4 h-4 text-brand-600" aria-hidden="true" />
              <span>Unisci o Recupera Dati del Compagno</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Il tuo compagno ha aggiunto spese o documenti con un altro codice o telefono? Inserisci il suo codice invito qui sotto: TripWise unirà automaticamente tutto nel viaggio attuale senza sovrascrivere o perdere nulla.
            </p>

            <form onSubmit={handleMergeTrip} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={mergeCode}
                  onChange={(e) => setMergeCode(e.target.value)}
                  placeholder="Codice compagno (es. TW-XXXX-YYYY)..."
                  autoCapitalize="characters"
                  spellCheck={false}
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono font-bold uppercase text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={isMerging || !mergeCode.trim()}
                  className="min-h-[42px] px-4 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors shrink-0"
                >
                  {isMerging ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                      <span>Unione...</span>
                    </>
                  ) : (
                    <>
                      <GitMerge className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Unisci Dati</span>
                    </>
                  )}
                </button>
              </div>

              {mergeFeedback && (
                <div
                  role="status"
                  className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                    mergeFeedback.ok
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {mergeFeedback.ok ? (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <span>{mergeFeedback.message}</span>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Active Trip Members Management */}
        {activeTrip && (
          <div className="space-y-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-brand-500" aria-hidden="true" />
              <span>Partecipanti ({activeTrip.members.length})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeTrip.members.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: m.color }}
                  />
                  <span>{m.name}</span>
                  {activeTrip.members.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        updateTripMeta({
                          members: activeTrip.members.filter((item) => item.id !== m.id)
                        })
                      }
                      aria-label={`Rimuovi ${m.name}`}
                      className="text-slate-400 hover:text-red-500 ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </span>
              ))}
            </div>
            <form onSubmit={handleAddMember} className="flex gap-2">
              <label htmlFor={`${idPrefix}-newmem`} className="visually-hidden">
                Nuovo partecipante
              </label>
              <input
                id={`${idPrefix}-newmem`}
                name="new_member"
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="Aggiungi nome partecipante..."
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
              />
              <button
                type="submit"
                className="min-h-[48px] px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold"
              >
                Aggiungi
              </button>
            </form>
          </div>
        )}

        {/* Three-State Color Scheme Control */}
        <fieldset className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-800">
          <legend className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Aspetto dell’app
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map(({ value, label, Icon }) => {
              const active = colorScheme === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setColorScheme(value)}
                  aria-pressed={active}
                  className={`min-h-[48px] px-3 py-2 rounded-xl border text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors ${
                    active
                      ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* App Version & Refresh Cache */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>TripWise v1.1 • Spostamento tappe attivo</span>
          <button
            type="button"
            onClick={async () => {
              try {
                if ('serviceWorker' in navigator) {
                  const regs = await navigator.serviceWorker.getRegistrations();
                  for (const reg of regs) {
                    await reg.update();
                  }
                }
              } catch {}
              window.location.reload();
            }}
            className="text-brand-600 dark:text-brand-400 font-bold hover:underline"
          >
            Aggiorna / Ricarica ora
          </button>
        </div>
      </div>
    </ModalDialog>
  );
};
