[CmdletBinding()]
param(
    [string]$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$envFile = Join-Path $RepoRoot '.env'
$defaultUploadsPath = Join-Path $RepoRoot 'backend\uploads'

function Import-DotEnv {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Path
    )

    if (-not (Test-Path $Path)) {
        return
    }

    Write-Host "Loading environment variables from $Path" -ForegroundColor Cyan

    foreach ($rawLine in Get-Content $Path) {
        $line = $rawLine.Trim()
        if ($line.Length -eq 0 -or $line.StartsWith('#') -or -not $line.Contains('=')) {
            continue
        }

        $separatorIndex = $line.IndexOf('=')
        if ($separatorIndex -le 0) {
            continue
        }

        $name = $line.Substring(0, $separatorIndex).Trim()
        $value = $line.Substring($separatorIndex + 1).Trim()

        if (
            ($value.StartsWith('"') -and $value.EndsWith('"')) -or
            ($value.StartsWith("'") -and $value.EndsWith("'"))
        ) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
}

function Set-DefaultEnv {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Name,
        [Parameter(Mandatory = $true)]
        [string]$Value
    )

    $existingValue = [Environment]::GetEnvironmentVariable($Name, 'Process')
    if ([string]::IsNullOrWhiteSpace($existingValue)) {
        [Environment]::SetEnvironmentVariable($Name, $Value, 'Process')
    }
}

Import-DotEnv -Path $envFile

Set-DefaultEnv -Name 'DATABASE_URL' -Value 'postgresql://blog_user:blog_password@localhost:5432/blog_db'
Set-DefaultEnv -Name 'REDIS_URL' -Value 'redis://localhost:6379'
Set-DefaultEnv -Name 'JWT_SECRET' -Value 'dev-secret-key-for-testing-only-change-me'
Set-DefaultEnv -Name 'PASSWORD_PEPPER' -Value 'dev-password-pepper-for-testing-only-change-me'
Set-DefaultEnv -Name 'SESSION_SECRET' -Value 'dev-session-secret-for-testing-only-change-me'
Set-DefaultEnv -Name 'RUST_LOG' -Value 'debug'
Set-DefaultEnv -Name 'CORS_ALLOWED_ORIGINS' -Value 'http://localhost:3001'
Set-DefaultEnv -Name 'ENVIRONMENT' -Value 'development'
Set-DefaultEnv -Name 'SERVER_HOST' -Value '0.0.0.0'
Set-DefaultEnv -Name 'SERVER_PORT' -Value '3000'

Set-DefaultEnv -Name 'SMTP_HOST' -Value 'localhost'
Set-DefaultEnv -Name 'SMTP_PORT' -Value '587'
Set-DefaultEnv -Name 'SMTP_USERNAME' -Value 'dev'
Set-DefaultEnv -Name 'SMTP_PASSWORD' -Value 'dev'
Set-DefaultEnv -Name 'SMTP_FROM' -Value 'noreply@localhost'
Set-DefaultEnv -Name 'SMTP_TLS' -Value 'false'

Set-DefaultEnv -Name 'STORAGE_BACKEND' -Value 'local'
Set-DefaultEnv -Name 'STORAGE_LOCAL_PATH' -Value $defaultUploadsPath
Set-DefaultEnv -Name 'STORAGE_LOCAL_URL' -Value '/uploads'

Set-DefaultEnv -Name 'MINIO_ENDPOINT' -Value 'http://localhost:9000'
Set-DefaultEnv -Name 'MINIO_PUBLIC_URL' -Value 'http://localhost:9000'
Set-DefaultEnv -Name 'MINIO_ACCESS_KEY' -Value 'minioadmin'
Set-DefaultEnv -Name 'MINIO_SECRET_KEY' -Value 'minioadmin123'
Set-DefaultEnv -Name 'MINIO_BUCKET' -Value 'blog-uploads'
Set-DefaultEnv -Name 'MINIO_REGION' -Value 'us-east-1'

Set-DefaultEnv -Name 'MEILISEARCH_URL' -Value 'http://localhost:7700'
Set-DefaultEnv -Name 'MEILISEARCH_MASTER_KEY' -Value 'dev-meilisearch-master-key-change-me'
Set-DefaultEnv -Name 'MEILISEARCH_INDEX' -Value 'posts'
Set-DefaultEnv -Name 'MEILISEARCH_AUTO_SYNC' -Value 'false'

Set-DefaultEnv -Name 'RATE_LIMIT_FAILURE_MODE' -Value 'fail_open'

Write-Host 'Backend development environment variables are ready.' -ForegroundColor Green
