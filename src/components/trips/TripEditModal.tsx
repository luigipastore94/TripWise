import React, { useState, useEffect, useId } from 'react';
import { CalendarRange, Check, Trash2, AlertTriangle, Camera, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { ModalDialog } from '../ui/ModalDialog';
import { useTrip } from '../../context/TripContext';
import { SUPPORTED_CURRENCIES } from '../../data/presets';
import { parseFlexibleAmount } from '../../utils/currency';
import { compressImageToDataUrl } from '../../utils/imageCompression';

interface TripEditModalProps {
  open: boolean;
  onClose: () => void;
}

export const TripEditModal: React.FC<TripEditModalProps> = ({ open, onClose }) => {
  const { activeTrip, updateTripDatesAndDetails, deleteTrip } = useTrip();
  const idPrefix = useId();

  const [emoji, setEmoji] = useState('🌍');
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('EUR');
  const [destinationCurrency, setDestinationCurrency] = useState('EUR');
  const [rateDraft, setRateDraft] = useState('1');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (activeTrip && open) {
      setEmoji(activeTrip.emoji);
      setTitle(activeTrip.title);
      setDestination(activeTrip.destination);
      setCoverImage(activeTrip.coverImage);
      setPhotoError(null);
      setStartDate(activeTrip.startDate);
      setEndDate(activeTrip.endDate);
      setBaseCurrency(activeTrip.baseCurrency);
      setDestinationCurrency(activeTrip.destinationCurrency);
      setRateDraft(String(activeTrip.exchangeRate));
      setConfirmDelete(false);
    }
  }, [activeTrip, open]);

  if (!activeTrip) return null;

  const previewDaysCount = (() => {
    if (!startDate || !endDate || endDate < startDate) return 1;
    const s = new Date(`${startDate}T00:00:00`).getTime();
    const e = new Date(`${endDate}T00:00:00`).getTime();
    return Math.min(Math.max(Math.floor((e - s) / 86400000) + 1, 1), 60);
  })();

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    setPhotoError(null);
    try {
      const compressed = await compressImageToDataUrl(file, 1280, 0.82);
      setCoverImage(compressed);
    } catch (err: unknown) {
      setPhotoError(err instanceof Error ? err.message : 'Impossibile caricare l\'immagine.');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRate = parseFlexibleAmount(rateDraft);
    updateTripDatesAndDetails({
      emoji,
      title,
      destination,
      coverImage,
      startDate,
      endDate: endDate >= startDate ? endDate : startDate,
      baseCurrency,
      destinationCurrency,
      exchangeRate: parsedRate > 0 ? parsedRate : 1
    });
    onClose();
  };

  const handleClose = () => {
    setConfirmDelete(false);
    onClose();
  };

  return (
    <ModalDialog
      open={open}
      onClose={handleClose}
      title="Modifica Date e Dettagli Viaggio"
      subtitle="Aggiorna le date di partenza/rientro, il nome del viaggio o le valute mantenendo le tappe inserite"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-2">
            <label htmlFor={`${idPrefix}-emoji`} className="block text-sm font-semibold mb-1">
              Icona
            </label>
            <input
              id={`${idPrefix}-emoji`}
              name="emoji"
              type="text"
              maxLength={4}
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-center text-xl"
            />
          </div>
          <div className="sm:col-span-5">
            <label htmlFor={`${idPrefix}-title`} className="block text-sm font-semibold mb-1">
              Nome viaggio *
            </label>
            <input
              id={`${idPrefix}-title`}
              name="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
            />
          </div>
          <div className="sm:col-span-5">
            <label htmlFor={`${idPrefix}-dest`} className="block text-sm font-semibold mb-1">
              Destinazione *
            </label>
            <input
              id={`${idPrefix}-dest`}
              name="destination"
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
            />
          </div>
        </div>

        {/* Foto di copertina del viaggio (Jakob's Law & Fitts's Law) */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold">
            Foto di Copertina
          </label>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
            {coverImage ? (
              <div className="relative rounded-xl overflow-hidden aspect-[16/7] sm:aspect-[21/8] bg-slate-200 dark:bg-slate-800 shadow-inner">
                <img
                  src={coverImage}
                  alt="Copertina del viaggio"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2">
                  <label
                    htmlFor={`${idPrefix}-cover-input`}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 hover:bg-white text-slate-800 dark:text-slate-100 text-xs font-bold inline-flex items-center gap-1.5 shadow-md backdrop-blur-xs cursor-pointer transition-colors"
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
                    onClick={() => setCoverImage(undefined)}
                    aria-label="Rimuovi foto di copertina"
                    className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md backdrop-blur-xs transition-colors"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                    <span>Rimuovi foto</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-1 sm:p-2">
                <div className="flex items-center gap-3 text-left w-full sm:w-auto">
                  <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900 text-brand-600 dark:text-brand-300 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Personalizza con una foto
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Carica un'immagine per la copertina dell'itinerario
                    </div>
                  </div>
                </div>
                <label
                  htmlFor={`${idPrefix}-cover-input`}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors shrink-0"
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Camera className="w-4 h-4" aria-hidden="true" />
                  )}
                  <span>{isUploadingPhoto ? 'Ottimizzazione...' : 'Carica foto'}</span>
                </label>
              </div>
            )}
            <input
              id={`${idPrefix}-cover-input`}
              name="trip_cover_photo"
              type="file"
              accept="image/*"
              onChange={handlePhotoFileChange}
              className="visually-hidden"
            />
            {photoError && (
              <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-2 px-1">
                {photoError}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-brand-50/60 dark:bg-brand-950/30 p-4 border border-brand-200 dark:border-brand-900 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 flex items-center gap-1.5">
              <CalendarRange className="w-4 h-4" aria-hidden="true" />
              <span>Date del Viaggio</span>
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-600 text-white">
              {previewDaysCount} {previewDaysCount === 1 ? 'giorno' : 'giorni'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${idPrefix}-start`} className="block text-sm font-semibold mb-1">
                Partenza *
              </label>
              <input
                id={`${idPrefix}-start`}
                name="start_date"
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate && e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
              />
            </div>
            <div>
              <label htmlFor={`${idPrefix}-end`} className="block text-sm font-semibold mb-1">
                Rientro *
              </label>
              <input
                id={`${idPrefix}-end`}
                name="end_date"
                type="date"
                required
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
              />
            </div>
          </div>

          {previewDaysCount < activeTrip.days.length && (
            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
              Nota: riducendo la durata da {activeTrip.days.length} a {previewDaysCount} giorni, le giornate oltre il Giorno {previewDaysCount} verranno rimosse.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label htmlFor={`${idPrefix}-base`} className="block text-sm font-semibold mb-1">
              Valuta Base
            </label>
            <select
              id={`${idPrefix}-base`}
              name="base_currency"
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 font-semibold"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${idPrefix}-destcurr`} className="block text-sm font-semibold mb-1">
              Valuta Locale
            </label>
            <select
              id={`${idPrefix}-destcurr`}
              name="dest_currency"
              value={destinationCurrency}
              onChange={(e) => {
                const code = e.target.value;
                setDestinationCurrency(code);
                const info = SUPPORTED_CURRENCIES.find((c) => c.code === code);
                if (info && baseCurrency === 'EUR') {
                  setRateDraft(String(info.defaultRateFromEur));
                }
              }}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 font-semibold"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${idPrefix}-rate`} className="block text-sm font-semibold mb-1">
              Cambio (1 {baseCurrency} =)
            </label>
            <input
              id={`${idPrefix}-rate`}
              name="exchange_rate"
              type="text"
              inputMode="decimal"
              value={rateDraft}
              onChange={(e) => setRateDraft(e.target.value)}
              disabled={baseCurrency === destinationCurrency}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 font-semibold disabled:opacity-50"
            />
          </div>
        </div>

        {confirmDelete ? (
          <div
            role="alert"
            className="rounded-2xl p-4 sm:p-5 border-2 border-red-500/80 bg-red-50/90 dark:bg-red-950/40 text-slate-900 dark:text-slate-100 shadow-md space-y-3 transition-all animate-in fade-in duration-200"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-red-950 dark:text-red-100">
                    Eliminare "{activeTrip.title}"?
                  </span>
                  <span className="text-xl shrink-0" aria-hidden="true">
                    {activeTrip.emoji}
                  </span>
                </div>
                <p className="text-xs text-red-800 dark:text-red-300 mt-1.5 leading-relaxed font-medium">
                  Questa operazione è <strong>definitiva e irreversibile</strong>. Verranno cancellate tutte le tappe dell'itinerario ({activeTrip.days.length} {activeTrip.days.length === 1 ? 'giorno' : 'giorni'}), le spese registrate, i documenti e le checklist salvate.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-red-200/80 dark:border-red-900/60">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTrip(activeTrip.id);
                  setConfirmDelete(false);
                  onClose();
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                <span>Sì, elimina definitivamente</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>Elimina questo viaggio</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[48px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="min-h-[48px] px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm inline-flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>Salva Modifiche</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </ModalDialog>
  );
};
