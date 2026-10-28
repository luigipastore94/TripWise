import React, { useState } from 'react';
import {
  ChevronDown,
  ArrowLeftRight,
  Settings,
  WifiOff,
  CalendarRange,
  Cloud,
  CloudOff,
  Loader2
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';

interface HeaderProps {
  onOpenTripManager: () => void;
  onOpenEditTrip: () => void;
  onOpenConverter: () => void;
  onOpenSettings: () => void;
}

/**
 * Compact Mobile/Tablet Header (hidden on `lg:` desktop where the persistent Sidebar takes over).
 */
export const Header: React.FC<HeaderProps> = ({
  onOpenTripManager,
  onOpenEditTrip,
  onOpenConverter,
  onOpenSettings
}) => {
  const { activeTrip, tripsLoading, user, isOnline, syncStatus, retryCloudSync } = useTrip();
  const [isRetryingSync, setIsRetryingSync] = useState(false);

  const handleSyncClick = async () => {
    setIsRetryingSync(true);
    await retryCloudSync();
    setIsRetryingSync(false);
  };

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="px-4 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {activeTrip ? (
            <button
              type="button"
              onClick={onOpenTripManager}
              className="min-h-[44px] px-2 py-1 -ml-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center gap-2 transition-colors min-w-0 flex-1"
            >
              {activeTrip.coverImage ? (
                <div className="relative w-9 h-9 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs">
                  <img src={activeTrip.coverImage} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 text-[8px] bg-slate-900/80 text-white px-0.5 rounded-tl">
                    {activeTrip.emoji}
                  </span>
                </div>
              ) : (
                <span className="text-2xl shrink-0" aria-hidden="true">
                  {activeTrip.emoji}
                </span>
              )}
              <div className="text-left min-w-0 flex-1">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-sm font-extrabold tracking-tight truncate">
                    {activeTrip.title}
                  </span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  <span className="truncate">{activeTrip.destination}</span>
                  {!isOnline ? (
                    <span className="inline-flex items-center gap-0.5 font-bold text-amber-600 dark:text-amber-400 shrink-0">
                      • <WifiOff className="w-3 h-3" aria-hidden="true" /> Offline
                    </span>
                  ) : syncStatus === 'error' ? (
                    <span className="inline-flex items-center gap-0.5 font-bold text-amber-600 dark:text-amber-400 shrink-0">
                      • Sync in sospeso
                    </span>
                  ) : syncStatus === 'synced' ? (
                    <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      • Sincronizzato
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          ) : tripsLoading ? (
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 animate-pulse shrink-0" />
              <div className="space-y-1.5 min-w-0">
                <div className="h-3.5 w-28 bg-slate-200/80 dark:bg-slate-800/80 rounded animate-pulse" />
                <div className="h-2.5 w-16 bg-slate-200/80 dark:bg-slate-800/80 rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <img src="/icon.svg" alt="" width={32} height={32} className="w-8 h-8 rounded-lg" />
              <span className="text-lg font-black tracking-tight">TripWise</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {activeTrip && user && isOnline && (
            <button
              type="button"
              onClick={handleSyncClick}
              title={
                syncStatus === 'synced'
                  ? 'Sincronizzato in tempo reale col compagno. Tocca per aggiornare.'
                  : syncStatus === 'syncing' || isRetryingSync
                  ? 'Sincronizzazione in corso...'
                  : 'Modifiche locali in attesa di sincronizzazione. Tocca per sincronizzare ora.'
              }
              aria-label="Stato sincronizzazione cloud"
              className={`min-w-[40px] min-h-[40px] rounded-xl inline-flex items-center justify-center transition-colors ${
                syncStatus === 'error'
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  : syncStatus === 'syncing' || isRetryingSync
                  ? 'text-sky-600 dark:text-sky-400'
                  : 'text-emerald-600 dark:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              {syncStatus === 'syncing' || isRetryingSync ? (
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              ) : syncStatus === 'error' ? (
                <CloudOff className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Cloud className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          )}

          {activeTrip && (
            <>
              <button
                type="button"
                onClick={onOpenEditTrip}
                aria-label="Modifica date e dettagli viaggio"
                className="min-w-[42px] min-h-[42px] rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 inline-flex items-center justify-center"
              >
                <CalendarRange className="w-4 h-4 text-brand-500" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onOpenConverter}
                aria-label="Convertitore rapido valuta"
                className="min-h-[42px] px-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold inline-flex items-center gap-1"
              >
                <ArrowLeftRight className="w-4 h-4 text-brand-500" aria-hidden="true" />
                <span className="hidden sm:inline">
                  {activeTrip.destinationCurrency}/{activeTrip.baseCurrency}
                </span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Account Google e Impostazioni"
            className="min-w-[42px] min-h-[42px] rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 inline-flex items-center justify-center"
          >
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                width={28}
                height={28}
                className="w-7 h-7 rounded-full"
              />
            ) : (
              <Settings className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
