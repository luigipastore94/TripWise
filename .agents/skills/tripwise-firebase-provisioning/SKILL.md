---
name: tripwise-firebase-provisioning
description: >-
  Automated CLI workflow to provision Firebase project, Google Sign-In Authentication,
  Cloud Firestore, and populate .env + Android google-services.json for TripWise
  without exposing technical configuration to end users. Use when setting up or updating
  Google login and cloud synchronization.
---

# TripWise Firebase Zero-Jargon Provisioning

## Core Principle
End users of TripWise must NEVER paste `firebaseConfig` or visit developer consoles. All Firebase credentials live in `.env` (`VITE_FIREBASE_*`) generated automatically via CLI.

## Automated Setup Steps

1. **Check CLI Login**:
   `npx.cmd -y firebase-tools@latest login:list`
   *(If logged out, run `npx.cmd -y firebase-tools@latest login` to let the developer authenticate once via browser).*

2. **Select or Create Project**:
   - List existing projects: `npx.cmd -y firebase-tools@latest projects:list`
   - Set active project: `npx.cmd -y firebase-tools@latest use <PROJECT_ID>`

3. **Create / Fetch Web App SDK Config into `.env`**:
   - List apps: `npx.cmd -y firebase-tools@latest apps:list --project <PROJECT_ID> --json`
   - If no `WEB` app exists: `npx.cmd -y firebase-tools@latest apps:create WEB "TripWise Web" --project <PROJECT_ID>`
   - Extract `.env` automatically using helper script:
     `node .agents/skills/tripwise-firebase-provisioning/scripts/write-env.mjs <PROJECT_ID>`

4. **Configure Google Sign-In & Firestore**:
   - Configure `firebase.json` `auth.providers.googleSignIn` and deploy with `npx.cmd -y firebase-tools@latest deploy --only auth`.
   - For `firestore.rules`, ALWAYS delegate authoring to the `firestore-rules-author` subagent.
