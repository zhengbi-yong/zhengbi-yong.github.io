[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$repoRoot = $PSScriptRoot
$frontendDir = Join-Path $repoRoot 'frontend'

Write-Host 'Starting frontend dev server on http://localhost:3001' -ForegroundColor Green
Set-Location $frontendDir

pnpm dev
