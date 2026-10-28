import React, { useState } from 'react';
import { LogIn, Compass, Wallet, QrCode, WifiOff, Share2, CalendarRange, Camera, Loader2, X } from 'lucide-react';
import { TripProvider, useTrip } from './context/TripContext';
import type { AppTab } from './types/trip';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { ItineraryView } from './components/itinerary/ItineraryView';
import { PlacesRecapView } from './components/places/PlacesRecapView';
import { ExpenseTracker } from './components/expenses/ExpenseTracker';
import { BookingsView } from './components/bookings/BookingsView';
import { ChecklistView } from './components/checklist/ChecklistView';
import { TripCreatorForm, TripManagerModal } from './components/trips/TripManagerModal';
import { TripEditModal } from './components/trips/TripEditModal';
import { QuickConverterModal } from './components/expenses/QuickConverterModal';
import { SettingsSyncModal } from './components/trips/SettingsSyncModal';
import { InviteJoinModal } from './components/trips/InviteJoinModal';
import { AuthGate } from './components/auth/AuthGate';
import { compressImageToDataUrl } from './utils/imageCompression';

const AppShell: React.FC = () => {
  const { activeTrip, updateTripCoverImage, joinNotification, clearJoinNotification } = useTrip();

  const [activeTab, setActiveTab] = useState<AppTab>('itinerary');
  const [focusDayIndex, setFocusDayIndex] = useState<number | null>(null);
  const [tripManagerOpen, setTripManagerOpen] = useState(false);
  const [tripEditOpen, setTripEditOpen] = useState(false);
  const [converterOpen, setConverterOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handleDirectPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const compressed = await compressImageToDataUrl(file, 1280, 0.82);
      updateTripCoverImage(compressed);
    } catch (err) {
      console.warn('Cover photo error:', err);
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenTripManager={() => setTripManagerOpen(true)}
        onOpenEditTrip={() => setTripEditOpen(true)}
        onOpenConverter={() => setConverterOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onOpenTripManager={() => setTripManagerOpen(true)}
          onOpenEditTrip={() => setTripEditOpen(true)}
          onOpenConverter={() => setConverterOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-5 pb-24 lg:pb-10">
          {!activeTrip ? (
            /* Universal Onboarding Screen */
            <div className="max-w-3xl mx-auto space-y-6 py-2">
              <div className="rounded-3xl bg-gradient-to-br from-brand-600 via-indigo-700 to-sky-700 text-white p-6 sm:p-8 shadow-xl">
                <span className="inline-block text-xs font-bold uppercase tracking-widest bg-white/15 px-3 py-1 rounded-full">
                  Benvenuto su TripWise
                </span>
                <h1 className="text-2xl sm:text-3xl font-black mt-3 tracking-tight">
                  Organizza qualsiasi viaggio nel mondo, insieme.
                </h1>
                <p className="text-sm text-indigo-100 mt-2 max-w-xl leading-relaxed">
                  Itinerario interattivo con mappa integrata, spese multi-valuta con pareggio conti automatico, pass QR offline e checklist condivisa.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-6 text-xs font-semibold">
                  <div className="bg-white/10 rounded-xl p-2.5 flex items-center gap-2">
                    <Compass className="w-4 h-4 shrink-0 text-sky-200" aria-hidden="true" />
                    <span>Mappa In-App</span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2.5 flex items-center gap-2">
                    <Wallet className="w-4 h-4 shrink-0 text-emerald-200" aria-hidden="true" />
                    <span>Split Multi-Valuta</span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2.5 flex items-center gap-2">
                    <QrCode className="w-4 h-4 shrink-0 text-amber-200" aria-hidden="true" />
                    <span>Pass & QR Offline</span>
                  </div>
                  <div className="bg-white/10 rounded-xl p-2.5 flex items-center gap-2">
                    <WifiOff className="w-4 h-4 shrink-0 text-pink-200" aria-hidden="true" />
                    <span>100% Offline-Ready</span>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-indigo-100">
                    Hai ricevuto un invito da un compagno di viaggio?
                  </span>
                  <button
                    type="button"
                    onClick={() => setTripManagerOpen(true)}
                    className="min-h-[40px] px-4 py-1.5 rounded-xl bg-white text-brand-700 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Inserisci Codice / Apri Invito</span>
                  </button>
                </div>
              </div>

              <div className="rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h2 className="text-lg font-extrabold mb-4">Crea il tuo primo viaggio</h2>
                <TripCreatorForm />
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <input
                id="hero-cover-photo-upload"
                name="trip_cover_quick_upload"
                type="file"
                accept="image/*"
                onChange={handleDirectPhotoUpload}
                className="visually-hidden"
              />

              {activeTrip.coverImage ? (
                /* Hero Banner with Cover Photo (Fluid Widescreen + Mobile Parity) */
                <>
                  {/* Desktop Hero Banner */}
                  <div className="hidden lg:block relative rounded-3xl overflow-hidden shadow-sm border border-slate-200/80 dark:border-slate-800/80 aspect-[21/7] max-h-56 bg-slate-100 dark:bg-slate-900">
                    <img
                      src={activeTrip.coverImage}
                      alt={activeTrip.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
                    <div className="absolute inset-x-0 bottom-0 p-5 lg:p-6 flex items-end justify-between gap-4 text-white">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="text-3xl shrink-0" aria-hidden="true">
                            {activeTrip.emoji}
                          </span>
                          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white drop-shadow-sm truncate">
                            {activeTrip.title}
                          </h1>
                        </div>
                        <p className="text-xs lg:text-sm font-medium text-slate-200/90 mt-1 flex flex-wrap items-center gap-2">
                          <span>{activeTrip.destination}</span>
                          <span>•</span>
                          <span>
                            {activeTrip.days.length} {activeTrip.days.length === 1 ? 'giorno' : 'giorni'}
                          </span>
                          <span>•</span>
                          <span>{activeTrip.members.map((m) => m.name).join(', ')}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <label
                          htmlFor="hero-cover-photo-upload"
                          className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white/95 hover:bg-white text-slate-900 text-xs font-bold inline-flex items-center gap-1.5 shadow-md backdrop-blur-xs cursor-pointer transition-colors"
                        >
                          {isUploadingPhoto ? (
                            <Loader2 className="w-4 h-4 animate-spin text-brand-600" aria-hidden="true" />
                          ) : (
                            <Camera className="w-4 h-4 text-brand-600" aria-hidden="true" />
                          )}
                          <span>{isUploadingPhoto ? 'Ottimizzazione...' : 'Cambia foto'}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => updateTripCoverImage(undefined)}
                          title="Rimuovi foto di copertina e ripristina icona"
                          aria-label="Rimuovi foto di copertina"
                          className="min-h-[42px] px-3.5 py-2 rounded-xl bg-black/40 hover:bg-red-600/90 border border-white/25 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md backdrop-blur-xs transition-colors"
                        >
                          <X className="w-4 h-4 text-white" aria-hidden="true" />
                          <span>Rimuovi foto</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTripEditOpen(true)}
                          className="min-h-[42px] px-3.5 py-2 rounded-xl bg-black/40 hover:bg-black/60 border border-white/25 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md backdrop-blur-xs transition-colors"
                        >
                          <CalendarRange className="w-4 h-4 text-white" aria-hidden="true" />
                          <span>Modifica Dettagli</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSettingsOpen(true)}
                          className="min-h-[42px] px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md transition-colors"
                        >
                          <Share2 className="w-4 h-4" aria-hidden="true" />
                          <span>Condividi</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Compact Hero Banner */}
                  <div className="lg:hidden relative rounded-2xl overflow-hidden shadow-sm aspect-[21/9] bg-slate-100 dark:bg-slate-900">
                    <img
                      src={activeTrip.coverImage}
                      alt={activeTrip.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-3 flex items-end justify-between gap-2 text-white">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl shrink-0" aria-hidden="true">{activeTrip.emoji}</span>
                          <span className="text-sm font-extrabold text-white truncate drop-shadow-xs">{activeTrip.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-200 truncate mt-0.5">
                          {activeTrip.destination} • {activeTrip.days.length}g
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <label
                          htmlFor="hero-cover-photo-upload"
                          aria-label="Cambia foto del viaggio"
                          className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-white/95 text-slate-900 text-xs font-bold inline-flex items-center gap-1 shadow-md cursor-pointer shrink-0"
                        >
                          {isUploadingPhoto ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-600" aria-hidden="true" />
                          ) : (
                            <Camera className="w-3.5 h-3.5 text-brand-600" aria-hidden="true" />
                          )}
                          <span>Cambia</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => updateTripCoverImage(undefined)}
                          aria-label="Rimuovi foto di copertina"
                          className="min-h-[38px] px-2 py-1.5 rounded-xl bg-black/50 hover:bg-red-600 text-white text-xs font-bold inline-flex items-center gap-1 shadow-md backdrop-blur-xs transition-colors shrink-0"
                        >
                          <X className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Rimuovi</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Desktop Contextual Top Bar without cover photo (with quick upload affordance) */
                <div className="hidden lg:flex items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
                  <div>
                    <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
                      <span>{activeTrip.emoji}</span>
                      <span>{activeTrip.title}</span>
                    </h1>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                      {activeTrip.destination} • {activeTrip.days.length}{' '}
                      {activeTrip.days.length === 1 ? 'giorno' : 'giorni'} •{' '}
                      {activeTrip.members.map((m) => m.name).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="hero-cover-photo-upload"
                      className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      {isUploadingPhoto ? (
                        <Loader2 className="w-4 h-4 animate-spin text-brand-600" aria-hidden="true" />
                      ) : (
                        <Camera className="w-4 h-4 text-brand-500" aria-hidden="true" />
                      )}
                      <span>{isUploadingPhoto ? 'Ottimizzazione...' : 'Carica Foto'}</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setTripEditOpen(true)}
                      className="min-h-[42px] px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-brand-500 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <CalendarRange className="w-4 h-4 text-brand-500" aria-hidden="true" />
                      <span>Modifica Date & Viaggio</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettingsOpen(true)}
                      className="min-h-[42px] px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <Share2 className="w-4 h-4" aria-hidden="true" />
                      <span>Condividi Viaggio</span>
                    </button>
                  </div>
                </div>
              )}

              <div className={activeTab === 'itinerary' ? 'block' : 'hidden'}>
                <ItineraryView
                  onOpenEditDates={() => setTripEditOpen(true)}
                  onOpenPlacesRecap={() => setActiveTab('places')}
                  focusDayIndex={focusDayIndex}
                  onFocusDayHandled={() => setFocusDayIndex(null)}
                />
              </div>
              <div className={activeTab === 'places' ? 'block' : 'hidden'}>
                <PlacesRecapView
                  onJumpToDay={(dayIdx) => {
                    setFocusDayIndex(dayIdx);
                    setActiveTab('itinerary');
                  }}
                />
              </div>
              {activeTab === 'expenses' && <ExpenseTracker />}
              {activeTab === 'bookings' && <BookingsView />}
              {activeTab === 'checklist' && <ChecklistView />}
            </div>
          )}
        </main>

        {activeTrip && <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />}
      </div>

      {joinNotification && (
        <div
          role="status"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-xs font-bold animate-in fade-in slide-in-from-top duration-200"
        >
          <span>{joinNotification}</span>
          <button
            type="button"
            onClick={clearJoinNotification}
            className="text-slate-400 hover:text-white dark:hover:text-slate-900 text-sm ml-2"
          >
            ✕
          </button>
        </div>
      )}

      <TripManagerModal open={tripManagerOpen} onClose={() => setTripManagerOpen(false)} />
      <TripEditModal open={tripEditOpen} onClose={() => setTripEditOpen(false)} />
      <QuickConverterModal open={converterOpen} onClose={() => setConverterOpen(false)} />
      <SettingsSyncModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <InviteJoinModal />
    </div>
  );
};

const AppRoot: React.FC = () => {
  const { user, authLoading } = useTrip();

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
          <img
            src="/icon.svg"
            alt="TripWise"
            width={56}
            height={56}
            className="w-14 h-14 rounded-2xl shadow-md"
          />
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-brand-600" aria-hidden="true" />
            <span>Caricamento TripWise...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthGate />;
  }

  return <AppShell />;
};

export default function App() {
  return (
    <TripProvider>
      <AppRoot />
    </TripProvider>
  );
}
