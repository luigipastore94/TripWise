import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

const PROJECT_ID = 'tripwise-sync-lp94';
const REPO = 'luigipastore94/TripWise';

function setGithubSecret(name, value) {
  if (!value || !String(value).trim()) return false;
  const res = spawnSync('gh', ['secret', 'set', name, '--repo', REPO], {
    input: String(value).trim(),
    encoding: 'utf8',
    shell: process.platform === 'win32'
  });
  if (res.status !== 0) {
    console.error(`❌ Errore durante il salvataggio del secret ${name}:`, res.stderr || res.stdout);
    return false;
  }
  console.log(`✅ Secret ${name} sincronizzato su GitHub (${REPO})`);
  return true;
}

function parseEnvFile(filePath) {
  const vars = {};
  if (!existsSync(filePath)) return vars;
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && val) vars[key] = val;
  }
  return vars;
}

async function createOrFetchServiceAccountJson(accessToken) {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  // Ensure IAM API is enabled
  await fetch(
    `https://serviceusage.googleapis.com/v1/projects/${PROJECT_ID}/services:batchEnable`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        serviceIds: ['iam.googleapis.com', 'cloudresourcemanager.googleapis.com', 'firebasehosting.googleapis.com']
      })
    }
  ).catch(() => {});

  const saId = 'github-actions-deployer';
  const saEmail = `${saId}@${PROJECT_ID}.iam.gserviceaccount.com`;

  // 1. Create Service Account if not existing
  await fetch(`https://iam.googleapis.com/v1/projects/${PROJECT_ID}/serviceAccounts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      accountId: saId,
      serviceAccount: {
        displayName: 'TripWise GitHub Actions Deployer'
      }
    })
  }).catch(() => {});

  // 2. Bind Firebase Hosting Admin & Service Usage Consumer roles
  const policyRes = await fetch(
    `https://cloudresourcemanager.googleapis.com/v1/projects/${PROJECT_ID}:getIamPolicy`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    }
  );

  if (policyRes.ok) {
    const policy = await policyRes.json();
    const bindings = policy.bindings || [];
    const rolesToEnsure = [
      'roles/firebasehosting.admin',
      'roles/firebase.viewer',
      'roles/serviceusage.apiKeysViewer'
    ];
    const member = `serviceAccount:${saEmail}`;

    for (const role of rolesToEnsure) {
      let binding = bindings.find((b) => b.role === role);
      if (!binding) {
        binding = { role, members: [] };
        bindings.push(binding);
      }
      if (!binding.members.includes(member)) {
        binding.members.push(member);
      }
    }

    await fetch(`https://cloudresourcemanager.googleapis.com/v1/projects/${PROJECT_ID}:setIamPolicy`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ policy: { ...policy, bindings } })
    });
  }

  // 3. Create JSON key for Service Account
  const keyRes = await fetch(
    `https://iam.googleapis.com/v1/projects/${PROJECT_ID}/serviceAccounts/${encodeURIComponent(saEmail)}/keys`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        privateKeyType: 'TYPE_GOOGLE_CREDENTIALS_FILE',
        keyAlgorithm: 'KEY_ALG_RSA_2048'
      })
    }
  );

  if (!keyRes.ok) {
    return null;
  }

  const keyData = await keyRes.json();
  if (!keyData?.privateKeyData) return null;
  return Buffer.from(keyData.privateKeyData, 'base64').toString('utf8');
}

async function main() {
  console.log('🚀 Configurazione Cloud CI/CD per TripWise (GitHub Actions -> Firebase Hosting)...\n');

  // 1. Read .env variables
  const envVars = parseEnvFile('.env');
  const expectedEnvKeys = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_GOOGLE_MAPS_API_KEY'
  ];

  let syncedEnvCount = 0;
  for (const key of expectedEnvKeys) {
    if (envVars[key]) {
      if (setGithubSecret(key, envVars[key])) {
        syncedEnvCount++;
      }
    }
  }

  if (syncedEnvCount === 0) {
    console.warn('⚠️  Nessun file .env trovato o variabili VITE_* mancanti. Rigenerazione automatica da Firebase...');
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    spawnSync(npxCmd, ['-y', 'firebase-tools@latest', 'apps:sdkconfig', 'WEB', '--project', PROJECT_ID], {
      stdio: 'inherit',
      shell: true
    });
  }

  // 2. Read Firebase CLI credentials from ~/.config/configstore/firebase-tools.json
  const cfgPath = join(homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (!existsSync(cfgPath)) {
    console.error('❌ Sessione Firebase CLI non trovata. Esegui prima: npx firebase-tools login');
    process.exit(1);
  }

  // Ensure access_token is fresh by invoking a lightweight firebase command
  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  spawnSync(`${npxCmd} -y firebase-tools@latest projects:list --json`, {
    encoding: 'utf8',
    shell: true
  });

  const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
  const accessToken = cfg?.tokens?.access_token;
  const refreshToken = cfg?.tokens?.refresh_token;

  if (refreshToken) {
    setGithubSecret('FIREBASE_TOKEN', refreshToken);
  }

  if (accessToken) {
    console.log('⏳ Creazione Service Account automatico per il deploy da GitHub Actions...');
    const saJson = await createOrFetchServiceAccountJson(accessToken);
    if (saJson) {
      setGithubSecret('FIREBASE_SERVICE_ACCOUNT', saJson);
    }
  }

  console.log('\n▶️  Avvio immediato del primo deploy Cloud su GitHub Actions...');
  spawnSync('gh', ['workflow', 'run', 'deploy-prod.yml', '--repo', REPO], {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  console.log('\n🎉 Fatto! Da questo momento ogni push su "main" farà build e deploy automatico in Cloud.');
}

main().catch((err) => {
  console.error('❌ Errore:', err);
  process.exit(1);
});
