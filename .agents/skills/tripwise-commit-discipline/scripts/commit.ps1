[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("feat", "fix", "chore", "refactor", "perf", "test", "build", "ci", "docs", "style")]
  [string]$Type,

  [Parameter(Mandatory = $false)]
  [string]$Scope = "",

  [Parameter(Mandatory = $true)]
  [string]$Message,

  [Parameter(Mandatory = $false)]
  [string[]]$Files,

  [switch]$All,

  [switch]$SkipQualityGate,

  [switch]$SyncAndroid
)

$ErrorActionPreference = "Stop"

Write-Host "==> [TripWise Commit Discipline] Starting commit workflow..." -ForegroundColor Cyan

# 1. Run Quality Gate unless skipped
if (-not $SkipQualityGate) {
  Write-Host "==> [1/4] Running Quality Gate verification..." -ForegroundColor Yellow
  $verifyScript = Join-Path $PSScriptRoot "../../tripwise-quality-gate/scripts/verify.ps1"
  if (Test-Path $verifyScript) {
    if ($SyncAndroid) {
      powershell -ExecutionPolicy Bypass -File $verifyScript -SyncAndroid
    } else {
      powershell -ExecutionPolicy Bypass -File $verifyScript
    }
    if ($LASTEXITCODE -ne 0) {
      Write-Error "Quality Gate failed. Commit aborted to prevent committing broken code."
      exit $LASTEXITCODE
    }
  } else {
    Write-Warning "Quality Gate script not found at $verifyScript. Falling back to npm run typecheck..."
    npm run typecheck
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }
} else {
  Write-Host "==> [1/4] Quality Gate skipped as requested." -ForegroundColor DarkGray
}

# 2. Stage files
Write-Host "==> [2/4] Preparing Git staging area..." -ForegroundColor Yellow
if ($Files -and $Files.Count -gt 0) {
  foreach ($f in $Files) {
    git add $f
  }
} elseif ($All) {
  git add -u
}

# 3. Security & Safety Check: Ensure no sensitive files are staged
Write-Host "==> [3/4] Checking staged files and security rules..." -ForegroundColor Yellow
$stagedFiles = git diff --name-only --cached
if (-not $stagedFiles) {
  Write-Error "No staged changes found to commit. Stage your files with 'git add <files>' or pass -Files / -All."
  exit 1
}

$forbiddenPatterns = @("*.env", "*.env.local", "*secret*", "*credentials*", "*id_rsa*", "*google-services.json")
foreach ($forbidden in $forbiddenPatterns) {
  $foundForbidden = $stagedFiles | Where-Object { $_ -like $forbidden -and $_ -notlike "*.example" -and $_ -notlike "*.sample" }
  if ($foundForbidden) {
    Write-Error "SECURITY ALERT: Detected sensitive file staged for commit: $($foundForbidden -join ', '). Commit aborted!"
    exit 1
  }
}

# 4. Formulate Conventional Commit message
$scopePrefix = if ($Scope -and $Scope.Trim() -ne "") { "($($Scope.Trim()))" } else { "" }
$fullCommitMsg = "$Type$scopePrefix`: $Message"

Write-Host "==> [4/4] Executing Git commit: '$fullCommitMsg'..." -ForegroundColor Cyan
git commit -m $fullCommitMsg
if ($LASTEXITCODE -ne 0) {
  Write-Error "Git commit failed."
  exit $LASTEXITCODE
}

Write-Host "`n[OK] Commit created successfully!" -ForegroundColor Green
git log -1 --stat
