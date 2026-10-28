import { spawnSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';

const projectId = process.argv[2];
if (!projectId) {
  console.error('Usage: node write-env.mjs <FIREBASE_PROJECT_ID>');
  process.exit(1);
}

const proc = spawnSync(
  `npx.cmd -y firebase-tools@latest apps:sdkconfig WEB --project ${projectId} --json`,
  { encoding: 'utf8', shell: true }
);

const raw = (proc.stdout || '').trim();
if (!raw) {
  console.error('Failed to retrieve Firebase Web SDK config:', proc.stderr || proc.status);
  process.exit(1);
}

const jsonStart = raw.indexOf('{');
const parsed = JSON.parse(jsonStart >= 0 ? raw.slice(jsonStart) : raw);
const cfg = parsed?.result?.sdkConfig;
if (!cfg?.apiKey || !cfg?.projectId) {
  console.error('Could not retrieve Firebase Web SDK config.');
  process.exit(1);
}

const envLines = [
  `VITE_FIREBASE_API_KEY=${cfg.apiKey}`,
  `VITE_FIREBASE_AUTH_DOMAIN=${cfg.authDomain || `${cfg.projectId}.firebaseapp.com`}`,
  `VITE_FIREBASE_PROJECT_ID=${cfg.projectId}`,
  `VITE_FIREBASE_STORAGE_BUCKET=${cfg.storageBucket || ''}`,
  `VITE_FIREBASE_MESSAGING_SENDER_ID=${cfg.messagingSenderId || ''}`,
  `VITE_FIREBASE_APP_ID=${cfg.appId || ''}`
];

writeFileSync('.env', envLines.join('\n') + '\n', 'utf8');
console.log(`✓ Wrote .env for Firebase project "${cfg.projectId}"`);

if (existsSync('android/app')) {
  const androidProc = spawnSync(
    `npx.cmd -y firebase-tools@latest apps:sdkconfig ANDROID --project ${projectId} --json`,
    { encoding: 'utf8', shell: true }
  );
  const aRaw = (androidProc.stdout || '').trim();
  const aStart = aRaw.indexOf('{');
  if (aStart >= 0) {
    try {
      const aParsed = JSON.parse(aRaw.slice(aStart));
      const contents = aParsed?.result?.fileContents;
      if (contents) {
        writeFileSync('android/app/google-services.json', contents, 'utf8');
        console.log('✓ Wrote android/app/google-services.json');
      }
    } catch {
      // Optional Android config skipped
    }
  }
}
