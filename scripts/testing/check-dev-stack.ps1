[CmdletBinding()]
param(
    [int]$TimeoutSeconds = 60
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = $PSScriptRoot
$composeFile = Join-Path $repoRoot 'deployments/docker/compose-files/dev/docker-compose.yml'
$logDir = Join-Path $repoRoot '.sisyphus\logs'
$pollCount = [Math]::Max([int][Math]::Ceiling($TimeoutSeconds / 2), 1)

function Test-HttpEndpoint {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url
    )

    & curl.exe --fail --silent $Url *> $null
    return ($LASTEXITCODE -eq 0)
}

function Wait-HttpEndpoint {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url
    )

    for ($i = 0; $i -lt $pollCount; $i++) {
        if (Test-HttpEndpoint -Url $Url) {
            return $true
        }

        Start-Sleep -Seconds 2
    }

    return $false
}

function Write-ServiceStatus {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [bool]$Healthy,
        [string]$Details = ''
    )

    $color = if ($Healthy) { 'Green' } else { 'Red' }
    $label = if ($Healthy) { 'OK' } else { 'FAIL' }
    $suffix = if ([string]::IsNullOrWhiteSpace($Details)) { '' } else { " - $Details" }
    Write-Host "[$label] $Name$suffix" -ForegroundColor $color
}

Write-Host 'Checking development stack...' -ForegroundColor Cyan

$frontendHealthy = Wait-HttpEndpoint -Url 'http://127.0.0.1:3001'
$backendHealthy = Wait-HttpEndpoint -Url 'http://127.0.0.1:3000/healthz'
$workerProcess = Get-Process worker -ErrorAction SilentlyContinue

Write-ServiceStatus -Name 'Frontend (http://127.0.0.1:3001)' -Healthy $frontendHealthy
Write-ServiceStatus -Name 'Backend (http://127.0.0.1:3000/healthz)' -Healthy $backendHealthy
Write-ServiceStatus -Name 'Worker process' -Healthy ($null -ne $workerProcess)

Write-Host ''
Write-Host 'Infrastructure:' -ForegroundColor Cyan
docker compose -f $composeFile ps

if (Test-Path $logDir) {
    Write-Host ''
    Write-Host "Detached logs: $logDir" -ForegroundColor Cyan
    Get-ChildItem $logDir -File | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
}

$overallHealthy = $frontendHealthy -and $backendHealthy -and ($null -ne $workerProcess)
if (-not $overallHealthy) {
    exit 1
}
