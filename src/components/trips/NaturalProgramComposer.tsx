import React, { useEffect, useId, useMemo, useState } from 'react';
import {
  Sparkles,
  CalendarRange,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Wand2
} from 'lucide-react';
import {
  EXAMPLE_HUMAN_ITINERARY_TEXT,
  parseNaturalLanguageItinerary,
  type ParsedItineraryPlan
} from '../../utils/naturalItineraryParser';
import { PLACE_CATEGORY_META } from '../../data/placeCategories';

interface NaturalProgramComposerProps {
  value: string;
  onChange: (nextText: string) => void;
  enrichFreeDays: boolean;
  onEnrichFreeDaysChange: (next: boolean) => void;
  referenceYear?: number;
  onPlanParsed?: (plan: ParsedItineraryPlan | null) => void;
}

export const NaturalProgramComposer: React.FC<NaturalProgramComposerProps> = ({
  value,
  onChange,
  enrichFreeDays,
  onEnrichFreeDaysChange,
  referenceYear,
  onPlanParsed
}) => {
  const idPrefix = useId();
  const [showAllPreviewDays, setShowAllPreviewDays] = useState(false);

  const parsedPlan = useMemo<ParsedItineraryPlan | null>(() => {
    if (!value.trim()) return null;
    const plan = parseNaturalLanguageItinerary(value, {
      referenceYear,
      enrichFreeDays
    });
    return plan.isValid ? plan : null;
  }, [value, referenceYear, enrichFreeDays]);

  useEffect(() => {
    onPlanParsed?.(parsedPlan);
  }, [parsedPlan, onPlanParsed]);

  const visibleDays = useMemo(() => {
    if (!parsedPlan) return [];
    return showAllPreviewDays ? parsedPlan.days : parsedPlan.days.slice(0, 4);
  }, [parsedPlan, showAllPreviewDays]);

  return (
    <div className="space-y-3.5">
      {/* Input Region (Gestalt Common Region + Postel's Law forgiving natural-language input) */}
      <div className="rounded-2xl bg-gradient-to-br from-brand-50/80 via-indigo-50/40 to-sky-50/50 dark:from-brand-950/40 dark:via-slate-900 dark:to-slate-900 p-4 border border-brand-200/80 dark:border-brand-900/70 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor={`${idPrefix}-human-input`}
            className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" aria-hidden="true" />
            <span>Scrivi o incolla il tuo programma in linguaggio naturale</span>
          </label>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onChange(EXAMPLE_HUMAN_ITINERARY_TEXT)}
              className="min-h-[38px] px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-brand-200 dark:border-brand-800 hover:border-brand-500 text-brand-700 dark:text-brand-300 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Prova esempio (Giappone 16gg)</span>
            </button>
            {value.trim().length > 0 && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="min-h-[38px] px-2.5 py-1 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-white/70 dark:hover:bg-slate-800 text-xs font-semibold inline-flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Svuota</span>
              </button>
            )}
          </div>
        </div>

        <p
          id={`${idPrefix}-human-hint`}
          className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed"
        >
          Scrivi liberamente date singole (<code>22/11</code>), periodi (<code>28/11-02/12: Kyoto</code>), orari (<code>ore 08:30</code>, <code>presto la mattina</code>, <code>pomeriggio/sera</code>), gite tra parentesi e spostamenti: TripWise creerà giornate, orari e pin sulla mappa in automatico.
        </p>

        <textarea
          id={`${idPrefix}-human-input`}
          name="human_itinerary"
          rows={7}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-describedby={`${idPrefix}-human-hint`}
          placeholder={`Esempio:\n- 22/11: arrivo a Tokyo ore 12.50\n- 22-27/11: TOKYO (24/11 Kamakura, 25/11 ore 08:30 teamLab Planets)\n- 28/11-02/12: Kyoto (vedere presto la mattina Fushimi Inari, Arashiyama; gita a Nara)`}
          className="auto-grow-textarea rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3.5 text-sm leading-relaxed shadow-inner focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />

        <label className="flex items-start sm:items-center gap-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer pt-0.5">
          <input
            type="checkbox"
            name="enrich_free_days"
            checked={enrichFreeDays}
            onChange={(e) => onEnrichFreeDaysChange(e.target.checked)}
            className="w-4 h-4 mt-0.5 sm:mt-0 rounded shrink-0"
          />
          <span>
            Completa automaticamente le mezze giornate o giornate libere con tappe consigliate della città
          </span>
        </label>
      </div>

      {/* Instant Live Preview (<50ms Doherty Threshold + Miller's Law chunked cards) */}
      {parsedPlan && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/70 p-4 shadow-sm space-y-3">
          <div
            role="status"
            aria-live="polite"
            className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">
                {parsedPlan.detectedEmoji}
              </span>
              <div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                  Anteprima programma pronto: {parsedPlan.days.length}{' '}
                  {parsedPlan.days.length === 1 ? 'giornata' : 'giornate'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="inline-flex items-center gap-1">
                    <CalendarRange className="w-3.5 h-3.5 text-brand-500" aria-hidden="true" />
                    {new Date(`${parsedPlan.startDate}T00:00:00`).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'short'
                    })}{' '}
                    –{' '}
                    {new Date(`${parsedPlan.endDate}T00:00:00`).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                  <span>•</span>
                  <span>{parsedPlan.totalActivities} tappe organizzate</span>
                  <span>•</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    {parsedPlan.geocodedCount > 0
                      ? `${parsedPlan.geocodedCount} già su mappa (+ ricerca automatica)`
                      : 'Posizionamento automatico su mappa'}
                  </span>
                </div>
              </div>
            </div>

            {parsedPlan.days.length > 4 && (
              <button
                type="button"
                onClick={() => setShowAllPreviewDays((v) => !v)}
                aria-expanded={showAllPreviewDays}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold inline-flex items-center gap-1 transition-colors"
              >
                {showAllPreviewDays ? (
                  <>
                    <span>Compatta anteprima</span>
                    <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
                  </>
                ) : (
                  <>
                    <span>Mostra tutti i {parsedPlan.days.length} giorni</span>
                    <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                  </>
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-0.5">
            {visibleDays.map((day) => {
              const dateLabel = day.date
                ? new Date(`${day.date}T00:00:00`).toLocaleDateString('it-IT', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short'
                  })
                : '';
              return (
                <div
                  key={day.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      Giorno {day.dayNumber} • {dateLabel}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {day.activities.length} {day.activities.length === 1 ? 'tappa' : 'tappe'}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {day.title}
                  </div>
                  <ul className="space-y-1 pt-0.5">
                    {day.activities.map((act) => {
                      const catMeta =
                        PLACE_CATEGORY_META[act.category] || PLACE_CATEGORY_META.sightseeing;
                      return (
                        <li
                          key={act.id}
                          className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5"
                        >
                          {act.time && (
                            <span className="font-mono font-bold text-[11px] text-slate-500 dark:text-slate-400 shrink-0 mt-0.5 inline-flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" aria-hidden="true" />
                              {act.time}
                            </span>
                          )}
                          <span className="truncate flex-1 font-medium">{act.title}</span>
                          {typeof act.lat === 'number' && (
                            <MapPin
                              className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5"
                              aria-label={catMeta.label}
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          {!showAllPreviewDays && parsedPlan.days.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllPreviewDays(true)}
              className="w-full py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-brand-600 dark:text-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              + Visualizza anche i restanti {parsedPlan.days.length - 4} giorni nell’anteprima
            </button>
          )}
        </div>
      )}
    </div>
  );
};
