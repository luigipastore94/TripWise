import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function runFirebase(args, options = {}) {
  const cmd = `${npxCmd} -y firebase-tools@latest ${args}`;
  return spawnSync(cmd, {
    encoding: 'utf8',
    shell: true,
    stdio: options.inherit ? 'inherit' : 'pipe'
  });
}

function parseJsonOutput(raw) {
  if (!raw) return null;
  const trimmed = raw.trim();
  const idx = trimmed.indexOf('{');
  if (idx < 0) return null;
  try {
    return JSON.parse(trimmed.slice(idx));
  } catch {
    return null;
  }
}

console.log('====================================================');
console.log(' TripWise Cloud Setup — Google Account & Firebase');
console.log('====================================================\n');

// 1. Check Firebase CLI Google Account login
console.log('1. Verifica autenticazione account Google (Firebase CLI)...');
let loginProc = runFirebase('login:list --json');
let loginJson = parseJsonOutput(loginProc.stdout);
let activeEmail =
  loginJson?.result?.[0]?.user?.email ||
  loginJson?.user?.email ||
  (() => {
    const m = (loginProc.stdout || '').match(/Logged in as\s+([^\s]+)/i);
    return m ? m[1].trim() : null;
  })();

if (!activeEmail) {
  console.log('Nessun account Google attivo trovato. Avvio login interattivo...');
  runFirebase('login', { inherit: true });
  loginProc = runFirebase('login:list');
  const m = (loginProc.stdout || '').match(/Logged in as\s+([^\s]+)/i);
  activeEmail = m ? m[1].trim() : null;
}

if (!activeEmail) {
  console.error('✗ Impossibile verificare l’account Google su Firebase CLI.');
  process.exit(1);
}
console.log(`✓ Autenticato con account Google: ${activeEmail}\n`);

// 2. Resolve Firebase Project ID
let projectId = (process.argv[2] || '').trim();
if (!projectId && existsSync('.firebaserc')) {
  try {
    const rc = JSON.parse(readFileSync('.firebaserc', 'utf8'));
    projectId = (rc?.projects?.default || '').trim();
  } catch {
    // ignore
  }
}
if (!projectId && existsSync('.env')) {
  const m = readFileSync('.env', 'utf8').match(/^VITE_FIREBASE_PROJECT_ID=(.+)$/m);
  if (m) projectId = m[1].trim();
}
if (!projectId) {
  projectId = 'tripwise-sync-lp94';
}

console.log(`2. Selezione progetto Firebase attivo: ${projectId}...`);
const useProc = runFirebase(`use ${projectId}`);
if (useProc.status !== 0) {
  console.warn(`Avviso durante firebase use: ${(useProc.stderr || useProc.stdout || '').trim()}`);
} else {
  console.log(`✓ Progetto Firebase attivo: ${projectId}\n`);
}

// 3. Ensure Web & Android Apps exist and write .env + google-services.json
console.log('3. Verifica applicazioni Firebase (Web & Android) e sincronizzazione .env...');
const appsProc = runFirebase(`apps:list --project ${projectId} --json`);
const appsJson = parseJsonOutput(appsProc.stdout);
const appsList = Array.isArray(appsJson?.result) ? appsJson.result : [];

const hasWebApp = appsList.some((a) => a.platform === 'WEB');
if (!hasWebApp) {
  console.log('Creazione app Web "TripWise Web"...');
  runFirebase(`apps:create WEB "TripWise Web" --project ${projectId}`, { inherit: true });
}

if (existsSync('android/app')) {
  const hasAndroidApp = appsList.some((a) => a.platform === 'ANDROID');
  if (!hasAndroidApp) {
    console.log('Creazione app Android "TripWise Android" (com.tripwise.companion)...');
    runFirebase(
      `apps:create ANDROID "TripWise Android" --package-name com.tripwise.companion --project ${projectId}`,
      { inherit: true }
    );
  }
}

const writeEnvProc = spawnSync(
  `node .agents/skills/tripwise-firebase-provisioning/scripts/write-env.mjs ${projectId}`,
  { encoding: 'utf8', shell: true, stdio: 'inherit' }
);
if (writeEnvProc.status !== 0) {
  console.error('✗ Errore durante la generazione del file .env.');
  process.exit(1);
}
console.log('');

// 4. Sync firebase.json Google Sign-In provider config with active Google Account
console.log('4. Allineamento configurazione Google Sign-In in firebase.json...');
if (existsSync('firebase.json')) {
  try {
    const fbConfig = JSON.parse(readFileSync('firebase.json', 'utf8'));
    fbConfig.auth = fbConfig.auth || {};
    fbConfig.auth.providers = fbConfig.auth.providers || {};
    fbConfig.auth.providers.googleSignIn = {
      oAuthBrandDisplayName: 'TripWise',
      supportEmail: activeEmail,
      authorizedRedirectUris: [
        `https://${projectId}.firebaseapp.com/__/auth/handler`,
        `https://${projectId}.web.app/__/auth/handler`,
        'http://localhost:5173'
      ]
    };
    writeFileSync('firebase.json', JSON.stringify(fbConfig, null, 2) + '\n', 'utf8');
    console.log(`✓ Google Sign-In configurato per ${activeEmail}\n`);
  } catch (err) {
    console.warn('Avviso: impossibile aggiornare firebase.json:', err);
  }
}

// 5. Deploy Auth & Firestore Rules/Indexes
console.log('5. Deploy configurazione Auth e regole Cloud Firestore...');
const deployProc = runFirebase(
  `deploy --only auth,firestore:rules,firestore:indexes --project ${projectId}`,
  { inherit: true }
);
if (deployProc.status !== 0) {
  console.error('\n✗ Deploy parziale o non riuscito. Verifica i permessi del progetto Firebase.');
  process.exit(deployProc.status || 1);
}

console.log('\n====================================================');
console.log(' ✓ TripWise Cloud Setup completato con successo!');
console.log(`   • Account Google : ${activeEmail}`);
console.log(`   • Progetto Cloud : ${projectId}`);
console.log('   • File .env      : aggiornato (VITE_FIREBASE_*)');
if (existsSync('android/app/google-services.json')) {
  console.log('   • Android Config : android/app/google-services.json aggiornato');
}
console.log('====================================================');
