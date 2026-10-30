import React, { useState, useId } from 'react';
import {
  Plus,
  Wallet,
  ArrowRight,
  Trash2,
  Pencil,
  Utensils,
  Train,
  BedDouble,
  ShoppingBag,
  Ticket,
  MoreHorizontal,
  CheckCircle2,
  Loader2,
  CloudOff
} from 'lucide-react';
import { useTrip, getLocalTodayIso } from '../../context/TripContext';
import type { Expense, ExpenseCategory } from '../../types/trip';
import { calculateTripBalances } from '../../utils/split';
import {
  formatMoney,
  parseFlexibleAmount,
  convertToBase,
  convertFromBase
} from '../../utils/currency';
import { ModalDialog } from '../ui/ModalDialog';

const EXPENSE_CATEGORIES: Record<
  ExpenseCategory,
  { label: string; color: string; Icon: React.FC<{ className?: string }> }
> = {
  food: { label: 'Cibo & Bevande', color: '#f97316', Icon: Utensils },
  transport: { label: 'Trasporti', color: '#0ea5e9', Icon: Train },
  lodging: { label: 'Alloggi', color: '#8b5cf6', Icon: BedDouble },
  shopping: { label: 'Shopping', color: '#ec4899', Icon: ShoppingBag },
  activity: { label: 'Biglietti & Svago', color: '#4f46e5', Icon: Ticket },
  other: { label: 'Altro', color: '#64748b', Icon: MoreHorizontal }
};

