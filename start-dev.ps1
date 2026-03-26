[CmdletBinding()]
param(
    [ValidateSet('full', 'backend', 'frontend', 'worker', 'infra')]
    [string]$Mode = 'full',
    [switch]$NoInfra,
    [switch]$IncludeWorker,
    [switch]$Detached
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = $PSScriptRoot
$composeFile = Join-Path $repoRoot 'docker-compose.dev.yml'
$backendScript = Join-Path $repoRoot 'start-backend.ps1'
$frontendScript = Join-Path $repoRoot 'start-frontend.ps1'
$workerScript = Join-Path $repoRoot 'start-worker.ps1'
$blogSyncScript = Join-Path $repoRoot 'sync-blog-content.ps1'
$logDir = Join-Path $repoRoot '.sisyphus\logs'

function Ensure-LogDirectory {
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
}

function Start-NewPowerShellScript {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ScriptPath
    )

    Start-Process -FilePath 'powershell.exe' -ArgumentList @(
        '-NoExit',
        '-ExecutionPolicy',
        'Bypass',
        '-File',
        $ScriptPath
    ) | Out-Null
}

function Start-DetachedPowerShellScript {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [string]$ScriptPath
    )

    Ensure-LogDirectory

    $stdoutLog = Join-Path $logDir "$Name.stdout.log"
    $stderrLog = Join-Path $logDir "$Name.stderr.log"

    foreach ($logFile in @($stdoutLog, $stderrLog)) {
        if (Test-Path $logFile) {
            Remove-Item $logFile -Force -ErrorAction SilentlyContinue
        }
    }

    $process = Start-Process -FilePath 'powershell.exe' `
        -ArgumentList @(
            '-ExecutionPolicy',
            'Bypass',
            '-File',
            $ScriptPath
        ) `
        -WorkingDirectory $repoRoot `
        -PassThru `
        -RedirectStandardOutput $stdoutLog `
        -RedirectStandardError $stderrLog

    Write-Host "Started $Name in the background (PID: $($process.Id))." -ForegroundColor Green
    Write-Host "  stdout: $stdoutLog" -ForegroundColor DarkGray
    Write-Host "  stderr: $stderrLog" -ForegroundColor DarkGray
}

function Invoke-ModeScript {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [string]$ScriptPath
    )

    if ($Detached) {
        Start-DetachedPowerShellScript -Name $Name -ScriptPath $ScriptPath
    } else {
        & $ScriptPath
    }
}

function Invoke-BlogSyncIfNeeded {
    if (-not (Test-Path $blogSyncScript)) {
        return
    }

    Write-Host 'Syncing blog content into the database when the post table is empty...' -ForegroundColor Cyan
    powershell.exe -ExecutionPolicy Bypass -File $blogSyncScript
}

if (-not $NoInfra) {
    Write-Host 'Starting shared development infrastructure...' -ForegroundColor Cyan
    docker compose -f $composeFile up -d
}

switch ($Mode) {
    'infra' {
        Write-Host 'Shared infrastructure is ready.' -ForegroundColor Green
        break
    }
    'backend' {
        Invoke-ModeScript -Name 'backend' -ScriptPath $backendScript
        if ($Detached) {
            Invoke-BlogSyncIfNeeded
        }
        break
    }
    'frontend' {
        Invoke-ModeScript -Name 'frontend' -ScriptPath $frontendScript
        break
    }
    'worker' {
        Invoke-ModeScript -Name 'worker' -ScriptPath $workerScript
        break
    }
    'full' {
        if ($Detached) {
            Write-Host 'Starting the development stack in detached mode...' -ForegroundColor Cyan
            Start-DetachedPowerShellScript -Name 'backend' -ScriptPath $backendScript

            if ($IncludeWorker) {
                Start-DetachedPowerShellScript -Name 'worker' -ScriptPath $workerScript
            }

            Invoke-BlogSyncIfNeeded
            Start-DetachedPowerShellScript -Name 'frontend' -ScriptPath $frontendScript
            Write-Host "Detached logs are under $logDir" -ForegroundColor Green
            break
        }

        Write-Host 'Opening the backend in a new PowerShell window...' -ForegroundColor Cyan
        Start-NewPowerShellScript -ScriptPath $backendScript

        if ($IncludeWorker) {
            Write-Host 'Opening the worker in a new PowerShell window...' -ForegroundColor Cyan
            Start-NewPowerShellScript -ScriptPath $workerScript
        }

        Invoke-BlogSyncIfNeeded
        Write-Host 'Starting the frontend in the current window...' -ForegroundColor Cyan
        & $frontendScript
        break
    }
}
