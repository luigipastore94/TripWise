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
  CreditCard,
  Sparkles,
  Utensils,
  Baby,
  PawPrint,
  Tent,
  Mountain,
  Camera,
  ShoppingBag,
  Shirt,
  Car,
  Bike,
  Plane,
  Train,
  Sun,
  Umbrella,
  BookOpen,
  Music,
  Key,
  Compass,
  FolderPlus
} from 'lucide-react';
import { useTrip } from '../../context/TripContext';
import type { ChecklistCategory } from '../../types/trip';
import { ModalDialog } from '../ui/ModalDialog';

export type StandardChecklistCategoryKey =
  | 'documents'
  | 'electronics'
  | 'luggage'
  | 'health'
  | 'money'
  | 'other';

export const STANDARD_CHECKLIST_CATEGORIES: Record<
  StandardChecklistCategoryKey,
  { label: string; Icon: React.FC<{ className?: string }> }
> = {
  documents: { label: 'Documenti & Burocrazia', Icon: FileCheck },
  electronics: { label: 'Elettronica & Connettività', Icon: Smartphone },
  luggage: { label: 'Valigia & Abbigliamento', Icon: Luggage },
  health: { label: 'Salute & Medicinali', Icon: HeartPulse },
  money: { label: 'Pagamenti & Carte', Icon: CreditCard },
  other: { label: 'Altro / Promemoria', Icon: Sparkles }
};

export const CHECKLIST_ICON_REGISTRY: Record<string, React.FC<{ className?: string }>> = {
  Sparkles,
  HeartPulse,
  CreditCard,
  Luggage,
  FileCheck,
  Smartphone,
  Utensils,
  Baby,
  PawPrint,
  Tent,
  Mountain,
  Camera,
  ShoppingBag,
  Shirt,
  Car,
  Bike,
  Plane,
  Train,
  Sun,
  Umbrella,
  BookOpen,
  Music,
  Key,
  Compass
};

export const AVAILABLE_CATEGORY_ICONS = [
  { id: 'Sparkles', label: 'Speciale / Varie', Icon: Sparkles },
  { id: 'Utensils', label: 'Cibo & Snack', Icon: Utensils },
  { id: 'Baby', label: 'Bambini & Famiglia', Icon: Baby },
  { id: 'PawPrint', label: 'Animali', Icon: PawPrint },
  { id: 'Tent', label: 'Campeggio & Tenda', Icon: Tent },
  { id: 'Mountain', label: 'Montagna & Trekking', Icon: Mountain },
  { id: 'Camera', label: 'Foto & Video', Icon: Camera },
  { id: 'ShoppingBag', label: 'Shopping & Acquisti', Icon: ShoppingBag },
  { id: 'Shirt', label: 'Abbigliamento', Icon: Shirt },
  { id: 'Car', label: 'Auto & Noleggio', Icon: Car },
  { id: 'Bike', label: 'Bici & Mobilità', Icon: Bike },
  { id: 'Plane', label: 'Voli & Aerei', Icon: Plane },
  { id: 'Train', label: 'Treni & Trasferimenti', Icon: Train },
  { id: 'Sun', label: 'Spiaggia & Mare', Icon: Sun },
  { id: 'Umbrella', label: 'Meteo & Pioggia', Icon: Umbrella },
  { id: 'BookOpen', label: 'Guide & Letture', Icon: BookOpen },
  { id: 'Music', label: 'Musica & Eventi', Icon: Music },
  { id: 'Key', label: 'Alloggi & Chiavi', Icon: Key },
  { id: 'Compass', label: 'Avventura & Mappe', Icon: Compass },
  { id: 'HeartPulse', label: 'Salute', Icon: HeartPulse },
  { id: 'CreditCard', label: 'Finanze', Icon: CreditCard },
  { id: 'Luggage', label: 'Valigie', Icon: Luggage },
  { id: 'FileCheck', label: 'Documenti', Icon: FileCheck },
  { id: 'Smartphone', label: 'Dispositivi', Icon: Smartphone }
];

/**
 * Normalizes legacy or raw categories (e.g. legacy 'health_money') into active categories.
 * Cites Postel's Law: Be conservative in what you send, be liberal in what you accept.
 */
