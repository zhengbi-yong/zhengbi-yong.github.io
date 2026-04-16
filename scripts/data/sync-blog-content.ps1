[CmdletBinding()]
param(
    [string]$ApiBaseUrl = 'http://127.0.0.1:3000',
    [switch]$Force
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$healthUrl = "$ApiBaseUrl/healthz"
$postsUrl = "$ApiBaseUrl/api/v1/posts?limit=1"
$syncUrl = "$ApiBaseUrl/api/v1/sync/mdx/public"

function Wait-ForBackend {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url,
        [int]$TimeoutSeconds = 90
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)

    while ((Get-Date) -lt $deadline) {
        try {
            Invoke-RestMethod -Uri $Url -Method Get | Out-Null
            return
        } catch {
            Start-Sleep -Seconds 2
        }
    }

    throw "Backend did not become healthy within $TimeoutSeconds seconds: $Url"
}

Wait-ForBackend -Url $healthUrl

$existing = Invoke-RestMethod -Uri $postsUrl -Method Get
$existingTotal = 0

if ($null -ne $existing.total) {
    $existingTotal = [int]$existing.total
} elseif ($null -ne $existing.posts) {
    $existingTotal = @($existing.posts).Count
}

if (-not $Force -and $existingTotal -gt 0) {
    Write-Host "Backend already has $existingTotal post(s); skipping blog sync." -ForegroundColor Yellow
    return
}

$payload = @{
    force = [bool]$Force
} | ConvertTo-Json -Depth 2

$result = Invoke-RestMethod -Uri $syncUrl -Method Post -ContentType 'application/json' -Body $payload

Write-Host 'Blog content sync completed.' -ForegroundColor Green
Write-Host "  total: $($result.total)" -ForegroundColor DarkGray
Write-Host "  created: $($result.created)" -ForegroundColor DarkGray
Write-Host "  updated: $($result.updated)" -ForegroundColor DarkGray
Write-Host "  unchanged: $($result.unchanged)" -ForegroundColor DarkGray
Write-Host "  failed: $($result.failed)" -ForegroundColor DarkGray

if ($result.failed -gt 0) {
    throw "Blog content sync reported $($result.failed) failures."
}
