import React from 'react';
import { Compass, Bookmark, Wallet, Ticket, CheckSquare } from 'lucide-react';
import type { AppTab } from '../../types/trip';

interface BottomNavProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
}

const ITEMS: Array<{ id: AppTab; label: string; Icon: React.FC<{ className?: string }> }> = [
  { id: 'itinerary', label: 'Itinerario', Icon: Compass },
  { id: 'places', label: 'Luoghi', Icon: Bookmark },
  { id: 'expenses', label: 'Spese', Icon: Wallet },
  { id: 'bookings', label: 'Biglietti', Icon: Ticket },
  { id: 'checklist', label: 'Checklist', Icon: CheckSquare }
];

/**
 * Fitts's Law: Bottom tab bar positioned in the natural mobile thumb zone with >= 56px height targets.
 */
export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  return (
    <nav
      aria-label="Navigazione mobile"
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5 h-16">
        {ITEMS.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <li key={id} className="h-full">
              <button
                type="button"
                onClick={() => onSelectTab(id)}
                aria-current={active ? 'page' : undefined}
                aria-selected={active}
                className={`w-full h-full flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
                  active
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
