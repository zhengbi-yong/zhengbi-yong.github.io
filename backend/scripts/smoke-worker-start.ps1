[CmdletBinding()]
param(
    [int]$TimeoutSeconds = 45,
    [switch]$SkipMigrations
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$backendDir = Join-Path $repoRoot 'backend'
$envScript = Join-Path $repoRoot 'backend\scripts\load-env.ps1'
$workerEntry = Join-Path $repoRoot 'start-worker.ps1'
$runId = [guid]::NewGuid().ToString('N')
$stdoutLog = Join-Path $repoRoot "worker-smoke-$runId.stdout.log"
$stderrLog = Join-Path $repoRoot "worker-smoke-$runId.stderr.log"
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
    $workerEntry,
    '-SkipMigrations'
)

$proc = Start-Process -FilePath 'powershell.exe' `
    -ArgumentList $arguments `
    -WorkingDirectory $repoRoot `
    -PassThru `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog

try {
    $ready = $false

    for ($i = 0; $i -lt $pollCount; $i++) {
        Start-Sleep -Seconds 2

        $stdoutContent = if (Test-Path $stdoutLog) { Get-Content $stdoutLog -Raw } else { '' }
        $stderrContent = if (Test-Path $stderrLog) { Get-Content $stderrLog -Raw } else { '' }
        $combined = "$stdoutContent`n$stderrContent"

        if ($combined -match 'Worker ready' -or $combined -match 'Starting Blog Worker') {
            $ready = $true
            break
        }
    }

    if (-not $ready) {
        Write-Host 'Worker smoke test failed.' -ForegroundColor Red
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

    Write-Host 'Worker smoke test passed.' -ForegroundColor Green
}
finally {
    if ($proc -and -not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }

    Get-Process worker, cargo -ErrorAction SilentlyContinue |
        Stop-Process -Force -ErrorAction SilentlyContinue

    Start-Sleep -Seconds 1
    Remove-LogIfPresent -Path $stdoutLog
    Remove-LogIfPresent -Path $stderrLog
}
