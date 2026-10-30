import React from 'react';
import {
  Compass,
  Bookmark,
  Wallet,
  Ticket,
  CheckSquare,
  ChevronDown,
  ArrowLeftRight,
  CalendarRange,
  Settings,
  WifiOff,
  Cloud,
  CloudOff,
  Loader2,
  UserCircle2,
  Users
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import type { AppTab } from '../../types/trip';

interface SidebarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenTripManager: () => void;
  onOpenEditTrip: () => void;
  onOpenConverter: () => void;
  onOpenSettings: () => void;
}

const NAV_ITEMS: Array<{ id: AppTab; label: string; Icon: React.FC<{ className?: string }> }> = [
  { id: 'itinerary', label: 'Itinerario & Mappa', Icon: Compass },
  { id: 'places', label: 'Luoghi & Preferiti', Icon: Bookmark },
  { id: 'expenses', label: 'Spese & Pareggio', Icon: Wallet },
  { id: 'bookings', label: 'Biglietti & Prenotazioni', Icon: Ticket },
  { id: 'checklist', label: 'Checklist Viaggio', Icon: CheckSquare }
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenTripManager,
  onOpenEditTrip,
  onOpenConverter,
  onOpenSettings
}) => {
  const { activeTrip, tripsLoading, user, isOnline, syncStatus, signInWithGoogle, retryCloudSync } = useTrip();
  const connectedCount = activeTrip?.memberUids?.length ?? 0;
  const isSharedTrip = connectedCount >= 2;

  const formatRange = (start?: string, end?: string) => {
    if (!start) return '';
    const s = new Date(`${start}T00:00:00`).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short'
    });
    const e = end
      ? new Date(`${end}T00:00:00`).toLocaleDateString('it-IT', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : s;
    return `${s} – ${e}`;
  };

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-72 xl:w-80 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/95 min-h-screen sticky top-0 h-screen">
      {/* Brand Top */}
      <div className="px-5 h-16 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <img src="/icon.svg" alt="" width={30} height={30} className="w-7 h-7 rounded-lg" />
          <span className="text-lg font-black tracking-tight">TripWise</span>
        </div>
        {!isOnline ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
            <WifiOff className="w-3 h-3" aria-hidden="true" />
            <span>Offline</span>
          </span>
        ) : syncStatus === 'error' ? (
          <button
            type="button"
            onClick={retryCloudSync}
            title="Sincronizzazione in sospeso. Clicca per sincronizzare subito con il cloud."
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors"
          >
            <CloudOff className="w-3 h-3" aria-hidden="true" />
            <span>Sync in sospeso</span>
          </button>
        ) : syncStatus === 'syncing' ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300">
            <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
            <span>Sincronizzazione...</span>
          </span>
        ) : syncStatus === 'offline-cached' ? (
          <button
            type="button"
            onClick={retryCloudSync}
            title="Connessione al cloud in verifica. Clicca per sincronizzare ora."
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors"
          >
            <Cloud className="w-3 h-3" aria-hidden="true" />
            <span>In attesa rete</span>
          </button>
        ) : syncStatus === 'synced' ? (
          <button
            type="button"
            onClick={retryCloudSync}
            title="Sincronizzato e confermato sul cloud. Clicca per verificare."
            className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors"
          >
            <Cloud className="w-3 h-3" aria-hidden="true" />
            <span>Sync attivo</span>
          </button>
        ) : null}
      </div>

      {/* Active Trip Switcher & Date Editor */}
      {activeTrip ? (
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-2">
          <button
            type="button"
            onClick={onOpenTripManager}
            className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2 text-left transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {activeTrip.coverImage ? (
                <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <img src={activeTrip.coverImage} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 text-[9px] bg-slate-900/80 text-white px-0.5 rounded-tl">
                    {activeTrip.emoji}
                  </span>
                </div>
              ) : (
                <span className="text-2xl shrink-0" aria-hidden="true">
                  {activeTrip.emoji}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold line-clamp-2 leading-snug break-words" title={activeTrip.title}>
                  {activeTrip.title}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span className="truncate">
                    {activeTrip.destination} • {activeTrip.days.length}g
                  </span>
                  {isSharedTrip ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 font-bold text-[10px]">
                      <Users className="w-2.5 h-2.5" aria-hidden="true" />
                      <span>Condiviso ({connectedCount})</span>
                    </span>
                  ) : user ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-slate-200/70 text-slate-600 dark:bg-slate-700/80 dark:text-slate-300 font-semibold text-[10px]">
                      Personale
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onOpenEditTrip}
            className="w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-brand-50 dark:hover:bg-brand-950/50 hover:text-brand-600 dark:hover:text-brand-300 flex items-center justify-between transition-colors"
          >
            <span className="inline-flex items-center gap-1.5">
              <CalendarRange className="w-3.5 h-3.5 text-brand-500" aria-hidden="true" />
              <span>{formatRange(activeTrip.startDate, activeTrip.endDate)}</span>
            </span>
            <span className="text-brand-600 dark:text-brand-400 font-bold">Modifica</span>
          </button>
        </div>
      ) : tripsLoading ? (
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
        </div>
      ) : null}

      {/* Primary Desktop Navigation */}
      <nav aria-label="Menu principale desktop" className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {activeTrip &&
          NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectTab(id)}
                aria-current={active ? 'page' : undefined}
                aria-selected={active}
                className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${
                  active
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            );
          })}

        {activeTrip && (
          <div className="pt-4">
            <button
              type="button"
              onClick={onOpenConverter}
              className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500 text-xs font-bold flex items-center justify-between text-slate-700 dark:text-slate-200 transition-colors"
            >
              <span className="inline-flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-brand-500" aria-hidden="true" />
                <span>Convertitore Valuta</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono">
                {activeTrip.destinationCurrency}/{activeTrip.baseCurrency}
              </span>
            </button>
          </div>
        )}
      </nav>

      {/* Bottom Account & Preferences Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
        {user ? (
          <button
            type="button"
            onClick={onOpenSettings}
            className="w-full p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between gap-2 text-left transition-colors"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  width={34}
                  height={34}
                  className="w-8 h-8 rounded-full shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {user.displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-bold truncate">{user.displayName}</div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Account Google attivo
                </div>
              </div>
            </div>
            <Settings className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => signInWithGoogle().then((r) => !r.ok && onOpenSettings())}
              className="flex-1 min-h-[44px] px-3 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <UserCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>Accedi con Google</span>
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Preferenze e Condivisione"
              className="min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 inline-flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
