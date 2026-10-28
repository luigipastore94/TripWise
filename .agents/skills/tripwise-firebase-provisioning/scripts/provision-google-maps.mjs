import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const projectId = process.argv[2] || 'tripwise-sync-lp94';
const cfgPath = join(homedir(), '.config', 'configstore', 'firebase-tools.json');

if (!existsSync(cfgPath)) {
  console.error('❌ Errore: Nessun login Firebase trovato. Esegui prima: npx.cmd -y firebase-tools@latest login');
  process.exit(1);
}

const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
const accessToken = cfg?.tokens?.access_token;
if (!accessToken) {
  console.error('❌ Errore: Token di accesso Firebase mancante o scaduto.');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
};

async function main() {
  console.log(`🌐 Configurazione Google Maps Platform per il progetto "${projectId}"...`);

  // 1. Check Billing Account status
  const billRes = await fetch(
    `https://cloudbilling.googleapis.com/v1/projects/${projectId}/billingInfo`,
    { headers }
  );
  const billData = await billRes.json();
  const hasBilling = Boolean(billData?.billingEnabled);

  if (!hasBilling) {
    console.log('\n⚠️  ATTENZIONE: Fatturazione Google Cloud non ancora collegata a questo progetto.');
    console.log('Per usufruire della quota gratuita mensile (10.000 mappe e 10.000 ricerche gratis/mese):');
    console.log(`👉 Apri una volta nel browser: https://console.cloud.google.com/google/maps-apis/start?project=${projectId}`);
    console.log('   e accetta i Termini di Servizio Maps collegando il tuo account di fatturazione.\n');
  }

  // 2. Batch Enable Maps APIs
  console.log('⏳ Attivazione API Google Maps (Maps JS, Places API New, Geocoding)...');
  const enableRes = await fetch(
    `https://serviceusage.googleapis.com/v1/projects/${projectId}/services:batchEnable`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        serviceIds: [
          'maps-backend.googleapis.com',
          'places.googleapis.com',
          'geocoding-backend.googleapis.com'
        ]
      })
    }
  );

  const enableData = await enableRes.json();
  if (!enableRes.ok) {
    console.log(`ℹ️  Stato attivazione API: ${enableData?.error?.message || enableRes.statusText}`);
  } else {
    console.log('✅ API Google Maps abilitate con successo.');
  }

  // 3. Check or Create API Key via apikeys.googleapis.com
  console.log('🔑 Recupero/Creazione chiave API Google Maps...');
  let apiKey = '';

  try {
    const keysRes = await fetch(
      `https://apikeys.googleapis.com/v2/projects/${projectId}/locations/global/keys`,
      { headers }
    );
    if (keysRes.ok) {
      const keysData = await keysRes.json();
      const existing = (keysData.keys || []).find((k) =>
        k.displayName?.toLowerCase().includes('maps') || k.displayName?.toLowerCase().includes('tripwise')
      ) || (keysData.keys || [])[0];

      if (existing) {
        // Fetch key string
        const keyStringRes = await fetch(
          `https://apikeys.googleapis.com/v2/${existing.name}/keyString`,
          { headers }
        );
        if (keyStringRes.ok) {
          const keyStringData = await keyStringRes.json();
          apiKey = keyStringData.keyString || '';
        }
      }
    }
  } catch {
    // Proceed with fallback
  }

  // If not found via API, check existing VITE_FIREBASE_API_KEY in .env (as Firebase API keys can be used for Maps once enabled)
  if (!apiKey && existsSync('.env')) {
    const envContent = readFileSync('.env', 'utf8');
    const fbMatch = envContent.match(/VITE_FIREBASE_API_KEY=([^\r\n]+)/);
    if (fbMatch && fbMatch[1]) {
      apiKey = fbMatch[1].trim();
      console.log('ℹ️  Utilizzo della chiave Google Cloud principale del progetto.');
    }
  }

  if (apiKey) {
    let envContent = existsSync('.env') ? readFileSync('.env', 'utf8') : '';
    if (envContent.includes('VITE_GOOGLE_MAPS_API_KEY=')) {
      envContent = envContent.replace(/VITE_GOOGLE_MAPS_API_KEY=[^\r\n]*/, `VITE_GOOGLE_MAPS_API_KEY=${apiKey}`);
    } else {
      envContent = envContent.trim() + `\nVITE_GOOGLE_MAPS_API_KEY=${apiKey}\n`;
    }
    writeFileSync('.env', envContent, 'utf8');
    console.log('✅ VITE_GOOGLE_MAPS_API_KEY configurata correttamente in .env');
  } else {
    console.log('ℹ️  Puoi inserire manualmente la chiave in .env come: VITE_GOOGLE_MAPS_API_KEY=tua_chiave');
  }

  console.log('\n🎉 Configurazione completata! TripWise userà Google Maps con fallback automatico a OpenStreetMap.');
}

main().catch((err) => {
  console.error('❌ Errore imprevisto:', err);
  process.exit(1);
});
