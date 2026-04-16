[CmdletBinding()]
param(
    [switch]$SkipMigrations
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = $PSScriptRoot
$backendDir = Join-Path $repoRoot 'backend'
$envScript = Join-Path $repoRoot 'backend\scripts\load-env.ps1'

. $envScript -RepoRoot $repoRoot

Set-Location $backendDir

if (-not $SkipMigrations) {
    Write-Host 'Applying database migrations before starting the worker...' -ForegroundColor Cyan
    cargo run -p blog-migrator
}

Write-Host 'Starting background worker' -ForegroundColor Green
cargo run -p blog-worker --bin worker
