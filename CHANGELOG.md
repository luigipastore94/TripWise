# Changelog

Tutte le modifiche rilevanti apportate al progetto **TripWise** sono documentate in questo file.

Il formato è basato su [Keep a Changelog](https://keepachangelog.com/it/1.1.0/) e aderisce al [Semantic Versioning](https://semver.org/lang/it/).

---

## [1.0.0] - 2026-10-28

### Aggiunto
- **Multi-Viaggio Universale & Preset di Destinazione**:
  - Supporto per viaggi illimitati con preset pronti all'uso (Giappone, Europa, Stati Uniti, Regno Unito, Destinazione Libera).
  - Gestione autonoma di date, partecipanti, valuta base/locale e tassi di cambio per ciascun viaggio.
  - Aggiunta ed eliminazione dinamica dei giorni all'inizio o alla fine dell'itinerario con riconciliazione automatica delle date.
- **Natural Program Composer (Itinerario Naturale)**:
  - Motore di parsing testuale per convertire appunti o elenchi in tappe strutturate con orari, categorie e coordinate geografiche.
  - Assegnazione intelligente delle tappe ai giorni dell'itinerario.
- **Mappa Interattiva In-App (Leaflet + OpenStreetMap)**:
  - Mappa integrata senza dipendenze obbligatorie da carte di credito, con segnaposto numerati, colori per categoria e tracciati di percorso.
  - Ricerca geocodificata integrata tramite Nominatim (OpenStreetMap) con fallback Google Maps Platform protetto da *Google Quota Shield*.
  - Cache offline per tile cartografiche e supporto visualizzazione a schermo intero / split screen.
- **Tracciamento Spese Multi-Valuta & Pareggio Conti ("Chi deve a chi")**:
  - Registrazione spese con parser per valute locali ed estere (gestione automatica di virgola e punto decimale).
  - Algoritmo di semplificazione dei debiti per calcolare il numero minimo di rimborsi tra partecipanti.
  - Convertitore FX bidirezionale rapido accessibile in qualsiasi momento.
- **Hub Prenotazioni, Documenti PDF & Pass QR Offline**:
  - Schede per alloggi, voli, treni, noleggi e attrazioni con tracciamento PNR e note.
  - Visualizzatore di codici QR a schermo intero su sfondo ad alto contrasto per lettori ottici in stazioni e aeroporti.
  - Compressione e salvataggio locale di allegati e documenti PDF.
- **Checklist Pre-Partenza Collaborativa**:
  - Liste di controllo con barra di avanzamento e assegnazione compiti ai singoli compagni di viaggio.
  - Preset automatici in base alla destinazione.
- **Meteo & Previsioni Orarie**:
  - Integrazione previsioni meteo (Open-Meteo) associate alle tappe giornaliere in base alle coordinate geografiche.
- **Sincronizzazione Cloud Real-Time & 100% Offline-First**:
  - Funzionamento predefinito in locale su IndexedDB con esportazione/importazione JSON.
  - Sincronizzazione in tempo reale tra dispositivi mediante Cloud Firestore con merge collaborativo a 3 vie degli array e risoluzione conflitti.
  - Autenticazione consumer-grade Google Sign-In con modale *Accedi con Google* e *Invita compagno*.
  - Regole di sicurezza Firestore (`firestore.rules`) per proteggere i viaggi e i dati privati dei soli partecipanti.
- **Architettura Responsive Dual-Layout (Desktop & Mobile)**:
  - Layout desktop widescreen (`max-w-[1920px]`) con sidebar persistente e navigazione fluida.
  - Layout mobile nativo con barra superiore compatta e navigazione a schede ergonomica posizionata nella thumb zone (target touch >= 48px).
  - Controlli di scorrimento orizzontale espliciti (`<` e `>`) per barre dei giorni e filtri su desktop.
- **Supporto Mobile Android & PWA**:
  - Configurazione Capacitor 6 Android per generazione APK nativo (`android/`).
  - Service Worker con Vite PWA per installazione come Progressive Web App e funzionamento offline completo.
- **Suite di Test di Dominio & Quality Gate**:
  - Test unitari approfonditi in `tests/domain.test.mjs` (parser valute, riconciliazione date, natural itinerary, merge collaborativo 3-way, regole invarianti).
  - Script di verifica unificato `tripwise-quality-gate` per typecheck, test di dominio e build di produzione Vite/PWA.
