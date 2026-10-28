---
name: tripwise-commit-discipline
description: >-
  Enforces mandatory git commits whenever application code is modified (new features,
  bug fixes, or maintenance/chore improvements). Guides commit categorization (feat, fix,
  chore, refactor, perf), atomic staging, quality gate validation, and conventional commit messages.
---

# TripWise Commit Discipline

## Regola Fondamentale (Invariant)
Nessuna modifica all'applicativo TripWise può considerarsi conclusa senza un **Git commit atomico, verificato e conforme agli standard del progetto**.
Qualsiasi intervento sul codice sorgente, configurazione o documentazione tecnica rientra obbligatoriamente in una delle seguenti categorie:
1. **Nuova feature (`feat`)**: Nuova funzionalità per l'utente, estensione di moduli o capacità dell'app.
2. **Bug fix (`fix`)**: Risoluzione di difetti, gestione di edge-case, correzione di regressioni o glitch UI.
3. **Chore o miglioramento (`chore` / `refactor` / `perf`)**: Manutenzione, pulizia architetturale, ottimizzazioni prestazionali, aggiornamenti dipendenze o tooling.

---

## Tipi di Commit e Convenzioni (Conventional Commits)

I commit devono seguire lo standard **Conventional Commits**:
```
<type>(<scope>): <descrizione concisa e imperativa>
```

### 1. Tipi Ammessi
- **`feat`**: Nuova feature visibile o fruibile (es. `feat(places): add custom notes and tags to POI items`).
- **`fix`**: Correzione di un malfunzionamento (es. `fix(auth): eliminate unauthenticated screen flash on page refresh`).
- **`chore`**: Attività di manutenzione, configurazione, aggiornamento tool o dipendenze (es. `chore(pwa): update service worker caching strategy`).
- **`refactor`**: Riorganizzazione interna del codice che non modifica il comportamento esterno (es. `refactor(context): split trip state reducers into sub-hooks`).
- **`perf`**: Modifica mirata al miglioramento delle performance di rendering o computazione (es. `perf(map): debounce marker clustering on zoom`).
- **`test`**: Aggiunta o correzione di test unitari/integrazione (es. `test(domain): verify offline attachments and trip tombstoning`).

### 2. Scope Consigliati per TripWise
- `itinerary`: Gestione giorni, tappe, orari, calcolo tempi e percorsi.
- `bookings`: Prenotazioni, voucher, categorie hotel/voli/trasporti.
- `checklist`: Liste bagagli, to-do, categorie personalizzate, salute e pagamenti.
- `places`: Luoghi d'interesse, recap POI, dettagli geolocalizzati.
- `map`: Mappa Leaflet, marker custom, popup, fullscreen e controlli di navigazione.
- `auth`: Autenticazione Google, gestione sessione, cache utente offline.
- `sync`: Sincronizzazione Cloud Firestore in tempo reale, IndexedDB e offline-first.
- `collaboration`: Compagni di viaggio, inviti, visualizzazione profili e permessi.
- `mobile`: Capacitor, build Android APK, safe area e touch targets.
- `ui`: Componenti di interfaccia trasversali, responsive layout desktop/mobile.
- `deps`: Pacchetti npm e librerie esterne.
- `core`: Motore di stato globale, tipi TypeScript condivisi, schema dati.

---

## Workflow Operativo in 4 Fasi

### Fase 1: Validazione Preventiva (Quality Gate)
Prima di eseguire il commit, verificare sempre che il codice compili e superi la suite di controllo eseguendo il Quality Gate:
```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/tripwise-quality-gate/scripts/verify.ps1
```
*Nessun commit deve essere creato se la compilazione TypeScript (`npm run typecheck`) o la build Vite (`npm run build`) falliscono.*

### Fase 2: Ispezione & Staging Atomico
Ispezionare i file modificati ed escludere file temporanei o non correlati:
```powershell
git status
git diff --stat
```
Aggiungere **solo** i file pertinenti alla modifica logica:
```powershell
git add src/components/itinerary/ItineraryView.tsx src/context/TripContext.tsx
```
> [!CAUTION]
> **Sicurezza Credenziali**: Non aggiungere mai file `.env`, `.env.local`, file di chiavi o token privati. Verificare sempre con `git diff --cached --name-only` prima di confermare.

### Fase 3: Composizione del Messaggio
- Utilizzare una forma chiara, imperativa e descrittiva.
- Evitare messaggi generici come "fix bug", "modifiche varie", "update files".
- Esempi di riferimento dal repository TripWise:
  - `feat(collaboration): inline display name editing in SettingsSyncModal with profile propagation`
  - `fix(auth): eliminate unauthenticated screen flash on page refresh with authStateReady gate`
  - `chore(deps): upgrade vite and capacitor dependencies`

### Fase 4: Esecuzione del Commit & Verifica
Eseguire il commit e verificare l'hash generato e lo stato del repository:
```powershell
git commit -m "feat(itinerary): add horizontal scroll controls for day pills on desktop"
git log -1 --stat
```

---

## Esecuzione Rapida con Script Automatizzato

Per velocizzare il flusso e applicare automaticamente i controlli di sicurezza e quality gate, è disponibile lo script helper:

```powershell
# Esempio per una nuova feature:
powershell -ExecutionPolicy Bypass -File .agents/skills/tripwise-commit-discipline/scripts/commit.ps1 -Type feat -Scope itinerary -Message "add horizontal scroll buttons for day pills on desktop"

# Esempio per un bug fix con file specifici:
powershell -ExecutionPolicy Bypass -File .agents/skills/tripwise-commit-discipline/scripts/commit.ps1 -Type fix -Scope auth -Message "prevent auth flash on reload" -Files "src/App.tsx", "src/context/TripContext.tsx"

# Esempio per un chore / miglioramento:
powershell -ExecutionPolicy Bypass -File .agents/skills/tripwise-commit-discipline/scripts/commit.ps1 -Type chore -Scope build -Message "optimize vite pwa precaching settings" -All
```

### Parametri dello Script `commit.ps1`:
- `-Type`: Tipo di commit obbligatorio (`feat`, `fix`, `chore`, `refactor`, `perf`, `test`, `build`, `ci`, `docs`, `style`).
- `-Scope`: Ambito applicativo opzionale (es. `itinerary`, `auth`, `bookings`, `map`).
- `-Message`: Messaggio descrittivo obbligatorio.
- `-Files`: Array opzionale di percorsi file da aggiungere allo staging (`git add`).
- `-All`: Flag per aggiungere tutti i file tracciati modificati (`git add -u`).
- `-SkipQualityGate`: Flag per saltare la riesecuzione del Quality Gate se già eseguito immediatamente prima.
- `-SyncAndroid`: Flag per includere anche la sincronizzazione degli asset Android (`cap sync android`).
