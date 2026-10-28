# TripWise Project Rules

## 0. Canonical Workspace (`C:\Progetti\TripWise`)
- **`C:\Progetti\TripWise`** è l'unico workspace canonico attivo del progetto TripWise (migrato il `2026-10-23`; la precedente cartella `C:\Progetti\Japan` è stata definitivamente rimossa). Tutte le modifiche a codice sorgente, test, build Vite/PWA, Capacitor Android e deploy Firebase devono avvenire esclusivamente in `C:\Progetti\TripWise`.

## 1. Consumer-Grade UX (Zero Developer Jargon)
- Never expose JSON snippets, SDK config blocks, API keys, or developer console instructions in the user interface.
- Authentication and cloud sync must present simple consumer actions: **"Accedi con Google"**, **"Invita compagno"** (link o codice), **"Esci"**.
- Infrastructure configuration belongs strictly in `.env` files and CLI provisioning scripts (see skill `tripwise-firebase-provisioning`).

## 2. True Responsive Dual-Layout (Desktop Widescreen + Mobile App)
- **Desktop (`lg:` and up)**: Use a persistent left sidebar navigation + fluid full-width workspace (`max-w-[1920px]`), maximizing map canvas and multi-column dashboards without excessive side margins.
- **Mobile (`< lg`)**: Use a compact top bar + ergonomic bottom tab navigation (`>= 48px` targets) in the thumb zone.
- **Horizontal Strips**: Never rely on `no-scrollbar` alone on desktop; always provide clickable `<` / `>` scroll controls and horizontal wheel support so overflowing items (such as trip days) are never clipped without affordance.

## 3. Verification Discipline
- Before concluding any UI or logic task, execute the single-command quality gate skill (`tripwise-quality-gate`) instead of running fragmented manual commands.
