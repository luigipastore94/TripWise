---
name: tripwise-quality-gate
description: >-
  Single-command verification gate and pre-delivery UI audit checklist for TripWise.
  Use before completing any feature, bugfix, or refactor to validate TypeScript types,
  domain logic, Vite/PWA production build, and responsive desktop/mobile UI quality
  in one step with minimal token/credit usage.
---

# TripWise Quality Gate

## Purpose
Consolidates typechecking, unit tests, and PWA/Capacitor build checks into a single command to prevent regressions and avoid multi-turn debugging loops.

## Step 1: Pre-Delivery UI Audit
Before running the build script, verify any touched UI components against these 4 TripWise invariants:
1. **Desktop + Mobile Parity**: Does the view scale across `1440px–1920px` desktop screens (fluid grid, no narrow `max-w-5xl` tunnel) AND `375px` mobile screens (bottom nav safe area, `>=48px` touch targets)?
2. **Overflow Affordances**: Do horizontal lists (e.g., Day pills, Booking filters) include visible `<` / `>` scroll buttons or wrap options for desktop mouse users?
3. **Consumer Copy Only**: Is all visible Italian copy free of developer terms (`JSON`, `firebaseConfig`, `Firestore`, `API Key`)?
4. **Leaflet Lifecycle**: If map layout or visibility changes, see `leaflet-react-patterns`.

## Step 2: Run Unified Verification Script
Execute the verification script in a single tool call:

```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/tripwise-quality-gate/scripts/verify.ps1
```

To also sync native Android Capacitor assets when preparing an APK:
```powershell
powershell -ExecutionPolicy Bypass -File .agents/skills/tripwise-quality-gate/scripts/verify.ps1 -SyncAndroid
```
