---
name: leaflet-react-patterns
description: >-
  Best practices and bug-prevention rules for Leaflet + OpenStreetMap maps inside
  React + Tailwind CSS applications. Use whenever creating, modifying, or debugging
  InAppMap, map markers, full-screen/split map toggles, or tile rendering issues.
---

# Leaflet + React + Tailwind Patterns

## 1. CSS Import & Tailwind Preflight Protection
Tailwind's `@tailwind base` sets `img { max-width: 100%; height: auto; }`, which corrupts Leaflet 256px tile positioning on wide containers (`Solo Mappa` / widescreen).
- Always import `leaflet/dist/leaflet.css` and place explicit overrides **after** `@tailwind base`:
  ```css
  .leaflet-container img,
  .leaflet-container .leaflet-tile {
    max-width: none !important;
    max-height: none !important;
  }
  ```

## 2. Explicit Container Height & View-Switch Invalidation
Leaflet requires non-zero pixel dimensions when `L.map()` initializes and whenever layout mode changes (`split` <-> `map`).
- Give the map element explicit pixel/viewport height (`style={{ height }}` or guaranteed `min-h-[500px]`).
- Pass a `layoutKey` prop (e.g., `viewMode`) to `InAppMap` and run both `requestAnimationFrame(() => map.invalidateSize())` AND a `150ms` delayed `map.invalidateSize()` + `fitBounds` whenever `layoutKey` changes.
- Guard `map.fitBounds(bounds)` so it only runs when `container.clientWidth > 0 && container.clientHeight > 0`.

## 3. Full-Map Mode Usability
When rendering a map-only view (`viewMode === 'map'`), never hide primary actions ("+ Aggiungi Tappa" or quick stop list). Render a floating overlay panel or action bar so users can interact with and add stops directly from map mode.

## 4. Multi-Engine Search Layer & Cross-Platform Reverse Geocoding
- **Place Search (`searchPlaces`)**: Use Komoot Photon (`https://photon.komoot.io/api/`) with `[lat, lng]` coordinate proximity bias as primary autocomplete, falling back to pure OpenStreetMap Nominatim (`https://nominatim.openstreetmap.org/search`) without appending generic region strings like `"Mondo"` or `"Europa"` to the query.
- **Reverse Geocoding (`reverseGeocode`)**:
  - **Desktop**: Bind `map.on('contextmenu', ...)` so right-clicking anywhere drops a temporary preview marker and resolves the street/POI address.
  - **Mobile**: Combine a passive `500ms` single-finger touch long-press listener (cancelling if finger moves `> 10px` or `touches.length > 1`, deduplicated against native `contextmenu`) WITH an explicit visible `"Scegli punto"` (`pickMode`) toolbar toggle for single-tap precision.
