$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$entryScript = Join-Path $repoRoot 'start-backend.ps1'

& $entryScript