export const ExpenseTracker: React.FC = () => {
  const { activeTrip, user, isOnline, pendingExpenseIds, upsertExpense, deleteExpense } = useTrip();
  const idPrefix = useId();
  const pendingSet = new Set(pendingExpenseIds);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [rawAmount, setRawAmount] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [paidBy, setPaidBy] = useState('');
  const [splitIds, setSplitIds] = useState<string[]>([]);
  const [date, setDate] = useState(() => getLocalTodayIso(0));
  const [notes, setNotes] = useState('');

  if (!activeTrip) return null;

  const { baseCurrency, destinationCurrency, exchangeRate, members, expenses } = activeTrip;
  const sameCurrency = baseCurrency.toUpperCase() === destinationCurrency.toUpperCase();

  const { balances, settlements, totalSpentInBase } = calculateTripBalances(expenses, members);
  const totalSpentInDest = convertFromBase(
    totalSpentInBase,
    destinationCurrency,
    baseCurrency,
    exchangeRate
  );

  // Category breakdown
  const categoryTotals = Object.keys(EXPENSE_CATEGORIES).map((catKey) => {
    const cat = catKey as ExpenseCategory;
    const sum = expenses
      .filter((e) => e.category === cat)
      .reduce((acc, cur) => acc + cur.amountInBase, 0);
    return { category: cat, sum };
  });

  const getMemberName = (id: string) => members.find((m) => m.id === id)?.name ?? 'Partecipante';
  const getMemberColor = (id: string) => members.find((m) => m.id === id)?.color ?? '#4f46e5';

  const openAddModal = () => {
    setEditingExpense(null);
    setTitle('');
    setRawAmount('');
    setCurrency(destinationCurrency);
    setCategory('food');
    const matchingUserMember = user?.uid ? members.find((m) => m.uid === user.uid) : undefined;
    setPaidBy(matchingUserMember?.id ?? members[0]?.id ?? '');
    setSplitIds(members.map((m) => m.id));
    setDate(getLocalTodayIso(0));
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setRawAmount(String(exp.amount));
    setCurrency(exp.currency);
    setCategory(exp.category);
    setPaidBy(exp.paidByMemberId);
    setSplitIds(exp.splitBetweenMemberIds.length > 0 ? exp.splitBetweenMemberIds : members.map((m) => m.id));
    setDate(exp.date);
    setNotes(exp.notes || '');
    setModalOpen(true);
  };

  const toggleSplitMember = (memberId: string) => {
    setSplitIds((prev) => {
      if (prev.includes(memberId)) {
        if (prev.length === 1) return prev; // Keep at least 1 person
        return prev.filter((id) => id !== memberId);
      }
      return [...prev, memberId];
    });
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = parseFlexibleAmount(rawAmount);
    if (!title.trim() || numeric <= 0) return;

    const inBase = convertToBase(numeric, currency, baseCurrency, exchangeRate);

    const payload: Expense = {
      id: editingExpense?.id ?? `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      amount: numeric,
      currency,
      amountInBase: Math.round(inBase * 100) / 100,
      paidByMemberId: paidBy || members[0]?.id || '',
      splitBetweenMemberIds: splitIds.length > 0 ? splitIds : members.map((m) => m.id),
      category,
      date,
      notes: notes.trim() || undefined
    };

    upsertExpense(payload);
    setModalOpen(false);
  };

  const previewAmount = parseFlexibleAmount(rawAmount);
  const previewInBase = convertToBase(previewAmount, currency, baseCurrency, exchangeRate);

  return (
    <section aria-label="Spese e Bilancio Condiviso" className="space-y-4">
      {/* Top Summary & Split Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Spent Card */}
        <div className="rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-800 text-white p-5 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">
              Totale Spese Viaggio
            </span>
            <Wallet className="w-5 h-5 text-indigo-200" aria-hidden="true" />
          </div>
          <div className="text-3xl font-black mt-2 tracking-tight">
            {formatMoney(totalSpentInBase, baseCurrency)}
          </div>
          {!sameCurrency && (
            <div className="text-sm font-medium text-indigo-100 mt-1">
              ≈ {formatMoney(totalSpentInDest, destinationCurrency)} (1 {baseCurrency} = {exchangeRate}{' '}
              {destinationCurrency})
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap gap-3 text-xs">
            {balances.map((b) => (
              <div key={b.memberId} className="bg-white/10 rounded-lg px-2.5 py-1">
                <span className="opacity-85">{getMemberName(b.memberId)} ha anticipato: </span>
                <strong>{formatMoney(b.paidInBase, baseCurrency)}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Settlement ("Chi deve a chi") Card */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Pareggio Conti ("Chi deve a chi")
            </h2>
            {expenses.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">
                Aggiungi le spese sostenute durante il viaggio per calcolare in automatico le quote.
              </p>
            ) : settlements.length === 0 ? (
              <div className="mt-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle2 className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>Siete perfettamente in pari!</span>
              </div>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {settlements.map((s, idx) => (
                  <li
                    key={`${s.fromMemberId}-${s.toMemberId}-${idx}`}
                    className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/70 px-3.5 py-2.5 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold flex-wrap">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: getMemberColor(s.fromMemberId) }}
                      />
                      <span>{getMemberName(s.fromMemberId)}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: getMemberColor(s.toMemberId) }}
                      />
                      <span>{getMemberName(s.toMemberId)}</span>
                    </div>
                    <span className="text-base font-black text-brand-600 dark:text-brand-400">
                      {formatMoney(s.amountInBase, baseCurrency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="mt-4 w-full min-h-[48px] rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm inline-flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" aria-hidden="true" />
            <span>Registra Nuova Spesa</span>
          </button>
        </div>
      </div>

      {/* Category Distribution Bar */}
      {totalSpentInBase > 0 && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ripartizione per Categoria
          </h3>
          <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
            {categoryTotals
              .filter((c) => c.sum > 0)
              .map((c) => {
                const pct = (c.sum / totalSpentInBase) * 100;
                return (
                  <div
                    key={c.category}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: EXPENSE_CATEGORIES[c.category].color
                    }}
                    title={`${EXPENSE_CATEGORIES[c.category].label}: ${formatMoney(c.sum, baseCurrency)}`}
                  />
                );
              })}
          </div>
          <div className="flex flex-wrap gap-3">
            {categoryTotals
              .filter((c) => c.sum > 0)
              .map((c) => (
                <div key={c.category} className="inline-flex items-center gap-1.5 text-xs">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: EXPENSE_CATEGORIES[c.category].color }}
                  />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    {EXPENSE_CATEGORIES[c.category].label}:
                  </span>
                  <strong className="text-slate-900 dark:text-slate-100">
                    {formatMoney(c.sum, baseCurrency)}
                  </strong>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Expenses List */}
      {expenses.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white/60 dark:bg-slate-900/50">
          <Wallet className="w-10 h-10 mx-auto text-brand-500 mb-2" aria-hidden="true" />
          <h3 className="text-base font-bold">Nessuna spesa ancora registrata</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Inserisci spese in {destinationCurrency} o {baseCurrency}: TripWise calcola il cambio e divide automaticamente le quote tra i viaggiatori.
          </p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {expenses.map((exp) => {
            const catMeta = EXPENSE_CATEGORIES[exp.category] || EXPENSE_CATEGORIES.other;
            const CatIcon = catMeta.Icon;
            const isForeign = exp.currency.toUpperCase() !== baseCurrency.toUpperCase();
            const isPendingSync = Boolean(user) && pendingSet.has(exp.id);

            return (
              <li
                key={exp.id}
                className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{ backgroundColor: catMeta.color }}
                  >
                    <CatIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <h3 className="text-sm sm:text-base font-bold truncate">{exp.title}</h3>
                      {isPendingSync && (
                        isOnline ? (
                          <span
                            title="Sincronizzazione con il cloud in corso..."
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 shrink-0"
                          >
                            <Loader2 className="w-2.5 h-2.5 animate-spin" aria-hidden="true" />
                            <span>Invio...</span>
                          </span>
                        ) : (
                          <span
                            title="Salvata sul dispositivo. Verrà inviata appena torna la connessione."
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 shrink-0"
                          >
                            <CloudOff className="w-2.5 h-2.5" aria-hidden="true" />
                            <span>In coda</span>
                          </span>
                        )
                      )}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span>
                        Pagato da{' '}
                        <strong className="text-slate-700 dark:text-slate-200">
                          {getMemberName(exp.paidByMemberId)}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Diviso x{exp.splitBetweenMemberIds.length || members.length}
                      </span>
                      {exp.date && (
                        <>
                          <span>•</span>
                          <span>
                            {new Date(`${exp.date}T00:00:00`).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <div className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                      {formatMoney(exp.amountInBase, baseCurrency)}
                    </div>
                    {isForeign && (
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {formatMoney(exp.amount, exp.currency)}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(exp)}
                      aria-label={`Modifica spesa ${exp.title}`}
                      className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
                    >
                      <Pencil className="w-4 h-4" aria-hidden="true" />
                    </button>
                    {confirmDeleteId === exp.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          deleteExpense(exp.id);
                          setConfirmDeleteId(null);
                        }}
                        aria-label={`Conferma eliminazione spesa ${exp.title}`}
                        className="min-h-[44px] px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-sm transition-colors animate-in fade-in zoom-in-95 duration-150"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Confermi?</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDeleteId(exp.id);
                          setTimeout(() => {
                            setConfirmDeleteId((prev) => (prev === exp.id ? null : prev));
                          }, 3500);
                        }}
                        aria-label={`Elimina spesa ${exp.title}`}
                        className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Add / Edit Expense Modal */}
      <ModalDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingExpense ? 'Modifica Spesa' : 'Nuova Spesa Condivisa'}
        subtitle="Inserisci l’importo con virgola o punto: conversione e divisione sono istantanee"
      >
        <form onSubmit={handleSaveExpense} className="space-y-4">
          <div>
            <label htmlFor={`${idPrefix}-title`} className="block text-sm font-semibold mb-1">
              Descrizione spesa *
            </label>
            <input
              id={`${idPrefix}-title`}
              name="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es. Cena, Biglietti treno, Hotel..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label htmlFor={`${idPrefix}-amt`} className="block text-sm font-semibold mb-1">
                Importo *
              </label>
              <input
                id={`${idPrefix}-amt`}
                name="amount"
                type="text"
                inputMode="decimal"
                required
                value={rawAmount}
                onChange={(e) => setRawAmount(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 font-bold text-lg"
              />
            </div>
            <div>
              <label htmlFor={`${idPrefix}-curr`} className="block text-sm font-semibold mb-1">
                Valuta
              </label>
              <select
                id={`${idPrefix}-curr`}
                name="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 font-bold"
              >
                <option value={destinationCurrency}>{destinationCurrency}</option>
                {!sameCurrency && <option value={baseCurrency}>{baseCurrency}</option>}
              </select>
            </div>
          </div>

          {!sameCurrency && currency === destinationCurrency && previewAmount > 0 && (
            <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 -mt-2">
              Controvalore automatico: ≈ {formatMoney(previewInBase, baseCurrency)}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${idPrefix}-cat`} className="block text-sm font-semibold mb-1">
                Categoria
              </label>
              <select
                id={`${idPrefix}-cat`}
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
              >
                {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor={`${idPrefix}-date`} className="block text-sm font-semibold mb-1">
                Data
              </label>
              <input
                id={`${idPrefix}-date`}
                name="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3"
              />
            </div>
          </div>

          {/* Visible Radio Group for <= 5 members (Modern Web Guidance `forms` Selection Control Matrix) */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Chi ha pagato?</legend>
            <div className="grid grid-cols-2 gap-2">
              {members.map((m) => {
                const checked = paidBy === m.id;
                return (
                  <label
                    key={m.id}
                    className={`min-h-[48px] px-3 py-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                      checked
                        ? 'border-brand-600 bg-brand-50 dark:bg-brand-950/50 font-bold'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paid_by"
                      value={m.id}
                      checked={checked}
                      onChange={() => setPaidBy(m.id)}
                      className="w-4 h-4"
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: m.color }}
                    />
                    <span className="text-sm truncate">{m.name}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {/* Multi-select Checkboxes for Splitting */}
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold">Dividi tra:</legend>
            <div className="grid grid-cols-2 gap-2">
              {members.map((m) => {
                const checked = splitIds.includes(m.id);
                return (
                  <label
                    key={m.id}
                    className={`min-h-[48px] px-3 py-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                      checked
                        ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 opacity-65'
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="split_between"
                      value={m.id}
                      checked={checked}
                      onChange={() => toggleSplitMember(m.id)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm truncate">{m.name}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="flex items-center justify-between gap-2 pt-2">
            {editingExpense ? (
              <button
                type="button"
                onClick={() => {
                  deleteExpense(editingExpense.id);
                  setModalOpen(false);
                }}
                className="min-h-[48px] px-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 font-bold text-sm inline-flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                <span>Elimina Spesa</span>
              </button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="min-h-[48px] px-4 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-sm"
              >
                Annulla
              </button>
              <button
                type="submit"
                className="min-h-[48px] px-6 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-sm"
              >
                Salva Spesa
              </button>
            </div>
          </div>
        </form>
      </ModalDialog>
    </section>
  );
};
