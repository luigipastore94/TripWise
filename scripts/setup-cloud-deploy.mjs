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
  console.log('🚀 TripWise Cloud Sync & Deploy (Branch: main | Project: tripwise-sync-lp94)\n');

  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

  // 0. Ensure branch is 'main' and pull latest changes from origin/main
  console.log('📥 Allineamento repository sul branch "main"...');
  spawnSync('git', ['checkout', 'main'], { stdio: 'inherit', shell: process.platform === 'win32' });
  spawnSync('git', ['pull', '--ff-only', 'origin', 'main'], { stdio: 'inherit', shell: process.platform === 'win32' });

  // 1. Verify Google Account in Firebase CLI
  const cfgPath = join(homedir(), '.config', 'configstore', 'firebase-tools.json');
  if (!existsSync(cfgPath)) {
    console.log('🔐 Effettua l\'accesso con il tuo account Google per Firebase...');
    spawnSync(npxCmd, ['-y', 'firebase-tools@latest', 'login'], {
      stdio: 'inherit',
      shell: true
    });
  }

  // Refresh token & display active Google account
  const loginRes = spawnSync(npxCmd, ['-y', 'firebase-tools@latest', 'login:list'], {
    encoding: 'utf8',
    shell: true
  });
  if (loginRes.stdout) {
    console.log(`👤 ${loginRes.stdout.trim()}`);
  }

  // 2. Ensure local .env is populated for production build
  let envVars = parseEnvFile('.env');
  if (!envVars.VITE_FIREBASE_API_KEY && existsSync('.agents/skills/tripwise-firebase-provisioning/scripts/write-env.mjs')) {
    console.log('⚙️  Rigenerazione automatica .env dal progetto Firebase...');
    spawnSync('node', ['.agents/skills/tripwise-firebase-provisioning/scripts/write-env.mjs', PROJECT_ID], {
      stdio: 'inherit',
      shell: process.platform === 'win32'
    });
    if (existsSync('.agents/skills/tripwise-firebase-provisioning/scripts/provision-google-maps.mjs')) {
      spawnSync('node', ['.agents/skills/tripwise-firebase-provisioning/scripts/provision-google-maps.mjs', PROJECT_ID], {
        stdio: 'inherit',
        shell: process.platform === 'win32'
      });
    }
    envVars = parseEnvFile('.env');
  }

  // 3. Build & Deploy immediately to Firebase Production using the user's Google account
  console.log('\n🔨 Build di produzione TripWise in corso...');
  const buildRes = spawnSync(npmCmd, ['run', 'build'], {
    stdio: 'inherit',
    shell: true
  });
  if (buildRes.status === 0) {
    console.log('\n☁️  Deploy immediato su Firebase Hosting (https://tripwise-sync-lp94.web.app)...');
    spawnSync(npxCmd, ['-y', 'firebase-tools@latest', 'deploy', '--only', 'hosting,firestore:rules', '--project', PROJECT_ID], {
      stdio: 'inherit',
      shell: true
    });
  }

  // 4. Optional: Sync secrets to GitHub Actions if 'gh' CLI is installed
  const ghCheck = spawnSync('gh', ['--version'], { encoding: 'utf8', shell: process.platform === 'win32' });
  if (ghCheck.status === 0 && existsSync(cfgPath)) {
    console.log('\n🔗 Configurazione GitHub Actions per i futuri deploy automatici Cloud...');
    const expectedEnvKeys = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
      'VITE_GOOGLE_MAPS_API_KEY'
    ];
    for (const key of expectedEnvKeys) {
      if (envVars[key]) setGithubSecret(key, envVars[key]);
    }

    const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
    const accessToken = cfg?.tokens?.access_token;
    const refreshToken = cfg?.tokens?.refresh_token;

    if (refreshToken) {
      setGithubSecret('FIREBASE_TOKEN', refreshToken);
    }
    if (accessToken) {
      const saJson = await createOrFetchServiceAccountJson(accessToken);
      if (saJson) {
        setGithubSecret('FIREBASE_SERVICE_ACCOUNT', saJson);
      }
    }
    console.log('🎉 GitHub Actions collegato! Ogni futuro push su "main" andrà in deploy da solo.');
  }

  console.log('\n✅ Operazione completata! Produzione aggiornata su: https://tripwise-sync-lp94.web.app');
}

main().catch((err) => {
  console.error('❌ Errore:', err);
  process.exit(1);
});
