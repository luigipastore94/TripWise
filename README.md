# TripWise 🌍 — Universal Collaborative Travel Companion

**TripWise** è una Web App moderna, PWA installabile e applicazione Android (APK tramite Capacitor) pensata per pianificare, vivere e rendicontare qualsiasi viaggio nel mondo insieme ai propri compagni di avventura.

## Funzionalità Principali

- **Multi-Viaggio Universale & Preset Intelligenti**:
  - Gestisci infiniti viaggi (Destinazione Libera 🌍, Europa 🇪🇺, Giappone 🇯🇵, Stati Uniti 🇺🇸, Regno Unito 🇬🇧, ecc.).
  - Ogni viaggio ha le proprie date, partecipanti, valuta locale e tasso di cambio indipendenti.
- **Mappa Interattiva In-App (Leaflet + OpenStreetMap)**:
  - Visualizza tutte le tappe del giorno direttamente dentro l'app con segnaposto numerati, colori per categoria e tracciato del percorso.
  - Ricerca integrata dei luoghi (Nominatim OpenStreetMap) per trovare automaticamente le coordinate GPS senza inserire latitudine/longitudine a mano, e senza bisogno di API Key o carte di credito.
  - Tile memorizzate nella cache offline del dispositivo.
- **Spese Multi-Valuta, Convertitore FX & Pareggio Conti ("Chi deve a chi")**:
  - Registra spese in valuta locale o base (accetta sia virgola che punto decimale).
  - Calcolo automatico delle quote e dei rimborsi minimi per pareggiare i conti tra 2 o più partecipanti.
  - Convertitore rapido bidirezionale sempre accessibile anche in assenza di rete.
- **Hub Prenotazioni, Documenti & Pass QR Offline**:
  - Custodisci codici PNR di voli, treni, hotel e genera o carica screenshot di codici QR visualizzabili a schermo intero su sfondo bianco ad alto contrasto per i lettori ottici.
- **Checklist Collaborativa Pre-Partenza**:
  - Barra di avanzamento visuale, filtri per partecipante e voci pre-configurate in base al preset scelto.
- **Sincronizzazione Cloud Real-Time + 100% Offline-First**:
  - Funziona immediatamente in locale (con esportazione/importazione JSON) e si sincronizza in tempo reale tra dispositivi collegando un progetto gratuito **Firebase Cloud Firestore** (con cache persistente IndexedDB attiva per aereo, metropolitana o zone senza roaming).

---

## Avvio Rapido (Sviluppo Web)

```bash
npm install
npm run dev
```

## Build di Produzione & PWA

```bash
npm run build
npm run preview
```

## Generazione Progetto e File APK Android (Capacitor)

Il progetto include già `@capacitor/core`, `@capacitor/cli` e `@capacitor/android`.

1. Sincronizza il bundle web con la piattaforma Android:
   ```bash
   npm run cap:sync
   ```
2. Apri il progetto in Android Studio per generare l'APK firmato o di debug:
   ```bash
   npm run cap:open
   ```
   Oppure compila direttamente da terminale (con Android SDK installato):
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   Il file `.apk` sarà disponibile in `android/app/build/outputs/apk/debug/app-debug.apk`.
