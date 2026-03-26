[CmdletBinding()]
param(
    [int]$TimeoutSeconds = 60,
    [switch]$SkipMigrations
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$backendDir = Join-Path $repoRoot 'backend'
$envScript = Join-Path $repoRoot 'backend\scripts\load-env.ps1'
$backendEntry = Join-Path $repoRoot 'start-backend.ps1'
$runId = [guid]::NewGuid().ToString('N')
$stdoutLog = Join-Path $repoRoot "backend-smoke-$runId.stdout.log"
$stderrLog = Join-Path $repoRoot "backend-smoke-$runId.stderr.log"
$pollCount = [Math]::Max([int][Math]::Ceiling($TimeoutSeconds / 2), 1)

function Remove-LogIfPresent {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (Test-Path $Path) {
        Remove-Item $Path -Force -ErrorAction SilentlyContinue
    }
}

. $envScript -RepoRoot $repoRoot

Set-Location $backendDir
if (-not $SkipMigrations) {
    cargo run -p blog-migrator
}

$arguments = @(
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    $backendEntry,
    '-SkipMigrations'
)

$proc = Start-Process -FilePath 'powershell.exe' `
    -ArgumentList $arguments `
    -WorkingDirectory $repoRoot `
    -PassThru `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog

try {
    $healthy = $false

    for ($i = 0; $i -lt $pollCount; $i++) {
        Start-Sleep -Seconds 2
        & curl.exe --fail --silent http://127.0.0.1:3000/healthz *> $null
        if ($LASTEXITCODE -eq 0) {
            $healthy = $true
            break
        }
    }

    if (-not $healthy) {
        Write-Host 'Backend smoke test failed.' -ForegroundColor Red
        if (Test-Path $stdoutLog) {
            Write-Host '--- stdout ---'
            Get-Content $stdoutLog -Tail 120
        }
        if (Test-Path $stderrLog) {
            Write-Host '--- stderr ---'
            Get-Content $stderrLog -Tail 120
        }
        exit 1
    }

    Write-Host 'Backend smoke test passed.' -ForegroundColor Green
}
finally {
    if ($proc -and -not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }

    Get-Process api, cargo -ErrorAction SilentlyContinue |
        Stop-Process -Force -ErrorAction SilentlyContinue

    Start-Sleep -Seconds 1
    Remove-LogIfPresent -Path $stdoutLog
    Remove-LogIfPresent -Path $stderrLog
}
