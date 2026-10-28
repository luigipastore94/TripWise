import React, { useState, useEffect, useId } from 'react';
import { ArrowUpDown, RefreshCw, Check } from 'lucide-react';
import { ModalDialog } from '../ui/ModalDialog';
import { useTrip } from '../../context/TripContext';
import {
  parseFlexibleAmount,
  formatMoney,
  convertToBase,
  convertFromBase
} from '../../utils/currency';

interface QuickConverterModalProps {
  open: boolean;
  onClose: () => void;
}

export const QuickConverterModal: React.FC<QuickConverterModalProps> = ({ open, onClose }) => {
  const { activeTrip, updateTripMeta, isOnline } = useTrip();
  const idPrefix = useId();

  const [direction, setDirection] = useState<'destToBase' | 'baseToDest'>('destToBase');
  const [rawInput, setRawInput] = useState('1000');
  const [rateDraft, setRateDraft] = useState('');
  const [fetchingLive, setFetchingLive] = useState(false);
  const [rateSavedToast, setRateSavedToast] = useState(false);

  useEffect(() => {
    if (activeTrip) {
      setRateDraft(String(activeTrip.exchangeRate));
      setRawInput(activeTrip.exchangeRate > 30 ? '1000' : '25');
    }
  }, [activeTrip?.id, activeTrip?.exchangeRate]);

  if (!activeTrip) return null;

  const { baseCurrency, destinationCurrency, exchangeRate } = activeTrip;
  const sameCurrency = baseCurrency.toUpperCase() === destinationCurrency.toUpperCase();

  const numericInput = parseFlexibleAmount(rawInput);
  const convertedValue =
    direction === 'destToBase'
      ? convertToBase(numericInput, destinationCurrency, baseCurrency, exchangeRate)
      : convertFromBase(numericInput, destinationCurrency, baseCurrency, exchangeRate);

  const fromCurr = direction === 'destToBase' ? destinationCurrency : baseCurrency;
  const toCurr = direction === 'destToBase' ? baseCurrency : destinationCurrency;

  const quickChips =
    fromCurr === 'JPY' || fromCurr === 'KRW' || fromCurr === 'ISK'
      ? [500, 1000, 2500, 5000, 10000]
      : [10, 25, 50, 100, 250];

  const handleSaveManualRate = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFlexibleAmount(rateDraft);
    if (parsed > 0) {
      updateTripMeta({ exchangeRate: parsed });
      setRateSavedToast(true);
      setTimeout(() => setRateSavedToast(false), 2000);
    }
  };

  const handleFetchLiveRate = async () => {
    if (sameCurrency) return;
    setFetchingLive(true);
    try {
      const res = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
      if (res.ok) {
        const data = (await res.json()) as { rates?: Record<string, number> };
        const liveRate = data.rates?.[destinationCurrency];
        if (typeof liveRate === 'number' && liveRate > 0) {
          const rounded = Math.round(liveRate * 10000) / 10000;
          setRateDraft(String(rounded));
          updateTripMeta({ exchangeRate: rounded });
          setRateSavedToast(true);
          setTimeout(() => setRateSavedToast(false), 2000);
        }
      }
    } catch {
      // Offline: silently keep cached offline rate
    } finally {
      setFetchingLive(false);
    }
  };

  return (
    <ModalDialog
      open={open}
      onClose={onClose}
      title="Convertitore Valuta Rapido"
      subtitle="Funziona al 100% anche offline con il tasso salvato sul dispositivo"
    >
      <div className="space-y-4">
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 p-4 border border-slate-200 dark:border-slate-700 space-y-3">
          <div>
            <label
              htmlFor={`${idPrefix}-amt`}
              className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1"
            >
              Importo in {fromCurr}
            </label>
            <input
              id={`${idPrefix}-amt`}
              name="converter_amount"
              type="text"
              inputMode="decimal"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="0"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 text-xl font-extrabold"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {quickChips.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setRawInput(String(val))}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:border-brand-500 transition-colors"
              >
                {val.toLocaleString('it-IT')} {fromCurr}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center py-1">
            <button
              type="button"
              onClick={() =>
                setDirection((d) => (d === 'destToBase' ? 'baseToDest' : 'destToBase'))
              }
              className="min-h-[44px] px-4 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-semibold text-xs inline-flex items-center gap-1.5 border border-brand-200 dark:border-brand-800"
            >
              <ArrowUpDown className="w-4 h-4" aria-hidden="true" />
              <span>Inverti ({fromCurr} ⇄ {toCurr})</span>
            </button>
          </div>

          <div className="rounded-xl bg-brand-600 text-white p-4 text-center shadow-md">
            <div className="text-xs uppercase tracking-wider opacity-85 font-semibold">
              Risultato in {toCurr}
            </div>
            <div className="text-3xl font-black mt-0.5 tracking-tight">
              {formatMoney(convertedValue, toCurr)}
            </div>
          </div>
        </div>

        {!sameCurrency && (
          <form
            onSubmit={handleSaveManualRate}
            className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2.5"
          >
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={`${idPrefix}-rate`} className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Tasso applicato: 1 {baseCurrency} = {destinationCurrency}
              </label>
              {isOnline && (
                <button
                  type="button"
                  onClick={handleFetchLiveRate}
                  disabled={fetchingLive}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 inline-flex items-center gap-1 hover:underline"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${fetchingLive ? 'animate-spin' : ''}`}
                    aria-hidden="true"
                  />
                  <span>Aggiorna cambio live</span>
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <input
                id={`${idPrefix}-rate`}
                name="exchange_rate"
                type="text"
                inputMode="decimal"
                value={rateDraft}
                onChange={(e) => setRateDraft(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm font-semibold"
              />
              <button
                type="submit"
                className="min-h-[48px] px-4 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold inline-flex items-center gap-1"
              >
                {rateSavedToast ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    <span>Salvato</span>
                  </>
                ) : (
                  <span>Salva tasso</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </ModalDialog>
  );
};
