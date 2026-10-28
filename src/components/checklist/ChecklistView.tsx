import React, { useState, useId } from 'react';
import confetti from 'canvas-confetti';
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  FileCheck,
  Smartphone,
  Luggage,
  HeartPulse,
  Sparkles
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import type { ChecklistCategory } from '../../types/trip';

const CHECKLIST_CATEGORIES: Record<
  ChecklistCategory,
  { label: string; Icon: React.FC<{ className?: string }> }
> = {
  documents: { label: 'Documenti & Burocrazia', Icon: FileCheck },
  electronics: { label: 'Elettronica & Connettività', Icon: Smartphone },
  luggage: { label: 'Valigia & Abbigliamento', Icon: Luggage },
  health_money: { label: 'Salute & Pagamenti', Icon: HeartPulse },
  other: { label: 'Altro / Promemoria', Icon: Sparkles }
};

export const ChecklistView: React.FC = () => {
  const { activeTrip, addChecklistItem, toggleChecklistItem, deleteChecklistItem } = useTrip();
  const idPrefix = useId();

  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<ChecklistCategory>('luggage');
  const [newAssignee, setNewAssignee] = useState<string>('shared');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');

  if (!activeTrip) return null;

  const { checklist, members } = activeTrip;

  const filteredList = checklist.filter((item) => {
    if (filterAssignee === 'all') return true;
    return (item.assignedToMemberId || 'shared') === filterAssignee;
  });

  const completedCount = checklist.filter((i) => i.completed).length;
  const totalCount = checklist.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggle = (id: string, currentlyCompleted: boolean) => {
    toggleChecklistItem(id);
    // Zeigarnik completion celebration when ticking the final uncompleted item
    if (!currentlyCompleted && completedCount + 1 === totalCount && totalCount > 0) {
      try {
        confetti({
          particleCount: 70,
          spread: 65,
          origin: { y: 0.7 }
        });
      } catch {
        // ignore if reduced motion / canvas blocked
      }
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    addChecklistItem({
      text: newText.trim(),
      category: newCategory,
      completed: false,
      assignedToMemberId: newAssignee
    });
    setNewText('');
  };

  const getAssigneeLabel = (assigneeId?: string) => {
    if (!assigneeId || assigneeId === 'shared') return 'Condiviso';
    return members.find((m) => m.id === assigneeId)?.name ?? 'Condiviso';
  };

  return (
    <section aria-label="Checklist Pre-Partenza e Bagaglio" className="space-y-4">
      {/* Zeigarnik Progress Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold">Preparativi & Bagaglio</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {pct === 100 && totalCount > 0
                ? 'Tutto pronto per la partenza! Buon viaggio! ✈️'
                : `${completedCount} di ${totalCount} voci completate`}
            </p>
          </div>
          <span className="text-2xl font-black text-brand-600 dark:text-brand-400">{pct}%</span>
        </div>

        <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Filter by Member / Shared */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setFilterAssignee('all')}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              filterAssignee === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            Tutti
          </button>
          <button
            type="button"
            onClick={() => setFilterAssignee('shared')}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              filterAssignee === 'shared'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            Condivisi
          </button>
          {members.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setFilterAssignee(m.id)}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                filterAssignee === m.id
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Inline Add Form */}
      <form
        onSubmit={handleAdd}
        className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
      >
        <label htmlFor={`${idPrefix}-new`} className="block text-sm font-bold">
          Aggiungi voce alla checklist
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-6">
            <input
              id={`${idPrefix}-new`}
              name="checklist_text"
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Es. Caricabatterie, K-Way, Visto..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm"
            />
          </div>
          <div className="sm:col-span-3">
            <label htmlFor={`${idPrefix}-cat`} className="visually-hidden">
              Categoria
            </label>
            <select
              id={`${idPrefix}-cat`}
              name="category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as ChecklistCategory)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs font-semibold"
            >
              {Object.entries(CHECKLIST_CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3 flex gap-2">
            <label htmlFor={`${idPrefix}-who`} className="visually-hidden">
              Assegna a
            </label>
            <select
              id={`${idPrefix}-who`}
              name="assignee"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs font-semibold"
            >
              <option value="shared">Condiviso</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              aria-label="Aggiungi voce"
              className="min-w-[48px] min-h-[48px] px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold inline-flex items-center justify-center shrink-0"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </form>

      {/* Grouped Checklist Categories (Miller's Law: clear chunking <= 7 items per category) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(Object.keys(CHECKLIST_CATEGORIES) as ChecklistCategory[]).map((catKey) => {
          const items = filteredList.filter((i) => i.category === catKey);
          if (items.length === 0) return null;
          const meta = CHECKLIST_CATEGORIES[catKey];
          const CatIcon = meta.Icon;

          return (
            <div
              key={catKey}
              className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5"
            >
              <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                <CatIcon className="w-4 h-4 text-brand-500" />
                <h3 className="text-sm font-bold">{meta.label}</h3>
              </div>

              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggle(item.id, item.completed)}
                      className="flex-1 min-h-[40px] flex items-center gap-2.5 text-left"
                    >
                      {item.completed ? (
                        <CheckCircle2
                          className="w-5 h-5 text-emerald-500 shrink-0"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
                      )}
                      <span
                        className={`text-sm ${
                          item.completed
                            ? 'line-through text-slate-400'
                            : 'font-medium text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {item.text}
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {item.assignedToMemberId && item.assignedToMemberId !== 'shared' && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300">
                          {getAssigneeLabel(item.assignedToMemberId)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteChecklistItem(item.id)}
                        aria-label={`Elimina ${item.text}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
};