export function normalizeChecklistCategory(
  category: ChecklistCategory | string,
  text = '',
  knownCustomCategoryIds: string[] = []
): string {
  if (category === 'health_money') {
    const isHealth = /medic|farmac|salut|sanit|cerott|vaccin|pronto soccorso|visita|polizza|tampon|occhial/i.test(
      text
    );
    return isHealth ? 'health' : 'money';
  }
  if (category in STANDARD_CHECKLIST_CATEGORIES) {
    return category;
  }
  if (knownCustomCategoryIds.includes(category)) {
    return category;
  }
  return 'other';
}

const CHECKLIST_FILTER_STORAGE_KEY = 'tripwise_checklist_filter_assignee';

function getInitialChecklistFilter(): string {
  try {
    const saved = localStorage.getItem(CHECKLIST_FILTER_STORAGE_KEY);
    if (saved) return saved;
  } catch {}
  return 'all';
}

export const ChecklistView: React.FC = () => {
  const {
    activeTrip,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    addCustomChecklistCategory,
    deleteCustomChecklistCategory
  } = useTrip();
  const idPrefix = useId();

  const [newText, setNewText] = useState('');
  const [newCategory, setNewCategory] = useState<string>('luggage');
  const [newAssignee, setNewAssignee] = useState<string>('shared');
  const [filterAssignee, setFilterAssigneeState] = useState<string>(getInitialChecklistFilter);

  const handleSelectFilterAssignee = (val: string) => {
    setFilterAssigneeState(val);
    try {
      localStorage.setItem(CHECKLIST_FILTER_STORAGE_KEY, val);
    } catch {}
  };

  // Custom Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalName, setCategoryModalName] = useState('');
  const [categoryModalIcon, setCategoryModalIcon] = useState('Sparkles');
  const [categoryModalError, setCategoryModalError] = useState<string | null>(null);

  if (!activeTrip) return null;

  const { checklist, members } = activeTrip;
  const customCategories = activeTrip.customChecklistCategories || [];
  const customCategoryIds = customCategories.map((c) => c.id);

  // Consolidated category map: standard + custom
  const allCategoriesMap: Record<
    string,
    { label: string; Icon: React.FC<{ className?: string }>; isCustom?: boolean }
  > = {
    ...STANDARD_CHECKLIST_CATEGORIES
  };

  for (const cc of customCategories) {
    allCategoriesMap[cc.id] = {
      label: cc.label,
      Icon: CHECKLIST_ICON_REGISTRY[cc.icon] || Sparkles,
      isCustom: true
    };
  }

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

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = categoryModalName.trim();
    if (!trimmed) {
      setCategoryModalError('Inserisci un nome per la categoria.');
      return;
    }
    const newCatId = addCustomChecklistCategory({
      label: trimmed,
      icon: categoryModalIcon
    });
    setNewCategory(newCatId);
    setCategoryModalName('');
    setCategoryModalIcon('Sparkles');
    setCategoryModalError(null);
    setIsCategoryModalOpen(false);
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
            onClick={() => handleSelectFilterAssignee('all')}
            aria-pressed={filterAssignee === 'all'}
            aria-selected={filterAssignee === 'all'}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              filterAssignee === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-xs'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            Tutti
          </button>
          <button
            type="button"
            onClick={() => handleSelectFilterAssignee('shared')}
            aria-pressed={filterAssignee === 'shared'}
            aria-selected={filterAssignee === 'shared'}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
              filterAssignee === 'shared'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-xs'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
            }`}
          >
            Condivisi
          </button>
          {members.map((m) => {
            const isMemberActive = filterAssignee === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectFilterAssignee(m.id)}
                aria-pressed={isMemberActive}
                aria-selected={isMemberActive}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                  isMemberActive
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {m.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Inline Add Form */}
      <form
        onSubmit={handleAdd}
        className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
      >
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={`${idPrefix}-new`} className="block text-sm font-bold">
            Aggiungi voce alla checklist
          </label>
          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            title="Crea una nuova categoria personalizzata con icona a scelta"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50 px-2.5 py-1.5 rounded-xl border border-brand-200 dark:border-brand-900/60 transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Nuova Categoria</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-6">
            <input
              id={`${idPrefix}-new`}
              name="checklist_text"
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Es. Caricabatterie, K-Way, Cibo per gatti..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-sm h-11"
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
              onChange={(e) => {
                if (e.target.value === '__NEW__') {
                  setIsCategoryModalOpen(true);
                } else {
                  setNewCategory(e.target.value);
                }
              }}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs font-semibold h-11"
            >
              <optgroup label="Categorie Predefinite">
                {Object.entries(STANDARD_CHECKLIST_CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </optgroup>
              {customCategories.length > 0 && (
                <optgroup label="Categorie Personalizzate">
                  {customCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </optgroup>
              )}
              <option value="__NEW__">+ Crea nuova categoria...</option>
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
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs font-semibold h-11"
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
              className="min-w-[48px] min-h-[44px] px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold inline-flex items-center justify-center shrink-0 shadow-sm transition-colors"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </form>

      {/* Grouped Checklist Categories (Miller's Law: clear chunking <= 7 items per category) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.keys(allCategoriesMap).map((catKey) => {
          const items = filteredList.filter(
            (i) => normalizeChecklistCategory(i.category, i.text, customCategoryIds) === catKey
          );
          const meta = allCategoriesMap[catKey];
          if (!meta) return null;

          // Do not show empty standard categories, but show custom categories so the user sees their created category
          if (items.length === 0 && !meta.isCustom) return null;

          const CatIcon = meta.Icon;

          return (
            <div
              key={catKey}
              className="rounded-2xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5"
            >
              <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 min-w-0">
                  <CatIcon className="w-4 h-4 text-brand-500 shrink-0" aria-hidden="true" />
                  <h3 className="text-sm font-bold truncate">{meta.label}</h3>
                  {meta.isCustom && (
                    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
                      Personalizzata
                    </span>
                  )}
                </div>

                {meta.isCustom && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Eliminare la categoria "${meta.label}"? Le eventuali voci presenti verranno conservate e spostate in "Altro".`
                        )
                      ) {
                        deleteCustomChecklistCategory(catKey);
                        if (newCategory === catKey) {
                          setNewCategory('luggage');
                        }
                      }
                    }}
                    aria-label={`Elimina categoria ${meta.label}`}
                    title="Elimina categoria personalizzata"
                    className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>

              {items.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2 text-center">
                  Nessuna voce in questa categoria. Aggiungine una dal form in alto!
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={item.completed}
                        onClick={() => handleToggle(item.id, item.completed)}
                        className="flex-1 min-h-[40px] flex items-center gap-2.5 text-left min-w-0"
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
                          className={`text-sm truncate ${
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
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal to Add Custom Category (ModalDialog with Light Dismiss) */}
      <ModalDialog
        open={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setCategoryModalError(null);
        }}
        title="Nuova Categoria Checklist"
        subtitle="Assegna un nome e scegli un'icona personalizzata per organizzare il tuo viaggio"
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleCreateCategory} className="p-4 sm:p-5 space-y-4">
          <div>
            <label
              htmlFor={`${idPrefix}-cat-name`}
              className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1"
            >
              Nome della categoria
            </label>
            <input
              id={`${idPrefix}-cat-name`}
              type="text"
              value={categoryModalName}
              onChange={(e) => {
                setCategoryModalName(e.target.value);
                if (categoryModalError) setCategoryModalError(null);
              }}
              placeholder="Es. Cibo & Snack, Attrezzatura Trekking, Bambini..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              autoFocus
            />
            {categoryModalError && (
              <p className="text-xs text-red-500 font-semibold mt-1">{categoryModalError}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1.5">
              Scegli un&apos;icona
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-56 overflow-y-auto p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              {AVAILABLE_CATEGORY_ICONS.map((opt) => {
                const IconComponent = opt.Icon;
                const isSelected = categoryModalIcon === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCategoryModalIcon(opt.id)}
                    title={opt.label}
                    className={`min-w-[44px] min-h-[44px] flex flex-col items-center justify-center rounded-xl transition-all ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-md ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-slate-900 scale-105'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Preview Chip (Doherty Threshold & Gestalt Proximity) */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 flex items-center gap-2.5">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
              Anteprima:
            </span>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold">
              {React.createElement(CHECKLIST_ICON_REGISTRY[categoryModalIcon] || Sparkles, {
                className: 'w-4 h-4 text-brand-500'
              })}
              <span>{categoryModalName.trim() || 'Nome Categoria'}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsCategoryModalOpen(false);
                setCategoryModalError(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={!categoryModalName.trim()}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-sm transition-colors"
            >
              Crea Categoria
            </button>
          </div>
        </form>
      </ModalDialog>
    </section>
  );
};
