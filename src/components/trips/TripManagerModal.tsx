import React, { useState, useId } from 'react';
import {
  Plus,
  Copy,
  Check,
  Trash2,
  Users,
  Download,
  Upload,
  LogIn,
  Globe2,
  Sparkles,
  SlidersHorizontal,
  AlertTriangle,
  Camera,
  Image as ImageIcon,
  X,
  Loader2,
  GitMerge
} from 'lucide-react';
import { useTrip, getLocalTodayIso, type CreateTripInput } from '../../context/TripContext';
import type { TripData } from '../../types/trip';
import { pushTripToCloud } from '../../services/firebase';
import { DESTINATION_PRESETS, SUPPORTED_CURRENCIES } from '../../data/presets';
import { parseFlexibleAmount } from '../../utils/currency';
import { compressImageToDataUrl } from '../../utils/imageCompression';
import { ModalDialog } from '../ui/ModalDialog';
import { NaturalProgramComposer } from './NaturalProgramComposer';
import type { ParsedItineraryPlan } from '../../utils/naturalItineraryParser';

export const TripCreatorForm: React.FC<{ onCreated?: () => void }> = ({ onCreated }) => {
  const { createTrip } = useTrip();
  const idPrefix = useId();

  const todayIso = getLocalTodayIso(0);
  const weekLaterIso = getLocalTodayIso(6);

  const [creationMode, setCreationMode] = useState<'manual' | 'natural'>('manual');
  const [humanText, setHumanText] = useState<string>('');
  const [enrichFreeDays, setEnrichFreeDays] = useState(true);
  const [parsedPlan, setParsedPlan] = useState<ParsedItineraryPlan | null>(null);

  const [presetId, setPresetId] = useState<string>('custom');
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [emoji, setEmoji] = useState('🌍');
  const [coverImage, setCoverImage] = useState<string | undefined>(undefined);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState(weekLaterIso);
  const [baseCurrency, setBaseCurrency] = useState('EUR');
  const [destinationCurrency, setDestinationCurrency] = useState('EUR');
  const [rateDraft, setRateDraft] = useState('1');
  const [memberNames, setMemberNames] = useState<string[]>(['Io', 'Compagno di viaggio']);
  const [includeSamples, setIncludeSamples] = useState(true);

  // Sync natural language parsed plan into form values when in natural mode
  const handlePlanParsed = (plan: ParsedItineraryPlan | null) => {
    setParsedPlan(plan);
    if (plan) {
      if (!title || DESTINATION_PRESETS.some((dp) => title.includes(dp.name))) {
        setTitle(plan.suggestedTitle);
      }
      setDestination(plan.detectedDestination);
      setEmoji(plan.detectedEmoji);
      setPresetId(plan.detectedPresetId);
      setStartDate(plan.startDate);
      setEndDate(plan.endDate);
      setDestinationCurrency(plan.detectedCurrency);
      setRateDraft(String(plan.detectedExchangeRate));
    }
  };

  const selectedPreset =
    DESTINATION_PRESETS.find((p) => p.id === presetId) ?? DESTINATION_PRESETS[0];

  const handleSelectPreset = (id: string) => {
    setPresetId(id);
    const p = DESTINATION_PRESETS.find((item) => item.id === id);
    if (!p) return;
    setEmoji(p.emoji);
    if (p.coverImage) {
      setCoverImage(p.coverImage);
    }
    if (p.destination) {
      setDestination(p.destination);
      if (!title.trim() || DESTINATION_PRESETS.some((dp) => title.includes(dp.name))) {
        setTitle(`Viaggio in ${p.name}`);
      }
    }
    setDestinationCurrency(p.destinationCurrency);
    setRateDraft(String(p.defaultExchangeRateFromEur));
  };

  const handleDestCurrencyChange = (code: string) => {
    setDestinationCurrency(code);
    const info = SUPPORTED_CURRENCIES.find((c) => c.code === code);
    if (info && baseCurrency === 'EUR') {
      setRateDraft(String(info.defaultRateFromEur));
    }
  };

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
    const rate = parseFlexibleAmount(rateDraft);
    const isNatural = creationMode === 'natural' && parsedPlan;

    const payload: CreateTripInput = {
      title:
        title.trim() ||
        (isNatural ? parsedPlan.suggestedTitle : `Viaggio ${destination.trim() || 'TripWise'}`),
      destination:
        destination.trim() ||
        (isNatural ? parsedPlan.detectedDestination : selectedPreset.destination || 'Mondo'),
      emoji: isNatural ? emoji || parsedPlan.detectedEmoji : emoji,
      coverImage,
      presetId: isNatural ? parsedPlan.detectedPresetId : presetId,
      startDate: isNatural ? parsedPlan.startDate : startDate,
      endDate: isNatural
        ? parsedPlan.endDate
        : endDate >= startDate
          ? endDate
          : startDate,
      baseCurrency,
      destinationCurrency: isNatural ? parsedPlan.detectedCurrency : destinationCurrency,
      exchangeRate: rate > 0 ? rate : isNatural ? parsedPlan.detectedExchangeRate : 1,
      memberNames,
      includeSampleActivities: isNatural ? false : includeSamples,
      customDays: isNatural ? parsedPlan.days : undefined,
      defaultCenter: isNatural ? parsedPlan.defaultCenter : undefined
    };

    createTrip(payload);
    onCreated?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mode Switcher: Manual preset (default) vs Natural language text composer (accessory) */}
      <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
        <button
          type="button"
          onClick={() => setCreationMode('manual')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors ${
            creationMode === 'manual'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
          <span>📋 Configurazione manuale & Preset</span>
        </button>
        <button
          type="button"
          onClick={() => setCreationMode('natural')}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors ${
            creationMode === 'natural'
              ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-brand-500" aria-hidden="true" />
          <span>✨ Da testo o appunti (Accessorio)</span>
        </button>
      </div>

      {creationMode === 'natural' ? (
        <NaturalProgramComposer
          value={humanText}
          onChange={setHumanText}
          enrichFreeDays={enrichFreeDays}
          onEnrichFreeDaysChange={setEnrichFreeDays}
          onPlanParsed={handlePlanParsed}
        />
      ) : (
        /* Preset Picker (Hick's Law: 1-click smart defaults for any trip type) */
        <fieldset className="space-y-2">
          <legend className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            1. Scegli un Preset di partenza (oppure Destinazione Libera)
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DESTINATION_PRESETS.map((p) => {
              const active = presetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPreset(p.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                    active
                      ? 'border-brand-600 bg-brand-50/80 dark:bg-brand-950/50 ring-2 ring-brand-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="text-2xl shrink-0" aria-hidden="true">
                    {p.emoji}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">{p.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {p.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Core Trip Details */}
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
            Nome del viaggio *
          </label>
          <input
            id={`${idPrefix}-title`}
            name="title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Es. Estate in Portogallo, Giappone 2026..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
          />
        </div>
        <div className="sm:col-span-5">
          <label htmlFor={`${idPrefix}-dest`} className="block text-sm font-semibold mb-1">
            Paese / Destinazione *
          </label>
          <input
            id={`${idPrefix}-dest`}
            name="destination"
            type="text"
            required
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Es. Portogallo, Islanda, Giappone..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
          />
        </div>
      </div>

      {/* Cover Photo Upload (Optional) */}
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold">
          Foto di Copertina (Opzionale)
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
                  htmlFor={`${idPrefix}-creator-cover`}
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
                  <span>Rimuovi</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-1 sm:p-2">
              <div className="flex items-center gap-3 text-left w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-900 text-brand-600 dark:text-brand-300 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                    Aggiungi una foto di copertina
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Puoi caricarla ora oppure aggiungerla in qualsiasi momento
                  </div>
                </div>
              </div>
              <label
                htmlFor={`${idPrefix}-creator-cover`}
                className="w-full sm:w-auto min-h-[42px] px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-colors shrink-0"
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
            id={`${idPrefix}-creator-cover`}
            name="trip_creator_photo"
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

      {creationMode === 'manual' && (
        /* Dates (only shown in manual mode; natural mode infers them automatically) */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${idPrefix}-start`} className="block text-sm font-semibold mb-1">
              Data partenza
            </label>
            <input
              id={`${idPrefix}-start`}
              name="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
            />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-end`} className="block text-sm font-semibold mb-1">
              Data rientro
            </label>
            <input
              id={`${idPrefix}-end`}
              name="end_date"
              type="date"
              min={startDate}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
            />
          </div>
        </div>
      )}

      {/* Currencies */}
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
            onChange={(e) => handleDestCurrencyChange(e.target.value)}
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

      {/* Travel Companions */}
      <fieldset className="space-y-2">
        <div className="flex items-center justify-between">
          <legend className="text-sm font-semibold flex items-center gap-1.5">
            <Users className="w-4 h-4 text-brand-500" aria-hidden="true" />
            <span>Partecipanti (per divisione spese)</span>
          </legend>
          {memberNames.length < 6 && (
            <button
              type="button"
              onClick={() => setMemberNames([...memberNames, `Viaggiatore ${memberNames.length + 1}`])}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              + Aggiungi persona
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {memberNames.map((name, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <label htmlFor={`${idPrefix}-mem-${idx}`} className="visually-hidden">
                Nome partecipante {idx + 1}
              </label>
              <input
                id={`${idPrefix}-mem-${idx}`}
                name={`member_${idx}`}
                type="text"
                required
                value={name}
                onChange={(e) => {
                  const copy = [...memberNames];
                  copy[idx] = e.target.value;
                  setMemberNames(copy);
                }}
                placeholder={`Partecipante ${idx + 1}`}
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
              />
              {memberNames.length > 1 && (
                <button
                  type="button"
                  onClick={() => setMemberNames(memberNames.filter((_, i) => i !== idx))}
                  aria-label="Rimuovi partecipante"
                  className="p-2 text-slate-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}
        </div>
      </fieldset>

      {creationMode === 'manual' && selectedPreset.sampleActivities && (
        <label className="flex items-center gap-2.5 text-sm cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={includeSamples}
            onChange={(e) => setIncludeSamples(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span>Pre-carica tappe di esempio con mappa per il Giorno 1</span>
        </label>
      )}

      <button
        type="submit"
        className="w-full min-h-[52px] rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-base shadow-lg shadow-brand-600/20 inline-flex items-center justify-center gap-2 transition-colors"
      >
        {creationMode === 'natural' && parsedPlan ? (
          <>
            <Sparkles className="w-5 h-5" aria-hidden="true" />
            <span>
              Crea Viaggio con {parsedPlan.days.length}{' '}
              {parsedPlan.days.length === 1 ? 'giorno' : 'giorni'} in programma
            </span>
          </>
        ) : (
          <>
            <Globe2 className="w-5 h-5" aria-hidden="true" />
            <span>Crea Viaggio su TripWise</span>
          </>
        )}
      </button>
    </form>
  );
};

interface TripManagerModalProps {
  open: boolean;
  onClose: () => void;
}

export const TripManagerModal: React.FC<TripManagerModalProps> = ({ open, onClose }) => {
  const {
    trips,
    activeTrip,
    user,
    signInWithGoogle,
    selectTrip,
    deleteTrip,
    joinTripByCode,
    mergeTripByCode,
    exportActiveTripJson,
    importTripJson
  } = useTrip();

  const idPrefix = useId();
  const [tab, setTab] = useState<'list' | 'create' | 'join'>('list');
  const [joinCode, setJoinCode] = useState('');
  const [joinDisplayName, setJoinDisplayName] = useState<string>(() => user?.displayName || '');
  const [isJoining, setIsJoining] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [tripPendingDelete, setTripPendingDelete] = useState<TripData | null>(null);

  // Keep display name in sync if user changes or signs in
  React.useEffect(() => {
    if (user?.displayName && !joinDisplayName) {
      setJoinDisplayName(user.displayName);
    }
  }, [user?.displayName, joinDisplayName]);

  const handleClose = () => {
    setTripPendingDelete(null);
    setFeedback(null);
    onClose();
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsJoining(true);
    setFeedback(null);
    const chosenName = joinDisplayName.trim() || user?.displayName || '';
    const res = await joinTripByCode(joinCode, chosenName);
    setIsJoining(false);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setJoinCode('');
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1200);
    }
  };

  const handleMerge = async () => {
    if (!joinCode.trim()) return;
    setIsMerging(true);
    setFeedback(null);
    const res = await mergeTripByCode(joinCode);
    setIsMerging(false);
    setFeedback({ ok: res.ok, text: res.message });
    if (res.ok) {
      setJoinCode('');
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1500);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importTripJson(String(reader.result || ''));
      setFeedback({ ok: res.ok, text: res.message });
      if (res.ok) {
        setTimeout(() => {
          setFeedback(null);
          onClose();
        }, 900);
      }
    };
    reader.readAsText(file);
  };

  return (
    <ModalDialog
      open={open}
      onClose={handleClose}
      title="I tuoi Viaggi su TripWise"
      subtitle="Passa da un viaggio all’altro, creane uno nuovo o unisciti con codice invito"
      maxWidthClass={tab === 'create' ? 'max-w-3xl' : 'max-w-2xl'}
    >
      <div className="space-y-4">
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 gap-1">
          <button
            type="button"
            onClick={() => {
              setTab('list');
              setTripPendingDelete(null);
              setFeedback(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
              tab === 'list'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            I Miei Viaggi ({trips.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('create');
              setTripPendingDelete(null);
              setFeedback(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors ${
              tab === 'create'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Nuovo Viaggio</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('join');
              setTripPendingDelete(null);
              setFeedback(null);
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1 transition-colors ${
              tab === 'join'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Codice / Backup</span>
          </button>
        </div>

        {feedback && (
          <div
            role="status"
            aria-live="polite"
            className={`rounded-xl p-3 text-xs font-semibold ${
              feedback.ok
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200'
                : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200'
            }`}
          >
            {feedback.text}
          </div>
        )}

        {tab === 'list' && (
          <div className="space-y-3">
            {trips.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">
                Nessun viaggio presente. Clicca su "Nuovo Viaggio" per iniziare!
              </p>
            ) : (
              <ul className="space-y-2.5">
                {trips.map((t) => {
                  const isCurrent = activeTrip?.id === t.id;
                  const isPendingDelete = tripPendingDelete?.id === t.id;

                  if (isPendingDelete) {
                    return (
                      <li
                        key={t.id}
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
                                Eliminare "{t.title}"?
                              </span>
                              {t.coverImage ? (
                                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-red-200 dark:border-red-900 shadow-xs">
                                  <img src={t.coverImage} alt="" className="w-full h-full object-cover" />
                                </div>
                              ) : (
                                <span className="text-xl shrink-0" aria-hidden="true">
                                  {t.emoji}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-red-800 dark:text-red-300 mt-1.5 leading-relaxed font-medium">
                              Questa operazione è <strong>definitiva e irreversibile</strong>. Verranno cancellate tutte le tappe dell'itinerario ({t.days.length} {t.days.length === 1 ? 'giorno' : 'giorni'}), le spese registrate, i documenti e le checklist salvate.
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-red-200/80 dark:border-red-900/60">
                          <button
                            type="button"
                            onClick={() => setTripPendingDelete(null)}
                            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            Annulla
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              deleteTrip(t.id);
                              setTripPendingDelete(null);
                              setFeedback({ ok: true, text: `Viaggio "${t.title}" eliminato.` });
                              setTimeout(() => setFeedback(null), 3000);
                            }}
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
                          >
                            <Trash2 className="w-4 h-4" aria-hidden="true" />
                            <span>Sì, elimina definitivamente</span>
                          </button>
                        </div>
                      </li>
                    );
                  }

                  return (
                    <li
                      key={t.id}
                      className={`rounded-2xl p-4 border flex flex-wrap items-center justify-between gap-3 transition-all ${
                        isCurrent
                          ? 'border-brand-500 bg-brand-50/40 dark:bg-brand-950/30'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          selectTrip(t.id);
                          onClose();
                        }}
                        aria-current={isCurrent ? 'true' : undefined}
                        aria-selected={isCurrent}
                        className="flex items-center gap-3 text-left flex-1 min-w-0"
                      >
                        {t.coverImage ? (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs">
                            <img src={t.coverImage} alt="" className="w-full h-full object-cover" />
                            <span className="absolute bottom-0 right-0 text-[10px] bg-slate-900/80 text-white px-1 rounded-tl-md">
                              {t.emoji}
                            </span>
                          </div>
                        ) : (
                          <span className="text-3xl shrink-0" aria-hidden="true">
                            {t.emoji}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base line-clamp-2 break-words" title={t.title}>{t.title}</span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-brand-600 text-white shrink-0">
                                Attivo
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {t.destination} • {t.days.length} giorni • Valuta {t.destinationCurrency}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            if (user) {
                              pushTripToCloud(t).catch(() => {});
                            }
                            await navigator.clipboard.writeText(t.inviteCode);
                            setCopiedCode(t.id);
                            setTimeout(() => setCopiedCode(null), 1800);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold inline-flex items-center gap-1"
                        >
                          <span>{t.inviteCode}</span>
                          {copiedCode === t.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTripPendingDelete(t)}
                          aria-label={`Elimina viaggio ${t.title}`}
                          className="min-w-[40px] min-h-[40px] p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 inline-flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {activeTrip && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 justify-between items-center">
                <span className="text-xs text-slate-500">
                  Salva una copia di sicurezza sul dispositivo:
                </span>
                <button
                  type="button"
                  onClick={exportActiveTripJson}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Scarica copia offline</span>
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'create' && <TripCreatorForm onCreated={onClose} />}

        {tab === 'join' && (
          <div className="space-y-5">
            {!user && (
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-2">
                <p className="font-semibold leading-relaxed">
                  Per collaborare con il tuo compagno e sincronizzare l'itinerario in tempo reale, ti consigliamo di accedere con il tuo account Google.
                </p>
                <button
                  type="button"
                  onClick={signInWithGoogle}
                  className="min-h-[42px] px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold text-xs inline-flex items-center gap-2 shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5 text-brand-600" aria-hidden="true" />
                  <span>Accedi con Google</span>
                </button>
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-3">
              <div className="space-y-3">
                <div>
                  <label htmlFor={`${idPrefix}-join`} className="block text-sm font-bold mb-1">
                    Codice Invito o Link
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Inserisci il codice o incolla il link ricevuto (es. <code>TW-GIAP-9X2A</code>) per accedere all'itinerario condiviso.
                  </p>
                  <input
                    id={`${idPrefix}-join`}
                    name="invite_code"
                    type="text"
                    required
                    autoCorrect="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="TW-XXXX-XXXX oppure incolla il link..."
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 font-mono uppercase font-bold text-sm"
                  />
                </div>

                <div>
                  <label htmlFor={`${idPrefix}-join-name`} className="block text-sm font-bold mb-1">
                    Nome con cui gli altri ti vedranno
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    Come vuoi apparire ai tuoi compagni di viaggio nelle spese condivise e nelle tappe.
                  </p>
                  <input
                    id={`${idPrefix}-join-name`}
                    name="join_display_name"
                    type="text"
                    value={joinDisplayName}
                    onChange={(e) => setJoinDisplayName(e.target.value)}
                    placeholder={user?.displayName || "Es. Marco, Giulia, Papà..."}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 font-semibold text-sm"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isJoining || isMerging}
                    className="flex-1 min-h-[48px] px-5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-sm transition-colors"
                  >
                    <Users className="w-4 h-4" aria-hidden="true" />
                    <span>{isJoining ? 'Unione in corso...' : 'Unisciti al Viaggio'}</span>
                  </button>
                  {activeTrip && (
                    <button
                      type="button"
                      onClick={handleMerge}
                      disabled={isJoining || isMerging || !joinCode.trim()}
                      title="Combina tutte le spese, i documenti e le tappe del codice inserito nel viaggio corrente senza perdere nulla."
                      className="min-h-[48px] px-4 rounded-xl border border-brand-300 dark:border-brand-800 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition-colors shrink-0 disabled:opacity-50"
                    >
                      <GitMerge className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>{isMerging ? 'Unione...' : 'Unisci Dati'}</span>
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-sm font-bold">Oppure apri una copia salvata</div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Puoi caricare un viaggio ricevuto tramite file anche quando sei completamente offline.
              </p>
              <label
                htmlFor={`${idPrefix}-import`}
                className="min-h-[48px] px-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 inline-flex items-center gap-2 text-sm font-semibold cursor-pointer hover:border-brand-500"
              >
                <Upload className="w-4 h-4 text-brand-500" aria-hidden="true" />
                <span>Seleziona file del viaggio</span>
              </label>
              <input
                id={`${idPrefix}-import`}
                type="file"
                accept="application/json,.json"
                onChange={handleImportFile}
                className="visually-hidden"
              />
            </div>
          </div>
        )}
      </div>
    </ModalDialog>
  );
};
