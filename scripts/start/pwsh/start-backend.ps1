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
    Write-Host 'Applying database migrations before starting the API...' -ForegroundColor Cyan
    cargo run -p blog-migrator
}

Write-Host 'Starting backend API on http://localhost:3000' -ForegroundColor Green
cargo run -p blog-api --bin api
