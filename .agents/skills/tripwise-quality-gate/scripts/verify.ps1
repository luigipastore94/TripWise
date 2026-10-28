param(
  [switch]$SyncAndroid
)

$ErrorActionPreference = "Stop"

Write-Host "==> [1/3] TypeScript Static Analysis..." -ForegroundColor Cyan
npm run typecheck
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (Test-Path "tests/domain.test.mjs") {
  Write-Host "==> [2/3] Domain Logic Tests..." -ForegroundColor Cyan
  node tests/domain.test.mjs
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
  Write-Host "==> [2/3] Domain Logic Tests (skipped: no tests/domain.test.mjs)..." -ForegroundColor DarkGray
}

Write-Host "==> [3/3] Production Vite + PWA Build..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($SyncAndroid) {
  Write-Host "==> [4/4] Capacitor Android Sync..." -ForegroundColor Cyan
  npx.cmd cap sync android
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "[OK] TripWise Quality Gate PASSED." -ForegroundColor Green
